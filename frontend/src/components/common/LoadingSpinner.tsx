import { cn } from '@/utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
  className?: string
}

export default function LoadingSpinner({
  size = 'md',
  fullScreen = false,
  className
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const spinner = (
    <div className={cn('relative animate-fade-in', sizeClasses[size], className)}>
      <div className="absolute inset-0 rounded-full border-2 border-purple-200/30 dark:border-purple-700/30" />
      <div className="absolute inset-0 rounded-full border-2 border-purple-600 border-t-transparent animate-spin shadow-lg shadow-purple-500/20" />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 glass-effect-strong backdrop-blur-xl flex items-center justify-center z-50 animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              N3RVE Platform
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              공식 음원 유통 플랫폼
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              잠시만 기다려주세요...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return spinner;
}
