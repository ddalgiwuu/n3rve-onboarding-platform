import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingUp, Globe, Music, Star, CheckCircle2, BarChart3, Zap, ArrowRight, Award, Clock } from 'lucide-react';
import { IndustryCollaborationData } from '@/types/validationAdvanced';

interface CollaborationFeaturesProps {
  currentField?: string
  currentValue?: string
  warningType?: 'error' | 'warning' | 'suggestion'
  language?: 'ko' | 'en'
}

// Mock industry data - in a real app, this would come from an API
const mockIndustryData: IndustryCollaborationData = {
  popularChoices: [
    { field: 'albumTitle', option: 'Title Case Format', percentage: 87, successRate: 94 },
    { field: 'trackTitle', option: 'No Special Characters', percentage: 92, successRate: 96 },
    { field: 'artistName', option: 'Consistent Spelling', percentage: 89, successRate: 98 },
    { field: 'genre', option: 'Primary + Secondary', percentage: 76, successRate: 91 },
    { field: 'releaseDate', option: 'Friday Release', percentage: 68, successRate: 85 }
  ],
  benchmarkStats: {
    avgCompletionTime: 45, // minutes
    avgIssueCount: 12,
    successfulSubmissionRate: 89
  },
  quickFixTemplates: [
    {
      id: 'feat-format',
      name: 'Featuring Format',
      description: 'Standardize featuring artist format',
      applicableWarnings: ['feat', 'brackets'],
      successRate: 94,
      usageCount: 15420,
      steps: [
        'Replace "feat." with "feat"',
        'Use parentheses instead of brackets',
        'Capitalize artist names properly'
      ]
    },
    {
      id: 'title-case',
      name: 'Title Case Conversion',
      description: 'Convert to proper title case',
      applicableWarnings: ['capitalization', 'formatting'],
      successRate: 96,
      usageCount: 23100,
      steps: [
        'Capitalize first letter of each major word',
        'Keep articles and prepositions lowercase',
        'Maintain proper nouns as-is'
      ]
    },
    {
      id: 'special-chars',
      name: 'Special Character Cleanup',
      description: 'Remove problematic special characters',
      applicableWarnings: ['special_chars', 'encoding'],
      successRate: 98,
      usageCount: 18750,
      steps: [
        'Replace smart quotes with regular quotes',
        'Remove unsupported Unicode characters',
        'Convert symbols to text equivalents'
      ]
    }
  ],
  trendingFixes: [
    { fix: 'Remove brackets from track titles', popularity: 89, recentSuccessRate: 97 },
    { fix: 'Use standard featuring format', popularity: 85, recentSuccessRate: 94 },
    { fix: 'Apply title case to album names', popularity: 78, recentSuccessRate: 96 }
  ]
};

export default function CollaborationFeatures({
  currentField,
  currentValue,
  warningType,
  language = 'en'
}: CollaborationFeaturesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showBenchmarks, setShowBenchmarks] = useState(false);

  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  // Get relevant data for current context
  const relevantData = useMemo(() => {
    const popularChoice = mockIndustryData.popularChoices.find(
      choice => currentField?.includes(choice.field.toLowerCase())
    );

    const relevantTemplates = mockIndustryData.quickFixTemplates.filter(
      template => warningType && template.applicableWarnings.some(
        warning => currentValue?.toLowerCase().includes(warning)
      )
    );

    const trendingFix = mockIndustryData.trendingFixes.find(
      fix => currentValue && fix.fix.toLowerCase().includes(currentField?.toLowerCase() || '')
    );

    return {
      popularChoice,
      relevantTemplates,
      trendingFix
    };
  }, [currentField, currentValue, warningType]);

  return (
    <div className="space-y-6">
      {/* Industry Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('업계 인사이트', 'Industry Insights')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('다른 아티스트들이 선택하는 방식', 'What other artists are choosing')}
            </p>
          </div>
        </div>

        {/* Popular Choice for Current Field */}
        {relevantData.popularChoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t('인기 선택', 'Popular Choice')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {relevantData.popularChoice.percentage}% {t('가 선택', 'choose this')}
                </span>
                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${relevantData.popularChoice.percentage}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              {relevantData.popularChoice.option}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                {t('성공률', 'Success rate')}: {relevantData.popularChoice.successRate}%
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-blue-500" />
                {Math.round(relevantData.popularChoice.percentage * 123 / 100)} {t('명의 아티스트', 'artists this week')}
              </span>
            </div>
          </motion.div>
        )}

        {/* Trending Fix */}
        {relevantData.trendingFix && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                {t('트렌딩 수정', 'Trending Fix')}
              </span>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full">
                {t('인기 상승', 'Hot')}
              </span>
            </div>
            <p className="text-sm text-green-800 dark:text-green-200 mb-2">
              {relevantData.trendingFix.fix}
            </p>
            <div className="flex items-center gap-4 text-xs text-green-600 dark:text-green-400">
              <span>
                {t('인기도', 'Popularity')}: {relevantData.trendingFix.popularity}%
              </span>
              <span>
                {t('최근 성공률', 'Recent success')}: {relevantData.trendingFix.recentSuccessRate}%
              </span>
            </div>
          </motion.div>
        )}

        {/* Benchmark Toggle */}
        <button
          onClick={() => setShowBenchmarks(!showBenchmarks)}
          className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          {showBenchmarks
            ? t('벤치마크 숨기기', 'Hide Benchmarks')
            : t('업계 벤치마크 보기', 'Show Industry Benchmarks')
          }
        </button>

        {/* Benchmarks */}
        <AnimatePresence>
          {showBenchmarks && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mt-4"
            >
              <div className="grid grid-cols-3 gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {mockIndustryData.benchmarkStats.avgCompletionTime}m
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t('평균 완료 시간', 'Avg completion time')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {mockIndustryData.benchmarkStats.avgIssueCount}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t('평균 이슈 수', 'Avg issues found')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {mockIndustryData.benchmarkStats.successfulSubmissionRate}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t('첫 제출 성공률', 'First submission success')}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Quick Fix Templates */}
      {relevantData.relevantTemplates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('빠른 수정 템플릿', 'Quick Fix Templates')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('검증된 수정 방법들', 'Proven fix methods')}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {relevantData.relevantTemplates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedTemplate === template.id
                    ? 'border-purple-300 bg-purple-50 dark:border-purple-600 dark:bg-purple-900/30'
                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 hover:border-purple-200 dark:hover:border-purple-700'
                }`}
                onClick={() => setSelectedTemplate(
                  selectedTemplate === template.id ? null : template.id
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {template.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full">
                          {template.successRate}% {t('성공률', 'success')}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {template.usageCount.toLocaleString()} {t('회 사용', 'uses')}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {template.description}
                    </p>

                    <AnimatePresence>
                      {selectedTemplate === template.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden mt-3"
                        >
                          <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                            <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {t('수정 단계:', 'Fix steps:')}
                            </h5>
                            <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                              {template.steps.map((step, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="w-4 h-4 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {index + 1}
                                  </span>
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <ArrowRight className={`w-4 h-4 text-gray-400 transition-transform ${
                    selectedTemplate === template.id ? 'rotate-90' : ''
                  }`} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Global Community Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-700"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('글로벌 커뮤니티', 'Global Community')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('실시간 활동 현황', 'Real-time activity')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
            <Music className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              1,247
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {t('오늘 제출된 앨범', 'Albums submitted today')}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
            <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              94.2%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {t('이번 주 승인률', 'This week approval rate')}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
              {t('실시간 팁', 'Live Tip')}
            </span>
          </div>
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            {t('금요일에 발매하는 앨범이 68% 더 높은 차트 진입률을 보입니다', 'Albums released on Friday show 68% higher chart entry rates')}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
