import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { ApiError } from './utils/ApiError.js';
import { appLogger, requestLogger } from './config/logger.js';
import { env } from './config/env.js';
import legacySoilRoutes from './routes/soilRoutes.js';

const app = express();

// Middleware setup
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost and any Netlify subdomain
    if (origin.includes("localhost:") || origin.includes(".netlify.app")) {
      return callback(null, true);
    }
    
    // Log blocked origins for debugging
    console.log("CORS blocked origin:", origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

// Debug middleware for authentication
app.use((req, res, next) => {
  if (req.path.startsWith('/api/v1/settings')) {
    console.log('=== AUTH DEBUG ===');
    console.log('Path:', req.path);
    console.log('Origin:', req.headers.origin);
    console.log('Cookies:', req.headers.cookie);
    console.log('Auth Headers:', {
      authorization: req.headers.authorization,
      cookie: req.headers.cookie ? 'Present' : 'Missing'
    });
    console.log('================');
  }
  next();
});

app.use(helmet());
app.use(morgan('dev', { stream: requestLogger.stream }));

// Health check routes
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to AgroTech Backend API!' });
});

app.get('/health', (req, res) => {
  const mongoStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const stateIndex = mongoose.connection.readyState;
  const mongoState = mongoStates[stateIndex] || 'unknown';

  res.status(200).json({
    status: 'ok',
    mongo: mongoState,
  });
});

// Render health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Import routes
import authRouter from './routes/auth.routes.js';
import soilRouter from './routes/soil.routes.js';
import userRouter from './routes/user.routes.js';
import deviceRouter from './routes/device.routes.js';
import oeeRouter from './routes/oee.routes.js';
import dataRouter from './routes/data.routes.js';
import reportsRouter from './routes/reports.routes.js';
import userSettingsRouter from './routes/userSettings.routes.js';

// API routes
app.use('/soil', legacySoilRoutes);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/soil', soilRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/devices', deviceRouter);
app.use('/api/v1/oee', oeeRouter);
app.use('/api/v1/data', dataRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/settings', userSettingsRouter);
console.log("Settings router mounted at /api/v1/settings");

// 404 handler
app.use((req, res, next) => {
  next(new ApiError(404, 'Not Found'));
});

// Global error handler
app.use(errorMiddleware);

export { app };
