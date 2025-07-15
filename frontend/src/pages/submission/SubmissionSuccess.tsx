import { CheckCircle, Music, Disc, Upload, Calendar, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { t, useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'

export default function SubmissionSuccess() {
  const navigate = useNavigate()
  const language = useSafeStore(useLanguageStore, (state) => state.language)

  const steps = [
    { id: 1, icon: Disc, title: t('onboarding.step2').split(' ')[0], description: t('onboarding.step2') },
    { id: 2, icon: Music, title: t('onboarding.step3').split(' ')[0], description: t('onboarding.step3') },
    { id: 3, icon: Upload, title: t('onboarding.step4').split(' ')[0], description: t('onboarding.step4') },
    { id: 4, icon: Calendar, title: t('onboarding.step5').split(' ')[0], description: t('onboarding.step5') },
    { id: 5, icon: Shield, title: t('onboarding.step6').split(' ')[0], description: t('onboarding.step6') }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-n3rve-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {t('onboarding.submitSuccess')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t('submission.success.reviewNotice')}
          </p>
        </div>

        {/* Steps Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {language === 'ko' ? '제출 완료 항목' : 'Submitted Items'}
          </h2>
          
          <div className="space-y-4">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.id} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <Icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {step.id}. {step.title}
                      </span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3 bg-n3rve-main text-white rounded-lg hover:bg-n3rve-700 transition-colors font-medium"
          >
            {language === 'ko' ? '대시보드로 이동' : 'Go to Dashboard'}
          </button>
          <button
            onClick={() => navigate('/onboarding')}
            className="px-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            {language === 'ko' ? '새 음원 등록' : 'Register New Release'}
          </button>
        </div>
      </div>
    </div>
  )
}