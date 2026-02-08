import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { signIn, getAuthErrorMessage } from '../services/auth'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, AlertCircle, ArrowLeft, TestTube, Stethoscope } from 'lucide-react'
import { createTestPatientAccount, createTestDoctorAccount, TEST_ACCOUNT, TEST_DOCTOR_ACCOUNT } from '../scripts/createTestAccount'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [creatingTest, setCreatingTest] = useState(false)
  const [creatingDoctor, setCreatingDoctor] = useState(false)
  const [testSuccess, setTestSuccess] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('') // Clear error on input change
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { user, profile } = await signIn(formData.email, formData.password)

      // Update auth context
      login(user.uid, profile.role, profile)

      // Navigate based on role
      if (profile.role === 'patient') {
        navigate('/patient/portal')
      } else if (profile.role === 'doctor') {
        navigate('/doctor/dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(getAuthErrorMessage(err.code))
    } finally {
      setLoading(false)
    }
  }

  // One-click demo login: create account if needed, then sign in immediately
  const handleDemoLogin = async (role) => {
    const isDoctor = role === 'doctor'
    if (isDoctor) setCreatingDoctor(true)
    else setCreatingTest(true)
    setError('')
    setTestSuccess(false)

    const email = isDoctor ? TEST_DOCTOR_ACCOUNT.email : TEST_ACCOUNT.email
    const password = isDoctor ? TEST_DOCTOR_ACCOUNT.password : TEST_ACCOUNT.password

    try {
      // Try signing in directly first (account likely exists)
      const { user, profile } = await signIn(email, password)
      login(user.uid, profile.role, profile)
      navigate(isDoctor ? '/doctor/dashboard' : '/patient/portal')
    } catch (signInErr) {
      // Account doesn't exist yet — create it, then sign in
      try {
        if (isDoctor) await createTestDoctorAccount()
        else await createTestPatientAccount()
        const { user, profile } = await signIn(email, password)
        login(user.uid, profile.role, profile)
        navigate(isDoctor ? '/doctor/dashboard' : '/patient/portal')
      } catch (createErr) {
        console.error('Demo login error:', createErr)
        setError('Demo login failed. Please try the manual form.')
        setFormData({ email, password })
      }
    } finally {
      setCreatingDoctor(false)
      setCreatingTest(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-ink-50 dark:from-ink-950 dark:to-brand-950 p-4">
      <div className="max-w-md w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-ink-900 dark:text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-ink-600 dark:text-ink-300">
            Sign in to your MediMatch account
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            )}

            {testSuccess && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-500/30 dark:bg-green-500/10">
                <div className="flex items-center gap-2">
                  <TestTube className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Test account ready! Credentials have been filled in. Click Sign In to continue.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-ink-200 dark:border-ink-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white dark:bg-ink-900 text-ink-400 font-medium uppercase tracking-wider">Quick Demo Login</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDemoLogin('doctor')}
                disabled={creatingTest || creatingDoctor || loading}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-4 text-center hover:border-blue-400 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-500/30 dark:bg-blue-500/10 dark:hover:bg-blue-500/20"
              >
                {creatingDoctor ? (
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                ) : (
                  <Stethoscope className="h-6 w-6 text-blue-600" />
                )}
                <div>
                  <p className="text-sm font-bold text-blue-800 dark:text-blue-200">Doctor Dashboard</p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-0.5">Receives patient alerts</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('patient')}
                disabled={creatingTest || creatingDoctor || loading}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-purple-200 bg-purple-50 px-4 py-4 text-center hover:border-purple-400 hover:bg-purple-100 disabled:opacity-50 dark:border-purple-500/30 dark:bg-purple-500/10 dark:hover:bg-purple-500/20"
              >
                {creatingTest ? (
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                ) : (
                  <TestTube className="h-6 w-6 text-purple-600" />
                )}
                <div>
                  <p className="text-sm font-bold text-purple-800 dark:text-purple-200">Patient Portal</p>
                  <p className="text-xs text-purple-600 dark:text-purple-300 mt-0.5">Find ER room</p>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-ink-200 dark:border-ink-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-ink-900 text-ink-500 dark:text-ink-400">
                  Don't have an account?
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/signup/patient')}
              >
                Sign up as Patient
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/signup/doctor')}
              >
                Sign up as Doctor
              </Button>
            </div>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-ink-600 dark:text-ink-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Login
