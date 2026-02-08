/**
 * Create Test Accounts for Development
 * Creates test patient and doctor accounts with appointments
 *
 * Usage: Call from login page or console
 */

import { registerPatient, registerDoctor } from '../services/auth'
import { createAppointment, createMatch, createNotification } from '../services/database'
import { Timestamp } from 'firebase/firestore'

export const createTestPatientAccount = async () => {
  try {
    console.log('🔨 Creating test patient account...')

    // Test patient credentials
    const email = 'test.patient@medimatch.com'
    const password = 'test123'

    // Patient data
    const patientData = {
      fullName: 'Test Patient',
      dateOfBirth: new Date('1990-01-15'),
      phone: '555-TEST-001',
      address: '123 Test Street, New York, NY',
      zipCode: '10001',
      symptoms: 'Chest pain, shortness of breath, dizziness',
      medicalCondition: 'Suspected cardiac issue',
      urgencyLevel: 8,
      aiUrgencyScore: 8,
      triageLevel: 2,
      specialty: 'cardiology',
      insurance: 'Medicaid',
      transportation: 'Ambulance',
      language: 'English',
      income: 'Low',
      waitTimeDays: 0
    }

    // Create the patient account
    const { user, patientId } = await registerPatient(email, password, patientData)
    console.log('✅ Test patient created:', patientId)
    console.log('📧 Email:', email)
    console.log('🔑 Password:', password)

    // Wait a bit for Firestore to sync
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Create some appointment slots for test doctors
    console.log('🏥 Creating appointment slots for doctors...')

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)

    const appointment1Id = await createAppointment('doctor_1', {
      doctorName: 'Dr. Sarah Jones',
      clinicName: 'City General ER - Cardiac Bay',
      specialty: 'cardiology',
      date: Timestamp.fromDate(tomorrow),
      time: '10:00 AM',
      duration: 45,
      address: '123 Medical Plaza',
      zipCode: '10001',
      city: 'New York',
      state: 'NY',
      insuranceAccepted: ['Medicaid', 'Medicare', 'Private'],
      languagesOffered: ['English', 'Spanish'],
      wheelchairAccessible: true,
      publicTransitNearby: true
    })

    console.log('✅ Appointment slot 1 created:', appointment1Id)

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 500))

    // Create a match between patient and appointment
    console.log('🔗 Creating match for test patient...')

    const matchId = await createMatch(patientId, appointment1Id, {
      totalMatchScore: 95,
      equityScore: 85,
      medicalScore: 95,
      accessScore: 90,
      geographicScore: 88,
      priorityTier: 1,
      reasoningExplanation: 'High priority cardiac patient matched with cardiology specialist. Excellent medical fit and insurance coverage.',
      doctorId: 'doctor_1',
      time: '10:00 AM'
    })

    console.log('✅ Match created:', matchId)

    // Update match to confirmed status
    await new Promise(resolve => setTimeout(resolve, 500))

    const { updateMatchStatus } = await import('../services/database')
    await updateMatchStatus(matchId, 'confirmed')
    console.log('✅ Match confirmed!')

    // Create a notification for the patient
    await createNotification(patientId, {
      type: 'match_confirmed',
      title: 'ER Room Assigned!',
      message: 'You have been assigned to Dr. Sarah Jones at City General ER - Cardiac Bay. Please proceed to your appointment.',
      matchId,
      appointmentId: appointment1Id
    })

    console.log('✅ Notification created!')

    console.log('\n🎉 Test account setup complete!')
    console.log('=' .repeat(50))
    console.log('Login with:')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('=' .repeat(50))

    return {
      email,
      password,
      patientId,
      matchId,
      appointmentId: appointment1Id
    }

  } catch (error) {
    console.error('❌ Error creating test account:', error)

    // If account already exists, provide login info
    if (error.code === 'auth/email-already-in-use') {
      console.log('\n✅ Test account already exists!')
      console.log('Login with:')
      console.log('Email: test.patient@medimatch.com')
      console.log('Password: test123')
      return {
        email: 'test.patient@medimatch.com',
        password: 'test123',
        note: 'Account already exists - use these credentials to login'
      }
    }

    throw error
  }
}

// Export credentials for easy reference
export const TEST_ACCOUNT = {
  email: 'test.patient@medimatch.com',
  password: 'test123'
}

/**
 * Create test doctor account with availability slots and demo data
 */
export const createTestDoctorAccount = async () => {
  try {
    console.log('🔨 Creating test doctor account...')

    // Test doctor credentials
    const email = 'test.doctor@medimatch.com'
    const password = 'test123'

    // Doctor data
    const doctorData = {
      fullName: 'Dr. Test Cardiologist',
      phone: '555-TEST-DOC',
      clinicName: 'Test Medical Center - Cardiac Unit',
      specialty: 'cardiology',
      specialties: ['cardiology'],
      zipCode: '10001',
      city: 'New York',
      state: 'NY',
      address: '123 Test Medical Plaza',
      licenseNumber: 'TEST-MD-12345',
      insuranceAccepted: ['Medicaid', 'Medicare', 'Private', 'Commercial PPO'],
      languages: ['English', 'Spanish'],
      availableSlots: 0,
      totalMatches: 0,
      stats: {
        yearsExperience: 15,
        totalPatients: 2500,
        rating: 4.9
      }
    }

    // Create the doctor account
    const { user, doctorId } = await registerDoctor(email, password, doctorData)
    console.log('✅ Test doctor created:', doctorId)
    console.log('📧 Email:', email)
    console.log('🔑 Password:', password)

    // Wait a bit for Firestore to sync
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Create some appointment slots for the test doctor
    console.log('🏥 Creating appointment slots for test doctor...')

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const slots = [
      { hours: 10, minutes: 0, label: '10:00 AM' },
      { hours: 14, minutes: 0, label: '2:00 PM' },
      { hours: 16, minutes: 30, label: '4:30 PM' }
    ]

    const appointmentIds = []

    for (const slot of slots) {
      const appointmentDate = new Date(tomorrow)
      appointmentDate.setHours(slot.hours, slot.minutes, 0, 0)

      const appointmentId = await createAppointment(doctorId, {
        doctorName: doctorData.fullName,
        clinicName: doctorData.clinicName,
        specialty: 'cardiology',
        date: Timestamp.fromDate(appointmentDate),
        time: slot.label,
        duration: 45,
        address: doctorData.address,
        zipCode: doctorData.zipCode,
        city: doctorData.city,
        state: doctorData.state,
        insuranceAccepted: doctorData.insuranceAccepted,
        languagesOffered: doctorData.languages,
        wheelchairAccessible: true,
        publicTransitNearby: true
      })

      appointmentIds.push(appointmentId)
      console.log(`✅ Appointment slot created: ${slot.label}`)
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    // Create demo patients and matches for the doctor dashboard
    console.log('👥 Creating demo patients and matches...')

    // Create a demo patient for pending match (action item)
    if (appointmentIds.length > 0) {
      try {
        const { saveUserProfile } = await import('../services/database')

        const demoPatientData = {
          role: 'patient',
          fullName: 'John Emergency',
          email: 'john.emergency@demo.com',
          medicalCondition: 'Acute chest pain',
          symptoms: 'Crushing chest pain, shortness of breath, sweating',
          urgencyLevel: 9,
          triageLevel: 2,
          specialty: 'cardiology',
          insurance: 'Medicare',
          transportation: 'Ambulance',
          zipCode: '10001',
          waitTimeDays: 0
        }

        // Save demo patient to Firestore with a predictable ID
        const demoPatientId = `demo-patient-${doctorId}-pending`
        await saveUserProfile(demoPatientId, demoPatientData)
        console.log('✅ Demo patient created in Firestore')

        // Create pending match for action items
        const pendingMatchId = await createMatch(demoPatientId, appointmentIds[0], {
          totalMatchScore: 92,
          equityScore: 88,
          medicalScore: 95,
          accessScore: 90,
          geographicScore: 89,
          priorityTier: 1,
          reasoningExplanation: 'High-priority cardiac patient matched with cardiology specialist.',
          doctorId: doctorId,
          time: slots[0].label
        })
        console.log('✅ Pending match created for action items')
      } catch (err) {
        console.error('Error creating demo patient/match:', err)
        console.log('Note: Action items may not appear')
      }
    }

    // Create patients en route (localStorage)
    const patientsEnRoute = [
      {
        patientId: 'demo-patient-enroute-1',
        patientName: 'Sarah Martinez',
        condition: 'Suspected myocardial infarction',
        priorityTier: 1,
        matchScore: 95,
        doctorId: doctorId,
        doctorName: doctorData.fullName,
        erRoom: 'Cardiac Bay 1',
        estimatedWaitMinutes: 5,
        assignedAt: new Date().toISOString()
      },
      {
        patientId: 'demo-patient-enroute-2',
        patientName: 'Michael Chen',
        condition: 'Arrhythmia evaluation',
        priorityTier: 2,
        matchScore: 87,
        doctorId: doctorId,
        doctorName: doctorData.fullName,
        erRoom: 'Cardiac Bay 2',
        estimatedWaitMinutes: 15,
        assignedAt: new Date().toISOString()
      }
    ]

    localStorage.setItem('demoMatches', JSON.stringify(patientsEnRoute))
    console.log('✅ Created 2 patients en route')

    // Create scheduled appointments (localStorage)
    const scheduledAppointments = [
      {
        patientId: 'demo-patient-scheduled-1',
        patientName: 'Emma Johnson',
        condition: 'Follow-up: Post-MI care',
        doctorId: doctorId,
        doctorName: doctorData.fullName,
        clinicName: doctorData.clinicName,
        time: '11:30 AM',
        roomType: 'Consultation Room A',
        erRoom: 'Consultation Room A',
        address: doctorData.address,
        bookedAt: new Date().toISOString()
      },
      {
        patientId: 'demo-patient-scheduled-2',
        patientName: 'Robert Williams',
        condition: 'Hypertension management',
        doctorId: doctorId,
        doctorName: doctorData.fullName,
        clinicName: doctorData.clinicName,
        time: '3:15 PM',
        roomType: 'Consultation Room B',
        erRoom: 'Consultation Room B',
        address: doctorData.address,
        bookedAt: new Date().toISOString()
      }
    ]

    localStorage.setItem('demoBookings', JSON.stringify(scheduledAppointments))
    console.log('✅ Created 2 scheduled appointments')

    console.log('\n🎉 Test doctor account setup complete!')
    console.log('=' .repeat(50))
    console.log('Login with:')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('=' .repeat(50))
    console.log(`Created ${appointmentIds.length} appointment slots`)
    console.log(`Created ${patientsEnRoute.length} patients en route`)
    console.log(`Created ${scheduledAppointments.length} scheduled appointments`)
    console.log('Created 1 pending match (action item)')

    return {
      email,
      password,
      doctorId,
      appointmentIds
    }

  } catch (error) {
    console.error('❌ Error creating test doctor account:', error)

    // If account already exists, provide login info
    if (error.code === 'auth/email-already-in-use') {
      console.log('\n✅ Test doctor account already exists!')
      console.log('Login with:')
      console.log('Email: test.doctor@medimatch.com')
      console.log('Password: test123')

      // Still create the demo data even if account exists
      const patientsEnRoute = [
        {
          patientId: 'demo-patient-enroute-1',
          patientName: 'Sarah Martinez',
          condition: 'Suspected myocardial infarction',
          priorityTier: 1,
          matchScore: 95,
          doctorId: 'test-doctor-id',
          doctorName: 'Dr. Test Cardiologist',
          erRoom: 'Cardiac Bay 1',
          estimatedWaitMinutes: 5,
          assignedAt: new Date().toISOString()
        },
        {
          patientId: 'demo-patient-enroute-2',
          patientName: 'Michael Chen',
          condition: 'Arrhythmia evaluation',
          priorityTier: 2,
          matchScore: 87,
          doctorId: 'test-doctor-id',
          doctorName: 'Dr. Test Cardiologist',
          erRoom: 'Cardiac Bay 2',
          estimatedWaitMinutes: 15,
          assignedAt: new Date().toISOString()
        }
      ]

      const scheduledAppointments = [
        {
          patientId: 'demo-patient-scheduled-1',
          patientName: 'Emma Johnson',
          condition: 'Follow-up: Post-MI care',
          doctorId: 'test-doctor-id',
          doctorName: 'Dr. Test Cardiologist',
          clinicName: 'Test Medical Center - Cardiac Unit',
          time: '11:30 AM',
          roomType: 'Consultation Room A',
          erRoom: 'Consultation Room A',
          address: '123 Test Medical Plaza',
          bookedAt: new Date().toISOString()
        },
        {
          patientId: 'demo-patient-scheduled-2',
          patientName: 'Robert Williams',
          condition: 'Hypertension management',
          doctorId: 'test-doctor-id',
          doctorName: 'Dr. Test Cardiologist',
          clinicName: 'Test Medical Center - Cardiac Unit',
          time: '3:15 PM',
          roomType: 'Consultation Room B',
          erRoom: 'Consultation Room B',
          address: '123 Test Medical Plaza',
          bookedAt: new Date().toISOString()
        }
      ]

      localStorage.setItem('demoMatches', JSON.stringify(patientsEnRoute))
      localStorage.setItem('demoBookings', JSON.stringify(scheduledAppointments))
      console.log('✅ Created demo data for existing account')

      return {
        email: 'test.doctor@medimatch.com',
        password: 'test123',
        note: 'Account already exists - use these credentials to login'
      }
    }

    throw error
  }
}

export const TEST_DOCTOR_ACCOUNT = {
  email: 'test.doctor@medimatch.com',
  password: 'test123'
}
