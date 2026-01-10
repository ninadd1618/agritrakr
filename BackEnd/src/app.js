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

const app = express();

// Middleware setup
app.use(cors({
  origin: env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());
app.use(helmet());
app.use(morgan('dev', { stream: requestLogger.stream }));

// Health check routes
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to Flowmen Backend API!' });
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

// Import routes
import authRouter from './routes/auth.routes.js';
import soilRouter from './routes/soil.routes.js';
import userRouter from './routes/user.routes.js';
import oeeRouter from './routes/oee.routes.js';
import reportsRouter from './routes/reports.routes.js';

// API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/soil', soilRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/oee', oeeRouter);
app.use('/api/v1/reports', reportsRouter);

// 404 handler
app.use((req, res, next) => {
  next(new ApiError(404, 'Not Found'));
});

// Global error handler
app.use(errorMiddleware);

export { app };
