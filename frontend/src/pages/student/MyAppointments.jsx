import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CheckCircle2, History, Search, XCircle } from 'lucide-react'
import { io } from 'socket.io-client'
import api, { API_BASE_URL } from '../../api/client'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Modal from '../../components/Modal'
import Pagination from '../../components/Pagination'
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
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
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

  const ATTENDANCE_BADGE = {
    present: 'bg-emerald-50 text-emerald-700',
    absent: 'bg-red-50 text-red-700',
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return appointments
    return appointments.filter((a) =>
      [a.facultyId?.name, a.scheduleId?.topic]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term)),
    )
  }, [appointments, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  useMemo(() => { setCurrentPage(1) }, [search])

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
      key: 'attendance',
      header: 'Attendance',
      render: (appointment) => {
        const { attendance } = appointment
        if (!attendance || attendance === 'pending') return <span className="text-slate-400">—</span>
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold ${ATTENDANCE_BADGE[attendance]}`}>
            <span className="h-1 w-1 rounded-full bg-current" aria-hidden="true" />
            {attendance === 'present' ? 'Present' : 'Absent'}
          </span>
        )
      },
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
            className="cursor-pointer"
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
        title="Browse My Appointments"
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
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-[13px] font-bold text-slate-700">
            Appointment history
          </p>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search by faculty or topic…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-xs text-slate-700 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>
        </div>
        <Table
          columns={columns}
          rows={paginated}
          loading={loading}
          emptyMessage={
            search
              ? 'No appointments match your search.'
              : 'You have no appointments yet. Browse schedules to book one.'
          }
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filtered.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
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
              className="cursor-pointer"
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
