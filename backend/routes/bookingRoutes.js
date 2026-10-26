const express = require('express');
const {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/', protect, restrictTo('student'), bookAppointment);
router.get('/my', protect, getMyAppointments);
router.patch('/:id/cancel', protect, restrictTo('student'), cancelAppointment);

module.exports = router;
