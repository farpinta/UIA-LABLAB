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

console.log('DEBUG: API Key exists?', !!process.env.IBM_CLOUD_API_KEY);
console.log('DEBUG: Current Directory:', process.cwd());

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Creates and configures Fastify server
 */
async function createServer() {
  const fastify = Fastify({
    logger: false, 
    trustProxy: true,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId'
  });

  // Register CORS
  await fastify.register(cors, {
    origin: FRONTEND_URL, 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
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

  // Register routes
  await fastify.register(healthRoutes);
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