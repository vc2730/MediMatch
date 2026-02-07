/**
 * MediMatch Integration Example
 * Complete example showing how to use the matching system
 */

import { getUserProfile, createMatch, createNotification } from '../services/database';
import { findMatchesForPatient, getMatchQuality } from '../services/matching';
import { triggerMatchWorkflow } from '../services/flowgladIntegration';

/**
 * Complete flow: Find matches and create a match
 * This is what you'd call from your frontend when a patient requests matches
 */
export const runCompleteMatchingFlow = async (patientId) => {
  try {
    console.log('🔍 Starting matching flow for patient:', patientId);

    // Step 1: Get patient data
    const patient = await getUserProfile(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    console.log('✅ Patient loaded:', patient.fullName);

    // Step 2: Find best matches using equity-aware algorithm
    const matches = await findMatchesForPatient(patient, 5);

    if (matches.length === 0) {
      console.log('❌ No matches found');
      return {
        success: false,
        message: 'No available appointments found for your specialty. We\'ll notify you when slots open up.'
      };
    }

    console.log(`✅ Found ${matches.length} potential matches`);

    // Step 3: Present matches to patient (return to UI)
    const matchesForUI = matches.map(match => {
      const quality = getMatchQuality(
        match.scores.totalMatchScore,
        match.scores.priorityTier
      );

      return {
        appointmentId: match.appointmentId,
        doctor: {
          name: match.appointment.doctorName,
          clinic: match.appointment.clinicName,
          specialty: match.appointment.specialty
        },
        appointment: {
          date: match.appointment.date,
          time: match.appointment.time,
          address: match.appointment.address
        },
        matching: {
          score: match.scores.totalMatchScore,
          priorityTier: match.scores.priorityTier,
          quality: quality.label,
          reasoning: match.scores.reasoningExplanation
        },
        insurance: match.appointment.insuranceAccepted,
        accessibility: {
          wheelchairAccessible: match.appointment.wheelchairAccessible,
          publicTransit: match.appointment.publicTransitNearby,
          languages: match.appointment.languagesOffered
        }
      };
    });

    return {
      success: true,
      patient: {
        id: patient.id,
        name: patient.fullName,
        waitDays: patient.waitTimeDays,
        urgency: patient.aiUrgencyScore || patient.urgencyLevel
      },
      matches: matchesForUI
    };
  } catch (error) {
    console.error('❌ Error in matching flow:', error);
    throw error;
  }
};

/**
 * Patient accepts a match
 * Creates the match in the database and triggers notifications
 */
export const acceptMatch = async (patientId, matchData) => {
  try {
    console.log('✅ Patient accepting match:', matchData.appointmentId);

    // Get full patient and appointment data
    const patient = await getUserProfile(patientId);

    // Create match in database
    const matchId = await createMatch(
      patientId,
      matchData.appointmentId,
      matchData.scores
    );

    console.log('✅ Match created:', matchId);

    // Create notification for patient
    await createNotification(patientId, {
      type: 'match_found',
      title: '🎉 Appointment Confirmed!',
      message: `Your appointment with ${matchData.appointment.doctorName} at ${matchData.appointment.clinicName} is confirmed for ${matchData.appointment.time}`,
      priority: matchData.scores.priorityTier <= 2 ? 'high' : 'medium',
      relatedMatchId: matchId,
      relatedAppointmentId: matchData.appointmentId,
      actionRequired: false
    });

    // Create notification for doctor
    await createNotification(matchData.appointment.doctorId, {
      type: 'match_found',
      title: '👤 New Patient Match',
      message: `Patient ${patient.fullName} has been matched to your ${matchData.appointment.time} appointment`,
      priority: 'medium',
      relatedMatchId: matchId,
      relatedAppointmentId: matchData.appointmentId,
      actionRequired: true,
      actionUrl: `/doctor/matches/${matchId}`
    });

    console.log('✅ Notifications created');

    // Trigger FlowGlad workflow (Person 3's integration)
    try {
      const workflowId = await triggerMatchWorkflow(matchId, {
        ...matchData.scores,
        patientId,
        appointmentId: matchData.appointmentId,
        doctorId: matchData.appointment.doctorId
      });
      console.log('✅ FlowGlad workflow triggered:', workflowId);
    } catch (workflowError) {
      // Don't fail the whole match if workflow fails
      console.error('⚠️ FlowGlad workflow failed (non-critical):', workflowError);
    }

    return {
      success: true,
      matchId,
      message: 'Match confirmed successfully!',
      nextSteps: [
        'You will receive a confirmation email',
        'Add the appointment to your calendar',
        'Prepare any medical records to bring'
      ]
    };
  } catch (error) {
    console.error('❌ Error accepting match:', error);
    throw error;
  }
};

/**
 * Patient rejects a match
 * Removes from their recommendations and optionally finds more
 */
export const rejectMatch = async (patientId, appointmentId, reason = null) => {
  try {
    console.log('❌ Patient rejecting match:', appointmentId);

    // Log rejection reason for analytics
    console.log('Rejection reason:', reason);

    // You could store rejections to improve future matching
    // For now, just continue to show other matches

    return {
      success: true,
      message: 'We\'ll show you other options'
    };
  } catch (error) {
    console.error('❌ Error rejecting match:', error);
    throw error;
  }
};

/**
 * Run matching for all waiting patients (batch process)
 * This could be triggered periodically or when new appointments are added
 */
export const batchMatchPatients = async () => {
  try {
    console.log('🔄 Starting batch patient matching...');

    const { getAllPatients } = await import('../services/database');
    const { batchProcessMatches } = await import('../services/matching');

    // Get all patients waiting for matches
    const allPatients = await getAllPatients();
    const waitingPatients = allPatients.filter(p =>
      !p.lastMatchedAt || p.waitTimeDays > 7
    );

    console.log(`Found ${waitingPatients.length} patients waiting for matches`);

    // Process matches in batch
    const results = await batchProcessMatches(waitingPatients, 3);

    // Create notifications for patients with good matches
    for (const result of results) {
      if (result.matches.length > 0) {
        const topMatch = result.matches[0];

        if (topMatch.scores.totalMatchScore >= 60) {
          await createNotification(result.patientId, {
            type: 'match_found',
            title: '🔔 New Appointment Available',
            message: `We found ${result.matches.length} new appointment(s) that match your needs`,
            priority: topMatch.scores.priorityTier <= 2 ? 'high' : 'medium',
            actionRequired: true,
            actionUrl: '/patient/matches'
          });
        }
      }
    }

    const summary = {
      totalProcessed: results.length,
      patientsWithMatches: results.filter(r => r.matchCount > 0).length,
      totalMatches: results.reduce((sum, r) => sum + r.matchCount, 0)
    };

    console.log('✅ Batch matching complete:', summary);
    return summary;
  } catch (error) {
    console.error('❌ Error in batch matching:', error);
    throw error;
  }
};

/**
 * Example: React component usage
 */
export const ExampleReactComponent = () => {
  // This is pseudo-code to show how to use in React
  const example = `
import React, { useState, useEffect } from 'react';
import { runCompleteMatchingFlow, acceptMatch } from './examples/matchingExample';

function PatientMatchingPage({ patientId }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, [patientId]);

  const loadMatches = async () => {
    try {
      const result = await runCompleteMatchingFlow(patientId);
      if (result.success) {
        setMatches(result.matches);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptMatch = async (match) => {
    try {
      await acceptMatch(patientId, match);
      alert('Match confirmed!');
      // Redirect to confirmation page
    } catch (error) {
      alert('Error confirming match');
    }
  };

  return (
    <div>
      <h1>Your Recommended Appointments</h1>
      {matches.map(match => (
        <MatchCard
          key={match.appointmentId}
          match={match}
          onAccept={() => handleAcceptMatch(match)}
        />
      ))}
    </div>
  );
}
  `;

  return example;
};

// Export for easy testing in browser console
if (typeof window !== 'undefined') {
  window.MediMatchExample = {
    runCompleteMatchingFlow,
    acceptMatch,
    rejectMatch,
    batchMatchPatients
  };
}
