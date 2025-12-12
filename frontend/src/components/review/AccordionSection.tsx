import React, { useState } from 'react'
import { ChevronDown, Edit2 } from 'lucide-react'

interface AccordionSectionProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  onEdit?: () => void
  defaultOpen?: boolean
  children: React.ReactNode
}

export const AccordionSection: React.FC<AccordionSectionProps> = ({
  icon: Icon,
  title,
  onEdit,
  defaultOpen = true,
  children
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-purple-500/20 overflow-hidden">
      <div className="w-full px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
        >
          <Icon className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </button>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4 text-purple-400" />
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isOpen ? 'transform rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="px-6 pb-6 pt-2">
          {children}
        </div>
      )}
    </div>
  )
}
