# MediMatch Integration Checklist

Quick reference for team integration and coordination.

## Team Integration Points

### Person 1 (Frontend) + Person 2 (Backend)

#### Hour 2: Firebase Config Sharing ✅
- [ ] Person 2 creates Firebase project
- [ ] Person 2 shares `.env` values with Person 1
- [ ] Person 1 adds to local `.env` file
- [ ] Both test Firebase connection

#### Hour 6: Database Schema ✅
- [ ] Person 2 shares `FIRESTORE_SCHEMA.md`
- [ ] Person 1 reviews collections structure
- [ ] Agree on data formats for forms
- [ ] Person 2 seeds test data

#### Hour 12: Signup Flow Integration ✅
- [ ] Person 1: Patient signup form posts to Firestore
- [ ] Person 1: Doctor signup form posts to Firestore
- [ ] Person 2: Verify data appears correctly in Firestore
- [ ] Test: Create user → See in Firebase Console

**Test Command:**
```javascript
import { saveUserProfile } from './services/database';
await saveUserProfile('test_patient_1', {
  email: 'test@example.com',
  role: 'patient',
  fullName: 'Test Patient',
  specialty: 'cardiology',
  zipCode: '10001',
  insurance: 'Medicaid',
  transportation: 'Public transit'
});
```

#### Hour 16: Matching Integration ✅
- [ ] Person 1: Import matching service
- [ ] Person 1: Call `findMatchesForPatient()` from UI
- [ ] Person 1: Display matches in patient dashboard
- [ ] Person 2: Provide helper functions for UI

**Integration Code:**
```javascript
// In Person 1's Patient Dashboard component
import { findMatchesForPatient } from './services/matching';
import { getUserProfile } from './services/database';

const loadMatches = async () => {
  const patient = await getUserProfile(patientId);
  const matches = await findMatchesForPatient(patient, 5);
  setMatches(matches);
};
```

#### Hour 20: Complete Patient Flow ✅
- [ ] Patient signs up
- [ ] Patient sees recommended appointments
- [ ] Patient accepts match
- [ ] Match saves to Firestore
- [ ] Notifications created
- [ ] Doctor sees match on dashboard

**Complete Flow Test:**
```javascript
import { runCompleteMatchingFlow, acceptMatch } from './examples/matchingExample';

// 1. Get matches
const result = await runCompleteMatchingFlow('patient_1');
console.log('Found matches:', result.matches.length);

// 2. Accept top match
await acceptMatch('patient_1', result.matches[0]);
```

---

### Person 2 (Backend) + Person 3 (Integration)

#### Hour 8: Patient Data Format for Gemini ✅
- [ ] Person 2 shares patient data structure
- [ ] Person 3 reviews fields needed for urgency scoring
- [ ] Agree on `aiUrgencyScore` field in user document

**Patient Data for Gemini:**
```javascript
{
  symptoms: "chest pain and shortness of breath",
  medicalCondition: "possible cardiac issue",
  age: 38,
  existingConditions: ["hypertension"],
  urgencyLevel: 7 // self-reported
}
```

**Expected Response:**
```javascript
{
  aiUrgencyScore: 8.5, // 0-10
  reasoning: "Symptoms suggest potential cardiac event..."
}
```

#### Hour 14: Gemini Integration ✅
- [ ] Person 3: Create Gemini API service
- [ ] Person 3: Function `calculateAIUrgency(patient)`
- [ ] Person 2: Call from matching algorithm
- [ ] Store result in `patient.aiUrgencyScore`

**Integration Point:**
```javascript
// In matching.js
import { calculateAIUrgency } from './geminiService'; // Person 3's file

export const calculateUrgencyScore = async (patient) => {
  // Try AI score first
  if (!patient.aiUrgencyScore) {
    try {
      const aiScore = await calculateAIUrgency(patient);
      patient.aiUrgencyScore = aiScore;
    } catch (error) {
      console.error('AI urgency failed, using self-reported');
    }
  }

  return patient.aiUrgencyScore || patient.urgencyLevel || 5;
};
```

#### Hour 18: FlowGlad Trigger ✅
- [ ] Person 2: Import `triggerMatchWorkflow` in match creation
- [ ] Person 3: Implement FlowGlad API call
- [ ] Test: Match created → Workflow triggered
- [ ] Verify: `flowgladWorkflowId` saved to match

**Integration Point:**
```javascript
// In database.js createMatch function
import { triggerMatchWorkflow } from './flowgladIntegration';

export const createMatch = async (patientId, appointmentId, scores) => {
  // ... create match in Firestore ...

  // Trigger FlowGlad workflow
  try {
    await triggerMatchWorkflow(matchId, {
      patientId,
      appointmentId,
      priorityTier: scores.priorityTier,
      urgencyScore: scores.urgencyScore
    });
  } catch (error) {
    console.error('FlowGlad trigger failed (non-critical):', error);
  }

  return matchId;
};
```

#### Hour 22: End-to-End Test ✅
- [ ] Create patient with symptoms
- [ ] Gemini scores urgency
- [ ] Matching algorithm runs
- [ ] Match created
- [ ] FlowGlad workflow triggers
- [ ] Notifications sent
- [ ] All data persists correctly

---

### Person 1 (Frontend) + Person 3 (Integration)

#### Hour 10: UI for Urgency Input ✅
- [ ] Person 1: Patient symptom form
- [ ] Form captures: symptoms, condition, urgency
- [ ] Person 3: Receives data for Gemini scoring
- [ ] Display AI urgency score in UI

#### Hour 15: Notification Display ✅
- [ ] Person 1: Notification bell/badge in header
- [ ] Person 3: Sends notifications via FlowGlad
- [ ] Person 1: Real-time listener updates badge count
- [ ] Click notification → Navigate to match

**Code for Person 1:**
```javascript
import { subscribeToUserNotifications } from './services/database';

const [notifications, setNotifications] = useState([]);
const unreadCount = notifications.filter(n => !n.read).length;

useEffect(() => {
  const unsubscribe = subscribeToUserNotifications(userId, (notifs) => {
    setNotifications(notifs);
  });
  return () => unsubscribe();
}, [userId]);
```

---

## Pre-Demo Checklist

### Data Preparation
- [ ] At least 5 doctors seeded (various specialties)
- [ ] At least 5 patients seeded (various urgency levels)
- [ ] 50+ appointments available (next 14 days)
- [ ] 2-3 matches created showing different priority tiers

### Feature Testing
- [ ] Patient signup works
- [ ] Doctor signup works
- [ ] Find matches returns results
- [ ] Accept match creates match document
- [ ] Notifications appear in real-time
- [ ] Doctor dashboard shows matches

### Demo Scenario
**The Perfect Demo Patient: Sarah Martinez**

```javascript
{
  id: 'patient_1',
  fullName: 'Sarah Martinez',
  symptoms: 'Chest pain and shortness of breath when climbing stairs',
  urgencyLevel: 8,
  aiUrgencyScore: 8, // From Gemini
  waitTimeDays: 18,
  insurance: 'Medicaid',
  transportation: 'Public transit',
  zipCode: '10009',
  specialty: 'cardiology'
}
```

**Why This Demonstrates Equity:**
- High urgency (8/10)
- Long wait (18 days)
- Medicaid (insurance barrier)
- Public transit (transportation barrier)
- Should match to Priority Tier 1
- High match score

**Demo Flow:**
1. Show Sarah's profile and barriers
2. Run matching algorithm
3. Show top 3 matches with scores
4. Highlight equity factors in reasoning
5. Accept match
6. Show confirmation + workflow trigger
7. Show doctor receiving match notification

---

## Common Integration Issues

### Issue: Frontend can't import Firebase services

**Solution:**
```javascript
// Correct import
import { getUserProfile } from './services/database';

// NOT from firebase directly
// import { getDoc } from 'firebase/firestore'; // Don't do this
```

### Issue: Timestamps not working

**Solution:**
```javascript
import { Timestamp } from 'firebase/firestore';

// Create timestamp
const now = Timestamp.now();
const fromDate = Timestamp.fromDate(new Date('2024-03-20'));

// Convert to JS Date
const jsDate = timestamp.toDate();
```

### Issue: Real-time listener not updating

**Solution:**
```javascript
// Make sure to return cleanup function
useEffect(() => {
  const unsubscribe = subscribeToPatientMatches(patientId, callback);
  return () => unsubscribe(); // Important!
}, [patientId]);
```

### Issue: Match scores seem wrong

**Solution:**
```javascript
// Check patient has all required fields
console.log({
  urgency: patient.urgencyLevel,
  wait: patient.waitTimeDays,
  zip: patient.zipCode,
  insurance: patient.insurance,
  transport: patient.transportation
});

// If any are missing, scores will be affected
```

---

## API Contracts

### Person 3 → Person 2: Gemini Urgency Service

```typescript
// Input
interface PatientSymptoms {
  symptoms: string;
  medicalCondition: string;
  age?: number;
  existingConditions?: string[];
}

// Output
interface UrgencyScore {
  score: number; // 0-10
  reasoning: string;
  confidence: number; // 0-1
}

// Function signature
async function calculateAIUrgency(patient: PatientSymptoms): Promise<UrgencyScore>
```

### Person 2 → Person 3: FlowGlad Trigger

```typescript
// Input
interface MatchWorkflowData {
  matchId: string;
  patientId: string;
  appointmentId: string;
  priorityTier: number;
  urgencyScore: number;
}

// Output
interface WorkflowResult {
  workflowId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

// Function signature
async function triggerMatchWorkflow(
  matchId: string,
  data: MatchWorkflowData
): Promise<string> // Returns workflowId
```

---

## Testing Commands

### Verify Firebase Connection
```javascript
import { db } from './firebase/config';
import { collection, getDocs } from 'firebase/firestore';

const test = await getDocs(collection(db, 'users'));
console.log('Connected! User count:', test.size);
```

### Verify Matching Algorithm
```javascript
import { DEMO_PATIENTS } from './services/seedData';
import { findMatchesForPatient } from './services/matching';

const patient = DEMO_PATIENTS[0];
const matches = await findMatchesForPatient(patient, 3);
console.log('Found matches:', matches.length);
matches.forEach(m => {
  console.log(`${m.appointment.doctorName}: ${m.scores.totalMatchScore}/100`);
});
```

### Verify Real-Time Listeners
```javascript
import { subscribeToPatientMatches } from './services/database';

const unsubscribe = subscribeToPatientMatches('patient_1', (matches) => {
  console.log('Real-time update! Matches:', matches.length);
});

// Let it run for 10 seconds
setTimeout(() => unsubscribe(), 10000);
```

---

## Go-Live Checklist

### Before Demo/Presentation
- [ ] All team members have latest code (`git pull`)
- [ ] Firebase .env configured correctly
- [ ] Demo data seeded
- [ ] Test patient flow works end-to-end
- [ ] Test doctor flow works
- [ ] Notifications working
- [ ] No console errors
- [ ] Screenshots/screen recording backup ready

### During Demo
- [ ] Internet connection stable
- [ ] Firebase Console open (backup view of data)
- [ ] Browser console hidden (or cleared)
- [ ] Demo patient ready to use
- [ ] Explanation of equity factors prepared
- [ ] Backup plan if live demo fails (use screenshots)

---

## Quick Reference Links

- **Firebase Console**: https://console.firebase.google.com/
- **Project Documentation**: See README.md, FIREBASE_SETUP_GUIDE.md
- **Schema Reference**: FIRESTORE_SCHEMA.md
- **Example Code**: src/examples/matchingExample.js

---

**Good luck! Your integration is the key to a successful demo! 🚀**
