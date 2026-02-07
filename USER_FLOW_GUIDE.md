# MediMatch User Flow Guide

## 🏥 Complete User Flows

### Patient Flow

```
1. Landing Page (/)
   ↓ Click "Continue as Patient"
   
2. Patient Intake Form (/patient/intake)
   ↓ Fill out form with:
   - Name, contact info
   - Medical condition & symptoms
   - Specialty needed (cardiology, primary care, etc.)
   - Urgency level (1-10)
   - Insurance type
   - Transportation access
   ↓ Click "Submit & Find Matches"
   ↓ [Saved to Firestore]
   
3. Patient Matching Page (/patient/matching)
   ↓ Shows patient info card
   ↓ Click "Find Appointments"
   ↓ [Matching algorithm runs]
   ↓ Shows top 5 matches with:
   - Match score (0-100)
   - Priority tier (1-4)
   - Appointment details
   - Equity reasoning
   ↓ Click "Book This Appointment"
   ↓ [Match created in Firestore]
   ↓ [Notifications sent to patient & doctor]
   
4. Confirmation
   ✅ Appointment confirmed
   ✅ Doctor notified
```

### Doctor Flow

```
1. Landing Page (/)
   ↓ Click "Continue as Doctor"
   
2. Doctor Dashboard (/doctor/dashboard)
   ↓ View 4 stat cards:
   - Waiting patients count
   - Pending match requests
   - Confirmed appointments
   - High urgency patients
   
3. Pending Match Requests Section
   ↓ For each pending match, see:
   - Patient name & condition
   - Urgency score & priority tier
   - Match reasoning
   - Equity factors
   ↓ Click "Confirm" or "Reject"
   ↓ [Match status updated in Firestore]
   ↓ [Patient notified]
   
4. Waiting Patients List
   ↓ View all patients sorted by equity score
   ↓ Expand to see full details
```

### Admin Flow (Optional)

```
1. Admin Matching Page (/matching)
   ↓ View all patients
   ↓ Select any patient
   ↓ Run matching for them
   ↓ Accept matches on their behalf
```

---

## 🌐 Routes

### Public Routes
- `/` - Landing page with role selection

### Patient Routes
- `/patient/intake` - Complete intake form
- `/patient/matching` - Find and book appointments
- `/patient/portal` - View your appointments

### Doctor Routes
- `/doctor/dashboard` - View patients and match requests

### Admin/Legacy Routes
- `/dashboard` - Admin dashboard
- `/matching` - Admin matching interface
- `/intake` - Direct intake form
- `/flowglad` - FlowGlad integration page

---

## 🔑 Key Features

### For Patients
✅ Simple intake form
✅ Equity-aware matching (prioritizes barriers)
✅ See match reasoning and scores
✅ One-click appointment booking
✅ Automatic notifications

### For Doctors
✅ View all waiting patients
✅ Review match requests with full context
✅ See patient urgency and equity factors
✅ Confirm or reject matches
✅ Equity scores help prioritize

---

## 🎯 Demo Scenario

### Best Demo: Sarah Martinez

**Patient Profile:**
- Name: Sarah Martinez
- Condition: Chest pain, shortness of breath
- Specialty: Cardiology
- Urgency: 8/10
- Insurance: Medicaid
- Transportation: Public transit
- Wait time: 18 days

**Why this demos well:**
1. **High Priority** - Tier 1 (urgent + barriers)
2. **Equity Factors** - Medicaid, public transit, long wait
3. **Strong Matches** - Should get 80+ match scores
4. **Clear Reasoning** - Algorithm explanation shows equity awareness

**Demo Steps:**
1. Start at `/` → Click "Patient"
2. Fill out form with Sarah's info
3. Submit → Auto-navigates to matching
4. Click "Find Appointments"
5. See 5 matches, top one should be ~85/100 score
6. Expand "Why this match?" to show reasoning
7. Click "Book This Appointment"
8. Show confirmation

Then:
9. Go to `/` → Click "Doctor"
10. Show Sarah's match in "Pending Requests"
11. Show her equity factors
12. Click "Confirm"
13. Show updated stats

---

## 📊 Data Flow

```
Intake Form
    ↓ saveUserProfile()
Firestore users collection
    ↓ patient data
Matching Algorithm
    ↓ findMatchesForPatient()
    ↓ getAvailableAppointments()
Firestore appointments collection
    ↓ scoring & ranking
Top 5 Matches
    ↓ acceptMatch()
    ↓ createMatch()
Firestore matches collection
    ↓ createNotification() × 2
Firestore notifications collection
    ↓ Real-time listeners
Doctor Dashboard (updates automatically)
```

---

## 🔥 Firebase Collections Used

### users (patients & doctors)
- Stores all user profiles
- Fields: role, fullName, medical info, equity factors
- Real-time listeners for updates

### appointments
- Available appointment slots from doctors
- Fields: doctorId, specialty, date, time, insurance accepted
- Filtered by specialty and availability

### matches
- Patient-appointment pairings
- Fields: patientId, appointmentId, scores, status, reasoning
- Status: pending → confirmed/rejected → completed

### notifications
- User notifications
- Fields: userId, type, title, message, read
- Real-time updates for notification bell

---

## 🛠️ Technical Notes

### localStorage Keys
- `userRole`: "patient" or "doctor"
- `currentPatientId`: Patient ID after intake

### Matching Algorithm Scoring
```
Total Score (0-100) =
  Urgency × 3.0      (Max 30 points)
+ Wait Time × 2.0    (Max 20 points)
+ Distance × 1.5     (Max 15 points)
+ Barriers × 2.0     (Max 20 points)
+ Insurance × 1.5    (Max 15 points)
```

### Priority Tiers
1. **Tier 1**: Urgency≥7 + (Medicaid/Uninsured OR Limited transport)
2. **Tier 2**: Urgency≥7
3. **Tier 3**: Wait time >14 days
4. **Tier 4**: Standard

---

## 🚀 Quick Start for Testing

1. **First time setup:**
   - Visit `/seed-demo-data.html`
   - Click "Seed All Demo Data"
   - Wait for completion

2. **Test patient flow:**
   - Visit `/`
   - Click "Patient"
   - Fill form (or use Sarah Martinez data above)
   - Submit & see matches
   - Book an appointment

3. **Test doctor flow:**
   - Visit `/`
   - Click "Doctor"
   - See pending matches
   - Confirm a match

4. **Check Firebase:**
   - Visit `/firebase-status.html`
   - See data counts
   - Click "Show Patient Details"

---

## 💡 Tips for Presentation

1. **Start with the problem**: Healthcare access inequality
2. **Show the solution**: Equity-aware matching
3. **Demo the flow**: Patient → Matching → Doctor confirms
4. **Highlight equity**: Show scoring breakdown, barriers
5. **Show impact**: Tier 1 patients get priority

**Key talking points:**
- "Prioritizes underserved patients with barriers"
- "Transparent scoring shows why matches are made"
- "Doctors see patient context for informed decisions"
- "Real-time updates, no polling needed"
- "Scalable to thousands of patients and appointments"
