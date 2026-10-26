const express = require('express');
const {
  createSchedule,
  getSchedules,
  cancelSchedule,
} = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

router
  .route('/')
  .get(protect, getSchedules)
  .post(protect, restrictTo('faculty'), createSchedule);

router.patch('/:id/cancel', protect, restrictTo('faculty'), cancelSchedule);

module.exports = router;
