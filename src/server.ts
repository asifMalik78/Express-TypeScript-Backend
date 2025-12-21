import logger from './config/logger';
import app from './app';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const server = app.listen(PORT, () => {
  logger.info(
    `🚀 Server running http://localhost:${String(PORT)} in ${process.env.NODE_ENV ?? 'development'} mode`
  );
});

// Track if shutdown is in progress
let isShuttingDown = false;

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, forcing exit...');
    process.exit(1);
    return;
  }

  isShuttingDown = true;
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force close all connections after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout - closing all connections');
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }, 10000);
};

process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM');
});
process.on('SIGINT', () => {
  gracefulShutdown('SIGINT');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  logger.error('UNHANDLED REJECTION! 💥', {
    error: err.message,
    stack: err.stack,
  });

  // In development, don't shutdown on unhandled rejections - just log them
  // This prevents tsx --watch from constantly restarting
  if (process.env.NODE_ENV === 'development') {
    logger.warn('Continuing in development mode despite unhandled rejection');
    return;
  }

  // In production, shutdown gracefully
  if (!isShuttingDown) {
    gracefulShutdown('unhandledRejection');
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', {
    error: err.message,
    stack: err.stack,
  });
  // Uncaught exceptions are always critical - exit immediately
  process.exit(1);
});
