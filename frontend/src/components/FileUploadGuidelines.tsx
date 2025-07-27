import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileAudio,
  Image,
  FileText,
  FolderOpen,
  Info,
  CheckCircle,
  XCircle,
  ChevronDown,
  Cloud
} from 'lucide-react';
import { getFileUploadGuidelines } from '@/utils/inputValidation';
import { useLanguageStore } from '@/store/language.store';

interface FileUploadGuidelinesProps {
  fileType: 'audio' | 'albumArt' | 'lyrics' | 'additional'
  showCompact?: boolean
  className?: string
}

export default function FileUploadGuidelines({
  fileType,
  showCompact = false,
  className = ''
}: FileUploadGuidelinesProps) {
  const [isExpanded, setIsExpanded] = useState(!showCompact);
  const { language } = useLanguageStore();
  const guidelines = getFileUploadGuidelines(language);
  const guideline = guidelines[fileType];

  const getIcon = () => {
    switch (fileType) {
      case 'audio':
        return <FileAudio className="w-5 h-5" />;
      case 'albumArt':
        return <Image className="w-5 h-5" />;
      case 'lyrics':
        return <FileText className="w-5 h-5" />;
      case 'additional':
        return <FolderOpen className="w-5 h-5" />;
    }
  };

  const getTitle = () => {
    switch (fileType) {
      case 'audio':
        return language === 'ko' ? '오디오 파일 가이드라인' : language === 'ja' ? 'オーディオファイルガイドライン' : 'Audio File Guidelines';
      case 'albumArt':
        return language === 'ko' ? '앨범 아트 가이드라인' : language === 'ja' ? 'アルバムアートガイドライン' : 'Album Art Guidelines';
      case 'lyrics':
        return language === 'ko' ? '가사 파일 가이드라인' : language === 'ja' ? '歌詞ファイルガイドライン' : 'Lyrics File Guidelines';
      case 'additional':
        return language === 'ko' ? '추가 파일 가이드라인' : language === 'ja' ? '追加ファイルガイドライン' : 'Additional File Guidelines';
    }
  };

  return (
    <div className={`bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      <div
        className="p-4 cursor-pointer"
        onClick={() => showCompact && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg text-purple-600 dark:text-purple-400">
              {getIcon()}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {getTitle()}
            </h3>
          </div>
          {showCompact && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-gray-500" />
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Formats and Size */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'ko' ? '지원 형식' : language === 'ja' ? 'サポート形式' : 'Supported Formats'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {guideline.formats.map(format => (
                      <span key={format} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                        {format}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'ko' ? '최대 크기' : language === 'ja' ? '最大サイズ' : 'Maximum Size'}
                  </h4>
                  <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                    {guideline.maxSize}
                  </p>
                </div>
              </div>

              {/* Requirements */}
              {(guideline.minRequirements || guideline.maxRequirements) && (
                <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'ko' ? '기술 요구사항' : language === 'ja' ? '技術要件' : 'Technical Requirements'}
                  </h4>
                  <div className="space-y-2">
                    {guideline.minRequirements && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {language === 'ko' ? '최소' : language === 'ja' ? '最小' : 'Minimum'}:
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                          {Object.entries(guideline.minRequirements).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="text-gray-500 dark:text-gray-400 capitalize">{key}: </span>
                              <span className="font-medium text-gray-900 dark:text-white">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {guideline.maxRequirements && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {language === 'ko' ? '최대' : language === 'ja' ? '最大' : 'Maximum'}:
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                          {Object.entries(guideline.maxRequirements).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="text-gray-500 dark:text-gray-400 capitalize">{key}: </span>
                              <span className="font-medium text-gray-900 dark:text-white">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                <h4 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {language === 'ko' ? '권장사항' : language === 'ja' ? '推奨事項' : 'Recommendations'}
                </h4>
                <ul className="space-y-1">
                  {guideline.recommendations.map((rec, index) => (
                    <li key={index} className="text-xs text-green-700 dark:text-green-300 flex items-start gap-1">
                      <span className="mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Restrictions */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  {language === 'ko' ? '제한사항' : language === 'ja' ? '制限事項' : 'Restrictions'}
                </h4>
                <ul className="space-y-1">
                  {guideline.restrictions.map((restriction, index) => (
                    <li key={index} className="text-xs text-red-700 dark:text-red-300 flex items-start gap-1">
                      <span className="mt-0.5">•</span>
                      <span>{restriction}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Naming Convention */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  {language === 'ko' ? '파일명 규칙' : language === 'ja' ? 'ファイル名規則' : 'Naming Convention'}
                </h4>
                <code className="text-xs bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-blue-800 dark:text-blue-200 block">
                  {guideline.namingConvention}
                </code>
              </div>

              {/* Google Drive Support */}
              {guideline.googleDriveSupported && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      {language === 'ko' ? 'Google Drive 링크 지원' : language === 'ja' ? 'Google Driveリンクサポート' : 'Google Drive links supported'}
                    </p>
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    {language === 'ko'
                      ? '파일 업로드 대신 Google Drive 공유 링크를 사용할 수 있습니다.'
                      : language === 'ja'
                        ? 'ファイルアップロードの代わりにGoogle Drive共有リンクを使用できます。'
                        : 'You can use Google Drive share links instead of uploading files.'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
