import { useState } from 'react'
import { useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'
import { ValidationProvider } from '@/contexts/ValidationContext'
import ValidatedInput from '@/components/ValidatedInput'
import { CheckCircle, AlertCircle } from 'lucide-react'

function RealtimeQCTestContent() {
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  const [albumTitle, setAlbumTitle] = useState('')
  const [trackTitle, setTrackTitle] = useState('')
  const [artistName, setArtistName] = useState('')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {language === 'ko' ? '실시간 QC 검증 테스트' : 'Real-time QC Validation Test'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {language === 'ko' 
              ? '입력하면서 실시간으로 QC 검증이 작동하는지 확인하세요' 
              : 'Check if QC validation works in real-time as you type'
            }
          </p>

          <div className="space-y-8">
            {/* Album Title Test */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                {language === 'ko' ? '앨범 제목 검증' : 'Album Title Validation'}
              </h2>
              <ValidatedInput
                fieldId="test-album-title"
                validationType="album"
                value={albumTitle}
                onValueChange={setAlbumTitle}
                showInlineWarnings={true}
                language={language}
                label={language === 'ko' ? '앨범 제목' : 'Album Title'}
                placeholder={language === 'ko' ? '앨범 제목을 입력하세요' : 'Enter album title'}
                helpText={language === 'ko' 
                  ? '특수문자 (!@#등), 모두 대문자, 중복 공백 등을 입력해보세요' 
                  : 'Try special characters (!@#), ALL CAPS, double spaces, etc.'
                }
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
              />
              <div className="mt-2 text-sm text-gray-500">
                Current value: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{albumTitle || '(empty)'}</code>
              </div>
            </div>

            {/* Track Title Test */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                {language === 'ko' ? '트랙 제목 검증' : 'Track Title Validation'}
              </h2>
              <ValidatedInput
                fieldId="test-track-title"
                validationType="track"
                validationOptions={{ trackNumber: 1 }}
                value={trackTitle}
                onValueChange={setTrackTitle}
                showInlineWarnings={true}
                language={language}
                label={language === 'ko' ? '트랙 제목' : 'Track Title'}
                placeholder={language === 'ko' ? '트랙 제목을 입력하세요' : 'Enter track title'}
                helpText={language === 'ko' 
                  ? 'Remix, Edit, Version 등의 키워드를 입력해보세요' 
                  : 'Try keywords like Remix, Edit, Version, etc.'
                }
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
              />
              <div className="mt-2 text-sm text-gray-500">
                Current value: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{trackTitle || '(empty)'}</code>
              </div>
            </div>

            {/* Artist Name Test */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-purple-500" />
                {language === 'ko' ? '아티스트 이름 검증' : 'Artist Name Validation'}
              </h2>
              <ValidatedInput
                fieldId="test-artist-name"
                validationType="artist"
                value={artistName}
                onValueChange={setArtistName}
                showInlineWarnings={true}
                language={language}
                label={language === 'ko' ? '아티스트 이름' : 'Artist Name'}
                placeholder={language === 'ko' ? '아티스트 이름을 입력하세요' : 'Enter artist name'}
                helpText={language === 'ko' 
                  ? 'Unknown, TBD, 숫자만 등을 입력해보세요' 
                  : 'Try Unknown, TBD, numbers only, etc.'
                }
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
              />
              <div className="mt-2 text-sm text-gray-500">
                Current value: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{artistName || '(empty)'}</code>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">
                  {language === 'ko' ? '테스트 가이드' : 'Test Guide'}
                </p>
                <ul className="space-y-1 text-xs text-blue-600 dark:text-blue-400">
                  <li>• {language === 'ko' ? '입력하면서 실시간으로 경고가 나타나는지 확인' : 'Check if warnings appear in real-time as you type'}</li>
                  <li>• {language === 'ko' ? '300ms 디바운스가 적용되어 있음' : '300ms debounce is applied'}</li>
                  <li>• {language === 'ko' ? '경고 해제(X) 또는 제안 수락 기능 확인' : 'Test dismiss (X) or accept suggestion features'}</li>
                  <li>• {language === 'ko' ? '다양한 FUGA QC 규칙이 적용됨' : 'Various FUGA QC rules are applied'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RealtimeQCTest() {
  return (
    <ValidationProvider>
      <RealtimeQCTestContent />
    </ValidationProvider>
  )
}