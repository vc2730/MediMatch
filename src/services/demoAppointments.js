/**
 * Demo Appointments Generator
 * Creates local appointments if Firestore is empty
 */

import { Timestamp } from 'firebase/firestore';

const DEMO_DOCTORS = [
  { id: 'doctor_1', name: 'Dr. Sarah Jones', specialty: 'cardiology', clinic: 'City Heart Center', zip: '10001' },
  { id: 'doctor_2', name: 'Dr. Michael Smith', specialty: 'primary_care', clinic: 'Community Health Clinic', zip: '11201' },
  { id: 'doctor_3', name: 'Dr. Priya Patel', specialty: 'orthopedics', clinic: 'Manhattan Orthopedic Center', zip: '10021' },
  { id: 'doctor_4', name: 'Dr. James Chen', specialty: 'neurology', clinic: 'Queens Neurology Associates', zip: '11375' }
];

const TIMES = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];

/**
 * Generate demo appointments for the next N days
 */
export const generateDemoAppointments = (daysAhead = 14) => {
  const appointments = [];
  let idCounter = 1;

  DEMO_DOCTORS.forEach(doctor => {
    for (let day = 1; day <= daysAhead; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);
      const dayOfWeek = date.getDay();

      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      // Generate 2-3 slots per day per doctor
      const slotsPerDay = Math.floor(Math.random() * 2) + 2;

      for (let i = 0; i < slotsPerDay; i++) {
        const time = TIMES[Math.floor(Math.random() * TIMES.length)];

        appointments.push({
          id: `demo_appt_${idCounter++}`,
          doctorId: doctor.id,
          doctorName: doctor.name,
          specialty: doctor.specialty,
          clinicName: doctor.clinic,
          date: Timestamp.fromDate(date),
          time: time,
          duration: 30,
          status: 'available',
          patientId: null,
          insuranceAccepted: ['Medicaid', 'Medicare', 'Private'],
          address: `${doctor.clinic}, NY`,
          zipCode: doctor.zip,
          city: 'New York',
          state: 'NY',
          wheelchairAccessible: Math.random() > 0.3,
          publicTransitNearby: Math.random() > 0.2,
          languagesOffered: ['English']
        });
      }
    }
  });

  return appointments;
};

/**
 * Get demo appointments by specialty
 */
export const getDemoAppointmentsBySpecialty = (specialty, limit = 50) => {
  const allAppointments = generateDemoAppointments();
  return allAppointments
    .filter(apt => apt.specialty === specialty)
    .slice(0, limit);
};

/**
 * Get all demo appointments
 */
export const getAllDemoAppointments = (limit = 100) => {
  const allAppointments = generateDemoAppointments();
  return allAppointments.slice(0, limit);
};
