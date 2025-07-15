import { useState } from 'react'
import { Video, Music, Hash, X, Check, AlertCircle } from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'

interface MusicVideo {
  id: string
  title: string
  version?: string
  audioISRC: string // ISRC of the associated audio track
  videoISRC?: string // Optional separate ISRC for video
  duration?: string
  explicit: boolean
  fileUrl?: string
}

interface MusicVideoFormProps {
  video: MusicVideo
  audioTracks: Array<{ id: string; title: string; isrc?: string }>
  onSave: (video: MusicVideo) => void
  onCancel: () => void
}

export default function MusicVideoForm({ video, audioTracks, onSave, onCancel }: MusicVideoFormProps) {
  const language = useLanguageStore(state => state.language)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const [localVideo, setLocalVideo] = useState<MusicVideo>(video)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const formatDuration = (seconds: string | number) => {
    const sec = typeof seconds === 'string' ? parseInt(seconds) : seconds
    const mins = Math.floor(sec / 60)
    const secs = sec % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const parseDuration = (duration: string) => {
    const [mins, secs] = duration.split(':').map(n => parseInt(n) || 0)
    return (mins * 60 + secs).toString()
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!localVideo.title) {
      newErrors.title = t('제목은 필수입니다', 'Title is required')
    }

    if (!localVideo.audioISRC) {
      newErrors.audioISRC = t('연결된 오디오 트랙을 선택해주세요', 'Please select associated audio track')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validate()) {
      onSave(localVideo)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Video className="w-6 h-6 text-purple-500" />
              {video.id ? t('뮤직비디오 수정', 'Edit Music Video') : t('뮤직비디오 추가', 'Add Music Video')}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title and Version */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('뮤직비디오 제목', 'Music Video Title')} *
              </label>
              <input
                type="text"
                value={localVideo.title}
                onChange={(e) => setLocalVideo(prev => ({ ...prev, title: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 ${
                  errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={t('뮤직비디오 제목', 'Music Video Title')}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('버전', 'Version')}
                <span className="text-xs text-gray-500 ml-2">{t('(선택)', '(Optional)')}</span>
              </label>
              <input
                type="text"
                value={localVideo.version || ''}
                onChange={(e) => setLocalVideo(prev => ({ ...prev, version: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                placeholder={t('예: Official Video, Lyric Video', 'e.g., Official Video, Lyric Video')}
              />
            </div>
          </div>

          {/* Associated Audio Track */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('연결된 오디오 트랙', 'Associated Audio Track')} *
            </label>
            <select
              value={localVideo.audioISRC}
              onChange={(e) => setLocalVideo(prev => ({ ...prev, audioISRC: e.target.value }))}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 ${
                errors.audioISRC ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <option value="">{t('오디오 트랙 선택...', 'Select audio track...')}</option>
              {audioTracks.map(track => (
                <option key={track.id} value={track.isrc || track.id}>
                  {track.title} {track.isrc && `(ISRC: ${track.isrc})`}
                </option>
              ))}
            </select>
            {errors.audioISRC && (
              <p className="mt-1 text-sm text-red-500">{errors.audioISRC}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {t(
                '이 뮤직비디오와 연결된 오디오 트랙의 ISRC를 선택하세요',
                'Select the ISRC of the audio track associated with this music video'
              )}
            </p>
          </div>

          {/* ISRCs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('오디오 ISRC', 'Audio ISRC')}
                <button className="ml-2 text-gray-400 hover:text-gray-600">
                  <AlertCircle className="w-4 h-4 inline" />
                </button>
              </label>
              <input
                type="text"
                value={localVideo.audioISRC}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700/50"
                placeholder={t('오디오 트랙 선택 시 자동 입력', 'Auto-filled from audio track')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('비디오 ISRC', 'Video ISRC')}
                <span className="text-xs text-gray-500 ml-2">{t('(선택)', '(Optional)')}</span>
              </label>
              <input
                type="text"
                value={localVideo.videoISRC || ''}
                onChange={(e) => setLocalVideo(prev => ({ ...prev, videoISRC: e.target.value.toUpperCase() }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                placeholder={t('예: USRC17607840', 'e.g., USRC17607840')}
                maxLength={12}
              />
              <p className="mt-1 text-xs text-gray-500">
                {t(
                  '비디오 전용 ISRC가 있는 경우에만 입력하세요',
                  'Only enter if the video has its own separate ISRC'
                )}
              </p>
            </div>
          </div>

          {/* Duration and Explicit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('재생 시간', 'Duration')}
              </label>
              <input
                type="text"
                value={localVideo.duration ? formatDuration(localVideo.duration) : ''}
                onChange={(e) => setLocalVideo(prev => ({ 
                  ...prev, 
                  duration: parseDuration(e.target.value) 
                }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                placeholder="3:45"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localVideo.explicit}
                  onChange={(e) => setLocalVideo(prev => ({ ...prev, explicit: e.target.checked }))}
                  className="rounded text-purple-500"
                />
                <span className="text-sm font-medium">{t('명시적 콘텐츠', 'Explicit Content')}</span>
              </label>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">{t('뮤직비디오 등록 안내', 'Music Video Registration Guide')}</p>
                <ul className="space-y-1 ml-4">
                  <li>• {t('뮤직비디오는 반드시 오디오 트랙과 연결되어야 합니다', 'Music videos must be linked to an audio track')}</li>
                  <li>• {t('오디오 ISRC는 연결된 트랙의 ISRC를 사용합니다', 'Audio ISRC uses the linked track\'s ISRC')}</li>
                  <li>• {t('비디오 전용 ISRC는 별도로 발급받은 경우에만 입력하세요', 'Only enter video ISRC if separately issued')}</li>
                  <li>• {t('버전 정보로 Official Video, Lyric Video 등을 구분할 수 있습니다', 'Use version to distinguish Official Video, Lyric Video, etc.')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {t('취소', 'Cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            {video.id ? t('수정', 'Update') : t('추가', 'Add')}
          </button>
        </div>
      </div>
    </div>
  )
}