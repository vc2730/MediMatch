import { useState } from 'react'
import { AlertTriangle, Bell, Calendar, CheckCircle2, HelpCircle, Mic, Volume2 } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import Modal from '../components/Modal'
import SectionHeader from '../components/SectionHeader'
import { matchExplanation, patientAppointment, patientNotifications, patientProfile } from '../lib/demoData'

const statusVariants = {
  Matched: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
  Confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
}

const PatientPortal = () => {
  const [status, setStatus] = useState(patientProfile.status)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [notifications, setNotifications] = useState(patientNotifications)

  const iconMap = {
    calendar: Calendar,
    bell: Bell,
    check: CheckCircle2,
    alert: AlertTriangle
  }

  const markAllRead = () => {
    setNotifications((prev) => prev.map((note) => ({ ...note, read: true })))
  }

  const toggleRead = (id) => {
    setNotifications((prev) =>
      prev.map((note) => (note.id === id ? { ...note, read: !note.read } : note))
    )
  }

  const confirmAppointment = () => {
    setStatus('Confirmed')
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Patient Portal"
        title="Patient Updates"
        description="Stay informed with appointment status, care coordination, and reminders."
        action={
          <div className="flex items-center gap-2 rounded-full bg-ink-100 px-4 py-2 text-xs font-semibold text-ink-600 dark:bg-ink-800 dark:text-ink-200">
            <HelpCircle className="h-4 w-4" />
            {patientProfile.support}
          </div>
        }
      />

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-500">Patient Summary</p>
            <h1 className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">{patientProfile.name}</h1>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">CareFlow Exchange status update</p>
          </div>
          <span className={`rounded-full px-4 py-2 text-xs font-semibold ${statusVariants[status]}`}>{status}</span>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-100 p-3 text-brand-600 dark:bg-brand-500/20 dark:text-brand-200">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-400 dark:text-ink-500">Upcoming Appointment</p>
              <p className="mt-1 text-lg font-semibold text-ink-900 dark:text-white">
                {patientAppointment.date} · {patientAppointment.time}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 text-sm text-ink-500 dark:text-ink-300">
            <p>
              {patientAppointment.clinic} · {patientAppointment.address}
            </p>
            <p>
              {patientAppointment.doctor} · {patientAppointment.specialty}
            </p>
            <p>{patientAppointment.notes}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={confirmAppointment}>
              <CheckCircle2 className="h-4 w-4" />
              Confirm appointment
            </Button>
            <Button variant="outline" onClick={() => setCalendarOpen(true)}>
              Add to calendar
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-ink-100 p-3 text-ink-700 dark:bg-ink-800 dark:text-ink-200">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink-400 dark:text-ink-500">Notifications</p>
                <p className="mt-1 text-lg font-semibold text-ink-900 dark:text-white">Timeline</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={markAllRead}>
              Mark all read
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {notifications.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => toggleRead(note.id)}
                className={`relative w-full rounded-xl border px-4 py-3 pl-12 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                  note.read
                    ? 'border-ink-200/70 bg-white/70 dark:border-ink-800/70 dark:bg-ink-900/60'
                    : 'border-brand-200 bg-brand-50/60 dark:border-brand-500/40 dark:bg-brand-500/10'
                }`}
              >
                <span className="absolute left-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-200">
                  {(() => {
                    const Icon = iconMap[note.icon] || Bell
                    return <Icon className="h-4 w-4" />
                  })()}
                </span>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink-900 dark:text-white">{note.title}</p>
                    <p className="mt-1 text-xs text-ink-500 dark:text-ink-300">{note.body}</p>
                  </div>
                  {!note.read && <Badge variant="warning">New</Badge>}
                </div>
                <p className="mt-2 text-xs text-ink-400 dark:text-ink-500">{note.time}</p>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-900 dark:text-white">Voice Notification</h2>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
              Listen to the latest reminder in your preferred language.
            </p>
          </div>
          <Button onClick={() => setVoiceOpen(true)}>
            <Volume2 className="h-4 w-4" />
            Play voice notification
          </Button>
        </div>
      </Card>

      <Accordion type="single" collapsible className="space-y-2">
        <AccordionItem value="explain">
          <AccordionTrigger value="explain">Why was I prioritized?</AccordionTrigger>
          <AccordionContent value="explain">
            <ul className="list-disc space-y-2 pl-4">
              {matchExplanation.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Modal
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        title="Add to calendar"
        description="Copy and paste this ICS snippet into your calendar app."
        actions={
          <Button variant="outline" onClick={() => setCalendarOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-xs text-ink-700 dark:border-ink-800 dark:bg-ink-900/70 dark:text-ink-200">
          BEGIN:VCALENDAR
          <br />
          VERSION:2.0
          <br />
          BEGIN:VEVENT
          <br />
          SUMMARY:CareFlow Appointment
          <br />
          DTSTART:20260304T103000
          <br />
          LOCATION:{patientAppointment.address}
          <br />
          DESCRIPTION:{patientAppointment.clinic} with {patientAppointment.doctor}
          <br />
          END:VEVENT
          <br />
          END:VCALENDAR
        </div>
      </Modal>

      <Modal
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        title="Voice reminder"
        description="Transcript and preview"
        actions={
          <Button variant="outline" onClick={() => setVoiceOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-sm text-ink-600 dark:border-ink-800 dark:bg-ink-900/70 dark:text-ink-200">
            "Hello {patientProfile.name}, this is a reminder for your appointment on {patientAppointment.date} at{' '}
            {patientAppointment.time}. Please arrive 15 minutes early."
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-ink-200 bg-white/70 px-4 py-3 text-sm text-ink-500 dark:border-ink-800 dark:bg-ink-950/70 dark:text-ink-300">
            <Mic className="h-4 w-4" />
            Audio preview coming soon
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default PatientPortal
