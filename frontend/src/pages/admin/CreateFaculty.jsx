import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, UserPlus } from 'lucide-react'
import api from '../../api/client'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import PageHeader from '../../components/PageHeader'
import { getErrorMessage } from '../../utils/errors'

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  department: '',
}

export default function CreateFaculty() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      const { data } = await api.post('/auth/faculty', form)
      setSuccess(
        `Faculty account created for ${data.user?.name || form.name}. They can now sign in with the email and password you provided.`,
      )
      setForm(INITIAL_FORM)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Create Faculty Account"
        description="Provision a faculty account so they can publish consultation schedules."
        action={
          <Button as={Link} to="/admin/faculty" variant="secondary">
            View faculty list
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <Alert tone="error">{error}</Alert>}
            {success && <Alert tone="success">{success}</Alert>}

            <Input
              label="Full name"
              name="name"
              autoComplete="name"
              placeholder="Prof. Maria Santos"
              value={form.name}
              onChange={handleChange}
              required
            />

            <Input
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="maria.santos@university.edu"
              value={form.email}
              onChange={handleChange}
              required
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Temporary password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 6 characters"
                minLength={6}
                value={form.password}
                onChange={handleChange}
                hint="Share this securely with the faculty member."
                required
              />
              <Input
                label="Department"
                name="department"
                placeholder="College of Engineering"
                value={form.department}
                onChange={handleChange}
                required
              />
            </div>

            <div className="flex justify-end border-t border-slate-200 pt-5">
              <Button type="submit" disabled={submitting}>
                <UserPlus className="h-4 w-4" />
                {submitting ? 'Creating account...' : 'Create faculty account'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="h-fit p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <h2 className="font-display text-[13px] font-bold text-slate-800">
              Account access
            </h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Faculty accounts are created by administrators only. Once created,
            faculty members can sign in to publish schedules, manage their
            availability, and respond to student consultation requests.
          </p>
          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-700">Faculty can:</p>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-500">
              <li>Create 9:00 AM – 6:00 PM consultation windows</li>
              <li>Set the face-to-face office or room location</li>
              <li>Accept or decline incoming student bookings</li>
            </ul>
          </div>
        </Card>
      </div>
    </>
  )
}
