import { useState } from 'react';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';
import ValidationWarning, { ValidationWarning as ValidationWarningType } from '@/components/ValidationWarning';
import AdvancedValidationDemo from '@/components/validation/AdvancedValidationDemo';
import {
  validateAlbumTitle,
  validateTrackTitle,
  validateArtistName,
  createValidationState
} from '@/utils/inputValidation';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

export default function ValidationDemo() {
  const language = useSafeStore(useLanguageStore, (state) => state.language);
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  const [formData, setFormData] = useState({
    albumTitle: '',
    trackTitle: '',
    artistName: ''
  });

  const [validationWarnings, setValidationWarnings] = useState<Record<string, ValidationWarningType[]>>({});
  const validationState = createValidationState();

  const handleFieldValidation = (field: string, value: string) => {
    let result;
    switch (field) {
      case 'albumTitle':
        result = validateAlbumTitle(value);
        break;
      case 'trackTitle':
        result = validateTrackTitle(value, 1);
        break;
      case 'artistName':
        result = validateArtistName(value, false);
        break;
      default:
        return;
    }

    const activeWarnings = validationState.filterActiveWarnings(result.warnings);
    setValidationWarnings(prev => ({
      ...prev,
      [field]: activeWarnings
    }));
  };

  const handleAcceptSuggestion = (warning: ValidationWarningType) => {
    if (warning.suggestedValue) {
      setFormData(prev => ({
        ...prev,
        [warning.field]: warning.suggestedValue!
      }));
      handleFieldValidation(warning.field, warning.suggestedValue);
    }
    validationState.dismissWarning(warning.id);
  };

  const handleDismissWarning = (warning: ValidationWarningType) => {
    validationState.dismissWarning(warning.id);
    setValidationWarnings(prev => ({
      ...prev,
      [warning.field]: prev[warning.field]?.filter(w => w.id !== warning.id) || []
    }));
  };

  const testCases = [
    { value: 'My Album  featuring  Artist', desc: 'Multiple spaces and featuring' },
    { value: 'Song Title［Remix］（feat. Artist）', desc: 'Non-standard brackets' },
    { value: '1. Track Title', desc: 'Track number in title' },
    { value: 'Title with < special > chars', desc: 'Invalid special characters' },
    { value: 'O.S.T Collection', desc: 'OST formatting' },
    { value: 'Song (Acoustic version)', desc: 'Version formatting' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t('검증 시스템 데모', 'Validation System Demo')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t('기본 검증과 고급 AI 기반 검증 시스템을 비교해보세요', 'Compare basic validation with advanced AI-powered validation system')}
          </p>
        </motion.div>

        <Tabs defaultValue="advanced" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="advanced" className="text-lg py-3">
              {t('고급 검증 시스템', 'Advanced Validation')}
            </TabsTrigger>
            <TabsTrigger value="basic" className="text-lg py-3">
              {t('기본 검증 시스템', 'Basic Validation')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="advanced" className="mt-0">
            <AdvancedValidationDemo language={language as 'ko' | 'en'} />
          </TabsContent>

          <TabsContent value="basic" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                {t('기본 입력 검증', 'Basic Input Validation')}
              </h2>

              <div className="space-y-8">
                {/* Album Title */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {t('앨범 타이틀 검증', 'Album Title Validation')}
                  </h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.albumTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, albumTitle: e.target.value }))}
                      onBlur={(e) => handleFieldValidation('albumTitle', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder={t('앨범 타이틀을 입력하세요', 'Enter album title')}
                    />
                    {validationWarnings.albumTitle && validationWarnings.albumTitle.length > 0 && (
                      <ValidationWarning
                        warnings={validationWarnings.albumTitle}
                        onAcceptSuggestion={handleAcceptSuggestion}
                        onDismissWarning={handleDismissWarning}
                        language={language as 'ko' | 'en'}
                      />
                    )}
                  </div>
                </div>

                {/* Track Title */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {t('트랙 타이틀 검증', 'Track Title Validation')}
                  </h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.trackTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, trackTitle: e.target.value }))}
                      onBlur={(e) => handleFieldValidation('trackTitle', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder={t('트랙 타이틀을 입력하세요', 'Enter track title')}
                    />
                    {validationWarnings.trackTitle && validationWarnings.trackTitle.length > 0 && (
                      <ValidationWarning
                        warnings={validationWarnings.trackTitle}
                        onAcceptSuggestion={handleAcceptSuggestion}
                        onDismissWarning={handleDismissWarning}
                        language={language as 'ko' | 'en'}
                      />
                    )}
                  </div>
                </div>

                {/* Artist Name */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {t('아티스트 이름 검증', 'Artist Name Validation')}
                  </h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.artistName}
                      onChange={(e) => setFormData(prev => ({ ...prev, artistName: e.target.value }))}
                      onBlur={(e) => handleFieldValidation('artistName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder={t('아티스트 이름을 입력하세요', 'Enter artist name')}
                    />
                    {validationWarnings.artistName && validationWarnings.artistName.length > 0 && (
                      <ValidationWarning
                        warnings={validationWarnings.artistName}
                        onAcceptSuggestion={handleAcceptSuggestion}
                        onDismissWarning={handleDismissWarning}
                        language={language as 'ko' | 'en'}
                      />
                    )}
                  </div>
                </div>

                {/* Test Cases */}
                <div className="mt-12">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {t('테스트 케이스', 'Test Cases')}
                  </h3>
                  <div className="grid gap-3">
                    {testCases.map((test, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => {
                          setFormData({ albumTitle: test.value, trackTitle: test.value, artistName: '' });
                          handleFieldValidation('albumTitle', test.value);
                          handleFieldValidation('trackTitle', test.value);
                        }}
                        className="text-left p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="font-mono text-sm text-gray-900 dark:text-gray-100">{test.value}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{test.desc}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Clear Button */}
                <div className="flex justify-center pt-6">
                  <motion.button
                    onClick={() => {
                      setFormData({ albumTitle: '', trackTitle: '', artistName: '' });
                      setValidationWarnings({});
                      validationState.clearDismissed();
                    }}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {t('초기화', 'Clear All')}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
