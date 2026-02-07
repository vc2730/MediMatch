/**
 * MediMatch Matching Algorithm
 * Equity-aware appointment matching system
 *
 * This algorithm prioritizes patients based on:
 * 1. Medical urgency (from Gemini AI)
 * 2. Wait time
 * 3. Geographic accessibility
 * 4. Socioeconomic barriers (transportation, insurance)
 * 5. Healthcare equity factors
 */

import { getAvailableAppointments } from './database';
import { calculateEquityScore } from '../lib/equityEngine';

// ============================================
// SCORING WEIGHTS & CONSTANTS
// ============================================

const SCORING_WEIGHTS = {
  URGENCY: 3,        // Max 30 points (urgency 1-10)
  WAIT_TIME: 2,      // Max 20 points (wait time score 0-10)
  DISTANCE: 1.5,     // Max 15 points (distance score 0-10)
  BARRIERS: 2,       // Max 20 points (barrier bonus 0-10)
  INSURANCE: 1.5     // Max 15 points (insurance match 0-10)
};

const PRIORITY_TIERS = {
  URGENT_WITH_BARRIERS: 1,  // Urgency ≥7 AND (limited transport OR Medicaid/Uninsured)
  HIGH_URGENCY: 2,          // Urgency ≥7
  LONG_WAIT: 3,             // Waiting >14 days
  STANDARD: 4               // Everyone else
};

const BARRIER_FACTORS = {
  transportation: {
    'Limited': 8,
    'Public transit': 6,
    'Bus': 6,
    'Community shuttle': 5,
    'Rideshare support': 4,
    'Family driver': 2,
    'Personal vehicle': 0
  },
  insurance: {
    'Uninsured': 10,
    'Medicaid': 8,
    'Medicare': 4,
    'Commercial PPO': 1,
    'Private': 1
  }
};

// ============================================
// CORE SCORING FUNCTIONS
// ============================================

/**
 * Calculate urgency score from AI (Gemini)
 * For now, uses patient's self-reported urgency if AI score not available
 * @param {Object} patient - Patient data
 * @returns {number} Urgency score 0-10
 */
export const calculateUrgencyScore = (patient) => {
  // Prefer AI-calculated urgency if available
  if (patient.aiUrgencyScore) {
    return Math.min(Math.max(patient.aiUrgencyScore, 0), 10);
  }

  // Fallback to self-reported urgency
  if (patient.urgencyLevel) {
    return Math.min(Math.max(patient.urgencyLevel, 0), 10);
  }

  // Default medium urgency
  return 5;
};

/**
 * Calculate wait time score based on days waiting
 * @param {Object} patient - Patient data
 * @returns {number} Wait time score 0-10
 */
export const calculateWaitTimeScore = (patient) => {
  const waitDays = patient.waitTimeDays || 0;

  // Convert wait time to score (0-10)
  // 0 days = 0 points, 30+ days = 10 points
  const score = Math.min(waitDays / 3, 10);
  return Math.round(score * 10) / 10;
};

/**
 * Calculate geographic distance score
 * @param {string} patientZip - Patient's zip code
 * @param {string} appointmentZip - Appointment zip code
 * @returns {number} Distance score 0-10 (10 = closest)
 */
export const calculateDistanceScore = (patientZip, appointmentZip) => {
  if (!patientZip || !appointmentZip) {
    return 5; // Default medium score if zip missing
  }

  // Same zip code = maximum score
  if (patientZip === appointmentZip) {
    return 10;
  }

  // For hackathon: simple prefix matching
  // First 3 digits same = nearby area
  const patientPrefix = patientZip.substring(0, 3);
  const appointmentPrefix = appointmentZip.substring(0, 3);

  if (patientPrefix === appointmentPrefix) {
    return 7; // Same general area
  }

  // Different area but could be accessible
  return 4;

  // TODO: For production, integrate with actual distance API
  // e.g., Google Maps Distance Matrix API or zip code database
};

/**
 * Calculate barrier bonus based on socioeconomic factors
 * @param {Object} patient - Patient data
 * @returns {number} Barrier bonus 0-10
 */
export const calculateBarrierBonus = (patient) => {
  let bonus = 0;

  // Transportation barriers
  const transportScore = BARRIER_FACTORS.transportation[patient.transportation] || 0;
  bonus += transportScore * 0.5;

  // Insurance barriers
  const insuranceScore = BARRIER_FACTORS.insurance[patient.insurance] || 0;
  bonus += insuranceScore * 0.5;

  // Language barriers
  if (patient.language && patient.language !== 'English') {
    bonus += 2;
  }

  // Income barriers
  if (patient.income === 'Low') {
    bonus += 2;
  }

  return Math.min(Math.round(bonus * 10) / 10, 10);
};

/**
 * Calculate insurance match score
 * @param {Object} patient - Patient data
 * @param {Object} appointment - Appointment data
 * @returns {number} Insurance match score 0-10
 */
export const calculateInsuranceMatchScore = (patient, appointment) => {
  if (!appointment.insuranceAccepted || appointment.insuranceAccepted.length === 0) {
    return 5; // Default if no insurance info
  }

  const patientInsurance = patient.insurance;

  // Check if patient's insurance is accepted
  const isAccepted = appointment.insuranceAccepted.some(insurance =>
    insurance.toLowerCase().includes(patientInsurance.toLowerCase()) ||
    patientInsurance.toLowerCase().includes(insurance.toLowerCase())
  );

  if (isAccepted) {
    return 10; // Perfect match
  }

  // Check for "All" or "Any" insurance accepted
  if (appointment.insuranceAccepted.some(ins =>
    ins.toLowerCase() === 'all' || ins.toLowerCase() === 'any'
  )) {
    return 10;
  }

  return 0; // Insurance not accepted
};

/**
 * Determine priority tier for a patient
 * @param {Object} patient - Patient data
 * @param {number} urgencyScore - Calculated urgency score
 * @returns {number} Priority tier (1-4, 1 = highest)
 */
export const calculatePriorityTier = (patient, urgencyScore) => {
  const hasTransportBarrier = ['Limited', 'Public transit', 'Bus'].includes(patient.transportation);
  const hasInsuranceBarrier = ['Medicaid', 'Uninsured'].includes(patient.insurance);
  const hasBarriers = hasTransportBarrier || hasInsuranceBarrier;

  // Tier 1: Urgent + Barriers
  if (urgencyScore >= 7 && hasBarriers) {
    return PRIORITY_TIERS.URGENT_WITH_BARRIERS;
  }

  // Tier 2: High Urgency
  if (urgencyScore >= 7) {
    return PRIORITY_TIERS.HIGH_URGENCY;
  }

  // Tier 3: Long Wait
  if (patient.waitTimeDays > 14) {
    return PRIORITY_TIERS.LONG_WAIT;
  }

  // Tier 4: Standard
  return PRIORITY_TIERS.STANDARD;
};

/**
 * Calculate total match score for patient-appointment pair
 * @param {Object} patient - Patient data
 * @param {Object} appointment - Appointment data
 * @returns {Object} Scoring breakdown
 */
export const calculateMatchScore = (patient, appointment) => {
  // Calculate individual scores
  const urgencyScore = calculateUrgencyScore(patient);
  const waitTimeScore = calculateWaitTimeScore(patient);
  const distanceScore = calculateDistanceScore(patient.zipCode, appointment.zipCode);
  const barrierBonus = calculateBarrierBonus(patient);
  const insuranceMatchScore = calculateInsuranceMatchScore(patient, appointment);

  // Calculate weighted total
  const totalMatchScore = Math.round(
    (urgencyScore * SCORING_WEIGHTS.URGENCY) +
    (waitTimeScore * SCORING_WEIGHTS.WAIT_TIME) +
    (distanceScore * SCORING_WEIGHTS.DISTANCE) +
    (barrierBonus * SCORING_WEIGHTS.BARRIERS) +
    (insuranceMatchScore * SCORING_WEIGHTS.INSURANCE)
  );

  // Determine priority tier
  const priorityTier = calculatePriorityTier(patient, urgencyScore);

  // Generate reasoning explanation
  const reasoningExplanation = generateReasoningExplanation(
    patient,
    appointment,
    {
      urgencyScore,
      waitTimeScore,
      distanceScore,
      barrierBonus,
      insuranceMatchScore,
      priorityTier
    }
  );

  return {
    urgencyScore,
    waitTimeScore,
    distanceScore,
    barrierBonus,
    insuranceMatchScore,
    totalMatchScore,
    priorityTier,
    reasoningExplanation,
    equityScore: calculateEquityScore(patient) // Use existing equity engine
  };
};

/**
 * Generate human-readable explanation for the match
 * @param {Object} patient - Patient data
 * @param {Object} appointment - Appointment data
 * @param {Object} scores - Calculated scores
 * @returns {string} Explanation text
 */
const generateReasoningExplanation = (patient, appointment, scores) => {
  const reasons = [];

  // Priority tier explanation
  if (scores.priorityTier === 1) {
    reasons.push('🚨 High Priority: Urgent medical need with significant access barriers');
  } else if (scores.priorityTier === 2) {
    reasons.push('⚠️ Urgent: High medical urgency requiring prompt attention');
  } else if (scores.priorityTier === 3) {
    reasons.push('⏱️ Extended Wait: Patient has been waiting for over 2 weeks');
  }

  // Urgency
  if (scores.urgencyScore >= 8) {
    reasons.push(`Critical urgency level (${scores.urgencyScore}/10)`);
  } else if (scores.urgencyScore >= 6) {
    reasons.push(`Moderate-high urgency (${scores.urgencyScore}/10)`);
  }

  // Wait time
  if (patient.waitTimeDays >= 21) {
    reasons.push(`Extended wait time: ${patient.waitTimeDays} days`);
  } else if (patient.waitTimeDays >= 14) {
    reasons.push(`Significant wait: ${patient.waitTimeDays} days`);
  }

  // Barriers
  if (scores.barrierBonus >= 7) {
    reasons.push('Multiple access barriers identified (transportation, insurance, or language)');
  } else if (scores.barrierBonus >= 4) {
    reasons.push('Some access barriers present');
  }

  // Geography
  if (scores.distanceScore >= 8) {
    reasons.push('Excellent geographic match - very close to patient');
  }

  // Insurance
  if (scores.insuranceMatchScore === 10) {
    reasons.push(`Insurance accepted: ${patient.insurance}`);
  } else if (scores.insuranceMatchScore === 0) {
    reasons.push('⚠️ Insurance compatibility may need verification');
  }

  return reasons.join('. ') + '.';
};

// ============================================
// MAIN MATCHING FUNCTIONS
// ============================================

/**
 * Find best appointment matches for a patient
 * @param {Object} patient - Patient data (must include id)
 * @param {number} limit - Number of matches to return (default 5)
 * @returns {Promise<Array>} Array of matched appointments with scores
 */
export const findMatchesForPatient = async (patient, limit = 5) => {
  try {
    if (!patient || !patient.id) {
      throw new Error('Patient data with ID is required');
    }

    if (!patient.specialty) {
      throw new Error('Patient specialty is required for matching');
    }

    console.log(`Finding matches for patient ${patient.id} (${patient.specialty})`);

    // Get available appointments in patient's specialty
    const appointments = await getAvailableAppointments(patient.specialty);

    if (appointments.length === 0) {
      console.log('No available appointments found for specialty:', patient.specialty);
      return [];
    }

    console.log(`Found ${appointments.length} available appointments`);

    // Score each appointment
    const scoredMatches = appointments.map(appointment => {
      const scores = calculateMatchScore(patient, appointment);
      return {
        appointment,
        scores,
        appointmentId: appointment.id
      };
    });

    // Sort by priority tier first, then by total score
    scoredMatches.sort((a, b) => {
      // Lower tier number = higher priority
      if (a.scores.priorityTier !== b.scores.priorityTier) {
        return a.scores.priorityTier - b.scores.priorityTier;
      }
      // Within same tier, higher score wins
      return b.scores.totalMatchScore - a.scores.totalMatchScore;
    });

    // Return top N matches
    const topMatches = scoredMatches.slice(0, limit);

    console.log(`Returning top ${topMatches.length} matches for patient ${patient.id}`);
    return topMatches;
  } catch (error) {
    console.error('Error finding matches:', error);
    throw error;
  }
};

/**
 * Find best patient match for an appointment
 * (Reverse matching - used if implementing doctor-initiated matching)
 * @param {Object} appointment - Appointment data
 * @param {Array} waitingPatients - Array of patients waiting for this specialty
 * @param {number} limit - Number of matches to return
 * @returns {Array} Array of matched patients with scores
 */
export const findPatientsForAppointment = (appointment, waitingPatients, limit = 5) => {
  try {
    if (!appointment || !waitingPatients || waitingPatients.length === 0) {
      return [];
    }

    // Filter patients by specialty match
    const eligiblePatients = waitingPatients.filter(
      patient => patient.specialty === appointment.specialty
    );

    if (eligiblePatients.length === 0) {
      return [];
    }

    // Score each patient
    const scoredMatches = eligiblePatients.map(patient => {
      const scores = calculateMatchScore(patient, appointment);
      return {
        patient,
        scores,
        patientId: patient.id
      };
    });

    // Sort by priority tier and score
    scoredMatches.sort((a, b) => {
      if (a.scores.priorityTier !== b.scores.priorityTier) {
        return a.scores.priorityTier - b.scores.priorityTier;
      }
      return b.scores.totalMatchScore - a.scores.totalMatchScore;
    });

    return scoredMatches.slice(0, limit);
  } catch (error) {
    console.error('Error finding patients for appointment:', error);
    throw error;
  }
};

/**
 * Batch process matches for multiple patients
 * @param {Array} patients - Array of patient objects
 * @param {number} matchesPerPatient - Matches to find per patient
 * @returns {Promise<Array>} Array of { patientId, matches }
 */
export const batchProcessMatches = async (patients, matchesPerPatient = 3) => {
  try {
    const results = [];

    for (const patient of patients) {
      try {
        const matches = await findMatchesForPatient(patient, matchesPerPatient);
        results.push({
          patientId: patient.id,
          patient,
          matches,
          matchCount: matches.length
        });
      } catch (error) {
        console.error(`Error processing matches for patient ${patient.id}:`, error);
        results.push({
          patientId: patient.id,
          patient,
          matches: [],
          matchCount: 0,
          error: error.message
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error in batch processing:', error);
    throw error;
  }
};

/**
 * Get match quality rating
 * @param {number} totalMatchScore - Total match score
 * @param {number} priorityTier - Priority tier
 * @returns {Object} Quality rating and label
 */
export const getMatchQuality = (totalMatchScore, priorityTier) => {
  if (priorityTier === 1 && totalMatchScore >= 80) {
    return { rating: 'excellent', label: 'Excellent Match', color: 'green' };
  }

  if (totalMatchScore >= 80) {
    return { rating: 'very-good', label: 'Very Good Match', color: 'blue' };
  }

  if (totalMatchScore >= 60) {
    return { rating: 'good', label: 'Good Match', color: 'teal' };
  }

  if (totalMatchScore >= 40) {
    return { rating: 'fair', label: 'Fair Match', color: 'yellow' };
  }

  return { rating: 'low', label: 'Low Match', color: 'gray' };
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Validate patient data for matching
 * @param {Object} patient - Patient data
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validatePatientForMatching = (patient) => {
  const errors = [];

  if (!patient.id) errors.push('Patient ID is required');
  if (!patient.specialty) errors.push('Medical specialty is required');
  if (!patient.zipCode) errors.push('Zip code is required');
  if (!patient.insurance) errors.push('Insurance information is required');

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Calculate wait time in days since registration
 * @param {Object} patient - Patient data
 * @returns {number} Days since registration
 */
export const calculateWaitTimeDays = (patient) => {
  if (!patient.registeredAt) return 0;

  const registeredDate = patient.registeredAt.toDate ?
    patient.registeredAt.toDate() : new Date(patient.registeredAt);

  const now = new Date();
  const diffTime = Math.abs(now - registeredDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

// Export scoring weights for testing/debugging
export const SCORING_CONFIG = {
  WEIGHTS: SCORING_WEIGHTS,
  PRIORITY_TIERS,
  BARRIER_FACTORS
};
