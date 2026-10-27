import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import { AuthContext } from './auth-context'

const TOKEN_KEY = 'fcs_token'
const USER_KEY = 'fcs_user'

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function normalizeUser(data) {
  return {
    _id: data._id,
    name: data.name,
    email: data.email,
    role: data.role,
    studentNumber: data.studentNumber,
    department: data.department,
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(readStoredUser)

  const persistSession = useCallback((data) => {
    const nextUser = normalizeUser(data)

    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setToken(data.token)
    setUser(nextUser)

    return nextUser
  }, [])

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password })
      return persistSession(data)
    },
    [persistSession],
  )

  const registerStudent = useCallback(
    async (payload) => {
      const { data } = await api.post('/auth/register', payload)
      return persistSession(data)
    },
    [persistSession],
  )

  const updateUser = useCallback((updatedFields) => {
    setUser((current) => {
      const next = { ...current, ...updatedFields }
      localStorage.setItem(USER_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => logout()

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [logout])

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      login,
      registerStudent,
      updateUser,
      logout,
    }),
    [token, user, login, registerStudent, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
