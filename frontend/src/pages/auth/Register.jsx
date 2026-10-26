import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarCheck2 } from 'lucide-react'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import { useAuth } from '../../hooks/useAuth'
import { getErrorMessage } from '../../utils/errors'
import { getRoleHome } from '../../utils/roles'

export default function Register() {
  const { registerStudent } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    studentNumber: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const user = await registerStudent(form)
      navigate(getRoleHome(user.role), { replace: true })
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-white">
            <CalendarCheck2 className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-[27px] font-extrabold tracking-[-0.8px] text-slate-800">
            Create a student account
          </h1>
          <p className="mt-1.5 text-xs leading-6 text-slate-500">
            Register to browse schedules and book consultations.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert tone="error">{error}</Alert>}

            <Input
              label="Full name"
              name="name"
              autoComplete="name"
              placeholder="Juan Dela Cruz"
              value={form.name}
              onChange={handleChange}
              required
            />

            <Input
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@university.edu"
              value={form.email}
              onChange={handleChange}
              required
            />

            <Input
              label="Student number"
              name="studentNumber"
              placeholder="2026-00001"
              value={form.studentNumber}
              onChange={handleChange}
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              minLength={6}
              value={form.password}
              onChange={handleChange}
              hint="Use at least 6 characters."
              required
            />

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Log in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
