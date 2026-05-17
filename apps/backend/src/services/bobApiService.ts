/**
 * IBM watsonx.ai Service
 * Handles communication with watsonx.ai with retry logic and fallback
 */

import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import Bottleneck from 'bottleneck';
import { FileContent, BobApiResponse } from '@bobinsight/shared-types';
import { logger } from '../utils/logger';
import { ExternalServiceError } from '../utils/errorHandler';
import * as fs from 'fs/promises';
import * as path from 'path';

const WATSONX_BASE_URL = process.env.WATSONX_BASE_URL || 'https://us-south.ml.cloud.ibm.com';
const REQUEST_TIMEOUT = 60000; // 60 seconds
const MAX_RETRIES = 3;
const WATSONX_MODEL_ID = 'ibm/granite-4-h-small';

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 6000
});

// Track API health
let apiSuccessCount = 0;
let apiFailureCount = 0;

/**
 * Creates configured axios instance for watsonx.ai
 */
function createApiClient(token: string): AxiosInstance {
  const client = axios.create({
    baseURL: WATSONX_BASE_URL,
    timeout: REQUEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  axiosRetry(client, {
    retries: MAX_RETRIES,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
      return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
             (error.response?.status ? error.response.status >= 500 : false);
    },
    onRetry: (retryCount, error) => {
      logger.warn('Retrying watsonx.ai request', {
        retryCount,
        error: error.message
      });
    }
  });

  return client;
}

/**
 * Gets IBM Cloud IAM token
 */
async function getIBMCloudToken(): Promise<string> {
  const apiKey = process.env.IBM_CLOUD_API_KEY;
  if (!apiKey) {
    throw new ExternalServiceError('IBM Cloud API key not configured');
  }

  try {
    // Use URLSearchParams for safe URL encoding
    const params = new URLSearchParams();
    params.append('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
    params.append('apikey', apiKey);

    const response = await axios.post(
      'https://iam.cloud.ibm.com/identity/token',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: REQUEST_TIMEOUT
      }
    );

    if (!response.data?.access_token) {
      throw new ExternalServiceError('Failed to retrieve IBM Cloud IAM token');
    }

    return response.data.access_token as string;
  } catch (error: any) {
    // Log the exact IBM IAM error response for debugging
    logger.error('IBM IAM token request failed', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    throw new ExternalServiceError(
      `IBM IAM authentication failed: ${error.response?.data?.errorMessage || error.response?.data?.message || error.message}`
    );
  }
}

/**
 * Generates the prompt for watsonx.ai
 */
/**
 * Filters out non-essential files to reduce token count
 */
function filterEssentialFiles(files: FileContent[]): FileContent[] {
  return files.filter(f => {
    const path = f.path.toLowerCase();
    // Exclude node_modules, dist, build, and hidden folders
    if (path.includes('node_modules/') ||
        path.includes('/dist/') ||
        path.includes('/build/') ||
        path.includes('/.') ||
        path.startsWith('.')) {
      return false;
    }
    return true;
  });
}

/**
 * Generates the prompt for watsonx.ai with aggressive truncation
 */
function generatePrompt(files: FileContent[]): string {
  const fileList = files.map(f => f.path).join(', ');

  return `Return ONLY a JSON object. No preamble, no headers, no code repeating.
Format: {"files": [...]}.

IMPORTANT: DO NOT use markdown code blocks (like \`\`\`json). You MUST start your response directly with the opening curly brace '{' and end with the closing brace '}'.

Analyze this repository as a DEPENDENCY TREE and extract function declarations and their cross-file relationships.

CRITICAL INSTRUCTIONS:
1. Analyze ALL provided files and find at least 10 connections between them.
2. Every 'import' statement should be represented as a call in the JSON.
3. Focus especially on the routes/ folder and how they call services/.
4. Look at import statements, function calls, and component usage.
5. A graph with only 1-2 edges is incomplete - find ALL the connections.

Focus especially on:
- Import statements (e.g., import { analyzeWithBobApi } from '../services/bobApiService')
- Function calls across files (e.g., routes calling service functions)
- Component usage in React/JSX files
- Module exports and imports

Expected JSON structure (DEPENDENCY TREE FORMAT):
{
  "files": [
    {
      "name": "src/routes/analyze.ts",
      "functions": [
        {
          "name": "analyzeRoute",
          "line": 10,
          "calls": [
            {
              "file": "src/services/bobApiService.ts",
              "function": "analyzeWithBobApi",
              "description": "Calls AI service to analyze repository"
            },
            {
              "file": "src/services/gitService.ts",
              "function": "cloneRepository",
              "description": "Clones the repository for analysis"
            }
          ]
        }
      ]
    }
  ]
}

Analysis target: Repository with ${files.length} files (${fileList})

File contents (first 500 chars):
${files.map(f => `\n--- ${f.path} ---\n${f.content.substring(0, 500)}`).join('\n')}`;
}

/**
 * Checks if watsonx.ai is available
 */
export async function checkApiHealth(): Promise<boolean> {
  const apiKey = process.env.IBM_CLOUD_API_KEY;
  if (!apiKey) {
    logger.warn('IBM Cloud API key not configured');
    return false;
  }

  try {
    await getIBMCloudToken();
    return true;
  } catch (error) {
    logger.warn('watsonx.ai health check failed', { error });
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
 * Analyzes repository using watsonx.ai
 * @param files - Array of file contents to analyze
 * @returns Bob API response
 */
export async function analyzeWithBobApi(files: FileContent[]): Promise<BobApiResponse> {
  try {
    const token = await getIBMCloudToken();
    const projectId = process.env.WATSONX_PROJECT_ID;

    if (!projectId) {
      throw new ExternalServiceError('WATSONX_PROJECT_ID not configured');
    }

    // Filter out non-essential files to reduce token count
    const essentialFiles = filterEssentialFiles(files);

    logger.info('Sending analysis request to watsonx.ai', {
      originalFileCount: files.length,
      filteredFileCount: essentialFiles.length
    });

    const prompt = generatePrompt(essentialFiles);
    const apiClient = createApiClient(token);

    const response = await limiter.schedule(() =>
      apiClient.post(`/ml/v1/text/chat?version=2024-05-01`, {
        model_id: WATSONX_MODEL_ID,
        messages: [
          {
            role: 'system',
            content: 'You are a software analysis expert. Return ONLY a plain JSON object. No markdown formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        project_id: projectId,
        parameters: {
          max_new_tokens: 1500,
          temperature: 0.1
        }
      })
    );

    // Log raw response for debugging
    logger.debug('Raw Watsonx Response:', { data: response.data });

    // Support both Chat API (choices) and legacy API (results) formats
    const generatedText = response.data.choices?.[0]?.message?.content ||
                          response.data.results?.[0]?.generated_text ||
                          "";

    if (!generatedText || typeof generatedText !== 'string') {
      throw new ExternalServiceError('watsonx.ai returned empty response');
    }

    // Find the first '{' and last '}' to extract the JSON object
    const firstBrace = generatedText.indexOf('{');
    const lastBrace = generatedText.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      throw new ExternalServiceError('No valid JSON object found in watsonx.ai response');
    }

    // Extract and clean the JSON string
    const cleanedString = generatedText.substring(firstBrace, lastBrace + 1).trim();

    logger.debug('Attempting to parse cleaned JSON string', { length: cleanedString.length });

    let parsed: BobApiResponse;
    try {
      parsed = JSON.parse(cleanedString) as BobApiResponse;
    } catch (parseError) {
      logger.error('JSON parse error', { error: parseError, cleanedString: cleanedString.substring(0, 200) });
      throw new ExternalServiceError('Failed to parse watsonx.ai JSON response');
    }

    apiSuccessCount++;

    logger.info('watsonx.ai analysis successful', {
      statusCode: response.status
    });

    return parsed;
  } catch (error: any) {
    apiFailureCount++;

    logger.error('watsonx.ai request failed', {
      message: error.message,
      watsonxError: error.response?.data,
      fileCount: files.length,
      successRate: getApiSuccessRate()
    });

    try {
      return await loadMockFallback();
    } catch (fallbackError) {
      throw new ExternalServiceError(
        error.response?.data?.message || 'Failed to analyze repository with watsonx.ai'
      );
    }
  }
}

/**
 * Loads mock fallback data
 * Fallback A: API completely inaccessible
 */
export async function loadMockFallback(): Promise<BobApiResponse> {
  try {
    logger.info('Loading mock fallback data');

    // In production (Docker), mocks are at /app/apps/backend/src/mocks/
    // In development, they're relative to the compiled output
    const mockPath = process.env.NODE_ENV === 'production'
      ? path.join('/app/apps/backend/src/mocks/expressAppMock.json')
      : path.join(__dirname, '../mocks/expressAppMock.json');
    
    logger.info('Mock file path', { mockPath, __dirname, NODE_ENV: process.env.NODE_ENV });
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