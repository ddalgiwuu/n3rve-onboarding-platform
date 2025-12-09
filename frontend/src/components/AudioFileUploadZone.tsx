import { useCallback, useRef, useState } from 'react';
import { Upload, Music, AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface AudioFileUploadZoneProps {
  onFilesSelected: (files: FileList) => void;
  isProcessing?: boolean;
  uploadedCount?: number;
  maxFiles?: number;
  disabled?: boolean;
}

export default function AudioFileUploadZone({
  onFilesSelected,
  isProcessing = false,
  uploadedCount = 0,
  maxFiles,
  disabled = false
}: AudioFileUploadZoneProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const { files } = e.dataTransfer;
    if (files && files.length > 0) {
      onFilesSelected(files);
    }
  }, [disabled, onFilesSelected]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      // Reset input so the same file can be selected again
      e.target.value = '';
    }
  }, [onFilesSelected]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  return (
    <div className="w-full">
      {/* Upload Zone */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 transition-all duration-200
          ${isDragging
      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg shadow-purple-500/20'
      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/20 hover:border-purple-400 dark:hover:border-purple-500'
    }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isProcessing ? 'pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/wav,audio/flac,audio/mpeg,audio/x-flac,audio/aiff,audio/x-aiff,audio/x-m4a"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all
            ${isDragging
      ? 'bg-purple-100 dark:bg-purple-900/30 scale-110'
      : 'bg-gray-200 dark:bg-gray-600'
    }
          `}>
            {isProcessing ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            ) : uploadedCount > 0 ? (
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            ) : (
              <Upload className={`w-8 h-8 transition-colors ${
                isDragging
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`} />
            )}
          </div>

          {/* Title */}
          <h3 className={`text-lg font-semibold mb-2 transition-colors ${
            isDragging
              ? 'text-purple-700 dark:text-purple-300'
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            {isProcessing
              ? t('파일 처리 중...', 'Processing files...', 'ファイル処理中...')
              : uploadedCount > 0
                ? t(`${uploadedCount}개 파일 업로드됨`, `${uploadedCount} files uploaded`, `${uploadedCount}個のファイルがアップロードされました`)
                : t('오디오 파일을 드래그하거나 클릭하여 업로드', 'Drag & drop audio files or click to browse', 'オーディオファイルをドラッグまたはクリックしてアップロード')
            }
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t(
              '지원 형식: WAV, FLAC, MP3, AIFF | 최대 500MB/파일',
              'Supported: WAV, FLAC, MP3, AIFF | Max 500MB/file',
              '対応形式：WAV, FLAC, MP3, AIFF | 最大500MB/ファイル'
            )}
          </p>

          {/* Additional Info */}
          {maxFiles && (
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {t(
                `최대 ${maxFiles}개 파일`,
                `Max ${maxFiles} files`,
                `最大${maxFiles}個のファイル`
              )}
            </p>
          )}

          {/* Help Text */}
          <div className="mt-4 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 max-w-md">
            <Music className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="text-left">
              {t(
                '권장: 96kHz/24bit WAV 또는 FLAC. 업로드 후 자동으로 메타데이터를 추출하고 품질을 분석합니다.',
                'Recommended: 96kHz/24bit WAV or FLAC. Metadata and quality will be auto-extracted.',
                '推奨：96kHz/24bit WAVまたはFLAC。メタデータと品質が自動抽出されます。'
              )}
            </p>
          </div>
        </div>

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('메타데이터 추출 중...', 'Extracting metadata...', 'メタデータ抽出中...')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info Boxes */}
      {uploadedCount === 0 && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Quality Info */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-blue-800 dark:text-blue-300">
                {t('품질 자동 분석', 'Auto Quality Check', '品質自動分析')}
              </p>
              <p className="text-blue-700 dark:text-blue-400 mt-0.5">
                {t(
                  '96kHz/24bit: 최고 품질, 44.1kHz/16bit: 표준 품질',
                  '96kHz/24bit: Excellent, 44.1kHz/16bit: Standard',
                  '96kHz/24bit：最高品質、44.1kHz/16bit：標準品質'
                )}
              </p>
            </div>
          </div>

          {/* Auto Metadata Info */}
          <div className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <AlertCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-purple-800 dark:text-purple-300">
                {t('자동 메타데이터 추출', 'Auto Metadata Extraction', '自動メタデータ抽出')}
              </p>
              <p className="text-purple-700 dark:text-purple-400 mt-0.5">
                {t(
                  'ID3 태그에서 제목, 아티스트, 앨범 정보 자동 추출',
                  'Auto-extracts title, artist, album from ID3 tags',
                  'ID3タグからタイトル、アーティスト、アルバム情報を自動抽出'
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
