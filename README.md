# MediMatch

**Equity-Aware Healthcare Appointment Matching System**

MediMatch is an intelligent healthcare platform that connects patients with available medical appointments using an equity-aware matching algorithm. The system prioritizes patients based on medical urgency, socioeconomic barriers, and healthcare equity factors.

## Features

- **Equity-Aware Matching Algorithm**: Prioritizes patients based on urgency, wait time, transportation barriers, insurance status, and geographic accessibility
- **Real-Time Updates**: Live notifications and appointment updates using Firebase real-time listeners
- **AI-Powered Urgency Assessment**: Integration with Gemini AI for medical urgency scoring
- **Multi-Specialty Support**: Cardiology, Primary Care, Orthopedics, Neurology, and more
- **Patient & Doctor Dashboards**: Separate interfaces for patients and healthcare providers
- **Workflow Automation**: FlowGlad integration for automated notifications and follow-ups

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, React Router
- **Backend**: Firebase (Authentication, Firestore Database)
- **AI Integration**: Gemini API for urgency scoring
- **Workflow**: FlowGlad API for automated processes
- **Styling**: Tailwind CSS with custom components

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Firebase

Follow the comprehensive setup guide: [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md)

Quick steps:
1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Email/Password authentication
3. Create Firestore database in test mode
4. Copy Firebase config to `.env` file

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config values
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Seed Demo Data (Optional)

Load the app and open browser console, then run:

```javascript
import { seedAllDemoData } from './services/seedData';
await seedAllDemoData();
```

This creates:
- 5 demo doctors
- 6 demo patients
- ~250 appointments over 14 days

## Project Structure

```
src/
├── firebase/
│   └── config.js              # Firebase initialization
├── services/
│   ├── database.js            # Firestore CRUD operations
│   ├── matching.js            # Equity-aware matching algorithm
│   ├── seedData.js            # Demo data seeding
│   └── flowgladIntegration.js # Workflow automation
├── lib/
│   ├── equityEngine.js        # Equity scoring calculations
│   └── mockData.js            # Mock data utilities
├── components/
│   ├── ui/                    # Reusable UI components
│   ├── StatCard.jsx           # Dashboard statistics
│   ├── QuickActionCard.jsx    # Action cards
│   └── PatientQueueItem.jsx   # Patient list items
├── app/
│   ├── layout/
│   │   └── AppLayout.jsx      # Main app layout
│   └── providers/
│       └── ThemeProvider.jsx  # Theme context
├── examples/
│   └── matchingExample.js     # Integration examples
├── App.jsx                    # Root component
└── main.jsx                   # Entry point
```

## Core Services

### Database Service (`src/services/database.js`)

Provides all Firestore operations:

```javascript
import {
  getUserProfile,
  createAppointment,
  findMatchesForPatient,
  createMatch,
  subscribeToPatientMatches
} from './services/database';
```

**Key Functions**:
- User management (CRUD)
- Appointment management
- Match creation and tracking
- Real-time listeners
- Notification system

### Matching Service (`src/services/matching.js`)

Equity-aware matching algorithm:

```javascript
import { findMatchesForPatient, calculateMatchScore } from './services/matching';

const matches = await findMatchesForPatient(patient, 5);
```

**Scoring Factors**:
- **Urgency Score** (30 points max): AI-assessed medical urgency
- **Wait Time** (20 points max): Days patient has been waiting
- **Distance** (15 points max): Geographic proximity
- **Barriers** (20 points max): Transportation, insurance, language barriers
- **Insurance Match** (15 points max): Insurance compatibility

**Priority Tiers**:
1. Urgent + Barriers (urgency ≥7 + limited transport OR Medicaid/Uninsured)
2. High Urgency (urgency ≥7)
3. Long Wait (>14 days waiting)
4. Standard

## Documentation

- [Firebase Setup Guide](./FIREBASE_SETUP_GUIDE.md) - Complete Firebase configuration guide
- [Firestore Schema](./FIRESTORE_SCHEMA.md) - Database structure and collections
- [Team Setup](./TEAM_SETUP.md) - Team collaboration guide

## Example Usage

### Finding Matches for a Patient

```javascript
import { getUserProfile } from './services/database';
import { findMatchesForPatient } from './services/matching';

// Get patient
const patient = await getUserProfile('patient_1');

// Find matches
const matches = await findMatchesForPatient(patient, 5);

// Display top match
const topMatch = matches[0];
console.log(`Best match: ${topMatch.appointment.doctorName}`);
console.log(`Score: ${topMatch.scores.totalMatchScore}/100`);
console.log(`Reason: ${topMatch.scores.reasoningExplanation}`);
```

### Creating a Match

```javascript
import { createMatch, createNotification } from './services/database';

// Create match
const matchId = await createMatch(
  patientId,
  appointmentId,
  scores
);

// Notify patient
await createNotification(patientId, {
  type: 'match_found',
  title: 'New Appointment Match!',
  message: 'We found an appointment that matches your needs',
  relatedMatchId: matchId
});
```

### Real-Time Updates

```javascript
import { subscribeToPatientMatches } from './services/database';

// Subscribe to matches (auto-updates UI)
const unsubscribe = subscribeToPatientMatches(patientId, (matches) => {
  console.log('Matches updated:', matches);
  // Update your UI here
});

// Cleanup
useEffect(() => {
  return () => unsubscribe();
}, []);
```

## Building for Production

```bash
npm run build
```

Output in `dist/` directory.

## Team Roles

- **Person 1 (Frontend)**: React UI, routing, forms, patient/doctor dashboards
- **Person 2 (Backend/Matching)**: Firebase setup, matching algorithm, database services
- **Person 3 (Integration)**: Gemini AI integration, FlowGlad workflows, API connections

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test
3. Commit: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`
5. Create pull request

## Troubleshooting

### Firebase Connection Issues

- Verify `.env` file has correct values
- Check Firebase is in test mode (Firestore Rules)
- Restart dev server after changing `.env`

### No Matches Found

- Ensure demo data is seeded
- Check patient specialty matches available appointments
- Verify appointments have `status: "available"`

### Real-Time Updates Not Working

- Verify using `onSnapshot` not `getDocs`
- Check cleanup function in `useEffect`
- Review browser console for errors

See [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md) for more troubleshooting.

## License

MIT

## Support

For questions or issues:
- Check documentation files
- Review browser console logs
- Check Firebase Console for data
- Contact team members
