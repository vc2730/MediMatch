/**
 * MediMatch Demo Data Seeding
 * Populate Firestore with realistic test data for demos and development
 */

import { Timestamp } from 'firebase/firestore';
import {
  saveUserProfile,
  createAppointment,
  createMatch,
  createNotification
} from './database';
import { calculateMatchScore } from './matching';

// ============================================
// DEMO DOCTORS
// ============================================

export const DEMO_DOCTORS = [
  {
    id: 'doctor_1',
    email: 'dr.jones@cityheart.com',
    role: 'doctor',
    fullName: 'Dr. Sarah Jones',
    specialty: 'cardiology',
    clinicName: 'City Heart Center',
    address: '123 Medical Plaza, New York, NY',
    zipCode: '10001',
    phone: '555-0101',
    npiNumber: '1234567890',
    licenseNumber: 'NY123456',
    insuranceAccepted: ['Medicaid', 'Medicare', 'Private', 'Commercial PPO'],
    languages: ['English', 'Spanish'],
    bio: 'Board-certified cardiologist with 15 years of experience'
  },
  {
    id: 'doctor_2',
    email: 'dr.smith@communityclinic.com',
    role: 'doctor',
    fullName: 'Dr. Michael Smith',
    specialty: 'primary_care',
    clinicName: 'Community Health Clinic',
    address: '456 Main St, Brooklyn, NY',
    zipCode: '11201',
    phone: '555-0102',
    npiNumber: '9876543210',
    licenseNumber: 'NY654321',
    insuranceAccepted: ['Medicaid', 'Medicare', 'Uninsured'],
    languages: ['English', 'Chinese', 'Spanish'],
    bio: 'Family medicine physician focused on underserved communities'
  },
  {
    id: 'doctor_3',
    email: 'dr.patel@orthocenter.com',
    role: 'doctor',
    fullName: 'Dr. Priya Patel',
    specialty: 'orthopedics',
    clinicName: 'Manhattan Orthopedic Center',
    address: '789 Park Avenue, New York, NY',
    zipCode: '10021',
    phone: '555-0103',
    npiNumber: '5555555555',
    licenseNumber: 'NY789012',
    insuranceAccepted: ['Medicare', 'Private', 'Commercial PPO'],
    languages: ['English', 'Hindi', 'Gujarati'],
    bio: 'Orthopedic surgeon specializing in joint replacement'
  },
  {
    id: 'doctor_4',
    email: 'dr.chen@neuroclinic.com',
    role: 'doctor',
    fullName: 'Dr. James Chen',
    specialty: 'neurology',
    clinicName: 'Queens Neurology Associates',
    address: '321 Queens Blvd, Queens, NY',
    zipCode: '11375',
    phone: '555-0104',
    npiNumber: '4444444444',
    licenseNumber: 'NY345678',
    insuranceAccepted: ['Medicaid', 'Medicare', 'Private'],
    languages: ['English', 'Mandarin', 'Cantonese'],
    bio: 'Neurologist with expertise in headache and seizure disorders'
  },
  {
    id: 'doctor_5',
    email: 'dr.rodriguez@familycare.com',
    role: 'doctor',
    fullName: 'Dr. Maria Rodriguez',
    specialty: 'primary_care',
    clinicName: 'Bronx Family Care',
    address: '555 Grand Concourse, Bronx, NY',
    zipCode: '10451',
    phone: '555-0105',
    npiNumber: '3333333333',
    licenseNumber: 'NY901234',
    insuranceAccepted: ['Medicaid', 'Medicare', 'Uninsured', 'Private'],
    languages: ['English', 'Spanish', 'Portuguese'],
    bio: 'Bilingual family physician serving diverse communities'
  }
];

// ============================================
// DEMO PATIENTS
// ============================================

export const DEMO_PATIENTS = [
  {
    id: 'patient_1',
    email: 'sarah.martinez@email.com',
    role: 'patient',
    fullName: 'Sarah Martinez',
    dateOfBirth: new Date('1985-06-15'),
    phone: '555-1001',
    address: '100 First Ave, New York, NY',
    zipCode: '10009',
    symptoms: 'Chest pain and shortness of breath when climbing stairs',
    medicalCondition: 'Possible cardiac issue',
    urgencyLevel: 8,
    aiUrgencyScore: 8,
    specialty: 'cardiology',
    insurance: 'Medicaid',
    transportation: 'Public transit',
    language: 'Spanish',
    income: 'Low',
    waitTimeDays: 18,
    registeredAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), // 18 days ago
    lastMatchedAt: null,
    totalMatches: 0
  },
  {
    id: 'patient_2',
    email: 'john.wilson@email.com',
    role: 'patient',
    fullName: 'John Wilson',
    dateOfBirth: new Date('1950-03-22'),
    phone: '555-1002',
    address: '200 Oak Street, Brooklyn, NY',
    zipCode: '11201',
    symptoms: 'Persistent cough and fatigue',
    medicalCondition: 'Chronic respiratory symptoms',
    urgencyLevel: 5,
    aiUrgencyScore: 6,
    specialty: 'primary_care',
    insurance: 'Medicare',
    transportation: 'Limited',
    language: 'English',
    income: 'Low',
    waitTimeDays: 22,
    registeredAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
    lastMatchedAt: null,
    totalMatches: 0
  },
  {
    id: 'patient_3',
    email: 'lisa.thompson@email.com',
    role: 'patient',
    fullName: 'Lisa Thompson',
    dateOfBirth: new Date('1975-11-08'),
    phone: '555-1003',
    address: '300 Elm Ave, Queens, NY',
    zipCode: '11375',
    symptoms: 'Severe headaches and vision problems',
    medicalCondition: 'Neurological symptoms',
    urgencyLevel: 7,
    aiUrgencyScore: 7,
    specialty: 'neurology',
    insurance: 'Uninsured',
    transportation: 'Bus',
    language: 'English',
    income: 'Low',
    waitTimeDays: 12,
    registeredAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    lastMatchedAt: null,
    totalMatches: 0
  },
  {
    id: 'patient_4',
    email: 'robert.kim@email.com',
    role: 'patient',
    fullName: 'Robert Kim',
    dateOfBirth: new Date('1968-07-30'),
    phone: '555-1004',
    address: '400 Pine Road, New York, NY',
    zipCode: '10021',
    symptoms: 'Knee pain and difficulty walking',
    medicalCondition: 'Joint pain',
    urgencyLevel: 4,
    aiUrgencyScore: 4,
    specialty: 'orthopedics',
    insurance: 'Commercial PPO',
    transportation: 'Personal vehicle',
    language: 'English',
    income: 'Medium',
    waitTimeDays: 5,
    registeredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    lastMatchedAt: null,
    totalMatches: 0
  },
  {
    id: 'patient_5',
    email: 'maria.garcia@email.com',
    role: 'patient',
    fullName: 'Maria Garcia',
    dateOfBirth: new Date('1990-02-14'),
    phone: '555-1005',
    address: '500 Maple St, Bronx, NY',
    zipCode: '10451',
    symptoms: 'High blood pressure and dizziness',
    medicalCondition: 'Hypertension',
    urgencyLevel: 6,
    aiUrgencyScore: 7,
    specialty: 'primary_care',
    insurance: 'Medicaid',
    transportation: 'Community shuttle',
    language: 'Spanish',
    income: 'Low',
    waitTimeDays: 15,
    registeredAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    lastMatchedAt: null,
    totalMatches: 0
  },
  {
    id: 'patient_6',
    email: 'david.brown@email.com',
    role: 'patient',
    fullName: 'David Brown',
    dateOfBirth: new Date('1955-09-19'),
    phone: '555-1006',
    address: '600 Cedar Lane, Brooklyn, NY',
    zipCode: '11201',
    symptoms: 'Chest discomfort and palpitations',
    medicalCondition: 'Cardiac symptoms',
    urgencyLevel: 9,
    aiUrgencyScore: 9,
    specialty: 'cardiology',
    insurance: 'Medicare',
    transportation: 'Family driver',
    language: 'English',
    income: 'Medium',
    waitTimeDays: 3,
    registeredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    lastMatchedAt: null,
    totalMatches: 0
  }
];

// ============================================
// GENERATE APPOINTMENTS
// ============================================

/**
 * Generate appointment slots for the next N days
 * @param {Object} doctor - Doctor data
 * @param {number} daysAhead - Number of days to generate
 * @returns {Array} Array of appointment objects
 */
const generateAppointmentsForDoctor = (doctor, daysAhead = 14) => {
  const appointments = [];
  const times = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];

  for (let day = 1; day <= daysAhead; day++) {
    // Skip weekends
    const date = new Date();
    date.setDate(date.getDate() + day);
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip Sunday (0) and Saturday (6)

    // Generate 3-5 random slots per day
    const slotsPerDay = Math.floor(Math.random() * 3) + 3;
    const shuffledTimes = times.sort(() => 0.5 - Math.random());

    for (let i = 0; i < slotsPerDay; i++) {
      appointments.push({
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        clinicName: doctor.clinicName,
        specialty: doctor.specialty,
        date: Timestamp.fromDate(date),
        time: shuffledTimes[i],
        duration: 30,
        address: doctor.address,
        zipCode: doctor.zipCode,
        city: 'New York',
        state: 'NY',
        insuranceAccepted: doctor.insuranceAccepted,
        languagesOffered: doctor.languages,
        wheelchairAccessible: Math.random() > 0.3, // 70% wheelchair accessible
        publicTransitNearby: Math.random() > 0.2 // 80% near public transit
      });
    }
  }

  return appointments;
};

// ============================================
// SEEDING FUNCTIONS
// ============================================

/**
 * Seed doctors into Firestore
 * @returns {Promise<void>}
 */
export const seedDoctors = async () => {
  console.log('🩺 Seeding doctors...');

  for (const doctor of DEMO_DOCTORS) {
    try {
      await saveUserProfile(doctor.id, doctor);
      console.log(`✅ Created doctor: ${doctor.fullName}`);
    } catch (error) {
      console.error(`❌ Error creating doctor ${doctor.fullName}:`, error);
    }
  }

  console.log(`✅ Seeded ${DEMO_DOCTORS.length} doctors`);
};

/**
 * Seed patients into Firestore
 * @returns {Promise<void>}
 */
export const seedPatients = async () => {
  console.log('👥 Seeding patients...');

  for (const patient of DEMO_PATIENTS) {
    try {
      await saveUserProfile(patient.id, {
        ...patient,
        registeredAt: Timestamp.fromDate(patient.registeredAt),
        dateOfBirth: Timestamp.fromDate(patient.dateOfBirth)
      });
      console.log(`✅ Created patient: ${patient.fullName}`);
    } catch (error) {
      console.error(`❌ Error creating patient ${patient.fullName}:`, error);
    }
  }

  console.log(`✅ Seeded ${DEMO_PATIENTS.length} patients`);
};

/**
 * Seed appointments into Firestore
 * @param {number} daysAhead - Days to generate appointments for
 * @returns {Promise<Array>} Array of created appointment IDs
 */
export const seedAppointments = async (daysAhead = 14) => {
  console.log('📅 Seeding appointments...');

  const createdAppointments = [];

  for (const doctor of DEMO_DOCTORS) {
    const appointments = generateAppointmentsForDoctor(doctor, daysAhead);

    for (const appointment of appointments) {
      try {
        const appointmentId = await createAppointment(doctor.id, appointment);
        createdAppointments.push(appointmentId);
      } catch (error) {
        console.error(`❌ Error creating appointment for ${doctor.fullName}:`, error);
      }
    }

    console.log(`✅ Created ${appointments.length} appointments for ${doctor.fullName}`);
  }

  console.log(`✅ Seeded ${createdAppointments.length} total appointments`);
  return createdAppointments;
};

/**
 * Seed complete demo dataset
 * @returns {Promise<Object>} Summary of seeded data
 */
export const seedAllDemoData = async () => {
  console.log('🌱 Starting complete data seeding...\n');

  const startTime = Date.now();

  try {
    // Seed doctors
    await seedDoctors();
    console.log('');

    // Seed patients
    await seedPatients();
    console.log('');

    // Seed appointments
    const appointmentIds = await seedAppointments(14);
    console.log('');

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    const summary = {
      success: true,
      doctorsSeeded: DEMO_DOCTORS.length,
      patientsSeeded: DEMO_PATIENTS.length,
      appointmentsSeeded: appointmentIds.length,
      duration: `${duration}s`
    };

    console.log('✅ SEEDING COMPLETE!');
    console.log('📊 Summary:', summary);

    return summary;
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
};

/**
 * Create a demo match (for testing)
 * @param {string} patientId - Patient ID
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise<string>} Match ID
 */
export const createDemoMatch = async (patientId, appointmentId) => {
  try {
    // Get patient and appointment data
    const patient = DEMO_PATIENTS.find(p => p.id === patientId);
    const doctor = DEMO_DOCTORS[0]; // Use first doctor for demo

    // Create mock appointment data
    const appointment = {
      id: appointmentId,
      zipCode: doctor.zipCode,
      insuranceAccepted: doctor.insuranceAccepted
    };

    // Calculate scores
    const scores = calculateMatchScore(patient, appointment);

    // Create match
    const matchId = await createMatch(patientId, appointmentId, scores);

    // Create notification
    await createNotification(patientId, {
      type: 'match_found',
      title: 'New Appointment Match!',
      message: `We found a ${scores.priorityTier === 1 ? 'high-priority ' : ''}match with ${doctor.fullName} at ${doctor.clinicName}`,
      priority: scores.priorityTier <= 2 ? 'high' : 'medium',
      relatedMatchId: matchId,
      actionRequired: true,
      actionUrl: `/matches/${matchId}`
    });

    console.log(`✅ Created demo match: ${matchId}`);
    return matchId;
  } catch (error) {
    console.error('❌ Error creating demo match:', error);
    throw error;
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Clear all demo data (careful!)
 * Note: This requires admin SDK or manual deletion in Firestore Console
 */
export const clearDemoDataInstructions = () => {
  console.log(`
⚠️  TO CLEAR DEMO DATA:

1. Go to Firebase Console: https://console.firebase.google.com/
2. Navigate to Firestore Database
3. Delete collections:
   - users (doctor_* and patient_* documents)
   - appointments (all documents)
   - matches (all documents)
   - notifications (all documents)

Or use Firebase Admin SDK with batch deletes (requires backend implementation).
  `);
};

/**
 * Get summary of seeded data
 */
export const getSeedDataSummary = () => {
  return {
    doctors: DEMO_DOCTORS.length,
    doctorsList: DEMO_DOCTORS.map(d => ({
      id: d.id,
      name: d.fullName,
      specialty: d.specialty,
      clinic: d.clinicName
    })),
    patients: DEMO_PATIENTS.length,
    patientsList: DEMO_PATIENTS.map(p => ({
      id: p.id,
      name: p.fullName,
      specialty: p.specialty,
      urgency: p.urgencyLevel,
      waitDays: p.waitTimeDays,
      insurance: p.insurance,
      transport: p.transportation
    })),
    appointmentsPerDoctor: '~50 (over 14 days)',
    totalAppointmentsEstimate: DEMO_DOCTORS.length * 50
  };
};
