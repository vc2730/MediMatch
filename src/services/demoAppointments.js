/**
 * Demo ER Room Availability
 * Creates local ER room slots if Firestore is empty
 */

import { Timestamp } from 'firebase/firestore';

const DEMO_ER_ROOMS = [
  {
    id: 'doctor_1',
    name: 'Dr. Sarah Jones',
    specialty: 'cardiology',
    clinic: 'City General ER - Cardiac Bay',
    address: '123 Medical Plaza, New York, NY 10001',
    zip: '10001',
    erRoom: 'Trauma Bay 1',
    avgTreatmentMinutes: 45,
    insuranceAccepted: ['Medicaid', 'Medicare', 'Private', 'Commercial PPO', 'Uninsured']
  },
  {
    id: 'doctor_2',
    name: 'Dr. Michael Smith',
    specialty: 'primary_care',
    clinic: 'City General ER - General Wing',
    address: '456 Main St, Brooklyn, NY 11201',
    zip: '11201',
    erRoom: 'Room 4B',
    avgTreatmentMinutes: 30,
    insuranceAccepted: ['Medicaid', 'Medicare', 'Uninsured', 'Private']
  },
  {
    id: 'doctor_3',
    name: 'Dr. Priya Patel',
    specialty: 'orthopedics',
    clinic: 'City General ER - Trauma Center',
    address: '789 Park Avenue, New York, NY 10021',
    zip: '10021',
    erRoom: 'Trauma Bay 2',
    avgTreatmentMinutes: 60,
    insuranceAccepted: ['Medicare', 'Private', 'Commercial PPO', 'Uninsured']
  },
  {
    id: 'doctor_4',
    name: 'Dr. James Chen',
    specialty: 'neurology',
    clinic: 'Brooklyn Medical ER - Neuro Unit',
    address: '321 Queens Blvd, Queens, NY 11375',
    zip: '11375',
    erRoom: 'Neuro Suite A',
    avgTreatmentMinutes: 50,
    insuranceAccepted: ['Medicaid', 'Medicare', 'Private', 'Uninsured']
  },
  {
    id: 'doctor_5',
    name: 'Dr. Maria Rodriguez',
    specialty: 'primary_care',
    clinic: 'Bronx Community ER',
    address: '555 Grand Concourse, Bronx, NY 10451',
    zip: '10451',
    erRoom: 'Room 7',
    avgTreatmentMinutes: 35,
    insuranceAccepted: ['Medicaid', 'Medicare', 'Uninsured', 'Private']
  }
];

/**
 * Generate ER room availability slots
 */
export const generateDemoAppointments = (slotsPerRoom = 6) => {
  const appointments = [];
  let idCounter = 1;
  const now = new Date();

  DEMO_ER_ROOMS.forEach(room => {
    for (let i = 0; i < slotsPerRoom; i++) {
      const slotTime = new Date(now.getTime() + i * 20 * 60 * 1000); // 20-min intervals
      const estimatedWaitMinutes = i * 20;

      appointments.push({
        id: `demo_appt_${idCounter++}`,
        doctorId: room.id,
        doctorName: room.name,
        specialty: room.specialty,
        clinicName: room.clinic,
        address: room.address,
        date: Timestamp.fromDate(slotTime),
        time: slotTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        duration: room.avgTreatmentMinutes,
        status: 'available',
        patientId: null,
        insuranceAccepted: room.insuranceAccepted,
        zipCode: room.zip,
        city: 'New York',
        state: 'NY',
        wheelchairAccessible: true,
        publicTransitNearby: true,
        languagesOffered: ['English', 'Spanish'],
        erRoom: room.erRoom,
        estimatedWaitMinutes,
        roomType: room.specialty === 'cardiology' ? 'Cardiac Bay' :
                  room.specialty === 'neurology' ? 'Neuro Suite' :
                  room.specialty === 'orthopedics' ? 'Trauma Bay' : 'General ER Room'
      });
    }
  });

  return appointments;
};

/**
 * Get demo ER room slots by specialty
 */
export const getDemoAppointmentsBySpecialty = (specialty, limit = 50) => {
  const allSlots = generateDemoAppointments();
  return allSlots
    .filter(slot => slot.specialty === specialty)
    .slice(0, limit);
};

/**
 * Get all demo ER room slots
 */
export const getAllDemoAppointments = (limit = 100) => {
  return generateDemoAppointments().slice(0, limit);
};
