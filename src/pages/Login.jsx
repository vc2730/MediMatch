import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectItem } from '../components/ui/select'
import { useAuth } from '../app/providers/AuthProvider'

const doctorDemo = {
  role: 'doctor',
  email: 'doctor@demo.com',
  password: 'demo1234'
}

const patientDemo = {
  role: 'patient',
  email: 'patient@demo.com',
  password: 'demo1234'
}

const Login = () => {
  const navigate = useNavigate()
  const { login, user } = useAuth()
  const [role, setRole] = useState('doctor')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (user) {
      navigate(user.role === 'patient' ? '/patient' : '/', { replace: true })
    }
  }, [user, navigate])

  const handleEmailChange = (event) => {
    const nextEmail = event.target.value
    setEmail(nextEmail)
    if (nextEmail === doctorDemo.email) setRole('doctor')
    if (nextEmail === patientDemo.email) setRole('patient')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    login(role, email)
    navigate(role === 'patient' ? '/patient' : '/', { replace: true })
  }

  const fillDemo = (demo) => {
    setRole(demo.role)
    setEmail(demo.email)
    setPassword(demo.password)
  }

  const continueDemo = (demo) => {
    login(demo.role, demo.email)
    navigate(demo.role === 'patient' ? '/patient' : '/', { replace: true })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="text-center">
        <Badge variant="neutral">Demo mode</Badge>
        <h1 className="mt-4 text-3xl font-semibold text-ink-900 dark:text-white">CareFlow Exchange Login</h1>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
          Use a demo account to explore doctor or patient workflows. No real authentication.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select id="role" value={role} onChange={(event) => setRole(event.target.value)}>
                <SelectItem value="doctor">Doctor / Admin</SelectItem>
                <SelectItem value="patient">Patient</SelectItem>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="you@demo.com"
                type="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="demo1234"
                type="password"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Sign In
            </Button>
            <p className="text-xs text-ink-400 dark:text-ink-500">
              Demo mode only. Credentials are not validated or sent anywhere.
            </p>
          </form>
        </Card>

        <Card className="space-y-4 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ink-400 dark:text-ink-500">Fast demo</p>
            <h2 className="mt-2 text-lg font-semibold text-ink-900 dark:text-white">One-click access</h2>
          </div>
          <div className="space-y-3">
            <Button variant="secondary" className="w-full" onClick={() => fillDemo(doctorDemo)}>
              Use Doctor Demo
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => fillDemo(patientDemo)}>
              Use Patient Demo
            </Button>
          </div>
          <div className="space-y-3">
            <Button className="w-full" onClick={() => continueDemo(doctorDemo)}>
              Continue as Doctor Demo
            </Button>
            <Button className="w-full" onClick={() => continueDemo(patientDemo)}>
              Continue as Patient Demo
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Login
