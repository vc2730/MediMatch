import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import AppLayout from './app/layout/AppLayout'
import ProtectedRoute from './app/routes/ProtectedRoute'
import Home from './pages/Landing'
import Login from './pages/Login'
import SignupPatient from './pages/SignupPatient'
import SignupDoctor from './pages/SignupDoctor'
import Dashboard from './pages/Dashboard'
import Intake from './pages/Intake'
import Matching from './pages/Matching'
import PatientMatching from './pages/PatientMatching'
import Flowglad from './pages/Flowglad'
import PatientPortal from './pages/PatientPortal'
import PatientProfile from './pages/PatientProfile'
import AppointmentBooking from './pages/AppointmentBooking'
import DoctorDashboard from './pages/DoctorDashboard'
import DoctorDirectory from './pages/DoctorDirectory'
import MultimodalTriagePage from './pages/MultimodalTriagePage'
import FlowgladTestDashboard from './pages/FlowgladTestDashboard'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Routes - No Layout */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignupPatient />} />
          <Route path="/signup/patient" element={<SignupPatient />} />
          <Route path="/signup/doctor" element={<SignupDoctor />} />

          {/* Patient Routes - With Layout */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRole="patient">
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="intake" element={<Intake />} />
            <Route path="multimodal-triage" element={<MultimodalTriagePage />} />
            <Route path="matching" element={<PatientMatching />} />
            <Route path="portal" element={<PatientPortal />} />
            <Route path="dashboard" element={<PatientPortal />} />
            <Route path="profile" element={<PatientProfile />} />
            <Route path="appointments" element={<AppointmentBooking />} />
            <Route path="doctors" element={<DoctorDirectory />} />
            <Route path="billing-test" element={<FlowgladTestDashboard />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Doctor Routes - With Layout */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRole="doctor">
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Legacy/Admin Routes - With Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRole="doctor">
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="intake" element={<Intake />} />
            <Route path="matching" element={<Matching />} />
            <Route path="flowglad" element={<Flowglad />} />
            <Route path="patient" element={<PatientPortal />} />
          </Route>

          {/* Redirect old routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
