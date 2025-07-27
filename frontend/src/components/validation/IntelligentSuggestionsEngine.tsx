import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, Users, CheckCircle, Target, Lightbulb } from 'lucide-react';
import { EnhancedValidationWarning, UserValidationPatterns } from '@/types/validationAdvanced';

interface IntelligentSuggestionsEngineProps {
  warnings: EnhancedValidationWarning[]
  onAcceptSuggestion: (warning: EnhancedValidationWarning) => void
  onDismissSuggestion: (warning: EnhancedValidationWarning) => void
  language?: 'ko' | 'en'
}

interface SmartSuggestion {
  id: string
  warning: EnhancedValidationWarning
  intelligenceScore: number // 0-100
  reasoning: string
  confidence: number // 0-100
  basePattern: string
  estimatedSuccessRate: number
  quickFix?: {
    action: string
    preview: string
    oneClick: boolean
  }
}

export default function IntelligentSuggestionsEngine({
  warnings,
  onAcceptSuggestion,
  onDismissSuggestion,
  language = 'en'
}: IntelligentSuggestionsEngineProps) {
  const [userPatterns, setUserPatterns] = useState<UserValidationPatterns>({
    preferredSuggestionTypes: [],
    avgDecisionTime: 30,
    acceptanceRate: 0.7,
    dismissalRate: 0.3,
    mostCommonFixes: [],
    learningConfidence: 0
  });

  const [interactionHistory, setInteractionHistory] = useState<{
    [warningId: string]: {
      timesShown: number
      timesAccepted: number
      timesDismissed: number
      avgTimeToDecision: number
      lastShown: Date
    }
  }>({});

  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  // Load user patterns from localStorage
  useEffect(() => {
    const savedPatterns = localStorage.getItem('validation-user-patterns');
    if (savedPatterns) {
      setUserPatterns(JSON.parse(savedPatterns));
    }

    const savedHistory = localStorage.getItem('validation-interaction-history');
    if (savedHistory) {
      setInteractionHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save patterns when they change
  useEffect(() => {
    localStorage.setItem('validation-user-patterns', JSON.stringify(userPatterns));
  }, [userPatterns]);

  useEffect(() => {
    localStorage.setItem('validation-interaction-history', JSON.stringify(interactionHistory));
  }, [interactionHistory]);

  // Generate smart suggestions with intelligence scoring
  const smartSuggestions = useMemo<SmartSuggestion[]>(() => {
    return warnings
      .filter(w => w.suggestedValue)
      .map(warning => {
        const history = interactionHistory[warning.id] || {
          timesShown: 0,
          timesAccepted: 0,
          timesDismissed: 0,
          avgTimeToDecision: 30,
          lastShown: new Date()
        };

        // Calculate intelligence score based on multiple factors
        let intelligenceScore = 50; // Base score

        // User pattern matching
        if (userPatterns.preferredSuggestionTypes.includes(warning.type)) {
          intelligenceScore += 20;
        }

        // Historical success rate
        const acceptanceRate = history.timesShown > 0
          ? history.timesAccepted / history.timesShown
          : userPatterns.acceptanceRate;
        intelligenceScore += Math.round(acceptanceRate * 30);

        // Warning priority and severity
        intelligenceScore += (warning.priority || 5) * 2;
        if (warning.type === 'error') intelligenceScore += 15;
        else if (warning.type === 'warning') intelligenceScore += 10;

        // Industry usage boost
        if (warning.industryUsage && warning.industryUsage > 70) {
          intelligenceScore += 15;
        }

        // Success rate boost
        if (warning.successRate && warning.successRate > 80) {
          intelligenceScore += 10;
        }

        // Cap at 100
        intelligenceScore = Math.min(100, intelligenceScore);

        // Generate reasoning
        let reasoning = '';
        if (acceptanceRate > 0.8) {
          reasoning = t('이 유형의 제안을 자주 수락하셨습니다', 'You often accept this type of suggestion');
        } else if (warning.industryUsage && warning.industryUsage > 80) {
          reasoning = t('업계에서 널리 사용되는 방식입니다', 'Widely used in the industry');
        } else if (warning.successRate && warning.successRate > 85) {
          reasoning = t('높은 성공률을 보이는 수정입니다', 'This fix has a high success rate');
        } else if (warning.type === 'error') {
          reasoning = t('DSP 거절을 방지하는 중요한 수정입니다', 'Critical fix to prevent DSP rejection');
        } else {
          reasoning = t('품질 향상에 도움이 됩니다', 'Helps improve overall quality');
        }

        // Calculate confidence
        const confidence = Math.min(100,
          (userPatterns.learningConfidence * 0.3) +
          (acceptanceRate * 40) +
          ((warning.successRate || 50) * 0.3)
        );

        // Estimate success rate
        const estimatedSuccessRate = Math.round(
          ((warning.successRate || 70) * 0.4) +
          (acceptanceRate * 100 * 0.3) +
          ((warning.industryUsage || 50) * 0.3)
        );

        // Generate quick fix if applicable
        let quickFix;
        if (warning.fixComplexity === 'easy' && warning.suggestedValue) {
          quickFix = {
            action: t('클릭으로 수정', 'One-click fix'),
            preview: warning.suggestedValue,
            oneClick: true
          };
        }

        return {
          id: warning.id,
          warning,
          intelligenceScore,
          reasoning,
          confidence: Math.round(confidence),
          basePattern: warning.warningGroup || warning.type,
          estimatedSuccessRate,
          quickFix
        };
      })
      .sort((a, b) => b.intelligenceScore - a.intelligenceScore)
      .slice(0, 5); // Show top 5 suggestions
  }, [warnings, userPatterns, interactionHistory, t]);

  const handleAccept = (suggestion: SmartSuggestion) => {
    // Update interaction history
    setInteractionHistory(prev => ({
      ...prev,
      [suggestion.id]: {
        ...prev[suggestion.id],
        timesAccepted: (prev[suggestion.id]?.timesAccepted || 0) + 1,
        timesShown: (prev[suggestion.id]?.timesShown || 0) + 1
      }
    }));

    // Update user patterns
    setUserPatterns(prev => {
      const newPatterns = { ...prev };

      // Update preferred suggestion types
      if (!newPatterns.preferredSuggestionTypes.includes(suggestion.warning.type)) {
        newPatterns.preferredSuggestionTypes.push(suggestion.warning.type);
      }

      // Update most common fixes
      const fix = suggestion.warning.suggestedValue || 'unknown';
      const existingFix = newPatterns.mostCommonFixes.find(f => f.fix === fix);
      if (existingFix) {
        existingFix.count++;
        existingFix.successRate = Math.min(100, existingFix.successRate + 2);
      } else {
        newPatterns.mostCommonFixes.push({
          fix,
          count: 1,
          successRate: 80
        });
      }

      // Update acceptance rate
      newPatterns.acceptanceRate = Math.min(1, newPatterns.acceptanceRate + 0.05);

      // Increase learning confidence
      newPatterns.learningConfidence = Math.min(100, newPatterns.learningConfidence + 2);

      return newPatterns;
    });

    onAcceptSuggestion(suggestion.warning);
  };

  const handleDismiss = (suggestion: SmartSuggestion) => {
    // Update interaction history
    setInteractionHistory(prev => ({
      ...prev,
      [suggestion.id]: {
        ...prev[suggestion.id],
        timesDismissed: (prev[suggestion.id]?.timesDismissed || 0) + 1,
        timesShown: (prev[suggestion.id]?.timesShown || 0) + 1
      }
    }));

    // Update user patterns
    setUserPatterns(prev => ({
      ...prev,
      dismissalRate: Math.min(1, prev.dismissalRate + 0.02),
      learningConfidence: Math.min(100, prev.learningConfidence + 1)
    }));

    onDismissSuggestion(suggestion.warning);
  };

  if (smartSuggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('AI 제안 엔진', 'AI Suggestions Engine')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('사용자 패턴을 학습하여 맞춤형 제안을 제공합니다', 'Personalized suggestions based on your patterns')}
          </p>
        </div>
      </div>

      {/* Learning Status */}
      <div className="flex items-center gap-4 mb-6 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('학습 신뢰도:', 'Learning Confidence:')}
          </span>
          <span className="text-sm font-bold text-green-600 dark:text-green-400">
            {userPatterns.learningConfidence}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('수락률:', 'Acceptance Rate:')}
          </span>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {Math.round(userPatterns.acceptanceRate * 100)}%
          </span>
        </div>
      </div>

      {/* Smart Suggestions */}
      <div className="space-y-3">
        <AnimatePresence>
          {smartSuggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 relative overflow-hidden"
            >
              {/* Intelligence Score Indicator */}
              <div className="absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8">
                <div
                  className={`w-full h-full rounded-full opacity-20 ${
                    suggestion.intelligenceScore >= 80 ? 'bg-green-500' :
                      suggestion.intelligenceScore >= 60 ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}
                />
                <div className="absolute top-2 right-2 text-xs font-bold text-gray-600 dark:text-gray-400">
                  {suggestion.intelligenceScore}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-1">
                  {/* Warning Info */}
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {suggestion.warning.message}
                    </span>
                    {suggestion.quickFix?.oneClick && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full">
                        {t('원클릭', 'One-click')}
                      </span>
                    )}
                  </div>

                  {/* AI Reasoning */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <Brain className="w-3 h-3 inline mr-1" />
                    {suggestion.reasoning}
                  </p>

                  {/* Metrics */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {t('신뢰도', 'Confidence')}: {suggestion.confidence}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {t('성공률', 'Success')}: {suggestion.estimatedSuccessRate}%
                      </span>
                    </div>
                    {suggestion.warning.industryUsage && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-blue-500" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {t('업계 사용률', 'Industry')}: {suggestion.warning.industryUsage}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Suggested Change */}
                  {suggestion.warning.suggestedValue && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded p-2 mb-3">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {t('제안된 변경:', 'Suggested change:')}
                      </div>
                      <div className="font-mono text-sm text-green-700 dark:text-green-300">
                        {suggestion.warning.currentValue} → {suggestion.warning.suggestedValue}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <motion.button
                    onClick={() => handleAccept(suggestion)}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <CheckCircle className="w-3 h-3" />
                    {suggestion.quickFix?.oneClick
                      ? t('즉시 적용', 'Apply now')
                      : t('수락', 'Accept')
                    }
                  </motion.button>
                  <motion.button
                    onClick={() => handleDismiss(suggestion)}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-3 h-3" />
                    {t('거절', 'Dismiss')}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Learning Insights */}
      {userPatterns.mostCommonFixes.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
        >
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            {t('학습된 패턴', 'Learned Patterns')}
          </h4>
          <div className="text-xs text-blue-700 dark:text-blue-300">
            {t('자주 사용하는 수정:', 'Most common fixes:')} {' '}
            {userPatterns.mostCommonFixes.slice(0, 3).map((fix, index) => (
              <span key={index} className="inline-block mr-2">
                {fix.fix.substring(0, 20)}{fix.fix.length > 20 ? '...' : ''} ({fix.count}회)
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
