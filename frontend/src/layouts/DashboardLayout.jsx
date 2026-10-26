import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarCheck2,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  ClipboardList,
  LogOut,
  Menu,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import NotificationBell from '../components/NotificationBell'
import { useAuth } from '../hooks/useAuth'
import { ROLE_LABELS } from '../utils/roles'
import ICCT_Logo from '../assets/icct-logo.png'

const NAV_ITEMS = {
  student: [
    { to: '/student/schedules', label: 'Browse Schedules', icon: CalendarDays },
    { to: '/student/appointments', label: 'My Appointments', icon: ClipboardList },
  ],
  faculty: [
    { to: '/faculty/schedules/new', label: 'Manage Schedule', icon: CalendarPlus },
    { to: '/faculty/requests', label: 'Student Bookings', icon: CalendarCheck2 },
    { to: '/faculty/schedules', label: 'My Schedule', icon: CalendarDays },
  ],
  admin: [
    { to: '/admin/faculty/new', label: 'Create Faculty', icon: UserPlus },
    { to: '/admin/faculty', label: 'Faculty List', icon: Users },
  ],
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = NAV_ITEMS[user.role] || []
  const currentItem = navItems.find(
    (item) =>
      location.pathname === item.to ||
      location.pathname.startsWith(`${item.to}/`),
  )
  const pageTitle =
    currentItem?.label ||
    (location.pathname === '/profile' ? 'My Profile' : 'Dashboard')

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-canvas">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-slate-200 bg-white px-4 py-6 transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-7 flex items-center justify-between px-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-none text-white">
              <img src={ICCT_Logo} alt="ICCT Logo" className="h-full w-full object-cover p-" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-[17px] font-extrabold leading-tight tracking-[-0.5px] text-slate-800">
                Faculty Consult
              </p>
              <p className="mt-0.5 text-[9px] font-bold uppercase leading-tight tracking-[0.15em] text-slate-400">
                Scheduling System
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex min-h-[43px] items-center gap-3 rounded-lg px-3 text-[13px] font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-4 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-[43px] w-full items-center gap-3 rounded-lg px-3 text-[13px] font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-[34px]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-display text-[13px] font-bold text-slate-700">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationBell />
            <div className="h-6 w-px bg-slate-200" aria-hidden="true" />
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Open profile"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[11px] font-extrabold text-blue-700">
                {getInitials(user.name)}
              </div>
              <div className="hidden sm:block">
                <p className="text-[13px] font-semibold leading-tight text-slate-700">
                  {user.name}
                </p>
                <p className="mt-0.5 text-[10px] leading-tight text-slate-500">
                  {ROLE_LABELS[user.role] || user.role}
                </p>
              </div>
              <ChevronRight className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1450px] px-4 py-6 pb-12 sm:px-6 lg:px-[34px] lg:py-[31px]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
