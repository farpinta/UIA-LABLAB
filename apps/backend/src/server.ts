/**
 * BobInsight Backend Server
 * Fastify + TypeScript API Server
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { healthRoutes } from './routes/health';
import { analyzeRoutes } from './routes/analyze';
import { errorHandler } from './utils/errorHandler';
import { logger } from './utils/logger';
import { cleanupOldRepos } from './services/gitService';

// Removed debug console.log statements for production security

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Support multiple frontend origins (development + production)
const FRONTEND_URLS = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173'];

logger.info('CORS configuration loaded', {
  originsCount: FRONTEND_URLS.length,
  environment: process.env.NODE_ENV
});

/**
 * Creates and configures Fastify server
 */
async function createServer() {
  const fastify = Fastify({
    logger: false,
    trustProxy: true,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
    connectionTimeout: 120000, // 2 minutes
    keepAliveTimeout: 120000,
    requestTimeout: 120000 // 2 minutes for large repo analysis
  });

  // Register CORS with dynamic origin validation
  await fastify.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin in development OR for health checks
      if (!origin) {
        // Always allow health checks (Docker healthcheck, monitoring tools)
        callback(null, true);
        return;
      }

      // Check if origin is in allowed list
      const isAllowed = FRONTEND_URLS.some(allowedOrigin => {
        // Exact match
        if (origin === allowedOrigin) return true;
        
        // Pattern match for wildcard subdomains (e.g., *.pinont.me)
        // Escape special regex chars, then handle wildcard
        const escapedOrigin = allowedOrigin
          .replace(/[.+?^${}()|[\]\\]/g, '\\$&')  // Escape special chars
          .replace(/\\\*/g, '[a-zA-Z0-9-]+');      // Replace \* with valid subdomain pattern
        const regex = new RegExp(`^${escapedOrigin}$`);
        return regex.test(origin);
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['X-Request-Id'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // Register rate limiting
  await fastify.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX || '10', 10),
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
    errorResponseBuilder: () => ({
      success: false,
      error: 'Too many requests. Please try again later.',
      statusCode: 429,
      timestamp: new Date().toISOString()
    })
  });

  // Register health route first (before CORS for internal checks)
  await fastify.register(healthRoutes);
  
  // Register API routes
  await fastify.register(analyzeRoutes);

  // Global error handler
  fastify.setErrorHandler((error, _request, reply) => { 
    errorHandler(error as Error, reply); 
  });

  // 404 handler
  fastify.setNotFoundHandler((_request, reply) => { 
    reply.status(404).send({
      success: false,
      error: 'Route not found',
      statusCode: 404,
      timestamp: new Date().toISOString()
    });
  });

  return fastify;
}

/**
 * Starts the server
 */
async function start() {
  try {
    logger.info('Starting BobInsight Backend Server...');

    //preloadDemoCache();

    const server = await createServer();

    await server.listen({ port: PORT, host: HOST });

    logger.info('Server started successfully', {
      port: PORT,
      host: HOST,
      environment: process.env.NODE_ENV || 'development'
    });

    // Setup cleanup interval (every hour)
    setInterval(() => {
      cleanupOldRepos().catch((error: any) => { 
        logger.error('Failed to cleanup old repos', error);
      });
    }, 60 * 60 * 1000);

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach(signal => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, shutting down gracefully...`);
        
        try {
          await server.close();
          logger.info('Server closed successfully');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', error);
          process.exit(1);
        }
      });
    });

  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  start();
}

export { createServer, start };