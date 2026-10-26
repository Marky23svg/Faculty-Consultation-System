import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import Alert from '../../components/Alert'
import { useAuth } from '../../hooks/useAuth'
import { getErrorMessage } from '../../utils/errors'
import { getRoleHome } from '../../utils/roles'
import ICCT_Logo from '../../assets/icct-logo.png'
import Login_bg from '../../assets/Login_bg.webp'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
            Hello, There<br />Students!
          </h1>
          <p className="mt-6 text-medium font-light leading-relaxed text-blue-100">
            A centralized platform designed to optimize academic advising. Browse faculty availability, 
            secure consultation slots, and foster a more connected campus experience.
          </p>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-sm text-blue-200">
          
        </p>
      </div>

      {/* ── Right: Login Form Panel ── */}
      <div className="flex w-full lg:w-[45%] xl:w-[40%] flex-col justify-between bg-white px-6 py-8 md:px-12 md:py-12 h-full overflow-y-auto">
        
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
        <div className="mx-auto w-full max-w-md my-auto pt-8 lg:pt-0">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Welcome Back!</h2>
          <p className="mt-1.5 text-sm text-slate-500">Sign in to book an appointment.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && <Alert tone="error">{error}</Alert>}

            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-700">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="juandelecruz@gmail.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-11 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? 'Signing in...' : 'Log In'}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-500">
              New account?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-700">
                Create an account
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