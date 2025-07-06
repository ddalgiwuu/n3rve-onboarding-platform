import { useLanguageStore } from '@/store/language.store'
import { FileAudio, AlertCircle, CheckCircle, Info, Volume2, FileType, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function TechnicalGuide() {
  const { t } = useLanguageStore()

  const audioSpecs = [
    { label: t('파일 형식', 'File Format'), value: 'WAV, FLAC', recommended: true },
    { label: t('비트 뎁스', 'Bit Depth'), value: '24-bit', recommended: true },
    { label: t('샘플 레이트', 'Sample Rate'), value: '44.1kHz / 48kHz', recommended: true },
    { label: t('다이나믹 레인지', 'Dynamic Range'), value: 'DR8+', recommended: false },
    { label: t('피크 레벨', 'Peak Level'), value: '-1dBFS max', recommended: true },
  ]

  const dolbyAtmosSpecs = [
    { label: t('파일 형식', 'File Format'), value: 'ADM BWF (.wav)', icon: FileType },
    { label: t('채널 구성', 'Channel Config'), value: '7.1.4 (12ch)', icon: Volume2 },
    { label: t('샘플 레이트', 'Sample Rate'), value: '48kHz only', icon: FileAudio },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            {t('기술 사양 가이드', 'Technical Specifications Guide')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {t('고품질 음원 제작을 위한 기술 가이드라인', 'Technical guidelines for high-quality audio production')}
          </p>
        </div>

        {/* Audio Specifications */}
        <div className="card-glass p-8 mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
              <FileAudio className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('오디오 사양', 'Audio Specifications')}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                    {t('항목', 'Parameter')}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                    {t('사양', 'Specification')}
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                    {t('권장', 'Recommended')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {audioSpecs.map((spec, index) => (
                  <tr 
                    key={index}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                      {spec.label}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {spec.value}
                    </td>
                    <td className="text-center py-3 px-4">
                      {spec.recommended ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <Info className="w-5 h-5 text-blue-500 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dolby Atmos Requirements */}
        <div className="card-glass p-8 mb-8 animate-fade-in-delay">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
              <Volume2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('Dolby Atmos 요구사항', 'Dolby Atmos Requirements')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dolbyAtmosSpecs.map((spec, index) => {
              const Icon = spec.icon
              return (
                <div 
                  key={index}
                  className="glass-effect p-6 rounded-xl hover:shadow-lg transition-all duration-300 animate-slide-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {spec.label}
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    {spec.value}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="mt-6 glass-effect rounded-xl p-4 border-2 border-blue-500/30">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t(
                  'Dolby Atmos 마스터는 반드시 공인 스튜디오에서 제작되어야 합니다.',
                  'Dolby Atmos masters must be created in a certified studio.'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* File Naming Convention */}
        <div className="card-glass p-8 mb-8 animate-fade-in-delay">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {t('파일 명명 규칙', 'File Naming Convention')}
          </h2>

          <div className="space-y-4">
            <div className="glass-effect rounded-xl p-4">
              <code className="text-purple-600 dark:text-purple-400 font-mono">
                [TrackNumber]_[ArtistName]_[TrackTitle]_[Version].wav
              </code>
            </div>

            <div className="glass-effect rounded-xl p-4">
              <p className="font-medium text-gray-900 dark:text-white mb-2">
                {t('예시', 'Example')}:
              </p>
              <code className="text-gray-600 dark:text-gray-400 font-mono text-sm">
                01_AURORA_Moonlight_Symphony_Master.wav
              </code>
            </div>
          </div>
        </div>

        {/* Common Issues */}
        <div className="card-glass p-8 mb-8 animate-fade-in-delay">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('자주 발생하는 문제', 'Common Issues')}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="glass-effect rounded-xl p-4 border-l-4 border-red-500">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {t('클리핑', 'Clipping')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t(
                  '피크 레벨이 0dBFS를 초과하면 음질 저하가 발생합니다. -1dBFS 이하로 유지하세요.',
                  'Peak levels exceeding 0dBFS cause quality degradation. Keep below -1dBFS.'
                )}
              </p>
            </div>

            <div className="glass-effect rounded-xl p-4 border-l-4 border-yellow-500">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {t('낮은 샘플 레이트', 'Low Sample Rate')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t(
                  'MP3를 WAV로 변환해도 음질이 향상되지 않습니다. 원본 고품질 파일을 사용하세요.',
                  'Converting MP3 to WAV doesn\'t improve quality. Use original high-quality files.'
                )}
              </p>
            </div>

            <div className="glass-effect rounded-xl p-4 border-l-4 border-blue-500">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {t('메타데이터 누락', 'Missing Metadata')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t(
                  'ISRC, 작곡가 정보 등 필수 메타데이터가 누락되면 배포가 지연될 수 있습니다.',
                  'Missing essential metadata like ISRC, composer info can delay distribution.'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center animate-fade-in-delay">
          <Link
            to="/onboarding"
            className="btn-modern btn-primary hover-lift inline-flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            {t('릴리스 시작하기', 'Start Your Release')}
          </Link>
        </div>
      </div>
    </div>
  )
}