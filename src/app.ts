import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import compression from 'compression';
import logger from '#config/logger';
import { HTTP_STATUS } from '#constants/httpStatus';
import { requestId } from '#middleware/requestId.middleware';

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
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

import authRoutes from '#routes/auth.routes';
import userRoutes from '#routes/user.routes';
import { globalErrorHandler } from '#middleware/error.middleware';
import { AppError } from '#utils/AppError';

app.use('/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    status: HTTP_STATUS.OK,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Server is healthy',
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
