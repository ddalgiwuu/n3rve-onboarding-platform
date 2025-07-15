import React from 'react';
import { t, useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore'
import {
  FileAudio,
  Image,
  Film,
  Video,
  CheckCircle,
  XCircle,
  Info,
  AlertCircle
} from 'lucide-react';
import {
  AUDIO_SPECIFICATIONS,
  ARTWORK_SPECIFICATIONS,
  MOTION_ART_SPECIFICATIONS,
  DOLBY_ATMOS_SPECIFICATIONS,
  VIDEO_SPECIFICATIONS
} from '../../utils/technicalSpecs';

interface SpecificationCardProps {
  title: string;
  icon: React.ReactNode;
  specs: any;
  examples?: {
    correct: string[];
    incorrect: string[];
  };
  tips?: string[];
}

const SpecificationCard: React.FC<SpecificationCardProps> = ({
  title,
  icon,
  specs,
  examples,
  tips
}) => {
  const language = useSafeStore(useLanguageStore, (state) => state.language);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-n3rve-500/10 p-6 mb-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
      <div className="flex items-center mb-4">
        <div className="mr-3 p-2 bg-gradient-to-br from-n3rve-main to-n3rve-accent rounded-lg">
          <div className="text-white">{icon}</div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>

      <div className="space-y-4">
        {/* Main Specifications */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-medium mb-2 flex items-center text-gray-900 dark:text-white">
            <Info className="w-4 h-4 mr-2 text-n3rve-main" />
            {t('technicalGuide.specifications')}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {Object.entries(specs).map(([key, value]) => {
              if (key === 'requirements') return null;
              return (
                <div key={key} className="flex">
                  <span className="font-medium capitalize mr-2 text-gray-700 dark:text-gray-300">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {Array.isArray(value) ? value.join(', ') : value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Requirements */}
        {specs.requirements && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium mb-2 flex items-center text-gray-900 dark:text-white">
              <CheckCircle className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
              {t('technicalGuide.requirements')}
            </h4>
            <ul className="space-y-1 text-sm">
              {specs.requirements.map((req: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-2">•</span>
                  <span className="text-gray-700 dark:text-gray-300">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Examples */}
        {examples && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <h4 className="font-medium mb-2 flex items-center text-green-700 dark:text-green-300">
                <CheckCircle className="w-4 h-4 mr-2" />
                {t('technicalGuide.correctExamples')}
              </h4>
              <ul className="space-y-1 text-sm">
                {examples.correct.map((example, index) => (
                  <li key={index} className="text-gray-700 dark:text-gray-300 font-mono">{example}</li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <h4 className="font-medium mb-2 flex items-center text-red-700 dark:text-red-300">
                <XCircle className="w-4 h-4 mr-2" />
                {t('technicalGuide.incorrectExamples')}
              </h4>
              <ul className="space-y-1 text-sm">
                {examples.incorrect.map((example, index) => (
                  <li key={index} className="text-gray-700 dark:text-gray-300 font-mono">{example}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Pro Tips */}
        {tips && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-medium mb-2 flex items-center text-yellow-700 dark:text-yellow-300">
              <AlertCircle className="w-4 h-4 mr-2" />
              {t('technicalGuide.proTips')}
            </h4>
            <ul className="space-y-1 text-sm">
              {tips.map((tip, index) => (
                <li key={index} className="text-gray-700 dark:text-gray-300 flex items-start">
                  <span className="text-yellow-600 dark:text-yellow-400 mr-2">💡</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const TechnicalGuide: React.FC = () => {
  const language = useSafeStore(useLanguageStore, (state) => state.language);

  const audioExamples = {
    correct: [
      'Track_01_Master.wav (48kHz/24bit)',
      'Album_Final_Mix.flac (96kHz/24bit)',
      'Single_Master_Stereo.aiff (44.1kHz/16bit)'
    ],
    incorrect: [
      'song.mp3 (lossy format)',
      'track_128kbps.m4a (compressed)',
      'demo_rough.wav (8kHz/8bit)'
    ]
  };

  const audioTips = [
    t('technicalGuide.tips.audio1'),
    t('technicalGuide.tips.audio2'),
    t('technicalGuide.tips.audio3')
  ];

  const artworkExamples = {
    correct: [
      'AlbumCover_3000x3000.jpg',
      'SingleArt_RGB_HighQuality.png',
      'EP_Cover_Square_NoText.jpg'
    ],
    incorrect: [
      'cover_500x500.jpg (too small)',
      'artwork_CMYK.png (wrong color mode)',
      'cover_with_promo_text.jpg (has text)'
    ]
  };

  const artworkTips = [
    t('technicalGuide.tips.artwork1'),
    t('technicalGuide.tips.artwork2'),
    t('technicalGuide.tips.artwork3')
  ];

  const motionArtExamples = {
    correct: [
      'MotionCover_1080x1080_Loop.mp4',
      'AnimatedArt_Square_NoAudio.mp4',
      'VisualLoop_H264_25fps.mp4'
    ],
    incorrect: [
      'video_16x9.mp4 (wrong aspect ratio)',
      'motion_with_audio.mp4 (contains audio)',
      'animation.mov (wrong format)'
    ]
  };

  const motionArtTips = [
    t('technicalGuide.tips.motionArt1'),
    t('technicalGuide.tips.motionArt2'),
    t('technicalGuide.tips.motionArt3')
  ];

  const dolbyAtmosTips = [
    t('technicalGuide.tips.dolbyAtmos1'),
    t('technicalGuide.tips.dolbyAtmos2'),
    t('technicalGuide.tips.dolbyAtmos3')
  ];

  const videoExamples = {
    correct: [
      'MusicVideo_1920x1080_H264.mp4',
      'OfficialVideo_4K_30fps.mov',
      'Visualizer_HD_Progressive.mp4'
    ],
    incorrect: [
      'video_640x480.mp4 (too low resolution)',
      'interlaced_video.mov (interlaced)',
      'video_with_watermark.mp4 (has watermark)'
    ]
  };

  const videoTips = [
    t('technicalGuide.tips.video1'),
    t('technicalGuide.tips.video2'),
    t('technicalGuide.tips.video3')
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-n3rve-main to-n3rve-accent bg-clip-text text-transparent mb-4">
              {t('technicalGuide.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">{t('technicalGuide.description')}</p>
          </div>
        </div>

      {/* Audio Specifications */}
      <SpecificationCard
        title={t('technicalGuide.audio.title')}
        icon={<FileAudio className="w-6 h-6" />}
        specs={AUDIO_SPECIFICATIONS}
        examples={audioExamples}
        tips={audioTips}
      />

      {/* Artwork Specifications */}
      <SpecificationCard
        title={t('technicalGuide.artwork.title')}
        icon={<Image className="w-6 h-6" />}
        specs={ARTWORK_SPECIFICATIONS}
        examples={artworkExamples}
        tips={artworkTips}
      />

      {/* Motion Art Specifications */}
      <SpecificationCard
        title={t('technicalGuide.motionArt.title')}
        icon={<Film className="w-6 h-6" />}
        specs={MOTION_ART_SPECIFICATIONS}
        examples={motionArtExamples}
        tips={motionArtTips}
      />

      {/* Dolby Atmos Specifications */}
      <SpecificationCard
        title={t('technicalGuide.dolbyAtmos.title')}
        icon={<FileAudio className="w-6 h-6" />}
        specs={DOLBY_ATMOS_SPECIFICATIONS}
        tips={dolbyAtmosTips}
      />

      {/* Video Specifications */}
      <SpecificationCard
        title={t('technicalGuide.video.title')}
        icon={<Video className="w-6 h-6" />}
        specs={VIDEO_SPECIFICATIONS}
        examples={videoExamples}
        tips={videoTips}
      />

        {/* Contact Support */}
        <div className="mt-8 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 text-center border border-gray-300 dark:border-gray-600">
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{t('technicalGuide.needHelp')}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{t('technicalGuide.contactSupport')}</p>
          <button className="bg-gradient-to-r from-gray-800 to-gray-900 dark:from-n3rve-main dark:to-n3rve-accent text-white px-8 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all font-medium">
            {t('technicalGuide.contactButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TechnicalGuide;