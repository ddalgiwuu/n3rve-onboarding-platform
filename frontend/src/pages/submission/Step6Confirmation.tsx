import { useState, useEffect } from 'react'
import { CheckCircle, AlertTriangle, Info, Music, User, Disc, Calendar, Shield, ChevronDown, ChevronRight, FileText, Star, AlertCircle } from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'
import type { SubmissionData } from '../ReleaseSubmission'
import AdminEmailPreview from '@/components/submission/AdminEmailPreview'
import { validateSubmission, type QCValidationResults } from '@/utils/fugaQCValidation'
import QCWarnings, { QCStatusBadge } from '@/components/submission/QCWarnings'

interface Props {
  data: Partial<SubmissionData>
  onNext: (data: { confirmed: boolean }) => void
  isSubmitting?: boolean
}

interface ValidationIssue {
  type: 'error' | 'warning' | 'info'
  field: string
  message: string
}

export default function Step6Confirmation({ data, onNext, isSubmitting }: Props) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['artist', 'album', 'tracks', 'release'])
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [qcResults, setQcResults] = useState<QCValidationResults | null>(null)
  const language = useLanguageStore((state: any) => state.language)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  useEffect(() => {
    // 검증 로직
    const issues: ValidationIssue[] = []

    // 트랙 검증
    const trackList = data.tracks?.tracks || data.tracks
    if (Array.isArray(trackList)) {
      const titleTracks = trackList.filter(t => t.isTitle)
      if (titleTracks.length === 0) {
        issues.push({
          type: 'error',
          field: 'tracks',
          message: t('타이틀 트랙이 선택되지 않았습니다', 'No title track selected')
        })
      }
      if (titleTracks.length > 1) {
        issues.push({
          type: 'warning',
          field: 'tracks',
          message: t('여러 개의 타이틀 트랙이 선택되었습니다', 'Multiple title tracks selected')
        })
      }

      // ISRC 중복 검사
      const isrcCodes = trackList.filter(t => t.isrc).map(t => t.isrc)
      const duplicateIsrc = isrcCodes.find((code, index) => isrcCodes.indexOf(code) !== index)
      if (duplicateIsrc) {
        issues.push({
          type: 'error',
          field: 'tracks',
          message: t('중복된 ISRC 코드가 발견되었습니다', 'Duplicate ISRC codes found')
        })
      }

      // Explicit content 경고
      const hasExplicit = trackList.some(t => t.explicitContent)
      if (hasExplicit && data.release?.parentalAdvisory === 'none') {
        issues.push({
          type: 'warning',
          field: 'release',
          message: t('성인 콘텐츠가 감지되었지만 보호자 경고가 설정되지 않았습니다', 'Explicit content detected but parental advisory is set to none')
        })
      }
    }

    // 발매일 검증
    if (data.release) {
      const today = new Date()
      const consumerDate = new Date(data.release.consumerReleaseDate)
      const daysDiff = Math.ceil((consumerDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff < 14) {
        issues.push({
          type: 'warning',
          field: 'release',
          message: t('발매일이 오늘로부터 14일 미만입니다', 'Release date is less than 14 days from today')
        })
      }

      // Pre-order 검증
      if (data.release.preOrderEnabled && data.release.preOrderDate) {
        const preOrderDate = new Date(data.release.preOrderDate)
        if (preOrderDate >= consumerDate) {
          issues.push({
            type: 'error',
            field: 'release',
            message: t('사전 주문 날짜는 발매일 이전이어야 합니다', 'Pre-order date must be before release date')
          })
        }
      }
    }

    // 파일 검증
    if (!data.files?.coverImage) {
      issues.push({
        type: 'error',
        field: 'files',
        message: t('커버 이미지가 필요합니다', 'Cover image is required')
      })
    }

    const trackCount = data.tracks?.tracks?.length || data.tracks?.length || 0
    if (!data.files?.audioFiles || data.files.audioFiles.length !== trackCount) {
      issues.push({
        type: 'error',
        field: 'files',
        message: t('오디오 파일 수가 트랙 수와 일치하지 않습니다', 'Number of audio files does not match track count')
      })
    }

    setValidationIssues(issues)
    
    // Run FUGA QC validation
    const qcValidation = validateSubmission(data)
    setQcResults(qcValidation)
  }, [data])

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const hasErrors = validationIssues.some(issue => issue.type === 'error') || (qcResults?.errors.length ?? 0) > 0
  const hasWarnings = validationIssues.some(issue => issue.type === 'warning') || (qcResults?.warnings.length ?? 0) > 0
  const hasQcErrors = (qcResults?.errors.length ?? 0) > 0
  const hasQcWarnings = (qcResults?.warnings.length ?? 0) > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasErrors && termsAccepted) {
      onNext({ confirmed: true })
    }
  }

  const formatGenres = (genres: string[]) => {
    return genres.map(g => {
      // Genre translations
      const genreTranslations: Record<string, { ko: string; en: string }> = {
        'pop': { ko: '팝', en: 'Pop' },
        'rock': { ko: '록', en: 'Rock' },
        'hiphop': { ko: '힙합', en: 'Hip-Hop' },
        'rnb': { ko: 'R&B', en: 'R&B' },
        'electronic': { ko: '일렉트로닉', en: 'Electronic' },
        'dance': { ko: '댄스', en: 'Dance' },
        'indie': { ko: '인디', en: 'Indie' },
        'jazz': { ko: '재즈', en: 'Jazz' },
        'classical': { ko: '클래식', en: 'Classical' },
        'folk': { ko: '포크', en: 'Folk' },
        'metal': { ko: '메탈', en: 'Metal' },
        'alternative': { ko: '얼터너티브', en: 'Alternative' },
        'country': { ko: '컨트리', en: 'Country' },
        'soul': { ko: '소울', en: 'Soul' },
        'funk': { ko: '펑크', en: 'Funk' },
        'reggae': { ko: '레게', en: 'Reggae' },
        'blues': { ko: '블루스', en: 'Blues' },
        'latin': { ko: '라틴', en: 'Latin' },
        'world': { ko: '월드', en: 'World' },
        'ambient': { ko: '앰비언트', en: 'Ambient' }
      }
      const translation = genreTranslations[g]
      return translation ? t(translation.ko, translation.en) : g
    }).join(', ')
  }

  const formatDistributors = (distributors: string[]) => {
    const dspMap: Record<string, string> = {
      spotify: 'Spotify',
      apple: 'Apple Music',
      youtube: 'YouTube Music',
      melon: 'Melon',
      genie: 'Genie',
      bugs: 'Bugs',
      flo: 'FLO',
      vibe: 'VIBE',
      tiktok: 'TikTok',
      instagram: 'Instagram'
    }
    return distributors.map((d: string) => dspMap[d] || d).join(', ')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('온보딩 단계 6', 'Step 6')}</h2>
          <p className="text-gray-600 dark:text-gray-400">{t('발매 신청 전 모든 정보를 검토해 주세요.', 'Please review all information before submitting your release.')}</p>
        </div>

        {/* FUGA QC Report */}
        {qcResults && (hasQcErrors || hasQcWarnings || qcResults.info.length > 0) && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-n3rve-50 to-pink-50 dark:from-n3rve-900/20 dark:to-pink-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-n3rve-main" />
                    {t('FUGA QC 리포트', 'FUGA QC Report')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('자동 품질 관리 분석 결과', 'Automatic quality control analysis results')}
                  </p>
                </div>
                <QCStatusBadge errors={qcResults.errors.length} warnings={qcResults.warnings.length} />
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {qcResults.errors.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {t('오류', 'Errors')} ({qcResults.errors.length})
                  </h4>
                  <QCWarnings results={qcResults.errors} />
                </div>
              )}
              
              {qcResults.warnings.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {t('경고', 'Warnings')} ({qcResults.warnings.length})
                  </h4>
                  <QCWarnings results={qcResults.warnings} />
                </div>
              )}
              
              {qcResults.info.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    {t('정보', 'Information')} ({qcResults.info.length})
                  </h4>
                  <QCWarnings results={qcResults.info} />
                </div>
              )}
              
              {qcResults.errors.length === 0 && qcResults.warnings.length === 0 && qcResults.info.length === 0 && (
                <div className="text-center py-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-green-700 dark:text-green-300 font-medium">
                    {t('문제가 발견되지 않았습니다', 'No issues found')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 검증 결과 */}
        {validationIssues.length > 0 && (
          <div className="mb-6 space-y-3">
            {hasErrors && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                      {t('발견된 오류', 'Errors Found')}
                    </h4>
                    <ul className="space-y-1">
                      {validationIssues
                        .filter(issue => issue.type === 'error')
                        .map((issue, index) => (
                          <li key={index} className="text-sm text-red-800 dark:text-red-200">
                            • {issue.message}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {hasWarnings && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                      {t('발견된 경고', 'Warnings Found')}
                    </h4>
                    <ul className="space-y-1">
                      {validationIssues
                        .filter(issue => issue.type === 'warning')
                        .map((issue, index) => (
                          <li key={index} className="text-sm text-amber-800 dark:text-amber-200">
                            • {issue.message}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 아티스트 정보 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-4">
          <button
            type="button"
            onClick={() => toggleSection('artist')}
            className="w-full px-6 py-4 bg-gradient-to-r from-n3rve-50 to-pink-50 dark:from-n3rve-900/20 dark:to-pink-900/20 hover:from-n3rve-100 hover:to-pink-100 dark:hover:from-n3rve-900/30 dark:hover:to-pink-900/30 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-n3rve-main" />
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('아티스트 정보', 'Artist Information')}</h3>
            </div>
            {expandedSections.includes('artist') ? (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {expandedSections.includes('artist') && data.artist && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('한국어 이름', 'Korean Name')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{data.artist.nameKo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('영어 이름', 'English Name')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{data.artist.nameEn}</p>
                </div>
                {data.artist.labelName && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('레이블명', 'Label Name')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{data.artist.labelName}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('장르', 'Genre')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatGenres(data.artist.genre)}</p>
                </div>
              </div>
              {data.artist.biography && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('바이오그래피', 'Biography')}</p>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{data.artist.biography}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 앨범 정보 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-4">
          <button
            type="button"
            onClick={() => toggleSection('album')}
            className="w-full px-6 py-4 bg-gradient-to-r from-n3rve-50 to-pink-50 dark:from-n3rve-900/20 dark:to-pink-900/20 hover:from-n3rve-100 hover:to-pink-100 dark:hover:from-n3rve-900/30 dark:hover:to-pink-900/30 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Disc className="w-5 h-5 text-n3rve-main" />
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('앨범 정보', 'Album Information')}</h3>
            </div>
            {expandedSections.includes('album') ? (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {expandedSections.includes('album') && data.album && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('한국어 제목', 'Korean Title')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{data.album.titleKo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('영어 제목', 'English Title')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{data.album.titleEn}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('유형', 'Type')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{data.album.type === 'album' ? t('정규 앨범', 'Full Album') : data.album.type === 'single' ? t('싱글', 'Single') : data.album.type === 'ep' ? t('EP', 'EP') : data.album.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('발매일', 'Release Date')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{data.album.releaseDate}</p>
                </div>
              </div>
              {data.album.description && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('설명', 'Description')}</p>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{data.album.description}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 트랙 정보 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-4">
          <button
            type="button"
            onClick={() => toggleSection('tracks')}
            className="w-full px-6 py-4 bg-gradient-to-r from-n3rve-50 to-pink-50 dark:from-n3rve-900/20 dark:to-pink-900/20 hover:from-n3rve-100 hover:to-pink-100 dark:hover:from-n3rve-900/30 dark:hover:to-pink-900/30 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Music className="w-5 h-5 text-n3rve-main" />
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('트랙 정보', 'Track Information')}</h3>
            </div>
            {expandedSections.includes('tracks') ? (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {expandedSections.includes('tracks') && data.tracks && (
            <div className="p-6">
              <div className="space-y-4">
                {(data.tracks?.tracks || (Array.isArray(data.tracks) ? data.tracks : []) || []).map((track: any, index: number) => (
                  <div key={track.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-n3rve-100 dark:bg-n3rve-900/30 rounded-full flex items-center justify-center text-sm font-medium text-n3rve-main dark:text-n3rve-accent2">
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {track.titleKo} / {track.titleEn}
                          </h4>
                          {track.isTitle && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-full mt-1">
                              <Star className="w-3 h-3" />
                              {t('타이틀 트랙', 'Title Track')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {track.explicitContent && (
                          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded">
                            Explicit
                          </span>
                        )}
                        {track.trackVersion !== 'original' && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                            {track.trackVersion === 'original' ? t('오리지널', 'Original') : track.trackVersion === 'remix' ? t('리믹스', 'Remix') : track.trackVersion === 'acoustic' ? t('어쿠스틱', 'Acoustic') : track.trackVersion === 'instrumental' ? t('인스트루멘탈', 'Instrumental') : track.trackVersion === 'live' ? t('라이브', 'Live') : track.trackVersion}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">{t('작곡가', 'Composer')}</p>
                        <p className="text-gray-900 dark:text-white">{track.composer}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">{t('작사가', 'Lyricist')}</p>
                        <p className="text-gray-900 dark:text-white">{track.lyricist}</p>
                      </div>
                      {track.arranger && (
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">{t('편곡가', 'Arranger')}</p>
                          <p className="text-gray-900 dark:text-white">{track.arranger}</p>
                        </div>
                      )}
                      {track.featuring && (
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">{t('피처링', 'Featuring')}</p>
                          <p className="text-gray-900 dark:text-white">{track.featuring}</p>
                        </div>
                      )}
                    </div>

                    {(track.isrc || track.previewStart !== undefined) && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {track.isrc && (
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">{t('ISRC 코드', 'ISRC Code')}</p>
                            <p className="text-gray-900 dark:text-white font-mono text-xs">{track.isrc}</p>
                          </div>
                        )}
                        {track.previewStart !== undefined && (
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">{t('미리듣기 설정', 'Preview Settings')}</p>
                            <p className="text-gray-900 dark:text-white">
                              {track.previewStart}s - {track.previewEnd || 30}s
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 발매 정보 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-4">
          <button
            type="button"
            onClick={() => toggleSection('release')}
            className="w-full px-6 py-4 bg-gradient-to-r from-n3rve-50 to-pink-50 dark:from-n3rve-900/20 dark:to-pink-900/20 hover:from-n3rve-100 hover:to-pink-100 dark:hover:from-n3rve-900/30 dark:hover:to-pink-900/30 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-n3rve-main" />
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('발매 정보', 'Release Information')}</h3>
            </div>
            {expandedSections.includes('release') ? (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {expandedSections.includes('release') && data.release && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('유통사', 'Distributors')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDistributors(data.release.distributors)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('가격 유형', 'Price Type')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {data.release.priceType === 'free' ? t('무료', 'Free') : data.release.priceType === 'paid' ? t('유료', 'Paid') : data.release.priceType}
                    {data.release.priceType === 'paid' && data.release.price && ` (₩${data.release.price})`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('오리지널 발매일', 'Original Release Date')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{data.release.originalReleaseDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('소비자 발매일', 'Consumer Release Date')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{data.release.consumerReleaseDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('저작권 (C)', 'Copyright (C)')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">Ⓒ {data.release.copyrightYear} {data.release.cRights}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('발행권 (P)', 'Publishing Rights (P)')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">Ⓟ {data.release.copyrightYear} {data.release.pRights}</p>
                </div>
              </div>

              {data.release.parentalAdvisory && data.release.parentalAdvisory !== 'none' && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium text-amber-900 dark:text-amber-100">
                      {t('보호자 경고', 'Parental Advisory')}:
                    </span>{' '}
                    <span className="text-amber-800 dark:text-amber-200">
                      {data.release.parentalAdvisory === 'none' ? t('없음', 'None') : data.release.parentalAdvisory === 'explicit' ? t('성인 콘텐츠', 'Explicit') : data.release.parentalAdvisory === 'clean' ? t('클린', 'Clean') : data.release.parentalAdvisory}
                    </span>
                  </p>
                </div>
              )}

              {data.release.preOrderEnabled && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      {t('사전 주문', 'Pre-Order')}:
                    </span>{' '}
                    <span className="text-blue-800 dark:text-blue-200">
                      {t('사전 주문 날짜', 'Pre-Order Date')}: {data.release.preOrderDate}
                    </span>
                  </p>
                </div>
              )}

              {data.release.previouslyReleased && (
                <div className="p-3 bg-n3rve-50 dark:bg-n3rve-900/20 rounded-lg">
                  <p className="text-sm font-medium text-n3rve-900 dark:text-n3rve-100 mb-1">
                    {t('이전 발매', 'Previously Released')}
                  </p>
                  <p className="text-sm text-n3rve-800 dark:text-n3rve-200">
                    {t('이전 발매일', 'Previous Release Date')}: {data.release.previousReleaseDate}
                  </p>
                  {data.release.previousReleaseInfo && (
                    <p className="text-sm text-n3rve-800 dark:text-n3rve-200 mt-1">
                      {data.release.previousReleaseInfo}
                    </p>
                  )}
                </div>
              )}

              {data.release.albumIntroduction && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('앨범 소개', 'Album Introduction')}</p>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{data.release.albumIntroduction}</p>
                </div>
              )}

              {data.release.dspProfileUpdate?.updateProfile && (
                <div className="mt-4 p-3 bg-n3rve-50 dark:bg-n3rve-900/20 rounded-lg">
                  <p className="text-sm font-medium text-n3rve-900 dark:text-n3rve-100">
                    {t('DSP 프로필 업데이트', 'DSP Profile Update')}
                  </p>
                  <p className="text-sm text-n3rve-800 dark:text-n3rve-200 mt-1">
                    {t('DSP 플랫폼에서 아티스트 프로필 업데이트 요청', 'Request artist profile update on DSP platforms')}
                  </p>
                </div>
              )}

              {data.release.koreanDSP && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                    {t('한국 DSP 설정', 'Korean DSP Settings')}
                  </p>
                  <div className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                    {data.release.koreanDSP.lyricsAttached && (
                      <p>• {t('가사 첨부됨', 'Lyrics attached')}</p>
                    )}
                    {data.release.koreanDSP.newArtist && (
                      <p>• {t('신인 아티스트 등록', 'New artist registration')}</p>
                    )}
                    {(data.release.koreanDSP.melonLink || data.release.koreanDSP.genieLink || 
                      data.release.koreanDSP.bugsLink || data.release.koreanDSP.vibeLink) && (
                      <p>• {t('아티스트 페이지 링크 제공됨', 'Artist page links provided')}</p>
                    )}
                    {data.release.koreanDSP.translation?.hasTranslation && (
                      <p>• {t('번역 정보 제공됨', 'Translation information provided')}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 파일 정보 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          <button
            type="button"
            onClick={() => toggleSection('files')}
            className="w-full px-6 py-4 bg-gradient-to-r from-n3rve-50 to-pink-50 dark:from-n3rve-900/20 dark:to-pink-900/20 hover:from-n3rve-100 hover:to-pink-100 dark:hover:from-n3rve-900/30 dark:hover:to-pink-900/30 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-n3rve-main" />
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('파일 정보', 'File Information')}</h3>
            </div>
            {expandedSections.includes('files') ? (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {expandedSections.includes('files') && data.files && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('커버 이미지', 'Cover Image')}</p>
                  <div className="flex items-center gap-2">
                    {data.files.coverImage ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-green-700 dark:text-green-400">{t('업로드됨', 'Uploaded')}</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <span className="text-red-700 dark:text-red-400">{t('업로드되지 않음', 'Not Uploaded')}</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('오디오 파일', 'Audio Files')}</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-700 dark:text-green-400">
                      {data.files.audioFiles?.length || 0} {t('개 파일 업로드됨', 'files uploaded')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Korean DSP Email Preview */}
        {data.release?.koreanDSP && 
          data.release.distributors?.some(d => ['melon', 'genie', 'bugs', 'flo', 'vibe'].includes(d)) && (
          <div className="mb-6">
            <AdminEmailPreview data={data} />
          </div>
        )}

        {/* 약관 동의 */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 text-n3rve-main rounded focus:ring-n3rve-accent"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {t('이용약관 동의', 'Terms and Conditions Agreement')}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('이 박스를 체크함으로써 다음 약관에 동의합니다.', 'By checking this box, you agree to the following terms and conditions.')}
                </p>
                <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <p>• {t('제공된 모든 정보가 정확하고 완전함을 확인합니다.', 'I confirm that all provided information is accurate and complete.')}</p>
                  <p>• {t('이 콘텐츠를 배포할 권한이 있습니다.', 'I have the rights to distribute this content.')}</p>
                  <p>• {t('검토 과정이 영업일 기준 7-14일 소요될 수 있음을 이해합니다.', 'I understand that the review process may take 7-14 business days.')}</p>
                  <p>• {t('서비스 이용약관 및 개인정보 보호정책에 동의합니다.', 'I agree to the terms of service and privacy policy.')}</p>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 pt-6">
        {hasQcErrors && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {t('제출하기 전에 위의 오류를 수정해 주세요.', 'Please fix the errors above before submitting.')}
              </p>
            </div>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={hasErrors || !termsAccepted || isSubmitting}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t('제출 중...', 'Submitting...') : t('발매 신청', 'Submit Release')}
          </button>
        </div>
      </div>
    </form>
  )
}