# MediMatch Firebase Setup Guide 🚀

Complete guide for setting up and using the MediMatch Firebase backend.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Firebase Console Setup](#firebase-console-setup)
3. [Environment Configuration](#environment-configuration)
4. [Seed Demo Data](#seed-demo-data)
5. [Using the Services](#using-the-services)
6. [Integration with Frontend](#integration-with-frontend)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Google account for Firebase
- Firebase CLI (optional): `npm install -g firebase-tools`

### Installation
```bash
# Firebase already installed via: npm install firebase
npm install
```

---

## Firebase Console Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it **"MediMatch"** (or your preferred name)
4. Disable Google Analytics (optional for hackathon)
5. Click "Create project"

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication** > **Get started**
2. Click **Sign-in method** tab
3. Enable **Email/Password** provider
4. Click **Save**

### 3. Create Firestore Database

1. Go to **Firestore Database** > **Create database**
2. **Start in test mode** (for development/hackathon)
   - This allows read/write access without auth (for 30 days)
   - For production, use the security rules in `FIRESTORE_SCHEMA.md`
3. Choose a location (e.g., `us-central1`)
4. Click **Enable**

### 4. Get Firebase Config

1. Go to **Project Settings** (gear icon) > **General**
2. Scroll to **Your apps** section
3. Click **Web** icon (</>)
4. Register app: name it "MediMatch Web"
5. Copy the `firebaseConfig` object

---

## Environment Configuration

### 1. Create `.env` File

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

### 2. Add Firebase Credentials

Open `.env` and add your Firebase config values:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=medimatch-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=medimatch-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=medimatch-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

⚠️ **Important**: Never commit `.env` to git! It's already in `.gitignore`.

### 3. Verify Configuration

```bash
npm run dev
```

Check browser console for Firebase initialization messages.

---

## Seed Demo Data

### Using the Seeding Script

Create a file `scripts/seed.js`:

```javascript
// Import Firebase config to initialize
import '../src/firebase/config.js';
import { seedAllDemoData } from '../src/services/seedData.js';

seedAllDemoData()
  .then((summary) => {
    console.log('Seeding completed:', summary);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
```

Or use from browser console:

```javascript
// In your React app (e.g., in a test page)
import { seedAllDemoData } from './services/seedData';

// Call it
seedAllDemoData();
```

### What Gets Seeded

- **5 Doctors** across specialties:
  - Cardiology
  - Primary Care (2)
  - Orthopedics
  - Neurology

- **6 Patients** with varying:
  - Urgency levels (4-9)
  - Wait times (3-22 days)
  - Insurance types
  - Transportation barriers

- **~250 Appointments** over next 14 days

### Manual Seeding (Firestore Console)

If automated seeding doesn't work, manually create data:

1. Go to Firestore Console
2. Create collections: `users`, `appointments`, `matches`, `notifications`
3. Use data from `src/services/seedData.js` > `DEMO_DOCTORS` and `DEMO_PATIENTS`
4. Copy-paste as JSON documents

---

## Using the Services

### Database Service (`src/services/database.js`)

#### User Management

```javascript
import { getUserProfile, saveUserProfile, updateUserProfile } from './services/database';

// Get user
const user = await getUserProfile('patient_1');

// Create/update user
await saveUserProfile('patient_1', {
  email: 'patient@example.com',
  role: 'patient',
  fullName: 'John Doe',
  // ... other fields
});

// Update specific fields
await updateUserProfile('patient_1', {
  urgencyLevel: 8,
  symptoms: 'Updated symptoms'
});

// Get all patients
const patients = await getAllPatients();

// Get all doctors
const doctors = await getAllDoctors();
```

#### Appointment Management

```javascript
import {
  createAppointment,
  getAvailableAppointments,
  updateAppointmentStatus,
  getDoctorAppointments
} from './services/database';

// Create appointment
const appointmentId = await createAppointment('doctor_1', {
  doctorName: 'Dr. Smith',
  clinicName: 'Clinic Name',
  specialty: 'cardiology',
  date: Timestamp.fromDate(new Date('2024-03-20')),
  time: '2:00 PM',
  duration: 30,
  address: '123 Main St',
  zipCode: '10001',
  insuranceAccepted: ['Medicaid', 'Medicare']
});

// Get available appointments
const appointments = await getAvailableAppointments('cardiology');

// Update status
await updateAppointmentStatus(appointmentId, 'matched', {
  patientId: 'patient_1'
});

// Get doctor's appointments
const doctorAppts = await getDoctorAppointments('doctor_1');
```

#### Match Management

```javascript
import {
  createMatch,
  updateMatchStatus,
  getPatientMatches,
  getDoctorMatches
} from './services/database';

// Create match (usually done by matching algorithm)
const matchId = await createMatch('patient_1', 'appt_1', {
  urgencyScore: 8,
  equityScore: 75,
  totalMatchScore: 85,
  priorityTier: 1,
  reasoningExplanation: 'High urgency with barriers...'
});

// Update match status
await updateMatchStatus(matchId, 'confirmed');

// Get patient's matches
const patientMatches = await getPatientMatches('patient_1');

// Get doctor's matches
const doctorMatches = await getDoctorMatches('doctor_1');
```

#### Real-Time Listeners

```javascript
import {
  subscribeToPatientMatches,
  subscribeToUserNotifications,
  subscribeToDoctorAppointments
} from './services/database';

// Subscribe to patient matches (auto-updates)
const unsubscribe = subscribeToPatientMatches('patient_1', (matches) => {
  console.log('Matches updated:', matches);
  // Update your UI here
});

// Subscribe to notifications
const unsubNotifications = subscribeToUserNotifications('patient_1', (notifications) => {
  console.log('New notifications:', notifications);
  // Update notification bell count
});

// Cleanup when component unmounts
useEffect(() => {
  return () => {
    unsubscribe();
    unsubNotifications();
  };
}, []);
```

### Matching Service (`src/services/matching.js`)

#### Find Matches for Patient

```javascript
import { findMatchesForPatient } from './services/matching';

// Get patient data
const patient = await getUserProfile('patient_1');

// Find best matches
const matches = await findMatchesForPatient(patient, 5);

// matches is an array of:
// {
//   appointment: { ... },
//   scores: {
//     urgencyScore: 8,
//     waitTimeScore: 6,
//     distanceScore: 10,
//     barrierBonus: 7,
//     insuranceMatchScore: 10,
//     totalMatchScore: 85,
//     priorityTier: 1,
//     reasoningExplanation: "..."
//   },
//   appointmentId: "appt_123"
// }
```

#### Complete Match Flow

```javascript
import { findMatchesForPatient } from './services/matching';
import { createMatch, createNotification } from './services/database';

// 1. Find matches
const patient = await getUserProfile('patient_1');
const matches = await findMatchesForPatient(patient, 3);

// 2. Present top match to patient
const topMatch = matches[0];

// 3. Create match in database
const matchId = await createMatch(
  patient.id,
  topMatch.appointmentId,
  topMatch.scores
);

// 4. Notify patient
await createNotification(patient.id, {
  type: 'match_found',
  title: 'New Appointment Match!',
  message: `We found a match with ${topMatch.appointment.doctorName}`,
  priority: 'high',
  relatedMatchId: matchId,
  actionRequired: true
});

// 5. Notify doctor
await createNotification(topMatch.appointment.doctorId, {
  type: 'match_found',
  title: 'New Patient Match',
  message: `Patient ${patient.fullName} matched to your appointment`,
  priority: 'medium',
  relatedMatchId: matchId
});
```

---

## Integration with Frontend

### React Component Example

```jsx
import React, { useEffect, useState } from 'react';
import { findMatchesForPatient } from './services/matching';
import { getUserProfile, createMatch } from './services/database';

function PatientDashboard({ patientId }) {
  const [patient, setPatient] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatientAndMatches();
  }, [patientId]);

  const loadPatientAndMatches = async () => {
    try {
      const patientData = await getUserProfile(patientId);
      setPatient(patientData);

      const matchResults = await findMatchesForPatient(patientData, 5);
      setMatches(matchResults);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptMatch = async (match) => {
    try {
      await createMatch(patientId, match.appointmentId, match.scores);
      alert('Match confirmed!');
      loadPatientAndMatches(); // Refresh
    } catch (error) {
      console.error('Error accepting match:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome, {patient.fullName}</h1>
      <h2>Recommended Appointments</h2>
      {matches.map(match => (
        <div key={match.appointmentId}>
          <h3>{match.appointment.doctorName}</h3>
          <p>{match.appointment.clinicName}</p>
          <p>Match Score: {match.scores.totalMatchScore}/100</p>
          <p>Priority: Tier {match.scores.priorityTier}</p>
          <button onClick={() => handleAcceptMatch(match)}>
            Accept Match
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Auth Integration

```javascript
import { auth } from './firebase/config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { saveUserProfile } from './services/database';

// Sign up
const signUp = async (email, password, userData) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Save additional user data to Firestore
  await saveUserProfile(user.uid, {
    ...userData,
    email: user.email
  });

  return user;
};

// Sign in
const signIn = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

// Sign out
const logOut = () => signOut(auth);
```

---

## Testing

### Test Matching Algorithm

```javascript
import { findMatchesForPatient } from './services/matching';
import { DEMO_PATIENTS } from './services/seedData';

// Test with demo patient
const testPatient = DEMO_PATIENTS[0]; // Sarah Martinez
const matches = await findMatchesForPatient(testPatient, 5);

console.log('Top matches:', matches);

// Verify:
// ✅ Matches are sorted by priority tier then score
// ✅ Specialty matches patient's needs
// ✅ Insurance compatibility checked
// ✅ High urgency patients get Tier 1 or 2
```

### Test Database Operations

```javascript
// Test user CRUD
const testUserId = 'test_patient_' + Date.now();
await saveUserProfile(testUserId, {
  email: 'test@example.com',
  role: 'patient',
  fullName: 'Test Patient'
});

const retrieved = await getUserProfile(testUserId);
console.log('Retrieved user:', retrieved);

// Test appointments
const appointments = await getAvailableAppointments('cardiology');
console.log('Available cardiology appointments:', appointments.length);

// Test real-time listener
const unsubscribe = subscribeToPatientMatches(testUserId, (matches) => {
  console.log('Real-time matches:', matches);
});
```

---

## Troubleshooting

### Issue: "Firebase: Error (auth/configuration-not-found)"

**Solution**:
- Check `.env` file exists and has correct values
- Restart dev server: `npm run dev`
- Verify VITE_ prefix on all env variables

### Issue: "Missing or insufficient permissions"

**Solution**:
- Firestore is in "test mode" (check Firestore > Rules tab)
- Rules should be:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Test mode (30 days only!)
    }
  }
}
```

### Issue: No appointments found

**Solution**:
- Run seed data script
- Check Firestore Console > `appointments` collection
- Verify `status: "available"` and `specialty` field

### Issue: Real-time listeners not working

**Solution**:
- Check you're using `onSnapshot` not `getDocs`
- Verify listener is in `useEffect` with cleanup
- Check browser console for errors

### Issue: Seeding fails

**Solution**:
- Verify Firebase config is correct
- Check network connection
- Try manual seeding in Firestore Console
- Check Firestore is in test mode (not production rules)

---

## Next Steps

### Production Checklist

- [ ] Update Firestore Security Rules (see `FIRESTORE_SCHEMA.md`)
- [ ] Add server-side validation
- [ ] Set up Firebase Cloud Functions for:
  - Automated matching runs
  - Notification sending
  - Workflow triggers
- [ ] Add error tracking (Sentry, etc.)
- [ ] Set up monitoring and analytics
- [ ] Create data backup strategy
- [ ] Add rate limiting

### Integration Points

**With Person 1 (Frontend)**:
- Import services in React components
- Use real-time listeners for live updates
- Handle auth state changes
- Display match scores and reasoning

**With Person 3 (APIs)**:
- Call Gemini API for `aiUrgencyScore`
- Trigger FlowGlad workflows on match creation
- Store workflow IDs in match documents
- Handle API callbacks

---

## Quick Reference

### Key Files

```
src/
├── firebase/
│   └── config.js           # Firebase initialization
├── services/
│   ├── database.js         # All Firestore CRUD operations
│   ├── matching.js         # Equity-aware matching algorithm
│   └── seedData.js         # Demo data seeding
└── lib/
    └── equityEngine.js     # Equity scoring (existing)
```

### Common Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

### Support Resources

- [Firebase Docs](https://firebase.google.com/docs)
- [Firestore Queries](https://firebase.google.com/docs/firestore/query-data/queries)
- [Firebase Auth](https://firebase.google.com/docs/auth)
- [React Firebase](https://firebase.google.com/docs/web/setup)

---

## Contact

For questions or issues:
- Check Firestore Console first
- Review browser console logs
- Check `FIRESTORE_SCHEMA.md` for data structure
- Team communication channel

---

**Good luck with your hackathon! 🚀 You've got this!**
