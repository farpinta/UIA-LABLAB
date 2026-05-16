/**
 * Function Inspector Component
 * Side panel showing details of selected node or edge
 */

import { GraphNode, GraphEdge } from '@bobinsight/shared-types';

interface FunctionInspectorProps {
  selectedNode: GraphNode | null;
  selectedEdge: GraphEdge | null;
  onClose: () => void;
}

export function FunctionInspector({ selectedNode, selectedEdge, onClose }: FunctionInspectorProps) {
  if (!selectedNode && !selectedEdge) {
    return null;
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl overflow-y-auto z-50">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">
          {selectedNode ? 'File Details' : 'Function Call'}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close inspector"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-6 space-y-6">
        {selectedNode && (
          <>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">File Path</h3>
              <p className="text-gray-900 font-mono text-sm bg-gray-50 p-3 rounded">
                {selectedNode.fileName}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Functions ({selectedNode.functions.length})
              </h3>
              <div className="space-y-2">
                {selectedNode.functions.map((func, index) => (
                  <div
                    key={index}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                  >
                    <code className="text-blue-900 font-mono text-sm">{func}</code>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {selectedEdge && (
          <>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Source</h3>
              <div className="bg-gray-50 p-3 rounded space-y-1">
                <p className="text-xs text-gray-600">File:</p>
                <p className="text-gray-900 font-mono text-sm">{selectedEdge.sourceFile}</p>
                <p className="text-xs text-gray-600 mt-2">Function:</p>
                <code className="text-blue-900 font-mono text-sm">{selectedEdge.sourceFunction}</code>
              </div>
            </div>

            <div className="flex justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Target</h3>
              <div className="bg-gray-50 p-3 rounded space-y-1">
                <p className="text-xs text-gray-600">File:</p>
                <p className="text-gray-900 font-mono text-sm">{selectedEdge.targetFile}</p>
                <p className="text-xs text-gray-600 mt-2">Function:</p>
                <code className="text-blue-900 font-mono text-sm">{selectedEdge.targetFunction}</code>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Description</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded">
                {selectedEdge.description}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
