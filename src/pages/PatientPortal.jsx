import { useState } from 'react'
import { Bell, Calendar, Volume2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'

const PatientPortal = () => {
  const [played, setPlayed] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-500">Patient Portal</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">Patient Updates</h1>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
          Keep patients informed with appointments, reminders, and voice notifications.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-100 p-3 text-brand-600 dark:bg-brand-500/20 dark:text-brand-200">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-400 dark:text-ink-500">Upcoming Appointment</p>
              <p className="mt-1 text-lg font-semibold text-ink-900 dark:text-white">March 4, 10:30 AM</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-ink-500 dark:text-ink-300">
            Cardiovascular clinic visit with Dr. Vega · Summit Specialty Center
          </p>
          <Button variant="secondary" className="mt-4">
            Reschedule
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-ink-100 p-3 text-ink-700 dark:bg-ink-800 dark:text-ink-200">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-400 dark:text-ink-500">Notifications</p>
              <p className="mt-1 text-lg font-semibold text-ink-900 dark:text-white">Latest Activity</p>
            </div>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-ink-500 dark:text-ink-300">
            <li>Transportation confirmed for March 4 appointment.</li>
            <li>Care coordinator assigned: Maya Torres.</li>
            <li>Medication pickup reminder scheduled for tomorrow.</li>
          </ul>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-900 dark:text-white">Voice Notification</h2>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
              Send a personalized reminder to the patient via voice.
            </p>
          </div>
          <Button onClick={() => setPlayed(true)}>
            <Volume2 className="h-4 w-4" />
            Play Voice Notification
          </Button>
        </div>
        {played && (
          <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-200">
            Voice notification played. (Placeholder - no audio service connected yet.)
          </div>
        )}
      </Card>
    </div>
  )
}

export default PatientPortal
