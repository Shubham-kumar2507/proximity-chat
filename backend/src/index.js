require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { initSocket } = require('./socket/socketServer');
const { initCronJobs } = require('./utils/cronJobs');
const authRoutes = require('./routes/auth');
const locationRoutes = require('./routes/location');
const requestRoutes = require('./routes/requests');
const chatRoutes = require('./routes/chat');
const safetyRoutes = require('./routes/safety');
const userRoutes = require('./routes/users');
const { rateLimiter } = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Initialize Socket.io
initSocket(server);

// Initialize cron jobs
initCronJobs();

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Proximity Chat server running on port ${PORT}`);
});

module.exports = { app, server };
