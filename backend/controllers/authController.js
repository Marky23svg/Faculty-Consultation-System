const User = require('../models/User');
const generateToken = require('../utils/generateToken');

function authResponse(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    studentNumber: user.studentNumber,
    department: user.department,
    token: generateToken(user._id),
  };
}

async function registerStudent(req, res, next) {
  try {
    const { name, email, password, studentNumber } = req.body;

    if (!name || !email || !password || !studentNumber) {
      return res.status(400).json({
        message: 'Name, email, password, and student number are required',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'student',
      studentNumber,
    });

    return res.status(201).json(authResponse(user));
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json(authResponse(user));
  } catch (error) {
    return next(error);
  }
}

async function createFaculty(req, res, next) {
  try {
    const { name, email, password, department } = req.body;

    if (!name || !email || !password || !department) {
      return res.status(400).json({
        message: 'Name, email, password, and department are required',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'faculty',
      department,
    });

    return res.status(201).json({
      message: 'Faculty account created successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== 'string' ||
      typeof newPassword !== 'string' ||
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'New password must be at least 6 characters',
      });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({
        message: 'New password must be different from the current password',
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user || !(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    return next(error);
  }
}

async function getFaculty(req, res, next) {
  try {
    const faculty = await User.find({ role: 'faculty' })
      .select('name email department createdAt')
      .sort({ name: 1 });

    return res.json(faculty);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  registerStudent,
  login,
  createFaculty,
  getFaculty,
  changePassword,
};
