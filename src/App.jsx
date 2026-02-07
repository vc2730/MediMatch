import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppLayout from './app/layout/AppLayout'
import ProtectedRoute from './app/routes/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Intake from './pages/Intake'
import Matching from './pages/Matching'
import Flowglad from './pages/Flowglad'
import PatientPortal from './pages/PatientPortal'
import Login from './pages/Login'

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRole="doctor">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/intake"
            element={
              <ProtectedRoute allowedRole="doctor">
                <Intake />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matching"
            element={
              <ProtectedRoute allowedRole="doctor">
                <Matching />
              </ProtectedRoute>
            }
          />
          <Route
            path="/flowglad"
            element={
              <ProtectedRoute allowedRole="doctor">
                <Flowglad />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRole="patient">
                <PatientPortal />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}

export default App
