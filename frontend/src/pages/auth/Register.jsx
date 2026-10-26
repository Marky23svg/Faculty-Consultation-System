import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { useAuth } from '../../hooks/useAuth'
import { getErrorMessage } from '../../utils/errors'
import { getRoleHome } from '../../utils/roles'
import ICCT_Logo from '../../assets/icct-logo.png'
import Login_bg from '../../assets/Login_bg.webp'

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
    <div className="flex h-screen w-full flex-col lg:flex-row overflow-hidden">

      {/* ── Left: Branding Panel (Hidden on Mobile, Wider on Desktop) ── */}
      <div className="relative hidden lg:flex lg:w-[55%] xl:w-[60%] flex-col justify-between overflow-hidden p-12">

        {/* Background image */}
        <img
          src={Login_bg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Blur + dark overlay */}
        <div className="absolute inset-0 bg-blue-950/50 backdrop-blur-xs" />

        {/* Logo */}
        <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl">
          <img src={ICCT_Logo} alt="ICCT Logo" className="h-full w-full object-contain" />
        </div>

        {/* Center copy */}
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg">
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white">
            Join the<br />Community!
          </h1>
          <p className="mt-6 text-medium font-light leading-relaxed text-blue-100">
            Create your student account to easily book face-to-face consultations, 
            manage your schedule, and stay connected with your professors throughout the semester.
          </p>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-sm text-blue-200">
          
        </p>
      </div>

      {/* ── Right: Register Form Panel ── */}
      <div className="flex w-full lg:w-[45%] xl:w-[40%] flex-col justify-between bg-white px-6 py-8 md:px-12 md:py-12 h-full ">
        
        {/* Mobile Header (Visible only on small screens) */}
        <div className="flex lg:hidden items-center gap-3 mb-8">
           <div className="flex h-15 w-15 items-center justify-center rounded-xl p-1">
              <img src={ICCT_Logo} alt="ICCT Logo" className="h-full w-full object-contain" />
           </div>
           <div>
             <p className="text-sm font-bold text-slate-800">Faculty Consultation</p>
             <div className="mt-1 h-1 w-8 rounded bg-blue-600" />
           </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block">
          <p className="text-sm font-bold text-slate-800">Faculty Consultation</p>
          <div className="mt-2 h-1 w-12 rounded bg-blue-600" />
        </div>

        {/* Form area */}
        <div className="mx-auto w-full max-w-md my-auto mt-8 pt-8 lg:pt-0">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Create Account</h2>
          <p className="mt-1.5 text-sm text-slate-500">Register to browse schedules and book consultations.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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

            <Button type="submit" className="w-full mt-2 py-3.5" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
                Log in
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom footer */}
        <p className="hidden lg:block text-right text-xs text-slate-400 mt-8">
          
        </p>
      </div>
    </div>
  )
}