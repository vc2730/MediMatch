import {
  ArrowUpRight,
  ClipboardList,
  ListChecks,
  Sparkles,
  UserRound,
  Workflow
} from 'lucide-react'
import StatCard from '../components/StatCard'
import QuickActionCard from '../components/QuickActionCard'
import PatientQueueItem from '../components/PatientQueueItem'
import KpiCard from '../components/KpiCard'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { operationsKpis, priorityPatients, recentActivity, wastedSlotsStats } from '../lib/demoData'
import { calculateEquityScore } from '../lib/equityEngine'

const Dashboard = () => {
  const topPatients = [...priorityPatients]
    .map((patient) => ({ ...patient, score: calculateEquityScore(patient) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 p-8 text-white shadow-glow">
        <div className="absolute inset-0 opacity-30" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
              <Sparkles className="h-3 w-3" />
              Equity Pulse
            </div>
            <h1 className="mt-6 text-3xl font-semibold leading-tight md:text-4xl">
              Accelerate high-impact patient routing with CareFlow Exchange
            </h1>
            <p className="mt-3 text-sm text-white/80 md:text-base">
              Real-time scheduling intelligence that prioritizes equity, reduces delays, and surfaces high-risk cases
              before capacity gaps become crises.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="secondary" className="bg-white/90 text-brand-700 hover:bg-white">
                Review Active Queue
                <ArrowUpRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="border-white/40 text-white hover:bg-white/10">
                View Analytics
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Wasted Slots"
              value={wastedSlotsStats.totalWastedLastMonth}
              trend="+12% MoM"
              icon={ListChecks}
              className="bg-white/95 text-ink-900"
            />
            <StatCard
              label="Patients Routed"
              value={wastedSlotsStats.patientsRouted}
              trend="+18%"
              icon={ClipboardList}
              className="bg-white/95 text-ink-900"
            />
            <StatCard
              label="Average Wait"
              value={wastedSlotsStats.averageWaitTime}
              trend="-2.1 days"
              icon={Workflow}
              className="bg-white/95 text-ink-900"
            />
            <StatCard
              label="Equity Impact"
              value={wastedSlotsStats.equityImpactScore}
              trend="Top 10%"
              icon={Sparkles}
              className="bg-white/95 text-ink-900"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-ink-900 dark:text-white">Quick Actions</h2>
            <Badge variant="neutral">4 flows ready</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <QuickActionCard
              title="New Patient Intake"
              description="Capture high-risk details and route instantly."
              to="/intake"
              icon={ClipboardList}
            />
            <QuickActionCard
              title="Run Matching"
              description="Balance capacity with equity scoring."
              to="/matching"
              icon={Sparkles}
            />
            <QuickActionCard
              title="FlowGlad Journeys"
              description="Automate the care journey lifecycle."
              to="/flowglad"
              icon={Workflow}
            />
            <QuickActionCard
              title="Slots Management"
              description="Track open capacity and fill priority slots."
              to="/slots"
              icon={ListChecks}
            />
          </div>
        </div>
        <Card className="h-full p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-400 dark:text-ink-500">High Priority Queue</p>
              <h3 className="mt-2 text-lg font-semibold text-ink-900 dark:text-white">Top Equity Patients</h3>
            </div>
            <Badge variant="warning">3 critical</Badge>
          </div>
          <div className="mt-4 space-y-4">
            {topPatients.map((patient) => (
              <PatientQueueItem key={patient.id} patient={patient} score={patient.score} />
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-ink-900 dark:text-white">Today’s Operations</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {operationsKpis.map((kpi) => (
              <KpiCard key={kpi.id} label={kpi.label} value={kpi.value} trend={kpi.trend} />
            ))}
          </div>
        </div>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-400 dark:text-ink-500">Recent activity</p>
              <h3 className="mt-2 text-lg font-semibold text-ink-900 dark:text-white">Operational feed</h3>
            </div>
            <Badge variant="neutral">Live</Badge>
          </div>
          <div className="mt-4 space-y-4">
            {recentActivity.map((item) => (
              <div key={item.id} className="rounded-xl border border-ink-200/70 bg-white/70 p-4 dark:border-ink-800/70 dark:bg-ink-900/60">
                <p className="text-sm font-semibold text-ink-900 dark:text-white">{item.title}</p>
                <p className="mt-1 text-xs text-ink-500 dark:text-ink-300">{item.description}</p>
                <p className="mt-2 text-xs text-ink-400 dark:text-ink-500">{item.time}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  )
}

export default Dashboard
