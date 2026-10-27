import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, Search, UserX } from 'lucide-react'
import api from '../../api/client'
import Alert from '../../components/Alert'
import Card from '../../components/Card'
import Pagination from '../../components/Pagination'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import Table from '../../components/Table'
import { getErrorMessage } from '../../utils/errors'
import { formatDate, formatTime, formatTimeRange } from '../../utils/format'

const ATTENDANCE_BADGE = {
  present: 'bg-emerald-50 text-emerald-700',
  absent: 'bg-red-50 text-red-700',
}

export default function IncomingRequests() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

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
        if (!ignore) setError(getErrorMessage(requestError))
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadRequests()
    return () => { ignore = true }
  }, [])

  async function handleMarkAttendance(appointmentId, attendance) {
    try {
      const { data } = await api.patch(`/bookings/${appointmentId}/attendance`, { attendance })
      setAppointments((current) =>
        current.map((a) => (a._id === appointmentId ? { ...a, attendance: data.attendance } : a)),
      )
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return appointments
    return appointments.filter((a) =>
      a.studentId?.name?.toLowerCase().includes(term),
    )
  }, [appointments, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  // Reset to page 1 when search changes
  useMemo(() => { setCurrentPage(1) }, [search])

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (a) => (
        <div>
          <p className="font-medium text-slate-800">{a.studentId?.name || 'Student'}</p>
          <p className="text-xs text-slate-500">{a.studentId?.studentNumber || '—'}</p>
        </div>
      ),
    },
    {
      key: 'schedule',
      header: 'Schedule',
      render: (a) => a.scheduleId?.topic || '—',
    },
    {
      key: 'date',
      header: 'Date',
      render: (a) => formatDate(a.scheduleId?.date),
    },
    {
      key: 'time',
      header: 'Time',
      render: (a) =>
        a.scheduleId?.startTime
          ? formatTimeRange(a.scheduleId.startTime, a.scheduleId.endTime)
          : formatTime(a.timeSlot),
    },
    {
      key: 'agenda',
      header: 'Agenda',
      className: 'min-w-48 max-w-xs',
      render: (a) => (
        <span className="block whitespace-normal text-slate-600">
          {a.agenda || 'No agenda provided.'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <StatusBadge status={a.status} />,
    },
    {
      key: 'attendance',
      header: 'Attendance',
      render: (a) => {
        if (a.status === 'cancelled') {
          return <span className="text-slate-400">—</span>
        }

        if (a.attendance === 'present' || a.attendance === 'absent') {
          return (
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold ${ATTENDANCE_BADGE[a.attendance]}`}
            >
              <span className="h-1 w-1 rounded-full bg-current" aria-hidden="true" />
              {a.attendance === 'present' ? 'Present' : 'Absent'}
            </span>
          )
        }

        return (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleMarkAttendance(a._id, 'present')}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 transition-colors hover:bg-emerald-100 cursor-pointer"
            >
              <CheckCircle className="h-3 w-3" />
              Present
            </button>
            <button
              type="button"
              onClick={() => handleMarkAttendance(a._id, 'absent')}
              className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700 transition-colors hover:bg-red-100 cursor-pointer"
            >
              <UserX className="h-3 w-3" />
              Absent
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <>
      <PageHeader
        title="Browse Student Bookings"
        description="View consultations booked by students. Bookings are confirmed automatically."
      />

      {error && <Alert tone="error" className="mb-5">{error}</Alert>}

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-[13px] font-bold text-slate-700">
            Student booking history
          </p>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search by student name…"
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
            search ? 'No bookings match your search.' : 'No student bookings yet.'
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
    </>
  )
}
