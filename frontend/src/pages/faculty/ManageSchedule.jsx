import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock3, Info, MapPin, Trash2, Users } from 'lucide-react'
import api from '../../api/client'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import PageHeader from '../../components/PageHeader'
import { getErrorMessage } from '../../utils/errors'
import { timeToMinutes } from '../../utils/format'

export default function ManageSchedule() {
  const [date, setDate] = useState('')
  const [topic, setTopic] = useState('')
  const [location, setLocation] = useState('')
  const [timeSlots, setTimeSlots] = useState([{ startTime: '', endTime: '' }])

  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleTimeSlotChange(index, field, value) {
    setTimeSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot)),
    )
    setFieldErrors((prev) => {
      const errorKey = `slot_${index}_${field}`
      if (prev[errorKey]) {
        const next = { ...prev }
        delete next[errorKey]
        return next
      }
      return prev
    })
  }

  function handleAddTimeSlot() {
    setTimeSlots((prev) => [...prev, { startTime: '', endTime: '' }])
  }

  function handleRemoveTimeSlot(indexToRemove) {
    setTimeSlots((prev) => prev.filter((_, i) => i !== indexToRemove))
    setFieldErrors((prev) => {
      const next = {}
      Object.keys(prev).forEach((key) => {
        if (!key.startsWith('slot_')) {
          next[key] = prev[key]
        }
      })
      return next
    })
  }

  function validateForm() {
    const nextErrors = {}

    if (!date) {
      nextErrors.date = 'Date is required.'
    }

    if (!topic.trim()) {
      nextErrors.topic = 'Topic is required.'
    }

    if (!location.trim()) {
      nextErrors.location = 'Office or room location is required.'
    }

    timeSlots.forEach((slot, index) => {
      const start = timeToMinutes(slot.startTime)
      const end = timeToMinutes(slot.endTime)

      if (start === null) {
        nextErrors[`slot_${index}_startTime`] = 'Start time is required.'
      } else if (start < 9 * 60) {
        nextErrors[`slot_${index}_startTime`] = 'Cannot be before 9:00 AM.'
      }

      if (end === null) {
        nextErrors[`slot_${index}_endTime`] = 'End time is required.'
      } else if (end > 18 * 60) {
        nextErrors[`slot_${index}_endTime`] = 'Cannot be after 6:00 PM.'
      } else if (start !== null && end <= start) {
        nextErrors[`slot_${index}_endTime`] = 'End time must be after start time.'
      }
    })

    // Check for internal overlaps between time slots
    for (let i = 0; i < timeSlots.length; i++) {
      const startA = timeToMinutes(timeSlots[i].startTime)
      const endA = timeToMinutes(timeSlots[i].endTime)
      if (startA === null || endA === null || endA <= startA) continue

      for (let j = i + 1; j < timeSlots.length; j++) {
        const startB = timeToMinutes(timeSlots[j].startTime)
        const endB = timeToMinutes(timeSlots[j].endTime)
        if (startB === null || endB === null || endB <= startB) continue

        if (Math.max(startA, startB) < Math.min(endA, endB)) {
          nextErrors[`slot_${j}_startTime`] = 'Overlaps with another slot.'
          nextErrors[`slot_${j}_endTime`] = 'Overlaps with another slot.'
        }
      }
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
      const requests = timeSlots.map((slot) =>
        api.post('/schedules', {
          date,
          topic,
          location,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }),
      )

      await Promise.all(requests)

      setDate('')
      setTopic('')
      setLocation('')
      setTimeSlots([{ startTime: '', endTime: '' }])
      setFieldErrors({})
      setSuccess(
        timeSlots.length > 1
          ? `All ${timeSlots.length} schedules created successfully.`
          : 'Schedule created successfully.',
      )
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  function handleReset() {
    setDate('')
    setTopic('')
    setLocation('')
    setTimeSlots([{ startTime: '', endTime: '' }])
    setFieldErrors({})
    setError('')
    setSuccess('')
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
        title="Manage My Schedule"
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

            <Input
              label="Date"
              name="date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                if (fieldErrors.date) {
                  setFieldErrors((prev) => ({ ...prev, date: '' }))
                }
              }}
              error={fieldErrors.date}
              required
            />

            <Input
              label="Topic"
              name="topic"
              placeholder="e.g. Thesis consultation"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value)
                if (fieldErrors.topic) {
                  setFieldErrors((prev) => ({ ...prev, topic: '' }))
                }
              }}
              error={fieldErrors.topic}
              required
            />

            <Input
              label="Office / Room Location"
              name="location"
              placeholder="e.g. Room 204, Engineering Building"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value)
                if (fieldErrors.location) {
                  setFieldErrors((prev) => ({ ...prev, location: '' }))
                }
              }}
              error={fieldErrors.location}
              hint="Students will see this location in their appointment details."
              required
            />

            {/* Time slots */}
            <div className="space-y-3 border-t border-slate-200 pt-5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Time Slots
                </label>
                <p className="mt-0.5 text-xs text-slate-500">
                  Add one or more consultation windows for this date.
                </p>
              </div>

              <div className="space-y-3">
                {timeSlots.map((slot, index) => (
                  <div key={index} className="flex items-start gap-2 sm:gap-3">
                    <div className="grid flex-1 grid-cols-2 gap-3 sm:gap-4">
                      <Input
                        label="Start time"
                        id={`startTime-${index}`}
                        name={`startTime-${index}`}
                        type="time"
                        min="09:00"
                        max="18:00"
                        step="900"
                        value={slot.startTime}
                        onChange={(e) =>
                          handleTimeSlotChange(index, 'startTime', e.target.value)
                        }
                        error={fieldErrors[`slot_${index}_startTime`]}
                        required
                      />
                      <Input
                        label="End time"
                        id={`endTime-${index}`}
                        name={`endTime-${index}`}
                        type="time"
                        min="09:00"
                        max="18:00"
                        step="900"
                        value={slot.endTime}
                        onChange={(e) =>
                          handleTimeSlotChange(index, 'endTime', e.target.value)
                        }
                        error={fieldErrors[`slot_${index}_endTime`]}
                        required
                      />
                    </div>
                    {timeSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTimeSlot(index)}
                        className="mt-[22px] flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer"
                        title="Remove time slot"
                        aria-label="Remove time slot"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleAddTimeSlot}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  + Add another time slot
                </button>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={handleReset}
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
