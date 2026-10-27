const express = require('express');
const {
  registerStudent,
  login,
  createFaculty,
  getFaculty,
  changePassword,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/register', registerStudent);
router.post('/login', login);
router.put('/password', protect, changePassword);
router.put('/profile', protect, updateProfile);
router
  .route('/faculty')
  .get(protect, restrictTo('admin'), getFaculty)
  .post(protect, restrictTo('admin'), createFaculty);

module.exports = router;
