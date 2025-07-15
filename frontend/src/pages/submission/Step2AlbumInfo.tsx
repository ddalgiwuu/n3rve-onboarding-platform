import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'
import { Disc, FileText, Info, Languages, AlertCircle } from 'lucide-react'
import { validateField } from '@/utils/fugaQCValidation'
import QCWarnings from '@/components/submission/QCWarnings'
import { useMemo, useState } from 'react'

const createAlbumSchema = (t: (ko: string, en: string) => string) => z.object({
  primaryTitle: z.string().min(1, t('앨범 제목을 입력해주세요', 'Album title is required')),
  hasTranslation: z.boolean().default(false),
  translationLanguage: z.string().optional(),
  translatedTitle: z.string().optional(),
  type: z.enum(['single', 'ep', 'album'])
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
      hasTranslation: false
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
              <div className="relative">
                <div className="absolute left-0 top-8 bottom-0 w-px bg-gradient-to-b from-n3rve-200 to-transparent dark:from-n3rve-800" />
                
                <label htmlFor="hasTranslation" className="flex items-center justify-between p-4 -mx-6 -mb-6 border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors rounded-b-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-n3rve-100 dark:bg-n3rve-900/30 rounded-lg flex items-center justify-center">
                      <Languages className="w-4 h-4 text-n3rve-600 dark:text-n3rve-400" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {language === 'ko' ? '번역 추가' : 'Add Translation'}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-n3rve-300 dark:peer-focus:ring-n3rve-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-n3rve-600"></div>
                  </div>
                </label>
              </div>
            </div>

            {/* Translation Fields */}
            {hasTranslation && (
              <div id="translation-section" className="mt-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm animate-fadeIn">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-8 bg-n3rve-main rounded-full" />
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {language === 'ko' ? '번역 정보' : 'Translation Information'}
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'ko' ? '번역 언어' : 'Translation Language'} <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('translationLanguage')}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                    >
                      <option value="">{language === 'ko' ? '언어를 선택하세요' : 'Select a language'}</option>
                      {getLanguageOptions(t).map(lang => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                    {errors.translationLanguage && (
                      <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.translationLanguage.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'ko' ? '번역된 제목' : 'Translated Title'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('translatedTitle')}
                      type="text"
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                      placeholder={language === 'ko' ? '번역된 앨범 제목 입력' : 'Enter translated album title'}
                    />
                    {errors.translatedTitle && (
                      <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.translatedTitle.message}
                      </p>
                    )}
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('발매 형태', 'Release Format')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ko' ? '앨범 형식을 선택하세요' : 'Choose your release format'}</p>
              </div>
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