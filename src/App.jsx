import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppLayout from './app/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Intake from './pages/Intake'
import Matching from './pages/Matching'
import Flowglad from './pages/Flowglad'
import PatientPortal from './pages/PatientPortal'

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/intake" element={<Intake />} />
          <Route path="/matching" element={<Matching />} />
          <Route path="/flowglad" element={<Flowglad />} />
          <Route path="/patient" element={<PatientPortal />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}

export default App
