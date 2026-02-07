import { useMemo, useState } from 'react'
import { CalendarCheck, Plus, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectItem } from '../components/ui/select'
import SectionHeader from '../components/SectionHeader'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import { openSlots as seededSlots } from '../lib/demoData'

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const Slots = () => {
  const [slots, setSlots] = useState(seededSlots)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [newSlot, setNewSlot] = useState({
    date: 'Mon',
    dateFull: '',
    time: '',
    specialty: '',
    clinic: ''
  })

  const slotsByDay = useMemo(() => {
    const map = Object.fromEntries(weekDays.map((day) => [day, []]))
    slots.forEach((slot) => {
      if (map[slot.date]) map[slot.date].push(slot)
    })
    return map
  }, [slots])

  const handleAddSlot = () => {
    if (!newSlot.time || !newSlot.specialty || !newSlot.clinic) {
      setFormError('Please fill in time, specialty, and clinic.')
      return
    }

    const slot = {
      id: `SL-${Math.floor(1000 + Math.random() * 9000)}`,
      date: newSlot.date,
      dateFull: newSlot.dateFull || 'TBD',
      time: newSlot.time,
      specialty: newSlot.specialty,
      clinic: newSlot.clinic,
      status: 'open'
    }

    setSlots((prev) => [slot, ...prev])
    setIsModalOpen(false)
    setFormError('')
    setNewSlot({ date: 'Mon', dateFull: '', time: '', specialty: '', clinic: '' })
  }

  const toggleFilled = (slotId) => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              status: slot.status === 'filled' ? 'open' : 'filled'
            }
          : slot
      )
    )
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Slots management"
        title="Open slot inventory"
        description="Track open capacity and release new slots for priority routing."
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Slot
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-500">Upcoming slots</p>
              <h3 className="mt-2 text-lg font-semibold text-ink-900 dark:text-white">This week</h3>
            </div>
            <CalendarCheck className="h-5 w-5 text-brand-500" />
          </div>
          <div className="mt-4 space-y-3">
            {slots.length === 0 ? (
              <EmptyState
                title="No open slots"
                description="Add a new slot to start routing priority patients."
                action={<Button onClick={() => setIsModalOpen(true)}>Add slot</Button>}
              />
            ) : (
              slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex flex-col gap-3 rounded-xl border border-ink-200/70 bg-white/70 p-4 transition hover:-translate-y-1 hover:shadow-md dark:border-ink-800/70 dark:bg-ink-900/60 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink-900 dark:text-white">
                      {slot.specialty} · {slot.clinic}
                    </p>
                    <p className="text-xs text-ink-500 dark:text-ink-300">
                      {slot.dateFull} · {slot.time}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        slot.status === 'filled'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200'
                      }`}
                    >
                      {slot.status === 'filled' ? 'Filled' : 'Open'}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => toggleFilled(slot.id)}>
                      <CheckCircle2 className="h-4 w-4" />
                      {slot.status === 'filled' ? 'Reopen' : 'Mark Filled'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-500">Week view</p>
          <h3 className="mt-2 text-lg font-semibold text-ink-900 dark:text-white">Capacity calendar</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-ink-500 dark:text-ink-300 sm:grid-cols-3 lg:grid-cols-1">
            {weekDays.map((day) => (
              <div key={day} className="rounded-xl border border-ink-200/70 bg-white/60 p-3 dark:border-ink-800/70 dark:bg-ink-900/60">
                <p className="text-xs font-semibold text-ink-700 dark:text-ink-200">{day}</p>
                <div className="mt-2 space-y-2">
                  {slotsByDay[day].length === 0 ? (
                    <p className="text-xs text-ink-400 dark:text-ink-500">No slots</p>
                  ) : (
                    slotsByDay[day].map((slot) => (
                      <div
                        key={slot.id}
                        className="rounded-lg border border-ink-200/70 bg-white/80 px-2 py-1 text-[11px] text-ink-600 dark:border-ink-800/70 dark:bg-ink-950/70 dark:text-ink-300"
                      >
                        {slot.time} · {slot.specialty}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setFormError('')
        }}
        title="Add open slot"
        description="Log a new open appointment for routing."
        actions={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSlot}>Add Slot</Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Day of week</Label>
            <Select value={newSlot.date} onChange={(event) => setNewSlot((prev) => ({ ...prev, date: event.target.value }))}>
              {weekDays.map((day) => (
                <SelectItem key={day} value={day}>
                  {day}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date (optional)</Label>
            <Input
              placeholder="Mar 18"
              value={newSlot.dateFull}
              onChange={(event) => setNewSlot((prev) => ({ ...prev, dateFull: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Time</Label>
            <Input
              placeholder="2:30 PM"
              value={newSlot.time}
              onChange={(event) => setNewSlot((prev) => ({ ...prev, time: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Specialty</Label>
            <Input
              placeholder="Cardiology"
              value={newSlot.specialty}
              onChange={(event) => setNewSlot((prev) => ({ ...prev, specialty: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Clinic</Label>
            <Input
              placeholder="Summit Specialty Center"
              value={newSlot.clinic}
              onChange={(event) => setNewSlot((prev) => ({ ...prev, clinic: event.target.value }))}
            />
          </div>
          {formError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
              {formError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default Slots
