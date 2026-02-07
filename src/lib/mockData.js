export const wastedSlotsStats = {
  totalWastedLastMonth: 124,
  patientsRouted: 386,
  averageWaitTime: '8.4 days',
  equityImpactScore: '92/100'
}

export const mockPatients = [
  {
    id: 'PT-1029',
    name: 'Ariana Mitchell',
    condition: 'Complex cardiac arrhythmia',
    specialty: 'Cardiology',
    waitTimeDays: 18,
    travelConstraints: 'Limited mobility',
    urgencyLevel: 5,
    insurance: 'Medicaid',
    transportation: 'Public transit',
    zip: '10453'
  },
  {
    id: 'PT-1044',
    name: 'Luis Hernandez',
    condition: 'Endocrine management',
    specialty: 'Endocrinology',
    waitTimeDays: 12,
    travelConstraints: 'Needs caregiver',
    urgencyLevel: 4,
    insurance: 'Medicare',
    transportation: 'Rideshare support',
    zip: '77007'
  },
  {
    id: 'PT-1087',
    name: 'Nora Caldwell',
    condition: 'Post-surgical rehab',
    specialty: 'Orthopedics',
    waitTimeDays: 21,
    travelConstraints: 'Rural access',
    urgencyLevel: 4,
    insurance: 'Commercial PPO',
    transportation: 'Family driver',
    zip: '81211'
  },
  {
    id: 'PT-1103',
    name: 'Malik Johnson',
    condition: 'Pulmonary consult',
    specialty: 'Pulmonology',
    waitTimeDays: 9,
    travelConstraints: 'Night shift work',
    urgencyLevel: 3,
    insurance: 'Uninsured',
    transportation: 'Bus',
    zip: '30318'
  },
  {
    id: 'PT-1132',
    name: 'Sahana Patel',
    condition: 'High-risk prenatal care',
    specialty: 'OB/GYN',
    waitTimeDays: 15,
    travelConstraints: 'Childcare required',
    urgencyLevel: 5,
    insurance: 'Medicaid',
    transportation: 'Community shuttle',
    zip: '60624'
  }
]
