/**
 * Cache Service
 * In-memory caching for repository analysis results
 */

import NodeCache from 'node-cache';
import { GraphData } from '@bobinsight/shared-types';
import { logger } from '../utils/logger';

// Cache TTL: 1 hour (3600 seconds)
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '3600', 10);

// Initialize cache with TTL and check period
const cache = new NodeCache({
  stdTTL: CACHE_TTL,
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false // Don't clone objects for better performance
});

/**
 * Generates a cache key from repository URL
 */
function generateCacheKey(repoUrl: string): string {
  return `analysis:${repoUrl}`;
}

/**
 * Retrieves cached analysis for a repository
 * @param repoUrl - GitHub repository URL
 * @returns Cached graph data or null if not found
 */
export function getCachedAnalysis(repoUrl: string): GraphData | null {
  try {
    const key = generateCacheKey(repoUrl);
    const cached = cache.get<GraphData>(key);

    if (cached) {
      logger.info('Cache hit', { repoUrl });
      return cached;
    }

    logger.debug('Cache miss', { repoUrl });
    return null;
  } catch (error) {
    logger.error('Failed to retrieve from cache', error, { repoUrl });
    return null;
  }
}

/**
 * Stores analysis result in cache
 * @param repoUrl - GitHub repository URL
 * @param data - Graph data to cache
 */
export function setCachedAnalysis(repoUrl: string, data: GraphData): void {
  try {
    const key = generateCacheKey(repoUrl);
    cache.set(key, data);

    logger.info('Analysis cached', { 
      repoUrl, 
      nodeCount: data.nodes.length,
      edgeCount: data.edges.length 
    });
  } catch (error) {
    logger.error('Failed to store in cache', error, { repoUrl });
    // Don't throw error - caching is not critical
  }
}

/**
 * Invalidates cache for a specific repository
 * @param repoUrl - GitHub repository URL
 */
export function invalidateCache(repoUrl: string): void {
  try {
    const key = generateCacheKey(repoUrl);
    cache.del(key);

    logger.info('Cache invalidated', { repoUrl });
  } catch (error) {
    logger.error('Failed to invalidate cache', error, { repoUrl });
  }
}

/**
 * Clears all cached data
 */
export function clearCache(): void {
  try {
    cache.flushAll();
    logger.info('Cache cleared');
  } catch (error) {
    logger.error('Failed to clear cache', error);
  }
}

/**
 * Gets cache statistics
 */
export function getCacheStats() {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
    vsize: cache.getStats().vsize
  };
}

/**
 * Pre-populate cache with demo repositories
 * Used as Fallback B when API is slow
 */
export function preloadDemoCache(): void {
  const demoRepos = [
    {
      url: 'https://github.com/expressjs/express',
      data: {
        nodes: [
          { id: 'f1', fileName: 'lib/application.js', functions: ['init', 'listen', 'use'] },
          { id: 'f2', fileName: 'lib/router/index.js', functions: ['route', 'handle'] },
          { id: 'f3', fileName: 'lib/middleware/init.js', functions: ['init'] }
        ],
        edges: [
          {
            id: 'e1',
            sourceFile: 'lib/application.js',
            sourceFunction: 'use',
            targetFile: 'lib/router/index.js',
            targetFunction: 'route',
            description: 'Registers middleware with router'
          }
        ]
      }
    },
    {
      url: 'https://github.com/facebook/react',
      data: {
        nodes: [
          { id: 'f1', fileName: 'packages/react/src/React.js', functions: ['createElement', 'Component'] },
          { id: 'f2', fileName: 'packages/react-dom/src/client/ReactDOM.js', functions: ['render', 'hydrate'] }
        ],
        edges: [
          {
            id: 'e1',
            sourceFile: 'packages/react-dom/src/client/ReactDOM.js',
            sourceFunction: 'render',
            targetFile: 'packages/react/src/React.js',
            targetFunction: 'createElement',
            description: 'Renders React elements to DOM'
          }
        ]
      }
    },
    {
      url: 'https://github.com/nodejs/node',
      data: {
        nodes: [
          { id: 'f1', fileName: 'lib/http.js', functions: ['createServer', 'request'] },
          { id: 'f2', fileName: 'lib/net.js', functions: ['connect', 'createConnection'] }
        ],
        edges: [
          {
            id: 'e1',
            sourceFile: 'lib/http.js',
            sourceFunction: 'createServer',
            targetFile: 'lib/net.js',
            targetFunction: 'createConnection',
            description: 'HTTP server uses net module for connections'
          }
        ]
      }
    }
  ];

  demoRepos.forEach(({ url, data }) => {
    setCachedAnalysis(url, data);
  });

  logger.info('Demo cache preloaded', { count: demoRepos.length });
}
