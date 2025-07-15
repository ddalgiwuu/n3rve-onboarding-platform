import { useState } from 'react'
import { Menu, X, Check } from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'

interface MobileFormNavProps {
  sections: Array<{
    id: string
    title: { ko: string; en: string }
    icon: string
  }>
  currentSection: number
  completedSections: number[]
  onSectionChange: (index: number) => void
}

export default function MobileFormNav({ 
  sections, 
  currentSection, 
  completedSections, 
  onSectionChange 
}: MobileFormNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const language = useSafeStore(useLanguageStore, (state) => state.language)

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-700 transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-50 md:hidden transition-opacity ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />

        {/* Sidebar */}
        <div className={`absolute right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl transform transition-transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-semibold">
                {language === 'ko' ? '섹션 내비게이션' : 'Section Navigation'}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {sections.map((section, idx) => {
                const isCompleted = completedSections.includes(idx)
                const isCurrent = idx === currentSection
                const isAccessible = idx <= Math.max(...completedSections, currentSection)

                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      if (isAccessible) {
                        onSectionChange(idx)
                        setIsOpen(false)
                      }
                    }}
                    disabled={!isAccessible}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                      isCurrent
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : isCompleted
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30'
                        : isAccessible
                        ? 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      {isCompleted ? <Check className="w-5 h-5" /> : section.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {section.title[language as 'ko' | 'en']}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isCompleted 
                          ? (language === 'ko' ? '완료됨' : 'Completed')
                          : isCurrent
                          ? (language === 'ko' ? '진행 중' : 'In Progress')
                          : (language === 'ko' ? '대기 중' : 'Pending')
                        }
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Progress Summary */}
            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {language === 'ko' ? '전체 진행률' : 'Overall Progress'}
                </span>
                <span className="text-sm font-bold text-purple-600">
                  {Math.round((completedSections.length / sections.length) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-600 transition-all duration-300"
                  style={{ width: `${(completedSections.length / sections.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}