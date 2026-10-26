const mongoose = require('mongoose');
const { parseTimeToMinutes } = require('../utils/timeUtils');

const scheduleSchema = new mongoose.Schema(
  {
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      trim: true,
      validate: [
        {
          validator: (value) => parseTimeToMinutes(value) !== null,
          message: 'Start time must use the HH:MM (24-hour) format',
        },
        {
          validator: (value) => {
            const minutes = parseTimeToMinutes(value);
            return minutes === null || minutes >= 9 * 60;
          },
          message: 'Start time cannot be before 9:00 AM',
        },
      ],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      trim: true,
      validate: [
        {
          validator: (value) => parseTimeToMinutes(value) !== null,
          message: 'End time must use the HH:MM (24-hour) format',
        },
        {
          validator: (value) => {
            const minutes = parseTimeToMinutes(value);
            return minutes === null || minutes <= 18 * 60;
          },
          message: 'End time cannot be after 6:00 PM',
        },
        {
          validator: function endAfterStart(value) {
            const end = parseTimeToMinutes(value);
            const start = parseTimeToMinutes(this.startTime);
            return end === null || start === null || end > start;
          },
          message: 'End time must be after the start time',
        },
      ],
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    maxSlots: {
      type: Number,
      default: 5,
      min: [1, 'Maximum slots must be at least 1'],
    },
    status: {
      type: String,
      enum: ['active', 'cancelled'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Schedule', scheduleSchema);
