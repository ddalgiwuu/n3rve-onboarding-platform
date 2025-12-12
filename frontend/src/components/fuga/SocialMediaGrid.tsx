import { useState } from 'react';
import {
  Music2, Globe, Youtube, Instagram, Facebook,
  Twitter, Link as LinkIcon, HelpCircle
} from 'lucide-react';
import { FugaSocialMedia } from '@/types/fugaArtist';
import { validateUrl } from '@/utils/fugaArtistValidation';

interface SocialMediaGridProps {
  values: Partial<FugaSocialMedia>;
  onChange: (field: keyof FugaSocialMedia, value: string) => void;
  errors: Record<string, string>;
  language?: 'ko' | 'en';
}

const socialMediaPlatforms = [
  // Major Platforms
  {
    key: 'spotify' as keyof FugaSocialMedia,
    label: 'Spotify Artist URL',
    icon: Music2,
    placeholder: 'https://open.spotify.com/artist/...',
    color: 'text-green-600',
    category: 'major',
  },
  {
    key: 'appleMusic' as keyof FugaSocialMedia,
    label: 'Apple Music URL',
    icon: Music2,
    placeholder: 'https://music.apple.com/artist/...',
    color: 'text-red-600',
    category: 'major',
  },
  {
    key: 'youtube' as keyof FugaSocialMedia,
    label: 'YouTube URL',
    icon: Youtube,
    placeholder: 'https://www.youtube.com/channel/...',
    color: 'text-red-600',
    category: 'major',
  },
  {
    key: 'soundcloud' as keyof FugaSocialMedia,
    label: 'SoundCloud Artist ID',
    icon: Music2,
    placeholder: 'https://soundcloud.com/artist',
    color: 'text-orange-600',
    category: 'major',
  },

  // Social Platforms
  {
    key: 'instagram' as keyof FugaSocialMedia,
    label: 'Instagram URL',
    icon: Instagram,
    placeholder: 'https://www.instagram.com/artist',
    color: 'text-pink-600',
    category: 'social',
  },
  {
    key: 'tiktok' as keyof FugaSocialMedia,
    label: 'TikTok URL',
    icon: Music2,
    placeholder: 'https://www.tiktok.com/@artist',
    color: 'text-black dark:text-white',
    category: 'social',
  },
  {
    key: 'facebook' as keyof FugaSocialMedia,
    label: 'Facebook URL',
    icon: Facebook,
    placeholder: 'https://www.facebook.com/artist',
    color: 'text-blue-600',
    category: 'social',
  },
  {
    key: 'twitter' as keyof FugaSocialMedia,
    label: 'X URL',
    icon: Twitter,
    placeholder: 'https://x.com/artist',
    color: 'text-gray-800 dark:text-gray-200',
    category: 'social',
  },

  // Other Platforms
  {
    key: 'triller' as keyof FugaSocialMedia,
    label: 'Triller URL',
    icon: LinkIcon,
    placeholder: 'https://triller.co/@artist',
    color: 'text-purple-600',
    category: 'other',
  },
  {
    key: 'snapchat' as keyof FugaSocialMedia,
    label: 'Snapchat URL',
    icon: LinkIcon,
    placeholder: 'https://www.snapchat.com/add/artist',
    color: 'text-yellow-500',
    category: 'other',
  },
  {
    key: 'twitch' as keyof FugaSocialMedia,
    label: 'Twitch URL',
    icon: LinkIcon,
    placeholder: 'https://www.twitch.tv/artist',
    color: 'text-purple-600',
    category: 'other',
  },
  {
    key: 'pinterest' as keyof FugaSocialMedia,
    label: 'Pinterest URL',
    icon: LinkIcon,
    placeholder: 'https://www.pinterest.com/artist/',
    color: 'text-red-600',
    category: 'other',
  },
  {
    key: 'tumblr' as keyof FugaSocialMedia,
    label: 'Tumblr URL',
    icon: LinkIcon,
    placeholder: 'https://artist.tumblr.com',
    color: 'text-blue-700',
    category: 'other',
  },

  // Additional URLs
  {
    key: 'tourdatesUrl' as keyof FugaSocialMedia,
    label: 'Tourdates URL',
    icon: Globe,
    placeholder: 'https://...',
    color: 'text-gray-600',
    category: 'other',
  },
];

export default function SocialMediaGrid({
  values,
  onChange,
  errors,
  language = 'ko',
}: SocialMediaGridProps) {
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;
  const [showHelp, setShowHelp] = useState<string | null>(null);

  const categories = {
    major: t('주요 플랫폼', 'Major Platforms'),
    social: t('소셜 미디어', 'Social Media'),
    other: t('기타 플랫폼', 'Other Platforms'),
  };

  const groupedPlatforms = {
    major: socialMediaPlatforms.filter((p) => p.category === 'major'),
    social: socialMediaPlatforms.filter((p) => p.category === 'social'),
    other: socialMediaPlatforms.filter((p) => p.category === 'other'),
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedPlatforms).map(([category, platforms]) => (
        <div key={category}>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            {categories[category as keyof typeof categories]}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              const value = values[platform.key] || '';
              const hasError = !!errors[platform.key];
              const isValid = value && validateUrl(value);

              return (
                <div key={platform.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${platform.color}`} />
                      {platform.label}
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={value}
                      onChange={(e) => onChange(platform.key, e.target.value)}
                      className={`
                        w-full px-4 py-2 pr-10 border rounded-lg
                        focus:ring-2 focus:ring-purple-500
                        bg-white dark:bg-gray-700
                        ${hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                        ${isValid ? 'border-green-500' : ''}
                      `}
                      placeholder={platform.placeholder}
                    />
                    {isValid && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  {hasError && (
                    <p className="mt-1 text-xs text-red-500">{errors[platform.key]}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
