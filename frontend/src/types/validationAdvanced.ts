// Enhanced validation types for advanced feedback system
export interface EnhancedValidationWarning {
  id: string
  type: 'error' | 'warning' | 'suggestion'
  field: string
  message: string
  details?: string
  suggestedValue?: string
  currentValue?: string
  dspExamples?: {
    platform: string
    rejectionMessage: string
    rejectionMessageKo?: string
  }[]
  canIgnore: boolean
  warningGroup?: string
  rejectionProbability?: number
  
  // Advanced features
  priority: number // 1-10, higher = more important
  successRate?: number // 0-100, how often this fix is successful
  industryUsage?: number // 0-100, how often industry uses suggested approach
  fixComplexity: 'easy' | 'medium' | 'complex'
  categoryTags: string[]
  userBehaviorData?: {
    timesShown: number
    timesAccepted: number
    timesDismissed: number
    avgTimeToDecision: number // in seconds
  }
  learnedPattern?: {
    confidence: number // 0-100
    basedOnSamples: number
    recommendation: string
  }
}

export interface ValidationSummary {
  totalFields: number
  validatedFields: number
  completionPercentage: number
  dspReadinessScore: number // 0-100
  estimatedApprovalChance: number // 0-100
  criticalIssuesCount: number
  warningBreakdown: {
    errors: number
    warnings: number
    suggestions: number
  }
  recommendedNextActions: {
    action: string
    priority: 'high' | 'medium' | 'low'
    impact: string
    estimatedTime: string
  }[]
  progressTrend: 'improving' | 'stable' | 'declining'
}

export interface ValidationProgress {
  sessionStart: Date
  initialIssueCount: number
  currentIssueCount: number
  issuesFixed: number
  timeSpent: number // in seconds
  velocity: number // issues fixed per minute
  milestones: {
    timestamp: Date
    event: string
    issueCount: number
  }[]
}

export interface UserValidationPatterns {
  preferredSuggestionTypes: string[]
  avgDecisionTime: number
  acceptanceRate: number
  dismissalRate: number
  mostCommonFixes: {
    fix: string
    count: number
    successRate: number
  }[]
  learningConfidence: number // 0-100
}

export interface IndustryCollaborationData {
  popularChoices: {
    field: string
    option: string
    percentage: number
    successRate: number
  }[]
  benchmarkStats: {
    avgCompletionTime: number
    avgIssueCount: number
    successfulSubmissionRate: number
  }
  quickFixTemplates: {
    id: string
    name: string
    description: string
    applicableWarnings: string[]
    successRate: number
    usageCount: number
    steps: string[]
  }[]
  trendingFixes: {
    fix: string
    popularity: number
    recentSuccessRate: number
  }[]
}

export interface ValidationAnalytics {
  startTime: Date
  endTime?: Date
  totalInteractions: number
  successfulFixes: number
  timeToFirstFix: number
  mostProblematicFields: string[]
  userSatisfactionScore?: number // 1-5
  completionPath: {
    timestamp: Date
    action: string
    fieldId: string
    result: 'success' | 'failure' | 'dismissed'
  }[]
}

export interface DSPReadinessReport {
  overallScore: number
  platformSpecificScores: {
    platform: string
    score: number
    criticalIssues: string[]
    warnings: string[]
  }[]
  submissionReadiness: 'ready' | 'needs_work' | 'not_ready'
  estimatedRejectionRisk: number
  recommendedActions: {
    priority: 'critical' | 'high' | 'medium' | 'low'
    action: string
    impact: string
    timeEstimate: string
    platforms: string[]
  }[]
  complianceChecklist: {
    category: string
    checks: {
      item: string
      status: 'pass' | 'warning' | 'fail'
      requirement: string
    }[]
  }[]
}