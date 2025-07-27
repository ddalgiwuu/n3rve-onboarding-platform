import { useState } from 'react';
import { Upload, X, File, Image, Music } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  onFileSelect: (file: File | File[] | null) => void
  currentFile?: File | File[] | null
  maxSize?: number // in MB
  label?: string
  required?: boolean
  className?: string
}

export default function FileUpload({
  accept = '*/*',
  multiple = false,
  onFileSelect,
  currentFile,
  maxSize = 100,
  label,
  required = false,
  className
}: FileUploadProps) {
  const language = useSafeStore(useLanguageStore, (state) => state.language);
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image;
    if (file.type.startsWith('audio/')) return Music;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const validateFile = (file: File): boolean => {
    setError('');

    // Check file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(t(`파일 크기는 ${maxSize}MB를 초과할 수 없습니다`, `File size cannot exceed ${maxSize}MB`));
      return false;
    }

    // Check file type if accept is specified
    if (accept !== '*/*') {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type.toLowerCase();
        }
        if (type.endsWith('/*')) {
          const category = type.replace('/*', '/');
          return file.type.startsWith(category);
        }
        return file.type === type;
      });

      if (!isAccepted) {
        setError(t('지원하지 않는 파일 형식입니다', 'Unsupported file format'));
        return false;
      }
    }

    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    if (multiple) {
      const validFiles = files.filter(validateFile);
      if (validFiles.length > 0) {
        onFileSelect(validFiles);
      }
    } else {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (multiple) {
      const validFiles = Array.from(files).filter(validateFile);
      if (validFiles.length > 0) {
        onFileSelect(validFiles);
      }
    } else {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    setError('');
  };

  const renderFilePreview = () => {
    if (!currentFile) return null;

    if (Array.isArray(currentFile)) {
      return (
        <div className="space-y-2">
          {currentFile.map((file, index) => {
            const Icon = getFileIcon(file);
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={handleRemove}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            );
          })}
        </div>
      );
    }

    const file = currentFile as File;
    const Icon = getFileIcon(file);

    return (
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 text-gray-500" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
          </div>
        </div>
        <button
          onClick={handleRemove}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    );
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-all',
          dragActive
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-300 dark:border-gray-600',
          currentFile && 'bg-gray-50 dark:bg-gray-800',
          error && 'border-red-500'
        )}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          required={required && !currentFile}
        />

        {currentFile ? (
          renderFilePreview()
        ) : (
          <div className="p-8 text-center">
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t('클릭하거나 파일을 드래그하여 업로드', 'Click or drag files to upload')}
            </p>
            <p className="text-xs text-gray-500">
              {accept === '*/*'
                ? t('모든 파일 형식 지원', 'All file formats supported')
                : accept.replace(/\*/g, '').toUpperCase()
              } • {t(`최대 ${maxSize}MB`, `Max ${maxSize}MB`)}
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
