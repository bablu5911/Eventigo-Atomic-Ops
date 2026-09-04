// Atomic Ops Server Entry Point - Monorepo API Backend
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const setupSwagger = require('./config/swagger');
const errorHandler = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');

// Route imports
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const eventRoutes = require('./routes/eventRoutes');
const ticketTypeRoutes = require('./routes/ticketTypeRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const promoCodeRoutes = require('./routes/promoCodeRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const superadminRoutes = require('./routes/superadminRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

// Connect Database
connectDB();

// Global Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));

// Flexible CORS setup for separate Frontend deployment
const clientUrlList = (process.env.CLIENT_URL || '')
  .split(',')
  .map((u) => u.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/+$/, '');
      const standardDevOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173'
      ];

      if (
        process.env.NODE_ENV !== 'production' ||
        clientUrlList.includes(normalizedOrigin) ||
        standardDevOrigins.includes(normalizedOrigin) ||
        normalizedOrigin.endsWith('.vercel.app') ||
        normalizedOrigin.endsWith('.netlify.app')
      ) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', apiLimiter);

// Swagger Documentation setup
setupSwagger(app);

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    message: 'Atomic Ops API is running smoothly',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', ticketTypeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api', promoCodeRoutes);
app.use('/api', reviewRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/chat', chatRoutes);

// Central Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

if (!process.env.VERCEL) {
  app.listen(PORT, HOST, () => {
    console.log(`[Atomic Ops Server] running in ${process.env.NODE_ENV || 'development'} mode on http://${HOST}:${PORT}`);
    console.log(`[Swagger Docs available at]: http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
