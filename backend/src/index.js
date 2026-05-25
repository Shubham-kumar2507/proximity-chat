const config = require('./config');
const express = require('express');
const http = require('http');
const cors = require('cors');
let helmet;
try {
  helmet = require('helmet');
} catch {
  helmet = null;
}
const { initSocket } = require('./socket/socketServer');
const { initCronJobs } = require('./utils/cronJobs');
const authRoutes = require('./routes/auth');
const locationRoutes = require('./routes/location');
const requestRoutes = require('./routes/requests');
const chatRoutes = require('./routes/chat');
const safetyRoutes = require('./routes/safety');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const spotifyRoutes = require('./routes/spotify');
const placesRoutes = require('./routes/places');
const truthsGameRoutes = require('./routes/truthsGame');
const { rateLimiter } = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);

// Middleware
if (helmet) app.use(helmet());
if (config.isProduction) app.set('trust proxy', 1);
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));
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
app.use('/api/posts', postRoutes);
app.use('/api/spotify', spotifyRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/users', truthsGameRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({
    success: false,
    error: message,
  });
});

// Initialize Socket.io
initSocket(server);

if (require.main === module) {
  // Initialize cron jobs
  initCronJobs();

  server.listen(config.port, '0.0.0.0', () => {
    console.log(`🚀 Proximity Chat server running on port ${config.port}`);
  });
}

module.exports = { app, server };
