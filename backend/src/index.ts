import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createServer, Server } from 'http';
import { Server as HttpsServer } from 'https';
import { createServer as createHttpsServer } from 'https';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

import { connectDatabase, disconnectDatabase } from '@/config/database';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFoundHandler';
import { RealtimeService } from '@/services/realtimeService';
import { SniperBot } from '@/bot';

// Import routes
import authRoutes from '@/routes/auth';
import walletRoutes from '@/routes/wallet';
import tradingRoutes from '@/routes/trading';
import poolRoutes from '@/routes/poolRoutes';
import telegramWebAppRoutes from '@/routes/tgWebApp';

// Load environment variables
dotenv.config();

declare global {
  namespace Express {
    interface Request {
      user?: {
        address: string;
      };
      telegramUser?: ({
        added_to_attachment_menu?: boolean | undefined;
        allows_write_to_pm?: boolean | undefined;
        first_name: string;
        id: number;
        is_bot?: boolean | undefined;
        is_premium?: boolean | undefined;
        last_name?: string | undefined;
        language_code?: string | undefined;
        photo_url?: string | undefined;
        username?: string | undefined;
      } & {
        [key: string]: unknown;
      }) | undefined;
    }
  }
}

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

let server: Server | HttpsServer;

// Initialize HTTPS server if SSL certificates are available
const sslKeyPath = process.env['SSL_KEY_PATH'] || './ssl/key.pem';
const sslCertPath = process.env['SSL_CERT_PATH'] || './ssl/cert.pem';

try {
  const privateKey = readFileSync(sslKeyPath, 'utf8');
  const certificate = readFileSync(sslCertPath, 'utf8');
  const credentials = { key: privateKey, cert: certificate };

  server = createHttpsServer(credentials, app);
  logger.info('🔒 HTTPS server initialized with SSL certificates');
} catch (error) {
  logger.warn('⚠️ SSL certificates not found, falling back to HTTP server');
  server = createServer(app);
}

// Initialize real-time service
RealtimeService.initialize(server);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors(
  {
    origin: process.env['CORS_ORIGIN'] || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
  }
));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env['NODE_ENV'] || 'development',
    realtimeClients: RealtimeService.getConnectedClientsCount(),
    realtimeMonitoring: RealtimeService.getMonitoringStatus()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/pools', poolRoutes);
app.use('/api/telegram-webapp', telegramWebAppRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env['PORT'] || 3001;

const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start server
    server.listen(PORT, () => {
      const protocol = server instanceof HttpsServer ? 'https' : 'http';
      logger.info(`🚀 Server running on port ${PORT} (${protocol.toUpperCase()})`);
      logger.info(`📊 Health check: ${protocol}://localhost:${PORT}/health`);
      logger.info(`🔌 Real-time monitoring: Active`);
    });

    const bot = new SniperBot();
    await bot.initialize();

    // Keep the process alive
    setInterval(() => {
      if (!bot.getStatus().isRunning) {
        logger.error('Bot stopped running unexpectedly');
        process.exit(1);
      }
    }, 60000); // Check every minute

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    const protocol = server instanceof HttpsServer ? 'HTTPS' : 'HTTP';
    logger.info(`${protocol} server closed`);

    try {
      await disconnectDatabase();
      logger.info('Database connection closed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();
