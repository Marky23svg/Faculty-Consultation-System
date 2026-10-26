export const ROLE_LABELS = {
  student: 'Student',
  faculty: 'Faculty',
  admin: 'Admin',
}

export const ROLE_HOME = {
  student: '/student/schedules',
  faculty: '/faculty/schedules/new',
  admin: '/admin/faculty/new',
}

export function getRoleHome(role) {
  return ROLE_HOME[role] || '/login'
}
