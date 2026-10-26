import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import DashboardLayout from './layouts/DashboardLayout'
import NotFound from './pages/NotFound'
import Profile from './pages/Profile'
import CreateFaculty from './pages/admin/CreateFaculty'
import FacultyList from './pages/admin/FacultyList'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import IncomingRequests from './pages/faculty/IncomingRequests'
import ManageSchedule from './pages/faculty/ManageSchedule'
import MySchedule from './pages/faculty/MySchedule'
import BrowseSchedules from './pages/student/BrowseSchedules'
import MyAppointments from './pages/student/MyAppointments'
import { getRoleHome } from './utils/roles'

function RootRedirect() {
  const { isAuthenticated, user } = useAuth()

  return (
    <Navigate
      to={isAuthenticated ? getRoleHome(user.role) : '/login'}
      replace
    />
  )
}

function PublicOnly({ children }) {
  const { isAuthenticated, user } = useAuth()

  if (isAuthenticated) {
    return <Navigate to={getRoleHome(user.role)} replace />
  }

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          <Route
            path="/login"
            element={
              <PublicOnly>
                <Login />
              </PublicOnly>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnly>
                <Register />
              </PublicOnly>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Profile />} />
          </Route>

          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/student/schedules" replace />} />
            <Route path="schedules" element={<BrowseSchedules />} />
            <Route path="appointments" element={<MyAppointments />} />
          </Route>

          <Route
            path="/faculty"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={<Navigate to="/faculty/schedules/new" replace />}
            />
            <Route path="schedules/new" element={<ManageSchedule />} />
            <Route path="schedules" element={<MySchedule />} />
            <Route path="requests" element={<IncomingRequests />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={<Navigate to="/admin/faculty/new" replace />}
            />
            <Route path="faculty/new" element={<CreateFaculty />} />
            <Route path="faculty" element={<FacultyList />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
