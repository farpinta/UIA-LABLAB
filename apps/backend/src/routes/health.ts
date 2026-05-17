/**
 * Health Check Route
 * Provides system health status
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { HealthResponse } from '@bobinsight/shared-types';
import { getCacheStats } from '../services/cacheService';
import { checkApiHealth } from '../services/bobApiService';
import { logger } from '../utils/logger';

export async function healthRoutes(fastify: FastifyInstance) {
  /**
   * GET /health
   * Returns health status of the service
   */
  fastify.get('/health', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const cacheStats = getCacheStats();
      const apiHealthy = await checkApiHealth();

      const response: HealthResponse = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          api: apiHealthy ? 'healthy' : 'unhealthy',
          cache: cacheStats.keys >= 0 ? 'healthy' : 'unhealthy'
        }
      };

      logger.info('Health check performed', {
        apiHealthy,
        cacheKeys: cacheStats.keys
      });

      return reply.status(200).send(response);
    } catch (error) {
      logger.error('Health check failed', error);

      const response: HealthResponse = {
        status: 'error',
        timestamp: new Date().toISOString()
      };

      return reply.status(503).send(response);
    }
  });
}
