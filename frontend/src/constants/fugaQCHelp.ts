// FUGA QC Help Content
// This file now loads content from JSON configuration

import { getQCHelp } from '../utils/fugaQCLoader';
import { useLanguageStore } from '../store/language.store';

// Default language - will be dynamically loaded when used
export const fugaQCHelp = getQCHelp('ko');

// Re-export specific sections for backward compatibility
export const qcResultGuide = fugaQCHelp.resultGuide;
export const qcFAQ = fugaQCHelp.faq;

// Legacy structure for backward compatibility
const legacyFugaQCHelp = {
  overview: fugaQCHelp.overview,

  process: fugaQCHelp.process,

  commonErrors: fugaQCHelp.commonErrors,

  languageRules: fugaQCHelp.languageRules,

  genres: fugaQCHelp.genres,

  metadata: fugaQCHelp.metadata,

  audioSpecs: fugaQCHelp.audioSpecs,

  albumArt: fugaQCHelp.albumArt,

  timeline: fugaQCHelp.timeline,

  tips: fugaQCHelp.tips
};

// Export the legacy structure for backward compatibility
export default legacyFugaQCHelp;
