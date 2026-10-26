require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

async function createAdmin() {
  const name = (process.env.ADMIN_NAME || '').trim();
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!name || !email || !password) {
    console.error('ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD are required.');
    process.exit(1);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('ADMIN_EMAIL must be a valid email address.');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('ADMIN_PASSWORD must be at least 6 characters.');
    process.exit(1);
  }

  await connectDB();

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    console.error(
      `A user with ${email} already exists with role "${existingUser.role}". No changes made.`,
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  const admin = await User.create({
    name,
    email,
    password,
    role: 'admin',
  });

  console.log(`Admin account created: ${admin.email}`);
  await mongoose.disconnect();
  process.exit(0);
}

createAdmin().catch(async (error) => {
  console.error(`Failed to create admin: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
