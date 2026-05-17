/**
 * Repository Input Component
 * Form for entering GitHub repository URL
 */

import { useState } from 'react';

interface RepoInputProps {
  onSubmit: (repoUrl: string) => void;
  loading: boolean;
}

export function RepoInput({ onSubmit, loading }: RepoInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const validateUrl = (url: string): boolean => {
    const githubPattern = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/;
    return githubPattern.test(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    if (!validateUrl(url.trim())) {
      setError('Please enter a valid GitHub URL (e.g., https://github.com/username/repo)');
      return;
    }

    onSubmit(url.trim());
  };

  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Analyze GitHub Repository
      </h2>
      <p className="text-gray-600 mb-6">
        Enter a GitHub repository URL to visualize its function flow and dependencies
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="repo-url" className="block text-sm font-medium text-gray-700 mb-2">
            Repository URL
          </label>
          <input
            id="repo-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/username/repository"
            className="input"
            disabled={loading}
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 relative overflow-hidden"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="flex items-center">
                Analyzing
                <span className="flex ml-1">
                  <span className="animate-pulse-dot" style={{ animationDelay: '0ms' }}>.</span>
                  <span className="animate-pulse-dot" style={{ animationDelay: '200ms' }}>.</span>
                  <span className="animate-pulse-dot" style={{ animationDelay: '400ms' }}>.</span>
                </span>
              </span>
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Analyze Repository
            </span>
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Example Repositories:</h3>
        <div className="space-y-1">
          <button
            onClick={() => setUrl('https://github.com/expressjs/express')}
            className="text-sm text-blue-600 hover:text-blue-800 block"
            disabled={loading}
          >
            expressjs/express
          </button>
          <button
            onClick={() => setUrl('https://github.com/facebook/react')}
            className="text-sm text-blue-600 hover:text-blue-800 block"
            disabled={loading}
          >
            facebook/react
          </button>
          <button
            onClick={() => setUrl('https://github.com/nodejs/node')}
            className="text-sm text-blue-600 hover:text-blue-800 block"
            disabled={loading}
          >
            nodejs/node
          </button>
        </div>
      </div>
    </div>
  );
}
