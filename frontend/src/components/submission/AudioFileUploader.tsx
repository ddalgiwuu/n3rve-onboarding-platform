import { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Music,
  Play,
  Pause,
  X,
  Check,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { clsx } from 'clsx';

interface AudioMetadata {
  duration: number;
  format: string;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
}

interface AudioFileUploaderProps {
  value: File | string | null;
  onChange: (file: File | null) => void;
  onMetadataExtracted?: (metadata: AudioMetadata) => void;
  trackTitle?: string;
  required?: boolean;
  className?: string;
}

export function AudioFileUploader({
  value,
  onChange,
  onMetadataExtracted,
  trackTitle,
  required = false,
  className
}: AudioFileUploaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get file info
  const file = value instanceof File ? value : null;
  const fileName = file?.name || (typeof value === 'string' ? value.split('/').pop() : null);
  const fileSize = file ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : null;

  // Dropzone config
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'audio/*': ['.wav', '.mp3', '.flac', '.aiff', '.m4a']
    },
    multiple: false,
    onDrop: async (acceptedFiles) => {
      const audioFile = acceptedFiles[0];
      if (audioFile) {
        onChange(audioFile);
        extractMetadata(audioFile);
      }
    }
  });

  // Extract audio metadata
  const extractMetadata = async (file: File) => {
    setIsExtracting(true);

    try {
      const audioUrl = URL.createObjectURL(file);
      const audio = new Audio(audioUrl);

      await new Promise((resolve, reject) => {
        audio.onloadedmetadata = () => {
          const metadata: AudioMetadata = {
            duration: audio.duration,
            format: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN'
            // Note: bitrate, sampleRate, channels require Web Audio API for accurate extraction
          };

          setDuration(audio.duration);
          onMetadataExtracted?.(metadata);
          resolve(metadata);
        };

        audio.onerror = reject;
      });

      URL.revokeObjectURL(audioUrl);
    } catch (error) {
      console.error('Failed to extract audio metadata:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  // Create audio element for playback
  useEffect(() => {
    if (file && !audioRef.current) {
      const audio = new Audio(URL.createObjectURL(file));
      audioRef.current = audio;

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });

      return () => {
        audio.pause();
        URL.revokeObjectURL(audio.src);
      };
    }
  }, [file]);

  // Play/Pause control
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }

    setIsPlaying(!isPlaying);
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Remove file
  const handleRemove = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    onChange(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(null);
  };

  return (
    <div className={clsx('space-y-2', className)}>
      <label className="block text-sm font-medium text-white">
        Audio File
        {required && <span className="text-red-400 ml-1">*</span>}
        {trackTitle && <span className="text-gray-400 ml-2">for "{trackTitle}"</span>}
      </label>

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            {...getRootProps()}
            className={clsx(
              'relative p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer',
              isDragActive
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-white/20 bg-white/5 hover:border-purple-500/50 hover:bg-white/10'
            )}
          >
            <input {...getInputProps()} />

            <div className="text-center">
              <Upload size={48} className={clsx(
                'mx-auto mb-3',
                isDragActive ? 'text-purple-400' : 'text-gray-500'
              )} />

              <p className="text-white font-medium mb-1">
                {isDragActive ? 'Drop audio file here' : 'Drag & drop audio file'}
              </p>

              <p className="text-sm text-gray-400">
                or click to browse • WAV, MP3, FLAC, AIFF
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl"
          >
            {/* File info */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-purple-500/20 rounded-lg flex-shrink-0">
                  <Music size={20} className="text-purple-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{fileName}</p>
                  <p className="text-xs text-gray-400">
                    {fileSize}
                    {duration && ` • ${formatTime(duration)}`}
                  </p>
                </div>
              </div>

              <button
                onClick={handleRemove}
                className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
                aria-label="Remove file"
              >
                <X size={18} />
              </button>
            </div>

            {/* Metadata extraction status */}
            {isExtracting && (
              <div className="flex items-center gap-2 text-xs text-blue-400 mb-3">
                <RefreshCw size={12} className="animate-spin" />
                Extracting metadata...
              </div>
            )}

            {/* Progress bar */}
            {duration && duration > 0 && (
              <div className="space-y-2">
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-purple-500"
                    initial={{ width: '0%' }}
                    animate={{ width: `${(currentTime / duration) * 100}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            )}

            {/* Play/Pause button */}
            {duration && (
              <button
                onClick={togglePlay}
                className="
                  w-full mt-3 flex items-center justify-center gap-2
                  px-4 py-2 rounded-lg
                  bg-purple-500/20 hover:bg-purple-500/30
                  border border-purple-500/30
                  text-purple-300 font-medium text-sm
                  transition-all
                "
              >
                {isPlaying ? (
                  <>
                    <Pause size={16} />
                    Pause
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Play Preview
                  </>
                )}
              </button>
            )}

            {/* Validation status */}
            {file && (
              <div className="mt-3 flex items-center gap-2 text-xs">
                <Check size={14} className="text-green-400" />
                <span className="text-green-400">Valid audio file</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
