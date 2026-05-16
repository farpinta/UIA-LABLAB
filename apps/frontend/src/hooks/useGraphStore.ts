/**
 * Graph Store
 * Zustand store for managing graph state
 */

import { create } from 'zustand';
import { GraphData, GraphNode, GraphEdge } from '@bobinsight/shared-types';

interface GraphStore {
  // State
  graphData: GraphData | null;
  loading: boolean;
  error: string | null;
  selectedNode: GraphNode | null;
  selectedEdge: GraphEdge | null;
  repoUrl: string;
  analysisSource: string | null;

  // Actions
  setGraphData: (data: GraphData, source: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  selectNode: (node: GraphNode | null) => void;
  selectEdge: (edge: GraphEdge | null) => void;
  setRepoUrl: (url: string) => void;
  reset: () => void;
}

const initialState = {
  graphData: null,
  loading: false,
  error: null,
  selectedNode: null,
  selectedEdge: null,
  repoUrl: '',
  analysisSource: null
};

export const useGraphStore = create<GraphStore>((set) => ({
  ...initialState,

  setGraphData: (data, source) => set({ 
    graphData: data, 
    analysisSource: source,
    error: null 
  }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ 
    error, 
    loading: false 
  }),

  selectNode: (node) => set({ 
    selectedNode: node,
    selectedEdge: null 
  }),

  selectEdge: (edge) => set({ 
    selectedEdge: edge,
    selectedNode: null 
  }),

  setRepoUrl: (url) => set({ repoUrl: url }),

  reset: () => set(initialState)
}));
