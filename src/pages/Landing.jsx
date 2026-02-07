import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Bolt, HeartPulse, Mic, Sparkles } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import SectionHeader from '../components/SectionHeader'
import { useAuth } from '../app/providers/AuthProvider'
import { sponsorIntegrations, wastedSlotsStats } from '../lib/demoData'

const doctorDemo = { role: 'doctor', email: 'doctor@demo.com' }
const patientDemo = { role: 'patient', email: 'patient@demo.com' }

const steps = [
  {
    title: 'Intake',
    description: 'Capture high-risk context in minutes with structured intake data.',
    icon: HeartPulse
  },
  {
    title: 'Match',
    description: 'Balance capacity with equity scoring to surface urgent cases.',
    icon: Sparkles
  },
  {
    title: 'Workflow',
    description: 'Trigger FlowGlad workflows and task orchestration automatically.',
    icon: Bolt
  },
  {
    title: 'Notify',
    description: 'Send voice reminders and patient updates instantly.',
    icon: Mic
  }
]

const Landing = () => {
  const navigate = useNavigate()
  const { user, login } = useAuth()

  useEffect(() => {
    if (user) {
      navigate(user.role === 'patient' ? '/patient' : '/', { replace: true })
    }
  }, [user, navigate])

  const handleDemo = (demo) => {
    login(demo.role, demo.email)
    navigate(demo.role === 'patient' ? '/patient' : '/', { replace: true })
  }

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-2xl border border-white/30 bg-gradient-to-br from-ink-900 via-ink-800 to-brand-700 px-8 py-14 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-40" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <Badge variant="neutral" className="bg-white/15 text-white">
              Hackathon Demo · CareFlow Exchange
            </Badge>
            <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-5xl">
              Close care gaps with real-time equity-aware scheduling.
            </h1>
            <p className="mt-4 text-base text-white/80">
              MediMatch helps hospitals and clinics route patients faster, reduce wasted slots, and prioritize the
              highest-impact cases with AI-assisted workflows.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => handleDemo(doctorDemo)}>
                Continue as Doctor Demo
                <ArrowUpRight className="h-4 w-4" />
              </Button>
              <Button variant="secondary" className="bg-white/90 text-ink-900" onClick={() => handleDemo(patientDemo)}>
                Continue as Patient Demo
              </Button>
              <Button variant="outline" className="border-white/40 text-white" onClick={() => navigate('/login')}>
                Log in
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-white/15 bg-white/10 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Live impact</p>
              <p className="mt-3 text-3xl font-semibold">{wastedSlotsStats.patientsRouted}</p>
              <p className="mt-2 text-sm text-white/70">Patients routed this month</p>
            </Card>
            <Card className="border-white/15 bg-white/10 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Avg wait time</p>
              <p className="mt-3 text-3xl font-semibold">{wastedSlotsStats.averageWaitTime}</p>
              <p className="mt-2 text-sm text-white/70">Across priority queue</p>
            </Card>
            <Card className="border-white/15 bg-white/10 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Equity score</p>
              <p className="mt-3 text-3xl font-semibold">{wastedSlotsStats.equityImpactScore}</p>
              <p className="mt-2 text-sm text-white/70">Impact benchmark</p>
            </Card>
            <Card className="border-white/15 bg-white/10 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Open slots saved</p>
              <p className="mt-3 text-3xl font-semibold">{wastedSlotsStats.totalWastedLastMonth}</p>
              <p className="mt-2 text-sm text-white/70">Avoided loss</p>
            </Card>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader
          eyebrow="How it works"
          title="Match, route, and notify in minutes"
          description="A streamlined workflow built for care operations teams and patient experience leaders."
        />
        <div className="grid gap-4 md:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <Card key={step.title} className="p-6 transition hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink-900 dark:text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">{step.description}</p>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader
          eyebrow="Sponsor integrations"
          title="Built alongside clinical innovation partners"
          description="Signal-ready integrations for scheduling, intelligence, and voice outreach."
        />
        <div className="flex flex-wrap gap-3">
          {sponsorIntegrations.map((integration) => (
            <div
              key={integration.id}
              className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white/70 px-4 py-2 text-sm font-semibold text-ink-700 shadow-sm dark:border-ink-800 dark:bg-ink-900/60 dark:text-ink-100"
            >
              <Bolt className="h-4 w-4 text-brand-500" />
              {integration.name}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-ink-200 bg-white/80 p-8 shadow-sm dark:border-ink-800 dark:bg-ink-900/70">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-500">Live metrics</p>
            <h3 className="mt-3 text-2xl font-semibold text-ink-900 dark:text-white">Operational pulse</h3>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
              Updated every 15 minutes from CareFlow Exchange routing engines.
            </p>
          </div>
          <div className="grid gap-4 md:col-span-2 md:grid-cols-3">
            <Card className="p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-ink-400 dark:text-ink-500">Wasted slots</p>
              <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">
                {wastedSlotsStats.totalWastedLastMonth}
              </p>
              <p className="mt-2 text-xs text-ink-500 dark:text-ink-300">Last 30 days</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-ink-400 dark:text-ink-500">Patients routed</p>
              <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">
                {wastedSlotsStats.patientsRouted}
              </p>
              <p className="mt-2 text-xs text-ink-500 dark:text-ink-300">High priority cohort</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-ink-400 dark:text-ink-500">Equity impact</p>
              <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">
                {wastedSlotsStats.equityImpactScore}
              </p>
              <p className="mt-2 text-xs text-ink-500 dark:text-ink-300">Rolling 7-day score</p>
            </Card>
          </div>
        </div>
      </section>

      <footer className="rounded-2xl border border-ink-200 bg-white/70 px-6 py-6 text-xs text-ink-500 dark:border-ink-800 dark:bg-ink-900/60 dark:text-ink-400">
        Demo environment for hackathon judging only. No real patient data or clinical systems are connected.
      </footer>
    </div>
  )
}

export default Landing
