import { cloneElement, ReactElement, ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Check } from 'lucide-react';

interface Step {
  id: string
  title: string
  description: string
  icon: ReactNode
  isCompleted?: boolean
  isActive?: boolean
}

interface ProgressStepsProps {
  steps: Step[]
  currentStep: string
  onStepClick?: (stepId: string) => void
  className?: string
}

export default function ProgressSteps({
  steps,
  currentStep,
  onStepClick,
  className
}: ProgressStepsProps) {
  const currentIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop Progress Bar */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isActive = step.id === currentStep;
            const isClickable = onStepClick && (isCompleted || isActive);

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => isClickable && onStepClick(step.id)}
                    disabled={!isClickable}
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative',
                      'border-2 focus:outline-none focus:ring-4 focus:ring-blue-500/20',
                      isCompleted && 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30',
                      isActive && !isCompleted && 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/30 scale-110',
                      !isCompleted && !isActive && 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400',
                      isClickable && 'hover:scale-105 cursor-pointer',
                      !isClickable && 'cursor-not-allowed'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      cloneElement(step.icon as ReactElement<any>, {
                        className: 'w-5 h-5'
                      })
                    )}

                    {isActive && (
                      <div className="absolute -inset-1 bg-blue-500/20 rounded-full animate-pulse"></div>
                    )}
                  </button>

                  <div className="mt-3 text-center">
                    <div className={cn(
                      'text-sm font-medium transition-colors',
                      isActive && 'text-blue-600 dark:text-blue-400',
                      isCompleted && 'text-green-600 dark:text-green-400',
                      !isCompleted && !isActive && 'text-gray-500 dark:text-gray-400'
                    )}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-24">
                      {step.description}
                    </div>
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 mx-4 transition-all duration-500',
                    index < currentIndex ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Progress Bar */}
      <div className="md:hidden">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              진행률
            </span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {currentIndex + 1} / {steps.length}
            </span>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
            ></div>
          </div>

          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
            )}>
              {cloneElement(steps[currentIndex].icon as ReactElement<any>, {
                className: 'w-5 h-5'
              })}
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {steps[currentIndex].title}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {steps[currentIndex].description}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
