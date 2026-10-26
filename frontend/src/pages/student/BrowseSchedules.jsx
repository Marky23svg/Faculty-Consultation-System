import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
} from 'lucide-react'
import { io } from 'socket.io-client'
import api, { API_BASE_URL } from '../../api/client'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import Textarea from '../../components/Textarea'
import { getErrorMessage } from '../../utils/errors'
import {
  formatDate,
  formatTimeRange,
  getDateKey,
  timeToMinutes,
} from '../../utils/format'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getDateKeyFromDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function getScheduleCapacity(schedule) {
  const maxSlots = schedule.maxSlots || 5
  const bookedSlots = schedule.bookedSlots || 0

  return {
    maxSlots,
    bookedSlots,
    availableSlots: Math.max(
      0,
      schedule.availableSlots ?? maxSlots - bookedSlots,
    ),
  }
}

function getScheduleHourKey(schedule) {
  if (!schedule?.startTime) {
    return ''
  }

  const hour = Number(String(schedule.startTime).split(':')[0])
  const dateKey = getDateKey(schedule.date)

  if (!dateKey || Number.isNaN(hour)) {
    return ''
  }

  return `${dateKey}|${hour}`
}

function getAvailabilityByDate(schedules) {
  const availabilityByDate = new Map()

  schedules.forEach((schedule) => {
    const dateKey = getDateKey(schedule.date)

    if (!dateKey) {
      return
    }

    const current = availabilityByDate.get(dateKey) || {
      availableSlots: 0,
      scheduleCount: 0,
    }
    const capacity = getScheduleCapacity(schedule)

    availabilityByDate.set(dateKey, {
      availableSlots: current.availableSlots + capacity.availableSlots,
      scheduleCount: current.scheduleCount + 1,
    })
  })

  return availabilityByDate
}

export default function BrowseSchedules() {
  const navigate = useNavigate()
  const [schedules, setSchedules] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [agenda, setAgenda] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    let ignore = false

    async function loadSchedules() {
      try {
        const [scheduleResponse, appointmentResponse] = await Promise.all([
          api.get('/schedules'),
          api.get('/bookings/my'),
        ])

        if (!ignore) {
          setSchedules(scheduleResponse.data)
          setAppointments(appointmentResponse.data)
          setError('')
        }
      } catch (requestError) {
        if (!ignore) {
          setError(getErrorMessage(requestError))
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadSchedules()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    const socket = io(API_BASE_URL)

    socket.on('scheduleUpdated', (update) => {
      const { scheduleId, ...availability } = update

      setSchedules((current) =>
        current.map((schedule) =>
          schedule._id === scheduleId
            ? { ...schedule, ...availability }
            : schedule,
        ),
      )

      setSelectedSchedule((current) =>
        current && current._id === scheduleId
          ? { ...current, ...availability }
          : current,
      )
    })

    socket.on('scheduleCancelled', ({ scheduleId }) => {
      setSchedules((current) =>
        current.filter((schedule) => schedule._id !== scheduleId),
      )
      setAppointments((current) =>
        current.map((appointment) =>
          (appointment.scheduleId?._id || appointment.scheduleId) ===
            scheduleId &&
          ['pending', 'accepted'].includes(appointment.status)
            ? { ...appointment, status: 'cancelled' }
            : appointment,
        ),
      )
      setSelectedSchedule((current) =>
        current && current._id === scheduleId ? null : current,
      )
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const todayKey = getDateKeyFromDate(new Date())
  const bookedScheduleIds = useMemo(
    () =>
      new Set(
        appointments
          .filter(
            (appointment) =>
              ['pending', 'accepted', 'completed'].includes(
                appointment.status,
              ) && appointment.scheduleId,
          )
          .map(
            (appointment) =>
              appointment.scheduleId?._id || appointment.scheduleId,
          ),
      ),
    [appointments],
  )
  const bookedHourKeys = useMemo(
    () =>
      new Set(
        appointments
          .filter(
            (appointment) =>
              ['pending', 'accepted', 'completed'].includes(
                appointment.status,
              ) && appointment.scheduleId,
          )
          .map((appointment) => getScheduleHourKey(appointment.scheduleId))
          .filter(Boolean),
      ),
    [appointments],
  )
  const availabilityByDate = useMemo(
    () => getAvailabilityByDate(schedules),
    [schedules],
  )
  const selectedDateSchedules = useMemo(
    () =>
      schedules
        .filter((schedule) => getDateKey(schedule.date) === selectedDate)
        .sort(
          (first, second) =>
            (timeToMinutes(first.startTime) ?? 0) -
            (timeToMinutes(second.startTime) ?? 0),
        ),
    [schedules, selectedDate],
  )
  const selectedScheduleCapacity = selectedSchedule
    ? getScheduleCapacity(selectedSchedule)
    : null
  const selectedScheduleIsFull =
    !selectedScheduleCapacity || selectedScheduleCapacity.availableSlots === 0
  const selectedScheduleIsBooked = selectedSchedule
    ? bookedScheduleIds.has(selectedSchedule._id)
    : false
  const selectedScheduleHasHourConflict = selectedSchedule
    ? !selectedScheduleIsBooked &&
      bookedHourKeys.has(getScheduleHourKey(selectedSchedule))
    : false

  const month = visibleMonth.getMonth()
  const year = visibleMonth.getFullYear()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = visibleMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  function changeMonth(offset) {
    setVisibleMonth(new Date(year, month + offset, 1))
  }

  function openBooking(schedule) {
    if (
      bookedScheduleIds.has(schedule._id) ||
      bookedHourKeys.has(getScheduleHourKey(schedule))
    ) {
      return
    }

    setSelectedSchedule(schedule)
    setAgenda('')
    setBookingError('')
  }

  function closeBooking() {
    setSelectedSchedule(null)
    setAgenda('')
    setBookingError('')
  }

  async function handleBook(event) {
    event.preventDefault()

    if (selectedScheduleIsBooked) {
      setBookingError('You have already booked this schedule.')
      return
    }

    if (selectedScheduleHasHourConflict) {
      setBookingError(
        'You already have an appointment in this 1-hour window.',
      )
      return
    }

    if (!selectedSchedule || selectedScheduleIsFull) {
      setBookingError('This consultation window is already fully booked.')
      return
    }

    setBooking(true)
    setBookingError('')

    try {
      await api.post('/bookings', {
        scheduleId: selectedSchedule._id,
        agenda,
      })
      navigate('/student/appointments', {
        replace: true,
        state: { message: 'Appointment booked successfully.' },
      })
    } catch (requestError) {
      setBookingError(getErrorMessage(requestError))
    } finally {
      setBooking(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Book a Consultation"
        description="Select a date and consultation window. Each student may book one appointment per 1-hour window."
      />

      {error && (
        <Alert tone="error" className="mb-5">
          {error}
        </Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-[390px_minmax(0,1fr)] lg:items-start">
        <Card>
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white">
                  1
                </span>
                <h2 className="font-display text-[13px] font-bold text-slate-800">
                  Select a date
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span
                  className="min-w-28 text-center text-sm font-semibold text-slate-700"
                  aria-live="polite"
                >
                  {monthLabel}
                </span>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex h-72 items-center justify-center text-sm text-slate-500">
                Loading calendar...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {WEEKDAYS.map((weekday) => (
                    <div
                      key={weekday}
                      className="py-1 text-[11px] font-medium uppercase tracking-wide text-slate-400"
                    >
                      {weekday}
                    </div>
                  ))}
                </div>

                <div className="mt-1 grid grid-cols-7 gap-1">
                  {Array.from({ length: firstWeekday }, (_, index) => (
                    <div key={`blank-${index}`} aria-hidden="true" />
                  ))}

                  {Array.from({ length: daysInMonth }, (_, index) => {
                    const day = index + 1
                    const date = new Date(year, month, day)
                    const dateKey = getDateKeyFromDate(date)
                    const stats = availabilityByDate.get(dateKey)
                    const hasSchedules = Boolean(stats?.scheduleCount)
                    const isPast = dateKey < todayKey
                    const hasAvailability =
                      !isPast && Boolean(stats?.availableSlots)
                    const isSelected = selectedDate === dateKey
                    const isToday = dateKey === todayKey

                    const label = formatDate(dateKey)
                    const dayTitle = isPast
                      ? `${label}, unavailable`
                      : !hasSchedules
                        ? `${label}, no schedules`
                        : !hasAvailability
                          ? `${label}, fully booked`
                          : `${label}, ${stats.availableSlots} slot${
                              stats.availableSlots === 1 ? '' : 's'
                            } available`

                    const stateClasses = isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isPast
                        ? 'text-slate-300'
                        : hasSchedules
                          ? 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                          : 'text-slate-500 hover:bg-slate-100'

                    const dotClasses = isSelected
                      ? hasAvailability
                        ? 'bg-white'
                        : 'bg-red-200'
                      : hasAvailability
                        ? 'bg-blue-600'
                        : 'bg-red-400'

                    return (
                      <button
                        key={dateKey}
                        type="button"
                        onClick={() => setSelectedDate(dateKey)}
                        disabled={isPast}
                        aria-label={dayTitle}
                        aria-pressed={isSelected}
                        aria-current={isToday ? 'date' : undefined}
                        title={dayTitle}
                        className={`relative flex h-11 flex-col items-center justify-center rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 disabled:cursor-not-allowed ${stateClasses} ${
                          isToday && !isSelected
                            ? 'ring-1 ring-inset ring-blue-500 font-semibold'
                            : ''
                        }`}
                      >
                        {day}
                        {hasSchedules && !isPast && (
                          <span
                            className={`absolute bottom-1 h-1 w-1 rounded-full ${dotClasses}`}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    Available
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    Fully booked
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    No schedules
                  </span>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  You can select any date from today onward, even if no
                  schedules are listed.
                </p>
              </>
            )}
          </div>
        </Card>

        <Card className="flex min-h-96 flex-col">
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white">
                  2
                </span>
                <h2 className="font-display text-[13px] font-bold text-slate-800">
                  Choose a time
                </h2>
              </div>

              {selectedDate && !loading && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Live availability
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-slate-500" aria-live="polite">
              {selectedDate
                ? `${formatDate(selectedDate)} Â· ${selectedDateSchedules.length} consultation window${
                    selectedDateSchedules.length === 1 ? '' : 's'
                  }`
                : 'Choose a date to see the available times.'}
            </p>
          </div>

          <div className="flex-1 p-4">
            {loading ? (
              <div className="flex h-full min-h-72 items-center justify-center text-sm text-slate-500">
                Loading available times...
              </div>
            ) : !selectedDate ? (
              <div className="flex h-full min-h-72 flex-col items-center justify-center px-6 text-center">
                <CalendarDays className="h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-700">
                  Select a date first
                </p>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Available consultation times for that date will appear here.
                </p>
              </div>
            ) : selectedDateSchedules.length === 0 ? (
              <div className="flex h-full min-h-72 flex-col items-center justify-center px-6 text-center">
                <CalendarDays className="h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-700">
                  No consultations on this date
                </p>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Choose another date from the calendar.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateSchedules.map((schedule) => {
                  const capacity = getScheduleCapacity(schedule)
                  const isFull = capacity.availableSlots === 0
                  const isAlreadyBooked = bookedScheduleIds.has(schedule._id)
                  const hasHourConflict =
                    !isAlreadyBooked &&
                    bookedHourKeys.has(getScheduleHourKey(schedule))

                  return (
                    <div
                      key={schedule._id}
                      className="rounded-md border border-slate-200 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-display text-[13px] font-bold text-slate-800">
                            {schedule.facultyId?.name || 'Faculty member'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {schedule.facultyId?.department ||
                              'Department unavailable'}
                          </p>
                        </div>
                        <span
                          className={`rounded-md px-2 py-1 text-[10px] font-bold ${
                            isAlreadyBooked
                              ? 'bg-emerald-50 text-emerald-700'
                              : hasHourConflict
                                ? 'bg-amber-50 text-amber-700'
                                : isFull
                                  ? 'bg-slate-100 text-slate-500'
                                  : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {isAlreadyBooked
                            ? 'Already booked'
                            : hasHourConflict
                              ? 'Time conflict'
                              : isFull
                                ? 'Fully booked'
                                : `${capacity.availableSlots} slot${
                                    capacity.availableSlots === 1 ? '' : 's'
                                  } left`}
                        </span>
                      </div>

                      <p className="mt-3 text-sm font-medium text-slate-700">
                        {schedule.topic}
                      </p>

                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {formatTimeRange(
                            schedule.startTime,
                            schedule.endTime,
                          )}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {schedule.location}
                        </span>
                        <span>
                          {capacity.bookedSlots} of {capacity.maxSlots} booked
                        </span>
                      </div>

                      <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
                        {isAlreadyBooked ? (
                          <p className="text-xs font-medium text-emerald-600">
                            You already booked this consultation window.
                          </p>
                        ) : hasHourConflict ? (
                          <p className="text-xs font-medium text-amber-600">
                            You already have an appointment in this 1-hour
                            window.
                          </p>
                        ) : isFull ? (
                          <p className="text-xs text-slate-500">
                            This consultation window is fully booked.
                          </p>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => openBooking(schedule)}
                          >
                            Book this time
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
        <MapPin className="h-3.5 w-3.5" />
        Consultations are face-to-face. Confirm the office or room location
        before your appointment.
      </p>

      <Modal
        open={Boolean(selectedSchedule)}
        onClose={closeBooking}
        title="Book appointment"
        description={
          selectedSchedule
            ? `${selectedSchedule.facultyId?.name || 'Faculty'} Â· ${formatDate(
                selectedSchedule.date,
              )} Â· ${formatTimeRange(
                selectedSchedule.startTime,
                selectedSchedule.endTime,
              )}`
            : ''
        }
        footer={
          <>
            <Button variant="secondary" onClick={closeBooking}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="booking-form"
              disabled={
                booking ||
                selectedScheduleIsFull ||
                selectedScheduleIsBooked ||
                selectedScheduleHasHourConflict
              }
            >
              {booking
                ? 'Sending request...'
                : selectedScheduleIsBooked
                  ? 'Already booked'
                  : selectedScheduleHasHourConflict
                    ? 'Time conflict'
                    : selectedScheduleIsFull
                      ? 'Fully booked'
                      : 'Send request'}
            </Button>
          </>
        }
      >
        {selectedSchedule && (
          <form id="booking-form" onSubmit={handleBook} className="space-y-4">
            {bookingError && <Alert tone="error">{bookingError}</Alert>}

            {selectedScheduleIsBooked && (
              <Alert tone="info">
                You have already booked this consultation window.
              </Alert>
            )}

            {!selectedScheduleIsBooked && selectedScheduleIsFull && (
              <Alert tone="info">
                This consultation window is already fully booked.
              </Alert>
            )}

            {selectedScheduleHasHourConflict && (
              <Alert tone="info">
                You already have an appointment in this 1-hour window.
                Students may only book one appointment per hour.
              </Alert>
            )}

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-800">
                {selectedSchedule.topic}
              </p>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <p className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {formatTimeRange(
                    selectedSchedule.startTime,
                    selectedSchedule.endTime,
                  )}
                </p>
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  Face-to-face at {selectedSchedule.location}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedSchedule.bookedSlots || 0} of{' '}
                  {selectedSchedule.maxSlots || 5} slots booked
                </p>
              </div>
            </div>

            <Textarea
              label="Agenda"
              name="agenda"
              placeholder="Briefly describe what you would like to consult about."
              value={agenda}
              onChange={(event) => setAgenda(event.target.value)}
              required
            />
          </form>
        )}
      </Modal>
    </>
  )
}
