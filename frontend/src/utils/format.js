export function getDateKey(value) {
  if (!value) {
    return ''
  }

  return String(value).slice(0, 10)
}

export function formatDate(value) {
  const key = getDateKey(value)

  if (!key) {
    return '—'
  }

  const [year, month, day] = key.split('-').map(Number)

  if (!year || !month || !day) {
    return '—'
  }

  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatTime(value) {
  if (!value) {
    return '—'
  }

  const [hours, minutes] = String(value).split(':').map(Number)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value
  }

  const suffix = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12

  return `${displayHours}:${String(minutes).padStart(2, '0')} ${suffix}`
}

export function formatTimeRange(startTime, endTime) {
  if (!startTime || !endTime) {
    return '—'
  }

  return `${formatTime(startTime)} – ${formatTime(endTime)}`
}

export function formatDateTime(value) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function timeToMinutes(value) {
  if (!value || !String(value).includes(':')) {
    return null
  }

  const [hours, minutes] = String(value).split(':').map(Number)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null
  }

  return hours * 60 + minutes
}

export function buildTimeSlots(startTime, endTime, stepMinutes = 15) {
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)

  if (start === null || end === null || start >= end) {
    return []
  }

  const slots = []

  for (let minutes = start; minutes < end; minutes += stepMinutes) {
    const hours = Math.floor(minutes / 60)
    const remainder = minutes % 60
    slots.push(`${String(hours).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`)
  }

  return slots
}

export function isPastDate(value) {
  const key = getDateKey(value)

  if (!key) {
    return false
  }

  const today = new Date()
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')

  return key < todayKey
}
