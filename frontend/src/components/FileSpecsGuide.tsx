import { Info, Music, Image, Video, Disc, AlertCircle } from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'
import {
  AUDIO_SPECIFICATIONS,
  ARTWORK_SPECIFICATIONS,
  MOTION_ART_SPECIFICATIONS,
  DOLBY_ATMOS_SPECIFICATIONS,
  VIDEO_SPECIFICATIONS
} from '@/utils/technicalSpecs'

interface FileSpecsGuideProps {
  type: 'audio' | 'artwork' | 'motionart' | 'dolbyatmos' | 'video'
  className?: string
}

export default function FileSpecsGuide({ type, className = '' }: FileSpecsGuideProps) {
  const language = useLanguageStore(state => state.language)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const getSpecContent = () => {
    switch (type) {
      case 'audio':
        return {
          icon: <Music className="w-5 h-5" />,
          title: t('음원 파일 규격', 'Audio File Specifications'),
          specs: AUDIO_SPECIFICATIONS,
          content: (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">{t('지원 포맷', 'Supported Formats')}</h4>
                <div className="flex gap-2 flex-wrap">
                  {AUDIO_SPECIFICATIONS.formats.map(format => (
                    <span key={format} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm">
                      {format}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">{t('샘플레이트', 'Sample Rate')}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    44.1kHz ~ 192kHz
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">{t('비트 뎁스', 'Bit Depth')}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    16-bit, 24-bit, 32-bit
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">{t('요구사항', 'Requirements')}</h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {t('피크 레벨: -3dB ~ 0dB', 'Peak level: -3dB to 0dB')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {t('클리핑/왜곡 없음', 'No clipping or distortion')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {t('최대 파일 크기: 2GB', 'Max file size: 2GB')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✗</span>
                    {t('손실 압축 불가 (MP3, AAC 등)', 'No lossy compression (MP3, AAC, etc.)')}
                  </li>
                </ul>
              </div>
            </div>
          )
        }

      case 'artwork':
        return {
          icon: <Image className="w-5 h-5" />,
          title: t('아트워크 규격', 'Artwork Specifications'),
          specs: ARTWORK_SPECIFICATIONS,
          content: (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">{t('지원 포맷', 'Supported Formats')}</h4>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                    JPG/JPEG
                  </span>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                    PNG
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">{t('최소 해상도', 'Minimum Resolution')}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">1400 x 1400px</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">{t('권장 해상도', 'Recommended')}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">3000 x 3000px</p>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                      {t('중요 사항', 'Important')}
                    </p>
                    <ul className="space-y-1 text-yellow-700 dark:text-yellow-300">
                      <li>• {t('정사각형 비율 (1:1) 필수', 'Square ratio (1:1) required')}</li>
                      <li>• {t('RGB 컬러 모드만 지원', 'RGB color mode only')}</li>
                      <li>• {t('최대 파일 크기: 10MB', 'Max file size: 10MB')}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">{t('품질 요구사항', 'Quality Requirements')}</h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {t('고품질 (압축 아티팩트 최소화)', 'High quality (minimal compression artifacts)')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✗</span>
                    {t('워터마크/프로모션 텍스트 불가', 'No watermarks or promotional text')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✗</span>
                    {t('테두리/프레임 불가', 'No borders or frames')}
                  </li>
                </ul>
              </div>
            </div>
          )
        }

      case 'motionart':
        return {
          icon: <Video className="w-5 h-5" />,
          title: t('모션 아트 규격', 'Motion Art Specifications'),
          specs: MOTION_ART_SPECIFICATIONS,
          content: (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">{t('지원 포맷', 'Supported Format')}</h4>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">
                  MP4 (H.264)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">{t('해상도', 'Resolution')}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('최소 1080x1080px', 'Min 1080x1080px')}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">{t('길이', 'Duration')}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">15-30 {t('초', 'seconds')}</p>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-purple-800 dark:text-purple-200 mb-1">
                      {t('모션 아트 팁', 'Motion Art Tips')}
                    </p>
                    <ul className="space-y-1 text-purple-700 dark:text-purple-300">
                      <li>• {t('정사각형 비율 (1:1) 필수', 'Square ratio (1:1) required')}</li>
                      <li>• {t('오디오 트랙 없음', 'No audio track')}</li>
                      <li>• {t('완벽한 루프 권장', 'Seamless loop preferred')}</li>
                      <li>• {t('최대 파일 크기: 100MB', 'Max file size: 100MB')}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">{t('기술 사양', 'Technical Specs')}</h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>• {t('코덱: H.264', 'Codec: H.264')}</li>
                  <li>• {t('프레임레이트: 24/25/30 fps', 'Frame rate: 24/25/30 fps')}</li>
                  <li>• {t('비율: 1:1 (정사각형)', 'Aspect ratio: 1:1 (square)')}</li>
                </ul>
              </div>
            </div>
          )
        }

      case 'dolbyatmos':
        return {
          icon: <Disc className="w-5 h-5" />,
          title: t('Dolby Atmos 규격', 'Dolby Atmos Specifications'),
          specs: DOLBY_ATMOS_SPECIFICATIONS,
          content: (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">{t('포맷 요구사항', 'Format Requirements')}</h4>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{t('포맷', 'Format')}:</span>
                    <span className="text-sm">ADM BWF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{t('샘플레이트', 'Sample Rate')}:</span>
                    <span className="text-sm">48kHz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{t('비트 뎁스', 'Bit Depth')}:</span>
                    <span className="text-sm">24-bit</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">{t('필수 제출물', 'Required Deliverables')}</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">1</span>
                    <span className="text-sm">{t('ADM BWF 마스터 파일', 'ADM BWF master file')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">2</span>
                    <span className="text-sm">{t('바이노럴 스테레오 렌더 (필수)', 'Binaural stereo render (required)')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">3</span>
                    <span className="text-sm">{t('Dolby Atmos 메타데이터 파일', 'Dolby Atmos metadata file')}</span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">{t('중요', 'Important')}</p>
                    <p>{t(
                      'Dolby Atmos Production Suite에서 믹싱 및 마스터링되어야 하며, 모든 오브젝트와 베드에서 클리핑이 없어야 합니다.',
                      'Must be mixed and mastered in Dolby Atmos Production Suite with no clipping in any object or bed.'
                    )}</p>
                  </div>
                </div>
              </div>
            </div>
          )
        }

      case 'video':
        return {
          icon: <Video className="w-5 h-5" />,
          title: t('뮤직비디오 규격', 'Music Video Specifications'),
          specs: VIDEO_SPECIFICATIONS,
          content: (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">{t('지원 포맷', 'Supported Formats')}</h4>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                    MP4
                  </span>
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                    MOV
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">{t('최소 해상도', 'Minimum Resolution')}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">1920 x 1080px (FHD)</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">{t('권장 해상도', 'Recommended')}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">3840 x 2160px (4K)</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">{t('기술 요구사항', 'Technical Requirements')}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">{t('코덱', 'Codec')}:</span>
                    <p className="text-gray-600 dark:text-gray-400">H.264 / H.265</p>
                  </div>
                  <div>
                    <span className="font-medium">{t('비율', 'Aspect Ratio')}:</span>
                    <p className="text-gray-600 dark:text-gray-400">16:9</p>
                  </div>
                  <div>
                    <span className="font-medium">{t('프레임레이트', 'Frame Rate')}:</span>
                    <p className="text-gray-600 dark:text-gray-400">24/25/30/50/60 fps</p>
                  </div>
                  <div>
                    <span className="font-medium">{t('비트레이트', 'Bitrate')}:</span>
                    <p className="text-gray-600 dark:text-gray-400">10-50 Mbps</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{t('최대 파일 크기', 'Max file size')}:</span> 4GB
                </p>
              </div>
            </div>
          )
        }

      default:
        return null
    }
  }

  const content = getSpecContent()
  if (!content) return null

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        {content.icon}
        <h3 className="text-lg font-semibold">{content.title}</h3>
      </div>
      {content.content}
    </div>
  )
}