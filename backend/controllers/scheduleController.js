const Appointment = require('../models/Appointment');
const Schedule = require('../models/Schedule');
const Notification = require('../models/Notification');
const { ACTIVE_APPOINTMENT_STATUSES } = require('../utils/appointmentStatus');
const {
  parseTimeToMinutes,
  isValidConsultationTime,
  timesOverlap,
  getUtcDayRange,
} = require('../utils/timeUtils');

// Helper function to format 24h time to 12h time with AM/PM
function formatTime12Hour(timeString) {
  if (!timeString) return '';
  const [hourString, minute] = timeString.split(':');
  let hour = parseInt(hourString, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  
  hour = hour % 12;
  hour = hour ? hour : 12; // the hour '0' should be '12'
  
  return `${hour}:${minute} ${ampm}`;
}

async function createSchedule(req, res, next) {
  try {
    const { date, startTime, endTime, topic, location, maxSlots } = req.body;

    if (!date || !startTime || !endTime || !topic || !location) {
      return res.status(400).json({
        message: 'Date, start time, end time, topic, and location are required',
      });
    }

    if (!isValidConsultationTime(startTime, endTime)) {
      return res.status(400).json({
        message:
          'Invalid consultation time. Start time must be at or after 9:00 AM, end time at or before 6:00 PM, and end time must be after start time.',
      });
    }

    const scheduleDate = new Date(date);

    if (Number.isNaN(scheduleDate.getTime())) {
      return res.status(400).json({ message: 'Invalid schedule date' });
    }

    const { start, end } = getUtcDayRange(scheduleDate);
    const sameDaySchedules = await Schedule.find({
      facultyId: req.user._id,
      date: { $gte: start, $lt: end },
      status: { $ne: 'cancelled' },
    });

    const newStart = parseTimeToMinutes(startTime);
    const newEnd = parseTimeToMinutes(endTime);

    const conflictingSchedule = sameDaySchedules.find((schedule) => {
      const existingStart = parseTimeToMinutes(schedule.startTime);
      const existingEnd = parseTimeToMinutes(schedule.endTime);

      if (existingStart === null || existingEnd === null) {
        return false;
      }

      return timesOverlap(newStart, newEnd, existingStart, existingEnd);
    });

    if (conflictingSchedule) {
      return res.status(409).json({
        message: 'This schedule overlaps with an existing schedule',
        conflict: {
          _id: conflictingSchedule._id,
          topic: conflictingSchedule.topic,
          startTime: conflictingSchedule.startTime,
          endTime: conflictingSchedule.endTime,
        },
      });
    }

    const schedule = await Schedule.create({
      facultyId: req.user._id,
      date: scheduleDate,
      startTime,
      endTime,
      topic,
      location,
      maxSlots,
    });

    return res.status(201).json(schedule);
  } catch (error) {
    return next(error);
  }
}

async function getSchedules(req, res, next) {
  try {
    const filter = {};

    if (req.query.facultyId) {
      filter.facultyId = req.query.facultyId;
    }

    if (req.query.includeCancelled !== 'true') {
      filter.status = { $ne: 'cancelled' };
    }

    if (req.query.date) {
      const queryDate = new Date(req.query.date);

      if (Number.isNaN(queryDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date filter' });
      }

      const { start, end } = getUtcDayRange(queryDate);
      filter.date = { $gte: start, $lt: end };
    }

    const schedules = await Schedule.find(filter)
      .populate('facultyId', 'name email department')
      .sort({ date: 1, startTime: 1 });

    const scheduleIds = schedules.map((schedule) => schedule._id);
    const bookedAppointments = scheduleIds.length
      ? await Appointment.find({
          scheduleId: { $in: scheduleIds },
          status: { $in: ACTIVE_APPOINTMENT_STATUSES },
        })
          .select('scheduleId')
          .lean()
      : [];

    const availabilityBySchedule = new Map(
      scheduleIds.map((scheduleId) => [scheduleId.toString(), { bookedSlots: 0 }])
    );

    bookedAppointments.forEach((appointment) => {
      const availability = availabilityBySchedule.get(appointment.scheduleId.toString());

      if (availability) {
        availability.bookedSlots += 1;
      }
    });

    const schedulesWithAvailability = schedules.map((schedule) => {
      const scheduleData = schedule.toObject();
      const availability = availabilityBySchedule.get(schedule._id.toString()) || {
        bookedSlots: 0,
      };

      return {
        ...scheduleData,
        ...availability,
        availableSlots: Math.max(0, scheduleData.maxSlots - availability.bookedSlots),
      };
    });

    return res.json(schedulesWithAvailability);
  } catch (error) {
    return next(error);
  }
}

async function cancelSchedule(req, res, next) {
  try {
    const schedule = await Schedule.findOne({
      _id: req.params.id,
      facultyId: req.user._id,
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    if (schedule.status === 'cancelled') {
      return res.status(409).json({ message: 'This schedule is already cancelled' });
    }

    const scheduleDate = schedule.date.toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);

    if (scheduleDate < today) {
      return res.status(409).json({
        message: 'Past schedules can no longer be cancelled',
      });
    }

    schedule.status = 'cancelled';
    await schedule.save();

    const activeAppointments = await Appointment.find({
      scheduleId: schedule._id,
      status: { $in: ['pending', 'accepted'] },
    }).select('studentId');

    await Appointment.updateMany(
      {
        scheduleId: schedule._id,
        status: { $in: ['pending', 'accepted'] },
      },
      { $set: { status: 'cancelled' } }
    );

    const studentIds = [
      ...new Set(
        activeAppointments.map((appointment) => appointment.studentId.toString())
      ),
    ];
    
    // Format time for the cancellation notification
    const formattedStartTime = formatTime12Hour(schedule.startTime);
    const formattedEndTime = formatTime12Hour(schedule.endTime);

    const message = `Your consultation for "${schedule.topic}" on ${scheduleDate} from ${formattedStartTime} to ${formattedEndTime} has been cancelled by ${req.user.name}.`;

    let notifications = [];

    if (studentIds.length) {
      notifications = await Notification.insertMany(
        studentIds.map((userId) => ({ userId, message }))
      );
    }

    const io = req.app.get('io');

    if (io) {
      notifications.forEach((notification) => {
        io.to(notification.userId.toString()).emit('newNotification', notification);
      });

      io.emit('scheduleCancelled', {
        scheduleId: schedule._id.toString(),
        cancelledAppointments: activeAppointments.length,
      });
    }

    return res.json({
      schedule,
      cancelledAppointments: activeAppointments.length,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createSchedule,
  getSchedules,
  cancelSchedule,
};