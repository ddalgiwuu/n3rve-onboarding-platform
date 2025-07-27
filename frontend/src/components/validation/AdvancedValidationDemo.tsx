import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Settings, RefreshCw, Download } from 'lucide-react';
import ValidationSummaryPanel from './ValidationSummaryPanel';
import IntelligentSuggestionsEngine from './IntelligentSuggestionsEngine';
import CollaborationFeatures from './CollaborationFeatures';
import ValidationReportExporter from './ValidationReportExporter';
import { EnhancedVisualEffects, SectionHeaderEffects, AnimatedProgressBar } from './EnhancedVisualEffects';
import { useValidationPatterns } from '@/hooks/useValidationPatterns';
import { useValidationProgress } from '@/hooks/useValidationProgress';
import { EnhancedValidationWarning } from '@/types/validationAdvanced';

interface AdvancedValidationDemoProps {
  language?: 'ko' | 'en'
}

// Mock validation warnings for demo
const mockWarnings: EnhancedValidationWarning[] = [
  {
    id: 'warning-1',
    type: 'error',
    field: 'albumTitle',
    message: 'Album title contains special characters that may cause DSP rejection',
    details: 'Special characters like smart quotes can cause encoding issues on some platforms',
    suggestedValue: 'My Amazing Album',
    currentValue: 'My "Amazing" Album',
    canIgnore: false,
    warningGroup: 'special_chars',
    rejectionProbability: 85,
    priority: 9,
    successRate: 94,
    industryUsage: 89,
    fixComplexity: 'easy',
    categoryTags: ['formatting', 'encoding'],
    dspExamples: [
      {
        platform: 'Spotify',
        rejectionMessage: 'Track title contains unsupported Unicode characters',
        rejectionMessageKo: '트랙 제목에 지원되지 않는 유니코드 문자가 포함되어 있습니다'
      },
      {
        platform: 'Apple Music',
        rejectionMessage: 'Smart quotes in titles are not supported',
        rejectionMessageKo: '제목의 스마트 따옴표는 지원되지 않습니다'
      }
    ]
  },
  {
    id: 'warning-2',
    type: 'warning',
    field: 'trackTitle',
    message: 'Consider using standard featuring format for better DSP compatibility',
    details: 'Most successful releases use "feat" instead of "featuring" or "ft."',
    suggestedValue: 'Song Title (feat. Artist Name)',
    currentValue: 'Song Title featuring Artist Name',
    canIgnore: true,
    warningGroup: 'feat',
    rejectionProbability: 25,
    priority: 6,
    successRate: 87,
    industryUsage: 76,
    fixComplexity: 'easy',
    categoryTags: ['featuring', 'formatting']
  },
  {
    id: 'warning-3',
    type: 'suggestion',
    field: 'artistName',
    message: 'Title case formatting recommended for better presentation',
    details: 'Title case formatting improves readability and professional appearance',
    suggestedValue: 'The Amazing Artist',
    currentValue: 'the amazing artist',
    canIgnore: true,
    warningGroup: 'capitalization',
    rejectionProbability: 5,
    priority: 4,
    successRate: 92,
    industryUsage: 68,
    fixComplexity: 'easy',
    categoryTags: ['formatting', 'presentation']
  },
  {
    id: 'warning-4',
    type: 'warning',
    field: 'trackTitle',
    message: 'Track title exceeds recommended length for optimal display',
    details: 'Long titles may be truncated on some platforms or devices',
    suggestedValue: 'Shortened Version of This Really Long Track Title',
    currentValue: 'This is a Really Really Long Track Title That Might Get Truncated on Some Platforms',
    canIgnore: true,
    warningGroup: 'length',
    rejectionProbability: 15,
    priority: 5,
    successRate: 78,
    industryUsage: 82,
    fixComplexity: 'medium',
    categoryTags: ['length', 'display']
  }
];

export default function AdvancedValidationDemo({
  language = 'en'
}: AdvancedValidationDemoProps) {
  const [summaryVisible, setSummaryVisible] = useState(true);
  const [warnings, setWarnings] = useState<EnhancedValidationWarning[]>(mockWarnings);
  const [currentField, setCurrentField] = useState<string>('albumTitle');
  const [showExporter, setShowExporter] = useState(false);

  const {
    recordAcceptance,
    recordDismissal,
    getSuggestionPriority,
    predictUserDecision,
    analyzePatterns
  } = useValidationPatterns();

  const {
    progress,
    startTracking,
    updateIssueCount,
    recordMilestone,
    getProgressPercentage,
    getAnalytics
  } = useValidationProgress();

  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  // Initialize progress tracking
  useEffect(() => {
    startTracking(warnings.length);
  }, [startTracking]);

  // Update progress when warnings change
  useEffect(() => {
    updateIssueCount(warnings.length);
  }, [warnings.length, updateIssueCount]);

  const handleAcceptSuggestion = (warning: EnhancedValidationWarning) => {
    // Record the acceptance with timing
    recordAcceptance(warning, Math.random() * 15 + 5); // Simulate 5-20 second decision
    recordMilestone('suggestion_accepted', `Accepted: ${warning.message}`);

    // Remove the warning
    setWarnings(prev => prev.filter(w => w.id !== warning.id));
  };

  const handleDismissSuggestion = (warning: EnhancedValidationWarning) => {
    // Record the dismissal with timing
    recordDismissal(warning, Math.random() * 10 + 2); // Simulate 2-12 second decision
    recordMilestone('suggestion_dismissed', `Dismissed: ${warning.message}`);

    // Remove the warning
    setWarnings(prev => prev.filter(w => w.id !== warning.id));
  };

  const handleNavigateToField = (fieldId: string) => {
    setCurrentField(fieldId);
    recordMilestone('field_navigation', `Navigated to: ${fieldId}`);

    // Simulate scrolling to field
    console.log(`Navigating to field: ${fieldId}`);
  };

  const handleExportReport = (format: 'pdf' | 'email') => {
    recordMilestone('report_export', `Exported as: ${format}`);
    console.log(`Exporting report as: ${format}`);
  };

  const resetDemo = () => {
    setWarnings(mockWarnings);
    startTracking(mockWarnings.length);
    recordMilestone('demo_reset', 'Demo reset');
  };

  const summary = {
    total: warnings.length,
    errors: warnings.filter(w => w.type === 'error').length,
    warnings: warnings.filter(w => w.type === 'warning').length,
    suggestions: warnings.filter(w => w.type === 'suggestion').length,
    avgRejectionProbability: warnings.length > 0
      ? Math.round(warnings.reduce((sum, w) => sum + (w.rejectionProbability || 0), 0) / warnings.length)
      : 0
  };

  const submissionData = {
    albumTitle: 'My Amazing Album',
    artistName: 'The Amazing Artist',
    releaseDate: '2024-12-25',
    trackCount: 12
  };

  const analytics = getAnalytics();
  const progressPercentage = getProgressPercentage();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('고급 검증 피드백 시스템', 'Advanced Validation Feedback System')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            {t('AI 기반 제안, 실시간 협업, 스마트 분석을 제공하는 차세대 검증 시스템', 'Next-generation validation with AI suggestions, real-time collaboration, and smart analytics')}
          </p>

          {/* Demo Controls */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setSummaryVisible(!summaryVisible)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {summaryVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {summaryVisible
                ? t('요약 패널 숨기기', 'Hide Summary')
                : t('요약 패널 보기', 'Show Summary')
              }
            </button>
            <button
              onClick={resetDemo}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {t('데모 초기화', 'Reset Demo')}
            </button>
            <button
              onClick={() => setShowExporter(!showExporter)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              {t('리포트 내보내기', 'Export Report')}
            </button>
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                {t('진행률', 'Progress')}
              </h3>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {progressPercentage}%
              </div>
              <AnimatedProgressBar
                current={progress.issuesFixed}
                total={progress.initialIssueCount}
                colorScheme="blue"
                language={language}
              />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                {t('세션 시간', 'Session Time')}
              </h3>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.floor(progress.timeSpent / 60)}:{(progress.timeSpent % 60).toString().padStart(2, '0')}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                {t('수정 속도', 'Fix Velocity')}
              </h3>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {progress.velocity.toFixed(1)}/min
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                {t('효율성 점수', 'Efficiency')}
              </h3>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {analytics.efficiencyScore}%
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Section Header with Visual Effects */}
            <SectionHeaderEffects
              title={t('앨범 정보', 'Album Information')}
              validationStatus={warnings.some(w => w.type === 'error') ? 'has_errors' :
                warnings.some(w => w.type === 'warning') ? 'has_warnings' : 'clean'}
              issueCount={warnings.length}
              onNavigateToFirstIssue={() => handleNavigateToField(warnings[0]?.field || '')}
              language={language}
            />

            {/* Form Fields with Enhanced Visual Effects */}
            <div className="space-y-6">
              {['albumTitle', 'trackTitle', 'artistName'].map((fieldId) => {
                const fieldWarnings = warnings.filter(w => w.field === fieldId);
                const validationState =
                  fieldWarnings.some(w => w.type === 'error') ? 'error' :
                    fieldWarnings.some(w => w.type === 'warning') ? 'warning' :
                      fieldWarnings.some(w => w.type === 'suggestion') ? 'suggestion' :
                        fieldWarnings.length === 0 ? 'success' : 'none';

                return (
                  <EnhancedVisualEffects
                    key={fieldId}
                    fieldId={fieldId}
                    validationState={validationState}
                    pulseIntensity="medium"
                    showStatusIcon={true}
                    enableSuccessAnimation={true}
                  >
                    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {fieldId === 'albumTitle' ? t('앨범 제목', 'Album Title') :
                          fieldId === 'trackTitle' ? t('트랙 제목', 'Track Title') :
                            t('아티스트명', 'Artist Name')}
                      </label>
                      <input
                        type="text"
                        id={fieldId}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        defaultValue={
                          fieldId === 'albumTitle' ? 'My "Amazing" Album' :
                            fieldId === 'trackTitle' ? 'Song Title featuring Artist Name' :
                              'the amazing artist'
                        }
                      />
                    </div>
                  </EnhancedVisualEffects>
                );
              })}
            </div>

            {/* Collaboration Features */}
            <CollaborationFeatures
              currentField={currentField}
              currentValue={warnings.find(w => w.field === currentField)?.currentValue}
              warningType={warnings.find(w => w.field === currentField)?.type}
              language={language}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Intelligent Suggestions Engine */}
            <IntelligentSuggestionsEngine
              warnings={warnings}
              onAcceptSuggestion={handleAcceptSuggestion}
              onDismissSuggestion={handleDismissSuggestion}
              language={language}
            />

            {/* Pattern Analysis Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {t('패턴 분석', 'Pattern Analysis')}
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('학습 신뢰도:', 'Learning Confidence:')}
                  </span>
                  <span className="font-medium text-indigo-600 dark:text-indigo-400">
                    {analyzePatterns().confidenceScore}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('평균 결정 시간:', 'Avg Decision Time:')}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {analyzePatterns().avgDecisionTime.toFixed(1)}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('개선 추세:', 'Improvement Trend:')}
                  </span>
                  <span className={`font-medium ${
                    analytics.improvementTrend === 'accelerating' ? 'text-green-600 dark:text-green-400' :
                      analytics.improvementTrend === 'slowing' ? 'text-red-600 dark:text-red-400' :
                        'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {analytics.improvementTrend === 'accelerating' ? t('가속화', 'Accelerating') :
                      analytics.improvementTrend === 'slowing' ? t('둔화', 'Slowing') :
                        t('안정적', 'Steady')}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Floating Summary Panel */}
        <ValidationSummaryPanel
          isVisible={summaryVisible}
          onToggleVisibility={() => setSummaryVisible(!summaryVisible)}
          onNavigateToField={handleNavigateToField}
          onExportReport={() => setShowExporter(true)}
          language={language}
        />

        {/* Report Exporter Modal */}
        {showExporter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <ValidationReportExporter
                warnings={warnings}
                summary={{
                  totalFields: 25,
                  validatedFields: 25 - warnings.length,
                  completionPercentage: progressPercentage,
                  dspReadinessScore: Math.max(0, 100 - (summary.errors * 25) - (summary.warnings * 10)),
                  estimatedApprovalChance: Math.max(20, 100 - (summary.errors * 30) - (summary.warnings * 15)),
                  criticalIssuesCount: summary.errors,
                  warningBreakdown: {
                    errors: summary.errors,
                    warnings: summary.warnings,
                    suggestions: summary.suggestions
                  },
                  recommendedNextActions: [],
                  progressTrend: analytics.improvementTrend
                }}
                submissionData={submissionData}
                language={language}
                onExport={handleExportReport}
              />
              <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowExporter(false)}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {t('닫기', 'Close')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
