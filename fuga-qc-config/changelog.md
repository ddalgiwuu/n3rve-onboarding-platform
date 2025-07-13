# FUGA QC Configuration Changelog

All notable changes to the FUGA QC validation rules and help content will be documented in this file.

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