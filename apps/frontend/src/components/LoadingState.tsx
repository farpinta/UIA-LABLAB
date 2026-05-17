interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Bob is analyzing your repository...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 bg-white rounded-xl shadow-sm border border-gray-100 mt-6">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-primary-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-primary-600 rounded-full animate-pulse shadow-lg shadow-primary-200"></div>
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