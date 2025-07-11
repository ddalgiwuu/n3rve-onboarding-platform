import { useState, useEffect } from 'react'
import { CheckCircle, AlertTriangle, Info, Music, User, Disc, Calendar, Globe, Shield, Tag, ChevronDown, ChevronRight, FileText, Clock, Volume2, Star, AlertCircle } from 'lucide-react'
import { t } from '@/store/language.store'
import type { SubmissionData } from '../ReleaseSubmission'
import AdminEmailPreview from '@/components/submission/AdminEmailPreview'
import { validateSubmission, type QCValidationResults } from '@/utils/fugaQCValidation'
import QCWarnings, { QCStatusBadge } from '@/components/submission/QCWarnings'

interface Props {
  data: Partial<SubmissionData>
  onNext: (data: { confirmed: boolean }) => void
  onPrevious: () => void
  isSubmitting?: boolean
}

interface ValidationIssue {
  type: 'error' | 'warning' | 'info'
  field: string
  message: string
}

export default function Step6Confirmation({ data, onNext, onPrevious, isSubmitting }: Props) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['artist', 'album', 'tracks', 'release'])
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [qcResults, setQcResults] = useState<QCValidationResults | null>(null)

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
          message: t('validation.noTitleTrack')
        })
      }
      if (titleTracks.length > 1) {
        issues.push({
          type: 'warning',
          field: 'tracks',
          message: t('validation.multipleTitleTracks')
        })
      }

      // ISRC 중복 검사
      const isrcCodes = trackList.filter(t => t.isrc).map(t => t.isrc)
      const duplicateIsrc = isrcCodes.find((code, index) => isrcCodes.indexOf(code) !== index)
      if (duplicateIsrc) {
        issues.push({
          type: 'error',
          field: 'tracks',
          message: t('validation.duplicateIsrc')
        })
      }

      // Explicit content 경고
      const hasExplicit = trackList.some(t => t.explicitContent)
      if (hasExplicit && data.release?.parentalAdvisory === 'none') {
        issues.push({
          type: 'warning',
          field: 'release',
          message: t('validation.explicitContentWarning')
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
          message: t('validation.shortReleaseNotice')
        })
      }

      // Pre-order 검증
      if (data.release.preOrderEnabled && data.release.preOrderDate) {
        const preOrderDate = new Date(data.release.preOrderDate)
        if (preOrderDate >= consumerDate) {
          issues.push({
            type: 'error',
            field: 'release',
            message: t('validation.invalidPreOrderDate')
          })
        }
      }
    }

    // 파일 검증
    if (!data.files?.coverImage) {
      issues.push({
        type: 'error',
        field: 'files',
        message: t('validation.noCoverImage')
      })
    }

    const trackCount = data.tracks?.tracks?.length || data.tracks?.length || 0
    if (!data.files?.audioFiles || data.files.audioFiles.length !== trackCount) {
      issues.push({
        type: 'error',
        field: 'files',
        message: t('validation.audioFilesMismatch')
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
    return genres.map(g => t(`genre.${g}`)).join(', ')
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
    return distributors.map(d => dspMap[d] || d).join(', ')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('onboarding.step6')}</h2>
          <p className="text-gray-600 dark:text-gray-400">{t('text.onboarding.step6.description')}</p>
        </div>

        {/* FUGA QC Report */}
        {qcResults && (hasQcErrors || hasQcWarnings || qcResults.info.length > 0) && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-n3rve-50 to-pink-50 dark:from-n3rve-900/20 dark:to-pink-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-n3rve-main" />
                    {t('qc.report.title')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('qc.report.subtitle')}
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
                    {t('qc.report.errors')} ({qcResults.errors.length})
                  </h4>
                  <QCWarnings results={qcResults.errors} />
                </div>
              )}
              
              {qcResults.warnings.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {t('qc.report.warnings')} ({qcResults.warnings.length})
                  </h4>
                  <QCWarnings results={qcResults.warnings} />
                </div>
              )}
              
              {qcResults.info.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    {t('qc.report.info')} ({qcResults.info.length})
                  </h4>
                  <QCWarnings results={qcResults.info} />
                </div>
              )}
              
              {qcResults.errors.length === 0 && qcResults.warnings.length === 0 && qcResults.info.length === 0 && (
                <div className="text-center py-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-green-700 dark:text-green-300 font-medium">
                    {t('qc.report.noIssues')}
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
                      {t('validation.errorsFound')}
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
                      {t('validation.warningsFound')}
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
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('section.artistInfo')}</h3>
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('artist.nameKo')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{data.artist.nameKo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('artist.nameEn')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{data.artist.nameEn}</p>
                </div>
                {data.artist.labelName && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('artist.labelName')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{data.artist.labelName}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('artist.genre')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatGenres(data.artist.genre)}</p>
                </div>
              </div>
              {data.artist.biography && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('artist.biography')}</p>
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
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('admin.submissions.modal.albumInfo')}</h3>
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('album.titleKo')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{data.album.titleKo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('album.titleEn')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{data.album.titleEn}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('album.type')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{t(`album.type.${data.album.type}`)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('album.releaseDate')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{data.album.releaseDate}</p>
                </div>
              </div>
              {data.album.description && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('album.description')}</p>
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
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('admin.submissions.modal.trackInfo')}</h3>
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
                              {t('track.titleTrack')}
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
                            {t(`track.version.${track.trackVersion}`)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">{t('track.composer')}</p>
                        <p className="text-gray-900 dark:text-white">{track.composer}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">{t('track.lyricist')}</p>
                        <p className="text-gray-900 dark:text-white">{track.lyricist}</p>
                      </div>
                      {track.arranger && (
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">{t('track.arranger')}</p>
                          <p className="text-gray-900 dark:text-white">{track.arranger}</p>
                        </div>
                      )}
                      {track.featuring && (
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">{t('track.featuring')}</p>
                          <p className="text-gray-900 dark:text-white">{track.featuring}</p>
                        </div>
                      )}
                    </div>

                    {(track.isrc || track.previewStart !== undefined) && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {track.isrc && (
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">{t('track.isrc')}</p>
                            <p className="text-gray-900 dark:text-white font-mono text-xs">{track.isrc}</p>
                          </div>
                        )}
                        {track.previewStart !== undefined && (
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">{t('track.previewSettings')}</p>
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
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('admin.submissions.modal.releaseInfo')}</h3>
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('release.distributors')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDistributors(data.release.distributors)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('release.priceType')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {t(`release.${data.release.priceType}`)}
                    {data.release.priceType === 'paid' && data.release.price && ` (₩${data.release.price})`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('release.originalReleaseDate')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{data.release.originalReleaseDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('release.consumerReleaseDate')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{data.release.consumerReleaseDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('release.cRights')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">Ⓒ {data.release.copyrightYear} {data.release.cRights}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('release.pRights')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">Ⓟ {data.release.copyrightYear} {data.release.pRights}</p>
                </div>
              </div>

              {data.release.parentalAdvisory && data.release.parentalAdvisory !== 'none' && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium text-amber-900 dark:text-amber-100">
                      {t('release.parentalAdvisory')}:
                    </span>{' '}
                    <span className="text-amber-800 dark:text-amber-200">
                      {t(`release.parentalAdvisory.${data.release.parentalAdvisory}`)}
                    </span>
                  </p>
                </div>
              )}

              {data.release.preOrderEnabled && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      {t('release.preOrder')}:
                    </span>{' '}
                    <span className="text-blue-800 dark:text-blue-200">
                      {t('release.preOrderDate')}: {data.release.preOrderDate}
                    </span>
                  </p>
                </div>
              )}

              {data.release.previouslyReleased && (
                <div className="p-3 bg-n3rve-50 dark:bg-n3rve-900/20 rounded-lg">
                  <p className="text-sm font-medium text-n3rve-900 dark:text-n3rve-100 mb-1">
                    {t('release.previouslyReleased')}
                  </p>
                  <p className="text-sm text-n3rve-800 dark:text-n3rve-200">
                    {t('release.previousReleaseDate')}: {data.release.previousReleaseDate}
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
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('release.albumIntroduction')}</p>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{data.release.albumIntroduction}</p>
                </div>
              )}

              {data.release.dspProfileUpdate?.updateProfile && (
                <div className="mt-4 p-3 bg-n3rve-50 dark:bg-n3rve-900/20 rounded-lg">
                  <p className="text-sm font-medium text-n3rve-900 dark:text-n3rve-100">
                    {t('release.dspProfileUpdate')}
                  </p>
                  <p className="text-sm text-n3rve-800 dark:text-n3rve-200 mt-1">
                    {t('release.dspProfileUpdate.checkbox')}
                  </p>
                </div>
              )}

              {data.release.koreanDSP && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                    {t('release.koreanDSP')}
                  </p>
                  <div className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                    {data.release.koreanDSP.lyricsAttached && (
                      <p>• {t('release.lyricsAttached')}</p>
                    )}
                    {data.release.koreanDSP.newArtist && (
                      <p>• {t('release.koreanDSP.newArtist')}</p>
                    )}
                    {(data.release.koreanDSP.melonLink || data.release.koreanDSP.genieLink || 
                      data.release.koreanDSP.bugsLink || data.release.koreanDSP.vibeLink) && (
                      <p>• {t('release.koreanDSP.artistPageLinks')}</p>
                    )}
                    {data.release.koreanDSP.translation?.hasTranslation && (
                      <p>• {t('release.translation')}</p>
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
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('confirmation.fileInfo')}</h3>
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
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('upload.coverImage')}</p>
                  <div className="flex items-center gap-2">
                    {data.files.coverImage ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-green-700 dark:text-green-400">{t('confirmation.uploaded')}</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <span className="text-red-700 dark:text-red-400">{t('confirmation.notUploaded')}</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('upload.audioFiles')}</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-700 dark:text-green-400">
                      {data.files.audioFiles?.length || 0} {t('confirmation.filesUploaded')}
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
                  {t('confirmation.termsAcceptance')}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('confirmation.termsDescription')}
                </p>
                <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <p>• {t('confirmation.term1')}</p>
                  <p>• {t('confirmation.term2')}</p>
                  <p>• {t('confirmation.term3')}</p>
                  <p>• {t('confirmation.term4')}</p>
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
                {t('qc.report.fixRequired')}
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
            {isSubmitting ? t('confirmation.submitting') : t('confirmation.submitRelease')}
          </button>
        </div>
      </div>
    </form>
  )
}