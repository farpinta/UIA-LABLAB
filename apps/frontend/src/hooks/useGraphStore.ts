import { create } from 'zustand';
import { GraphData, GraphNode, GraphEdge } from '@bobinsight/shared-types';

interface GraphState {
  graphData: GraphData | null;
  loading: boolean;
  error: string | null;
  repoUrl: string;
  analysisSource: string | null;
  selectedNode: GraphNode | null;
  selectedEdge: GraphEdge | null;

  setGraphData: (data: GraphData, source?: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRepoUrl: (url: string) => void;
  selectNode: (node: GraphNode | null) => void;
  selectEdge: (edge: GraphEdge | null) => void;
  reset: () => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  // ค่าเริ่มต้น (Initial State)
  graphData: null,
  loading: false,
  error: null,
  repoUrl: '',
  analysisSource: null,
  selectedNode: null,
  selectedEdge: null,

  // ฟังก์ชันอัปเดต State (ใช้ set() เพื่อกระตุ้น React เสมอ)
  setGraphData: (data, source = 'api') => set({ graphData: data, analysisSource: source }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setRepoUrl: (url) => set({ repoUrl: url }),
  selectNode: (node) => set({ selectedNode: node }),
  selectEdge: (edge) => set({ selectedEdge: edge }),
  
  // รีเซ็ตค่าทั้งหมดกลับเป็นเหมือนตอนเปิดเว็บใหม่
  reset: () => set({
    graphData: null,
    loading: false,
    error: null,
    repoUrl: '',
    analysisSource: null,
    selectedNode: null,
    selectedEdge: null,
  }),
}));