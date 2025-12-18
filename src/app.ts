import logger from '#config/logger.js';
import { HTTP_STATUS } from '#constants/httpStatus.js';
import { requestId } from '#middleware/requestId.middleware.js';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    origin: process.env.CORS_ORIGIN ?? '*',
  })
);

// Request ID middleware (must be early in the chain)
app.use(requestId);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware - compress responses to reduce bandwidth
app.use(compression());

// Logging middleware
app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

import { globalErrorHandler } from '#middleware/error.middleware';
import authRoutes from '#routes/auth.routes';
import userRoutes from '#routes/user.routes';
import { AppError } from '#utils/AppError';

app.use('/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    message: 'Server is healthy',
    status: HTTP_STATUS.OK,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API versioning - v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

app.get('/', (req, res) => {
  res.status(HTTP_STATUS.OK).json({ message: 'Server is running' });
});

// Catch-all route for unmatched paths (Express 5 compatible)
app.use((req, res, next) => {
  next(
    new AppError(
      `Can't find ${req.originalUrl} on this server!`,
      HTTP_STATUS.NOT_FOUND
    )
  );
});

app.use(globalErrorHandler);

export default app;
