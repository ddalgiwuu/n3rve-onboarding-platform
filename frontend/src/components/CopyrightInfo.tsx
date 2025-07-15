import { useState } from 'react'
import { Info, HelpCircle, Music, Disc, Calendar } from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'

interface CopyrightInfoProps {
  copyrightData: {
    copyrightHolder: string // ℗
    copyrightYear: string
    productionHolder: string // ©
    productionYear: string
  }
  onChange: (data: {
    copyrightHolder: string
    copyrightYear: string
    productionHolder: string
    productionYear: string
  }) => void
}

export default function CopyrightInfo({ copyrightData, onChange }: CopyrightInfoProps) {
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const [showTooltip, setShowTooltip] = useState<'copyright' | 'production' | null>(null)

  const handleChange = (field: keyof typeof copyrightData, value: string) => {
    onChange({
      ...copyrightData,
      [field]: value
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Disc className="w-5 h-5" />
          {t('저작권 정보', 'Copyright Information')}
        </h3>

        {/* Copyright (℗) Section */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">℗</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium">{t('음반 제작권 (P-line)', 'Recording Rights (P-line)')}</h4>
                <button
                  onMouseEnter={() => setShowTooltip('production')}
                  onMouseLeave={() => setShowTooltip(null)}
                  className="relative"
                >
                  <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  {showTooltip === 'production' && (
                    <div className="absolute left-0 bottom-full mb-2 w-80 p-4 bg-gray-900 text-white rounded-lg shadow-xl z-10">
                      <div className="text-sm space-y-2">
                        <p className="font-medium flex items-center gap-2">
                          <Music className="w-4 h-4" />
                          {t('음반 제작권이란?', 'What is Recording Rights?')}
                        </p>
                        <p className="text-gray-300">
                          {t(
                            '℗는 "Phonogram"의 약자로, 실제 녹음된 소리에 대한 권리를 나타냅니다. 음반을 제작한 회사나 개인이 소유합니다.',
                            '℗ stands for "Phonogram" and represents the rights to the actual recorded sound. It\'s owned by the company or individual who produced the recording.'
                          )}
                        </p>
                        <div className="pt-2 border-t border-gray-700">
                          <p className="font-medium mb-1">{t('예시:', 'Examples:')}</p>
                          <ul className="text-xs space-y-1 text-gray-400">
                            <li>• ℗ 2025 Sony Music Entertainment</li>
                            <li>• ℗ 2025 Universal Music Group</li>
                            <li>• ℗ 2025 {t('아티스트명 (자체 제작)', 'Artist Name (Self-produced)')}</li>
                          </ul>
                        </div>
                      </div>
                      <div className="absolute -bottom-2 left-4 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-gray-900"></div>
                    </div>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('제작권 소유자', 'Production Rights Holder')} *
                  </label>
                  <input
                    type="text"
                    value={copyrightData.productionHolder}
                    onChange={(e) => handleChange('productionHolder', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                    placeholder={t('예: N3RVE Records', 'e.g. N3RVE Records')}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('음반을 제작한 레이블 또는 개인', 'Label or individual who produced the recording')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('제작 연도', 'Production Year')} *
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={copyrightData.productionYear}
                      onChange={(e) => handleChange('productionYear', e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                      placeholder="2025"
                      maxLength={4}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('음반이 처음 제작된 연도', 'Year the recording was first produced')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright (©) Section */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">©</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium">{t('저작권 (C-line)', 'Copyright (C-line)')}</h4>
                <button
                  onMouseEnter={() => setShowTooltip('copyright')}
                  onMouseLeave={() => setShowTooltip(null)}
                  className="relative"
                >
                  <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  {showTooltip === 'copyright' && (
                    <div className="absolute left-0 bottom-full mb-2 w-80 p-4 bg-gray-900 text-white rounded-lg shadow-xl z-10">
                      <div className="text-sm space-y-2">
                        <p className="font-medium flex items-center gap-2">
                          <Disc className="w-4 h-4" />
                          {t('저작권이란?', 'What is Copyright?')}
                        </p>
                        <p className="text-gray-300">
                          {t(
                            '©는 "Copyright"의 약자로, 음악 작품 자체(작곡, 작사)에 대한 권리를 나타냅니다. 작곡가, 작사가 또는 음악 출판사가 소유합니다.',
                            '© stands for "Copyright" and represents the rights to the musical composition itself (music and lyrics). It\'s owned by composers, lyricists, or music publishers.'
                          )}
                        </p>
                        <div className="pt-2 border-t border-gray-700">
                          <p className="font-medium mb-1">{t('예시:', 'Examples:')}</p>
                          <ul className="text-xs space-y-1 text-gray-400">
                            <li>• © 2025 {t('작곡가명', 'Composer Name')}</li>
                            <li>• © 2025 Universal Music Publishing</li>
                            <li>• © 2025 {t('아티스트명 (자작곡)', 'Artist Name (Original Composition)')}</li>
                          </ul>
                        </div>
                      </div>
                      <div className="absolute -bottom-2 left-4 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-gray-900"></div>
                    </div>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('저작권 소유자', 'Copyright Holder')} *
                  </label>
                  <input
                    type="text"
                    value={copyrightData.copyrightHolder}
                    onChange={(e) => handleChange('copyrightHolder', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                    placeholder={t('예: 아티스트명 또는 출판사', 'e.g. Artist Name or Publisher')}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('작곡/작사 권리를 소유한 개인 또는 회사', 'Individual or company who owns composition/lyrics rights')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('저작권 연도', 'Copyright Year')} *
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={copyrightData.copyrightYear}
                      onChange={(e) => handleChange('copyrightYear', e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                      placeholder="2025"
                      maxLength={4}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('작품이 처음 만들어진 연도', 'Year the work was first created')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Common Examples */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            {t('일반적인 경우', 'Common Cases')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('자체 제작 아티스트', 'Self-producing Artist')}
              </p>
              <ul className="space-y-1">
                <li>℗ 2025 {t('아티스트명', 'Artist Name')}</li>
                <li>© 2025 {t('아티스트명', 'Artist Name')}</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('레이블 소속 아티스트', 'Label-signed Artist')}
              </p>
              <ul className="space-y-1">
                <li>℗ 2025 {t('레이블명', 'Label Name')}</li>
                <li>© 2025 {t('아티스트명 또는 출판사', 'Artist Name or Publisher')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}