require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);
const clientOrigin = process.env.CLIENT_URL || '*';

const io = new Server(server, {
  cors: {
    origin: clientOrigin,
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Faculty Consultation Scheduling System API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);

io.on('connection', (socket) => {
  const { userId } = socket.handshake.query;

  if (userId) {
    socket.join(String(userId));
  }

  socket.on('disconnect', () => {});
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors)
      .map((item) => item.message)
      .join(', ');
    return res.status(400).json({ message });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ message: `Invalid value for ${error.path}` });
  }

  if (error.code === 11000) {
    const fields = error.keyValue ? Object.keys(error.keyValue).join(', ') : 'field';
    return res.status(409).json({ message: `Duplicate value for ${fields}` });
  }

  console.error(error);
  return res.status(500).json({ message: 'Internal server error' });
});

async function startServer() {
  await connectDB();

  const port = process.env.PORT || 5000;

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();
