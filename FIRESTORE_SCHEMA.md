# MediMatch Firestore Schema

## Collections Overview

### 1. `users`
Stores all user data (patients and doctors)

**Document ID**: Auto-generated or custom (e.g., `doctor_1`, `patient_1`)

**Common Fields:**
```javascript
{
  email: string,
  role: string, // "patient" or "doctor"
  fullName: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Patient-Specific Fields:**
```javascript
{
  // Demographics
  dateOfBirth: timestamp,
  phone: string,
  address: string,
  zipCode: string,

  // Health Information
  symptoms: string,
  medicalCondition: string,
  urgencyLevel: number, // 1-10 (self-reported)
  aiUrgencyScore: number, // 1-10 (Gemini calculated)
  specialty: string, // "cardiology", "primary_care", etc.

  // Equity Factors
  insurance: string, // "Medicaid", "Medicare", "Private", "Uninsured"
  transportation: string, // "Public transit", "Limited", "Family driver", etc.
  language: string,
  income: string, // "Low", "Medium", "High"

  // Tracking
  waitTimeDays: number,
  registeredAt: timestamp,
  lastMatchedAt: timestamp,
  totalMatches: number
}
```

**Doctor-Specific Fields:**
```javascript
{
  specialty: string,
  clinicName: string,
  address: string,
  zipCode: string,
  phone: string,
  npiNumber: string,
  licenseNumber: string,
  insuranceAccepted: array, // ["Medicaid", "Medicare", "Private"]
  languages: array,
  bio: string
}
```

---

### 2. `appointments`
Available appointment slots from doctors

**Document ID**: Auto-generated or custom (e.g., `appt_1`)

**Fields:**
```javascript
{
  // Doctor Information
  doctorId: string, // references users collection
  doctorName: string,
  clinicName: string,
  specialty: string, // "cardiology", "primary_care", "orthopedics", etc.

  // Appointment Details
  date: timestamp,
  time: string, // "2:00 PM"
  duration: number, // 30 (minutes)
  status: string, // "available", "matched", "confirmed", "completed", "cancelled"

  // Patient Assignment
  patientId: string | null, // null when available

  // Location
  address: string,
  zipCode: string,
  city: string,
  state: string,

  // Accessibility
  insuranceAccepted: array, // ["Medicaid", "Medicare", "Private"]
  languagesOffered: array,
  wheelchairAccessible: boolean,
  publicTransitNearby: boolean,

  // Metadata
  createdAt: timestamp,
  updatedAt: timestamp,
  matchedAt: timestamp | null,
  confirmedAt: timestamp | null
}
```

---

### 3. `matches`
Track patient-appointment matches with equity scoring

**Document ID**: Auto-generated

**Fields:**
```javascript
{
  // Core Match Data
  patientId: string,
  appointmentId: string,

  // Scoring
  urgencyScore: number, // 0-10 from Gemini
  equityScore: number, // Calculated from equity algorithm
  totalMatchScore: number, // Final combined score
  waitTimeScore: number,
  distanceScore: number,
  barrierBonus: number,
  insuranceMatchScore: number,

  // Status Tracking
  status: string, // "pending", "confirmed", "rejected", "completed", "cancelled"
  matchedAt: timestamp,
  respondedAt: timestamp | null,
  confirmedAt: timestamp | null,
  completedAt: timestamp | null,

  // AI Reasoning
  reasoningExplanation: string, // From K2 Think / Gemini (legacy)
  reasoning: {
    status: "idle" | "generating" | "ready" | "error",
    patientSummary: string,
    doctorSummary: string,
    equityExplanation: string,
    warnings: string[],
    provider: string,
    model: string,
    generatedAt: timestamp,
    errorMessage?: string
  },
  priorityTier: number, // 1-4 (1 = highest priority)

  // Workflow Integration
  flowgladWorkflowId: string | null,
  workflowStatus: string, // "pending", "in_progress", "completed"

  // Notifications
  notificationSent: boolean,
  remindersSent: number,

  // Metadata
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Priority Tier Logic:**
- Tier 1: Urgent + Barriers (urgency ≥7 AND (limited transport OR Medicaid/Uninsured))
- Tier 2: High Urgency (urgency ≥7)
- Tier 3: Long Wait (waiting >14 days)
- Tier 4: Standard

---

### 4. `notifications`
User notifications for matches, reminders, updates

**Document ID**: Auto-generated

**Fields:**
```javascript
{
  // Recipient
  userId: string,

  // Content
  type: string, // "match_found", "reminder", "confirmation", "cancellation", "update"
  title: string,
  message: string,
  priority: string, // "high", "medium", "low"

  // Related Data
  relatedMatchId: string | null,
  relatedAppointmentId: string | null,
  actionRequired: boolean,
  actionUrl: string | null,

  // Status
  read: boolean,
  readAt: timestamp | null,

  // Metadata
  createdAt: timestamp,
  expiresAt: timestamp | null
}
```

---

## Indexes to Create

For optimal query performance, create these composite indexes in Firestore:

1. **appointments**: `status` (ascending), `specialty` (ascending), `date` (ascending)
2. **appointments**: `doctorId` (ascending), `status` (ascending), `date` (ascending)
3. **matches**: `patientId` (ascending), `status` (ascending), `matchedAt` (descending)
4. **matches**: `status` (ascending), `priorityTier` (ascending), `totalMatchScore` (descending)
5. **notifications**: `userId` (ascending), `read` (ascending), `createdAt` (descending)

---

## Security Rules (Basic)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isRole(role) {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow write: if isAuthenticated() && isOwner(userId);
    }

    // Appointments collection
    match /appointments/{appointmentId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isRole('doctor');
      allow update: if isAuthenticated() && (
        isRole('doctor') ||
        resource.data.patientId == request.auth.uid
      );
    }

    // Matches collection
    match /matches/{matchId} {
      allow read: if isAuthenticated() && (
        resource.data.patientId == request.auth.uid ||
        get(/databases/$(database)/documents/appointments/$(resource.data.appointmentId)).data.doctorId == request.auth.uid
      );
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (
        resource.data.patientId == request.auth.uid ||
        get(/databases/$(database)/documents/appointments/$(resource.data.appointmentId)).data.doctorId == request.auth.uid
      );
    }

    // Notifications collection
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated();
    }
  }
}
```

---

## Common Query Patterns

### Find Available Appointments by Specialty
```javascript
const q = query(
  collection(db, 'appointments'),
  where('status', '==', 'available'),
  where('specialty', '==', 'cardiology'),
  where('date', '>=', new Date()),
  orderBy('date', 'asc'),
  limit(10)
);
```

### Get Patient's Pending Matches
```javascript
const q = query(
  collection(db, 'matches'),
  where('patientId', '==', patientId),
  where('status', '==', 'pending'),
  orderBy('matchedAt', 'desc')
);
```

### Get High Priority Matches for Processing
```javascript
const q = query(
  collection(db, 'matches'),
  where('status', '==', 'pending'),
  where('priorityTier', '==', 1),
  orderBy('totalMatchScore', 'desc'),
  limit(20)
);
```
