import { useState, useRef } from 'react';
import { Upload, CheckCircle, Music, AlertCircle, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { TrackFileVersion } from '@/types/trackFileVersion';

interface TrackWithStereo {
  id: string;
  trackNumber: number;
  title: string;
  stereoFile: TrackFileVersion;
  dolbyFile?: TrackFileVersion;
}

interface DolbyAtmosUploadWizardProps {
  tracks: TrackWithStereo[];
  onDolbyFilesAdded: (trackId: string, file: File) => void;
  onDolbyFileRemoved: (trackId: string) => void;
  onComplete: () => void;
  onSkip: () => void;
}

export default function DolbyAtmosUploadWizard({
  tracks,
  onDolbyFilesAdded,
  onDolbyFileRemoved,
  onComplete,
  onSkip
}: DolbyAtmosUploadWizardProps) {
  const { t } = useTranslation();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadingTrackIds, setUploadingTrackIds] = useState<Set<string>>(new Set());

  const handleFileSelect = (trackId: string, file: File | null) => {
    if (file) {
      // Validate file format
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!['wav', 'flac', 'm4a'].includes(extension || '')) {
        alert(t(
          '지원하지 않는 파일 형식입니다. WAV, FLAC, M4A만 가능합니다.',
          'Unsupported file format. Only WAV, FLAC, M4A are allowed.',
          'サポートされていないファイル形式です。WAV、FLAC、M4Aのみ可能です。'
        ));
        return;
      }

      setUploadingTrackIds(prev => new Set([...prev, trackId]));
      onDolbyFilesAdded(trackId, file);

      // Simulate processing delay
      setTimeout(() => {
        setUploadingTrackIds(prev => {
          const updated = new Set(prev);
          updated.delete(trackId);
          return updated;
        });
      }, 1000);
    }
  };

  const handleRemove = (trackId: string) => {
    onDolbyFileRemoved(trackId);
  };

  const dolbyUploadedCount = tracks.filter(t => t.dolbyFile).length;
  const canContinue = true;  // Dolby is optional, so can always continue

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {t('Dolby Atmos 파일 업로드', 'Upload Dolby Atmos Files', 'Dolby Atmosファイルをアップロード')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t(
            '각 트랙의 Dolby Atmos 버전을 업로드하세요. 일부 트랙만 업로드해도 됩니다.',
            'Upload Dolby Atmos versions for each track. You can upload for only some tracks.',
            '各トラックのDolby Atmosバージョンをアップロードしてください。一部のトラックのみでも構いません。'
          )}
        </p>

        {/* Progress */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-purple-600 h-full transition-all duration-300"
              style={{ width: `${(dolbyUploadedCount / tracks.length) * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {dolbyUploadedCount}/{tracks.length} {t('완료', 'uploaded', 'アップロード済み')}
          </span>
        </div>
      </div>

      {/* Track Upload Cards */}
      <div className="space-y-4 mb-8">
        {tracks.map((track) => {
          const isUploading = uploadingTrackIds.has(track.id);
          const hasDolby = !!track.dolbyFile;

          return (
            <div
              key={track.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-start gap-4">
                {/* Track Number */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                    {track.trackNumber}
                  </span>
                </div>

                <div className="flex-1">
                  {/* Track Info */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {track.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span>
                        {t('Stereo:', 'Stereo:', 'ステレオ：')} {track.stereoFile.fileName}
                      </span>
                    </div>
                  </div>

                  {/* Dolby Upload Area */}
                  {hasDolby ? (
                    /* Uploaded State */
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-300">
                              {t('Dolby Atmos 업로드 완료', 'Dolby Atmos uploaded', 'Dolby Atmosアップロード完了')}
                            </p>
                            <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                              {track.dolbyFile?.fileName}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemove(track.id)}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title={t('삭제', 'Remove', '削除')}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Upload Zone */
                    <div
                      onClick={() => fileInputRefs.current[track.id]?.click()}
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all cursor-pointer"
                    >
                      <input
                        ref={el => { fileInputRefs.current[track.id] = el; }}
                        type="file"
                        accept="audio/wav,audio/flac,audio/x-flac,audio/x-m4a"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileSelect(track.id, file);
                          }
                          e.target.value = '';  // Reset for re-upload
                        }}
                        className="hidden"
                      />

                      {isUploading ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
                          <span className="text-sm text-purple-700 dark:text-purple-300">
                            {t('처리 중...', 'Processing...', '処理中...')}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center">
                          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                            <Upload className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('Dolby Atmos 파일 업로드', 'Upload Dolby Atmos file', 'Dolby Atmosファイルをアップロード')}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('클릭하거나 드래그', 'Click or drag', 'クリックまたはドラッグ')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-1">
              {t('💡 팁', '💡 Tip', '💡 ヒント')}
            </p>
            <ul className="space-y-1 text-blue-700 dark:text-blue-400 text-xs">
              <li>• {t('Dolby Atmos는 선택사항입니다', 'Dolby Atmos is optional', 'Dolby Atmosはオプションです')}</li>
              <li>• {t('일부 트랙만 업로드해도 됩니다', 'You can upload for only some tracks', '一部のトラックのみアップロード可能')}</li>
              <li>• {t('Dolby 파일은 일반적으로 48kHz/24bit ADM BWF 형식입니다', 'Dolby files are typically 48kHz/24bit ADM BWF format', 'Dolbyファイルは通常48kHz/24bit ADM BWF形式です')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={onSkip}
          className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {t('건너뛰기 (Dolby 없이 진행)', 'Skip (Continue without Dolby)', 'スキップ（Dolbyなしで続行）')}
        </button>

        <button
          onClick={onComplete}
          disabled={!canContinue}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {dolbyUploadedCount > 0
            ? t(`${dolbyUploadedCount}개 Dolby Atmos와 함께 계속`, `Continue with ${dolbyUploadedCount} Dolby Atmos`, `${dolbyUploadedCount}個のDolby Atmosと続ける`)
            : t('계속', 'Continue', '続ける')
          }
        </button>
      </div>
    </div>
  );
}
