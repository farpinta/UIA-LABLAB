interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Bob is analyzing your repository...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-gray-700 flex items-center justify-center">
          {message}
          <span className="flex ml-1">
            <span className="animate-pulse-dot" style={{ animationDelay: '0ms' }}>.</span>
            <span className="animate-pulse-dot" style={{ animationDelay: '200ms' }}>.</span>
            <span className="animate-pulse-dot" style={{ animationDelay: '400ms' }}>.</span>
          </span>
        </p>
        <p className="text-sm text-gray-500">This may take a few moments...</p>
      </div>

      <div className="max-w-md space-y-2 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Cloning repository</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-100"></div>
          <span>Extracting files</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-200"></div>
          <span>Analyzing function calls</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-300"></div>
          <span>Building graph</span>
        </div>
      </div>
      <h3 className="mt-8 text-xl font-bold text-gray-900">{message}</h3>
      <p className="mt-3 text-sm text-gray-500 max-w-md text-center leading-relaxed">
        Extracting files, mapping function calls, and building the dependency graph.
      </p>
      <div className="mt-8 flex space-x-2">
        <div className="w-3 h-3 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}