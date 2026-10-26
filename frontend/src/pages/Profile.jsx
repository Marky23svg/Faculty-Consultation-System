import { useState } from 'react'
import api from '../api/client'
import Alert from '../components/Alert'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../utils/errors'
import { ROLE_LABELS } from '../utils/roles'

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function ProfileField({ label, value, className = '' }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-slate-50 p-3.5 ${className}`}>
      <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value || 'Not provided'}
      </dd>
    </div>
  )
}

export default function Profile() {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isStudent = user.role === 'student'
  const roleLabel = ROLE_LABELS[user.role] || user.role

  async function handlePasswordChange(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match')
      return
    }

    setSaving(true)

    try {
      await api.put('/auth/password', { currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSuccess('Password updated successfully')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="My Profile"
        description={
          isStudent
            ? 'View your account information and update your password.'
            : user.role === 'faculty'
              ? 'View your account information and department details.'
              : 'View your account information.'
        }
      />

      <div
        className={`grid gap-5 ${
          isStudent
            ? 'lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]'
            : 'max-w-3xl'
        }`}
      >
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-base font-extrabold text-blue-700">
              {getInitials(user.name)}
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-extrabold tracking-[-0.5px] text-slate-800">
                {user.name}
              </h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                  {roleLabel}
                </span>
                <span className="text-xs text-slate-500">{user.email}</span>
              </div>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <ProfileField label="Full name" value={user.name} />
            <ProfileField label="Email" value={user.email} />
            {user.role === 'student' && (
              <ProfileField
                label="Student number"
                value={user.studentNumber}
                className="sm:col-span-2"
              />
            )}
            {user.role === 'faculty' && (
              <ProfileField
                label="Department"
                value={user.department}
                className="sm:col-span-2"
              />
            )}
          </dl>
        </Card>

        {isStudent && (
          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-base font-extrabold tracking-[-0.3px] text-slate-800">
              Change password
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Use a password with at least 6 characters.
            </p>

            {(error || success) && (
              <Alert tone={error ? 'error' : 'success'} className="mt-4">
                {error || success}
              </Alert>
            )}

            <form
              onSubmit={handlePasswordChange}
              className="mt-4 space-y-3"
            >
              <Input
                label="Current password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
              <Input
                label="New password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
              <Input
                label="Confirm new password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />

              <div className="pt-1">
                <Button
                  type="submit"
                  disabled={
                    saving ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                  className="w-full sm:w-auto"
                >
                  {saving ? 'Updating...' : 'Update password'}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </>
  )
}
