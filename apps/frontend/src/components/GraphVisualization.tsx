/**
 * Graph Visualization Component
 * React Flow graph for displaying function dependencies
 */

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { GraphData, GraphNode as GraphNodeType } from '@bobinsight/shared-types';
import { useGraphStore } from '../hooks/useGraphStore';

interface GraphVisualizationProps {
  data: GraphData;
}

export function GraphVisualization({ data }: GraphVisualizationProps) {
  const { selectNode, selectEdge } = useGraphStore();

  // Transform GraphData to React Flow format
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = data.nodes.map((node, index) => ({
      id: node.id,
      type: 'default',
      data: { 
        label: (
          <div className="px-3 py-2">
            <div className="font-semibold text-sm mb-1">{node.fileName}</div>
            <div className="text-xs text-gray-600">
              {node.functions.length} function{node.functions.length !== 1 ? 's' : ''}
            </div>
          </div>
        ),
        node 
      },
      position: { x: (index % 3) * 250, y: Math.floor(index / 3) * 150 },
      style: {
        background: '#fff',
        border: '2px solid #3b82f6',
        borderRadius: '8px',
        padding: '0',
        minWidth: '200px',
      },
    }));

    const edges: Edge[] = data.edges.map((edge) => ({
      id: edge.id,
      source: data.nodes.find(n => n.fileName === edge.sourceFile)?.id || '',
      target: data.nodes.find(n => n.fileName === edge.targetFile)?.id || '',
      label: `${edge.sourceFunction} → ${edge.targetFunction}`,
      type: ConnectionLineType.SmoothStep,
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#3b82f6',
      },
      data: { edge },
    }));

    return { initialNodes: nodes, initialEdges: edges };
  }, [data]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.data.node as GraphNodeType);
    },
    [selectNode]
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      selectEdge(edge.data.edge);
    },
    [selectEdge]
  );

  return (
    <div className="w-full h-[600px] bg-white rounded-lg shadow-md overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap 
          nodeColor="#3b82f6"
          maskColor="rgba(0, 0, 0, 0.1)"
          position="bottom-right"
        />
      </ReactFlow>
    </div>
  );
}
