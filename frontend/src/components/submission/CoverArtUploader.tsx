import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, X, Check, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface CoverArtUploaderProps {
  value: File | string | null;
  onChange: (file: File | null) => void;
  required?: boolean;
  className?: string;
}

export function CoverArtUploader({
  value,
  onChange,
  required = false,
  className
}: CoverArtUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp']
    },
    multiple: false,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        // Create preview
        const reader = new FileReader();
        reader.onload = () => {
          setPreview(reader.result as string);

          // Validate image dimensions
          const img = new Image();
          img.onload = () => {
            setDimensions({ width: img.width, height: img.height });

            // Check minimum size (3000x3000)
            if (img.width < 3000 || img.height < 3000) {
              setValidationError('Minimum 3000x3000px required');
            } else if (img.width !== img.height) {
              setValidationError('Image must be square (1:1 ratio)');
            } else {
              setValidationError(null);
              onChange(file);
            }
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
      }
    }
  });

  const handleRemove = () => {
    setPreview(null);
    setDimensions(null);
    setValidationError(null);
    onChange(null);
  };

  const file = value instanceof File ? value : null;
  const fileName = file?.name;
  const fileSize = file ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : null;

  return (
    <div className={clsx('space-y-3', className)}>
      <label className="block text-sm font-medium text-white">
        Cover Art
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            {...getRootProps()}
            className={clsx(
              'relative aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer',
              isDragActive
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-white/20 bg-white/5 hover:border-purple-500/50 hover:bg-white/10'
            )}
          >
            <input {...getInputProps()} />

            <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
              <Upload size={64} className={clsx(
                'mb-4',
                isDragActive ? 'text-purple-400' : 'text-gray-500'
              )} />

              <p className="text-white font-medium mb-2 text-center">
                {isDragActive ? 'Drop cover art here' : 'Drag & drop cover art'}
              </p>

              <p className="text-sm text-gray-400 text-center">
                or click to browse
              </p>

              <div className="mt-4 px-4 py-2 bg-white/5 rounded-lg">
                <p className="text-xs text-gray-400 text-center">
                  Minimum 3000x3000px • 1:1 ratio • JPG or PNG
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-3"
          >
            {/* Preview Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-white/10 group">
              <img
                src={preview}
                alt="Cover art preview"
                className="w-full h-full object-cover"
              />

              {/* Remove overlay */}
              <div className="
                absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100
                flex items-center justify-center transition-opacity
              ">
                <button
                  onClick={handleRemove}
                  className="
                    p-3 rounded-full
                    bg-red-500 hover:bg-red-600
                    text-white
                    transition-all
                  "
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* File Info */}
            <div className="p-4 bg-white/5 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">File:</span>
                <span className="text-white font-mono truncate ml-2">{fileName}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Size:</span>
                <span className="text-white">{fileSize}</span>
              </div>

              {dimensions && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Dimensions:</span>
                  <span className="text-white">{dimensions.width} x {dimensions.height}px</span>
                </div>
              )}

              {/* Validation */}
              {validationError ? (
                <div className="flex items-center gap-2 text-xs text-red-400 pt-2">
                  <AlertCircle size={14} />
                  {validationError}
                </div>
              ) : dimensions && (
                <div className="flex items-center gap-2 text-xs text-green-400 pt-2">
                  <Check size={14} />
                  Valid cover art
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
