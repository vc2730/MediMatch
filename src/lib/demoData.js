export const wastedSlotsStats = {
  totalWastedLastMonth: 124,
  patientsRouted: 386,
  averageWaitTime: '8.4 days',
  equityImpactScore: '92/100'
}

export const priorityPatients = [
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
    zip: '10453',
    age: 42,
    gender: 'Female',
    riskFlags: ['Arrhythmia escalation', 'Limited mobility'],
    symptoms: ['Irregular heartbeat', 'Shortness of breath', 'Chest tightness'],
    constraints: ['Requires wheelchair access', 'Cannot travel after 4pm']
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
    zip: '77007',
    age: 58,
    gender: 'Male',
    riskFlags: ['Unstable glucose', 'Recent ER visit'],
    symptoms: ['Dizziness', 'Fatigue', 'Vision changes'],
    constraints: ['Caregiver must attend', 'Prefers morning slots']
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
    zip: '81211',
    age: 36,
    gender: 'Female',
    riskFlags: ['Limited PT access', 'Post-op swelling'],
    symptoms: ['Knee pain', 'Reduced mobility'],
    constraints: ['Needs rural clinic', 'Can travel only Tue/Thu']
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
    zip: '30318',
    age: 47,
    gender: 'Male',
    riskFlags: ['Chronic cough', 'Occupational exposure'],
    symptoms: ['Shortness of breath', 'Persistent cough'],
    constraints: ['Needs after-hours slots', 'Limited transportation']
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
    zip: '60624',
    age: 29,
    gender: 'Female',
    riskFlags: ['Gestational hypertension', 'Limited prenatal visits'],
    symptoms: ['Swelling', 'Headaches'],
    constraints: ['Needs childcare coverage', 'Prefers same-day labs']
  }
]

export const openSlots = [
  {
    id: 'SL-221',
    date: 'Mon',
    dateFull: 'Mar 10',
    time: '9:30 AM',
    specialty: 'Cardiology',
    clinic: 'Summit Specialty Center',
    status: 'open'
  },
  {
    id: 'SL-222',
    date: 'Tue',
    dateFull: 'Mar 11',
    time: '1:00 PM',
    specialty: 'Endocrinology',
    clinic: 'Riverside Health Hub',
    status: 'open'
  },
  {
    id: 'SL-223',
    date: 'Wed',
    dateFull: 'Mar 12',
    time: '3:15 PM',
    specialty: 'Pulmonology',
    clinic: 'Northgate Clinic',
    status: 'open'
  },
  {
    id: 'SL-224',
    date: 'Thu',
    dateFull: 'Mar 13',
    time: '10:45 AM',
    specialty: 'OB/GYN',
    clinic: 'Valley Women\'s Health',
    status: 'open'
  },
  {
    id: 'SL-225',
    date: 'Fri',
    dateFull: 'Mar 14',
    time: '2:30 PM',
    specialty: 'Orthopedics',
    clinic: 'Union Orthopedic',
    status: 'open'
  }
]

export const operationsKpis = [
  { id: 'kpi-1', label: 'Slots Filled Today', value: '14', trend: '+3 vs yesterday' },
  { id: 'kpi-2', label: 'Average Response Time', value: '12 min', trend: 'Trending down' },
  { id: 'kpi-3', label: 'Equity Escalations', value: '7', trend: '2 awaiting review' }
]

export const recentActivity = [
  {
    id: 'act-1',
    title: 'FlowGlad workflow triggered',
    description: 'PT-1132 routed to Valley Women\'s Health · confirmation pending',
    time: '8 minutes ago'
  },
  {
    id: 'act-2',
    title: 'Slot filled',
    description: 'Cardiology slot at 9:30 AM assigned to Ariana Mitchell',
    time: '22 minutes ago'
  },
  {
    id: 'act-3',
    title: 'New intake submitted',
    description: 'Pulmonology referral added to priority queue',
    time: '1 hour ago'
  }
]

export const patientProfile = {
  name: 'Ariana Mitchell',
  status: 'Matched',
  support: 'Need help? Call CareFlow Concierge at (415) 555-0193'
}

export const patientAppointment = {
  date: 'March 4, 2026',
  time: '10:30 AM',
  clinic: 'Summit Specialty Center',
  address: '201 Mission Street, San Francisco, CA',
  doctor: 'Dr. Elena Vega',
  specialty: 'Cardiology',
  notes: 'Arrive 15 minutes early with insurance ID.'
}

export const patientNotifications = [
  {
    id: 'note-1',
    icon: 'calendar',
    title: 'Appointment confirmed',
    body: 'Transportation pickup scheduled for March 4 at 9:45 AM.',
    time: '2 hours ago',
    read: false
  },
  {
    id: 'note-2',
    icon: 'bell',
    title: 'Care coordinator assigned',
    body: 'Maya Torres will be your main point of contact.',
    time: 'Yesterday',
    read: false
  },
  {
    id: 'note-3',
    icon: 'check',
    title: 'Lab orders ready',
    body: 'Lab work can be completed before your appointment.',
    time: '2 days ago',
    read: true
  },
  {
    id: 'note-4',
    icon: 'alert',
    title: 'Reminder sent',
    body: 'Please confirm your preferred communication method.',
    time: '3 days ago',
    read: true
  }
]

export const matchExplanation = [
  'Your equity score prioritized limited transportation access and longer wait time.',
  'Summit Specialty Center accepted your insurance and had the earliest opening.',
  'Care coordinators flagged your case for follow-up within 24 hours.'
]

export const sponsorIntegrations = [
  { id: 'flowglad', name: 'FlowGlad' },
  { id: 'gemini', name: 'Gemini' },
  { id: 'k2', name: 'K2 Think' },
  { id: 'eleven', name: 'ElevenLabs' },
  { id: 'dedalus', name: 'Dedalus' }
]
