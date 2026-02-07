import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectItem } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'

const Intake = () => {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    condition: '',
    symptoms: '',
    urgency: '3',
    zip: '',
    insurance: 'Medicaid',
    transportation: 'Public transit'
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    console.log('Intake form submitted:', formData)
    setSubmitted(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-500">New Intake</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">Patient Intake Form</h1>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
          Capture the patient profile to trigger routing workflows and equity scoring.
        </p>
      </div>

      <Card className="p-6">
        <form className="grid gap-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Patient Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Jordan Matthews" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Primary Condition</Label>
              <Input
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                placeholder="Cardiac arrhythmia"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="symptoms">Symptoms & Notes</Label>
            <Textarea
              id="symptoms"
              name="symptoms"
              value={formData.symptoms}
              onChange={handleChange}
              placeholder="Add symptoms, care constraints, and escalation flags."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency Level</Label>
              <Select id="urgency" name="urgency" value={formData.urgency} onChange={handleChange}>
                <SelectItem value="5">Level 5 - Critical</SelectItem>
                <SelectItem value="4">Level 4 - High</SelectItem>
                <SelectItem value="3">Level 3 - Moderate</SelectItem>
                <SelectItem value="2">Level 2 - Low</SelectItem>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input id="zip" name="zip" value={formData.zip} onChange={handleChange} placeholder="94107" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insurance">Insurance</Label>
              <Select id="insurance" name="insurance" value={formData.insurance} onChange={handleChange}>
                <SelectItem value="Medicaid">Medicaid</SelectItem>
                <SelectItem value="Medicare">Medicare</SelectItem>
                <SelectItem value="Commercial PPO">Commercial PPO</SelectItem>
                <SelectItem value="Uninsured">Uninsured</SelectItem>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="transportation">Transportation</Label>
              <Select
                id="transportation"
                name="transportation"
                value={formData.transportation}
                onChange={handleChange}
              >
                <SelectItem value="Public transit">Public transit</SelectItem>
                <SelectItem value="Community shuttle">Community shuttle</SelectItem>
                <SelectItem value="Rideshare support">Rideshare support</SelectItem>
                <SelectItem value="Family driver">Family driver</SelectItem>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">Submit Intake</Button>
            </div>
          </div>

          {submitted && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
              Intake captured. Routing workflows will activate within the next 2 minutes.
            </div>
          )}
        </form>
      </Card>
    </div>
  )
}

export default Intake
