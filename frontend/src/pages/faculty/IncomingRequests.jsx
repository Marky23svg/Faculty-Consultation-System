import { useEffect, useState } from 'react'
import api from '../../api/client'
import Alert from '../../components/Alert'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import Table from '../../components/Table'
import { getErrorMessage } from '../../utils/errors'
import { formatDate, formatTime, formatTimeRange } from '../../utils/format'

export default function IncomingRequests() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadRequests() {
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

    loadRequests()

    return () => {
      ignore = true
    }
  }, [])

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (appointment) => (
        <div>
          <p className="font-medium text-slate-800">
            {appointment.studentId?.name || 'Student'}
          </p>
          <p className="text-xs text-slate-500">
            {appointment.studentId?.studentNumber || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'schedule',
      header: 'Schedule',
      render: (appointment) => appointment.scheduleId?.topic || '—',
    },
    {
      key: 'date',
      header: 'Date',
      render: (appointment) => formatDate(appointment.scheduleId?.date),
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
      key: 'agenda',
      header: 'Agenda',
      className: 'min-w-48 max-w-xs',
      render: (appointment) => (
        <span className="block whitespace-normal text-slate-600">
          {appointment.agenda || 'No agenda provided.'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (appointment) => <StatusBadge status={appointment.status} />,
    },
  ]

  return (
    <>
      <PageHeader
        title="Student Bookings"
        description="View consultations booked by students. Bookings are confirmed automatically."
      />

      {error && <Alert tone="error" className="mb-5">{error}</Alert>}

      <Card>
        <div className="border-b border-slate-200 px-4 py-3">
          <p className="font-display text-[13px] font-bold text-slate-700">
            Student booking history
          </p>
        </div>
        <Table
          columns={columns}
          rows={appointments}
          loading={loading}
          emptyMessage="No student bookings yet."
        />
      </Card>
    </>
  )
}
