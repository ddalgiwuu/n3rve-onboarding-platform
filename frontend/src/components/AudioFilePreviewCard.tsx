import { useState, useRef, useEffect } from 'react';
import { Trash2, Play, Pause, AlertCircle, CheckCircle, GripVertical } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import ModernWaveform from './ModernWaveform';

interface AudioFileMetadata {
  id: string;
  file: File;
  fileName: string;
  duration?: number;
  sampleRate?: number;
  bitDepth?: number;
  format?: string;
  extractedMetadata?: {
    title?: string;
    artist?: string;
    album?: string;
    genre?: string;
  };
  qualityScore?: number;
  waveformData?: number[];
  processingStatus?: 'pending' | 'processing' | 'complete' | 'error';
  errorMessage?: string;
}

interface AudioFilePreviewCardProps {
  metadata: AudioFileMetadata;
  trackNumber: number;
  onRemove: (fileId: string) => void;
  isDraggable?: boolean;
}

export default function AudioFilePreviewCard({
  metadata,
  trackNumber,
  onRemove,
  isDraggable = true
}: AudioFilePreviewCardProps) {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create audio element for playback
  useEffect(() => {
    if (metadata.file) {
      const url = URL.createObjectURL(metadata.file);
      // eslint-disable-next-line no-undef
      audioRef.current = new Audio(url);

      // Update current time during playback
      const handleTimeUpdate = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      };

      // Load metadata to get duration
      const handleLoadedMetadata = () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
        }
      };

      // Handle playback end
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('ended', handleEnded);

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
          audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audioRef.current.removeEventListener('ended', handleEnded);
          audioRef.current.pause();
          URL.revokeObjectURL(url);
        }
      };
    }
  }, [metadata.file]);

  // Handle play/pause toggle
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle waveform seek
  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  };

  const getQualityColor = (score?: number) => {
    if (!score) return 'gray';
    if (score >= 95) return 'green';
    if (score >= 85) return 'blue';
    if (score >= 70) return 'yellow';
    return 'red';
  };

  const getQualityLabel = (score?: number) => {
    if (!score) return t('알 수 없음', 'Unknown', '不明');
    if (score >= 95) return t('최고', 'Excellent', '最高');
    if (score >= 85) return t('우수', 'Good', '良好');
    if (score >= 70) return t('양호', 'Acceptable', '許容');
    return t('낮음', 'Poor', '低');
  };

  const color = getQualityColor(metadata.qualityScore);
  const qualityLabel = getQualityLabel(metadata.qualityScore);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-2">
        {/* Drag Handle */}
        {isDraggable && (
          <div className="flex-shrink-0 cursor-grab active:cursor-grabbing mt-1">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
        )}

        {/* Track Number Badge - Smaller */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
            {trackNumber}
          </span>
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          {/* Title - Compact */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {metadata.extractedMetadata?.title || metadata.fileName.replace(/\.(wav|flac|mp3|aiff)$/i, '')}
              </h4>
            </div>

            {/* Processing Status - Compact */}
            {metadata.processingStatus === 'processing' && (
              <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                <div className="animate-spin rounded-full h-2.5 w-2.5 border border-blue-600" />
              </div>
            )}
            {metadata.processingStatus === 'error' && (
              <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            )}
            {metadata.processingStatus === 'complete' && (
              <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            )}
          </div>

          {/* Modern Waveform Visualization - Always show */}
          <ModernWaveform
            waveformData={metadata.waveformData || []}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration || metadata.duration || 0}
            onSeek={handleSeek}
            className="mb-2"
          />

          {/* Technical Specs - Compact */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 mb-1.5">
            <span>⏱️ {formatDuration(metadata.duration)}</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span>{metadata.sampleRate ? `${(metadata.sampleRate / 1000).toFixed(1)}kHz` : 'N/A'}</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span>{metadata.bitDepth ? `${metadata.bitDepth}bit` : 'N/A'}</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span className="font-medium">{metadata.format || 'Unknown'}</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span>{formatFileSize(metadata.file.size)}</span>
          </div>

          {/* Quality Score - Compact */}
          {metadata.qualityScore !== undefined && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {t('품질:', 'Quality:', '品質：')}
              </span>
              <div className="flex-1 max-w-[200px]">
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      color === 'green' ? 'bg-green-500' :
                        color === 'blue' ? 'bg-blue-500' :
                          color === 'yellow' ? 'bg-yellow-500' :
                            'bg-red-500'
                    }`}
                    style={{ width: `${metadata.qualityScore}%` }}
                  />
                </div>
              </div>
              <span className={`text-[10px] font-semibold ${
                color === 'green' ? 'text-green-600 dark:text-green-400' :
                  color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                    color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
              }`}>
                {metadata.qualityScore} ({qualityLabel})
              </span>
            </div>
          )}

          {/* Error Message */}
          {metadata.errorMessage && (
            <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-300">
                {metadata.errorMessage}
              </p>
            </div>
          )}

          {/* Actions - Compact */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePlayPause}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 rounded-md hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={metadata.processingStatus !== 'complete'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3 h-3" />
                  {t('일시정지', 'Pause', '一時停止')}
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  {t('미리듣기', 'Preview', 'プレビュー')}
                </>
              )}
            </button>

            <button
              onClick={() => onRemove(metadata.id)}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              {t('삭제', 'Remove', '削除')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
