# FUGA QC Configuration Changelog

All notable changes to the FUGA QC validation rules and help content will be documented in this file.

## [2.1.0] - 2025-07-22

### Added
- **Music Video Thumbnail Requirements (Apple Music)**
  - 16:9 aspect ratio requirement
  - 1920x1080 recommended resolution
  - Must be video capture (not album art)
  - Black bars and letterboxing forbidden
  
- **Soundtrack Title Formats (Apple Music)**
  - Approved title formats for soundtracks
  - O.S.T. abbreviation detection and prevention
  - Proper soundtrack labeling requirements
  
- **Composer/Lyricist Name Rules (Spotify)**
  - Full first and last name required
  - Abbreviations forbidden (Jr., Sr., Dr., etc.)
  - Pseudonyms not allowed

### Enhanced
- Added `videoSpecs.thumbnail` section for video thumbnail validation
- Added `soundtracks.titleFormats` and `forbiddenAbbreviations`
- Added `credits` section for composer/lyricist rules
- New regex patterns: `ostAbbreviation`, `composerAbbreviation`
- Added 10 new error messages for these validations

## [2.0.0] - 2025-07-22

### Added
- **Apple Music Style Guide Integration**
  - Enhanced title case validation rules
  - Language-specific capitalization requirements
  - Accented character support for multiple languages
  - Classical music formatting rules
  - Soundtrack formatting requirements
  
- **Apple Video and Audio Asset Specifications**
  - Audio format requirements (WAV, FLAC, AIFF, ALAC)
  - Sample rate and bit depth specifications
  - Loudness standards (-14 LUFS target)
  - Video resolution and codec requirements
  - Dolby Atmos specifications
  
- **FUGA QC Encyclopedia Rules**
  - Comprehensive ISRC validation patterns
  - UPC/EAN validation with checksum
  - Extended version keywords and formatting
  - Explicit content detection patterns
  - Territory distribution requirements
  
- **New Validation Patterns**
  - All caps detection
  - Multiple punctuation marks detection
  - URL and email detection in metadata
  - Phone number detection
  - Repeated character detection
  - Classical catalog number patterns
  - Remix/version pattern matching

### Enhanced
- **Error Messages**
  - Added 40+ new error messages
  - Improved Korean/English bilingual messages
  - More specific guidance for each error type
  
- **Help Content**
  - Expanded audio specifications section
  - Added video specifications guide
  - Enhanced ISRC/UPC documentation
  - Added explicit content guidelines
  - Classical music special rules
  - Soundtrack special rules
  - Compilation album rules
  - Territory distribution guide

### Structure Updates
- **validation-rules.json**
  - Added `audioSpecs` section
  - Added `videoSpecs` section
  - Added `classicalMusic` section
  - Added `soundtracks` section
  - Added `compilations` section
  - Expanded `rules` with stricter validation
  
- **help-content.json**
  - Added 10 new FAQ entries
  - Expanded common errors examples
  - Added specialized sections for different content types

### Technical Improvements
- More comprehensive regex patterns
- Better Unicode support for emojis
- Enhanced language detection
- Stricter format validation

## [1.0.0] - 2025-07-13

### Added
- Initial release of separated FUGA QC configuration
- Extracted all validation rules from `fugaQCValidation.ts` to `validation-rules.json`
- Extracted all help content from `fugaQCHelp.ts` to `help-content.json`
- Created loader module for dynamic configuration loading
- Added version tracking system

### Structure
- **validation-rules.json**: Contains all validation patterns, terms, rules, and messages
- **help-content.json**: Contains user guides, FAQs, and process information
- **version.json**: Tracks current version and update information

### Benefits
- QC rules can now be updated without code changes
- Version control for all QC configuration changes
- Easier management for non-developers
- Clear separation of concerns

---

## How to Update

1. Make changes to the relevant JSON files
2. Update `version.json` with new version number and date
3. Document changes in this changelog
4. Commit and push changes
5. Deploy using the automated deployment script

## Version Format

We use Semantic Versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Incompatible rule changes that might break existing validations
- **MINOR**: New rules or features added in a backwards compatible manner
- **PATCH**: Bug fixes or minor adjustments to existing rules