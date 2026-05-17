/**
 * API Client Service
 * Handles HTTP requests to the backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { AnalyzeRequest, AnalyzeResponse, HealthResponse } from '@bobinsight/shared-types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Creates configured axios instance
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 120 seconds (2 minutes) for large repos
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Request interceptor for logging
 */
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for error handling
 */
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status} from ${response.config.url}`);
    return response;
  },
  (error: AxiosError) => {
    console.error('[API] Response error:', error.message);
    
    if (error.response) {
      // Server responded with error status
      console.error('[API] Error response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // Request made but no response - possible CORS or network issue
      console.error('[API] No response received - possible CORS or network issue');
      console.error('[API] Request details:', {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      });
    } else {
      console.error('[API] Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Analyzes a GitHub repository
 * @param repoUrl - GitHub repository URL
 * @returns Analysis response with graph data
 */
export async function analyzeRepository(repoUrl: string): Promise<AnalyzeResponse> {
  try {
    const request: AnalyzeRequest = { repoUrl };
    const response = await apiClient.post<AnalyzeResponse>('/api/analyze', request);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorMessage = error.response.data.error || 'Failed to analyze repository';
      
      // Check for rate limit error
      if (errorMessage.includes('rate limit') || errorMessage.includes('RATE_LIMIT')) {
        throw new Error('⏱️ API Rate Limit Exceeded - The IBM Watson API key has reached its usage limit. Please try again later or the system will use cached/mock data.');
      }
      
      throw new Error(errorMessage);
    }
    throw new Error('Network error. Please check your connection and try again.');
  }
}

/**
 * Checks backend health status
 * @returns Health response
 */
export async function checkHealth(): Promise<HealthResponse> {
  try {
    const response = await apiClient.get<HealthResponse>('/health');
    return response.data;
  } catch (error) {
    throw new Error('Failed to check backend health');
  }
}

export default apiClient;
