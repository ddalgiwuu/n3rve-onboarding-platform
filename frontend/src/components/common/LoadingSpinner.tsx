import { cn } from '@/utils/cn'

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
  }

  const spinner = (
    <div className={cn('relative animate-fade-in', sizeClasses[size], className)}>
      <div className="absolute inset-0 rounded-full border-2 border-purple-200/30 dark:border-purple-700/30" />
      <div className="absolute inset-0 rounded-full border-2 border-purple-600 border-t-transparent animate-spin shadow-lg shadow-purple-500/20" />
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 glass-effect-strong backdrop-blur-xl flex items-center justify-center z-50 animate-fade-in">
        {spinner}
      </div>
    )
  }

  return spinner
}