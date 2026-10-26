import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CalendarCheck2 } from 'lucide-react'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import { useAuth } from '../../hooks/useAuth'
import { getErrorMessage } from '../../utils/errors'
import { getRoleHome } from '../../utils/roles'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
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
      const user = await login(form.email, form.password)
      const destination = location.state?.from || getRoleHome(user.role)
      navigate(destination, { replace: true })
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
            Welcome back
          </h1>
          <p className="mt-1.5 text-xs leading-6 text-slate-500">
            Sign in to manage faculty consultations.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert tone="error">{error}</Alert>}

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
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Log In'}
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5 text-center">
            <p className="text-sm text-slate-500">
              New student?{' '}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Create an account
              </Link>
            </p>
          </div>
        </Card>

        <p className="mt-6 text-center text-xs text-slate-400">
          Face-to-face consultations only. Faculty and admin accounts are issued
          by the administrator.
        </p>
      </div>
    </div>
  )
}
