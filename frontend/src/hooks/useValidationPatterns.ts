import { useState, useEffect, useCallback } from 'react'
import { UserValidationPatterns, EnhancedValidationWarning } from '@/types/validationAdvanced'

interface PatternAnalysis {
  preferredFixTypes: string[]
  avgDecisionTime: number
  successfulPatterns: string[]
  avoidedPatterns: string[]
  confidenceScore: number
}

export function useValidationPatterns() {
  const [userPatterns, setUserPatterns] = useState<UserValidationPatterns>({
    preferredSuggestionTypes: [],
    avgDecisionTime: 30,
    acceptanceRate: 0.5,
    dismissalRate: 0.5,
    mostCommonFixes: [],
    learningConfidence: 0
  })

  const [sessionData, setSessionData] = useState({
    interactions: 0,
    acceptances: 0,
    dismissals: 0,
    totalDecisionTime: 0,
    patterns: new Map<string, { count: number, successRate: number }>()
  })

  // Load patterns from localStorage on mount
  useEffect(() => {
    const savedPatterns = localStorage.getItem('validation-user-patterns')
    if (savedPatterns) {
      try {
        setUserPatterns(JSON.parse(savedPatterns))
      } catch (error) {
        console.warn('Failed to parse saved validation patterns:', error)
      }
    }
  }, [])

  // Save patterns when they change
  useEffect(() => {
    localStorage.setItem('validation-user-patterns', JSON.stringify(userPatterns))
  }, [userPatterns])

  // Record user acceptance of a suggestion
  const recordAcceptance = useCallback((warning: EnhancedValidationWarning, decisionTime: number) => {
    setSessionData(prev => ({
      ...prev,
      interactions: prev.interactions + 1,
      acceptances: prev.acceptances + 1,
      totalDecisionTime: prev.totalDecisionTime + decisionTime
    }))

    setUserPatterns(prev => {
      const newPatterns = { ...prev }
      
      // Update preferred suggestion types
      if (!newPatterns.preferredSuggestionTypes.includes(warning.type)) {
        newPatterns.preferredSuggestionTypes.push(warning.type)
      }

      // Update most common fixes
      const fix = warning.suggestedValue || 'unknown'
      const existingFix = newPatterns.mostCommonFixes.find(f => f.fix === fix)
      if (existingFix) {
        existingFix.count++
        existingFix.successRate = Math.min(100, existingFix.successRate + 1)
      } else {
        newPatterns.mostCommonFixes.push({
          fix,
          count: 1,
          successRate: 85
        })
      }

      // Update rates
      const totalInteractions = sessionData.interactions + 1
      newPatterns.acceptanceRate = (prev.acceptanceRate * 0.9) + 
        ((sessionData.acceptances + 1) / totalInteractions * 0.1)
      newPatterns.dismissalRate = 1 - newPatterns.acceptanceRate

      // Update decision time
      newPatterns.avgDecisionTime = (prev.avgDecisionTime * 0.8) + (decisionTime * 0.2)

      // Increase learning confidence
      newPatterns.learningConfidence = Math.min(100, prev.learningConfidence + 2)

      return newPatterns
    })
  }, [sessionData])

  // Record user dismissal of a suggestion
  const recordDismissal = useCallback((warning: EnhancedValidationWarning, decisionTime: number) => {
    setSessionData(prev => ({
      ...prev,
      interactions: prev.interactions + 1,
      dismissals: prev.dismissals + 1,
      totalDecisionTime: prev.totalDecisionTime + decisionTime
    }))

    setUserPatterns(prev => {
      const newPatterns = { ...prev }
      
      // Remove from preferred types if dismissed frequently
      const typeIndex = newPatterns.preferredSuggestionTypes.indexOf(warning.type)
      if (typeIndex > -1 && Math.random() < 0.3) { // 30% chance to remove
        newPatterns.preferredSuggestionTypes.splice(typeIndex, 1)
      }

      // Update rates
      const totalInteractions = sessionData.interactions + 1
      newPatterns.dismissalRate = (prev.dismissalRate * 0.9) + 
        ((sessionData.dismissals + 1) / totalInteractions * 0.1)
      newPatterns.acceptanceRate = 1 - newPatterns.dismissalRate

      // Update decision time
      newPatterns.avgDecisionTime = (prev.avgDecisionTime * 0.8) + (decisionTime * 0.2)

      // Slight increase in learning confidence
      newPatterns.learningConfidence = Math.min(100, prev.learningConfidence + 0.5)

      return newPatterns
    })
  }, [sessionData])

  // Analyze user patterns to provide insights
  const analyzePatterns = useCallback((): PatternAnalysis => {
    const preferredFixTypes = userPatterns.mostCommonFixes
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(fix => fix.fix)

    const successfulPatterns = userPatterns.mostCommonFixes
      .filter(fix => fix.successRate > 80)
      .map(fix => fix.fix)

    const avoidedPatterns = userPatterns.preferredSuggestionTypes.length > 0
      ? ['error', 'warning', 'suggestion'].filter(
          type => !userPatterns.preferredSuggestionTypes.includes(type)
        )
      : []

    return {
      preferredFixTypes,
      avgDecisionTime: userPatterns.avgDecisionTime,
      successfulPatterns,
      avoidedPatterns,
      confidenceScore: userPatterns.learningConfidence
    }
  }, [userPatterns])

  // Get personalized suggestion priority for a warning
  const getSuggestionPriority = useCallback((warning: EnhancedValidationWarning): number => {
    let priority = warning.priority || 5

    // Boost priority if it's a preferred type
    if (userPatterns.preferredSuggestionTypes.includes(warning.type)) {
      priority += 2
    }

    // Boost priority if it's a known successful fix
    const isKnownFix = userPatterns.mostCommonFixes.some(
      fix => warning.suggestedValue?.includes(fix.fix) && fix.successRate > 80
    )
    if (isKnownFix) {
      priority += 3
    }

    // Reduce priority if user typically dismisses this type
    const dismissalRate = userPatterns.dismissalRate
    if (dismissalRate > 0.7) {
      priority -= 1
    }

    return Math.max(1, Math.min(10, priority))
  }, [userPatterns])

  // Predict user decision for a warning
  const predictUserDecision = useCallback((warning: EnhancedValidationWarning): {
    likelyAction: 'accept' | 'dismiss' | 'uncertain'
    confidence: number
    reasoning: string
  } => {
    let acceptScore = 0
    let confidence = userPatterns.learningConfidence / 100

    // Factor in user's general acceptance rate
    acceptScore += userPatterns.acceptanceRate * 50

    // Factor in preferred types
    if (userPatterns.preferredSuggestionTypes.includes(warning.type)) {
      acceptScore += 30
    }

    // Factor in known successful fixes
    const hasKnownFix = userPatterns.mostCommonFixes.some(
      fix => warning.suggestedValue?.includes(fix.fix)
    )
    if (hasKnownFix) {
      acceptScore += 20
    }

    // Factor in warning severity
    if (warning.type === 'error') {
      acceptScore += 25
    } else if (warning.type === 'warning') {
      acceptScore += 15
    }

    const likelyAction = acceptScore > 60 ? 'accept' : 
                        acceptScore > 40 ? 'uncertain' : 'dismiss'

    let reasoning = ''
    if (likelyAction === 'accept') {
      reasoning = 'Based on your patterns, you typically accept similar suggestions'
    } else if (likelyAction === 'dismiss') {
      reasoning = 'Your history suggests you might skip this type of suggestion'
    } else {
      reasoning = 'This falls into an uncertain category based on your patterns'
    }

    return {
      likelyAction,
      confidence: Math.round(confidence * 100),
      reasoning
    }
  }, [userPatterns])

  // Reset patterns (for testing or user preference)
  const resetPatterns = useCallback(() => {
    const defaultPatterns: UserValidationPatterns = {
      preferredSuggestionTypes: [],
      avgDecisionTime: 30,
      acceptanceRate: 0.5,
      dismissalRate: 0.5,
      mostCommonFixes: [],
      learningConfidence: 0
    }
    setUserPatterns(defaultPatterns)
    setSessionData({
      interactions: 0,
      acceptances: 0,
      dismissals: 0,
      totalDecisionTime: 0,
      patterns: new Map()
    })
    localStorage.removeItem('validation-user-patterns')
  }, [])

  // Export patterns for backup/sharing
  const exportPatterns = useCallback(() => {
    return {
      patterns: userPatterns,
      sessionData,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }
  }, [userPatterns, sessionData])

  // Import patterns from backup
  const importPatterns = useCallback((data: any) => {
    try {
      if (data.patterns && data.version === '1.0') {
        setUserPatterns(data.patterns)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to import patterns:', error)
      return false
    }
  }, [])

  return {
    userPatterns,
    sessionData,
    recordAcceptance,
    recordDismissal,
    analyzePatterns,
    getSuggestionPriority,
    predictUserDecision,
    resetPatterns,
    exportPatterns,
    importPatterns
  }
}