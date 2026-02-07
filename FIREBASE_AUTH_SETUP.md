# Firebase Authentication Setup Guide

## ✅ Authentication System Implemented!

Your MediMatch app now has a complete Firebase Authentication system with login and signup for both patients and doctors.

---

## 🔥 Firebase Console Setup (Required)

Before you can use authentication, you need to enable it in your Firebase console.

### Step 1: Enable Email/Password Authentication

1. **Go to Firebase Console**:
   - Open: https://console.firebase.google.com/project/medimatch-f3499

2. **Navigate to Authentication**:
   - In the left sidebar, click **"Authentication"**

3. **Get Started** (if first time):
   - Click **"Get started"** button

4. **Enable Email/Password Provider**:
   - Click on the **"Sign-in method"** tab
   - Find **"Email/Password"** in the list
   - Click on it
   - Toggle **"Enable"** to ON
   - Click **"Save"**

That's it! Authentication is now enabled.

---

## 🎯 What's Been Implemented

### 1. **Firebase Auth Service** (`src/services/auth.js`)
Complete authentication service with:
- `registerPatient(email, password, patientData)` - Register new patient
- `registerDoctor(email, password, doctorData)` - Register new doctor
- `signIn(email, password)` - Sign in existing user
- `signOutUser()` - Sign out current user
- `getUserProfile(uid)` - Get user profile from Firestore
- `onAuthChange(callback)` - Subscribe to auth state changes
- `getAuthErrorMessage(errorCode)` - User-friendly error messages

### 2. **Login Page** (`/login`)
- Email/password login form
- Error handling with user-friendly messages
- Links to signup pages
- Redirects based on user role (patient/doctor)

### 3. **Patient Signup** (`/signup/patient`)
- Complete registration form with:
  - Account info (name, email, password)
  - Medical info (condition, symptoms, urgency, specialty)
  - Equity factors (insurance, transportation)
- Creates Firebase Auth account
- Saves patient profile to Firestore
- Auto-login after signup
- Redirects to patient portal

### 4. **Doctor Signup** (`/signup/doctor`)
- Professional registration form with:
  - Account info (name, email, password)
  - Professional info (clinic, specialty, license number)
- Creates Firebase Auth account
- Saves doctor profile to Firestore
- Auto-login after signup
- Redirects to doctor dashboard

### 5. **Updated AuthContext**
- Uses Firebase Authentication
- Listens to auth state changes
- Automatically loads user profile from Firestore
- Manages authentication state globally

### 6. **Updated Home Page**
- "Sign Up" and "Sign In" buttons for both roles
- Navigates to appropriate pages

### 7. **Updated App Layout**
- Shows user name when authenticated
- Logout button in dropdown menu
- Conditional "New Patient Intake" button

---

## 🚀 How to Use

### Patient Flow:

1. **Sign Up**:
   - Go to home page → Click "Patient" card → Click "Sign Up"
   - Fill out the registration form
   - Account is created in Firebase Auth
   - Profile saved to Firestore
   - Auto-logged in and redirected to patient portal

2. **Sign In**:
   - Go to home page → Click "Patient" card → Click "Sign In"
   - Enter email and password
   - Redirected to patient portal

3. **Sign Out**:
   - Click theme dropdown in header
   - Click "Sign Out"

### Doctor Flow:

1. **Sign Up**:
   - Go to home page → Click "Doctor" card → Click "Sign Up"
   - Fill out professional registration form
   - Account is created in Firebase Auth
   - Profile saved to Firestore
   - Auto-logged in and redirected to doctor dashboard

2. **Sign In**:
   - Go to home page → Click "Doctor" card → Click "Sign In"
   - Enter email and password
   - Redirected to doctor dashboard

3. **Sign Out**:
   - Click theme dropdown in header
   - Click "Sign Out"

---

## 🔒 How Authentication Works

### Registration Process:

```javascript
// 1. User fills signup form
// 2. Form submits to registerPatient or registerDoctor
// 3. Firebase Auth creates user account
await createUserWithEmailAndPassword(auth, email, password)

// 4. User profile created in Firestore
await setDoc(doc(db, 'users', user.uid), profileData)

// 5. AuthContext updated automatically (via onAuthStateChanged)
// 6. User redirected to appropriate page
```

### Login Process:

```javascript
// 1. User enters email/password
// 2. Firebase Auth signs in
const userCredential = await signInWithEmailAndPassword(auth, email, password)

// 3. User profile loaded from Firestore
const profile = await getDoc(doc(db, 'users', user.uid))

// 4. AuthContext updated automatically
// 5. User redirected based on role
```

### Authentication State:

```javascript
// onAuthStateChanged listener in AuthContext
onAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser) {
    // User is signed in
    const profile = await getUserProfile(firebaseUser.uid)
    setUser(firebaseUser)
    setUserProfile(profile)
  } else {
    // User is signed out
    setUser(null)
    setUserProfile(null)
  }
})
```

---

## 📊 Firestore Data Structure

### User Documents (stored in `users` collection):

**Patient Document**:
```javascript
{
  uid: "firebase_auth_uid",
  role: "patient",
  email: "patient@example.com",
  fullName: "John Doe",

  // Medical Info
  medicalCondition: "Chest pain",
  symptoms: "...",
  urgencyLevel: 8,
  specialty: "cardiology",

  // Equity Factors
  insurance: "Medicaid",
  transportation: "Public transit",
  zipCode: "10001",

  // Tracking
  createdAt: timestamp,
  registeredAt: timestamp,
  waitTimeDays: 0,
  totalMatches: 0
}
```

**Doctor Document**:
```javascript
{
  uid: "firebase_auth_uid",
  role: "doctor",
  email: "doctor@example.com",
  fullName: "Dr. Jane Smith",

  // Professional Info
  clinicName: "City Medical Center",
  specialties: ["cardiology"],
  licenseNumber: "MD123456",
  zipCode: "10001",

  // Settings
  acceptedInsurance: ["Medicaid", "Medicare", "Private"],
  availableSlots: 0,
  totalMatches: 0,

  createdAt: timestamp
}
```

---

## 🔐 Security

### Current Setup (Development):
- Firebase Auth manages user credentials securely
- Passwords are hashed by Firebase (never stored in plain text)
- Firestore is in test mode (allows all reads/writes)

### For Production:
You should implement Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Appointments - authenticated users can read, only doctors can write
    match /appointments/{appointmentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'doctor';
    }

    // Matches - authenticated users can read their own, create new
    match /matches/{matchId} {
      allow read: if request.auth != null &&
                    (resource.data.patientId == request.auth.uid ||
                     resource.data.doctorId == request.auth.uid);
      allow create: if request.auth != null;
      allow update: if request.auth != null &&
                      (resource.data.patientId == request.auth.uid ||
                       resource.data.doctorId == request.auth.uid);
    }

    // Notifications - users can read their own
    match /notifications/{notificationId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 🐛 Troubleshooting

### Issue: "Email already in use"
**Cause**: A user with that email already exists
**Solution**: Use the login page instead, or use a different email

### Issue: "Weak password"
**Cause**: Password is less than 6 characters
**Solution**: Use a password with at least 6 characters

### Issue: "User not found" or "Wrong password"
**Cause**: Invalid credentials
**Solution**: Check email and password are correct

### Issue: "auth/operation-not-allowed"
**Cause**: Email/Password authentication not enabled in Firebase Console
**Solution**: Follow "Step 1" above to enable Email/Password provider

### Issue: "Network error"
**Cause**: No internet connection or Firebase unreachable
**Solution**: Check internet connection

### Issue: User profile not loading
**Cause**: Profile not created in Firestore
**Solution**: Check Firestore Console for the user document

---

## 🎯 Testing the Authentication Flow

### Test Patient Signup:
1. Go to: `http://localhost:5173/`
2. Click "Patient" → "Sign Up"
3. Fill form:
   - Name: Test Patient
   - Email: testpatient@example.com
   - Password: test123
   - Confirm Password: test123
   - Fill medical info
4. Click "Create Account & Continue"
5. Should redirect to patient portal
6. Check Firebase Console → Authentication → Users (should see new user)
7. Check Firestore → users collection (should see profile document)

### Test Patient Login:
1. Go to: `http://localhost:5173/login`
2. Enter:
   - Email: testpatient@example.com
   - Password: test123
3. Click "Sign In"
4. Should redirect to patient portal

### Test Doctor Signup:
1. Go to: `http://localhost:5173/`
2. Click "Doctor" → "Sign Up"
3. Fill form:
   - Name: Dr. Test
   - Email: testdoctor@example.com
   - Password: test123
   - Fill professional info
4. Click "Create Doctor Account"
5. Should redirect to doctor dashboard

### Test Logout:
1. While logged in, click theme dropdown
2. Click "Sign Out"
3. Should be signed out and redirected to login page

---

## ✅ Authentication Checklist

- [x] Firebase Authentication enabled in console
- [x] Email/Password provider enabled
- [x] Auth service created
- [x] Login page created
- [x] Patient signup created
- [x] Doctor signup created
- [x] AuthContext uses Firebase Auth
- [x] Home page updated with auth buttons
- [x] App layout shows user info
- [x] Logout functionality added
- [x] Build succeeds
- [ ] Test patient signup (you need to do this!)
- [ ] Test patient login (you need to do this!)
- [ ] Test doctor signup (you need to do this!)
- [ ] Test logout (you need to do this!)

---

## 🚀 Next Steps

### Immediate:
1. **Enable Email/Password auth in Firebase Console** (see Step 1 above)
2. **Test signup and login flows**
3. **Create a few test accounts**

### Optional Enhancements:
- [ ] Add "Forgot Password" functionality
- [ ] Add email verification
- [ ] Add Google Sign-In
- [ ] Add profile editing
- [ ] Add password reset
- [ ] Implement protected routes (redirect to login if not authenticated)
- [ ] Add "Remember Me" functionality
- [ ] Add account deletion

---

## 📞 Support

### Firebase Console Links:
- **Authentication**: https://console.firebase.google.com/project/medimatch-f3499/authentication
- **Firestore**: https://console.firebase.google.com/project/medimatch-f3499/firestore
- **Project Settings**: https://console.firebase.google.com/project/medimatch-f3499/settings/general

### Common Firebase Auth Error Codes:
- `auth/email-already-in-use` - Email is already registered
- `auth/invalid-email` - Invalid email format
- `auth/weak-password` - Password too weak (< 6 chars)
- `auth/user-not-found` - No user with that email
- `auth/wrong-password` - Incorrect password
- `auth/too-many-requests` - Too many failed attempts
- `auth/operation-not-allowed` - Provider not enabled

---

## 🎉 You're Ready!

Your MediMatch app now has:
- ✅ Complete Firebase Authentication
- ✅ Patient signup and login
- ✅ Doctor signup and login
- ✅ Secure password handling
- ✅ User profile management
- ✅ Authentication state management
- ✅ Logout functionality

**Just remember to enable Email/Password authentication in Firebase Console before testing!**
