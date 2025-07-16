import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'
import { Disc, FileText, Info, Languages, AlertCircle, ChevronDown, Globe } from 'lucide-react'
import { validateField } from '@/utils/fugaQCValidation'
import QCWarnings from '@/components/submission/QCWarnings'
import { useMemo, useState } from 'react'

const createAlbumSchema = (t: (ko: string, en: string) => string) => z.object({
  primaryTitle: z.string().min(1, t('앨범 제목을 입력해주세요', 'Please enter the album title')),
  hasTranslation: z.boolean().default(false),
  translationLanguage: z.string().optional(),
  translatedTitle: z.string().optional(),
  type: z.enum(['single', 'ep', 'album']),
  releaseVersion: z.string().optional()
}).refine((data) => {
  if (data.hasTranslation && !data.translationLanguage) {
    return false
  }
  if (data.hasTranslation && !data.translatedTitle?.trim()) {
    return false
  }
  return true
}, {
  message: t('번역 정보를 모두 입력해주세요', 'Please enter all translation information'),
  path: ["translatedTitle"]
})

type AlbumForm = z.infer<ReturnType<typeof createAlbumSchema>>

const getLanguageOptions = (t: (ko: string, en: string) => string) => [
  { value: 'en', label: t('영어', 'English') },
  { value: 'ko', label: t('한국어', 'Korean') },
  { value: 'ja', label: t('일본어', 'Japanese') },
  { value: 'zh', label: t('중국어', 'Chinese') },
  { value: 'es', label: t('스페인어', 'Spanish') },
  { value: 'fr', label: t('프랑스어', 'French') },
  { value: 'de', label: t('독일어', 'German') },
  { value: 'it', label: t('이탈리아어', 'Italian') },
  { value: 'pt', label: t('포르투갈어', 'Portuguese') },
  { value: 'ru', label: t('러시아어', 'Russian') }
]

interface Props {
  data: any
  onNext: (data: AlbumForm) => void
  onPrevious: () => void
}

export default function Step2AlbumInfo({ data, onNext, onPrevious }: Props) {
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<AlbumForm>({
    resolver: zodResolver(createAlbumSchema(t)),
    defaultValues: data?.album || {
      type: 'single',
      hasTranslation: false,
      releaseVersion: ''
    }
  })

  // Watch form values for validation
  const primaryTitle = watch('primaryTitle')
  const hasTranslation = watch('hasTranslation')
  const translationLanguage = watch('translationLanguage')
  const translatedTitle = watch('translatedTitle')
  const albumType = watch('type')
  
  // Real-time QC validation
  const qcValidationResults = useMemo(() => {
    const results = []
    
    if (primaryTitle) {
      results.push(...validateField('albumTitleKo', primaryTitle))
    }
    
    if (translatedTitle) {
      results.push(...validateField('albumTitleEn', translatedTitle))
    }
    
    // Note: Format validation will be done in Step6 when we have track count
    
    return results
  }, [primaryTitle, translatedTitle])

  return (
    <form onSubmit={handleSubmit(
      onNext,
      (errors) => {
        // Find first error and scroll to it
        const firstErrorField = Object.keys(errors)[0]
        let elementId = ''
        
        switch(firstErrorField) {
          case 'primaryTitle':
            elementId = 'album-title-section'
            break
          case 'translationLanguage':
          case 'translatedTitle':
            elementId = 'translation-section'
            break
          case 'type':
            elementId = 'release-info-section'
            break
        }
        
        if (elementId) {
          const element = document.getElementById(elementId)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            // Add visual indicator
            element.classList.add('ring-2', 'ring-red-500', 'ring-offset-2')
            setTimeout(() => {
              element.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2')
            }, 3000)
          }
        }
      }
    )} className="h-full">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {language === 'ko' ? '앨범 정보' : 'Album Information'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'ko' ? '앨범의 기본 정보를 입력해주세요' : 'Enter basic album information'}
          </p>
        </div>
        
        <div className="space-y-6">
          {/* Album Title Section */}
          <div id="album-title-section" className="relative">
            
            {/* Primary Album Title */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {t('앨범 제목', 'Album Title')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    {...register('primaryTitle')}
                    type="text"
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                    placeholder={language === 'ko' ? '예: 나의 첫 번째 앨범' : 'e.g., My First Album'}
                  />
                  {errors.primaryTitle && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.primaryTitle.message}
                    </p>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {language === 'ko' 
                    ? '정확한 앨범 제목을 입력하세요. 특수 문자 사용에 주의하세요.'
                    : 'Enter the exact album title. Be careful with special characters.'
                  }
                </p>
              </div>

              {/* Translation Toggle */}
              <div className="relative mt-6">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-gray-200 via-gray-300 to-transparent dark:from-gray-700 dark:via-gray-600" />
                
                <label htmlFor="hasTranslation" className="flex items-center justify-between p-5 -mx-6 -mb-6 border-t border-gray-100 dark:border-gray-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/10 dark:hover:to-purple-900/10 cursor-pointer transition-all duration-200 rounded-b-2xl group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg flex items-center justify-center group-hover:from-blue-200 group-hover:to-purple-200 dark:group-hover:from-blue-800/30 dark:group-hover:to-purple-800/30 transition-all duration-200">
                      <Languages className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                        {language === 'ko' ? '번역 추가' : 'Add Translation'}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {language === 'ko' 
                          ? '다른 언어로 앨범 제목을 추가할 수 있습니다'
                          : 'Add album title in another language'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      {...register('hasTranslation')}
                      type="checkbox"
                      id="hasTranslation"
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-purple-600"></div>
                  </div>
                </label>
              </div>
            </div>

            {/* Translation Fields */}
            {hasTranslation && (
              <div id="translation-section" className="mt-6 relative overflow-hidden">
                {/* Background gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10 rounded-3xl" />
                
                <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 p-8 shadow-xl animate-fadeIn">
                  {/* Header with icon */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl blur-xl opacity-50 animate-pulse" />
                      <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Languages className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                        {language === 'ko' ? '앨범 제목 번역' : 'Album Title Translation'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {language === 'ko' ? '글로벌 배포를 위한 다국어 앨범 제목' : 'Multi-language album title for global distribution'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-8">
                    {/* Language Selection Grid */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                        {language === 'ko' ? '번역 언어 선택' : 'Select Translation Language'} <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {getLanguageOptions(t).map(lang => (
                          <label
                            key={lang.value}
                            className={`relative cursor-pointer transition-all duration-200 ${
                              translationLanguage === lang.value
                                ? 'scale-105'
                                : 'hover:scale-105'
                            }`}
                          >
                            <input
                              type="radio"
                              value={lang.value}
                              {...register('translationLanguage')}
                              className="sr-only"
                            />
                            <div className={`relative overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                              translationLanguage === lang.value
                                ? 'border-transparent bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg'
                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-700'
                            }`}>
                              <div className="p-3 text-center">
                                <p className={`text-sm font-medium ${
                                  translationLanguage === lang.value
                                    ? 'text-white'
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                  {lang.label}
                                </p>
                                <p className={`text-xs mt-1 ${
                                  translationLanguage === lang.value
                                    ? 'text-white/80'
                                    : 'text-gray-500 dark:text-gray-500'
                                }`}>
                                  {lang.value.toUpperCase()}
                                </p>
                              </div>
                              {translationLanguage === lang.value && (
                                <div className="absolute top-1 right-1">
                                  <div className="w-5 h-5 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                      {errors.translationLanguage && (
                        <p className="mt-3 text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.translationLanguage.message}
                        </p>
                      )}
                    </div>

                    {/* Translated Title Input */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                        {language === 'ko' ? '번역된 앨범 제목' : 'Translated Album Title'} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                        <div className="relative">
                          <input
                            {...register('translatedTitle')}
                            type="text"
                            className="w-full px-6 py-4 border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all text-lg font-medium shadow-sm focus:shadow-lg"
                            placeholder={
                              translationLanguage === 'en' ? 'e.g., My First Album' :
                              translationLanguage === 'ja' ? 'e.g., 私の最初のアルバム' :
                              translationLanguage === 'zh' ? 'e.g., 我的第一张专辑' :
                              translationLanguage === 'es' ? 'e.g., Mi Primer Álbum' :
                              translationLanguage === 'fr' ? 'e.g., Mon Premier Album' :
                              language === 'ko' ? '번역된 앨범 제목을 입력하세요' : 'Enter translated album title'
                            }
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-6">
                            <Globe className="w-6 h-6 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                          </div>
                        </div>
                      </div>
                      {errors.translatedTitle && (
                        <p className="mt-3 text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.translatedTitle.message}
                        </p>
                      )}
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-blue-700 dark:text-blue-300">
                            <p className="font-medium mb-1">
                              {language === 'ko' ? '번역 가이드라인' : 'Translation Guidelines'}
                            </p>
                            <ul className="space-y-1 text-xs text-blue-600 dark:text-blue-400">
                              <li>• {language === 'ko' ? '정확한 의미 전달을 우선시하세요' : 'Prioritize accurate meaning over literal translation'}</li>
                              <li>• {language === 'ko' ? '현지 문화와 언어 특성을 고려하세요' : 'Consider local culture and language characteristics'}</li>
                              <li>• {language === 'ko' ? '특수 문자와 발음 기호를 정확히 입력하세요' : 'Enter special characters and diacritics accurately'}</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Album Type Section */}
          <div id="release-info-section" className="relative">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-n3rve-main to-n3rve-accent rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('발매 형태', 'Release Type')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ko' ? '앨범 형식을 선택하세요' : 'Choose your release format'}</p>
              </div>
            </div>
            
            {/* Release Version Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('릴리즈 버전', 'Release Version')}
              </label>
              <input
                {...register('releaseVersion')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder={t('예: Deluxe Edition, Remastered, Radio Edit', 'e.g., Deluxe Edition, Remastered, Radio Edit')}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t('특별한 버전이나 에디션이 있는 경우 입력하세요', 'Enter if this is a special version or edition')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Single */}
              <label className={`relative group cursor-pointer transition-all duration-300 ${
                albumType === 'single' ? 'scale-105' : 'hover:scale-105'
              }`}>
                <input
                  {...register('type')}
                  type="radio"
                  value="single"
                  className="sr-only"
                />
                <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                  albumType === 'single' 
                    ? 'border-n3rve-main shadow-lg shadow-n3rve-500/25' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-n3rve-300 dark:hover:border-n3rve-700'
                }`}>
                  {albumType === 'single' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-n3rve-500/10 to-n3rve-accent/10" />
                  )}
                  <div className="relative p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors ${
                      albumType === 'single'
                        ? 'bg-gradient-to-br from-n3rve-main to-n3rve-accent'
                        : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-n3rve-100 dark:group-hover:bg-n3rve-900/30'
                    }`}>
                      <Disc className={`w-8 h-8 ${
                        albumType === 'single' ? 'text-white' : 'text-gray-600 dark:text-gray-400 group-hover:text-n3rve-600'
                      }`} />
                    </div>
                    <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                      {language === 'ko' ? '싱글' : 'Single'}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {language === 'ko' ? '1-3 트랙' : '1-3 tracks'}
                    </p>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {language === 'ko' ? '짧은 형식의 릴리즈' : 'Short-form release'}
                    </div>
                  </div>
                  {albumType === 'single' && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 bg-n3rve-main rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </label>
              
              {/* EP */}
              <label className={`relative group cursor-pointer transition-all duration-300 ${
                albumType === 'ep' ? 'scale-105' : 'hover:scale-105'
              }`}>
                <input
                  {...register('type')}
                  type="radio"
                  value="ep"
                  className="sr-only"
                />
                <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                  albumType === 'ep' 
                    ? 'border-n3rve-main shadow-lg shadow-n3rve-500/25' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-n3rve-300 dark:hover:border-n3rve-700'
                }`}>
                  {albumType === 'ep' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-n3rve-500/10 to-n3rve-accent/10" />
                  )}
                  <div className="relative p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors ${
                      albumType === 'ep'
                        ? 'bg-gradient-to-br from-n3rve-main to-n3rve-accent'
                        : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-n3rve-100 dark:group-hover:bg-n3rve-900/30'
                    }`}>
                      <div className="relative">
                        <Disc className={`w-8 h-8 ${
                          albumType === 'ep' ? 'text-white' : 'text-gray-600 dark:text-gray-400 group-hover:text-n3rve-600'
                        }`} />
                        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                          albumType === 'ep' ? 'bg-white text-n3rve-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          EP
                        </div>
                      </div>
                    </div>
                    <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                      {language === 'ko' ? 'EP/미니앨범' : 'EP'}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {language === 'ko' ? '4-6 트랙' : '4-6 tracks'}
                    </p>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {language === 'ko' ? '중간 형식의 릴리즈' : 'Medium-form release'}
                    </div>
                  </div>
                  {albumType === 'ep' && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 bg-n3rve-main rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </label>
              
              {/* Album */}
              <label className={`relative group cursor-pointer transition-all duration-300 ${
                albumType === 'album' ? 'scale-105' : 'hover:scale-105'
              }`}>
                <input
                  {...register('type')}
                  type="radio"
                  value="album"
                  className="sr-only"
                />
                <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                  albumType === 'album' 
                    ? 'border-n3rve-main shadow-lg shadow-n3rve-500/25' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-n3rve-300 dark:hover:border-n3rve-700'
                }`}>
                  {albumType === 'album' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-n3rve-500/10 to-n3rve-accent/10" />
                  )}
                  <div className="relative p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors ${
                      albumType === 'album'
                        ? 'bg-gradient-to-br from-n3rve-main to-n3rve-accent'
                        : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-n3rve-100 dark:group-hover:bg-n3rve-900/30'
                    }`}>
                      <div className="relative">
                        <Disc className={`w-8 h-8 ${
                          albumType === 'album' ? 'text-white' : 'text-gray-600 dark:text-gray-400 group-hover:text-n3rve-600'
                        }`} />
                        <div className={`absolute -bottom-1 -right-1 ${
                          albumType === 'album' ? 'text-yellow-300' : 'text-gray-400 dark:text-gray-600'
                        }`}>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                      {language === 'ko' ? '정규앨범' : 'Album'}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {language === 'ko' ? '7개 이상 트랙' : '7+ tracks'}
                    </p>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {language === 'ko' ? '정규 앨범 릴리즈' : 'Full-length release'}
                    </div>
                  </div>
                  {albumType === 'album' && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 bg-n3rve-main rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>


          
          {/* QC Validation Warnings */}
          {qcValidationResults.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center animate-pulse">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {language === 'ko' ? 'QC 검증 결과' : 'QC Validation Report'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'ko' ? '발견된 문제를 확인하세요' : 'Please check the issues found'}
                  </p>
                </div>
              </div>
              <QCWarnings results={qcValidationResults} />
            </div>
          )}
        </div>
      </div>

    </form>
  )
}