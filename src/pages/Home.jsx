import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { UserCircle, Stethoscope, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Home = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [selectedRole, setSelectedRole] = useState(null)

  const handleRoleSelect = (role) => {
    setSelectedRole(role)

    // Navigate based on role
    if (role === 'patient') {
      navigate('/signup/patient')
    } else {
      navigate('/signup/doctor')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-ink-50 dark:from-ink-950 dark:to-brand-950 p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-ink-900 dark:text-white mb-4">
            Welcome to MediMatch
          </h1>
          <p className="text-xl text-ink-600 dark:text-ink-300">
            Equity-Aware Healthcare Appointment Matching
          </p>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-2">
            Connecting patients with available medical appointments using intelligent matching
          </p>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-ink-900 dark:text-white mb-2">
            I am a...
          </h2>
          <p className="text-ink-500 dark:text-ink-400">
            Select your role to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Patient Card */}
          <Card
            className={`p-8 cursor-pointer transition-all hover:shadow-xl hover:scale-105 ${
              selectedRole === 'patient'
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
                : 'border-ink-200 dark:border-ink-800'
            }`}
            onClick={() => setSelectedRole('patient')}
          >
            <div className="text-center">
              <div className="rounded-full bg-brand-100 dark:bg-brand-900/30 p-6 inline-block mb-4">
                <UserCircle className="h-16 w-16 text-brand-600 dark:text-brand-400" />
              </div>
              <h3 className="text-2xl font-bold text-ink-900 dark:text-white mb-3">
                Patient
              </h3>
              <p className="text-ink-600 dark:text-ink-300 mb-6">
                Looking for a medical appointment? We'll help you find the best match based on your needs.
              </p>

              <div className="space-y-2 text-left mb-6">
                <div className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-300">
                  <span className="text-brand-600 dark:text-brand-400">✓</span>
                  <span>Complete intake form with symptoms</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-300">
                  <span className="text-brand-600 dark:text-brand-400">✓</span>
                  <span>Get matched with available appointments</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-300">
                  <span className="text-brand-600 dark:text-brand-400">✓</span>
                  <span>Equity-aware priority matching</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate('/signup/patient')
                  }}
                  className="flex-1"
                >
                  Sign Up
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate('/login')
                  }}
                  className="flex-1"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </Card>

          {/* Doctor Card */}
          <Card
            className={`p-8 cursor-pointer transition-all hover:shadow-xl hover:scale-105 ${
              selectedRole === 'doctor'
                ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                : 'border-ink-200 dark:border-ink-800'
            }`}
            onClick={() => setSelectedRole('doctor')}
          >
            <div className="text-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-6 inline-block mb-4">
                <Stethoscope className="h-16 w-16 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-ink-900 dark:text-white mb-3">
                Doctor
              </h3>
              <p className="text-ink-600 dark:text-ink-300 mb-6">
                Healthcare provider? Manage your appointments and see patient match requests.
              </p>

              <div className="space-y-2 text-left mb-6">
                <div className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-300">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>View waiting patients and their needs</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-300">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Review match requests and equity scores</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-300">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Manage your appointment slots</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate('/signup/doctor')
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Sign Up
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate('/login')
                  }}
                  className="flex-1"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-ink-500 dark:text-ink-400">
            Need help? Contact support or{' '}
            <a href="/firebase-status.html" className="text-brand-600 hover:underline">
              check system status
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Home
