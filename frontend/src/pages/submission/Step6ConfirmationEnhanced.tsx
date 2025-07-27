import { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  Info,
  Music,
  User,
  Disc,
  Calendar,
  Shield,
  ChevronDown,
  ChevronRight,
  FileText,
  Star,
  AlertCircle,
  Megaphone,
  Target,
  Globe,
  Hash,
  Folder,
  Image,
  Film,
  FileAudio,
  Type
} from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
import type { SubmissionData } from '@/services/submission.service';
import AdminEmailPreview from '@/components/submission/AdminEmailPreview';
import { validateSubmission, type QCValidationResults } from '@/utils/fugaQCValidation';
import QCWarnings, { QCStatusBadge } from '@/components/submission/QCWarnings';
import { CAMPAIGN_GOALS, MOODS, INSTRUMENTS, PROJECT_TYPES, PRIORITY_LEVELS } from '@/constants/marketingData';
import { dspList } from '@/constants/dspList';

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

export default function Step6ConfirmationEnhanced({ data, onNext, isSubmitting }: Props) {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'artist', 'album', 'tracks', 'release', 'files', 'marketing', 'goals', 'distribution'
  ]);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [qcResults, setQcResults] = useState<QCValidationResults | null>(null);
  const language = useLanguageStore((state: any) => state.language) || 'ko';
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  useEffect(() => {
    // Validation logic remains the same
    const issues: ValidationIssue[] = [];

    // Track validation
    const trackList = (data as any).tracks?.tracks || (data as any).tracks;
    if (Array.isArray(trackList)) {
      const titleTracks = trackList.filter(t => t.isTitle);
      if (titleTracks.length === 0) {
        issues.push({
          type: 'error',
          field: 'tracks',
          message: t('타이틀 트랙이 선택되지 않았습니다', 'No title track selected')
        });
      }
      if (titleTracks.length > 1) {
        issues.push({
          type: 'warning',
          field: 'tracks',
          message: t('여러 개의 타이틀 트랙이 선택되었습니다', 'Multiple title tracks selected')
        });
      }

      // ISRC duplicate check
      const isrcCodes = trackList.filter(t => t.isrc).map(t => t.isrc);
      const duplicateIsrc = isrcCodes.find((code, index) => isrcCodes.indexOf(code) !== index);
      if (duplicateIsrc) {
        issues.push({
          type: 'error',
          field: 'tracks',
          message: t('중복된 ISRC 코드가 발견되었습니다', 'Duplicate ISRC codes found')
        });
      }

      // Explicit content warning
      const hasExplicit = trackList.some(t => t.explicitContent);
      if (hasExplicit && data.release?.parentalAdvisory === 'none') {
        issues.push({
          type: 'warning',
          field: 'release',
          message: t('성인 콘텐츠가 감지되었지만 보호자 경고가 설정되지 않았습니다', 'Explicit content detected but parental advisory is set to none')
        });
      }
    }

    // Release date validation
    if (data.release) {
      const today = new Date();
      const consumerDate = new Date(data.release.consumerReleaseDate);
      const daysDiff = Math.ceil((consumerDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff < 14) {
        issues.push({
          type: 'warning',
          field: 'release',
          message: t('발매일이 오늘로부터 14일 미만입니다', 'Release date is less than 14 days from today')
        });
      }

      // Pre-order validation
      if (data.release.preOrderEnabled && data.release.preOrderDate) {
        const preOrderDate = new Date(data.release.preOrderDate);
        if (preOrderDate >= consumerDate) {
          issues.push({
            type: 'error',
            field: 'release',
            message: t('사전 주문 날짜는 발매일 이전이어야 합니다', 'Pre-order date must be before release date')
          });
        }
      }
    }

    setValidationIssues(issues);
  }, [data, t]);

  useEffect(() => {
    // Run FUGA QC validation
    if (data) {
      const results = validateSubmission(data, language);
      setQcResults(results);
    }
  }, [data, language]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasErrors && termsAccepted) {
      onNext({ confirmed: true });
    }
  };

  const hasErrors = validationIssues.some(issue => issue.type === 'error');
  const hasWarnings = validationIssues.some(issue => issue.type === 'warning');
  const hasQcErrors = qcResults?.errors.length ?? 0 > 0;
  const hasQcWarnings = qcResults?.warnings.length ?? 0 > 0;

  const formatGenres = (genres: string | string[] | undefined) => {
    if (!genres) return t('미지정', 'Not specified');
    if (Array.isArray(genres)) return genres.join(', ');
    return genres;
  };

  const formatDistributors = (distributors: string[] | undefined) => {
    if (!distributors || distributors.length === 0) return t('미지정', 'Not specified');
    return distributors.map(d => {
      const dsp = dspList.find(item => item.id === d);
      return dsp?.name || d;
    }).join(', ');
  };

  const getProjectTypeLabel = (value: string) => {
    return PROJECT_TYPES.find(type => type.value === value)?.label || value;
  };

  const getPriorityLabel = (value: number) => {
    return PRIORITY_LEVELS.find(level => level.value === value)?.label || value;
  };

  const getMoodLabel = (value: string) => {
    return MOODS.find(mood => mood.value === value)?.label || value;
  };

  const getInstrumentLabel = (value: string) => {
    return INSTRUMENTS.find(instrument => instrument.value === value)?.label || value;
  };

  const getGoalLabel = (goalType: string) => {
    return CAMPAIGN_GOALS.find(g => g.value === goalType)?.label || goalType;
  };

  const formData = data as any;

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('최종 검토', 'Final Review')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('제출하기 전에 모든 정보를 확인해 주세요', 'Please review all information before submitting')}
        </p>
      </div>

      <div className="space-y-4">
        {/* FUGA QC Report - Same as before */}
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
            </div>
          </div>
        )}

        {/* Album Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
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

          {expandedSections.includes('album') && formData && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('앨범 제목', 'Album Title')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formData.albumTitle || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('아티스트', 'Artists')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formData.albumArtists?.map((a: any) => a.name).join(', ') || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('릴리즈 타입', 'Release Type')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formData.releaseType === 'single' ? t('싱글', 'Single') :
                      formData.releaseType === 'ep' ? 'EP' :
                        formData.releaseType === 'album' ? t('정규', 'Album') : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('장르', 'Genre')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formData.primaryGenre || '-'}
                    {formData.primarySubgenre && ` / ${formData.primarySubgenre}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('언어', 'Language')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formData.language || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('레이블', 'Label')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formData.label || '-'}</p>
                </div>
              </div>

              {formData.albumNote && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('앨범 노트', 'Album Note')}</p>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{formData.albumNote}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Track Information - Same as before */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('tracks')}
            className="w-full px-6 py-4 bg-gradient-to-r from-n3rve-50 to-pink-50 dark:from-n3rve-900/20 dark:to-pink-900/20 hover:from-n3rve-100 hover:to-pink-100 dark:hover:from-n3rve-900/30 dark:hover:to-pink-900/30 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Music className="w-5 h-5 text-n3rve-main" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t('트랙 정보', 'Track Information')} ({formData.tracks?.length || 0})
              </h3>
            </div>
            {expandedSections.includes('tracks') ? (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {expandedSections.includes('tracks') && formData.tracks && (
            <div className="p-6">
              <div className="space-y-4">
                {formData.tracks.map((track: any, index: number) => (
                  <div key={track.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-n3rve-100 dark:bg-n3rve-900/30 rounded-full flex items-center justify-center text-sm font-medium text-n3rve-main dark:text-n3rve-accent2">
                          {track.trackNumber || index + 1}
                        </span>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {track.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {track.artists?.map((a: any) => a.name).join(', ')}
                          </p>
                          {track.isTitle && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-full mt-1">
                              <Star className="w-3 h-3" />
                              {t('타이틀 트랙', 'Title Track')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {track.dolbyAtmos && (
                          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded">
                            Dolby Atmos
                          </span>
                        )}
                        {track.explicitContent && (
                          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded">
                            Explicit
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Files Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
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

          {expandedSections.includes('files') && formData && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Image className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('커버 아트', 'Cover Art')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formData.coverArt ?
                        <span className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          {formData.coverArt.name}
                        </span> :
                        <span className="text-gray-400">{t('없음', 'None')}</span>
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FileAudio className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('오디오 파일', 'Audio Files')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formData.audioFiles?.length || 0} {t('개 파일', 'files')}
                    </p>
                  </div>
                </div>

                {formData.dolbyAtmosFiles && formData.dolbyAtmosFiles.length > 0 && (
                  <div className="flex items-center gap-3">
                    <FileAudio className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('Dolby Atmos 파일', 'Dolby Atmos Files')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formData.dolbyAtmosFiles.length} {t('개 파일', 'files')}
                      </p>
                    </div>
                  </div>
                )}

                {formData.motionArtFile && (
                  <div className="flex items-center gap-3">
                    <Film className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('모션 아트', 'Motion Art')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formData.motionArtFile.name}
                      </p>
                    </div>
                  </div>
                )}

                {formData.lyricsFiles && formData.lyricsFiles.length > 0 && (
                  <div className="flex items-center gap-3">
                    <Type className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('가사 파일', 'Lyrics Files')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formData.lyricsFiles.length} {t('개 파일', 'files')}
                      </p>
                    </div>
                  </div>
                )}

                {formData.marketingAssets && formData.marketingAssets.length > 0 && (
                  <div className="flex items-center gap-3">
                    <Folder className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('마케팅 자료', 'Marketing Assets')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formData.marketingAssets.length} {t('개 파일', 'files')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Marketing Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('marketing')}
            className="w-full px-6 py-4 bg-gradient-to-r from-n3rve-50 to-pink-50 dark:from-n3rve-900/20 dark:to-pink-900/20 hover:from-n3rve-100 hover:to-pink-100 dark:hover:from-n3rve-900/30 dark:hover:to-pink-900/30 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Megaphone className="w-5 h-5 text-n3rve-main" />
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('마케팅 정보', 'Marketing Information')}</h3>
            </div>
            {expandedSections.includes('marketing') ? (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {expandedSections.includes('marketing') && formData.marketingInfo && (
            <div className="p-6 space-y-6">
              {/* Project Context */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('프로젝트 타입', 'Project Type')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {getProjectTypeLabel(formData.marketingInfo.projectType)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('우선순위', 'Priority Level')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {getPriorityLabel(formData.marketingInfo.priorityLevel)}
                  </p>
                </div>
              </div>

              {/* Music Characteristics */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('음악 특성', 'Music Characteristics')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('무드', 'Moods')}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.marketingInfo.moods?.map((mood: string) => (
                        <span key={mood} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
                          {getMoodLabel(mood)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('악기', 'Instruments')}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.marketingInfo.instruments?.map((instrument: string) => (
                        <span key={instrument} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                          {getInstrumentLabel(instrument)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Elevator Pitch */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('엘리베이터 피치', 'Elevator Pitch')}
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('Hook', 'Hook')}</p>
                    <p className="text-gray-900 dark:text-white">{formData.marketingInfo.hook}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('메인 피치', 'Main Pitch')}</p>
                    <p className="text-gray-900 dark:text-white">{formData.marketingInfo.mainPitch}</p>
                  </div>
                </div>
              </div>

              {/* Marketing Drivers */}
              {formData.marketingInfo.marketingDrivers && formData.marketingInfo.marketingDrivers.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('마케팅 드라이버', 'Marketing Drivers')}
                  </h4>
                  <ul className="space-y-1">
                    {formData.marketingInfo.marketingDrivers.map((driver: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-gray-900 dark:text-white">
                        <span className="text-purple-600 mt-0.5">•</span>
                        <span>{driver}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Social Media Plan */}
              {formData.marketingInfo.socialMediaPlan && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('소셜 미디어 계획', 'Social Media Plan')}
                  </h4>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {formData.marketingInfo.socialMediaPlan}
                  </p>
                </div>
              )}

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.marketingInfo.targetAudience && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('타겟 청중', 'Target Audience')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formData.marketingInfo.targetAudience}</p>
                  </div>
                )}
                {formData.marketingInfo.artistGender && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('아티스트 성별', 'Artist Gender')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formData.marketingInfo.artistGender === 'male' ? t('남성', 'Male') :
                        formData.marketingInfo.artistGender === 'female' ? t('여성', 'Female') :
                          formData.marketingInfo.artistGender === 'non-binary' ? t('논바이너리', 'Non-binary') :
                            t('기타', 'Other')}
                    </p>
                  </div>
                )}
              </div>

              {/* Social Media Links */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  {t('소셜 미디어 링크', 'Social Media Links')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {formData.marketingInfo.youtubeUrl && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">YouTube:</span>
                      <a href={formData.marketingInfo.youtubeUrl} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm truncate">
                        {formData.marketingInfo.youtubeUrl}
                      </a>
                    </div>
                  )}
                  {formData.marketingInfo.tiktokUrl && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">TikTok:</span>
                      <a href={formData.marketingInfo.tiktokUrl} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm truncate">
                        {formData.marketingInfo.tiktokUrl}
                      </a>
                    </div>
                  )}
                  {formData.marketingInfo.xUrl && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">X:</span>
                      <a href={formData.marketingInfo.xUrl} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm truncate">
                        {formData.marketingInfo.xUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Goals & Expectations - Only show if priority is 5 */}
        {formData.marketingInfo?.priorityLevel === 5 && formData.marketingInfo?.campaignGoals && formData.marketingInfo.campaignGoals.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('goals')}
              className="w-full px-6 py-4 bg-gradient-to-r from-n3rve-50 to-pink-50 dark:from-n3rve-900/20 dark:to-pink-900/20 hover:from-n3rve-100 hover:to-pink-100 dark:hover:from-n3rve-900/30 dark:hover:to-pink-900/30 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-n3rve-main" />
                <h3 className="font-semibold text-gray-900 dark:text-white">{t('목표 및 기대사항', 'Goals & Expectations')}</h3>
              </div>
              {expandedSections.includes('goals') ? (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {expandedSections.includes('goals') && (
              <div className="p-6 space-y-4">
                {formData.marketingInfo.campaignGoals.map((goal: any, index: number) => {
                  const goalDefinition = CAMPAIGN_GOALS.find(g => g.value === goal.goalType);
                  if (!goal.goalType) return null;

                  return (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {t(`목표 ${index + 1}`, `Goal ${index + 1}`)}: {getGoalLabel(goal.goalType)}
                        </h4>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {t('확신도', 'Confidence')}: {goal.confidence}%
                        </span>
                      </div>

                      {goalDefinition && goal.responses && (
                        <div className="space-y-2">
                          {goalDefinition.questions.map((question, qIndex) => (
                            goal.responses[qIndex] && (
                              <div key={qIndex}>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{question}</p>
                                <p className="text-gray-900 dark:text-white mt-1">{goal.responses[qIndex]}</p>
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Distribution Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('distribution')}
            className="w-full px-6 py-4 bg-gradient-to-r from-n3rve-50 to-pink-50 dark:from-n3rve-900/20 dark:to-pink-900/20 hover:from-n3rve-100 hover:to-pink-100 dark:hover:from-n3rve-900/30 dark:hover:to-pink-900/30 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-n3rve-main" />
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('배포 설정', 'Distribution Settings')}</h3>
            </div>
            {expandedSections.includes('distribution') ? (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {expandedSections.includes('distribution') && formData && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('배포 방식', 'Distribution Type')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formData.distributionType === 'all' ?
                      t('모든 스토어', 'All Stores') :
                      t('선택한 스토어', 'Selected Stores')}
                  </p>
                </div>

                {formData.distributionType === 'selected' && formData.selectedStores && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('선택된 스토어', 'Selected Stores')}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.selectedStores.map((storeId: string) => {
                        const store = dspList.find(dsp => dsp.id === storeId);
                        return (
                          <span key={storeId} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
                            {store?.name || storeId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Release Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('컨슈머 발매일', 'Consumer Release Date')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formData.consumerReleaseDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('오리지널 발매일', 'Original Release Date')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formData.originalReleaseDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('발매 시간', 'Release Time')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formData.releaseTime}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Terms and Conditions */}
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
  );
}
