/**
 * Analysis Route
 * Handles repository analysis requests
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AnalyzeRequest, AnalyzeResponse } from '@bobinsight/shared-types';
import { processGitHubUrl } from '../utils/urlValidator';
import { cloneRepository, extractFiles, cleanup } from '../services/gitService';
import { analyzeWithBobApi, loadMockFallback, getApiSuccessRate } from '../services/bobApiService';
import { transformToGraphData, validateGraphData } from '../services/graphTransformer';
import { getCachedAnalysis, setCachedAnalysis } from '../services/cacheService';
import { logger } from '../utils/logger';
import { ValidationError, ExternalServiceError } from '../utils/errorHandler';

interface AnalyzeRequestBody {
  repoUrl: string;
}

export async function analyzeRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/analyze
   * Analyzes a GitHub repository and returns function flow graph
   */
  fastify.post<{ Body: AnalyzeRequestBody }>(
    '/api/analyze',
    {
      schema: {
        body: {
          type: 'object',
          required: ['repoUrl'],
          properties: {
            repoUrl: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: AnalyzeRequestBody }>, reply: FastifyReply) => {
      const { repoUrl } = request.body;
      let clonePath: string | null = null;

      try {
        logger.info('Analysis request received', { repoUrl });

        // Step 1: Validate and sanitize URL
        const validatedUrl = processGitHubUrl(repoUrl);
        if (!validatedUrl) {
          throw new ValidationError('Invalid GitHub URL. Please provide a valid https://github.com/username/repo URL');
        }

        // Step 2: Check cache first
        const cached = getCachedAnalysis(validatedUrl);
        if (cached) {
          logger.info('Returning cached analysis', { repoUrl: validatedUrl });
          
          const response: AnalyzeResponse = {
            success: true,
            data: cached,
            source: 'fallback-cache',
            timestamp: new Date().toISOString()
          };

          return reply.status(200).send(response);
        }

        // Step 3: Clone repository
        clonePath = await cloneRepository(validatedUrl);

        // Step 4: Extract files
        const files = await extractFiles(clonePath);

        if (files.length === 0) {
          throw new ValidationError('No supported files found in repository');
        }

        logger.info('Files extracted', { 
          repoUrl: validatedUrl, 
          fileCount: files.length 
        });

        // Step 5: Analyze with IBM Bob API (with fallback logic)
        let bobResponse;
        let source: AnalyzeResponse['source'] = 'ibm-bob';

        try {
          // Check API success rate for Fallback C
          const successRate = getApiSuccessRate();
          
          if (successRate < 0.8 && successRate > 0) {
            logger.warn('API success rate below 80%, considering fallback', { successRate });
          }

          // Try IBM Bob API with timeout
          const analysisPromise = analyzeWithBobApi(files);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Analysis timeout')), 15000)
          );

          bobResponse = await Promise.race([analysisPromise, timeoutPromise]);
          
        } catch (error: any) {
          logger.warn('IBM Bob API failed, using fallback', { error: error.message });
          
          // Fallback A: Load mock data
          bobResponse = await loadMockFallback();
          source = 'fallback-mock';
        }

        // Step 6: Transform to graph format
        const graphData = transformToGraphData(bobResponse);

        // Step 7: Validate graph data
        if (!validateGraphData(graphData)) {
          throw new Error('Invalid graph data generated');
        }

        // Step 8: Cache the result
        setCachedAnalysis(validatedUrl, graphData);

        // Step 9: Return response
        const response: AnalyzeResponse = {
          success: true,
          data: graphData,
          source,
          timestamp: new Date().toISOString()
        };

        logger.info('Analysis completed successfully', {
          repoUrl: validatedUrl,
          source,
          nodeCount: graphData.nodes.length,
          edgeCount: graphData.edges.length
        });

        return reply.status(200).send(response);

      } catch (error: any) {
        logger.error('Analysis failed', error, { repoUrl });

        // If it's a validation error, throw it
        if (error instanceof ValidationError) {
          throw error;
        }

        // For other errors, try to return fallback data
        try {
          logger.info('Attempting to return fallback data due to error');
          
          const bobResponse = await loadMockFallback();
          const graphData = transformToGraphData(bobResponse);

          const response: AnalyzeResponse = {
            success: true,
            data: graphData,
            source: 'fallback-mock',
            timestamp: new Date().toISOString()
          };

          return reply.status(200).send(response);
        } catch (fallbackError) {
          logger.error('Fallback also failed', fallbackError);
          throw new ExternalServiceError('Analysis failed and fallback unavailable');
        }

      } finally {
        // Always cleanup cloned repository
        if (clonePath) {
          await cleanup(clonePath);
        }
      }
    }
  );
}
