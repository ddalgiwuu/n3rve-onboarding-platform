import { useState, useRef } from 'react';
import { Upload, Image, Music, FileText, X, CheckCircle, AlertCircle, Info, Film, Video, ExternalLink, HelpCircle } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';
import {
  AUDIO_SPECIFICATIONS,
  ARTWORK_SPECIFICATIONS,
  MOTION_ART_SPECIFICATIONS,
  VIDEO_SPECIFICATIONS,
  validateAudioFile,
  validateArtworkFile,
  validateMotionArtFile,
  validateVideoFile,
  formatFileSize
} from '@/utils/technicalSpecs';
import { Link } from 'react-router-dom';
import FileUploadGuidelines from '@/components/FileUploadGuidelines';

interface Props {
  data: any
  onNext: (data: any) => void
  onPrevious: () => void
}

export default function Step4FileUpload({ data, onNext, onPrevious }: Props) {
  const language = useSafeStore(useLanguageStore, (state) => state.language);
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;
  const [files, setFiles] = useState(data?.files || {
    coverImage: null,
    artistPhoto: null,
    audioFiles: [],
    additionalFiles: [],
    motionArt: null,
    musicVideo: null
  });
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string[]}>({});
  const [showGuidelines, setShowGuidelines] = useState<{[key: string]: boolean}>({
    albumArt: false,
    audio: false,
    additional: false
  });

  const coverImageRef = useRef<HTMLInputElement>(null);
  const artistPhotoRef = useRef<HTMLInputElement>(null);
  const audioFilesRef = useRef<HTMLInputElement>(null);
  const additionalFilesRef = useRef<HTMLInputElement>(null);
  const motionArtRef = useRef<HTMLInputElement>(null);
  const musicVideoRef = useRef<HTMLInputElement>(null);

  const toggleGuidelines = (type: string) => {
    setShowGuidelines(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleFileUpload = (type: string, file: File | FileList) => {
    if (type === 'coverImage' || type === 'artistPhoto') {
      const validation = validateArtworkFile(file as File);
      if (!validation.valid) {
        setValidationErrors({ ...validationErrors, [type]: validation.errors });
        return;
      }
      setValidationErrors({ ...validationErrors, [type]: [] });
      setFiles({ ...files, [type]: file });
    } else if (type === 'audioFiles') {
      const fileList = Array.from(file as FileList);
      const errors: string[] = [];

      fileList.forEach(f => {
        const validation = validateAudioFile(f);
        if (!validation.valid) {
          errors.push(`${f.name}: ${validation.errors.join(', ')}`);
        }
      });

      if (errors.length > 0) {
        setValidationErrors({ ...validationErrors, audioFiles: errors });
        return;
      }

      setValidationErrors({ ...validationErrors, audioFiles: [] });
      const audioFiles = fileList.map((f, index) => ({
        trackId: data?.tracks?.[index]?.id || `track-${index}`,
        file: f
      }));
      setFiles({ ...files, audioFiles });
    } else if (type === 'motionArt') {
      const validation = validateMotionArtFile(file as File);
      if (!validation.valid) {
        setValidationErrors({ ...validationErrors, motionArt: validation.errors });
        return;
      }
      setValidationErrors({ ...validationErrors, motionArt: [] });
      setFiles({ ...files, motionArt: file });
    } else if (type === 'musicVideo') {
      const validation = validateVideoFile(file as File);
      if (!validation.valid) {
        setValidationErrors({ ...validationErrors, musicVideo: validation.errors });
        return;
      }
      setValidationErrors({ ...validationErrors, musicVideo: [] });
      setFiles({ ...files, musicVideo: file });
    } else if (type === 'additionalFiles') {
      const fileList = Array.from(file as FileList);
      setFiles({ ...files, additionalFiles: [...files.additionalFiles, ...fileList] });
    }
  };

  const removeFile = (type: string, index?: number) => {
    if (type === 'coverImage' || type === 'artistPhoto' || type === 'motionArt' || type === 'musicVideo') {
      setFiles({ ...files, [type]: null });
      setValidationErrors({ ...validationErrors, [type]: [] });
    } else if (type === 'additionalFiles' && index !== undefined) {
      const newFiles = [...files.additionalFiles];
      newFiles.splice(index, 1);
      setFiles({ ...files, additionalFiles: newFiles });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!files.coverImage) {
      // Scroll to cover image section
      const element = document.getElementById('cover-image-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-red-500', 'ring-offset-2');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2');
        }, 3000);
      }
      return;
    }

    if (files.audioFiles.length === 0) {
      // Scroll to audio files section
      const element = document.getElementById('audio-files-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-red-500', 'ring-offset-2');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2');
        }, 3000);
      }
      return;
    }

    onNext(files);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('onboarding.step4', 'File Upload')}</h2>
          <p className="text-gray-600 dark:text-gray-400">{t('text.onboarding.step4.description', 'Upload your music files, artwork, and additional materials.')}</p>
          <Link
            to="/technical-guide"
            target="_blank"
            className="inline-flex items-center gap-2 mt-2 text-sm text-n3rve-main hover:text-n3rve-700 dark:text-n3rve-accent2 dark:hover:text-n3rve-300"
          >
            <Info className="w-4 h-4" />
            {t('upload.viewTechnicalGuide', 'View Technical Guide')}
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 앨범 커버 이미지 */}
          <div id="cover-image-section" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Image className="w-5 h-5 text-n3rve-main" />
                {t('upload.coverImage', 'Album Cover Image')}
                <span className="text-red-500">*</span>
                <button
                  type="button"
                  onClick={() => toggleGuidelines('albumArt')}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  title={t('upload.viewGuidelines', 'View Guidelines')}
                >
                  <HelpCircle className="w-4 h-4 text-gray-400 hover:text-n3rve-main dark:hover:text-n3rve-accent2" />
                </button>
              </h3>
              {files.coverImage && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>

            {showGuidelines.albumArt && (
              <div className="mb-4">
                <FileUploadGuidelines fileType="albumArt" showCompact={true} />
              </div>
            )}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 transition-colors hover:border-n3rve-accent2 dark:hover:border-n3rve-accent">
              {files.coverImage ? (
                <div className="relative group">
                  <img
                    src={URL.createObjectURL(files.coverImage)}
                    alt="Cover"
                    className="w-full max-w-[200px] mx-auto rounded-lg shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile('coverImage')}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
                    {files.coverImage.name}
                  </p>
                </div>
              ) : (
                <div
                  onClick={() => coverImageRef.current?.click()}
                  className="text-center cursor-pointer py-8"
                >
                  <div className="w-20 h-20 bg-n3rve-100 dark:bg-n3rve-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-10 h-10 text-n3rve-main dark:text-n3rve-accent2" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('upload.clickToUpload', 'Click to Upload')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('upload.dragOrClick', 'Drag and drop files here or click to browse')}</p>
                </div>
              )}
              <input
                ref={coverImageRef}
                type="file"
                accept="image/*"
                onChange={e => e.target.files?.[0] && handleFileUpload('coverImage', e.target.files[0])}
                className="hidden"
              />
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {t('upload.recommendedSize', 'Recommended size: 3000x3000px')}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{t('upload.format', 'Supported formats: {{format}}').replace('{{format}}', 'JPG, PNG')}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">• Min: {ARTWORK_SPECIFICATIONS.minResolution} • Recommended: {ARTWORK_SPECIFICATIONS.recommendedResolution}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">• Max file size: {ARTWORK_SPECIFICATIONS.maxFileSize}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">• Color mode: {ARTWORK_SPECIFICATIONS.colorMode} only</p>
            </div>
            {validationErrors.coverImage && validationErrors.coverImage.length > 0 && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                {validationErrors.coverImage.map((error, index) => (
                  <p key={index} className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* 아티스트 사진 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Image className="w-5 h-5 text-n3rve-main" />
                {t('upload.artistPhoto', 'Artist Photo')}
              </h3>
              {files.artistPhoto && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 transition-colors hover:border-n3rve-accent2 dark:hover:border-n3rve-accent">
              {files.artistPhoto ? (
                <div className="relative group">
                  <img
                    src={URL.createObjectURL(files.artistPhoto)}
                    alt="Artist"
                    className="w-full max-w-[200px] mx-auto rounded-lg shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile('artistPhoto')}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
                    {files.artistPhoto.name}
                  </p>
                </div>
              ) : (
                <div
                  onClick={() => artistPhotoRef.current?.click()}
                  className="text-center cursor-pointer py-8"
                >
                  <div className="w-20 h-20 bg-n3rve-100 dark:bg-n3rve-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-10 h-10 text-n3rve-main dark:text-n3rve-accent2" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('upload.clickToUpload', 'Click to Upload')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('upload.dragOrClick', 'Drag and drop files here or click to browse')}</p>
                </div>
              )}
              <input
                ref={artistPhotoRef}
                type="file"
                accept="image/*"
                onChange={e => e.target.files?.[0] && handleFileUpload('artistPhoto', e.target.files[0])}
                className="hidden"
              />
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-xs text-gray-600 dark:text-gray-400">{t('text.optional', 'Optional')}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{t('upload.format', 'Supported formats: {{format}}').replace('{{format}}', 'JPG, PNG')}</p>
            </div>
          </div>
        </div>

        {/* 음원 파일 */}
        <div id="audio-files-section" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Music className="w-5 h-5 text-n3rve-main" />
              {t('upload.audioFiles', 'Audio Files')}
              <span className="text-red-500">*</span>
              <button
                type="button"
                onClick={() => toggleGuidelines('audio')}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title={t('upload.viewGuidelines', 'View Guidelines')}
              >
                <HelpCircle className="w-4 h-4 text-gray-400 hover:text-n3rve-main dark:hover:text-n3rve-accent2" />
              </button>
            </h3>
            {files.audioFiles.length > 0 && (
              <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {t('upload.filesCount', '{{count}} files uploaded').replace('{{count}}', String(files.audioFiles.length))}
              </span>
            )}
          </div>

          {showGuidelines.audio && (
            <div className="mb-4">
              <FileUploadGuidelines fileType="audio" showCompact={true} />
            </div>
          )}

          {/* Audio Specifications Box */}
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">FUGA Audio Technical Requirements:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-blue-800 dark:text-blue-200">
                  <div>
                    <p className="font-medium mb-1">Accepted Formats:</p>
                    <p>• {AUDIO_SPECIFICATIONS.formats.join(', ')}</p>
                    <p className="font-medium mt-2 mb-1">Sample Rates:</p>
                    <p>• {AUDIO_SPECIFICATIONS.sampleRates.map(sr => sr/1000 + 'kHz').join(', ')}</p>
                    <p className="font-medium mt-2 mb-1">Bit Depths:</p>
                    <p>• {AUDIO_SPECIFICATIONS.bitDepths.map(bd => bd + '-bit').join(', ')}</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Requirements:</p>
                    {AUDIO_SPECIFICATIONS.requirements.slice(0, 4).map((req, idx) => (
                      <p key={idx}>• {req}</p>
                    ))}
                  </div>
                </div>
                <p className="mt-2 font-medium text-red-600 dark:text-red-400">Max file size: {AUDIO_SPECIFICATIONS.maxFileSize} per file</p>
              </div>
            </div>
          </div>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 transition-colors hover:border-n3rve-accent2 dark:hover:border-n3rve-accent">
            {files.audioFiles.length > 0 ? (
              <div className="space-y-3">
                {files.audioFiles.map((audio: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-10 h-10 bg-n3rve-100 dark:bg-n3rve-900/30 rounded-full flex items-center justify-center">
                      <Music className="w-5 h-5 text-n3rve-main dark:text-n3rve-accent2" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{t('track.number', 'Track {{number}}').replace('{{number}}', String(index + 1))}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{audio.file.name}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {(audio.file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => audioFilesRef.current?.click()}
                  className="w-full mt-2 px-4 py-2 text-sm text-n3rve-main dark:text-n3rve-accent2 border border-n3rve-300 dark:border-n3rve-700 rounded-lg hover:bg-n3rve-50 dark:hover:bg-n3rve-900/20 transition-colors"
                >
                  {t('upload.changeFile', 'Change Files')}
                </button>
              </div>
            ) : (
              <div
                onClick={() => audioFilesRef.current?.click()}
                className="text-center cursor-pointer py-8"
              >
                <div className="w-20 h-20 bg-n3rve-100 dark:bg-n3rve-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-10 h-10 text-n3rve-main dark:text-n3rve-accent2" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('upload.clickToUploadAudio', 'Click to Upload Audio Files')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('upload.multipleFiles', 'Select multiple files in track order')}</p>
              </div>
            )}
            <input
              ref={audioFilesRef}
              type="file"
              accept=".wav,.flac,.aiff"
              multiple
              onChange={e => e.target.files && handleFileUpload('audioFiles', e.target.files)}
              className="hidden"
            />
          </div>
          <div className="mt-3 space-y-1">
            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {t('upload.trackOrder', 'Please upload files in track order')}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{t('upload.recommendedAudioFormat', 'Recommended: WAV 24-bit/48kHz or higher')}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{t('upload.supportedAudioFormats', 'Supported: WAV, FLAC, AIFF')}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{t('upload.maxFileSize', 'Maximum file size: 2GB per file')}</p>
          </div>
          {validationErrors.audioFiles && validationErrors.audioFiles.length > 0 && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {validationErrors.audioFiles.map((error, index) => (
                <p key={index} className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Motion Art */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-n3rve-main" />
              {t('upload.motionArt', 'Motion Art')}
              <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">{t('text.optional', 'Optional')}</span>
            </h3>
            {files.motionArt && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
          </div>

          {/* Motion Art Specifications Box */}
          <div className="mb-4 p-3 bg-n3rve-50 dark:bg-n3rve-900/20 rounded-lg border border-n3rve-200 dark:border-n3rve-800">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-n3rve-main dark:text-n3rve-accent2 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-n3rve-800 dark:text-n3rve-200 space-y-1">
                <p className="font-semibold">Motion Art Requirements:</p>
                <p>• Format: {MOTION_ART_SPECIFICATIONS.formats.join(', ')} • Aspect Ratio: {MOTION_ART_SPECIFICATIONS.aspectRatio}</p>
                <p>• Duration: {MOTION_ART_SPECIFICATIONS.duration} • Max Size: {MOTION_ART_SPECIFICATIONS.maxFileSize}</p>
                <p>• Min Resolution: {MOTION_ART_SPECIFICATIONS.resolution} • Codec: {MOTION_ART_SPECIFICATIONS.codec}</p>
              </div>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 transition-colors hover:border-n3rve-accent2 dark:hover:border-n3rve-accent">
            {files.motionArt ? (
              <div className="relative group">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-10 h-10 bg-n3rve-100 dark:bg-n3rve-900/30 rounded-full flex items-center justify-center">
                    <Film className="w-5 h-5 text-n3rve-main dark:text-n3rve-accent2" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{files.motionArt.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(files.motionArt.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile('motionArt')}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => motionArtRef.current?.click()}
                className="text-center cursor-pointer py-8"
              >
                <div className="w-16 h-16 bg-n3rve-100 dark:bg-n3rve-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Film className="w-8 h-8 text-n3rve-main dark:text-n3rve-accent2" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('upload.uploadMotionArt', 'Upload Motion Art')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('upload.motionArtDesc', 'Animated cover art for streaming platforms')}</p>
              </div>
            )}
            <input
              ref={motionArtRef}
              type="file"
              accept=".mp4"
              onChange={e => e.target.files?.[0] && handleFileUpload('motionArt', e.target.files[0])}
              className="hidden"
            />
          </div>
          {validationErrors.motionArt && validationErrors.motionArt.length > 0 && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {validationErrors.motionArt.map((error, index) => (
                <p key={index} className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Music Video */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-n3rve-main" />
              {t('upload.musicVideo', 'Music Video')}
              <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">{t('text.optional', 'Optional')}</span>
            </h3>
            {files.musicVideo && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
          </div>

          {/* Video Specifications Box */}
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-green-800 dark:text-green-200 space-y-1">
                <p className="font-semibold">Video Requirements:</p>
                <p>• Formats: {VIDEO_SPECIFICATIONS.formats.join(', ')} • Aspect Ratio: {VIDEO_SPECIFICATIONS.aspectRatio}</p>
                <p>• Min Resolution: {VIDEO_SPECIFICATIONS.minResolution} • Codec: {VIDEO_SPECIFICATIONS.codec}</p>
                <p>• Max Size: {VIDEO_SPECIFICATIONS.maxFileSize} • FPS: {VIDEO_SPECIFICATIONS.fps.join(', ')}</p>
              </div>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 transition-colors hover:border-n3rve-accent2 dark:hover:border-n3rve-accent">
            {files.musicVideo ? (
              <div className="relative group">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-10 h-10 bg-n3rve-100 dark:bg-n3rve-900/30 rounded-full flex items-center justify-center">
                    <Video className="w-5 h-5 text-n3rve-main dark:text-n3rve-accent2" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{files.musicVideo.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(files.musicVideo.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile('musicVideo')}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => musicVideoRef.current?.click()}
                className="text-center cursor-pointer py-8"
              >
                <div className="w-16 h-16 bg-n3rve-100 dark:bg-n3rve-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Video className="w-8 h-8 text-n3rve-main dark:text-n3rve-accent2" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('upload.uploadMusicVideo', 'Upload Music Video')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('upload.musicVideoDesc', 'Upload the official music video')}</p>
              </div>
            )}
            <input
              ref={musicVideoRef}
              type="file"
              accept=".mp4,.mov"
              onChange={e => e.target.files?.[0] && handleFileUpload('musicVideo', e.target.files[0])}
              className="hidden"
            />
          </div>
          {validationErrors.musicVideo && validationErrors.musicVideo.length > 0 && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {validationErrors.musicVideo.map((error, index) => (
                <p key={index} className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* 추가 자료 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-n3rve-main" />
              {t('upload.additionalFiles', 'Additional Files')}
              <button
                type="button"
                onClick={() => toggleGuidelines('additional')}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title={t('upload.viewGuidelines', 'View Guidelines')}
              >
                <HelpCircle className="w-4 h-4 text-gray-400 hover:text-n3rve-main dark:hover:text-n3rve-accent2" />
              </button>
            </h3>
            {files.additionalFiles.length > 0 && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('upload.filesCount', '{{count}} files uploaded').replace('{{count}}', String(files.additionalFiles.length))}
              </span>
            )}
          </div>

          {showGuidelines.additional && (
            <div className="mb-4">
              <FileUploadGuidelines fileType="additional" showCompact={true} />
            </div>
          )}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 transition-colors hover:border-n3rve-accent2 dark:hover:border-n3rve-accent">
            {files.additionalFiles.length > 0 && (
              <div className="space-y-2 mb-4">
                {files.additionalFiles.map((file: File, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile('additionalFiles', index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div
              onClick={() => additionalFilesRef.current?.click()}
              className="text-center cursor-pointer py-4"
            >
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('upload.additionalMaterials', 'Upload Additional Materials')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('upload.additionalMaterialsDesc', 'Lyrics, liner notes, or other supporting materials')}</p>
            </div>
            <input
              ref={additionalFilesRef}
              type="file"
              multiple
              onChange={e => e.target.files && handleFileUpload('additionalFiles', e.target.files)}
              className="hidden"
            />
          </div>
          <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">{t('upload.optionalFormats', 'All file formats accepted')}</p>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={onPrevious}
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          {t('onboarding.previous', 'Previous')}
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-n3rve-main hover:bg-n3rve-700 text-white rounded-lg transition-colors"
        >
          {t('onboarding.next', 'Next')}
        </button>
      </div>
    </form>
  );
}
