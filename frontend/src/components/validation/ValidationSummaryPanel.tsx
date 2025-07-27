import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, ChevronDown, ChevronUp, Target, TrendingUp, Download, EyeOff } from 'lucide-react';
import { ValidationSummary, ValidationProgress } from '@/types/validationAdvanced';
import { useValidationContext } from '@/contexts/ValidationContext';

interface ValidationSummaryPanelProps {
  isVisible: boolean
  onToggleVisibility: () => void
  onNavigateToField: (fieldId: string) => void
  onExportReport: () => void
  language?: 'ko' | 'en'
}

export default function ValidationSummaryPanel({
  isVisible,
  onToggleVisibility,
  onNavigateToField,
  onExportReport,
  language = 'en'
}: ValidationSummaryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [sessionProgress, setSessionProgress] = useState<ValidationProgress>({
    sessionStart: new Date(),
    initialIssueCount: 0,
    currentIssueCount: 0,
    issuesFixed: 0,
    timeSpent: 0,
    velocity: 0,
    milestones: []
  });

  const { getAllWarnings, getSummary } = useValidationContext();
  const warnings = getAllWarnings();
  const summary = getSummary();

  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  // Calculate enhanced summary metrics
  const enhancedSummary = useMemo<ValidationSummary>(() => {
    const totalFieldsEstimate = 25; // Estimate based on typical form
    const validatedFields = Math.max(1, totalFieldsEstimate - warnings.length);
    const completionPercentage = Math.round((validatedFields / totalFieldsEstimate) * 100);

    // DSP readiness score calculation
    const errorPenalty = summary.errors * 25;
    const warningPenalty = summary.warnings * 10;
    const suggestionBonus = summary.suggestions * 5;
    const dspReadinessScore = Math.max(0, Math.min(100,
      100 - errorPenalty - warningPenalty + suggestionBonus
    ));

    // Estimated approval chance
    const estimatedApprovalChance = summary.errors === 0
      ? Math.max(70, dspReadinessScore)
      : Math.max(20, dspReadinessScore - 30);

    // Recommended next actions
    const recommendedNextActions = [];
    if (summary.errors > 0) {
      recommendedNextActions.push({
        action: t('모든 오류 수정하기', 'Fix all errors'),
        priority: 'high' as const,
        impact: t('DSP 승인 가능성 크게 향상', 'Significantly improves DSP approval chance'),
        estimatedTime: t('5-10분', '5-10 minutes')
      });
    }
    if (summary.warnings > 2) {
      recommendedNextActions.push({
        action: t('경고 사항 검토하기', 'Review warnings'),
        priority: 'medium' as const,
        impact: t('거절 위험 감소', 'Reduces rejection risk'),
        estimatedTime: t('3-5분', '3-5 minutes')
      });
    }
    if (summary.suggestions > 0) {
      recommendedNextActions.push({
        action: t('제안사항 적용하기', 'Apply suggestions'),
        priority: 'low' as const,
        impact: t('전반적인 품질 향상', 'Improves overall quality'),
        estimatedTime: t('2-3분', '2-3 minutes')
      });
    }

    return {
      totalFields: totalFieldsEstimate,
      validatedFields,
      completionPercentage,
      dspReadinessScore,
      estimatedApprovalChance,
      criticalIssuesCount: summary.errors,
      warningBreakdown: {
        errors: summary.errors,
        warnings: summary.warnings,
        suggestions: summary.suggestions
      },
      recommendedNextActions,
      progressTrend: sessionProgress.issuesFixed > 0 ? 'improving' : 'stable'
    };
  }, [warnings, summary, sessionProgress, t]);

  // Update session progress
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionProgress(prev => ({
        ...prev,
        currentIssueCount: warnings.length,
        timeSpent: Math.floor((Date.now() - prev.sessionStart.getTime()) / 1000),
        velocity: prev.timeSpent > 0 ? (prev.issuesFixed / (prev.timeSpent / 60)) : 0
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [warnings.length]);

  // Initialize session
  useEffect(() => {
    if (sessionProgress.initialIssueCount === 0 && warnings.length > 0) {
      setSessionProgress(prev => ({
        ...prev,
        initialIssueCount: warnings.length,
        currentIssueCount: warnings.length
      }));
    }
  }, [warnings.length, sessionProgress.initialIssueCount]);

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

  if (!isVisible) {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={onToggleVisibility}
        className="fixed top-20 right-4 z-50 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          {warnings.length > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
            >
              {warnings.length}
            </motion.div>
          )}
        </div>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 120 }}
      className="fixed top-20 right-4 z-50 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {t('검증 대시보드', 'Validation Dashboard')}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          <button
            onClick={onToggleVisibility}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <EyeOff className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {/* DSP Readiness Score */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('DSP 준비도 점수', 'DSP Readiness Score')}
                </span>
                <span className={`text-lg font-bold ${getScoreColor(enhancedSummary.dspReadinessScore)}`}>
                  {enhancedSummary.dspReadinessScore}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${enhancedSummary.dspReadinessScore}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-2 rounded-full ${getScoreBgColor(enhancedSummary.dspReadinessScore)}`}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('예상 승인률:', 'Est. approval rate:')} {enhancedSummary.estimatedApprovalChance}%
              </p>
            </div>

            {/* Progress Overview */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {enhancedSummary.completionPercentage}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t('완료율', 'Complete')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {warnings.length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t('남은 이슈', 'Issues left')}
                  </div>
                </div>
              </div>
            </div>

            {/* Issues Breakdown */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t('이슈 분석', 'Issues Breakdown')}
              </h4>
              <div className="space-y-2">
                {enhancedSummary.warningBreakdown.errors > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {t('오류', 'Errors')}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      {enhancedSummary.warningBreakdown.errors}
                    </span>
                  </div>
                )}
                {enhancedSummary.warningBreakdown.warnings > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {t('경고', 'Warnings')}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                      {enhancedSummary.warningBreakdown.warnings}
                    </span>
                  </div>
                )}
                {enhancedSummary.warningBreakdown.suggestions > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {t('제안', 'Suggestions')}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {enhancedSummary.warningBreakdown.suggestions}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Session Progress */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t('세션 진행 상황', 'Session Progress')}
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <Clock className="w-4 h-4 text-gray-400 mb-1" />
                  <div className="text-gray-600 dark:text-gray-400">
                    {t('소요 시간', 'Time spent')}
                  </div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {Math.floor(sessionProgress.timeSpent / 60)}m {sessionProgress.timeSpent % 60}s
                  </div>
                </div>
                <div>
                  <TrendingUp className="w-4 h-4 text-gray-400 mb-1" />
                  <div className="text-gray-600 dark:text-gray-400">
                    {t('수정 속도', 'Fix velocity')}
                  </div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {sessionProgress.velocity.toFixed(1)}/min
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Actions */}
            {enhancedSummary.recommendedNextActions.length > 0 && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('권장 작업', 'Recommended Actions')}
                </h4>
                <div className="space-y-2">
                  {enhancedSummary.recommendedNextActions.slice(0, 2).map((action, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        action.priority === 'high' ? 'bg-red-500' :
                          action.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                          {action.action}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {action.estimatedTime}
                        </div>
                      </div>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="p-4 space-y-2">
              <button
                onClick={onExportReport}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                {t('검증 리포트 내보내기', 'Export Validation Report')}
              </button>

              {warnings.length > 0 && (
                <button
                  onClick={() => {
                    const firstWarning = warnings[0];
                    if (firstWarning) {
                      onNavigateToField(firstWarning.field);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm font-medium"
                >
                  <Target className="w-4 h-4" />
                  {t('첫 번째 이슈로 이동', 'Go to First Issue')}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
