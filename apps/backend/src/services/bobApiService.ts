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
const REQUEST_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 3;
const WATSONX_VERSION = '2023-05-29';
const WATSONX_MODEL_ID = 'ibm/granite-13b-instruct-v2';

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

  const params = new URLSearchParams({
    grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
    apikey: apiKey
  });

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
}

/**
 * Generates the prompt for watsonx.ai
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

    logger.info('Sending analysis request to watsonx.ai', {
      fileCount: files.length
    });

    const prompt = generatePrompt(files);
    const apiClient = createApiClient(token);

    const response = await limiter.schedule(() =>
      apiClient.post(`/ml/v1/text/generation?version=${WATSONX_VERSION}`, {
        model_id: WATSONX_MODEL_ID,
        input: prompt,
        project_id: projectId,
        parameters: {
          decoding_method: 'greedy',
          max_new_tokens: 1200,
          temperature: 0.2
        }
      })
    );

    const generatedText = response.data?.results?.[0]?.generated_text;
    if (!generatedText || typeof generatedText !== 'string') {
      throw new ExternalServiceError('watsonx.ai returned empty response');
    }

    const stripped = generatedText
      .replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, '$1')
      .trim();

    let parsed: BobApiResponse;
    try {
      parsed = JSON.parse(stripped) as BobApiResponse;
    } catch (parseError) {
      throw new ExternalServiceError('Failed to parse watsonx.ai JSON response');
    }

    apiSuccessCount++;

    logger.info('watsonx.ai analysis successful', {
      statusCode: response.status
    });

    return parsed;
  } catch (error: any) {
    apiFailureCount++;

    logger.error('watsonx.ai request failed', error, {
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