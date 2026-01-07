require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...', {
        error: err.message,
        stack: err.stack
    });
    process.exit(1);
});

// Connect to database
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║                                                       ║
  ║   🌀 VortexBoard API Server                          ║
  ║                                                       ║
  ║   Status: Running                                     ║
  ║   Port: ${PORT}                                        ║
  ║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(36)}║
  ║                                                       ║
  ║   API Endpoints:                                      ║
  ║   • http://localhost:${PORT}/                          ║
  ║   • http://localhost:${PORT}/health                    ║
  ║   • http://localhost:${PORT}/api/auth                  ║
  ║   • http://localhost:${PORT}/api/boards                ║
  ║   • http://localhost:${PORT}/api/tasks                 ║
  ║                                                       ║
  ╚═══════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! Shutting down...', {
        error: err.message,
        stack: err.stack
    });
    server.close(() => {
        process.exit(1);
    });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        logger.info('Process terminated');
    });
});
