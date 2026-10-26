import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock3, Info, MapPin, Users } from 'lucide-react'
import api from '../../api/client'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import PageHeader from '../../components/PageHeader'
import { getErrorMessage } from '../../utils/errors'
import { timeToMinutes } from '../../utils/format'

const INITIAL_FORM = {
  date: '',
  startTime: '',
  endTime: '',
  topic: '',
  location: '',
}

export default function ManageSchedule() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
  }

  function validateForm() {
    const nextErrors = {}
    const start = timeToMinutes(form.startTime)
    const end = timeToMinutes(form.endTime)

    if (!form.date) {
      nextErrors.date = 'Date is required.'
    }

    if (start === null) {
      nextErrors.startTime = 'Start time is required.'
    } else if (start < 9 * 60) {
      nextErrors.startTime = 'Start time cannot be before 9:00 AM.'
    }

    if (end === null) {
      nextErrors.endTime = 'End time is required.'
    } else if (end > 18 * 60) {
      nextErrors.endTime = 'End time cannot be after 6:00 PM.'
    } else if (start !== null && end <= start) {
      nextErrors.endTime = 'End time must be after the start time.'
    }

    if (!form.topic.trim()) {
      nextErrors.topic = 'Topic is required.'
    }

    if (!form.location.trim()) {
      nextErrors.location = 'Office or room location is required.'
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      await api.post('/schedules', form)
      setForm(INITIAL_FORM)
      setSuccess('Schedule created successfully.')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  const rules = [
    {
      icon: Clock3,
      title: 'Consultation hours',
      text: 'Schedules must start at or after 9:00 AM and end at or before 6:00 PM.',
    },
    {
      icon: MapPin,
      title: 'Face-to-face only',
      text: 'Provide the exact office or room where the student should report.',
    },
    {
      icon: Users,
      title: 'Slot capacity',
      text: 'Each schedule defaults to 5 consultation slots. Overlapping schedules are blocked.',
    },
  ]

  return (
    <>
      <PageHeader
        title="Manage Schedule"
        description="Create an availability window for student consultations."
        action={
          <Button as={Link} to="/faculty/schedules" variant="secondary">
            View my schedule
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <Alert tone="error">{error}</Alert>}
            {success && <Alert tone="success">{success}</Alert>}

            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                error={fieldErrors.date}
                required
              />
              <div className="hidden sm:block" />
              <Input
                label="Start time"
                name="startTime"
                type="time"
                min="09:00"
                max="18:00"
                step="900"
                value={form.startTime}
                onChange={handleChange}
                error={fieldErrors.startTime}
                required
              />
              <Input
                label="End time"
                name="endTime"
                type="time"
                min="09:00"
                max="18:00"
                step="900"
                value={form.endTime}
                onChange={handleChange}
                error={fieldErrors.endTime}
                required
              />
            </div>

            <Input
              label="Topic"
              name="topic"
              placeholder="e.g. Thesis consultation"
              value={form.topic}
              onChange={handleChange}
              error={fieldErrors.topic}
              required
            />

            <Input
              label="Office / room location"
              name="location"
              placeholder="e.g. Room 204, Engineering Building"
              value={form.location}
              onChange={handleChange}
              error={fieldErrors.location}
              hint="Students will see this location in their appointment details."
              required
            />

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setForm(INITIAL_FORM)
                  setFieldErrors({})
                  setError('')
                  setSuccess('')
                }}
              >
                Reset
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating schedule...' : 'Create schedule'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="h-fit p-5">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            <h2 className="font-display text-[13px] font-bold text-slate-800">
              Scheduling rules
            </h2>
          </div>
          <div className="mt-4 space-y-4">
            {rules.map((rule) => {
              const Icon = rule.icon

              return (
                <div key={rule.title} className="flex gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {rule.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">
                      {rule.text}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </>
  )
}
