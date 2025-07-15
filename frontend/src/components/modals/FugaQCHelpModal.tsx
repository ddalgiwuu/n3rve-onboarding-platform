import { useState } from 'react'
import { X, ChevronRight, CheckCircle, AlertCircle, Info, Clock, FileText, Music, HelpCircle } from 'lucide-react'
import { fugaQCHelp, qcFAQ } from '@/constants/fugaQCHelp'
// import { useLanguageStore } from '@/store/language.store' // Reserved for future use
// import useSafeStore from '@/hooks/useSafeStore' // Reserved for future use

interface FugaQCHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function FugaQCHelpModal({ isOpen, onClose }: FugaQCHelpModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'process' | 'errors' | 'specs' | 'faq'>('overview')
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

  if (!isOpen) return null

  const tabs = [
    { id: 'overview', label: '개요', icon: FileText },
    { id: 'process', label: '프로세스', icon: Clock },
    { id: 'errors', label: '일반 오류', icon: AlertCircle },
    { id: 'specs', label: '파일 규격', icon: Music },
    { id: 'faq', label: 'FAQ', icon: HelpCircle }
  ]

  const renderOverview = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">{fugaQCHelp.overview.title}</h3>
        <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{fugaQCHelp.overview.description}</p>
      </div>
      
      <div>
        <h4 className="font-medium mb-2">중요성</h4>
        <ul className="space-y-2">
          {fugaQCHelp.overview.importance.map((item: any, index: number) => (
            <li key={index} className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )

  const renderProcess = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">{fugaQCHelp.process.title}</h3>
      
      {fugaQCHelp.process.steps.map((step: any) => (
        <div key={step.step} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              {step.step}
            </div>
            <div className="flex-1">
              <h4 className="font-medium mb-1">{step.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{step.description}</p>
              <ul className="space-y-1">
                {step.items.map((item: any, index: number) => (
                  <li key={index} className="text-sm text-gray-500 dark:text-gray-500 flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}

      <div className="mt-6">
        <h4 className="font-medium mb-3">{fugaQCHelp.timeline.title}</h4>
        <div className="space-y-3">
          {fugaQCHelp.timeline.stages.map((stage: any, index: number) => (
            <div key={index} className="flex items-center gap-4">
              <div className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium min-w-[100px] text-center">
                {stage.time}
              </div>
              <div>
                <div className="font-medium text-sm">{stage.stage}</div>
                <div className="text-xs text-gray-500">{stage.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderErrors = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">{fugaQCHelp.commonErrors.title}</h3>
      
      {fugaQCHelp.commonErrors.errors.map((error: any, index: number) => (
        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-medium mb-3 text-red-600 dark:text-red-400">{error.type}</h4>
          <div className="space-y-2">
            {error.examples.map((example: any, idx: number) => (
              <div key={idx} className="text-sm font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded">
                {example}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-8">
        <h4 className="font-medium mb-4">언어별 표기 규칙</h4>
        <div className="space-y-4">
          <div>
            <h5 className="font-medium text-sm mb-2">{fugaQCHelp.languageRules.english.title}</h5>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {fugaQCHelp.languageRules.english.rules.map((rule: any, index: number) => (
                <li key={index}>• {rule}</li>
              ))}
            </ul>
            {fugaQCHelp.languageRules.english.examples && (
              <div className="mt-2 space-y-1">
                {fugaQCHelp.languageRules.english.examples.map((example: any, idx: number) => (
                  <div key={idx} className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-1 rounded">
                    {example}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h5 className="font-medium text-sm mb-2">{fugaQCHelp.languageRules.korean.title}</h5>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {fugaQCHelp.languageRules.korean.rules.map((rule: any, index: number) => (
                <li key={index}>• {rule}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSpecs = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">{fugaQCHelp.audioSpecs.title}</h3>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="font-medium mb-3">필수 사양</h4>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600 dark:text-gray-400">포맷:</dt>
              <dd className="text-sm font-medium">{fugaQCHelp.audioSpecs.required.format}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600 dark:text-gray-400">비트 뎁스:</dt>
              <dd className="text-sm font-medium">{fugaQCHelp.audioSpecs.required.bitDepth}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600 dark:text-gray-400">샘플레이트:</dt>
              <dd className="text-sm font-medium">{fugaQCHelp.audioSpecs.required.sampleRate}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600 dark:text-gray-400">채널:</dt>
              <dd className="text-sm font-medium">{fugaQCHelp.audioSpecs.required.channels}</dd>
            </div>
          </dl>
        </div>

        {fugaQCHelp.audioSpecs.dolbyAtmos && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="font-medium mb-3">{fugaQCHelp.audioSpecs.dolbyAtmos.title}</h4>
            <ul className="space-y-1">
              {fugaQCHelp.audioSpecs.dolbyAtmos.requirements.map((req: any, index: number) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">{fugaQCHelp.albumArt.title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h4 className="font-medium mb-3 text-green-700 dark:text-green-400">필수 규격</h4>
            <ul className="space-y-1">
              {fugaQCHelp.albumArt.requirements.map((req: any, index: number) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400">• {req}</li>
              ))}
            </ul>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <h4 className="font-medium mb-3 text-red-700 dark:text-red-400">금지 사항</h4>
            <ul className="space-y-1">
              {fugaQCHelp.albumArt.forbidden.map((item: any, index: number) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400">• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  const renderFAQ = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">자주 묻는 질문</h3>
      
      {qcFAQ.map((faq, index) => (
        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="font-medium text-sm">{faq.question}</span>
            <ChevronRight 
              className={`w-4 h-4 text-gray-400 transition-transform ${
                expandedFAQ === index ? 'rotate-90' : ''
              }`}
            />
          </button>
          {expandedFAQ === index && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">{faq.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'process':
        return renderProcess()
      case 'errors':
        return renderErrors()
      case 'specs':
        return renderSpecs()
      case 'faq':
        return renderFAQ()
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">FUGA QC 가이드</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {tabs.map((tab: any) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>

        {/* Tips */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm mb-1">Pro Tips</h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                {fugaQCHelp.tips.items.slice(0, 3).map((tip: any, index: number) => (
                  <li key={index}>• {tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}