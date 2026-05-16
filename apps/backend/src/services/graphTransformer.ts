/**
 * Graph Transformer Service
 * Transforms IBM Bob API response to frontend-compatible graph format
 */

import { BobApiResponse, GraphData, GraphNode, GraphEdge } from '@bobinsight/shared-types';
import { logger } from '../utils/logger';

/**
 * Generates a unique ID for a node
 */
function generateNodeId(fileName: string): string {
  return `node_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

/**
 * Generates a unique ID for an edge
 */
function generateEdgeId(
  sourceFile: string,
  sourceFunction: string,
  targetFile: string,
  targetFunction: string
): string {
  const combined = `${sourceFile}_${sourceFunction}_${targetFile}_${targetFunction}`;
  return `edge_${combined.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

/**
 * Transforms IBM Bob API response to GraphData format
 * @param bobResponse - Raw response from IBM Bob API
 * @returns Transformed graph data
 */
export function transformToGraphData(bobResponse: BobApiResponse): GraphData {
  try {
    logger.info('Transforming Bob API response to graph data');

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeMap = new Map<string, GraphNode>();

    // First pass: Create nodes
    bobResponse.files.forEach((file) => {
      const nodeId = generateNodeId(file.name);
      const functionNames = file.functions.map(f => f.name);

      const node: GraphNode = {
        id: nodeId,
        fileName: file.name,
        functions: functionNames
      };

      nodes.push(node);
      nodeMap.set(file.name, node);
    });

    // Second pass: Create edges from function calls
    bobResponse.files.forEach((file) => {
      file.functions.forEach((func) => {
        if (func.calls && func.calls.length > 0) {
          func.calls.forEach((call) => {
            const edgeId = generateEdgeId(
              file.name,
              func.name,
              call.file,
              call.function
            );

            const edge: GraphEdge = {
              id: edgeId,
              sourceFile: file.name,
              sourceFunction: func.name,
              targetFile: call.file,
              targetFunction: call.function,
              description: call.description || `${func.name} calls ${call.function}`
            };

            edges.push(edge);
          });
        }
      });
    });

    // Remove duplicate edges (same source/target combination)
    const uniqueEdges = edges.filter((edge, index, self) =>
      index === self.findIndex((e) =>
        e.sourceFile === edge.sourceFile &&
        e.sourceFunction === edge.sourceFunction &&
        e.targetFile === edge.targetFile &&
        e.targetFunction === edge.targetFunction
      )
    );

    const graphData: GraphData = {
      nodes,
      edges: uniqueEdges
    };

    logger.info('Graph data transformation complete', {
      nodeCount: nodes.length,
      edgeCount: uniqueEdges.length
    });

    return graphData;
  } catch (error) {
    logger.error('Failed to transform graph data', error);
    throw new Error('Failed to transform API response to graph format');
  }
}

/**
 * Validates graph data structure
 * @param graphData - Graph data to validate
 * @returns true if valid, false otherwise
 */
export function validateGraphData(graphData: GraphData): boolean {
  try {
    // Check basic structure
    if (!graphData.nodes || !Array.isArray(graphData.nodes)) {
      logger.warn('Invalid graph data: nodes is not an array');
      return false;
    }

    if (!graphData.edges || !Array.isArray(graphData.edges)) {
      logger.warn('Invalid graph data: edges is not an array');
      return false;
    }

    // Validate nodes
    for (const node of graphData.nodes) {
      if (!node.id || !node.fileName || !Array.isArray(node.functions)) {
        logger.warn('Invalid node structure', { node });
        return false;
      }
    }

    // Validate edges
    const nodeFileNames = new Set(graphData.nodes.map(n => n.fileName));
    
    for (const edge of graphData.edges) {
      if (!edge.id || !edge.sourceFile || !edge.sourceFunction ||
          !edge.targetFile || !edge.targetFunction) {
        logger.warn('Invalid edge structure', { edge });
        return false;
      }

      // Check if referenced files exist in nodes
      if (!nodeFileNames.has(edge.sourceFile)) {
        logger.warn('Edge references non-existent source file', {
          edge,
          sourceFile: edge.sourceFile
        });
        // Don't fail validation, just warn
      }

      if (!nodeFileNames.has(edge.targetFile)) {
        logger.warn('Edge references non-existent target file', {
          edge,
          targetFile: edge.targetFile
        });
        // Don't fail validation, just warn
      }
    }

    return true;
  } catch (error) {
    logger.error('Error validating graph data', error);
    return false;
  }
}

/**
 * Enriches graph data with additional metadata
 * @param graphData - Graph data to enrich
 * @returns Enriched graph data
 */
export function enrichGraphData(graphData: GraphData): GraphData {
  // Add statistics to nodes
  const incomingEdges = new Map<string, number>();
  const outgoingEdges = new Map<string, number>();

  graphData.edges.forEach(edge => {
    // Count incoming edges
    const targetKey = `${edge.targetFile}:${edge.targetFunction}`;
    incomingEdges.set(targetKey, (incomingEdges.get(targetKey) || 0) + 1);

    // Count outgoing edges
    const sourceKey = `${edge.sourceFile}:${edge.sourceFunction}`;
    outgoingEdges.set(sourceKey, (outgoingEdges.get(sourceKey) || 0) + 1);
  });

  // Could add more enrichment here (e.g., complexity scores, centrality metrics)

  return graphData;
}
