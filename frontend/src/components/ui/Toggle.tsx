import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const Toggle = forwardRef<HTMLDivElement, ToggleProps>(
  ({ checked, onChange, label, description, disabled = false, className, size = 'md' }, ref) => {
    const sizes = {
      sm: {
        container: 'h-5 w-9',
        thumb: 'h-4 w-4',
        translate: 'translate-x-4'
      },
      md: {
        container: 'h-6 w-11',
        thumb: 'h-5 w-5',
        translate: 'translate-x-5'
      },
      lg: {
        container: 'h-7 w-14',
        thumb: 'h-6 w-6',
        translate: 'translate-x-7'
      }
    }

    const currentSize = sizes[size]

    return (
      <div ref={ref} className={cn("flex items-center gap-3", className)}>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={cn(
            "relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2",
            currentSize.container,
            {
              'bg-purple-600': checked && !disabled,
              'bg-gray-300 dark:bg-gray-600': !checked && !disabled,
              'bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-50': disabled
            }
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none inline-block rounded-full bg-white shadow-lg transform ring-0 transition duration-200 ease-in-out",
              currentSize.thumb,
              {
                [currentSize.translate]: checked,
                'translate-x-0': !checked
              }
            )}
          />
        </button>
        
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                className={cn(
                  "text-sm font-medium",
                  {
                    'text-gray-900 dark:text-white': !disabled,
                    'text-gray-500 dark:text-gray-400': disabled
                  }
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {description}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }
)

Toggle.displayName = 'Toggle'

export default Toggle