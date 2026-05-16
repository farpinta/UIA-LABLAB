/**
 * BobInsight Shared Types
 * TypeScript interfaces for Graph Data Contract
 */

/**
 * Represents a file node in the function flow graph
 */
export interface GraphNode {
  /** Unique identifier for the node */
  id: string;
  /** Full file path relative to repository root */
  fileName: string;
  /** List of function names declared in this file */
  functions: string[];
}

/**
 * Represents a function call relationship between files
 */
export interface GraphEdge {
  /** Unique identifier for the edge */
  id: string;
  /** Source file path */
  sourceFile: string;
  /** Source function name */
  sourceFunction: string;
  /** Target file path */
  targetFile: string;
  /** Target function name */
  targetFunction: string;
  /** Human-readable description of the relationship */
  description: string;
}

/**
 * Complete graph data structure
 */
export interface GraphData {
  /** Array of file nodes */
  nodes: GraphNode[];
  /** Array of function call edges */
  edges: GraphEdge[];
}

/**
 * Request payload for repository analysis
 */
export interface AnalyzeRequest {
  /** GitHub repository URL to analyze */
  repoUrl: string;
}

/**
 * Response from analysis endpoint
 */
export interface AnalyzeResponse {
  /** Whether the analysis was successful */
  success: boolean;
  /** Graph data if successful */
  data?: GraphData;
  /** Error message if failed */
  error?: string;
  /** Source of the data (for debugging/monitoring) */
  source: 'ibm-bob' | 'fallback-mock' | 'fallback-cache' | 'fallback-ast';
  /** Timestamp of analysis */
  timestamp?: string;
}

/**
 * Health check response
 */
export interface HealthResponse {
  /** Overall status */
  status: 'ok' | 'degraded' | 'error';
  /** Timestamp of health check */
  timestamp: string;
  /** Status of individual services */
  services?: {
    api: 'healthy' | 'unhealthy';
    cache: 'healthy' | 'unhealthy';
  };
}

/**
 * File content structure for processing
 */
export interface FileContent {
  /** File path relative to repository root */
  path: string;
  /** File content as string */
  content: string;
  /** File extension */
  extension: string;
}

/**
 * IBM Bob API response structure (raw format)
 */
export interface BobApiResponse {
  files: Array<{
    name: string;
    functions: Array<{
      name: string;
      line?: number;
      calls: Array<{
        file: string;
        function: string;
        description?: string;
      }>;
    }>;
  }>;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  success: false;
  error: string;
  statusCode: number;
  timestamp: string;
}
