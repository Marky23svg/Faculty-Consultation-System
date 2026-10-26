import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CheckCircle2, History, XCircle } from 'lucide-react'
import { io } from 'socket.io-client'
import api, { API_BASE_URL } from '../../api/client'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import Table from '../../components/Table'
import { getErrorMessage } from '../../utils/errors'
import {
  formatDate,
  formatTime,
  formatTimeRange,
  isPastDate,
} from '../../utils/format'

function isCancelable(appointment) {
  return (
    ['pending', 'accepted'].includes(appointment.status) &&
    !isPastDate(appointment.scheduleId?.date)
  )
}

export default function MyAppointments() {
  const location = useLocation()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [appointmentToCancel, setAppointmentToCancel] = useState(null)
  const [cancelError, setCancelError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const successMessage = actionMessage || location.state?.message

  useEffect(() => {
    let ignore = false

    async function loadAppointments() {
      try {
        const { data } = await api.get('/bookings/my')

        if (!ignore) {
          setAppointments(data)
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

    loadAppointments()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    const socket = io(API_BASE_URL)

    socket.on('scheduleCancelled', ({ scheduleId }) => {
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.scheduleId?._id === scheduleId &&
          ['pending', 'accepted'].includes(appointment.status)
            ? { ...appointment, status: 'cancelled' }
            : appointment,
        ),
      )
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const stats = useMemo(() => {
    const upcoming = appointments.filter(
      (appointment) =>
        appointment.status === 'accepted' &&
        !isPastDate(appointment.scheduleId?.date),
    ).length
    const cancelled = appointments.filter(
      (appointment) => appointment.status === 'cancelled',
    ).length
    const past = appointments.filter(
      (appointment) =>
        appointment.status === 'completed' ||
        isPastDate(appointment.scheduleId?.date),
    ).length

    return { upcoming, cancelled, past }
  }, [appointments])

  function openCancel(appointment) {
    setAppointmentToCancel(appointment)
    setCancelError('')
  }

  function closeCancel() {
    if (cancelling) {
      return
    }

    setAppointmentToCancel(null)
    setCancelError('')
  }

  async function handleCancel() {
    if (!appointmentToCancel) {
      return
    }

    setCancelling(true)
    setCancelError('')

    try {
      await api.patch(`/bookings/${appointmentToCancel._id}/cancel`)
      setAppointments((current) =>
        current.map((appointment) =>
          appointment._id === appointmentToCancel._id
            ? { ...appointment, status: 'cancelled' }
            : appointment,
        ),
      )
      setAppointmentToCancel(null)
      setActionMessage('Appointment cancelled successfully.')
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
      render: (appointment) => formatDate(appointment.scheduleId?.date),
    },
    {
      key: 'faculty',
      header: 'Faculty',
      render: (appointment) => (
        <div>
          <p className="font-medium text-slate-800">
            {appointment.facultyId?.name || 'Faculty member'}
          </p>
          <p className="text-xs text-slate-500">
            {appointment.facultyId?.department || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'topic',
      header: 'Topic',
      render: (appointment) => appointment.scheduleId?.topic || '—',
    },
    {
      key: 'time',
      header: 'Time',
      render: (appointment) =>
        appointment.scheduleId?.startTime
          ? formatTimeRange(
              appointment.scheduleId.startTime,
              appointment.scheduleId.endTime,
            )
          : formatTime(appointment.timeSlot),
    },
    {
      key: 'location',
      header: 'Location',
      render: (appointment) => appointment.scheduleId?.location || '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (appointment) => <StatusBadge status={appointment.status} />,
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (appointment) =>
        isCancelable(appointment) ? (
          <Button
            size="sm"
            variant="danger"
            onClick={() => openCancel(appointment)}
          >
            Cancel
          </Button>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
  ]

  const summaryCards = [
    {
      label: 'Upcoming bookings',
      value: stats.upcoming,
      icon: CheckCircle2,
      iconClass: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Cancelled',
      value: stats.cancelled,
      icon: XCircle,
      iconClass: 'bg-slate-100 text-slate-600',
    },
    {
      label: 'Past consultations',
      value: stats.past,
      icon: History,
      iconClass: 'bg-blue-50 text-blue-600',
    },
  ]

  return (
    <>
      <PageHeader
        title="My Appointments"
        description="Track your booked, cancelled, and past faculty consultations."
        action={
          <Button as={Link} to="/student/schedules" variant="secondary">
            Browse schedules
          </Button>
        }
      />

      {successMessage && (
        <Alert tone="success" className="mb-5">
          {successMessage}
        </Alert>
      )}
      {error && <Alert tone="error" className="mb-5">{error}</Alert>}

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        {summaryCards.map((item) => {
          const Icon = item.icon

          return (
            <Card key={item.label} className="flex items-center gap-3 p-4">
              <div
                className={`flex h-[34px] w-[34px] items-center justify-center rounded-[9px] ${item.iconClass}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-display text-[27px] font-extrabold leading-none tracking-[-0.8px] text-slate-800">
                  {item.value}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-slate-500">
                  {item.label}
                </p>
              </div>
            </Card>
          )
        })}
      </div>

      <Card>
        <div className="border-b border-slate-200 px-4 py-3">
          <p className="font-display text-[13px] font-bold text-slate-700">
            Appointment history
          </p>
        </div>
        <Table
          columns={columns}
          rows={appointments}
          loading={loading}
          emptyMessage="You have no appointments yet. Browse schedules to book one."
        />
      </Card>

      <Modal
        open={Boolean(appointmentToCancel)}
        onClose={closeCancel}
        title="Cancel appointment"
        description={
          appointmentToCancel
            ? `${appointmentToCancel.scheduleId?.topic || 'Consultation'} · ${formatDate(
                appointmentToCancel.scheduleId?.date,
              )}`
            : ''
        }
        footer={
          <>
            <Button
              variant="secondary"
              onClick={closeCancel}
              disabled={cancelling}
            >
              Keep appointment
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling...' : 'Cancel appointment'}
            </Button>
          </>
        }
      >
        {appointmentToCancel && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to cancel this appointment? The booking
              will be released and the faculty member will be notified.
            </p>

            {cancelError && <Alert tone="error">{cancelError}</Alert>}

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <p className="font-medium text-slate-800">
                {appointmentToCancel.facultyId?.name || 'Faculty member'}
              </p>
              <p className="mt-1">
                {formatTimeRange(
                  appointmentToCancel.scheduleId?.startTime,
                  appointmentToCancel.scheduleId?.endTime,
                )}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {appointmentToCancel.scheduleId?.location || 'Location unavailable'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
