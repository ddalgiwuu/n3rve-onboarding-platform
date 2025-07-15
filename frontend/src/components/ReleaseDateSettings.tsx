import { useState, useEffect } from 'react'
import { Calendar, Clock, Info, Copy, Globe } from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'
import { DatePicker } from '@/components/DatePicker'
import { timezones, convertToUTC } from '@/constants/timezones'

interface ReleaseDateSettingsProps {
  consumerDate: {
    date: string
    time: string
    timezone: string
  }
  originalDate: {
    date: string
    time: string
    timezone: string
    isReRelease: boolean
  }
  onChange: (dates: {
    consumerDate: { date: string; time: string; timezone: string }
    originalDate: { date: string; time: string; timezone: string; isReRelease: boolean }
  }) => void
}

export default function ReleaseDateSettings({ consumerDate, originalDate, onChange }: ReleaseDateSettingsProps) {
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const [showOriginalDateEdit, setShowOriginalDateEdit] = useState(false)

  // Auto-sync original date with consumer date when not re-release
  useEffect(() => {
    if (!originalDate.isReRelease && !showOriginalDateEdit) {
      onChange({
        consumerDate,
        originalDate: {
          ...consumerDate,
          isReRelease: false
        }
      })
    }
  }, [consumerDate, originalDate.isReRelease, showOriginalDateEdit])

  const handleConsumerDateChange = (field: 'date' | 'time' | 'timezone', value: string) => {
    const updatedConsumerDate = { ...consumerDate, [field]: value }
    onChange({
      consumerDate: updatedConsumerDate,
      originalDate: originalDate.isReRelease ? originalDate : { ...updatedConsumerDate, isReRelease: false }
    })
  }

  const handleOriginalDateChange = (field: 'date' | 'time' | 'timezone' | 'isReRelease', value: string | boolean) => {
    if (field === 'isReRelease') {
      const isReRelease = value as boolean
      onChange({
        consumerDate,
        originalDate: {
          ...originalDate,
          isReRelease,
          // If turning off re-release, sync with consumer date
          ...(isReRelease ? {} : consumerDate)
        }
      })
      setShowOriginalDateEdit(isReRelease)
    } else {
      onChange({
        consumerDate,
        originalDate: { ...originalDate, [field]: value }
      })
    }
  }

  // Calculate UTC times
  const consumerUTC = consumerDate.date && consumerDate.time 
    ? convertToUTC(consumerDate.date, consumerDate.time, consumerDate.timezone)
    : null

  const originalUTC = originalDate.date && originalDate.time
    ? convertToUTC(originalDate.date, originalDate.time, originalDate.timezone)
    : null

  return (
    <div className="space-y-6">
      {/* Consumer Release Date */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 dark:text-blue-100">
              {t('컨수머 발매일', 'Consumer Release Date')} *
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {t(
                '음원이 스트리밍 플랫폼에 공개되는 날짜와 시간입니다. 실제로 리스너가 음원을 들을 수 있게 되는 시점입니다.',
                'The date and time when your music becomes available on streaming platforms. This is when listeners can actually play your music.'
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('날짜', 'Date')} *</label>
            <DatePicker
              value={consumerDate.date}
              onChange={(date) => handleConsumerDateChange('date', date)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              minDate={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">{t('시간', 'Time')} *</label>
            <input
              type="time"
              value={consumerDate.time}
              onChange={(e) => handleConsumerDateChange('time', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">{t('시간대', 'Timezone')} *</label>
            <select
              value={consumerDate.timezone}
              onChange={(e) => handleConsumerDateChange('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
            >
              {timezones.map(tz => (
                <option key={tz.value} value={tz.value}>
                  {language === 'ko' ? tz.label : tz.labelEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* UTC Conversion Display */}
        {consumerUTC && (
          <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">{t('UTC 변환', 'UTC Conversion')}:</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {consumerUTC.toISOString().replace('T', ' ').split('.')[0]} UTC
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(consumerUTC.toISOString())}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title={t('복사', 'Copy')}
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {t(
                `${consumerDate.date} ${consumerDate.time} ${timezones.find(tz => tz.value === consumerDate.timezone)?.label || consumerDate.timezone} = ${consumerUTC.toISOString().replace('T', ' ').split('.')[0]} UTC`,
                `${consumerDate.date} ${consumerDate.time} ${timezones.find(tz => tz.value === consumerDate.timezone)?.labelEn || consumerDate.timezone} = ${consumerUTC.toISOString().replace('T', ' ').split('.')[0]} UTC`
              )}
            </p>
          </div>
        )}
      </div>

      {/* Original Release Date */}
      <div className="bg-gray-50 dark:bg-gray-900/20 rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {t('원곡 발매일', 'Original Release Date')}
              </h4>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={originalDate.isReRelease}
                  onChange={(e) => handleOriginalDateChange('isReRelease', e.target.checked)}
                  className="rounded text-purple-500"
                />
                <span className="text-sm">{t('재발매/리마스터', 'Re-release/Remaster')}</span>
              </label>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t(
                '이 음원이 과거에 발매된 적이 있는 경우, 최초 발매된 날짜를 입력합니다. 신곡인 경우 컨수머 발매일과 동일하게 자동 설정됩니다.',
                'If this music was previously released, enter the original release date. For new releases, this is automatically set to match the consumer release date.'
              )}
            </p>
          </div>
        </div>

        {originalDate.isReRelease ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('날짜', 'Date')}</label>
              <DatePicker
                value={originalDate.date}
                onChange={(date) => handleOriginalDateChange('date', date)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                maxDate={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t('시간', 'Time')}</label>
              <input
                type="time"
                value={originalDate.time}
                onChange={(e) => handleOriginalDateChange('time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t('시간대', 'Timezone')}</label>
              <select
                value={originalDate.timezone}
                onChange={(e) => handleOriginalDateChange('timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              >
                {timezones.map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {language === 'ko' ? tz.label : tz.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Info className="w-4 h-4" />
              {t(
                '신곡이므로 원곡 발매일이 컨수머 발매일과 동일하게 설정됩니다.',
                'As a new release, the original release date is set to match the consumer release date.'
              )}
            </p>
          </div>
        )}

        {/* UTC Conversion Display for Original */}
        {originalDate.isReRelease && originalUTC && (
          <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">{t('UTC 변환', 'UTC Conversion')}:</span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {originalUTC.toISOString().replace('T', ' ').split('.')[0]} UTC
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium mb-2">{t('날짜 설정 안내', 'Date Setting Guide')}</p>
            <ul className="space-y-1 text-yellow-700 dark:text-yellow-300">
              <li>• {t('모든 시간은 UTC로 저장되며, 각 플랫폼에서 현지 시간으로 변환됩니다', 'All times are stored in UTC and converted to local time on each platform')}</li>
              <li>• {t('금요일 오전 0시 발매가 일반적이나, 플랫폼별로 다를 수 있습니다', 'Friday midnight release is common, but may vary by platform')}</li>
              <li>• {t('최소 2주 전에 발매일을 설정하는 것을 권장합니다', 'It is recommended to set the release date at least 2 weeks in advance')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}