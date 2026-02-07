# MediMatch - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will get your MediMatch app running and ready to demo.

---

## Step 1: Start the Development Server

```bash
npm run dev
```

You should see:
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## Step 2: Seed Demo Data

1. **Open your browser** to: `http://localhost:5173/seed-demo-data.html`

2. **Click "Seed All Demo Data"** button

3. **Wait for completion** (takes ~10-15 seconds)

You should see:
- ✅ Created 6 patients
- ✅ Created 5 doctors
- ✅ Created ~250 appointments

4. **Check Firebase Console** (optional):
   - Go to: https://console.firebase.google.com/project/medimatch-f3499/firestore
   - You should see collections: `users`, `appointments`, `matches`, `notifications`

---

## Step 3: Test Patient Flow

### 3a. Go to Home Page
Navigate to: `http://localhost:5173/`

### 3b. Select "Patient"
Click the **"Continue as Patient"** button

### 3c. Fill Intake Form
Fill out the form with test data:

**Example Patient**:
- Name: `John Test`
- Email: `john@test.com`
- Phone: `555-1234`
- ZIP: `10001`
- Condition: `Chest pain`
- Symptoms: `Feeling chest tightness when walking`
- Specialty: `Cardiology`
- Urgency: `8 - Urgent`
- Insurance: `Medicaid`
- Transportation: `Public transit`

### 3d. Submit Form
Click **"Submit & Find Matches"**

The app will:
1. Save patient to Firebase
2. Redirect to matching page
3. Load patient data

### 3e. Find Matches
On the matching page:
1. Click **"Find Appointments"** button
2. Wait 2-3 seconds
3. See top 5 matches appear

### 3f. View Match Details
For each match, you can:
- See overall match score (e.g., 85/100)
- See priority tier badge
- Click **"Why this match?"** to expand scoring details:
  - Urgency score
  - Wait time score
  - Distance score
  - Barriers bonus
  - Insurance match

### 3g. Accept a Match
1. Click **"Book This Appointment"** on any match
2. See green confirmation message
3. Match is created in Firebase
4. Notifications sent to patient & doctor

### 3h. View Patient Portal
Navigate to: `/patient/portal` or click navigation

You should see:
- Your confirmed appointment details
- Real-time notifications
- Unread notification count
- Click notifications to mark as read

---

## Step 4: Test Doctor Flow

### 4a. Go Back to Home
Navigate to: `http://localhost:5173/`

### 4b. Select "Doctor"
Click the **"Continue as Doctor"** button

### 4c. View Doctor Dashboard
You should see:
- **Stats cards** showing:
  - Waiting patients (6 if you seeded)
  - Pending matches (1+ if you accepted a match)
  - High urgency patients
- **Waiting Patients list** (6 demo patients sorted by equity)
- **Pending Match Requests** (if you created a match as patient)

### 4d. Review Patient Details
Click on any patient accordion to expand:
- See condition, symptoms
- See urgency level
- See insurance, transportation
- See wait time days
- See equity score

### 4e. Handle Match Request
If you have a pending match:
1. See the patient details
2. Click **"Confirm"** to approve
3. Or click **"Reject"** to decline
4. Match status updates in Firebase
5. Notifications sent

---

## Step 5: Verify Real-Time Updates

### Test Real-Time Notifications:
1. Open **two browser windows** side by side
2. **Window 1**: Patient portal (`/patient/portal`)
3. **Window 2**: Doctor dashboard (`/doctor/dashboard`)
4. In **Window 2** (doctor): Confirm a match
5. In **Window 1** (patient): See notification appear instantly (no refresh needed!)

---

## 🎯 Demo Data Overview

After seeding, you have:

### 6 Demo Patients:
1. **Sarah Martinez** - Priority Tier 1 (High urgency + barriers)
   - Urgency: 8/10
   - Wait: 18 days
   - Insurance: Medicaid
   - Transportation: Public transit
   - **Perfect for demos!**

2. **John Wilson** - Priority Tier 3
   - Urgency: 6/10
   - Wait: 12 days
   - Insurance: Medicare
   - Transportation: Limited

3. **Lisa Thompson** - Priority Tier 1
   - Urgency: 7/10
   - Wait: 5 days
   - Insurance: Uninsured
   - Transportation: Bus

4. **Robert Kim** - Priority Tier 4
   - Urgency: 3/10
   - Wait: 2 days
   - Insurance: Private
   - Transportation: Personal vehicle

5. **Maria Garcia** - Priority Tier 2
   - Urgency: 7/10
   - Wait: 8 days
   - Insurance: Medicaid
   - Transportation: Community shuttle

6. **David Brown** - Priority Tier 2
   - Urgency: 9/10
   - Wait: 3 days
   - Insurance: Medicare
   - Transportation: Family driver

### 5 Demo Doctors:
1. Dr. Sarah Jones - **Cardiology**
2. Dr. Michael Smith - **Primary Care**
3. Dr. Priya Patel - **Orthopedics**
4. Dr. James Chen - **Neurology**
5. Dr. Maria Rodriguez - **Primary Care**

### 250+ Appointments:
- Distributed over next 14 days
- Various time slots (9:00 AM - 4:00 PM)
- All specialties covered
- Different insurance acceptance

---

## 🎬 Perfect Demo Flow

**Use demo patient #1: Sarah Martinez**

1. **Start**: Go to home, select Patient
2. **Use existing demo data**:
   - Open browser console
   - Run: `localStorage.setItem('currentPatientId', 'patient_1')`
   - Refresh page
   - Go to `/patient/matching`

3. **Show Sarah's profile**:
   - Point out: "Sarah has been waiting 18 days"
   - "She has high urgency cardiac symptoms"
   - "She has Medicaid and uses public transit - both barriers"

4. **Run matching**:
   - Click "Find Appointments"
   - "The equity algorithm scores each appointment"
   - Show top match: "85/100 score, Priority Tier 1"

5. **Explain scoring**:
   - Click "Why this match?"
   - Point out each score component
   - "Notice how barriers give her extra points"

6. **Accept match**:
   - Click "Book This Appointment"
   - Show green confirmation
   - "Notifications sent instantly"

7. **Switch to doctor**:
   - Go to home, select Doctor
   - "Doctor sees Sarah's match request"
   - Show her priority tier and details
   - Confirm the match
   - "Both parties updated in real-time"

---

## 🐛 Troubleshooting

### Issue: "No matches found"
**Solution**: Make sure demo data is seeded
- Go to `/seed-demo-data.html`
- Click "Seed All Demo Data"
- Check patient specialty matches available appointments

### Issue: "Patient not found"
**Solution**: Complete intake form first
- Go to home
- Select Patient
- Fill intake form
- Submit

### Issue: "No notifications showing"
**Solution**: Create a match first
- Complete patient flow
- Accept a match
- Notifications will appear

### Issue: Firebase errors
**Solution**: Check Firebase config
- Verify `.env` file has correct values
- Check Firebase Console (must be in test mode)
- Check browser console for specific error

### Issue: "Demo data seeding fails"
**Solution**: Check Firebase permissions
- Go to Firebase Console
- Firestore Database > Rules
- Should be in test mode:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if true;
      }
    }
  }
  ```

---

## 📊 Check Your Data in Firebase

1. **Go to Firebase Console**:
   https://console.firebase.google.com/project/medimatch-f3499/firestore

2. **Check each collection**:
   - **users**: Should have 11 documents (6 patients + 5 doctors)
   - **appointments**: Should have ~250 documents
   - **matches**: Created when you accept matches
   - **notifications**: Created with each match

3. **View a patient document**:
   - Click `users` collection
   - Click a document (e.g., `patient_1`)
   - See all fields: fullName, urgency, insurance, etc.

4. **View a match document**:
   - Click `matches` collection
   - See patientId, appointmentId, scores, status

---

## ✅ Testing Checklist

Before your demo, verify:

- [ ] Dev server running (`npm run dev`)
- [ ] Demo data seeded (6 patients, 5 doctors)
- [ ] Patient intake form works
- [ ] Matching algorithm returns results
- [ ] Match scoring displays correctly
- [ ] Accept match creates notification
- [ ] Patient portal shows appointment
- [ ] Doctor dashboard shows patients
- [ ] Doctor can confirm/reject matches
- [ ] Real-time updates work
- [ ] No console errors

---

## 🎉 You're Ready!

Your MediMatch app is fully functional. Key highlights:

✅ **Patient Flow**: Intake → Matching → Portal
✅ **Doctor Flow**: Dashboard → Review → Confirm
✅ **Equity Algorithm**: Priority tiers based on barriers
✅ **Real-Time**: Firestore listeners update instantly
✅ **Notifications**: Created and displayed automatically
✅ **Demo Data**: 6 patients, 5 doctors, 250+ appointments

**Pro Tip**: Use Sarah Martinez (patient_1) for demos - she's Priority Tier 1 with multiple barriers, perfect for showing equity-aware matching!

---

## 🚀 Next Steps

For production deployment:
1. Add Firebase Authentication (Email/Password)
2. Update Firestore security rules
3. Implement Gemini AI urgency (Person 3)
4. Implement FlowGlad workflows (Person 3)
5. Deploy to Firebase Hosting or Vercel

For more details, see:
- `PROJECT_COMPLETION.md` - Full completion summary
- `README.md` - Project overview
- `FIREBASE_SETUP_GUIDE.md` - Firebase details
- `INTEGRATION_CHECKLIST.md` - Team integration

**Happy demoing! 🎉**
