/**
 * IBM Bob API Service
 * Handles communication with IBM Bob API with retry logic and fallback
 */

import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import Bottleneck from 'bottleneck';
import { FileContent, BobApiResponse } from '@bobinsight/shared-types';
import { logger } from '../utils/logger';
import { ExternalServiceError } from '../utils/errorHandler';
import * as fs from 'fs/promises';
import * as path from 'path';

const IBM_BOB_BASE_URL = process.env.IBM_BOB_BASE_URL || 'https://us-south.ml.cloud.ibm.com';
const REQUEST_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 3;


const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 6000 
});

// Track API health
let apiSuccessCount = 0;
let apiFailureCount = 0;

/**
 * Creates configured axios instance for IBM Bob API
 */
function createApiClient(apiKey: string): AxiosInstance {
  const client = axios.create({
    baseURL: IBM_BOB_BASE_URL,
    timeout: REQUEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  });

  // Configure retry logic
  axiosRetry(client, {
    retries: MAX_RETRIES,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
      return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
             (error.response?.status ? error.response.status >= 500 : false);
    },
    onRetry: (retryCount, error) => {
      logger.warn('Retrying IBM Bob API request', {
        retryCount,
        error: error.message
      });
    }
  });

  return client;
}

/**
 * Generates the prompt for IBM Bob API
 */
function generatePrompt(files: FileContent[]): string {
  const fileList = files.map(f => f.path).join(', ');
  
  return `Analyze this repository and extract:
1. All function declarations (name, file, line number)
2. Cross-file function invocations (which function calls which)
3. Return strictly as JSON in this format:

{
  "files": [
    {
      "name": "src/auth.js",
      "functions": [
        {
          "name": "login",
          "line": 10,
          "calls": [
            {
              "file": "src/db.js",
              "function": "getUser",
              "description": "Fetches user record"
            }
          ]
        }
      ]
    }
  ]
}

Repository contains ${files.length} files: ${fileList}

File contents:
${files.map(f => `\n--- ${f.path} ---\n${f.content}`).join('\n')}`; // นัทเอา .substring(0, 1000) ออกเพื่อให้ AI เห็นโค้ดทั้งหมดครับ
}

/**
 * Checks if IBM Bob API is available
 */
export async function checkApiHealth(): Promise<boolean> {
  const apiKey = process.env.IBM_BOB_API_KEY;
  if (!apiKey) {
    logger.warn('IBM Bob API key not configured');
    return false;
  }

  try {
    const apiClient = createApiClient(apiKey);
    await apiClient.get('/health', { timeout: 5000 });
    return true;
  } catch (error) {
    logger.warn('IBM Bob API health check failed', { error });
    return false;
  }
}

/**
 * Gets API success rate
 */
export function getApiSuccessRate(): number {
  const total = apiSuccessCount + apiFailureCount;
  if (total === 0) return 1.0;
  return apiSuccessCount / total;
}

/**
 * Analyzes repository using IBM Bob API
 * @param files - Array of file contents to analyze
 * @returns Bob API response
 */
export async function analyzeWithBobApi(files: FileContent[]): Promise<BobApiResponse> {
  // ดึงค่า API Key ภายในฟังก์ชันเพื่อแก้ปัญหาลำดับการโหลดไฟล์ครับ
  const apiKey = process.env.IBM_BOB_API_KEY;

  if (!apiKey) {
    logger.warn('IBM Bob API key not configured, using fallback');
    throw new ExternalServiceError('IBM Bob API key not configured');
  }

  try {
    logger.info('Sending analysis request to IBM Bob API', {
      fileCount: files.length
    });

    const prompt = generatePrompt(files);
    const apiClient = createApiClient(apiKey);

    const response = await limiter.schedule(() =>
      apiClient.post('/analyze', {
        prompt,
        files: files.map(f => ({
          path: f.path,
          content: f.content
        }))
      })
    );

    apiSuccessCount++;
    
    logger.info('IBM Bob API analysis successful', {
      statusCode: response.status
    });

    return response.data as BobApiResponse;
  } catch (error: any) {
    apiFailureCount++;
    
    logger.error('IBM Bob API request failed', error, {
      fileCount: files.length,
      successRate: getApiSuccessRate()
    });

    throw new ExternalServiceError(
      error.response?.data?.message || 'Failed to analyze repository with IBM Bob API'
    );
  }
}

/**
 * Loads mock fallback data
 * Fallback A: API completely inaccessible
 */
export async function loadMockFallback(): Promise<BobApiResponse> {
  try {
    logger.info('Loading mock fallback data');

    const mockPath = path.join(__dirname, '../mocks/expressAppMock.json');
    const mockData = await fs.readFile(mockPath, 'utf-8');
    const parsed = JSON.parse(mockData);

    const bobResponse: BobApiResponse = {
      files: []
    };

    const fileMap = new Map<string, any>();

    parsed.nodes.forEach((node: any) => {
      if (!fileMap.has(node.fileName)) {
        fileMap.set(node.fileName, {
          name: node.fileName,
          functions: []
        });
      }

      const file = fileMap.get(node.fileName);
      node.functions.forEach((funcName: string) => {
        file.functions.push({
          name: funcName,
          calls: []
        });
      });
    });

    parsed.edges.forEach((edge: any) => {
      const sourceFile = fileMap.get(edge.sourceFile);
      if (sourceFile) {
        const sourceFunc = sourceFile.functions.find(
          (f: any) => f.name === edge.sourceFunction
        );
        if (sourceFunc) {
          sourceFunc.calls.push({
            file: edge.targetFile,
            function: edge.targetFunction,
            description: edge.description
          });
        }
      }
    });

    bobResponse.files = Array.from(fileMap.values());

    logger.info('Mock fallback data loaded successfully');
    return bobResponse;
  } catch (error) {
    logger.error('Failed to load mock fallback', error);
    throw new Error('Failed to load fallback data');
  }
}

/**
 * Resets API health statistics
 */
export function resetApiStats(): void {
  apiSuccessCount = 0;
  apiFailureCount = 0;
  logger.info('API statistics reset');
}