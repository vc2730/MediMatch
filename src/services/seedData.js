/**
 * MediMatch Demo Data Seeding
 * Populate Firestore with realistic test data for demos and development
 */

import { Timestamp, collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import {
  saveUserProfile,
  createAppointment,
  createMatch,
  createNotification
} from './database';
import { calculateMatchScore } from './matching';
import { db } from '../firebase/config';

// ============================================
// DEMO ER ROOMS / PROVIDERS
// ============================================

export const DEMO_DOCTORS = [
  {
    id: 'doctor_1',
    email: 'dr.jones@ercentral.com',
    role: 'doctor',
    fullName: 'Dr. Sarah Jones',
    specialty: 'cardiology',
    clinicName: 'City General ER - Cardiac Bay',
    address: '123 Medical Plaza, New York, NY',
    zipCode: '10001',
    phone: '555-0101',
    npiNumber: '1234567890',
    licenseNumber: 'NY123456',
    insuranceAccepted: ['Medicaid', 'Medicare', 'Private', 'Commercial PPO', 'Uninsured'],
    languages: ['English', 'Spanish'],
    bio: 'Emergency cardiologist - Cardiac arrest, MI, arrhythmia',
    erRoom: 'Trauma Bay 1',
    erCapacity: 3,
    avgTreatmentMinutes: 45
  },
  {
    id: 'doctor_2',
    email: 'dr.smith@ercentral.com',
    role: 'doctor',
    fullName: 'Dr. Michael Smith',
    specialty: 'primary_care',
    clinicName: 'City General ER - General Wing',
    address: '456 Main St, Brooklyn, NY',
    zipCode: '11201',
    phone: '555-0102',
    npiNumber: '9876543210',
    licenseNumber: 'NY654321',
    insuranceAccepted: ['Medicaid', 'Medicare', 'Uninsured', 'Private'],
    languages: ['English', 'Chinese', 'Spanish'],
    bio: 'General emergency medicine - minor injuries, infections, pain',
    erRoom: 'Room 4B',
    erCapacity: 4,
    avgTreatmentMinutes: 30
  },
  {
    id: 'doctor_3',
    email: 'dr.patel@ercentral.com',
    role: 'doctor',
    fullName: 'Dr. Priya Patel',
    specialty: 'orthopedics',
    clinicName: 'City General ER - Trauma Center',
    address: '789 Park Avenue, New York, NY',
    zipCode: '10021',
    phone: '555-0103',
    npiNumber: '5555555555',
    licenseNumber: 'NY789012',
    insuranceAccepted: ['Medicare', 'Private', 'Commercial PPO', 'Uninsured'],
    languages: ['English', 'Hindi', 'Gujarati'],
    bio: 'Trauma surgery - fractures, lacerations, orthopedic emergencies',
    erRoom: 'Trauma Bay 2',
    erCapacity: 2,
    avgTreatmentMinutes: 60
  },
  {
    id: 'doctor_4',
    email: 'dr.chen@ercentral.com',
    role: 'doctor',
    fullName: 'Dr. James Chen',
    specialty: 'neurology',
    clinicName: 'Brooklyn Medical ER - Neuro Unit',
    address: '321 Queens Blvd, Queens, NY',
    zipCode: '11375',
    phone: '555-0104',
    npiNumber: '4444444444',
    licenseNumber: 'NY345678',
    insuranceAccepted: ['Medicaid', 'Medicare', 'Private', 'Uninsured'],
    languages: ['English', 'Mandarin', 'Cantonese'],
    bio: 'Neurological emergencies - stroke, seizure, head trauma',
    erRoom: 'Neuro Suite A',
    erCapacity: 2,
    avgTreatmentMinutes: 50
  },
  {
    id: 'doctor_5',
    email: 'dr.rodriguez@ercentral.com',
    role: 'doctor',
    fullName: 'Dr. Maria Rodriguez',
    specialty: 'primary_care',
    clinicName: 'Bronx Community ER',
    address: '555 Grand Concourse, Bronx, NY',
    zipCode: '10451',
    phone: '555-0105',
    npiNumber: '3333333333',
    licenseNumber: 'NY901234',
    insuranceAccepted: ['Medicaid', 'Medicare', 'Uninsured', 'Private'],
    languages: ['English', 'Spanish', 'Portuguese'],
    bio: 'Bilingual ER physician - pediatric and adult emergencies',
    erRoom: 'Room 7',
    erCapacity: 3,
    avgTreatmentMinutes: 35
  }
];

// ============================================
// DEMO PATIENTS
// ============================================

export const DEMO_PATIENTS = [
  {
    // HIGH PRIORITY: Critical cardiac + equity barriers → expected score ~95
    id: 'patient_1',
    email: 'sarah.martinez@email.com',
    role: 'patient',
    fullName: 'Sarah Martinez',
    dateOfBirth: new Date('1985-06-15'),
    phone: '555-1001',
    address: '100 First Ave, New York, NY',
    zipCode: '10009',
    symptoms: 'Crushing chest pain radiating to left arm, diaphoresis, nausea for 2 hours',
    medicalCondition: 'Suspected acute myocardial infarction',
    urgencyLevel: 10,
    aiUrgencyScore: 10,
    triageLevel: 1, // ESI Level 1 - Immediate
    specialty: 'cardiology',
    insurance: 'Medicaid',
    transportation: 'Limited',
    language: 'Spanish',
    income: 'Low',
    waitTimeDays: 0,
    arrivalTime: new Date(Date.now() - 5 * 60 * 1000), // arrived 5 min ago
    registeredAt: new Date(Date.now() - 5 * 60 * 1000),
    lastMatchedAt: null,
    totalMatches: 0
  },
  {
    // HIGH PRIORITY: Stroke symptoms + uninsured → expected score ~88
    id: 'patient_2',
    email: 'james.okafor@email.com',
    role: 'patient',
    fullName: 'James Okafor',
    dateOfBirth: new Date('1962-08-11'),
    phone: '555-1002',
    address: '210 Flatbush Ave, Brooklyn, NY',
    zipCode: '11217',
    symptoms: 'Sudden facial drooping, slurred speech, left arm weakness — onset 45 minutes ago',
    medicalCondition: 'Acute ischemic stroke (FAST positive)',
    urgencyLevel: 10,
    aiUrgencyScore: 10,
    triageLevel: 1, // ESI Level 1 - Immediate
    specialty: 'neurology',
    insurance: 'Uninsured',
    transportation: 'Ambulance',
    language: 'English',
    income: 'Low',
    waitTimeDays: 0,
    arrivalTime: new Date(Date.now() - 8 * 60 * 1000),
    registeredAt: new Date(Date.now() - 8 * 60 * 1000),
    lastMatchedAt: null,
    totalMatches: 0
  },
  {
    // HIGH PRIORITY: Severe trauma + Medicaid → expected score ~82
    id: 'patient_3',
    email: 'elena.vasquez@email.com',
    role: 'patient',
    fullName: 'Elena Vasquez',
    dateOfBirth: new Date('1998-03-22'),
    phone: '555-1003',
    address: '45 Southern Blvd, Bronx, NY',
    zipCode: '10451',
    symptoms: 'Open fracture right tibia from bicycle accident, significant blood loss',
    medicalCondition: 'Compound leg fracture with hemorrhage',
    urgencyLevel: 9,
    aiUrgencyScore: 9,
    triageLevel: 2, // ESI Level 2 - Emergent
    specialty: 'orthopedics',
    insurance: 'Medicaid',
    transportation: 'Public transit',
    language: 'Spanish',
    income: 'Low',
    waitTimeDays: 0,
    arrivalTime: new Date(Date.now() - 12 * 60 * 1000),
    registeredAt: new Date(Date.now() - 12 * 60 * 1000),
    lastMatchedAt: null,
    totalMatches: 0
  },
  {
    // MID-HIGH: Seizure + language barrier → expected score ~72
    id: 'patient_4',
    email: 'wei.zhang@email.com',
    role: 'patient',
    fullName: 'Wei Zhang',
    dateOfBirth: new Date('1978-11-30'),
    phone: '555-1004',
    address: '88 Mott Street, New York, NY',
    zipCode: '10013',
    symptoms: 'First-time seizure, post-ictal state, no previous history, confused',
    medicalCondition: 'New onset seizure disorder',
    urgencyLevel: 8,
    aiUrgencyScore: 8,
    triageLevel: 2, // ESI Level 2 - Emergent
    specialty: 'neurology',
    insurance: 'Medicare',
    transportation: 'Family driver',
    language: 'Mandarin',
    income: 'Low',
    waitTimeDays: 0,
    arrivalTime: new Date(Date.now() - 20 * 60 * 1000),
    registeredAt: new Date(Date.now() - 20 * 60 * 1000),
    lastMatchedAt: null,
    totalMatches: 0
  },
  {
    // MID: Severe abdominal pain + wait time → expected score ~61
    id: 'patient_5',
    email: 'michael.brown@email.com',
    role: 'patient',
    fullName: 'Michael Brown',
    dateOfBirth: new Date('1955-07-04'),
    phone: '555-1005',
    address: '312 Atlantic Ave, Brooklyn, NY',
    zipCode: '11201',
    symptoms: 'Severe abdominal pain, vomiting, fever 102°F, possible appendicitis',
    medicalCondition: 'Acute abdomen - rule out appendicitis',
    urgencyLevel: 7,
    aiUrgencyScore: 7,
    triageLevel: 2, // ESI Level 2 - Emergent
    specialty: 'primary_care',
    insurance: 'Medicare',
    transportation: 'Public transit',
    language: 'English',
    income: 'Low',
    waitTimeDays: 1,
    arrivalTime: new Date(Date.now() - 35 * 60 * 1000),
    registeredAt: new Date(Date.now() - 35 * 60 * 1000),
    lastMatchedAt: null,
    totalMatches: 0
  },
  {
    // MID: Asthma attack + uninsured → expected score ~58
    id: 'patient_6',
    email: 'amara.diallo@email.com',
    role: 'patient',
    fullName: 'Amara Diallo',
    dateOfBirth: new Date('2005-01-15'),
    phone: '555-1006',
    address: '720 Lenox Ave, New York, NY',
    zipCode: '10039',
    symptoms: 'Severe asthma attack, O2 sat 88%, not responding to inhaler',
    medicalCondition: 'Acute asthma exacerbation',
    urgencyLevel: 7,
    aiUrgencyScore: 8,
    triageLevel: 2,
    specialty: 'primary_care',
    insurance: 'Uninsured',
    transportation: 'Public transit',
    language: 'French',
    income: 'Low',
    waitTimeDays: 0,
    arrivalTime: new Date(Date.now() - 18 * 60 * 1000),
    registeredAt: new Date(Date.now() - 18 * 60 * 1000),
    lastMatchedAt: null,
    totalMatches: 0
  },
  {
    // MID-LOW: Deep laceration + moderate wait → expected score ~45
    id: 'patient_7',
    email: 'david.kim@email.com',
    role: 'patient',
    fullName: 'David Kim',
    dateOfBirth: new Date('1990-05-20'),
    phone: '555-1007',
    address: '400 Pine Road, New York, NY',
    zipCode: '10021',
    symptoms: '4cm laceration on forearm requiring sutures, controlled bleeding',
    medicalCondition: 'Laceration requiring sutures',
    urgencyLevel: 5,
    aiUrgencyScore: 5,
    triageLevel: 3, // ESI Level 3 - Urgent
    specialty: 'orthopedics',
    insurance: 'Commercial PPO',
    transportation: 'Personal vehicle',
    language: 'English',
    income: 'High',
    waitTimeDays: 0,
    arrivalTime: new Date(Date.now() - 45 * 60 * 1000),
    registeredAt: new Date(Date.now() - 45 * 60 * 1000),
    lastMatchedAt: null,
    totalMatches: 0
  },
  {
    // LOW: Sprained ankle + good insurance → expected score ~28
    id: 'patient_8',
    email: 'jennifer.walsh@email.com',
    role: 'patient',
    fullName: 'Jennifer Walsh',
    dateOfBirth: new Date('1995-09-12'),
    phone: '555-1008',
    address: '55 W 72nd St, New York, NY',
    zipCode: '10023',
    symptoms: 'Twisted ankle while running, mild swelling, can bear weight',
    medicalCondition: 'Suspected ankle sprain',
    urgencyLevel: 3,
    aiUrgencyScore: 2,
    triageLevel: 4, // ESI Level 4 - Less Urgent
    specialty: 'orthopedics',
    insurance: 'Private',
    transportation: 'Personal vehicle',
    language: 'English',
    income: 'High',
    waitTimeDays: 0,
    arrivalTime: new Date(Date.now() - 60 * 60 * 1000),
    registeredAt: new Date(Date.now() - 60 * 60 * 1000),
    lastMatchedAt: null,
    totalMatches: 0
  }
];

// ============================================
// GENERATE APPOINTMENTS
// ============================================

/**
 * Generate ER room availability slots
 * @param {Object} doctor - ER provider/room data
 * @param {number} slots - Number of availability slots to generate
 * @returns {Array} Array of ER room slot objects
 */
const generateAppointmentsForDoctor = (doctor, slots = 8) => {
  const appointments = [];
  const now = new Date();

  for (let i = 0; i < slots; i++) {
    // Generate slots spread over the next few hours
    const slotTime = new Date(now.getTime() + i * 15 * 60 * 1000); // 15-min intervals
    const estimatedWaitMinutes = i * 15;

    appointments.push({
      doctorId: doctor.id,
      doctorName: doctor.fullName,
      clinicName: doctor.clinicName,
      specialty: doctor.specialty,
      date: Timestamp.fromDate(slotTime),
      time: slotTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      duration: doctor.avgTreatmentMinutes || 30,
      address: doctor.address,
      zipCode: doctor.zipCode,
      city: 'New York',
      state: 'NY',
      insuranceAccepted: doctor.insuranceAccepted,
      languagesOffered: doctor.languages,
      wheelchairAccessible: true, // ER rooms are always accessible
      publicTransitNearby: Math.random() > 0.2,
      erRoom: doctor.erRoom,
      estimatedWaitMinutes,
      roomType: doctor.specialty === 'cardiology' ? 'Cardiac Bay' :
                doctor.specialty === 'neurology' ? 'Neuro Suite' :
                doctor.specialty === 'orthopedics' ? 'Trauma Bay' : 'General ER Room',
      currentCapacity: Math.floor(Math.random() * doctor.erCapacity),
      maxCapacity: doctor.erCapacity
    });
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
 * Seed ER room availability slots into Firestore
 * @param {number} slotsPerRoom - Number of slots to generate per ER room
 * @returns {Promise<Array>} Array of created slot IDs
 */
export const seedAppointments = async (slotsPerRoom = 8) => {
  console.log('🏥 Seeding ER room availability...');

  const createdAppointments = [];

  for (const doctor of DEMO_DOCTORS) {
    const appointments = generateAppointmentsForDoctor(doctor, slotsPerRoom);

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

    // Seed ER room availability slots
    const appointmentIds = await seedAppointments(8);
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

/**
 * Clear demo data from Firestore (best-effort)
 * Deletes demo doctors/patients, their appointments, matches, and notifications.
 */
export const clearDemoData = async () => {
  console.log('🧹 Clearing demo data...');

  const doctorIds = DEMO_DOCTORS.map((d) => d.id);
  const patientIds = DEMO_PATIENTS.map((p) => p.id);

  const deleteDocsByIds = async (collectionName, ids) => {
    const batch = writeBatch(db);
    ids.forEach((id) => batch.delete(doc(db, collectionName, id)));
    await batch.commit();
  };

  const deleteByQuery = async (q) => {
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;
    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
    await batch.commit();
  };

  try {
    // Delete users
    await deleteDocsByIds('users', [...doctorIds, ...patientIds]);

    // Delete appointments by doctorId
    for (let i = 0; i < doctorIds.length; i += 10) {
      const batchIds = doctorIds.slice(i, i + 10);
      const q = query(collection(db, 'appointments'), where('doctorId', 'in', batchIds));
      await deleteByQuery(q);
    }

    // Delete matches by patientId
    for (let i = 0; i < patientIds.length; i += 10) {
      const batchIds = patientIds.slice(i, i + 10);
      const q = query(collection(db, 'matches'), where('patientId', 'in', batchIds));
      await deleteByQuery(q);
    }

    // Delete notifications by userId
    const notificationIds = [...doctorIds, ...patientIds];
    for (let i = 0; i < notificationIds.length; i += 10) {
      const batchIds = notificationIds.slice(i, i + 10);
      const q = query(collection(db, 'notifications'), where('userId', 'in', batchIds));
      await deleteByQuery(q);
    }

    console.log('✅ Demo data cleared');
    return { success: true };
  } catch (error) {
    console.error('❌ Error clearing demo data:', error);
    return { success: false, error: error.message };
  }
};
