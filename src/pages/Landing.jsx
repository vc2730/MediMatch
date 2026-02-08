import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Bolt, Brain, HeartPulse, Mic, Sparkles, Users, TrendingDown, Clock, Award } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import SectionHeader from '../components/SectionHeader'
import { useAuth } from '../contexts/AuthContext'
import { sponsorIntegrations, wastedSlotsStats } from '../lib/demoData'


const steps = [
  {
    title: 'Arrive & Triage',
    description: 'Patient checks in and ESI triage level is captured instantly.',
    icon: HeartPulse
  },
  {
    title: 'ER Match',
    description: 'Equity-weighted algorithm assigns the best available ER room based on urgency and barriers.',
    icon: Sparkles
  },
  {
    title: 'Route',
    description: 'FlowGlad workflows notify care teams and update room status in real time.',
    icon: Bolt
  },
  {
    title: 'Notify',
    description: 'Voice and text updates keep patients informed of their ER room assignment.',
    icon: Mic
  }
]

const Landing = () => {
  const navigate = useNavigate()
  const { user, userRole, loginDemo } = useAuth()
  const [livesImpacted, setLivesImpacted] = useState(0)

  // Animated counter for lives impacted
  useEffect(() => {
    const targetCount = 12847 // Total lives impacted
    const duration = 2000 // 2 seconds
    const increment = Math.ceil(targetCount / (duration / 16)) // 60fps

    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= targetCount) {
        setLivesImpacted(targetCount)
        clearInterval(timer)
      } else {
        setLivesImpacted(current)
      }
    }, 16)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (user) {
      navigate(userRole === 'patient' ? '/patient' : '/doctor', { replace: true })
    }
  }, [user, userRole, navigate])

  const handleDemo = (role) => {
    loginDemo(role)
    navigate(role === 'patient' ? '/patient' : '/doctor', { replace: true })
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
              Route ER patients faster with real-time equity-aware triage.
            </h1>
            <p className="mt-4 text-base text-white/80">
              MediMatch assigns ER rooms based on medical urgency and equity factors — ensuring the sickest and most
              vulnerable patients are seen first, every time.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => handleDemo('doctor')}>
                Continue as Doctor Demo
                <ArrowUpRight className="h-4 w-4" />
              </Button>
              <Button variant="secondary" className="bg-white/90 text-ink-900" onClick={() => handleDemo('patient')}>
                Continue as Patient Demo
              </Button>
              <Button variant="outline" className="border-white/40 text-white" onClick={() => navigate('/login')}>
                Log in
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-white/15 bg-white/10 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Patients triaged</p>
              <p className="mt-3 text-3xl font-semibold">{wastedSlotsStats.patientsRouted}</p>
              <p className="mt-2 text-sm text-white/70">Routed this month</p>
            </Card>
            <Card className="border-white/15 bg-white/10 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Avg ER wait</p>
              <p className="mt-3 text-3xl font-semibold">{wastedSlotsStats.averageWaitTime}</p>
              <p className="mt-2 text-sm text-white/70">Min across all rooms</p>
            </Card>
            <Card className="border-white/15 bg-white/10 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Equity score</p>
              <p className="mt-3 text-3xl font-semibold">{wastedSlotsStats.equityImpactScore}</p>
              <p className="mt-2 text-sm text-white/70">Triage equity benchmark</p>
            </Card>
            <Card className="border-white/15 bg-white/10 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">ER bottlenecks solved</p>
              <p className="mt-3 text-3xl font-semibold">{wastedSlotsStats.totalWastedLastMonth}</p>
              <p className="mt-2 text-sm text-white/70">Rooms cleared</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Lives Impacted Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-8 py-12 text-white shadow-xl">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="w-6 h-6" />
            <Badge variant="neutral" className="bg-white/20 text-white border-white/30">
              Social Impact
            </Badge>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-3">
            {livesImpacted.toLocaleString()}
          </h2>
          <p className="text-xl font-semibold mb-2">Lives Impacted Through Equitable Care</p>
          <p className="text-sm text-white/80 max-w-2xl mx-auto">
            By prioritizing patients with the greatest barriers to care, MediMatch has helped thousands of underserved individuals receive timely emergency treatment.
          </p>
        </div>
      </section>

      {/* Equity Metrics Dashboard */}
      <section className="space-y-6">
        <SectionHeader
          eyebrow="Reducing Healthcare Disparities"
          title="Equity Impact Metrics"
          description="Real data showing how MediMatch reduces wait times for underserved populations."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6 border-l-4 border-l-green-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">Medicaid Patients</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">-34%</p>
            <p className="text-sm text-ink-600 dark:text-ink-300">Average wait time reduction</p>
            <div className="mt-4 pt-4 border-t border-ink-200 dark:border-ink-800">
              <p className="text-xs text-ink-500 dark:text-ink-400">
                <span className="font-semibold">Before:</span> 186 min → <span className="font-semibold">After:</span> 123 min
              </p>
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-blue-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">Uninsured Patients</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">-41%</p>
            <p className="text-sm text-ink-600 dark:text-ink-300">Wait time disparity eliminated</p>
            <div className="mt-4 pt-4 border-t border-ink-200 dark:border-ink-800">
              <p className="text-xs text-ink-500 dark:text-ink-400">
                <span className="font-semibold">Before:</span> 203 min → <span className="font-semibold">After:</span> 120 min
              </p>
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-purple-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">High-Equity Patients</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">78%</p>
            <p className="text-sm text-ink-600 dark:text-ink-300">Prioritized in triage queue</p>
            <div className="mt-4 pt-4 border-t border-ink-200 dark:border-ink-800">
              <p className="text-xs text-ink-500 dark:text-ink-400">
                Patients with 3+ barriers to care
              </p>
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-orange-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">Equity Score</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">92/100</p>
            <p className="text-sm text-ink-600 dark:text-ink-300">Healthcare equity benchmark</p>
            <div className="mt-4 pt-4 border-t border-ink-200 dark:border-ink-800">
              <p className="text-xs text-ink-500 dark:text-ink-400">
                Industry average: 64/100
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* AI & Automation Stack */}
      <section className="space-y-6">
        <SectionHeader
          eyebrow="Powered by Advanced AI"
          title="Three AI Systems Working Together"
          description="Medical reasoning, care coordination, and workflow automation unified for equitable patient care."
        />
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6 border-t-4 border-t-purple-500">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200 mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-ink-900 dark:text-white mb-2">K2-Think AI</h3>
            <p className="text-sm text-ink-500 dark:text-ink-300 mb-3">
              Medical reasoning model analyzes symptoms and generates clinical insights with transparent audit trails.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">Clinical Analysis</Badge>
              <Badge variant="secondary" className="text-xs">Differential Diagnosis</Badge>
            </div>
          </Card>

          <Card className="p-6 border-t-4 border-t-blue-500">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200 mb-4">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-ink-900 dark:text-white mb-2">Deadalus Labs</h3>
            <p className="text-sm text-ink-500 dark:text-ink-300 mb-3">
              AI coordination agent generates intelligent care plans, resource allocation, and optimization strategies.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">Care Coordination</Badge>
              <Badge variant="secondary" className="text-xs">Resource Planning</Badge>
            </div>
          </Card>

          <Card className="p-6 border-t-4 border-t-green-500">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200 mb-4">
              <Bolt className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-ink-900 dark:text-white mb-2">FlowGlad</h3>
            <p className="text-sm text-ink-500 dark:text-ink-300 mb-3">
              Workflow automation executes care plans in real-time: notifications, room prep, and EHR updates.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">Workflow Automation</Badge>
              <Badge variant="secondary" className="text-xs">Real-time Execution</Badge>
            </div>
          </Card>
        </div>

        {/* Integration Flow Diagram */}
        <Card className="p-8 bg-gradient-to-br from-ink-50 to-white dark:from-ink-900 dark:to-ink-950">
          <h4 className="text-center font-semibold text-ink-900 dark:text-white mb-6">Integration Flow</h4>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200 mx-auto mb-2">
                <Sparkles className="h-8 w-8" />
              </div>
              <p className="text-xs font-semibold">K2-Think</p>
              <p className="text-xs text-ink-500">Clinical Analysis</p>
            </div>
            <ArrowUpRight className="h-6 w-6 text-ink-400" />
            <div className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200 mx-auto mb-2">
                <HeartPulse className="h-8 w-8" />
              </div>
              <p className="text-xs font-semibold">Match Created</p>
              <p className="text-xs text-ink-500">Equity Algorithm</p>
            </div>
            <ArrowUpRight className="h-6 w-6 text-ink-400" />
            <div className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200 mx-auto mb-2">
                <Brain className="h-8 w-8" />
              </div>
              <p className="text-xs font-semibold">Deadalus</p>
              <p className="text-xs text-ink-500">Coordination Plan</p>
            </div>
            <ArrowUpRight className="h-6 w-6 text-ink-400" />
            <div className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200 mx-auto mb-2">
                <Bolt className="h-8 w-8" />
              </div>
              <p className="text-xs font-semibold">FlowGlad</p>
              <p className="text-xs text-ink-500">Workflow Execution</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="space-y-6">
        <SectionHeader
          eyebrow="How it works"
          title="Triage, match, and route in seconds"
          description="A real-time ER workflow that puts the right patient in the right room — equitably."
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
              Live ER routing data from CareFlow Exchange triage engines.
            </p>
          </div>
          <div className="grid gap-4 md:col-span-2 md:grid-cols-3">
            <Card className="p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-ink-400 dark:text-ink-500">Rooms saved</p>
              <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">
                {wastedSlotsStats.totalWastedLastMonth}
              </p>
              <p className="mt-2 text-xs text-ink-500 dark:text-ink-300">Avoided ER backlog</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-ink-400 dark:text-ink-500">Patients triaged</p>
              <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">
                {wastedSlotsStats.patientsRouted}
              </p>
              <p className="mt-2 text-xs text-ink-500 dark:text-ink-300">Routed this month</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-ink-400 dark:text-ink-500">Equity score</p>
              <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">
                {wastedSlotsStats.equityImpactScore}
              </p>
              <p className="mt-2 text-xs text-ink-500 dark:text-ink-300">7-day triage equity</p>
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
