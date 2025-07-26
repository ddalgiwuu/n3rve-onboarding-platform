// FUGA QC Configuration Loader
// This module loads QC rules and help content from JSON files

import validationRulesJSON from '../data/fuga-qc/validation-rules.json'
import helpContentJSON from '../data/fuga-qc/help-content.json'
import versionJSON from '../data/fuga-qc/version.json'

export interface QCVersion {
  version: string
  lastUpdated: string
  updatedBy: string
  description: string
}

export interface QCValidationRules {
  patterns: Record<string, string>
  terms: {
    promotional: string[]
    genericArtistNames: string[]
    misleadingArtistTerms: string[]
    forbiddenVersionTerms: string[]
    versionKeywords: string[]
  }
  languageSpecific: {
    articles: Record<string, string[]>
    sentenceCaseLanguages: string[]
    germanWords: Record<string, string>
  }
  formatting: {
    titleCaseSkipWords: string[]
    featuringFormats: {
      valid: string[]
      incorrect: string[]
    }
    abbreviations: Record<string, string>
    versionCapitalization: Record<string, string>
  }
  rules: {
    artist: {
      maxLength: number
      requireBothLanguages: boolean
      allowSpecialChars: string
      preventDoubleSpaces: boolean
      preventLeadingTrailingSpaces: boolean
      preventPromotionalText: boolean
      preventGenericNames: boolean
      preventMisleadingTerms: boolean
      preventEmojis: boolean
    }
    title: {
      maxLength: number
      requireTitleCase: boolean
      preventDoubleSpaces: boolean
      preventLeadingTrailingSpaces: boolean
      preventPromotionalText: boolean
      preventEmojis: boolean
      checkBracketMatching: boolean
      enforceSentenceCaseForLanguages: boolean
    }
    format: {
      single: { minTracks: number; maxTracks: number; requireSameTitle: boolean }
      ep: { minTracks: number; maxTracks: number; requireSameTitle: boolean }
      album: { minTracks: number; maxTracks: number | null; requireSameTitle: boolean }
    }
    release: {
      minDaysNotice: number
      preventPastDates: boolean
      requireCopyrightYear: boolean
      preventCopyrightSymbols: boolean
    }
    genre: {
      minCount: number
      maxCount: number
      requireSelection: boolean
    }
    isrc: {
      format: string
      example: string
      required: boolean
    }
  }
  messages: {
    error: Record<string, string>
    warning: Record<string, string>
    info: Record<string, string>
  }
}

export interface QCHelpContent {
  overview: any
  process: any
  commonErrors: any
  languageRules: any
  genres: any
  metadata: any
  audioSpecs: any
  albumArt: any
  timeline: any
  tips: any
  resultGuide: any
  faq: any[]
}

// Singleton instance
let qcConfigInstance: {
  version: QCVersion
  rules: QCValidationRules
  help: QCHelpContent
} | null = null

// Load configuration
export function loadQCConfig() {
  if (!qcConfigInstance) {
    try {
      qcConfigInstance = {
        version: versionJSON as QCVersion,
        rules: validationRulesJSON as QCValidationRules,
        help: helpContentJSON as QCHelpContent
      }
      
      console.log(`[QC Config] Loaded version ${qcConfigInstance.version?.version || 'unknown'}`)
    } catch (error) {
      console.error('[QC Config] Failed to load configuration:', error)
      // Fallback configuration to prevent crashes
      qcConfigInstance = {
        version: { version: "1.0.0", lastUpdated: "2025-07-13", updatedBy: "System", description: "Fallback config" },
        rules: {
          patterns: {},
          terms: { promotional: [], genericArtistNames: [], misleadingArtistTerms: [], forbiddenVersionTerms: [], versionKeywords: [] },
          languageSpecific: { articles: {}, sentenceCaseLanguages: [], germanWords: {} },
          formatting: { titleCaseSkipWords: [], featuringFormats: { valid: [], incorrect: [] }, abbreviations: {}, versionCapitalization: {} },
          rules: { 
            artist: { maxLength: 100, requireBothLanguages: false, allowSpecialChars: "", preventDoubleSpaces: true, preventLeadingTrailingSpaces: true, preventPromotionalText: true, preventGenericNames: true, preventMisleadingTerms: true, preventEmojis: true },
            title: { maxLength: 100, requireTitleCase: false, preventDoubleSpaces: true, preventLeadingTrailingSpaces: true, preventPromotionalText: true, preventEmojis: true, checkBracketMatching: true, enforceSentenceCaseForLanguages: false },
            format: {
              single: { minTracks: 1, maxTracks: 1, requireSameTitle: false },
              ep: { minTracks: 2, maxTracks: 6, requireSameTitle: false },
              album: { minTracks: 7, maxTracks: null, requireSameTitle: false }
            },
            release: { minDaysNotice: 14, preventPastDates: true, requireCopyrightYear: false, preventCopyrightSymbols: false },
            genre: { minCount: 1, maxCount: 3, requireSelection: true },
            isrc: { format: "^[A-Z]{2}[A-Z0-9]{3}\\d{2}\\d{5}$", example: "USRC17607839", required: false }
          },
          messages: { error: {}, warning: {}, info: {} }
        },
        help: {
          overview: { title: "FUGA QC", description: "Quality Control process", importance: [] },
          process: { title: "QC Process", steps: [] },
          commonErrors: { title: "Common Errors", errors: [] },
          languageRules: { title: "Language Rules", korean: { title: "Korean", rules: [] }, english: { title: "English", rules: [], examples: [] }, japanese: { title: "Japanese", rules: [] } },
          genres: { title: "Genres", tips: [], mapping: {} },
          metadata: { title: "Metadata", required: { title: "Required", fields: [] }, optional: { title: "Optional", fields: [] } },
          audioSpecs: { title: "Audio Specs", required: { format: "", bitDepth: "", sampleRate: "", channels: "" }, dolbyAtmos: { title: "", requirements: [] } },
          albumArt: { title: "Album Art", requirements: [], forbidden: [] },
          timeline: { title: "Timeline", stages: [] },
          tips: { title: "Tips", items: [] },
          faq: [],
          resultGuide: {},
        }
      }
    }
  }
  
  return qcConfigInstance
}

// Get specific configuration
export function getQCVersion(): QCVersion {
  const config = loadQCConfig()
  return config.version
}

export function getQCRules(): QCValidationRules {
  const config = loadQCConfig()
  return config.rules
}

export function getQCHelp(language: 'ko' | 'en' = 'ko'): QCHelpContent {
  const config = loadQCConfig()
  // Check if help content has language structure
  if (config.help && typeof config.help === 'object' && ('ko' in config.help || 'en' in config.help)) {
    return (config.help as any)[language] || (config.help as any)['ko'] || config.help
  }
  return config.help
}

// Helper functions to get specific rule sets
export function getPromotionalTerms(): string[] {
  const rules = getQCRules()
  return rules.terms?.promotional || []
}

export function getGenericArtistNames(): string[] {
  const rules = getQCRules()
  return rules.terms?.genericArtistNames || []
}

export function getMisleadingArtistTerms(): string[] {
  const rules = getQCRules()
  return rules.terms?.misleadingArtistTerms || []
}

export function getForbiddenVersionTerms(): string[] {
  const rules = getQCRules()
  return rules.terms?.forbiddenVersionTerms || []
}

export function getVersionKeywords(): string[] {
  const rules = getQCRules()
  return rules.terms?.versionKeywords || []
}

export function getLanguageArticles(language: string): string[] {
  const rules = getQCRules()
  return rules.languageSpecific?.articles?.[language.toLowerCase()] || []
}

export function getSentenceCaseLanguages(): string[] {
  const rules = getQCRules()
  return rules.languageSpecific?.sentenceCaseLanguages || []
}

export function getGermanWords(): Record<string, string> {
  const rules = getQCRules()
  return rules.languageSpecific?.germanWords || {}
}

export function getTitleCaseSkipWords(): string[] {
  const rules = getQCRules()
  return rules.formatting?.titleCaseSkipWords || []
}

export function getFeaturingFormats(): { valid: string[]; incorrect: string[] } {
  const rules = getQCRules()
  return rules.formatting.featuringFormats
}

export function getAbbreviations(): Record<string, string> {
  const rules = getQCRules()
  return rules.formatting.abbreviations
}

export function getVersionCapitalization(): Record<string, string> {
  const rules = getQCRules()
  return rules.formatting.versionCapitalization
}

export function getErrorMessage(key: string): string {
  const rules = getQCRules()
  return rules.messages.error[key] || key
}

export function getWarningMessage(key: string): string {
  const rules = getQCRules()
  return rules.messages.warning[key] || key
}

export function getInfoMessage(key: string): string {
  const rules = getQCRules()
  return rules.messages.info[key] || key
}

// Pattern compilation helper
export function compilePattern(patternKey: string): RegExp {
  const rules = getQCRules()
  const pattern = rules.patterns[patternKey]
  
  if (!pattern) {
    console.warn(`[QC Config] Pattern not found: ${patternKey}`)
    return new RegExp('')
  }
  
  // Handle unicode patterns
  if (pattern.includes('\\p{') || pattern.includes('\\u{')) {
    return new RegExp(pattern, 'gu')
  }
  
  return new RegExp(pattern, 'g')
}

// Format classification helper
export function getFormatClassification(trackCount: number): 'single' | 'ep' | 'album' | null {
  const rules = getQCRules()
  
  if (trackCount >= rules.rules.format.single.minTracks && 
      trackCount <= rules.rules.format.single.maxTracks) {
    return 'single'
  }
  
  if (trackCount >= rules.rules.format.ep.minTracks && 
      trackCount <= rules.rules.format.ep.maxTracks) {
    return 'ep'
  }
  
  if (trackCount >= rules.rules.format.album.minTracks) {
    return 'album'
  }
  
  return null
}

// Development mode: Watch for changes
if (process.env.NODE_ENV === 'development') {
  // In development, you could implement hot reloading
  // For now, just log the loaded version
  const config = loadQCConfig()
  console.log('[QC Config] Development mode - Version:', config?.version)
}