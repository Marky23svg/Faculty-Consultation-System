import { Link } from 'react-router-dom'
import { CalendarX2 } from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import { useAuth } from '../hooks/useAuth'
import { getRoleHome } from '../utils/roles'

export default function NotFound() {
  const { isAuthenticated, user } = useAuth()
  const home = isAuthenticated ? getRoleHome(user.role) : '/login'

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <CalendarX2 className="h-5 w-5" />
        </div>
        <h1 className="font-display mt-4 text-xl font-extrabold text-slate-800">Page not found</h1>
        <p className="mt-2 text-sm text-slate-500">
          The page you are looking for does not exist or has moved.
        </p>
        <Button as={Link} to={home} className="mt-6">
          Go to dashboard
        </Button>
      </Card>
    </div>
  )
}
