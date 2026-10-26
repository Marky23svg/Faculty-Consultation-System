const Appointment = require('../models/Appointment');
const Schedule = require('../models/Schedule');
const Notification = require('../models/Notification');
const { ACTIVE_APPOINTMENT_STATUSES } = require('../utils/appointmentStatus');
const {
  parseTimeToMinutes,
  isSameUtcDay,
  timesOverlap,
} = require('../utils/timeUtils');

async function buildScheduleAvailability(scheduleId, maxSlots) {
  const bookedSlots = await Appointment.countDocuments({
    scheduleId,
    status: { $in: ACTIVE_APPOINTMENT_STATUSES },
  });

  const slotLimit = typeof maxSlots === 'number' ? maxSlots : 5;

  return {
    scheduleId: scheduleId.toString(),
    bookedSlots,
    maxSlots: slotLimit,
    availableSlots: Math.max(0, slotLimit - bookedSlots),
  };
}

async function bookAppointment(req, res, next) {
  try {
    const { scheduleId, agenda } = req.body;

    if (!scheduleId) {
      return res.status(400).json({ message: 'Schedule ID is required' });
    }

    const schedule = await Schedule.findById(scheduleId);

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    if (schedule.status === 'cancelled') {
      return res.status(409).json({
        message: 'This schedule has been cancelled by the faculty member',
      });
    }

    const existingBooking = await Appointment.findOne({
      scheduleId: schedule._id,
      studentId: req.user._id,
      status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    });

    if (existingBooking) {
      return res.status(409).json({
        message: 'You have already booked this schedule',
      });
    }

    const bookedCount = await Appointment.countDocuments({
      scheduleId: schedule._id,
      status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    });

    if (bookedCount >= schedule.maxSlots) {
      return res.status(409).json({ message: 'This schedule is already fully booked' });
    }

    const scheduleStart = parseTimeToMinutes(schedule.startTime);
    const scheduleEnd = parseTimeToMinutes(schedule.endTime);
    const studentAppointments = await Appointment.find({
      studentId: req.user._id,
      status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    }).populate('scheduleId', 'date startTime endTime');

    const hasConflict = studentAppointments.some((appointment) => {
      const existingSchedule = appointment.scheduleId;
      const existingStart = existingSchedule
        ? parseTimeToMinutes(existingSchedule.startTime)
        : null;
      const existingEnd = existingSchedule
        ? parseTimeToMinutes(existingSchedule.endTime)
        : null;

      if (
        !existingSchedule ||
        existingStart === null ||
        existingEnd === null ||
        scheduleStart === null ||
        scheduleEnd === null ||
        !isSameUtcDay(existingSchedule.date, schedule.date)
      ) {
        return false;
      }

      const overlaps = timesOverlap(
        existingStart,
        existingEnd,
        scheduleStart,
        scheduleEnd
      );
      const sameHourWindow =
        Math.floor(existingStart / 60) === Math.floor(scheduleStart / 60);

      return overlaps || sameHourWindow;
    });

    if (hasConflict) {
      return res.status(409).json({
        message:
          'You already have an appointment in this 1-hour window. Students may only book one appointment per hour.',
      });
    }

    const appointment = await Appointment.create({
      scheduleId: schedule._id,
      studentId: req.user._id,
      facultyId: schedule.facultyId,
      timeSlot: schedule.startTime,
      agenda: agenda || '',
      status: 'accepted',
    });

    const notification = await Notification.create({
      userId: schedule.facultyId,
      message: `${req.user.name} booked a consultation for "${schedule.topic}" on ${schedule.date
        .toISOString()
        .slice(0, 10)} from ${schedule.startTime} to ${schedule.endTime}.`,
    });

    const scheduleUpdate = await buildScheduleAvailability(schedule._id, schedule.maxSlots);
    const io = req.app.get('io');

    if (io) {
      io.to(schedule.facultyId.toString()).emit('newNotification', notification);
      io.emit('scheduleUpdated', scheduleUpdate);
    }

    return res.status(201).json({ appointment, notification, scheduleUpdate });
  } catch (error) {
    return next(error);
  }
}

async function getMyAppointments(req, res, next) {
  try {
    let filter = {};

    if (req.user.role === 'student') {
      filter = { studentId: req.user._id };
    } else if (req.user.role === 'faculty') {
      filter = { facultyId: req.user._id };
    }

    const appointments = await Appointment.find(filter)
      .populate('scheduleId')
      .populate('studentId', 'name email studentNumber')
      .populate('facultyId', 'name email department')
      .sort({ createdAt: -1 });

    return res.json(appointments);
  } catch (error) {
    return next(error);
  }
}

async function cancelAppointment(req, res, next) {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      studentId: req.user._id,
    }).populate('scheduleId', 'topic date startTime endTime maxSlots');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (!['pending', 'accepted'].includes(appointment.status)) {
      return res.status(409).json({
        message: 'Only pending or booked appointments can be cancelled',
      });
    }

    if (appointment.scheduleId) {
      const scheduleDate = appointment.scheduleId.date
        .toISOString()
        .slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);

      if (scheduleDate < today) {
        return res.status(409).json({
          message: 'Past appointments can no longer be cancelled',
        });
      }
    }

    appointment.status = 'cancelled';
    await appointment.save();

    const scheduleDate = appointment.scheduleId
      ? appointment.scheduleId.date.toISOString().slice(0, 10)
      : 'the scheduled date';
    const scheduleTime = appointment.scheduleId?.startTime
      ? `from ${appointment.scheduleId.startTime} to ${appointment.scheduleId.endTime}`
      : `at ${appointment.timeSlot}`;

    const notification = await Notification.create({
      userId: appointment.facultyId,
      message: `${req.user.name} cancelled the consultation for "${appointment.scheduleId?.topic || 'a schedule'}" on ${scheduleDate} ${scheduleTime}.`,
    });

    const scheduleUpdate = appointment.scheduleId
      ? await buildScheduleAvailability(
          appointment.scheduleId._id,
          appointment.scheduleId.maxSlots
        )
      : null;
    const io = req.app.get('io');

    if (io) {
      io.to(appointment.facultyId.toString()).emit('newNotification', notification);

      if (scheduleUpdate) {
        io.emit('scheduleUpdated', scheduleUpdate);
      }
    }

    return res.json({ appointment, notification, scheduleUpdate });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
};
