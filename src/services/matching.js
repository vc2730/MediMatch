/**
 * MediMatch ER Room Matching Algorithm
 * Equity-aware emergency room triage and routing system
 *
 * This algorithm prioritizes patients based on:
 * 1. Medical urgency / ESI triage level (from Gemini AI)
 * 2. Time waiting in ER
 * 3. Geographic proximity to ER
 * 4. Socioeconomic barriers (transportation, insurance)
 * 5. Healthcare equity factors
 */

import { getAllAvailableAppointments } from './database';
import { calculateEquityScore } from '../lib/equityEngine';

// ============================================
// SCORING WEIGHTS & CONSTANTS
// ============================================

const SCORING_WEIGHTS = {
  URGENCY: 4,        // Max 40 points — dominant factor in ER (urgency 1-10)
  TRIAGE: 1.5,       // Max 15 points — ESI triage level bonus
  WAIT_TIME: 1,      // Max 10 points (wait time score 0-10)
  DISTANCE: 1,       // Max 10 points (distance score 0-10)
  SPECIALTY: 1,      // Max 10 points — specialty match bonus
  BARRIERS: 1,       // Max 10 points (barrier bonus 0-10)
  INSURANCE: 0.5     // Max 5 points (insurance match — ER must treat everyone)
};

const PRIORITY_TIERS = {
  IMMEDIATE: 1,              // ESI Level 1 — life-threatening, immediate
  EMERGENT_WITH_BARRIERS: 2, // ESI Level 2 + equity barriers
  EMERGENT: 3,               // ESI Level 2 — high risk
  URGENT: 4,                 // ESI Level 3 — stable but urgent
  STANDARD: 5                // ESI Level 4-5 — less urgent
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

  const pZip = String(patientZip).trim();
  const aZip = String(appointmentZip).trim();

  // Same zip code = maximum score
  if (pZip === aZip) {
    return 10;
  }

  // Enhanced zip code proximity algorithm
  // Uses hierarchical matching based on USPS zip code structure

  // First digit: National area (0-9)
  // First 3 digits (prefix): Sectional center facility (SCF)
  // Full 5 digits: Delivery area

  const matchingDigits = countMatchingDigits(pZip, aZip);

  if (matchingDigits >= 4) {
    return 9; // Adjacent neighborhoods (~2-5 miles)
  } else if (matchingDigits === 3) {
    return 7; // Same regional area (~10-20 miles)
  } else if (matchingDigits === 2) {
    return 5; // Same broader region (~30-50 miles)
  } else if (matchingDigits === 1) {
    return 3; // Same state/multi-state area (~100+ miles)
  } else {
    return 1; // Different regions (likely >200 miles)
  }
};

/**
 * Count matching leading digits between two zip codes
 * @param {string} zip1 - First zip code
 * @param {string} zip2 - Second zip code
 * @returns {number} Number of matching leading digits
 */
const countMatchingDigits = (zip1, zip2) => {
  const minLength = Math.min(zip1.length, zip2.length);
  let count = 0;

  for (let i = 0; i < minLength; i++) {
    if (zip1[i] === zip2[i]) {
      count++;
    } else {
      break; // Stop at first mismatch
    }
  }

  return count;
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
 * Calculate specialty match score — bonus for matching room specialty
 * @param {Object} patient - Patient data
 * @param {Object} appointment - Appointment data
 * @returns {number} Specialty match score 0-10
 */
export const calculateSpecialtyMatchScore = (patient, appointment) => {
  if (!patient.specialty || !appointment.specialty) return 5;
  if (patient.specialty === appointment.specialty) return 10;
  // Adjacent specialties (e.g. primary_care can handle many things)
  if (appointment.specialty === 'primary_care') return 4;
  return 0;
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
 * Calculate ESI triage level bonus score
 * ESI Level 1 = immediate life threat, Level 5 = non-urgent
 * @param {Object} patient - Patient data
 * @returns {number} Triage bonus score 0-10
 */
export const calculateTriageLevelScore = (patient) => {
  const triageLevel = patient.triageLevel;
  if (!triageLevel) {
    // Estimate from urgency if no explicit triage level
    const urgency = patient.aiUrgencyScore || patient.urgencyLevel || 5;
    if (urgency >= 9) return 10;
    if (urgency >= 7) return 7;
    if (urgency >= 5) return 4;
    return 1;
  }
  // ESI levels: 1=10pts, 2=8pts, 3=5pts, 4=2pts, 5=0pts
  const triageScores = { 1: 10, 2: 8, 3: 5, 4: 2, 5: 0 };
  return triageScores[triageLevel] || 5;
};

/**
 * Determine priority tier for a patient (ER triage context)
 * @param {Object} patient - Patient data
 * @param {number} urgencyScore - Calculated urgency score
 * @returns {number} Priority tier (1-5, 1 = highest)
 */
export const calculatePriorityTier = (patient, urgencyScore) => {
  const hasTransportBarrier = ['Limited', 'Public transit', 'Bus', 'Ambulance'].includes(patient.transportation);
  const hasInsuranceBarrier = ['Medicaid', 'Uninsured'].includes(patient.insurance);
  const hasBarriers = hasTransportBarrier || hasInsuranceBarrier;
  const triageLevel = patient.triageLevel || (urgencyScore >= 9 ? 1 : urgencyScore >= 7 ? 2 : 3);

  // Tier 1: ESI Level 1 — immediate, life-threatening
  if (triageLevel === 1 || urgencyScore >= 9) {
    return PRIORITY_TIERS.IMMEDIATE;
  }

  // Tier 2: ESI Level 2 + equity barriers
  if (triageLevel === 2 && hasBarriers) {
    return PRIORITY_TIERS.EMERGENT_WITH_BARRIERS;
  }

  // Tier 3: ESI Level 2 — emergent
  if (urgencyScore >= 7 || triageLevel === 2) {
    return PRIORITY_TIERS.EMERGENT;
  }

  // Tier 4: ESI Level 3 — urgent
  if (urgencyScore >= 5 || triageLevel === 3) {
    return PRIORITY_TIERS.URGENT;
  }

  // Tier 5: Standard — less urgent
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
  const triageLevelScore = calculateTriageLevelScore(patient);
  const waitTimeScore = calculateWaitTimeScore(patient);
  const distanceScore = calculateDistanceScore(patient.zipCode, appointment.zipCode);
  const specialtyMatchScore = calculateSpecialtyMatchScore(patient, appointment);
  const barrierBonus = calculateBarrierBonus(patient);
  const insuranceMatchScore = calculateInsuranceMatchScore(patient, appointment);

  // Calculate weighted total (ER-weighted: urgency dominates, specialty differentiates rooms)
  const totalMatchScore = Math.round(
    (urgencyScore * SCORING_WEIGHTS.URGENCY) +
    (triageLevelScore * SCORING_WEIGHTS.TRIAGE) +
    (waitTimeScore * SCORING_WEIGHTS.WAIT_TIME) +
    (distanceScore * SCORING_WEIGHTS.DISTANCE) +
    (specialtyMatchScore * SCORING_WEIGHTS.SPECIALTY) +
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
      triageLevelScore,
      waitTimeScore,
      distanceScore,
      specialtyMatchScore,
      barrierBonus,
      insuranceMatchScore,
      priorityTier
    }
  );

  return {
    urgencyScore,
    triageLevelScore,
    waitTimeScore,
    distanceScore,
    specialtyMatchScore,
    barrierBonus,
    insuranceMatchScore,
    totalMatchScore,
    priorityTier,
    reasoningExplanation,
    equityScore: calculateEquityScore(patient)
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
    reasons.push('🚨 ESI Level 1 — Immediate: Life-threatening, requires immediate ER room');
  } else if (scores.priorityTier === 2) {
    reasons.push('🔴 Emergent + Equity Barriers: High-risk patient with access barriers, fast-tracked');
  } else if (scores.priorityTier === 3) {
    reasons.push('⚠️ Emergent: High medical risk requiring prompt ER attention');
  } else if (scores.priorityTier === 4) {
    reasons.push('🟡 Urgent: Stable but needs timely care');
  }

  // Urgency
  if (scores.urgencyScore >= 9) {
    reasons.push(`Critical triage: ${scores.urgencyScore}/10 urgency`);
  } else if (scores.urgencyScore >= 7) {
    reasons.push(`High urgency: ${scores.urgencyScore}/10`);
  } else if (scores.urgencyScore >= 5) {
    reasons.push(`Moderate urgency: ${scores.urgencyScore}/10`);
  }

  // Triage level
  if (scores.triageLevelScore >= 8) {
    reasons.push('ESI triage confirms immediate intervention needed');
  }

  // Wait time in ER
  if (patient.waitTimeDays >= 1) {
    reasons.push(`Waiting ${patient.waitTimeDays} day(s) for ER care`);
  }

  // Barriers
  if (scores.barrierBonus >= 7) {
    reasons.push('Multiple equity barriers: prioritized for equitable access');
  } else if (scores.barrierBonus >= 4) {
    reasons.push('Equity barriers identified — boosted priority');
  }

  // Geography
  if (scores.distanceScore >= 8) {
    reasons.push('Nearest available ER room');
  }

  // Insurance — note: ER must treat regardless
  if (patient.insurance === 'Uninsured') {
    reasons.push('Uninsured — equity priority applied (EMTALA)');
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

    console.log(`Finding ER room matches for patient ${patient.id}`);

    // Get ALL available ER rooms (not filtered by specialty — ER treats everyone)
    const allSlots = await getAllAvailableAppointments();

    if (allSlots.length === 0) {
      console.log('No available ER rooms found');
      return [];
    }

    console.log(`Found ${allSlots.length} available ER room slots`);

    // Score each slot
    const scoredMatches = allSlots.map(appointment => {
      const scores = calculateMatchScore(patient, appointment);
      return {
        appointment,
        scores,
        appointmentId: appointment.id
      };
    });

    // Sort by priority tier first, then by total score
    scoredMatches.sort((a, b) => {
      if (a.scores.priorityTier !== b.scores.priorityTier) {
        return a.scores.priorityTier - b.scores.priorityTier;
      }
      return b.scores.totalMatchScore - a.scores.totalMatchScore;
    });

    // Deduplicate: one slot per doctor/room so we show distinct ER rooms
    const seen = new Set();
    const uniqueMatches = [];
    for (const match of scoredMatches) {
      const key = match.appointment.doctorId;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueMatches.push(match);
      }
      if (uniqueMatches.length >= limit) break;
    }

    console.log(`Returning ${uniqueMatches.length} distinct ER room matches`);
    return uniqueMatches;
  } catch (error) {
    console.error('Error finding ER matches:', error);
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
  if (priorityTier === 1 || (priorityTier <= 2 && totalMatchScore >= 80)) {
    return { rating: 'immediate', label: 'Immediate — ESI Level 1', color: 'red' };
  }

  if (totalMatchScore >= 80) {
    return { rating: 'emergent', label: 'Emergent — High Priority', color: 'orange' };
  }

  if (totalMatchScore >= 60) {
    return { rating: 'urgent', label: 'Urgent — Timely Care', color: 'yellow' };
  }

  if (totalMatchScore >= 40) {
    return { rating: 'semi-urgent', label: 'Semi-Urgent', color: 'blue' };
  }

  return { rating: 'non-urgent', label: 'Non-Urgent', color: 'gray' };
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
