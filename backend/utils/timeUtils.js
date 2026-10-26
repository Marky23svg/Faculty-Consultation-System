const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function parseTimeToMinutes(time) {
  if (typeof time !== 'string' || !TIME_PATTERN.test(time)) {
    return null;
  }

  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function isValidConsultationTime(startTime, endTime) {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);

  if (start === null || end === null) {
    return false;
  }

  return start >= 9 * 60 && end <= 18 * 60 && start < end;
}

function timesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

function getUtcDayRange(date) {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

function isSameUtcDay(dateA, dateB) {
  return new Date(dateA).toISOString().slice(0, 10) === new Date(dateB).toISOString().slice(0, 10);
}

function timeSlotsMatch(slotA, slotB) {
  const minutesA = parseTimeToMinutes(slotA);
  const minutesB = parseTimeToMinutes(slotB);

  if (minutesA !== null && minutesB !== null) {
    return minutesA === minutesB;
  }

  return String(slotA).trim().toLowerCase() === String(slotB).trim().toLowerCase();
}

module.exports = {
  parseTimeToMinutes,
  isValidConsultationTime,
  timesOverlap,
  getUtcDayRange,
  isSameUtcDay,
  timeSlotsMatch,
};
