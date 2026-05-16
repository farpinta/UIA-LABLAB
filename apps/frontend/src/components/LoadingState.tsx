/**
 * Loading State Component
 * Displays loading animation and progress
 */

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Analyzing repository...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-gray-700">{message}</p>
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
    </div>
  );
}
