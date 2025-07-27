import { useState, useEffect } from 'react';
import { Calendar, Clock, Info, Copy, Globe } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';
import DateTimePicker from '@/components/DateTimePicker';
import { timezones, convertToUTC } from '@/constants/timezones';

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
  const language = useSafeStore(useLanguageStore, (state) => state.language);
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  const [showOriginalDateEdit, setShowOriginalDateEdit] = useState(false);

  // Auto-sync original date with consumer date when not re-release
  useEffect(() => {
    if (!originalDate.isReRelease && !showOriginalDateEdit) {
      onChange({
        consumerDate,
        originalDate: {
          ...consumerDate,
          isReRelease: false
        }
      });
    }
  }, [consumerDate, originalDate.isReRelease, showOriginalDateEdit]);

  const handleConsumerDateChange = (field: 'date' | 'time' | 'timezone' | 'datetime', value: string) => {
    if (field === 'datetime') {
      // Parse datetime ISO string
      const date = new Date(value);
      const updatedConsumerDate = {
        ...consumerDate,
        date: date.toISOString().split('T')[0],
        time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      };
      onChange({
        consumerDate: updatedConsumerDate,
        originalDate: originalDate.isReRelease ? originalDate : { ...updatedConsumerDate, isReRelease: false }
      });
    } else {
      const updatedConsumerDate = { ...consumerDate, [field]: value };
      onChange({
        consumerDate: updatedConsumerDate,
        originalDate: originalDate.isReRelease ? originalDate : { ...updatedConsumerDate, isReRelease: false }
      });
    }
  };

  const handleOriginalDateChange = (field: 'date' | 'time' | 'timezone' | 'isReRelease' | 'datetime', value: string | boolean) => {
    if (field === 'isReRelease') {
      const isReRelease = value as boolean;
      onChange({
        consumerDate,
        originalDate: {
          ...originalDate,
          isReRelease,
          // If turning off re-release, sync with consumer date
          ...(isReRelease ? {} : consumerDate)
        }
      });
      setShowOriginalDateEdit(isReRelease);
    } else if (field === 'datetime') {
      // Parse datetime ISO string
      const date = new Date(value as string);
      onChange({
        consumerDate,
        originalDate: {
          ...originalDate,
          date: date.toISOString().split('T')[0],
          time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
        }
      });
    } else {
      onChange({
        consumerDate,
        originalDate: { ...originalDate, [field]: value }
      });
    }
  };

  // Calculate UTC times
  const consumerUTC = consumerDate.date && consumerDate.time
    ? convertToUTC(consumerDate.date, consumerDate.time, consumerDate.timezone)
    : null;

  const originalUTC = originalDate.date && originalDate.time
    ? convertToUTC(originalDate.date, originalDate.time, originalDate.timezone)
    : null;

  return (
    <div className="space-y-6">
      {/* Consumer Release Date */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {t('컨수머 발매일', 'Consumer Release Date')} <span className="text-red-500">*</span>
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {t(
                '음원이 스트리밍 플랫폼(스포티파이, 애플뮤직 등)에 공개되는 날짜와 시간입니다. 리스너가 실제로 음원을 들을 수 있게 되는 시점입니다.',
                'The date and time when your music becomes available on streaming platforms (Spotify, Apple Music, etc.). This is when listeners can actually play your music.'
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-1">
            <DateTimePicker
              value={consumerDate.date && consumerDate.time ?
                `${consumerDate.date}T${consumerDate.time}:00` :
                new Date().toISOString()
              }
              onChange={(datetime: string) => handleConsumerDateChange('datetime', datetime)}
              label={t('날짜 및 시간', 'Date & Time')}
              required
              minDate={new Date().toISOString().split('T')[0]}
              hint={t('발매일과 시간을 선택하세요', 'Select release date and time')}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">
              {t('시간대', 'Timezone')} <span className="text-red-500">*</span>
            </label>
            <select
              value={consumerDate.timezone}
              onChange={(e) => handleConsumerDateChange('timezone', e.target.value)}
              className="w-full px-4 py-3.5 min-h-[48px] border-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm text-gray-900 dark:text-white font-medium border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus:border-transparent focus:ring-4 focus:ring-n3rve-500/20 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:shadow-lg focus:shadow-n3rve-500/10 transition-all duration-200"
            >
              {timezones.map(tz => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
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
                `${consumerDate.date} ${consumerDate.time} ${timezones.find(tz => tz.value === consumerDate.timezone)?.label || consumerDate.timezone} = ${consumerUTC.toISOString().replace('T', ' ').split('.')[0]} UTC`
              )}
            </p>
          </div>
        )}
      </div>

      {/* Original Release Date */}
      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-slate-600 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {t('오리지널 발매일', 'Original Release Date')}
              </h4>
              <label className="flex items-center gap-2 cursor-pointer bg-purple-100 dark:bg-purple-900/30 px-3 py-1.5 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/40 transition-colors">
                <input
                  type="checkbox"
                  checked={originalDate.isReRelease}
                  onChange={(e) => handleOriginalDateChange('isReRelease', e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{t('재발매/리마스터', 'Re-release/Remaster')}</span>
              </label>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t(
                '음원이 최초로 발매된 날짜입니다. 재발매, 리마스터, 리믹스가 아닌 신곡의 경우 컨수머 발매일과 동일하게 자동 설정됩니다.',
                'The date when the music was first released. For new releases (not re-releases, remasters, or remixes), this is automatically set to match the consumer release date.'
              )}
            </p>
          </div>
        </div>

        {originalDate.isReRelease ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-1">
              <DateTimePicker
                value={originalDate.date && originalDate.time ?
                  `${originalDate.date}T${originalDate.time}:00` :
                  new Date().toISOString()
                }
                onChange={(datetime: string) => handleOriginalDateChange('datetime', datetime)}
                label={t('날짜 및 시간', 'Date & Time')}
                maxDate={new Date().toISOString().split('T')[0]}
                hint={t('원곡이 발매된 날짜와 시간', 'Original release date and time')}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">
                {t('시간대', 'Timezone')}
              </label>
              <select
                value={originalDate.timezone}
                onChange={(e) => handleOriginalDateChange('timezone', e.target.value)}
                className="w-full px-4 py-3.5 min-h-[48px] border-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm text-gray-900 dark:text-white font-medium border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus:border-transparent focus:ring-4 focus:ring-n3rve-500/20 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:shadow-lg focus:shadow-n3rve-500/10 transition-all duration-200"
              >
                {timezones.map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden">
            {/* Auto-sync indicator */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-purple-100/50 dark:from-blue-900/20 dark:to-purple-900/20 animate-pulse" />
            <div className="relative p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full animate-ping" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <span>{t('자동 동기화 활성화', 'Auto-sync Enabled')}</span>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">
                      {t('신곡', 'New Release')}
                    </span>
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {t(
                      '오리지널 발매일이 컨수머 발매일과 동일하게 자동으로 설정됩니다. 재발매나 리마스터인 경우 위의 체크박스를 선택하세요.',
                      'Original release date is automatically synced with consumer release date. Check the box above if this is a re-release or remaster.'
                    )}
                  </p>
                </div>
              </div>
              {/* Visual sync indicator */}
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
                <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {consumerDate.date || 'YYYY-MM-DD'} {consumerDate.time || 'HH:MM'}
                </span>
                <span>→</span>
                <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {t('오리지널 발매일', 'Original Date')}
                </span>
              </div>
            </div>
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
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl p-5 border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Info className="w-4 h-4 text-white" />
          </div>
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-bold mb-3 text-base">{t('날짜 설정 가이드', 'Release Date Guide')}</p>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">1</span>
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{t('컨수머 발매일', 'Consumer Release Date')}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {t('스트리밍 서비스에 음원이 공개되는 날짜 (필수)', 'Date when music becomes available on streaming services (Required)')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400">2</span>
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{t('오리지널 발매일', 'Original Release Date')}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {t('음원이 최초로 발매된 날짜 (신곡은 자동 동기화)', 'Date of first release (Auto-synced for new releases)')}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-yellow-300 dark:border-yellow-700 space-y-1">
              <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
                <span className="w-1 h-1 bg-yellow-600 dark:bg-yellow-400 rounded-full" />
                {t('모든 시간은 UTC로 저장되며, 각 플랫폼에서 현지 시간으로 변환됩니다', 'All times are stored in UTC and converted to local time on each platform')}
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
                <span className="w-1 h-1 bg-yellow-600 dark:bg-yellow-400 rounded-full" />
                {t('금요일 오전 0시 발매가 일반적이나, 플랫폼별로 다를 수 있습니다', 'Friday midnight release is common, but may vary by platform')}
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
                <span className="w-1 h-1 bg-yellow-600 dark:bg-yellow-400 rounded-full" />
                {t('최소 2주 전에 발매일을 설정하는 것을 권장합니다', 'It is recommended to set the release date at least 2 weeks in advance')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
