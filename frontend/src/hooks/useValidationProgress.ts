import { useState, useEffect, useCallback, useRef } from 'react'
import { ValidationProgress } from '@/types/validationAdvanced'

interface ProgressMilestone {
  timestamp: Date
  event: string
  issueCount: number
  description?: string
}

interface ProgressAnalytics {
  sessionDuration: number // in seconds
  issuesResolvedRate: number // issues per minute
  improvementTrend: 'accelerating' | 'steady' | 'slowing'
  efficiencyScore: number // 0-100
  timeToFirstFix: number // seconds
  avgTimePerFix: number // seconds
}

export function useValidationProgress() {
  const [progress, setProgress] = useState<ValidationProgress>({
    sessionStart: new Date(),
    initialIssueCount: 0,
    currentIssueCount: 0,
    issuesFixed: 0,
    timeSpent: 0,
    velocity: 0,
    milestones: []
  })

  const [isTracking, setIsTracking] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()
  const lastUpdateRef = useRef<Date>(new Date())

  // Start progress tracking
  const startTracking = useCallback((initialIssueCount: number) => {
    const now = new Date()
    setProgress({
      sessionStart: now,
      initialIssueCount,
      currentIssueCount: initialIssueCount,
      issuesFixed: 0,
      timeSpent: 0,
      velocity: 0,
      milestones: [{
        timestamp: now,
        event: 'session_start',
        issueCount: initialIssueCount
      }]
    })
    setIsTracking(true)
    lastUpdateRef.current = now
  }, [])

  // Stop progress tracking
  const stopTracking = useCallback(() => {
    setIsTracking(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }, [])

  // Update current issue count
  const updateIssueCount = useCallback((newIssueCount: number, event?: string) => {
    setProgress(prev => {
      const now = new Date()
      const issuesFixed = Math.max(0, prev.initialIssueCount - newIssueCount)
      const timeSpentSeconds = Math.floor((now.getTime() - prev.sessionStart.getTime()) / 1000)
      const velocity = timeSpentSeconds > 0 ? (issuesFixed / (timeSpentSeconds / 60)) : 0

      const newMilestone: ProgressMilestone = {
        timestamp: now,
        event: event || 'issue_update',
        issueCount: newIssueCount
      }

      // Add milestone if significant change
      const shouldAddMilestone = 
        event || 
        Math.abs(newIssueCount - prev.currentIssueCount) >= 1 ||
        prev.milestones.length === 0

      return {
        ...prev,
        currentIssueCount: newIssueCount,
        issuesFixed,
        timeSpent: timeSpentSeconds,
        velocity,
        milestones: shouldAddMilestone 
          ? [...prev.milestones, newMilestone]
          : prev.milestones
      }
    })
  }, [])

  // Record specific events
  const recordMilestone = useCallback((event: string, description?: string) => {
    setProgress(prev => {
      const milestone: ProgressMilestone = {
        timestamp: new Date(),
        event,
        issueCount: prev.currentIssueCount,
        description
      }

      return {
        ...prev,
        milestones: [...prev.milestones, milestone]
      }
    })
  }, [])

  // Calculate analytics
  const getAnalytics = useCallback((): ProgressAnalytics => {
    const sessionDuration = progress.timeSpent
    const issuesResolvedRate = progress.velocity
    
    // Determine improvement trend based on recent milestones
    const recentMilestones = progress.milestones.slice(-5)
    let improvementTrend: 'accelerating' | 'steady' | 'slowing' = 'steady'
    
    if (recentMilestones.length >= 3) {
      const firstHalf = recentMilestones.slice(0, Math.floor(recentMilestones.length / 2))
      const secondHalf = recentMilestones.slice(Math.floor(recentMilestones.length / 2))
      
      const firstHalfRate = firstHalf.length > 1 
        ? (firstHalf[0].issueCount - firstHalf[firstHalf.length - 1].issueCount) / firstHalf.length
        : 0
      const secondHalfRate = secondHalf.length > 1
        ? (secondHalf[0].issueCount - secondHalf[secondHalf.length - 1].issueCount) / secondHalf.length
        : 0

      if (secondHalfRate > firstHalfRate * 1.2) {
        improvementTrend = 'accelerating'
      } else if (secondHalfRate < firstHalfRate * 0.8) {
        improvementTrend = 'slowing'
      }
    }

    // Calculate efficiency score
    const expectedFixRate = 0.5 // issues per minute (baseline)
    const actualFixRate = progress.velocity
    const efficiencyScore = Math.min(100, Math.round((actualFixRate / expectedFixRate) * 100))

    // Time to first fix
    const firstFixMilestone = progress.milestones.find(m => 
      m.issueCount < progress.initialIssueCount
    )
    const timeToFirstFix = firstFixMilestone 
      ? Math.floor((firstFixMilestone.timestamp.getTime() - progress.sessionStart.getTime()) / 1000)
      : 0

    // Average time per fix
    const avgTimePerFix = progress.issuesFixed > 0 
      ? Math.round(sessionDuration / progress.issuesFixed)
      : 0

    return {
      sessionDuration,
      issuesResolvedRate,
      improvementTrend,
      efficiencyScore,
      timeToFirstFix,
      avgTimePerFix
    }
  }, [progress])

  // Get progress percentage
  const getProgressPercentage = useCallback((): number => {
    if (progress.initialIssueCount === 0) return 100
    return Math.round((progress.issuesFixed / progress.initialIssueCount) * 100)
  }, [progress])

  // Get time-based insights
  const getTimeInsights = useCallback() => {
    const analytics = getAnalytics()
    const insights = []

    if (analytics.timeToFirstFix > 300) { // 5 minutes
      insights.push({
        type: 'warning',
        message: 'Consider starting with the most critical issues first',
        suggestion: 'Focus on error-level issues before warnings and suggestions'
      })
    }

    if (analytics.improvementTrend === 'accelerating') {
      insights.push({
        type: 'positive',
        message: 'Great! You\'re getting faster at resolving issues',
        suggestion: 'Keep up the momentum'
      })
    } else if (analytics.improvementTrend === 'slowing') {
      insights.push({
        type: 'neutral',
        message: 'Consider taking a short break to maintain focus',
        suggestion: 'Fresh perspective often helps with remaining issues'
      })
    }

    if (analytics.efficiencyScore > 80) {
      insights.push({
        type: 'positive',
        message: 'Excellent efficiency! You\'re resolving issues quickly',
        suggestion: 'Your validation skills are improving'
      })
    } else if (analytics.efficiencyScore < 40) {
      insights.push({
        type: 'suggestion',
        message: 'Take time to understand each suggestion before deciding',
        suggestion: 'Quality decisions are better than quick ones'
      })
    }

    return insights
  }, [getAnalytics])

  // Export progress data
  const exportProgress = useCallback(() => {
    return {
      progress,
      analytics: getAnalytics(),
      insights: getTimeInsights(),
      exportDate: new Date().toISOString()
    }
  }, [progress, getAnalytics, getTimeInsights])

  // Timer effect for tracking time
  useEffect(() => {
    if (isTracking) {
      intervalRef.current = setInterval(() => {
        setProgress(prev => ({
          ...prev,
          timeSpent: Math.floor((Date.now() - prev.sessionStart.getTime()) / 1000)
        }))
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isTracking])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    progress,
    isTracking,
    startTracking,
    stopTracking,
    updateIssueCount,
    recordMilestone,
    getAnalytics,
    getProgressPercentage,
    getTimeInsights,
    exportProgress
  }
}