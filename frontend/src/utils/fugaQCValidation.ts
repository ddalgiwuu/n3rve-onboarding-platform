// FUGA QC Validation Rules
// Based on common FUGA QC Encyclopedia standards

export interface QCValidationResult {
  isValid: boolean
  severity: 'error' | 'warning' | 'info'
  message: string
  field?: string
  suggestion?: string
}

export interface QCValidationResults {
  errors: QCValidationResult[]
  warnings: QCValidationResult[]
  info: QCValidationResult[]
  isValid: boolean
}

// Common patterns and constants
const DOUBLE_SPACE_REGEX = /  +/g
const LEADING_TRAILING_SPACE_REGEX = /^\s+|\s+$/g
// const SPECIAL_CHARS_REGEX = /[^\p{L}\p{N}\s\-.,!?&()'+/]/gu // Reserved for future use
const PROMOTIONAL_TERMS_REGEX = /\b(NEW|HOT|EXCLUSIVE|FRESH|LATEST|BEST|TOP|SALE|FREE|DOWNLOAD|CLICK|STREAM NOW|OUT NOW|AVAILABLE NOW|LIMITED EDITION|SPECIAL EDITION|DELUXE|BONUS|PRE-ORDER|DIGITAL DOWNLOAD|STREAMING|MUST HAVE|HIT|CHART)\b/i
const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu
const ISRC_REGEX = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/
const COPYRIGHT_YEAR_REGEX = /^(19|20)\d{2}$/
const VERSION_KEYWORDS = ['Remix', 'Acoustic', 'Live', 'Instrumental', 'Demo', 'Radio Edit', 'Extended', 'Clean', 'Explicit', 'Remastered', 'Unplugged', 'Mix', 'Version', 'Special Edition', 'Deluxe Edition', 'Anniversary Edition']

// FUGA specific validations
const GENERIC_ARTIST_NAMES = ['Various Artists', 'Various', 'Unknown Artist', 'Unknown', 'Artist', 'TBD', 'TBA', 'N/A', 'None', 'Untitled']
const MISLEADING_ARTIST_TERMS = ['feat.', 'featuring', 'with', 'vs', 'versus', 'presents', 'pres.', '&', 'and']
const FORBIDDEN_VERSION_TERMS = ['Original', 'Original Mix', 'Original Version', 'Studio Version', 'Album Version']
const LANGUAGE_SPECIFIC_ARTICLES: Record<string, string[]> = {
  french: ['le', 'la', 'les', 'un', 'une', 'des', 'du', 'de'],
  italian: ['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'del', 'dello', 'della', 'dei', 'degli', 'delle'],
  spanish: ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'del', 'al'],
  german: ['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einer', 'einem', 'eines']
}

// Artist name validation
export function validateArtistName(nameKo: string, nameEn: string): QCValidationResult[] {
  const results: QCValidationResult[] = []

  // Check Korean name
  if (nameKo) {
    // Double spaces
    if (DOUBLE_SPACE_REGEX.test(nameKo)) {
      results.push({
        isValid: false,
        severity: 'error',
        message: 'qc.error.doubleSpaces',
        field: 'artist.nameKo',
        suggestion: nameKo.replace(DOUBLE_SPACE_REGEX, ' ')
      })
    }

    // Leading/trailing spaces
    if (LEADING_TRAILING_SPACE_REGEX.test(nameKo)) {
      results.push({
        isValid: false,
        severity: 'error',
        message: 'qc.error.leadingTrailingSpaces',
        field: 'artist.nameKo',
        suggestion: nameKo.trim()
      })
    }

    // Promotional text
    if (PROMOTIONAL_TERMS_REGEX.test(nameKo)) {
      results.push({
        isValid: false,
        severity: 'error',
        message: 'qc.error.promotionalText',
        field: 'artist.nameKo'
      })
    }
  }

  // Check English name
  if (nameEn) {
    // Double spaces
    if (DOUBLE_SPACE_REGEX.test(nameEn)) {
      results.push({
        isValid: false,
        severity: 'error',
        message: 'qc.error.doubleSpaces',
        field: 'artist.nameEn',
        suggestion: nameEn.replace(DOUBLE_SPACE_REGEX, ' ')
      })
    }

    // Leading/trailing spaces
    if (LEADING_TRAILING_SPACE_REGEX.test(nameEn)) {
      results.push({
        isValid: false,
        severity: 'error',
        message: 'qc.error.leadingTrailingSpaces',
        field: 'artist.nameEn',
        suggestion: nameEn.trim()
      })
    }

    // Special characters (allow more for artist names)
    const invalidChars = nameEn.match(/[<>{}[\]\\|^`~]/g)
    if (invalidChars) {
      results.push({
        isValid: false,
        severity: 'error',
        message: 'qc.error.invalidCharacters',
        field: 'artist.nameEn',
        suggestion: nameEn.replace(/[<>{}[\]\\|^`~]/g, '')
      })
    }

    // Promotional text
    if (PROMOTIONAL_TERMS_REGEX.test(nameEn)) {
      results.push({
        isValid: false,
        severity: 'error',
        message: 'qc.error.promotionalText',
        field: 'artist.nameEn'
      })
    }

    // Generic artist names check
    if (GENERIC_ARTIST_NAMES.some(generic => nameEn.toLowerCase() === generic.toLowerCase())) {
      results.push({
        isValid: false,
        severity: 'error',
        message: 'qc.error.genericArtistName',
        field: 'artist.nameEn'
      })
    }

    // Misleading artist terms check
    const hasMisleadingTerms = MISLEADING_ARTIST_TERMS.some(term => 
      nameEn.toLowerCase().includes(term.toLowerCase()) && 
      !nameEn.match(/^[A-Za-z0-9\s]+\s(&|and)\s[A-Za-z0-9\s]+$/) // Allow legitimate "X & Y" or "X and Y" collaborations
    )
    
    if (hasMisleadingTerms) {
      results.push({
        isValid: false,
        severity: 'error',
        message: 'qc.error.misleadingArtistName',
        field: 'artist.nameEn'
      })
    }

    // Check for aka/AKA unless it's part of the official artist name
    if (/\b(aka|AKA|a\.k\.a\.|A\.K\.A\.)\b/.test(nameEn) && !nameEn.toLowerCase().includes('akane')) {
      results.push({
        isValid: false,
        severity: 'warning',
        message: 'qc.warning.akaInArtistName',
        field: 'artist.nameEn'
      })
    }

    // Check for abbreviations that should be full words
    const abbreviations = {
      'ft.': 'featuring',
      'feat.': 'featuring',
      'vs.': 'versus',
      'pres.': 'presents'
    }
    
    Object.entries(abbreviations).forEach(([abbr, full]) => {
      if (nameEn.toLowerCase().includes(abbr)) {
        results.push({
          isValid: false,
          severity: 'error',
          message: 'qc.error.abbreviationInArtistName',
          field: 'artist.nameEn',
          suggestion: nameEn.replace(new RegExp(abbr, 'gi'), full)
        })
      }
    })
  }

  return results
}

// Album/Track title validation
export function validateTrackTitle(titleKo: string, titleEn: string, isAlbum: boolean = false): QCValidationResult[] {
  const results: QCValidationResult[] = []
  const fieldPrefix = isAlbum ? 'album' : 'track'

  // Korean title validation
  if (titleKo) {
    // Double spaces
    if (DOUBLE_SPACE_REGEX.test(titleKo)) {
      results.push({
        isValid: false,
        severity: 'error',
        message: 'qc.error.doubleSpaces',
        field: `${fieldPrefix}.titleKo`,
        suggestion: titleKo.replace(DOUBLE_SPACE_REGEX, ' ')
      })
    }

    // Leading/trailing spaces
    if (LEADING_TRAILING_SPACE_REGEX.test(titleKo)) {
      results.push({
        isValid: false,
        severity: 'error',
        message: 'qc.error.leadingTrailingSpaces',
        field: `${fieldPrefix}.titleKo`,
        suggestion: titleKo.trim()
      })
    }

    // Emojis in titles
    if (EMOJI_REGEX.test(titleKo)) {
      results.push({
        isValid: false,
        severity: 'error',
        message: 'qc.error.emojisInTitle',
        field: `${fieldPrefix}.titleKo`
      })
    }

    // Promotional text
    if (PROMOTIONAL_TERMS_REGEX.test(titleKo)) {
      results.push({
        isValid: false,
        severity: 'error',
        message: 'qc.error.promotionalText',
        field: `${fieldPrefix}.titleKo`
      })
    }
  }

  // English title validation
  if (titleEn) {
    // Double spaces
    if (DOUBLE_SPACE_REGEX.test(titleEn)) {
      results.push({
        isValid: false,
        severity: 'error',
        message: 'qc.error.doubleSpaces',
        field: `${fieldPrefix}.titleEn`,
        suggestion: titleEn.replace(DOUBLE_SPACE_REGEX, ' ')
      })
    }

    // Leading/trailing spaces
    if (LEADING_TRAILING_SPACE_REGEX.test(titleEn)) {
      results.push({
        isValid: false,
        severity: 'error',
        message: 'qc.error.leadingTrailingSpaces',
        field: `${fieldPrefix}.titleEn`,
        suggestion: titleEn.trim()
      })
    }

    // Title case validation
    const words = titleEn.split(' ')
    const titleCaseIssues = words.filter((word, index) => {
      // Skip articles, prepositions, conjunctions unless first word
      const skipWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with']
      if (index > 0 && skipWords.includes(word.toLowerCase())) return false
      
      // Check if first letter is lowercase (when it should be uppercase)
      return word.length > 0 && word[0] === word[0].toLowerCase() && /[a-zA-Z]/.test(word[0])
    })

    if (titleCaseIssues.length > 0) {
      results.push({
        isValid: false,
        severity: 'warning',
        message: 'qc.warning.titleCase',
        field: `${fieldPrefix}.titleEn`,
        suggestion: titleEn.split(' ').map((word, index) => {
          const skipWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with']
          if (index > 0 && skipWords.includes(word.toLowerCase())) return word.toLowerCase()
          return word.charAt(0).toUpperCase() + word.slice(1)
        }).join(' ')
      })
    }

    // Brackets and parentheses validation
    const bracketPairs = [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '{', close: '}' }
    ]

    bracketPairs.forEach(pair => {
      const openCount = (titleEn.match(new RegExp(`\\${pair.open}`, 'g')) || []).length
      const closeCount = (titleEn.match(new RegExp(`\\${pair.close}`, 'g')) || []).length
      
      if (openCount !== closeCount) {
        results.push({
          isValid: false,
          severity: 'error',
          message: 'qc.error.unmatchedBrackets',
          field: `${fieldPrefix}.titleEn`
        })
      }
    })

    // Promotional text
    if (PROMOTIONAL_TERMS_REGEX.test(titleEn)) {
      results.push({
        isValid: false,
        severity: 'error',
        message: 'qc.error.promotionalText',
        field: `${fieldPrefix}.titleEn`
      })
    }
  }

  return results
}

// Version naming validation
export function validateVersionNaming(title: string, version: string): QCValidationResult[] {
  const results: QCValidationResult[] = []

  if (version) {
    // Check for forbidden version terms
    if (FORBIDDEN_VERSION_TERMS.some(term => version.toLowerCase() === term.toLowerCase())) {
      results.push({
        isValid: false,
        severity: 'error',
        message: 'qc.error.forbiddenVersionTerm',
        field: 'track.version',
        suggestion: 'Remove version designation for standard/original versions'
      })
    }

    // Check if version is already in the title
    const versionInTitle = VERSION_KEYWORDS.some(keyword => 
      title.toLowerCase().includes(keyword.toLowerCase())
    )

    if (versionInTitle && version !== 'original') {
      results.push({
        isValid: false,
        severity: 'warning',
        message: 'qc.warning.versionDuplicate',
        field: 'track.version'
      })
    }

    // Version format validation
    if (version !== 'original') {
      // Check proper capitalization for common versions
      const properVersions: Record<string, string> = {
        'remix': 'Remix',
        'acoustic': 'Acoustic',
        'live': 'Live',
        'instrumental': 'Instrumental',
        'demo': 'Demo',
        'radio edit': 'Radio Edit',
        'extended': 'Extended Mix',
        'extended mix': 'Extended Mix',
        'clean': 'Clean',
        'explicit': 'Explicit',
        'remastered': 'Remastered',
        'unplugged': 'Unplugged'
      }

      const lowerVersion = version.toLowerCase()
      if (properVersions[lowerVersion] && version !== properVersions[lowerVersion]) {
        results.push({
          isValid: false,
          severity: 'warning',
          message: 'qc.warning.versionCapitalization',
          field: 'track.version',
          suggestion: properVersions[lowerVersion]
        })
      }

      // Version should be in parentheses at the end of title
      const versionPattern = /\s*\([^)]+\)\s*$/
      if (!versionPattern.test(title)) {
        results.push({
          isValid: false,
          severity: 'info',
          message: 'qc.info.versionFormat',
          field: 'track.version',
          suggestion: `${title.trim()} (${version})`
        })
      }
    }
  }

  return results
}

// Featuring artist format validation
export function validateFeaturingFormat(featuring: string): QCValidationResult[] {
  const results: QCValidationResult[] = []

  if (featuring) {
    // Check for correct format
    const validFormats = ['feat.', 'Feat.', 'ft.', 'Ft.', 'featuring', 'Featuring']
    const hasValidFormat = validFormats.some(format => featuring.includes(format))

    if (!hasValidFormat) {
      // Check if it's just the artist name without prefix
      if (!featuring.includes('.') && !featuring.toLowerCase().includes('feat')) {
        results.push({
          isValid: false,
          severity: 'warning',
          message: 'qc.warning.featuringFormat',
          field: 'track.featuring',
          suggestion: `feat. ${featuring}`
        })
      }
    }

    // Check for inconsistent formatting
    const incorrectFormats = ['Feat', 'feat', 'FT', 'ft', 'Featuring.', 'featuring.']
    incorrectFormats.forEach(format => {
      if (featuring.includes(format)) {
        results.push({
          isValid: false,
          severity: 'warning',
          message: 'qc.warning.featuringInconsistent',
          field: 'track.featuring',
          suggestion: featuring.replace(format, 'feat.')
        })
      }
    })
  }

  return results
}

// ISRC format validation
export function validateISRC(isrc: string): QCValidationResult[] {
  const results: QCValidationResult[] = []

  if (isrc) {
    if (!ISRC_REGEX.test(isrc)) {
      results.push({
        isValid: false,
        severity: 'error',
        message: 'qc.error.invalidISRC',
        field: 'track.isrc',
        suggestion: 'Format: CCXXXYYNNNNNNN (e.g., USKRE2400001)'
      })
    }
  }

  return results
}

// Copyright validation
export function validateCopyright(year: string, cRights: string, pRights: string): QCValidationResult[] {
  const results: QCValidationResult[] = []

  // Validate year
  if (year) {
    if (!COPYRIGHT_YEAR_REGEX.test(year)) {
      results.push({
        isValid: false,
        severity: 'error',
        message: 'qc.error.invalidCopyrightYear',
        field: 'release.copyrightYear'
      })
    }

    const currentYear = new Date().getFullYear()
    const yearNum = parseInt(year)
    
    if (yearNum > currentYear) {
      results.push({
        isValid: false,
        severity: 'error',
        message: 'qc.error.futureCopyrightYear',
        field: 'release.copyrightYear'
      })
    }
  }

  // Validate C rights format
  if (cRights) {
    if (cRights.includes('©') || cRights.includes('(C)') || cRights.includes('(c)')) {
      results.push({
        isValid: false,
        severity: 'warning',
        message: 'qc.warning.copyrightSymbolIncluded',
        field: 'release.cRights',
        suggestion: cRights.replace(/©|\(C\)|\(c\)/g, '').trim()
      })
    }
  }

  // Validate P rights format
  if (pRights) {
    if (pRights.includes('℗') || pRights.includes('(P)') || pRights.includes('(p)')) {
      results.push({
        isValid: false,
        severity: 'warning',
        message: 'qc.warning.copyrightSymbolIncluded',
        field: 'release.pRights',
        suggestion: pRights.replace(/℗|\(P\)|\(p\)/g, '').trim()
      })
    }
  }

  return results
}

// Format classification validation
export function validateFormatClassification(format: string, trackCount: number): QCValidationResult[] {
  const results: QCValidationResult[] = []

  // FUGA format rules:
  // Single: 1-3 tracks (same title)
  // EP: 4-6 tracks  
  // Album: 7+ tracks
  let expectedFormat = ''
  
  if (trackCount >= 1 && trackCount <= 3) {
    expectedFormat = 'Single'
  } else if (trackCount >= 4 && trackCount <= 6) {
    expectedFormat = 'EP'
  } else if (trackCount >= 7) {
    expectedFormat = 'Album'
  }

  if (format && expectedFormat && format !== expectedFormat) {
    results.push({
      isValid: false,
      severity: 'error',
      message: 'qc.error.incorrectFormat',
      field: 'album.format',
      suggestion: `Based on ${trackCount} tracks, format should be "${expectedFormat}"`
    })
  }

  return results
}

// Language-specific casing validation
export function validateLanguageCasing(title: string, language: string): QCValidationResult[] {
  const results: QCValidationResult[] = []

  if (!title || !language) return results

  const sentenceCaseLanguages = ['french', 'italian', 'spanish', 'swedish', 'norwegian', 'danish']
  
  if (sentenceCaseLanguages.includes(language.toLowerCase())) {
    // Check if title uses sentence case (only first word and proper nouns capitalized)
    const words = title.split(' ')
    const incorrectWords: string[] = []
    
    words.forEach((word, index) => {
      // Skip first word, proper nouns, and language-specific articles
      if (index === 0) return
      
      const articles = LANGUAGE_SPECIFIC_ARTICLES[language.toLowerCase()] || []
      if (articles.includes(word.toLowerCase())) return
      
      // Check if word is improperly capitalized (excluding all-caps abbreviations)
      if (word.length > 1 && word[0] === word[0].toUpperCase() && word !== word.toUpperCase()) {
        incorrectWords.push(word)
      }
    })

    if (incorrectWords.length > 0) {
      results.push({
        isValid: false,
        severity: 'warning',
        message: 'qc.warning.sentenceCaseRequired',
        field: 'title',
        suggestion: `${language} titles should use sentence case. Check: ${incorrectWords.join(', ')}`
      })
    }
  }

  return results
}

// German orthography validation
export function validateGermanOrthography(text: string): QCValidationResult[] {
  const results: QCValidationResult[] = []

  if (!text) return results

  // Check for incorrect German character replacements
  // Note: These replacements are context-dependent and should be manually verified
  // const incorrectReplacements = [
  //   { incorrect: 'ae', correct: 'ä', pattern: /\b\w*ae\w*\b/gi },
  //   { incorrect: 'oe', correct: 'ö', pattern: /\b\w*oe\w*\b/gi },
  //   { incorrect: 'ue', correct: 'ü', pattern: /\b\w*ue\w*\b/gi },
  //   { incorrect: 'ss', correct: 'ß', pattern: /\b\w*ss\w*\b/gi }
  // ]

  // Common German words that should use proper characters
  const germanWords = {
    'fuer': 'für',
    'ueber': 'über',
    'koennen': 'können',
    'moechte': 'möchte',
    'waehrend': 'während',
    'grosse': 'große',
    'strasse': 'straße'
  }

  Object.entries(germanWords).forEach(([incorrect, correct]) => {
    if (text.toLowerCase().includes(incorrect)) {
      results.push({
        isValid: false,
        severity: 'warning',
        message: 'qc.warning.germanOrthography',
        field: 'text',
        suggestion: text.replace(new RegExp(incorrect, 'gi'), correct)
      })
    }
  })

  return results
}

// Parental Advisory validation
export function validateParentalAdvisory(tracks: any[], hasExplicitContent: boolean): QCValidationResult[] {
  const results: QCValidationResult[] = []

  // Check if any track has explicit lyrics
  const hasExplicitTracks = tracks.some(track => 
    track.lyricsExplicit === true || 
    track.titleEn?.toLowerCase().includes('explicit') ||
    track.trackVersion?.toLowerCase() === 'explicit'
  )

  // Check if any track has clean version
  const hasCleanVersions = tracks.some(track => 
    track.trackVersion?.toLowerCase() === 'clean' ||
    track.titleEn?.toLowerCase().includes('clean')
  )

  if (hasExplicitTracks && !hasExplicitContent) {
    results.push({
      isValid: false,
      severity: 'error',
      message: 'qc.error.parentalAdvisoryMissing',
      field: 'album.parentalAdvisory'
    })
  }

  if (!hasExplicitTracks && hasExplicitContent) {
    results.push({
      isValid: false,
      severity: 'warning',
      message: 'qc.warning.parentalAdvisoryUnnecessary',
      field: 'album.parentalAdvisory'
    })
  }

  if (hasCleanVersions && !hasExplicitTracks) {
    results.push({
      isValid: false,
      severity: 'warning',
      message: 'qc.warning.cleanVersionWithoutExplicit',
      field: 'tracks'
    })
  }

  return results
}

// Language consistency validation
export function validateLanguageConsistency(tracks: any[]): QCValidationResult[] {
  const results: QCValidationResult[] = []

  // Check if all tracks have consistent language settings
  const languages = tracks.map(t => t.lyricsLanguage).filter(Boolean)
  const uniqueLanguages = [...new Set(languages)]

  if (uniqueLanguages.length > 2) {
    results.push({
      isValid: false,
      severity: 'warning',
      message: 'qc.warning.mixedLanguages',
      field: 'tracks'
    })
  }

  return results
}

// Release date validation
export function validateReleaseDate(releaseDate: string): QCValidationResult[] {
  const results: QCValidationResult[] = []

  if (releaseDate) {
    const today = new Date()
    const release = new Date(releaseDate)
    const daysDiff = Math.ceil((release.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff < 0) {
      results.push({
        isValid: false,
        severity: 'error',
        message: 'qc.error.pastReleaseDate',
        field: 'release.consumerReleaseDate'
      })
    } else if (daysDiff < 14) {
      results.push({
        isValid: false,
        severity: 'warning',
        message: 'qc.warning.shortReleaseNotice',
        field: 'release.consumerReleaseDate'
      })
    }
  }

  return results
}

// Genre validation
export function validateGenre(genres: string[]): QCValidationResult[] {
  const results: QCValidationResult[] = []

  if (genres.length === 0) {
    results.push({
      isValid: false,
      severity: 'error',
      message: 'qc.error.noGenre',
      field: 'artist.genre'
    })
  }

  if (genres.length > 3) {
    results.push({
      isValid: false,
      severity: 'warning',
      message: 'qc.warning.tooManyGenres',
      field: 'artist.genre'
    })
  }

  return results
}

// Single title consistency validation
export function validateSingleTitleConsistency(albumTitle: string, tracks: any[]): QCValidationResult[] {
  const results: QCValidationResult[] = []

  // For singles (1-3 tracks), all tracks should have the same base title as the album
  if (tracks.length >= 1 && tracks.length <= 3) {
    const albumTitleBase = albumTitle.replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase()
    
    tracks.forEach((track, index) => {
      const trackTitleBase = (track.titleEn || track.titleKo || '')
        .replace(/\s*\([^)]*\)\s*$/, '')
        .trim()
        .toLowerCase()
      
      if (trackTitleBase && trackTitleBase !== albumTitleBase) {
        results.push({
          isValid: false,
          severity: 'error',
          message: 'qc.error.singleTitleMismatch',
          field: `track[${index}].title`,
          suggestion: 'Single format requires all tracks to have the same title as the album'
        })
      }
    })
  }

  return results
}

// Comprehensive validation function
export function validateSubmission(data: any): QCValidationResults {
  const allResults: QCValidationResult[] = []

  // Artist validation
  if (data.artist) {
    allResults.push(...validateArtistName(data.artist.nameKo, data.artist.nameEn))
    allResults.push(...validateGenre(data.artist.genre || []))
  }

  // Album validation
  if (data.album) {
    allResults.push(...validateTrackTitle(data.album.titleKo, data.album.titleEn, true))
    
    // Format classification validation
    if (data.tracks) {
      allResults.push(...validateFormatClassification(data.album.format, data.tracks.length))
      
      // Single title consistency check
      const albumTitle = data.album.titleEn || data.album.titleKo
      if (albumTitle) {
        allResults.push(...validateSingleTitleConsistency(albumTitle, data.tracks))
      }
    }

    // Parental advisory validation
    if (data.tracks) {
      allResults.push(...validateParentalAdvisory(data.tracks, data.album.parentalAdvisory))
    }
  }

  // Track validation
  if (data.tracks) {
    data.tracks.forEach((track: any, index: number) => {
      const trackResults = validateTrackTitle(track.titleKo, track.titleEn)
      trackResults.forEach(result => {
        result.field = `track[${index}].${result.field?.split('.')[1]}`
      })
      allResults.push(...trackResults)

      // Language-specific casing validation
      if (track.lyricsLanguage && track.titleEn) {
        const casingResults = validateLanguageCasing(track.titleEn, track.lyricsLanguage)
        casingResults.forEach(result => {
          result.field = `track[${index}].titleEn`
        })
        allResults.push(...casingResults)
      }

      // German orthography check
      if (track.lyricsLanguage?.toLowerCase() === 'german') {
        if (track.titleEn) {
          const germanResults = validateGermanOrthography(track.titleEn)
          germanResults.forEach(result => {
            result.field = `track[${index}].titleEn`
          })
          allResults.push(...germanResults)
        }
      }

      if (track.featuring) {
        const featResults = validateFeaturingFormat(track.featuring)
        featResults.forEach(result => {
          result.field = `track[${index}].featuring`
        })
        allResults.push(...featResults)
      }

      if (track.isrc) {
        const isrcResults = validateISRC(track.isrc)
        isrcResults.forEach(result => {
          result.field = `track[${index}].isrc`
        })
        allResults.push(...isrcResults)
      }

      if (track.trackVersion && track.trackVersion !== 'original') {
        const versionResults = validateVersionNaming(track.titleEn || track.titleKo, track.trackVersion)
        versionResults.forEach(result => {
          result.field = `track[${index}].version`
        })
        allResults.push(...versionResults)
      }
    })

    allResults.push(...validateLanguageConsistency(data.tracks))
  }

  // Release validation
  if (data.release) {
    allResults.push(...validateReleaseDate(data.release.consumerReleaseDate))
    allResults.push(...validateCopyright(
      data.release.copyrightYear,
      data.release.cRights,
      data.release.pRights
    ))
  }

  // Categorize results
  const errors = allResults.filter(r => r.severity === 'error')
  const warnings = allResults.filter(r => r.severity === 'warning')
  const info = allResults.filter(r => r.severity === 'info')

  return {
    errors,
    warnings,
    info,
    isValid: errors.length === 0
  }
}

// Real-time validation helper
export function validateField(fieldType: string, value: string, additionalData?: any): QCValidationResult[] {
  switch (fieldType) {
    case 'artistNameKo':
    case 'artistNameEn':
      return validateArtistName(
        fieldType === 'artistNameKo' ? value : '',
        fieldType === 'artistNameEn' ? value : ''
      ).filter(r => r.field?.includes(fieldType.replace('artistName', 'artist.name')))
    
    case 'albumTitleKo':
    case 'albumTitleEn':
    case 'trackTitleKo':
    case 'trackTitleEn':
      const isAlbum = fieldType.includes('album')
      return validateTrackTitle(
        fieldType.includes('Ko') ? value : '',
        fieldType.includes('En') ? value : '',
        isAlbum
      ).filter(r => r.field?.includes(fieldType.includes('Ko') ? 'Ko' : 'En'))
    
    case 'featuring':
      return validateFeaturingFormat(value)
    
    case 'isrc':
      return validateISRC(value)
    
    case 'copyrightYear':
      return validateCopyright(value, additionalData?.cRights || '', additionalData?.pRights || '')
    
    case 'releaseDate':
      return validateReleaseDate(value)
    
    case 'genre':
      return validateGenre(additionalData || [])
    
    case 'format':
      return validateFormatClassification(value, additionalData || 0)
    
    case 'parentalAdvisory':
      return validateParentalAdvisory(additionalData?.tracks || [], additionalData?.hasExplicit || false)
    
    default:
      return []
  }
}