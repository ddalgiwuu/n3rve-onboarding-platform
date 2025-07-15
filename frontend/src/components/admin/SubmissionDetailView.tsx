import React, { useState } from 'react'
import { 
  Copy, ChevronDown, ChevronRight, Music, Album, FileText, Globe, 
  Shield, Calendar, DollarSign, Info, Users, Tag, Link, Camera,
  Headphones, Film, CheckCircle, XCircle, AlertCircle, ExternalLink,
  Package, Download, Eye, Image, Play
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'
import toast from 'react-hot-toast'
import AudioPlayer from '@/components/AudioPlayer'
import { dropboxService } from '@/services/dropbox.service'

interface Props {
  submission: any // MongoDB에서 가져온 전체 submission 데이터
}

interface Section {
  id: string
  title: string
  icon: React.ReactNode
  data: Record<string, any>
}

const SubmissionDetailView: React.FC<Props> = ({ submission }) => {
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  // Note: t function is not available from useLanguageStore, need to create local t function
  const t = (ko: string, en: string) => language === 'ko' ? ko : en
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'product', 'artist', 'tracks', 'distribution', 'files'
  ])
  const [copiedSections, setCopiedSections] = useState<Set<string>>(new Set())
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const copyToClipboard = async (text: string, sectionId?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      if (sectionId) {
        setCopiedSections(new Set([...copiedSections, sectionId]))
        setTimeout(() => {
          setCopiedSections(prev => {
            const newSet = new Set(prev)
            newSet.delete(sectionId)
            return newSet
          })
        }, 2000)
      }
      toast.success(t('복사되었습니다', 'Copied to clipboard'))
    } catch (err) {
      toast.error(t('복사 실패', 'Failed to copy'))
    }
  }

  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return '-'
    if (typeof value === 'boolean') return value ? t('예', 'Yes') : t('아니오', 'No')
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  const formatSectionForCopy = (section: Section): string => {
    const lines = [`=== ${section.title} ===`]
    Object.entries(section.data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        lines.push(`${key}: ${formatValue(value)}`)
      }
    })
    return lines.join('\n')
  }

  const formatAllForCopy = (): string => {
    const allSections = getSections()
    return allSections.map(section => formatSectionForCopy(section)).join('\n\n')
  }

  const getDirectUrl = (url: string) => {
    if (!url) return ''
    return dropboxService.getDirectUrl(url)
  }

  const getSections = (): Section[] => {
    const sections: Section[] = []

    // Product Level Fields
    sections.push({
      id: 'product',
      title: t('제품 레벨 필드', 'Product Level Fields'),
      icon: <Album className="w-5 h-5" />,
      data: {
        [t('릴리스 제목 (한국어)', 'Release Title (Korean)')]: submission.album?.titleKo,
        [t('릴리스 제목 (영어)', 'Release Title (English)')]: submission.album?.titleEn,
        [t('릴리스 아티스트 (메인)', 'Release Artist (Primary)')]: submission.artist?.primaryName,
        [t('포맷', 'Format')]: submission.album?.format,
        [t('원본 릴리스 날짜', 'Original Release Date')]: submission.release?.originalReleaseDate,
        [t('소비자 릴리스 날짜', 'Consumer Release Date')]: submission.release?.consumerReleaseDate,
        [t('레이블', 'Label')]: submission.artist?.labelName,
        [t('저작권 (℗)', 'Copyright (℗)')]: submission.release?.pRights,
        [t('저작권 (©)', 'Copyright (©)')]: submission.release?.cRights,
        [t('저작권 연도', 'Copyright Year')]: submission.release?.copyrightYear,
        'UPC': submission.album?.upc,
        'EAN': submission.album?.ean,
        'JAN': submission.album?.jan
      }
    })

    // Artist Information
    sections.push({
      id: 'artist',
      title: t('아티스트 정보', 'Artist Information'),
      icon: <Users className="w-5 h-5" />,
      data: {
        [t('아티스트명 (한국어)', 'Artist Name (Korean)')]: submission.artist?.nameKo,
        [t('아티스트명 (영어)', 'Artist Name (English)')]: submission.artist?.nameEn,
        [t('국가', 'Country')]: submission.artist?.countryOfOrigin,
        [t('부킹 에이전트', 'Booking Agent')]: submission.artist?.bookingAgent,
        'Spotify ID': submission.artist?.spotifyId,
        'Apple Music ID': submission.artist?.appleMusicId,
        'YouTube Channel ID': submission.artist?.youtubeChannelId,
        [t('장르', 'Genres')]: submission.artist?.genre?.join(', ')
      }
    })

    // Tracks
    sections.push({
      id: 'tracks',
      title: t('트랙 정보', 'Track Information'),
      icon: <Music className="w-5 h-5" />,
      data: {
        [t('총 트랙 수', 'Total Tracks')]: submission.tracks?.length || 0,
        [t('트랙 리스트', 'Track List')]: submission.tracks?.map((track: any, index: number) => 
          `${index + 1}. ${track.title} ${track.featuring ? `(feat. ${track.featuring})` : ''}`
        ).join('\n'),
        [t('Dolby Atmos 트랙', 'Dolby Atmos Tracks')]: submission.tracks?.filter((t: any) => t.dolbyAtmos).length || 0
      }
    })

    // Distribution
    sections.push({
      id: 'distribution',
      title: t('배급 정보', 'Distribution Information'),
      icon: <Globe className="w-5 h-5" />,
      data: {
        [t('배급 지역', 'Distribution Regions')]: submission.release?.distributionRegions?.join(', ') || t('전세계', 'Worldwide'),
        [t('독점 권리', 'Exclusive Rights')]: submission.release?.exclusiveRights || t('없음', 'None'),
        [t('피처드 플랫폼', 'Featured Platforms')]: submission.release?.featuredPlatforms?.join(', ') || '-'
      }
    })

    // Files
    sections.push({
      id: 'files',
      title: t('파일', 'Files'),
      icon: <FileText className="w-5 h-5" />,
      data: {
        [t('커버 아트', 'Cover Art')]: submission.files?.coverImageUrl,
        [t('아티스트 사진', 'Artist Photo')]: submission.files?.artistPhotoUrl,
        [t('오디오 파일', 'Audio Files')]: submission.files?.audioFiles,
        [t('모션 아트', 'Motion Art')]: submission.files?.motionArtUrl,
        [t('뮤직 비디오', 'Music Video')]: submission.files?.musicVideoUrl,
        [t('추가 파일', 'Additional Files')]: submission.files?.additionalFiles
      }
    })

    return sections
  }

  const renderFileSection = (section: Section) => {
    const { files } = submission

    return (
      <div className="space-y-4">
        {/* Cover Art */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('커버 아트', 'Cover Art')}:
            </span>
            {files?.coverImageUrl && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewImage(getDirectUrl(files.coverImageUrl))}
                  className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  {t('미리보기', 'Preview')}
                </button>
                <a
                  href={files.coverImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t('다운로드', 'Download')}
                </a>
              </div>
            )}
          </div>
          {previewImage === getDirectUrl(files?.coverImageUrl) && files?.coverImageUrl && (
            <div className="mt-2">
              <img 
                src={getDirectUrl(files.coverImageUrl)} 
                alt="Cover Art" 
                className="max-w-xs rounded-lg shadow-lg"
                onError={() => {
                  setPreviewImage(null)
                  toast.error(t('이미지를 불러올 수 없습니다', 'Failed to load image'))
                }}
              />
            </div>
          )}
        </div>

        {/* Artist Photo */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('아티스트 사진', 'Artist Photo')}:
            </span>
            {files?.artistPhotoUrl && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewImage(getDirectUrl(files.artistPhotoUrl))}
                  className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  {t('미리보기', 'Preview')}
                </button>
                <a
                  href={files.artistPhotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t('다운로드', 'Download')}
                </a>
              </div>
            )}
          </div>
          {previewImage === getDirectUrl(files?.artistPhotoUrl) && files?.artistPhotoUrl && (
            <div className="mt-2">
              <img 
                src={getDirectUrl(files.artistPhotoUrl)} 
                alt="Artist Photo" 
                className="max-w-xs rounded-lg shadow-lg"
                onError={() => {
                  setPreviewImage(null)
                  toast.error(t('이미지를 불러올 수 없습니다', 'Failed to load image'))
                }}
              />
            </div>
          )}
        </div>

        {/* Audio Files */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">
            {t('오디오 파일', 'Audio Files')}:
          </span>
          {files?.audioFiles?.length > 0 ? (
            <div className="space-y-2">
              {files.audioFiles.map((file: any, index: number) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {submission.tracks?.[index]?.title || `Track ${index + 1}`}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPlayingAudio(playingAudio === file.dropboxUrl ? null : file.dropboxUrl)}
                        className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        {playingAudio === file.dropboxUrl ? t('정지', 'Stop') : t('재생', 'Play')}
                      </button>
                      <a
                        href={file.dropboxUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        {t('다운로드', 'Download')}
                      </a>
                    </div>
                  </div>
                  {playingAudio === file.dropboxUrl && (
                    <audio 
                      controls 
                      autoPlay
                      className="w-full mt-2"
                      src={getDirectUrl(file.dropboxUrl)}
                    >
                      Your browser does not support the audio element.
                    </audio>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {file.fileName} • {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-sm text-gray-500">{t('업로드된 오디오 파일이 없습니다', 'No audio files uploaded')}</span>
          )}
        </div>

        {/* Motion Art */}
        {files?.motionArtUrl && (
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('모션 아트', 'Motion Art')}:
              </span>
              <a
                href={files.motionArtUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                {t('다운로드', 'Download')}
              </a>
            </div>
          </div>
        )}

        {/* Music Video */}
        {files?.musicVideoUrl && (
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('뮤직 비디오', 'Music Video')}:
              </span>
              <a
                href={files.musicVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                {t('다운로드', 'Download')}
              </a>
            </div>
          </div>
        )}

        {/* Additional Files */}
        {files?.additionalFiles?.length > 0 && (
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">
              {t('추가 파일', 'Additional Files')}:
            </span>
            <div className="space-y-1">
              {files.additionalFiles.map((file: any, index: number) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{file.fileName}</span>
                  <a
                    href={file.dropboxUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-xs"
                  >
                    <Download className="w-3 h-3" />
                    {t('다운로드', 'Download')}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const sections = getSections()

  return (
    <div className="space-y-6">
      {/* Header with Copy All Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('제출 상세 정보', 'Submission Details')}
        </h3>
        <button
          onClick={() => copyToClipboard(formatAllForCopy())}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Copy className="w-4 h-4" />
          {t('전체 복사', 'Copy All')}
        </button>
      </div>

      {/* Submission Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('제출 상태', 'Submission Status')}:
            </span>
            <span className={cn(
              "px-3 py-1 rounded-full text-sm font-medium",
              submission.status === 'approved' && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
              submission.status === 'pending' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
              submission.status === 'rejected' && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
            )}>
              {submission.status === 'approved' && t('승인됨', 'Approved')}
              {submission.status === 'pending' && t('검토 중', 'Under Review')}
              {submission.status === 'rejected' && t('거절됨', 'Rejected')}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {t('제출일', 'Submitted')}: {new Date(submission.createdAt).toLocaleDateString()}
          </div>
        </div>
        {submission.adminNotes && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('관리자 노트', 'Admin Notes')}:
            </span>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{submission.adminNotes}</p>
          </div>
        )}
      </div>

      {/* Sections */}
      {sections.map((section) => {
        const isExpanded = expandedSections.includes(section.id)
        const isCopied = copiedSections.has(section.id)

        return (
          <div
            key={section.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Section Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50">
              <button
                onClick={() => toggleSection(section.id)}
                className="flex items-center gap-3 flex-1 text-left"
              >
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
                <div className="flex items-center gap-2">
                  {section.icon}
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {section.title}
                  </h4>
                </div>
              </button>
              <button
                onClick={() => copyToClipboard(formatSectionForCopy(section), section.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors",
                  isCopied 
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                )}
              >
                {isCopied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {t('복사됨', 'Copied')}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    {t('섹션 복사', 'Copy Section')}
                  </>
                )}
              </button>
            </div>

            {/* Section Content */}
            {isExpanded && (
              <div className="p-4">
                {section.id === 'files' ? (
                  renderFileSection(section)
                ) : (
                  // Regular section content
                  <dl className="grid grid-cols-1 gap-3">
                    {Object.entries(section.data).map(([key, value]) => {
                      if (value === null || value === undefined || value === '') return null
                      
                      return (
                        <div key={key} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {key}:
                          </dt>
                          <dd className="text-sm text-gray-900 dark:text-gray-100 font-mono select-all">
                            {formatValue(value)}
                          </dd>
                        </div>
                      )
                    })}
                  </dl>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Validation Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          {t('제출 검증 상태', 'Submission Validation Status')}
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm">{t('모든 필수 메타데이터 필드 입력됨', 'All required metadata fields present')}</span>
          </div>
          <div className="flex items-center gap-2">
            {submission.files?.coverImageUrl ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm">{t('커버 아트 업로드됨', 'Cover art uploaded')}</span>
          </div>
          <div className="flex items-center gap-2">
            {submission.files?.audioFiles?.length === submission.tracks?.length ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            )}
            <span className="text-sm">
              {t('오디오 파일', 'Audio files')}: {submission.files?.audioFiles?.length || 0} / {submission.tracks?.length || 0} {t('트랙', 'tracks')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {submission.album?.dolbyAtmos ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Info className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm">
              Dolby Atmos: {submission.album?.dolbyAtmos ? t('지원', 'Supported') : t('미지원', 'Not supported')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubmissionDetailView