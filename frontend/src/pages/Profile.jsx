import { useState } from 'react'
import { HelpCircle, Lock } from 'lucide-react'
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

function ProfileField({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
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
  const { user, updateUser } = useAuth()

  // ── Profile edit state ──
  const [profileForm, setProfileForm] = useState({
    name: user.name || '',
    studentNumber: user.studentNumber || '',
    department: user.department || '',
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')

  // ── Password change state ──
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  const roleLabel = ROLE_LABELS[user.role] || user.role
  const canEditProfile = user.role === 'student' || user.role === 'faculty'

  function handleProfileChange(event) {
    const { name, value } = event.target
    setProfileForm((current) => ({ ...current, [name]: value }))
  }

  async function handleProfileSave(event) {
    event.preventDefault()
    setProfileError('')
    setProfileSuccess('')
    setProfileSaving(true)

    try {
      const { data } = await api.put('/auth/profile', profileForm)
      updateUser(data)
      setProfileSuccess('Profile updated successfully.')
    } catch (requestError) {
      setProfileError(getErrorMessage(requestError))
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePasswordChange(event) {
    event.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }

    setPasswordSaving(true)

    try {
      await api.put('/auth/password', { currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess('Password updated successfully.')
    } catch (requestError) {
      setPasswordError(getErrorMessage(requestError))
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="My Profile"
        description="Manage your account information and security settings."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">

        {/* ── Left: Info card + edit form ── */}
        <div className="flex flex-col gap-5">

          {/* Identity card */}
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

          {/* Edit profile form — student & faculty only */}
          {canEditProfile && (
            <Card className="flex flex-1 flex-col p-5 sm:p-6">
              <h2 className="font-display text-base font-extrabold tracking-[-0.3px] text-slate-800">
                Edit profile
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {user.role === 'student'
                  ? 'Update your full name and student number.'
                  : 'Update your full name and department.'}
              </p>

              {(profileError || profileSuccess) && (
                <Alert tone={profileError ? 'error' : 'success'} className="mt-4">
                  {profileError || profileSuccess}
                </Alert>
              )}

              <form onSubmit={handleProfileSave} className="mt-4 flex flex-1 flex-col justify-between">
                <div className="space-y-3">
                  <Input
                    label="Full name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    required
                  />

                  {user.role === 'student' && (
                    <Input
                      label="Student number"
                      name="studentNumber"
                      type="text"
                      value={profileForm.studentNumber}
                      onChange={handleProfileChange}
                      required
                    />
                  )}

                  {user.role === 'faculty' && (
                    <Input
                      label="Department"
                      name="department"
                      type="text"
                      value={profileForm.department}
                      onChange={handleProfileChange}
                      required
                    />
                  )}
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={profileSaving || !profileForm.name.trim()}
                    className="w-full sm:w-auto cursor-pointer"
                  >
                    {profileSaving ? 'Saving...' : 'Save changes'}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col">
          <Card className="flex h-full flex-col justify-between p-5 sm:p-6">
            <div>
              <h2 className="font-display text-base font-extrabold tracking-[-0.3px] text-slate-800">
                Change password
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Use a password with at least 6 characters.
              </p>

              {(passwordError || passwordSuccess) && (
                <Alert tone={passwordError ? 'error' : 'success'} className="mt-4">
                  {passwordError || passwordSuccess}
                </Alert>
              )}

              <form onSubmit={handlePasswordChange} className="mt-4 space-y-3">
                <Input
                  label="Current password"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <Input
                  label="New password"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <Input
                  label="Confirm new password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                <div className="pt-1">
                  <Button
                    type="submit"
                    disabled={
                      passwordSaving ||
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword
                    }
                    className="w-full sm:w-auto cursor-pointer"
                  >
                    {passwordSaving ? 'Updating...' : 'Update password'}
                  </Button>
                </div>
              </form>
            </div>

            {/* ──  Support ── */}
            <div className="mt-6 border-t border-slate-100 pt-5">
      
              <div className="mt-3.5 space-y-2.5">
                <div className="flex gap-2 rounded-lg bg-slate-50 p-3">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <p className="text-xs leading-5 text-slate-500">
                    <span className="font-semibold text-slate-600">Note:</span> Your email address is your permanent login ID and cannot be changed. If you need to update it, please contact the system administrator.
                  </p>
                </div>

                <div className="flex gap-2 rounded-lg bg-slate-50 p-3">
                  <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <p className="text-xs leading-5 text-slate-500">
                    If you encounter issues with your account, schedules, or student bookings, please contact the <span className="font-semibold text-slate-600">MIS Department</span> or the <span className="font-semibold text-slate-600">System Administrator</span>.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>  )
}
