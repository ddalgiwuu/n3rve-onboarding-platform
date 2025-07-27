import { EnhancedValidationWarning, ValidationAnalytics, DSPReadinessReport } from '@/types/validationAdvanced';

// DSP platform configurations with their validation priorities
export const DSP_PLATFORMS = {
  spotify: {
    name: 'Spotify',
    criticalWeight: 0.25,
    warningWeight: 0.1,
    suggestionWeight: 0.05,
    marketShare: 31.7,
    strictness: 'medium',
    commonRejectionReasons: [
      'Invalid track title format',
      'Missing or incorrect ISRC',
      'Audio quality issues',
      'Metadata inconsistencies'
    ]
  },
  apple: {
    name: 'Apple Music',
    criticalWeight: 0.3,
    warningWeight: 0.15,
    suggestionWeight: 0.08,
    marketShare: 16.2,
    strictness: 'high',
    commonRejectionReasons: [
      'Non-compliant artwork',
      'Explicit content not marked',
      'Invalid release date',
      'Copyright issues'
    ]
  },
  youtube: {
    name: 'YouTube Music',
    criticalWeight: 0.2,
    warningWeight: 0.1,
    suggestionWeight: 0.05,
    marketShare: 8.2,
    strictness: 'low',
    commonRejectionReasons: [
      'Content ID conflicts',
      'Regional restrictions',
      'Audio sync issues',
      'Duplicate uploads'
    ]
  },
  amazon: {
    name: 'Amazon Music',
    criticalWeight: 0.15,
    warningWeight: 0.08,
    suggestionWeight: 0.03,
    marketShare: 7.8,
    strictness: 'medium',
    commonRejectionReasons: [
      'Incomplete track information',
      'Genre misclassification',
      'Language tagging errors',
      'UPC conflicts'
    ]
  },
  deezer: {
    name: 'Deezer',
    criticalWeight: 0.1,
    warningWeight: 0.05,
    suggestionWeight: 0.02,
    marketShare: 2.1,
    strictness: 'low',
    commonRejectionReasons: [
      'Regional licensing issues',
      'Metadata formatting',
      'Duplicate detection',
      'Audio quality standards'
    ]
  }
} as const;

// Calculate DSP readiness score based on warnings
export function calculateDSPReadinessScore(
  warnings: EnhancedValidationWarning[],
  targetPlatforms: string[] = Object.keys(DSP_PLATFORMS)
): DSPReadinessReport {
  const platformScores = targetPlatforms.map(platformKey => {
    const platform = DSP_PLATFORMS[platformKey as keyof typeof DSP_PLATFORMS];
    if (!platform) return null;

    let score = 100;
    const criticalIssues: string[] = [];
    const warningIssues: string[] = [];

    warnings.forEach(warning => {
      switch (warning.type) {
        case 'error':
          score -= platform.criticalWeight * 100;
          criticalIssues.push(warning.message);
          break;
        case 'warning':
          score -= platform.warningWeight * 100;
          warningIssues.push(warning.message);
          break;
        case 'suggestion':
          score -= platform.suggestionWeight * 100;
          break;
      }
    });

    return {
      platform: platform.name,
      score: Math.max(0, Math.round(score)),
      criticalIssues: [...new Set(criticalIssues)],
      warnings: [...new Set(warningIssues)]
    };
  }).filter(Boolean) as DSPReadinessReport['platformSpecificScores'];

  const overallScore = Math.round(
    platformScores.reduce((sum, p) => sum + p.score, 0) / platformScores.length
  );

  const errorCount = warnings.filter(w => w.type === 'error').length;
  const warningCount = warnings.filter(w => w.type === 'warning').length;

  const submissionReadiness: 'ready' | 'needs_work' | 'not_ready' =
    errorCount > 0 ? 'not_ready' :
      warningCount > 3 ? 'needs_work' : 'ready';

  const estimatedRejectionRisk = Math.min(100, Math.max(0,
    (errorCount * 30) + (warningCount * 15) + (warnings.length * 2)
  ));

  const recommendedActions = generateRecommendedActions(warnings);
  const complianceChecklist = generateComplianceChecklist(warnings);

  return {
    overallScore,
    platformSpecificScores: platformScores,
    submissionReadiness,
    estimatedRejectionRisk,
    recommendedActions,
    complianceChecklist
  };
}

// Generate recommended actions based on warnings
function generateRecommendedActions(warnings: EnhancedValidationWarning[]) {
  const actions = [];
  const errorCount = warnings.filter(w => w.type === 'error').length;
  const warningCount = warnings.filter(w => w.type === 'warning').length;
  const suggestionCount = warnings.filter(w => w.type === 'suggestion').length;

  if (errorCount > 0) {
    actions.push({
      priority: 'critical' as const,
      action: 'Fix all critical errors immediately',
      impact: 'Prevents automatic DSP rejection',
      timeEstimate: `${Math.max(5, errorCount * 3)}-${Math.max(10, errorCount * 5)} minutes`,
      platforms: ['All DSPs']
    });
  }

  if (warningCount > 2) {
    actions.push({
      priority: 'high' as const,
      action: 'Review and address major warnings',
      impact: 'Significantly improves approval chances',
      timeEstimate: `${Math.max(3, warningCount * 2)}-${Math.max(8, warningCount * 3)} minutes`,
      platforms: ['Spotify', 'Apple Music']
    });
  }

  if (suggestionCount > 0) {
    actions.push({
      priority: 'medium' as const,
      action: 'Consider applying quality suggestions',
      impact: 'Enhances overall submission quality',
      timeEstimate: `${Math.max(2, suggestionCount)}-${Math.max(5, suggestionCount * 2)} minutes`,
      platforms: ['All platforms']
    });
  }

  // Add specific recommendations based on warning groups
  const warningGroups = [...new Set(warnings.map(w => w.warningGroup).filter(Boolean))];

  if (warningGroups.includes('special_chars')) {
    actions.push({
      priority: 'high' as const,
      action: 'Remove all special characters from titles',
      impact: 'Prevents encoding issues across platforms',
      timeEstimate: '2-5 minutes',
      platforms: ['Spotify', 'Apple Music', 'Amazon Music']
    });
  }

  if (warningGroups.includes('feat')) {
    actions.push({
      priority: 'medium' as const,
      action: 'Standardize featuring artist format',
      impact: 'Improves metadata consistency',
      timeEstimate: '3-7 minutes',
      platforms: ['All DSPs']
    });
  }

  return actions.slice(0, 5); // Limit to top 5 actions
}

// Generate compliance checklist
function generateComplianceChecklist(warnings: EnhancedValidationWarning[]) {
  const albumTitleIssues = warnings.filter(w => w.field.includes('album'));
  const trackTitleIssues = warnings.filter(w => w.field.includes('track'));
  const artistNameIssues = warnings.filter(w => w.field.includes('artist'));

  return [
    {
      category: 'Basic Information',
      checks: [
        {
          item: 'Album title format',
          status: albumTitleIssues.some(w => w.type === 'error') ? 'fail' :
            albumTitleIssues.some(w => w.type === 'warning') ? 'warning' : 'pass',
          requirement: 'No special characters, proper length limits'
        } as const,
        {
          item: 'Artist name consistency',
          status: artistNameIssues.some(w => w.type === 'error') ? 'fail' :
            artistNameIssues.some(w => w.type === 'warning') ? 'warning' : 'pass',
          requirement: 'Consistent across all tracks'
        } as const,
        {
          item: 'Track title format',
          status: trackTitleIssues.some(w => w.type === 'error') ? 'fail' :
            trackTitleIssues.some(w => w.type === 'warning') ? 'warning' : 'pass',
          requirement: 'Proper featuring format, version notation'
        } as const
      ]
    },
    {
      category: 'Metadata Quality',
      checks: [
        {
          item: 'Genre classification',
          status: 'pass' as const,
          requirement: 'Primary and secondary genres assigned'
        },
        {
          item: 'Release date configuration',
          status: 'pass' as const,
          requirement: 'Future date with adequate lead time'
        },
        {
          item: 'Copyright information',
          status: 'pass' as const,
          requirement: 'Complete publishing and credit data'
        }
      ]
    },
    {
      category: 'Technical Requirements',
      checks: [
        {
          item: 'Audio quality standards',
          status: 'pass' as const,
          requirement: 'Minimum 16-bit/44.1kHz, no clipping'
        },
        {
          item: 'File format compliance',
          status: 'pass' as const,
          requirement: 'WAV or FLAC for masters'
        },
        {
          item: 'Artwork specifications',
          status: 'pass' as const,
          requirement: '3000x3000px minimum, RGB color space'
        }
      ]
    }
  ];
}

// Analyze user interaction patterns
export function analyzeUserPatterns(analytics: ValidationAnalytics) {
  const insights = [];

  // Time-based insights
  if (analytics.timeToFirstFix > 300) { // 5 minutes
    insights.push({
      type: 'efficiency',
      severity: 'medium',
      message: 'Consider prioritizing critical issues first',
      suggestion: 'Start with error-level warnings to prevent rejections'
    });
  }

  // Interaction patterns
  const successRate = analytics.successfulFixes / analytics.totalInteractions;
  if (successRate > 0.8) {
    insights.push({
      type: 'performance',
      severity: 'positive',
      message: 'Excellent validation performance',
      suggestion: 'Your decision-making is highly effective'
    });
  } else if (successRate < 0.5) {
    insights.push({
      type: 'performance',
      severity: 'concern',
      message: 'Consider reviewing suggestions more carefully',
      suggestion: 'Take time to understand each recommendation'
    });
  }

  // Path analysis
  const pathEfficiency = analyzeCompletionPath(analytics.completionPath);
  if (pathEfficiency < 0.6) {
    insights.push({
      type: 'workflow',
      severity: 'medium',
      message: 'Workflow could be more efficient',
      suggestion: 'Focus on one section at a time for better results'
    });
  }

  return insights;
}

// Analyze completion path efficiency
function analyzeCompletionPath(path: ValidationAnalytics['completionPath']): number {
  if (path.length === 0) return 1;

  const successfulActions = path.filter(action => action.result === 'success').length;
  const totalActions = path.length;

  // Calculate efficiency based on success rate and path linearity
  const successRate = successfulActions / totalActions;

  // Measure path linearity (fewer jumps between fields = more linear)
  const fieldSwitches = path.reduce((switches, action, index) => {
    if (index === 0) return 0;
    return action.fieldId !== path[index - 1].fieldId ? switches + 1 : switches;
  }, 0);

  const linearityScore = Math.max(0, 1 - (fieldSwitches / totalActions));

  return (successRate * 0.7) + (linearityScore * 0.3);
}

// Export analytics data for reporting
export function exportAnalyticsData(analytics: ValidationAnalytics) {
  return {
    summary: {
      sessionDuration: analytics.endTime
        ? (analytics.endTime.getTime() - analytics.startTime.getTime()) / 1000
        : 0,
      totalInteractions: analytics.totalInteractions,
      successRate: analytics.successfulFixes / analytics.totalInteractions,
      avgTimePerInteraction: analytics.totalInteractions > 0
        ? ((analytics.endTime?.getTime() || Date.now()) - analytics.startTime.getTime()) / 1000 / analytics.totalInteractions
        : 0
    },
    insights: analyzeUserPatterns(analytics),
    recommendations: generatePerformanceRecommendations(analytics),
    exportTimestamp: new Date().toISOString()
  };
}

// Generate performance recommendations
function generatePerformanceRecommendations(analytics: ValidationAnalytics) {
  const recommendations = [];

  if (analytics.timeToFirstFix > 180) {
    recommendations.push({
      area: 'Decision Speed',
      recommendation: 'Consider starting with the most obvious fixes first',
      impact: 'Builds momentum and confidence for tackling complex issues'
    });
  }

  if (analytics.mostProblematicFields.length > 0) {
    recommendations.push({
      area: 'Focus Areas',
      recommendation: `Pay special attention to: ${analytics.mostProblematicFields.join(', ')}`,
      impact: 'These fields consistently require the most attention'
    });
  }

  const pathEfficiency = analyzeCompletionPath(analytics.completionPath);
  if (pathEfficiency < 0.7) {
    recommendations.push({
      area: 'Workflow',
      recommendation: 'Try completing all issues in one section before moving to the next',
      impact: 'Reduces context switching and improves focus'
    });
  }

  return recommendations;
}
