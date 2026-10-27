import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import Table from '../../components/Table'
import { useAuth } from '../../hooks/useAuth'
import { getErrorMessage } from '../../utils/errors'
import { formatDate, formatTime, isPastDate } from '../../utils/format'

const ACTIVE_STATUSES = ['pending', 'accepted', 'completed']

export default function MySchedule() {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [scheduleToCancel, setScheduleToCancel] = useState(null)
  const [cancelError, setCancelError] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    let ignore = false

    async function loadSchedule() {
      try {
        const [scheduleResponse, appointmentResponse] = await Promise.all([
          api.get('/schedules', {
            params: { facultyId: user._id, includeCancelled: true },
          }),
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

    loadSchedule()

    return () => {
      ignore = true
    }
  }, [user._id])

  const bookedCounts = useMemo(() => {
    return appointments.reduce((counts, appointment) => {
      if (
        appointment.scheduleId?._id &&
        ACTIVE_STATUSES.includes(appointment.status)
      ) {
        counts[appointment.scheduleId._id] =
          (counts[appointment.scheduleId._id] || 0) + 1
      }

      return counts
    }, {})
  }, [appointments])

  const cancelBookingCount = scheduleToCancel
    ? bookedCounts[scheduleToCancel._id] || 0
    : 0

  function openCancel(schedule) {
    setScheduleToCancel(schedule)
    setCancelError('')
  }

  function closeCancel() {
    if (cancelling) {
      return
    }

    setScheduleToCancel(null)
    setCancelError('')
  }

  async function handleCancelSchedule() {
    if (!scheduleToCancel) {
      return
    }

    setCancelling(true)
    setCancelError('')

    try {
      const { data } = await api.patch(
        `/schedules/${scheduleToCancel._id}/cancel`,
      )
      const cancelledCount = data.cancelledAppointments || 0

      setSchedules((current) =>
        current.map((schedule) =>
          schedule._id === scheduleToCancel._id
            ? { ...schedule, status: 'cancelled' }
            : schedule,
        ),
      )
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.scheduleId?._id === scheduleToCancel._id &&
          ['pending', 'accepted'].includes(appointment.status)
            ? { ...appointment, status: 'cancelled' }
            : appointment,
        ),
      )
      setScheduleToCancel(null)
      setActionMessage(
        cancelledCount > 0
          ? `Schedule cancelled. ${cancelledCount} student booking${
              cancelledCount === 1 ? '' : 's'
            } cancelled and notified.`
          : 'Schedule cancelled. No student bookings were affected.',
      )
    } catch (requestError) {
      setCancelError(getErrorMessage(requestError))
    } finally {
      setCancelling(false)
    }
  }

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (schedule) => formatDate(schedule.date),
    },
    {
      key: 'time',
      header: 'Time',
      render: (schedule) =>
        `${formatTime(schedule.startTime)} – ${formatTime(schedule.endTime)}`,
    },
    {
      key: 'topic',
      header: 'Topic',
      render: (schedule) => (
        <span className="font-medium text-slate-700">{schedule.topic}</span>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (schedule) => schedule.location,
    },
    {
      key: 'slots',
      header: 'Booked slots',
      className: 'min-w-40',
      render: (schedule) => {
        const taken = bookedCounts[schedule._id] || 0
        const max = schedule.maxSlots || 5
        const percentage = Math.min(100, Math.round((taken / max) * 100))
        const isFull = taken >= max

        return (
          <div className="w-36">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">
                {taken} / {max}
              </span>
              {isFull && <span className="font-medium text-red-600">Full</span>}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded bg-slate-200">
              <div
                className={`h-1.5 rounded ${isFull ? 'bg-red-500' : 'bg-blue-600'}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (schedule) => (
        <StatusBadge status={schedule.status || 'active'} />
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (schedule) => {
        if (schedule.status === 'cancelled') {
          return <span className="text-xs text-slate-400">—</span>
        }

        if (isPastDate(schedule.date)) {
          return <span className="text-xs text-slate-400">Past</span>
        }

        return (
          <Button
            size="sm"
            variant="danger"
            onClick={() => openCancel(schedule)}
            className="cursor-pointer"
          >
            Cancel schedule
          </Button>
        )
      },
    },
  ]

  return (
    <>
      <PageHeader
        title="Browse My Schedule"
        description="Review your availability windows, slot usage, and cancel schedules when needed."
        action={
          <Button as={Link} to="/faculty/schedules/new">
            Create schedule
          </Button>
        }
      />

      {actionMessage && (
        <Alert tone="success" className="mb-5">
          {actionMessage}
        </Alert>
      )}
      {error && <Alert tone="error" className="mb-5">{error}</Alert>}

      <Card>
        <div className="border-b border-slate-200 px-4 py-3">
          <p className="font-display text-[13px] font-bold text-slate-700">
            Consultation windows
          </p>
        </div>
        <Table
          columns={columns}
          rows={schedules}
          loading={loading}
          emptyMessage="You have not created any schedules yet."
        />
      </Card>

      <Modal
        open={Boolean(scheduleToCancel)}
        onClose={closeCancel}
        title="Cancel schedule"
        description={
          scheduleToCancel
            ? `${scheduleToCancel.topic} on ${formatDate(scheduleToCancel.date)}`
            : ''
        }
        footer={
          <>
            <Button
              variant="secondary"
              onClick={closeCancel}
              disabled={cancelling}
              className="cursor-pointer"
            >
              Keep schedule
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelSchedule}
              disabled={cancelling}
              className="cursor-pointer"
            >
              {cancelling ? 'Cancelling...' : 'Cancel schedule'}
            </Button>
          </>
        }
      >
        {scheduleToCancel && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              This will cancel the entire schedule and all student appointments
              in it. Every affected student will be notified in real time.
            </p>

            {cancelError && <Alert tone="error">{cancelError}</Alert>}

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <p className="font-medium text-slate-800">
                {scheduleToCancel.topic}
              </p>
              <p className="mt-1">
                {formatDate(scheduleToCancel.date)} from{' '}
                {formatTime(scheduleToCancel.startTime)} to{' '}
                {formatTime(scheduleToCancel.endTime)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {scheduleToCancel.location}
              </p>
              <p className="mt-2 text-xs font-medium text-slate-600">
                {cancelBookingCount} active student booking
                {cancelBookingCount === 1 ? '' : 's'} will be cancelled.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
