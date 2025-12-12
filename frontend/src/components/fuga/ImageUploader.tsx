import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { validateImageFile } from '@/utils/fugaArtistValidation';
import { FugaArtistImage } from '@/types/fugaArtist';

interface ImageUploaderProps {
  type: 'avatar' | 'banner' | 'logo' | 'pressShot';
  label: string;
  value?: FugaArtistImage;
  onChange: (image: FugaArtistImage | undefined) => void;
  error?: string;
  required?: boolean;
  helpText?: string;
  maxSize?: number;
  dimensions?: string;
}

export default function ImageUploader({
  type,
  label,
  value,
  onChange,
  error,
  required = false,
  helpText,
  maxSize = 3,
  dimensions,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(value?.url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Validate file
    const validation = validateImageFile(file, type);
    if (!validation.valid) {
      onChange(undefined);
      setPreview(null);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string;
      setPreview(previewUrl);
      onChange({
        type,
        file,
        url: previewUrl,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {preview ? (
        // Preview mode
        <div className="relative group">
          <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <img
              src={preview}
              alt={`${label} preview`}
              className={`w-full ${
                type === 'avatar' ? 'aspect-square' : type === 'banner' ? 'aspect-[3/2]' : 'h-32'
              } object-cover`}
            />
          </div>
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-2 px-3 py-1 bg-green-500 text-white text-xs rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Uploaded
          </div>
        </div>
      ) : (
        // Upload mode
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
            ${isDragging
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
            }
            ${error ? 'border-red-500' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
          />
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium mb-1">Drag & drop a file or browse</p>
            <p className="text-xs">Max file size is {maxSize} MB</p>
            {dimensions && <p className="text-xs text-gray-500">{dimensions}</p>}
          </div>
        </div>
      )}

      {helpText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helpText}</p>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
