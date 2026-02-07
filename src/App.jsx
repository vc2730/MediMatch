import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import AppLayout from './app/layout/AppLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import SignupPatient from './pages/SignupPatient'
import SignupDoctor from './pages/SignupDoctor'
import Dashboard from './pages/Dashboard'
import Intake from './pages/Intake'
import Matching from './pages/Matching'
import PatientMatching from './pages/PatientMatching'
import Flowglad from './pages/Flowglad'
import PatientPortal from './pages/PatientPortal'
import DoctorDashboard from './pages/DoctorDashboard'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes - No Layout */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup/patient" element={<SignupPatient />} />
          <Route path="/signup/doctor" element={<SignupDoctor />} />

          {/* Patient Routes - With Layout */}
          <Route path="/patient" element={<AppLayout />}>
            <Route path="intake" element={<Intake />} />
            <Route path="matching" element={<PatientMatching />} />
            <Route path="portal" element={<PatientPortal />} />
          </Route>

          {/* Doctor Routes - With Layout */}
          <Route path="/doctor" element={<AppLayout />}>
            <Route path="dashboard" element={<DoctorDashboard />} />
          </Route>

          {/* Legacy/Admin Routes - With Layout */}
          <Route path="/" element={<AppLayout />}>
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
  )
}

export default App
