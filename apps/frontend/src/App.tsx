/**
 * Main App Component
 * BobInsight - Interactive Function Flow Mapper
 */

import { useCallback } from 'react';
import { RepoInput } from './components/RepoInput';
import { LoadingState } from './components/LoadingState';
import { GraphVisualization } from './components/GraphVisualization';
import { FunctionInspector } from './components/FunctionInspector';
import { useGraphStore } from './hooks/useGraphStore';
import { analyzeRepository } from './services/apiClient';

function App() {
  const {
    graphData,
    loading,
    error,
    selectedNode,
    selectedEdge,
    repoUrl,
    analysisSource,
    setGraphData,
    setLoading,
    setError,
    setRepoUrl,
    selectNode,
    selectEdge,
    reset,
  } = useGraphStore();

  const handleAnalyze = useCallback(async (url: string) => {
    setRepoUrl(url);
    setLoading(true);
    setError(null);

    console.log("🚀 [DEBUG] Loading Started!");
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      const response = await analyzeRepository(url);

      if (response.success && response.data) {
        setGraphData(response.data, response.source);
      } else {
        setError(response.error || 'Analysis failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze repository');
    } finally {
      setLoading(false);
    }
  }, [setRepoUrl, setLoading, setError, setGraphData]);

  const handleReset = () => {
    reset();
  };

  const handleCloseInspector = () => {
    selectNode(null);
    selectEdge(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">BobInsight</h1>
                <p className="text-sm text-gray-600">Interactive Function Flow Mapper</p>
              </div>
            </div>
            {graphData && (
              <button
                onClick={handleReset}
                className="btn btn-secondary"
              >
                New Analysis
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!graphData && (
          <RepoInput onSubmit={handleAnalyze} loading={loading} />
        )}

        {loading && <LoadingState />}

        {error && (
          <div className="card max-w-2xl mx-auto bg-red-50 border border-red-200">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-1">Analysis Failed</h3>
                <p className="text-red-700">{error}</p>
                <button
                  onClick={handleReset}
                  className="mt-4 btn btn-secondary text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {graphData && (
          <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-blue-900">
                    <strong>Repository:</strong> {repoUrl}
                  </p>
                  <p className="text-sm text-blue-900 mt-1">
                    <strong>Nodes:</strong> {graphData.nodes.length} files | 
                    <strong className="ml-2">Edges:</strong> {graphData.edges.length} function calls |
                    <strong className="ml-2">Source:</strong> {analysisSource}
                  </p>
                  <p className="text-xs text-blue-700 mt-2">
                    Click on nodes to see file details, or click on edges to see function call relationships
                  </p>
                </div>
              </div>
            </div>

            {/* Graph Visualization */}
            <GraphVisualization data={graphData} />
          </div>
        )}
      </main>

      {/* Function Inspector Panel */}
      <FunctionInspector
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        onClose={handleCloseInspector}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            Built for IBM Bob Hackathon 2026 | Powered by IBM Bob API
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
