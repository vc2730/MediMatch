const transportWeights = {
  'Public transit': 12,
  Bus: 12,
  'Community shuttle': 10,
  'Rideshare support': 6,
  'Family driver': 4
}

const insuranceWeights = {
  Medicaid: 15,
  Medicare: 10,
  Uninsured: 18,
  'Commercial PPO': 4
}

export const calculateEquityScore = (patient) => {
  const waitScore = Math.min(patient.waitTimeDays * 2, 40)
  const urgencyScore = patient.urgencyLevel * 12
  const transportScore = transportWeights[patient.transportation] || 6
  const insuranceScore = insuranceWeights[patient.insurance] || 6

  return Math.round(waitScore + urgencyScore + transportScore + insuranceScore)
}
