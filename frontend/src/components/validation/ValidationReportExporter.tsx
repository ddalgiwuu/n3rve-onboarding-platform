import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download, FileText, CheckSquare, AlertTriangle, AlertCircle,
  Star, Calendar, Clock, BarChart3, Target, Award, Mail
} from 'lucide-react';
import { DSPReadinessReport, ValidationSummary } from '@/types/validationAdvanced';
import { ValidationWarningData } from '@/components/ValidationWarning';

interface ValidationReportExporterProps {
  warnings: ValidationWarningData[]
  summary: ValidationSummary
  submissionData?: {
    albumTitle: string
    artistName: string
    releaseDate: string
    trackCount: number
  }
  language?: 'ko' | 'en'
  onExport: (format: 'pdf' | 'email') => void
}

// Mock DSP platform data
const mockDSPPlatforms = [
  { name: 'Spotify', criticalWeight: 0.25, warningWeight: 0.1 },
  { name: 'Apple Music', criticalWeight: 0.2, warningWeight: 0.15 },
  { name: 'YouTube Music', criticalWeight: 0.15, warningWeight: 0.1 },
  { name: 'Amazon Music', criticalWeight: 0.1, warningWeight: 0.05 },
  { name: 'Deezer', criticalWeight: 0.05, warningWeight: 0.05 }
];

export default function ValidationReportExporter({
  warnings,
  summary,
  submissionData,
  language = 'en',
  onExport
}: ValidationReportExporterProps) {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'email' | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  // Generate DSP-specific readiness report
  const generateDSPReport = (): DSPReadinessReport => {
    const platformScores = mockDSPPlatforms.map(platform => {
      let score = 100;
      const criticalIssues: string[] = [];
      const warningIssues: string[] = [];

      warnings.forEach(warning => {
        if (warning.type === 'error') {
          score -= platform.criticalWeight * 100;
          criticalIssues.push(warning.message);
        } else if (warning.type === 'warning') {
          score -= platform.warningWeight * 100;
          warningIssues.push(warning.message);
        }
      });

      return {
        platform: platform.name,
        score: Math.max(0, Math.round(score)),
        criticalIssues: [...new Set(criticalIssues)],
        warnings: [...new Set(warningIssues)]
      };
    });

    const overallScore = Math.round(
      platformScores.reduce((sum, p) => sum + p.score, 0) / platformScores.length
    );

    const submissionReadiness: 'ready' | 'needs_work' | 'not_ready' =
      summary.warningBreakdown.errors > 0 ? 'not_ready' :
        summary.warningBreakdown.warnings > 3 ? 'needs_work' : 'ready';

    const estimatedRejectionRisk = Math.max(0, Math.min(100,
      (summary.warningBreakdown.errors * 25) + (summary.warningBreakdown.warnings * 10) + (summary.warningBreakdown.suggestions * 2)
    ));

    const recommendedActions = [
      ...(summary.warningBreakdown.errors > 0 ? [{
        priority: 'critical' as const,
        action: t('모든 오류 즉시 수정', 'Fix all errors immediately'),
        impact: t('DSP 거절 방지', 'Prevents DSP rejection'),
        timeEstimate: t('10-15분', '10-15 minutes'),
        platforms: ['All DSPs']
      }] : []),
      ...(summary.warningBreakdown.warnings > 2 ? [{
        priority: 'high' as const,
        action: t('주요 경고사항 검토', 'Review major warnings'),
        impact: t('승인 가능성 향상', 'Improves approval chances'),
        timeEstimate: t('5-10분', '5-10 minutes'),
        platforms: ['Spotify', 'Apple Music']
      }] : []),
      ...(summary.warningBreakdown.suggestions > 0 ? [{
        priority: 'medium' as const,
        action: t('품질 개선 제안 적용', 'Apply quality suggestions'),
        impact: t('전체적인 품질 향상', 'Enhances overall quality'),
        timeEstimate: t('3-5분', '3-5 minutes'),
        platforms: ['All platforms']
      }] : [])
    ];

    const complianceChecklist = [
      {
        category: t('기본 정보', 'Basic Information'),
        checks: [
          {
            item: t('앨범 제목 형식', 'Album title format'),
            status: warnings.some(w => w.field.includes('album') && w.type === 'error') ? 'fail' :
              warnings.some(w => w.field.includes('album') && w.type === 'warning') ? 'warning' : 'pass',
            requirement: t('특수문자 제한, 길이 제한 준수', 'Special character limits, length compliance')
          } as const,
          {
            item: t('아티스트명 일관성', 'Artist name consistency'),
            status: warnings.some(w => w.field.includes('artist') && w.type === 'error') ? 'fail' :
              warnings.some(w => w.field.includes('artist') && w.type === 'warning') ? 'warning' : 'pass',
            requirement: t('전체 트랙에서 동일한 표기', 'Consistent across all tracks')
          } as const,
          {
            item: t('트랙 제목 형식', 'Track title format'),
            status: warnings.some(w => w.field.includes('track') && w.type === 'error') ? 'fail' :
              warnings.some(w => w.field.includes('track') && w.type === 'warning') ? 'warning' : 'pass',
            requirement: t('피처링 형식, 버전 표기 규칙', 'Featuring format, version notation rules')
          } as const
        ]
      },
      {
        category: t('메타데이터', 'Metadata'),
        checks: [
          {
            item: t('장르 분류', 'Genre classification'),
            status: 'pass' as const,
            requirement: t('주 장르 + 부 장르 설정', 'Primary + secondary genre setup')
          },
          {
            item: t('발매일 설정', 'Release date'),
            status: 'pass' as const,
            requirement: t('미래 날짜, 적절한 리드타임', 'Future date, adequate lead time')
          },
          {
            item: t('저작권 정보', 'Copyright information'),
            status: 'pass' as const,
            requirement: t('완전한 크레딧 정보', 'Complete credit information')
          }
        ]
      }
    ];

    return {
      overallScore,
      platformSpecificScores: platformScores,
      submissionReadiness,
      estimatedRejectionRisk,
      recommendedActions,
      complianceChecklist
    };
  };

  const dspReport = generateDSPReport();

  const handleExport = async (format: 'pdf' | 'email') => {
    setIsGenerating(true);
    setSelectedFormat(format);

    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    onExport(format);
    setIsGenerating(false);
    setSelectedFormat(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusIcon = (status: 'pass' | 'warning' | 'fail') => {
    switch (status) {
      case 'pass':
        return <CheckSquare className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'fail':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-6 h-6" />
          <h2 className="text-xl font-bold">
            {t('DSP 제출 준비도 리포트', 'DSP Submission Readiness Report')}
          </h2>
        </div>
        {submissionData && (
          <div className="text-blue-100 text-sm">
            {submissionData.albumTitle} - {submissionData.artistName}
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Overall Score */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('전체 준비도 점수', 'Overall Readiness Score')}
            </h3>
            <div className={`text-2xl font-bold ${getScoreColor(dspReport.overallScore)}`}>
              {dspReport.overallScore}/100
            </div>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dspReport.overallScore}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-3 rounded-full ${getScoreBgColor(dspReport.overallScore)}`}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className={`font-medium ${
              dspReport.submissionReadiness === 'ready' ? 'text-green-600 dark:text-green-400' :
                dspReport.submissionReadiness === 'needs_work' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
            }`}>
              {dspReport.submissionReadiness === 'ready' ? t('제출 준비 완료', 'Ready to submit') :
                dspReport.submissionReadiness === 'needs_work' ? t('추가 작업 필요', 'Needs work') :
                  t('제출 불가', 'Not ready')}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              {t('예상 거절률:', 'Est. rejection risk:')} {dspReport.estimatedRejectionRisk}%
            </span>
          </div>
        </div>

        {/* Platform-Specific Scores */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('플랫폼별 점수', 'Platform-Specific Scores')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dspReport.platformSpecificScores.map((platform, index) => (
              <motion.div
                key={platform.platform}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {platform.platform}
                  </span>
                  <span className={`font-bold ${getScoreColor(platform.score)}`}>
                    {platform.score}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full ${getScoreBgColor(platform.score)}`}
                    style={{ width: `${platform.score}%` }}
                  />
                </div>
                {platform.criticalIssues.length > 0 && (
                  <div className="text-xs text-red-600 dark:text-red-400">
                    {platform.criticalIssues.length} {t('개의 중요 이슈', 'critical issues')}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recommended Actions */}
        {dspReport.recommendedActions.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('권장 조치사항', 'Recommended Actions')}
            </h3>
            <div className="space-y-3">
              {dspReport.recommendedActions.map((action, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-l-4 ${
                    action.priority === 'critical' ? 'border-l-red-500 bg-red-50 dark:bg-red-900/20' :
                      action.priority === 'high' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                        'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1 rounded ${
                      action.priority === 'critical' ? 'bg-red-100 dark:bg-red-900/30' :
                        action.priority === 'high' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                          'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      <Target className={`w-4 h-4 ${
                        action.priority === 'critical' ? 'text-red-600 dark:text-red-400' :
                          action.priority === 'high' ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-blue-600 dark:text-blue-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {action.action}
                        </h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          action.priority === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                            action.priority === 'high' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {action.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {action.impact}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {action.timeEstimate}
                        </span>
                        <span>
                          {t('적용 대상:', 'Applies to:')} {action.platforms.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Compliance Checklist */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('DSP 규정 준수 체크리스트', 'DSP Compliance Checklist')}
          </h3>
          <div className="space-y-6">
            {dspReport.complianceChecklist.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {category.category}
                </h4>
                <div className="space-y-2">
                  {category.checks.map((check, checkIndex) => (
                    <div
                      key={checkIndex}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      {getStatusIcon(check.status)}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {check.item}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {check.requirement}
                        </div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        check.status === 'pass' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                          check.status === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {check.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('리포트 내보내기', 'Export Report')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.button
              onClick={() => handleExport('pdf')}
              disabled={isGenerating}
              className="flex items-center justify-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isGenerating && selectedFormat === 'pdf' ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>{t('PDF 생성 중...', 'Generating PDF...')}</span>
                </div>
              ) : (
                <>
                  <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {t('PDF 다운로드', 'Download PDF')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t('완전한 리포트 문서', 'Complete report document')}
                    </div>
                  </div>
                </>
              )}
            </motion.button>

            <motion.button
              onClick={() => handleExport('email')}
              disabled={isGenerating}
              className="flex items-center justify-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-400 dark:hover:border-green-500 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isGenerating && selectedFormat === 'email' ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                  <span>{t('이메일 준비 중...', 'Preparing email...')}</span>
                </div>
              ) : (
                <>
                  <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {t('이메일로 전송', 'Send via Email')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t('팀과 공유하기', 'Share with team')}
                    </div>
                  </div>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
