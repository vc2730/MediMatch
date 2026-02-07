/**
 * React Hook for Matching Algorithm
 */

import { useState, useCallback } from 'react';
import { findMatchesForPatient } from '../services/matching';
import { createMatch, createNotification } from '../services/database';
import { triggerMatchWorkflow } from '../services/flowgladIntegration';

/**
 * Hook for finding matches for a patient
 */
export const useMatching = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const findMatches = useCallback(async (patient, limit = 5) => {
    if (!patient) {
      setError('Patient data is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Finding matches for patient:', patient.fullName);
      const results = await findMatchesForPatient(patient, limit);

      setMatches(results);
      console.log(`Found ${results.length} matches`);

      return results;
    } catch (err) {
      console.error('Error finding matches:', err);
      setError(err.message);
      setMatches([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptMatch = useCallback(async (patient, match) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Creating match for patient:', patient.fullName);

      // Create match in database
      const matchId = await createMatch(
        patient.id,
        match.appointmentId,
        match.scores
      );

      // Create patient notification
      await createNotification(patient.id, {
        type: 'match_found',
        title: '🎉 Appointment Confirmed!',
        message: `Your appointment with ${match.appointment.doctorName} at ${match.appointment.clinicName} is confirmed for ${match.appointment.time}`,
        priority: match.scores.priorityTier <= 2 ? 'high' : 'medium',
        relatedMatchId: matchId,
        relatedAppointmentId: match.appointmentId,
        actionRequired: false
      });

      // Create doctor notification
      await createNotification(match.appointment.doctorId, {
        type: 'match_found',
        title: '👤 New Patient Match',
        message: `Patient ${patient.fullName} has been matched to your ${match.appointment.time} appointment`,
        priority: 'medium',
        relatedMatchId: matchId,
        relatedAppointmentId: match.appointmentId,
        actionRequired: true
      });

      // Trigger FlowGlad workflow (optional)
      try {
        await triggerMatchWorkflow(matchId, {
          ...match.scores,
          patientId: patient.id,
          appointmentId: match.appointmentId,
          doctorId: match.appointment.doctorId
        });
      } catch (workflowError) {
        console.warn('FlowGlad workflow failed (non-critical):', workflowError);
      }

      console.log('Match created successfully:', matchId);
      return { success: true, matchId };
    } catch (err) {
      console.error('Error accepting match:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMatches = useCallback(() => {
    setMatches([]);
    setError(null);
  }, []);

  return {
    matches,
    loading,
    error,
    findMatches,
    acceptMatch,
    clearMatches
  };
};
