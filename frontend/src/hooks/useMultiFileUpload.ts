import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { processAudioFile } from '@/utils/audioFileProcessor';

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

interface UseMultiFileUploadOptions {
  onFilesAdded?: (files: Map<string, AudioFileMetadata>) => void;
  onFileProcessed?: (fileId: string, metadata: AudioFileMetadata) => void;
  onError?: (fileId: string, error: Error) => void;
  maxFileSize?: number;  // bytes
  allowedFormats?: string[];
}

export function useMultiFileUpload(options: UseMultiFileUploadOptions = {}) {
  const {
    onFilesAdded,
    onFileProcessed,
    onError,
    maxFileSize = 500 * 1024 * 1024,  // 500MB default
    allowedFormats = ['wav', 'flac', 'mp3', 'aiff', 'm4a']
  } = options;

  const [uploadingFiles, setUploadingFiles] = useState<Map<string, AudioFileMetadata>>(new Map());
  const [processingCount, setProcessingCount] = useState(0);

  /**
   * Validate file before processing
   */
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > maxFileSize) {
      return {
        valid: false,
        error: `파일 크기가 너무 큽니다 (최대 ${Math.round(maxFileSize / 1024 / 1024)}MB)`
      };
    }

    // Check format
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedFormats.includes(extension)) {
      return {
        valid: false,
        error: `지원하지 않는 파일 형식입니다 (${allowedFormats.join(', ')} 만 가능)`
      };
    }

    return { valid: true };
  }, [maxFileSize, allowedFormats]);

  /**
   * Process a single audio file
   */
  const processFile = useCallback(async (fileId: string, file: File) => {
    setProcessingCount(prev => prev + 1);

    // Update status to processing
    setUploadingFiles(prev => {
      const updated = new Map(prev);
      const existing = updated.get(fileId);
      if (existing) {
        updated.set(fileId, { ...existing, processingStatus: 'processing' });
      }
      return updated;
    });

    try {
      // Process the audio file (extract metadata, technical info, waveform)
      const result = await processAudioFile(file);

      const processedMetadata: AudioFileMetadata = {
        id: fileId,
        file,
        fileName: file.name,
        duration: result.technicalInfo.duration,
        sampleRate: result.technicalInfo.sampleRate,
        bitDepth: result.technicalInfo.bitDepth,
        format: result.technicalInfo.format,
        extractedMetadata: result.metadata,
        qualityScore: result.qualityScore,
        waveformData: result.waveformData,
        processingStatus: 'complete'
      };

      // Update with processed data
      setUploadingFiles(prev => {
        const updated = new Map(prev);
        updated.set(fileId, processedMetadata);
        return updated;
      });

      onFileProcessed?.(fileId, processedMetadata);
    } catch (error) {
      console.error(`Failed to process file ${file.name}:`, error);

      // Update status to error
      setUploadingFiles(prev => {
        const updated = new Map(prev);
        const existing = updated.get(fileId);
        if (existing) {
          updated.set(fileId, {
            ...existing,
            processingStatus: 'error',
            errorMessage: error instanceof Error ? error.message : 'Processing failed'
          });
        }
        return updated;
      });

      onError?.(fileId, error instanceof Error ? error : new Error('Processing failed'));
    } finally {
      setProcessingCount(prev => prev - 1);
    }
  }, [onFileProcessed, onError]);

  /**
   * Handle multiple files being added
   */
  const handleFilesAdded = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newFilesMap = new Map<string, AudioFileMetadata>();

    // Validate and create initial metadata for all files
    for (const file of fileArray) {
      const validation = validateFile(file);

      if (!validation.valid) {
        onError?.(uuidv4(), new Error(validation.error));
        continue;
      }

      const fileId = uuidv4();
      const initialMetadata: AudioFileMetadata = {
        id: fileId,
        file,
        fileName: file.name,
        processingStatus: 'pending'
      };

      newFilesMap.set(fileId, initialMetadata);
    }

    // Add to state
    setUploadingFiles(prev => {
      const updated = new Map(prev);
      newFilesMap.forEach((value, key) => updated.set(key, value));
      return updated;
    });

    onFilesAdded?.(newFilesMap);

    // Process each file asynchronously
    for (const [fileId, metadata] of newFilesMap) {
      processFile(fileId, metadata.file);
    }
  }, [validateFile, processFile, onFilesAdded, onError]);

  /**
   * Remove a file from the upload list
   */
  const handleFileRemoved = useCallback((fileId: string) => {
    setUploadingFiles(prev => {
      const updated = new Map(prev);
      updated.delete(fileId);
      return updated;
    });
  }, []);

  /**
   * Reorder files
   */
  const handleFilesReordered = useCallback((reorderedIds: string[]) => {
    setUploadingFiles(prev => {
      const updated = new Map<string, AudioFileMetadata>();
      reorderedIds.forEach(id => {
        const file = prev.get(id);
        if (file) {
          updated.set(id, file);
        }
      });
      return updated;
    });
  }, []);

  return {
    uploadingFiles,
    processingCount,
    isProcessing: processingCount > 0,
    handleFilesAdded,
    handleFileRemoved,
    handleFilesReordered
  };
}
