import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, UserPlus } from 'lucide-react'
import api from '../../api/client'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import PageHeader from '../../components/PageHeader'
import Table from '../../components/Table'
import { getErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export default function FacultyList() {
  const [faculty, setFaculty] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadFaculty() {
      try {
        const { data } = await api.get('/auth/faculty')

        if (!ignore) {
          setFaculty(data)
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

    loadFaculty()

    return () => {
      ignore = true
    }
  }, [])

  const filteredFaculty = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) {
      return faculty
    }

    return faculty.filter((member) => {
      return [member.name, member.email, member.department]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    })
  }, [faculty, search])

  const columns = [
    {
      key: 'name',
      header: 'Faculty member',
      render: (member) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[11px] font-extrabold text-blue-700">
            {getInitials(member.name)}
          </div>
          <span className="font-medium text-slate-800">{member.name}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (member) => member.email,
    },
    {
      key: 'department',
      header: 'Department',
      render: (member) => member.department,
    },
    {
      key: 'createdAt',
      header: 'Date added',
      render: (member) => formatDate(member.createdAt),
    },
  ]

  return (
    <>
      <PageHeader
        title="Faculty List"
        description="All faculty accounts registered in the consultation system."
        action={
          <Button as={Link} to="/admin/faculty/new">
            <UserPlus className="h-4 w-4" />
            Create faculty
          </Button>
        }
      />

      {error && <Alert tone="error" className="mb-5">{error}</Alert>}

      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <Input
            label="Search faculty"
            name="search"
            placeholder="Search by name, email, or department"
            className="w-full sm:max-w-sm"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <Search className="h-3.5 w-3.5" />
            {filteredFaculty.length} of {faculty.length} faculty members
          </p>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          rows={filteredFaculty}
          loading={loading}
          emptyMessage={
            search
              ? 'No faculty members match your search.'
              : 'No faculty accounts have been created yet.'
          }
        />
      </Card>
    </>
  )
}
