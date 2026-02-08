/**
 * Enhanced Equity Scoring Engine
 * Prioritizes patients based on Social Determinants of Health (SDOH)
 * and clinical urgency to reduce healthcare disparities
 */

const transportWeights = {
  'Public transit': 12,
  Bus: 12,
  'Community shuttle': 10,
  'Rideshare support': 6,
  'Family driver': 4,
  'Limited': 10,
  'None': 15,
  'Ambulance': 8
}

const insuranceWeights = {
  Medicaid: 15,
  Medicare: 10,
  Uninsured: 18,
  'Commercial PPO': 4,
  'Private': 5,
  'None': 18
}

const housingWeights = {
  'Homeless': 20,
  'Unstable housing': 15,
  'Shelter': 18,
  'Temporary': 12,
  'Stable': 0,
  'Owned': 0,
  'Rented': 0
}

const foodSecurityWeights = {
  'Food insecure': 12,
  'Very food insecure': 15,
  'Limited access': 10,
  'Secure': 0
}

const employmentWeights = {
  'Unemployed': 8,
  'Underemployed': 6,
  'Part-time': 4,
  'Disabled': 10,
  'Retired': 2,
  'Employed': 0,
  'Full-time': 0
}

const languageBarrierWeights = {
  'Limited English': 10,
  'Non-English speaker': 12,
  'Interpreter needed': 10,
  'English proficient': 0
}

const supportNetworkWeights = {
  'No support': 10,
  'Limited support': 6,
  'Family nearby': 0,
  'Strong support': 0
}

/**
 * Calculate comprehensive equity score with SDOH factors
 * Higher score = higher priority (more barriers to care)
 * @param {Object} patient - Patient data
 * @returns {number} Equity score (0-200+)
 */
export const calculateEquityScore = (patient) => {
  const waitScore = Math.min((patient.waitTimeDays || 0) * 2, 40)
  const urgencyScore = (patient.urgencyLevel || patient.aiUrgencyScore || 5) * 12
  const transportScore = transportWeights[patient.transportation] || 6
  const insuranceScore = insuranceWeights[patient.insurance] || 6

  // New SDOH factors
  const housingScore = housingWeights[patient.housingStatus] || 0
  const foodScore = foodSecurityWeights[patient.foodSecurity] || 0
  const employmentScore = employmentWeights[patient.employmentStatus] || 0
  const languageScore = languageBarrierWeights[patient.languageBarrier] || 0
  const supportScore = supportNetworkWeights[patient.supportNetwork] || 0

  // Income-based adjustment (Low income gets +10, Very low gets +15)
  let incomeScore = 0
  if (patient.income === 'Low' || patient.income === 'Very low') {
    incomeScore = 10
  }
  if (patient.income === 'Very low') {
    incomeScore = 15
  }

  const totalScore = Math.round(
    waitScore +
    urgencyScore +
    transportScore +
    insuranceScore +
    housingScore +
    foodScore +
    employmentScore +
    languageScore +
    supportScore +
    incomeScore
  )

  return totalScore
}

/**
 * Calculate detailed equity breakdown for transparency
 * Shows which factors contribute to the equity score
 * @param {Object} patient - Patient data
 * @returns {Object} Detailed breakdown
 */
export const calculateEquityBreakdown = (patient) => {
  const waitScore = Math.min((patient.waitTimeDays || 0) * 2, 40)
  const urgencyScore = (patient.urgencyLevel || patient.aiUrgencyScore || 5) * 12
  const transportScore = transportWeights[patient.transportation] || 6
  const insuranceScore = insuranceWeights[patient.insurance] || 6
  const housingScore = housingWeights[patient.housingStatus] || 0
  const foodScore = foodSecurityWeights[patient.foodSecurity] || 0
  const employmentScore = employmentWeights[patient.employmentStatus] || 0
  const languageScore = languageBarrierWeights[patient.languageBarrier] || 0
  const supportScore = supportNetworkWeights[patient.supportNetwork] || 0

  let incomeScore = 0
  if (patient.income === 'Low' || patient.income === 'Very low') {
    incomeScore = 10
  }
  if (patient.income === 'Very low') {
    incomeScore = 15
  }

  const breakdown = {
    total: calculateEquityScore(patient),
    factors: [
      { label: 'Clinical Urgency', score: urgencyScore, description: `Level ${patient.urgencyLevel || 5}/10` },
      { label: 'Wait Time', score: waitScore, description: `${patient.waitTimeDays || 0} days waiting` },
      { label: 'Insurance Barrier', score: insuranceScore, description: patient.insurance || 'Unknown' },
      { label: 'Transportation', score: transportScore, description: patient.transportation || 'Unknown' }
    ]
  }

  // Add SDOH factors if they contribute
  if (housingScore > 0) {
    breakdown.factors.push({
      label: 'Housing Insecurity',
      score: housingScore,
      description: patient.housingStatus
    })
  }

  if (foodScore > 0) {
    breakdown.factors.push({
      label: 'Food Insecurity',
      score: foodScore,
      description: patient.foodSecurity
    })
  }

  if (employmentScore > 0) {
    breakdown.factors.push({
      label: 'Employment Barrier',
      score: employmentScore,
      description: patient.employmentStatus
    })
  }

  if (languageScore > 0) {
    breakdown.factors.push({
      label: 'Language Barrier',
      score: languageScore,
      description: patient.languageBarrier
    })
  }

  if (supportScore > 0) {
    breakdown.factors.push({
      label: 'Limited Support Network',
      score: supportScore,
      description: patient.supportNetwork
    })
  }

  if (incomeScore > 0) {
    breakdown.factors.push({
      label: 'Low Income',
      score: incomeScore,
      description: patient.income
    })
  }

  // Sort by score descending to show most impactful factors first
  breakdown.factors.sort((a, b) => b.score - a.score)

  return breakdown
}

/**
 * Get equity tier based on score
 * @param {number} score - Equity score
 * @returns {Object} Tier info
 */
export const getEquityTier = (score) => {
  if (score >= 100) {
    return {
      tier: 'Critical Equity',
      level: 1,
      color: 'red',
      description: 'Multiple significant barriers to care - highest priority'
    }
  }
  if (score >= 70) {
    return {
      tier: 'High Equity Need',
      level: 2,
      color: 'orange',
      description: 'Significant barriers to care - prioritize'
    }
  }
  if (score >= 40) {
    return {
      tier: 'Moderate Equity Need',
      level: 3,
      color: 'yellow',
      description: 'Some barriers to care'
    }
  }
  return {
    tier: 'Standard',
    level: 4,
    color: 'blue',
    description: 'Minimal barriers to care'
  }
}
