import React, { useState, useMemo } from 'react';
import {
  Copy, ChevronDown, ChevronRight, Music, Album, FileText, Globe,
  Info, Users,
  CheckCircle, XCircle, AlertCircle,
  Package, Download, Eye, Play,
  Disc3, Calendar, Shield, FileAudio, Video, Tag, Mic2, BarChart3
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';
import toast from 'react-hot-toast';
import { dropboxService } from '@/services/dropbox.service';

interface Props {
  submission: any // MongoDB에서 가져온 전체 submission 데이터
}

interface Section {
  id: string
  title: string
  icon: React.ReactNode
  data: Record<string, any>
}

const SubmissionDetailView: React.FC<Props> = ({ submission }) => {
  const language = useSafeStore(useLanguageStore, (state) => state.language);
  // Note: t function is not available from useLanguageStore, need to create local t function
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'product', 'artist', 'tracks', 'distribution', 'files'
  ]);
  const [copiedSections, setCopiedSections] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const copyToClipboard = async (text: string, sectionId?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (sectionId) {
        setCopiedSections(new Set([...copiedSections, sectionId]));
        setTimeout(() => {
          setCopiedSections(prev => {
            const newSet = new Set(prev);
            newSet.delete(sectionId);
            return newSet;
          });
        }, 2000);
      }
      toast.success(t('복사되었습니다', 'Copied'));
    } catch {
      toast.error(t('복사 실패', 'Copy failed'));
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'boolean') return value ? t('예', 'Yes') : t('아니오', 'No');
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const formatSectionForCopy = (section: Section): string => {
    const lines = [`=== ${section.title} ===`];
    Object.entries(section.data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        lines.push(`${key}: ${formatValue(value)}`);
      }
    });
    return lines.join('\n');
  };

  const formatAllForCopy = (): string => {
    const allSections = getSections();
    return allSections.map(section => formatSectionForCopy(section)).join('\n\n');
  };

  const getDirectUrl = (url: string) => {
    if (!url) return '';
    return dropboxService.getDirectUrl(url);
  };

  const getSections = (): Section[] => {
    const sections: Section[] = [];

    // Product Level Fields - Use MongoDB fields directly
    const albumTrans = submission.albumTranslations || {};

    sections.push({
      id: 'product',
      title: t('제품 레벨 필드', 'Product Level Fields'),
      icon: <Album className="w-5 h-5" />,
      data: {
        [t('앨범 제목 (한국어)', 'Album Title (Korean)')]: submission.albumTitle || '',
        [t('앨범 제목 (영어)', 'Album Title (English)')]: submission.albumTitleEn || '',
        [t('앨범 제목 번역', 'Album Title Translations')]: albumTrans ? JSON.stringify(albumTrans, null, 2) : '',
        [t('앨범 유형', 'Album Type')]: submission.albumType || '',
        [t('레이블명', 'Label Name')]: submission.labelName || '',
        [t('장르', 'Genre')]: Array.isArray(submission.genre) ? submission.genre.join(', ') : (submission.genre || ''),
        [t('앨범 장르', 'Album Genre')]: Array.isArray(submission.albumGenre) ? submission.albumGenre.join(', ') : (submission.albumGenre || ''),
        [t('앨범 서브장르', 'Album Subgenre')]: Array.isArray(submission.albumSubgenre) ? submission.albumSubgenre.join(', ') : (submission.albumSubgenre || ''),
        [t('발매일', 'Release Date')]: submission.releaseDate || '',
        [t('앨범 버전', 'Album Version')]: submission.albumVersion || '',
        [t('릴리스 버전', 'Release Version')]: submission.releaseVersion || '',
        [t('주 제목', 'Primary Title')]: submission.primaryTitle || '',
        [t('번역 여부', 'Has Translation')]: submission.hasTranslation ? t('예', 'Yes') : t('아니오', 'No'),
        [t('번역 언어', 'Translation Language')]: submission.translationLanguage || '',
        [t('번역된 제목', 'Translated Title')]: submission.translatedTitle || '',
        [t('앨범 설명', 'Album Description')]: submission.albumDescription || '',
        [t('앨범 기여자', 'Album Contributors')]: submission.albumContributors ? JSON.stringify(submission.albumContributors, null, 2) : '',
        [t('앨범 피처링 아티스트', 'Album Featuring Artists')]: submission.albumFeaturingArtists ? JSON.stringify(submission.albumFeaturingArtists, null, 2) : '',
        [t('총 볼륨 수', 'Total Volumes')]: submission.totalVolumes || 1,
        [t('앨범 노트', 'Album Note')]: submission.albumNote || '',
        [t('전체 Explicit 여부', 'Album Explicit Content')]: submission.explicitContent ? t('예', 'Yes') : t('아니오', 'No'),
        [t('디스플레이 아티스트', 'Display Artist')]: submission.displayArtist || '',
        'UPC': submission.release?.upc || '',
        [t('카탈로그 번호', 'Catalog Number')]: submission.release?.catalogNumber || '',
        [t('저작권 소유자', 'Copyright Holder')]: submission.release?.copyrightHolder || '',
        [t('저작권 연도', 'Copyright Year')]: submission.release?.copyrightYear || '',
        [t('음반 제작권 소유자', 'Production Holder')]: submission.release?.productionHolder || '',
        [t('음반 제작권 연도', 'Production Year')]: submission.release?.productionYear || '',
        [t('저작권 (℗)', 'Copyright (℗)')]: submission.release?.pRights || '',
        [t('저작권 (©)', 'Copyright (©)')]: submission.release?.cRights || ''
      }
    });

    // Artist Information - Use MongoDB fields with enhanced display
    const artistTranslations = submission.artistTranslations || [];
    const socialLinks = submission.socialLinks || {};

    sections.push({
      id: 'artist',
      title: t('아티스트 정보', 'Artist Information'),
      icon: <Users className="w-5 h-5" />,
      data: {
        [t('아티스트명 (한국어)', 'Artist Name (Korean)')]: submission.artistName || '',
        [t('아티스트명 (영어)', 'Artist Name (English)')]: submission.artistNameEn || '',
        [t('아티스트 유형', 'Artist Type')]: submission.artistType || '',
        [t('레이블명', 'Label Name')]: submission.labelName || '',
        [t('바이오그래피', 'Biography')]: submission.biography || '',
        [t('장르', 'Genre')]: Array.isArray(submission.genre) ? submission.genre.join(', ') : (submission.genre || ''),

        // Artist Translations
        [t('아티스트 번역 (일본어)', 'Artist Name (Japanese)')]: artistTranslations.find?.((t: any) => t.language === 'ja')?.name || '',
        [t('아티스트 번역 (중국어)', 'Artist Name (Chinese)')]: artistTranslations.find?.((t: any) => t.language === 'zh')?.name || '',
        [t('아티스트 번역 (스페인어)', 'Artist Name (Spanish)')]: artistTranslations.find?.((t: any) => t.language === 'es')?.name || '',
        [t('기타 번역', 'Other Translations')]: artistTranslations.filter?.((t: any) => !['ja', 'zh', 'es'].includes(t.language)).map((t: any) => `${t.language}: ${t.name}`).join(', ') || '',

        // Platform IDs
        'Spotify Artist ID': submission.spotifyId || '',
        'Apple Music Artist ID': submission.appleMusicId || '',
        'YouTube Channel ID': submission.youtubeChannelId || '',

        // Social Media Links
        'Instagram': socialLinks.instagram || '',
        'Twitter/X': socialLinks.twitter || socialLinks.x || '',
        'Facebook': socialLinks.facebook || '',
        'TikTok': socialLinks.tiktok || '',
        'YouTube': socialLinks.youtube || '',
        'SoundCloud': socialLinks.soundcloud || '',
        'Website': socialLinks.website || '',

        // Members (for groups)
        [t('멤버 정보', 'Members')]: submission.members ? JSON.stringify(submission.members, null, 2) : ''
      }
    });

    // Tracks Summary
    sections.push({
      id: 'tracks-summary',
      title: t('트랙 요약', 'Tracks Summary'),
      icon: <Music className="w-5 h-5" />,
      data: {
        [t('총 트랙 수', 'Total Tracks')]: submission.tracks?.length || 0,
        [t('Dolby Atmos 트랙', 'Dolby Atmos Tracks')]: submission.tracks?.filter((t: any) => t.dolbyAtmos).length || 0,
        [t('타이틀 트랙', 'Title Tracks')]: submission.tracks?.filter((t: any) => t.isTitle).length || 0,
        [t('포커스 트랙', 'Focus Tracks')]: submission.tracks?.filter((t: any) => t.isFocusTrack).length || 0,
        [t('Explicit 트랙', 'Explicit Tracks')]: submission.tracks?.filter((t: any) => t.explicitContent).length || 0,
        [t('앨범 기여자', 'Album Contributors')]: submission.albumContributors ? JSON.stringify(submission.albumContributors, null, 2) : ''
      }
    });

    // Individual Track Sections
    submission.tracks?.forEach((track: any, index: number) => {
      const trackArtists = track.artists || [];
      const trackFeaturing = track.featuringArtists || [];
      const trackContributors = track.contributors || [];

      sections.push({
        id: `track-${index}`,
        title: `${t('트랙', 'Track')} ${index + 1}: ${track.titleKo || track.title || t('제목 없음', 'No Title')}`,
        icon: <Music className="w-5 h-5" />,
        data: {
          // Title Information
          [t('트랙 번호', 'Track Number')]: track.trackNumber || (index + 1),
          [t('제목 (한국어)', 'Title (Korean)')]: track.titleKo || track.title || '',
          [t('제목 (영어)', 'Title (English)')]: track.titleEn || '',
          [t('제목 번역', 'Title Translations')]: track.titleTranslations ? JSON.stringify(track.titleTranslations, null, 2) : '',
          'ISRC': track.isrc || '',
          [t('뮤직 비디오 ISRC', 'Music Video ISRC')]: track.musicVideoISRC || '',
          [t('뮤직 비디오 여부', 'Has Music Video')]: track.hasMusicVideo ? t('예', 'Yes') : t('아니오', 'No'),
          [t('유형', 'Track Type')]: track.trackType || 'AUDIO',
          [t('버전', 'Version Type')]: track.versionType || 'ORIGINAL',
          [t('트랙 버전', 'Track Version')]: track.trackVersion || '',
          [t('재생 시간', 'Duration')]: track.duration || '',
          [t('볼륨', 'Volume')]: track.volume || '',
          [t('디스크 번호', 'Disc Number')]: track.discNumber || '',
          [t('장르', 'Genre')]: track.genre || '',
          [t('서브장르', 'Subgenre')]: track.subgenre || '',
          [t('대체 장르', 'Alternate Genre')]: track.alternateGenre || '',
          [t('대체 서브장르', 'Alternate Subgenre')]: track.alternateSubgenre || '',
          [t('피처링 (문자열)', 'Featuring (String)')]: track.featuring || '',
          [t('제목 언어', 'Title Language')]: track.titleLanguage || '',

          // Artists with details
          [t('메인 아티스트', 'Main Artists')]: trackArtists.map((a: any) => {
            const parts = [a.name || (typeof a === 'string' ? a : '')];

            // Handle translations (can be object or array)
            if (a.translations) {
              if (Array.isArray(a.translations)) {
                // Array format: [{language: 'en', name: 'Name'}]
                parts.push(`(번역: ${a.translations.map((t: any) => `${t.language}: ${t.name}`).join(', ')})`);
              } else if (typeof a.translations === 'object') {
                // Object format: {en: 'Name', ja: 'Name'}
                const transStr = Object.entries(a.translations).map(([lang, name]) => `${lang}: ${name}`).join(', ');
                if (transStr) parts.push(`(번역: ${transStr})`);
              }
            }

            // Handle identifiers (array) or direct IDs
            const ids = [];
            if (a.identifiers?.length) {
              ids.push(...a.identifiers.map((id: any) => `${id.type}: ${id.value}`));
            }
            if (a.spotifyId) ids.push(`spotify: ${a.spotifyId}`);
            if (a.appleId) ids.push(`apple: ${a.appleId}`);
            if (ids.length) parts.push(`[ID: ${ids.join(', ')}]`);

            return parts.filter(Boolean).join(' ');
          }).join('\n') || '',
          [t('피처링 아티스트', 'Featuring Artists')]: trackFeaturing.map((a: any) => {
            const parts = [a.name || (typeof a === 'string' ? a : '')];

            // Handle translations (can be object or array)
            if (a.translations) {
              if (Array.isArray(a.translations)) {
                parts.push(`(번역: ${a.translations.map((t: any) => `${t.language}: ${t.name}`).join(', ')})`);
              } else if (typeof a.translations === 'object') {
                const transStr = Object.entries(a.translations).map(([lang, name]) => `${lang}: ${name}`).join(', ');
                if (transStr) parts.push(`(번역: ${transStr})`);
              }
            }

            // Handle identifiers or direct IDs
            const ids = [];
            if (a.identifiers?.length) {
              ids.push(...a.identifiers.map((id: any) => `${id.type}: ${id.value}`));
            }
            if (a.spotifyId) ids.push(`spotify: ${a.spotifyId}`);
            if (a.appleId) ids.push(`apple: ${a.appleId}`);
            if (ids.length) parts.push(`[ID: ${ids.join(', ')}]`);

            return parts.filter(Boolean).join(' ');
          }).join('\n') || '',

          // Credits & Production
          [t('작곡', 'Composer')]: track.composer || '',
          [t('작사', 'Lyricist')]: track.lyricist || '',
          [t('편곡', 'Arranger')]: track.arranger || '',
          [t('프로듀서', 'Producer')]: track.producer || '',
          [t('믹서', 'Mixer')]: track.mixer || '',
          [t('마스터링', 'Masterer')]: track.masterer || '',
          [t('퍼블리셔', 'Publishers')]: track.publishers ? (Array.isArray(track.publishers) ? track.publishers.map((p: any) => p.name || p).join(', ') : JSON.stringify(track.publishers)) : '',

          // Language Information
          [t('트랙 언어', 'Track Language')]: track.language || '',
          [t('오디오 언어', 'Audio Language')]: track.audioLanguage || '',
          [t('가사 언어', 'Lyrics Language')]: track.lyricsLanguage || '',
          [t('메타데이터 언어', 'Metadata Language')]: track.metadataLanguage || '',
          [t('가사', 'Lyrics')]: track.lyrics || '',
          [t('트랙 번역', 'Track Translations')]: track.translations ? JSON.stringify(track.translations, null, 2) : '',

          // Preview Settings
          [t('미리듣기 시작', 'Preview Start')]: track.previewStart || '',
          [t('미리듣기 끝', 'Preview End')]: track.previewEnd || '',
          [t('미리듣기 시작 시점', 'Playtime Start Short Clip')]: track.playtimeStartShortClip || '',
          [t('미리듣기 길이', 'Preview Length')]: track.previewLength || '',
          [t('커스텀 릴리스 날짜 여부', 'Has Custom Release Date')]: track.hasCustomReleaseDate ? t('예', 'Yes') : t('아니오', 'No'),
          [t('커스텀 소비자 릴리스 날짜', 'Custom Consumer Release Date')]: track.customConsumerReleaseDate || '',
          [t('커스텀 릴리스 시간', 'Custom Release Time')]: track.customReleaseTime || '',

          // Contributors Detail
          [t('기여자', 'Contributors')]: trackContributors.map((c: any) => {
            const parts = [c.name || c];
            const details = [];
            if (c.role) details.push(t('역할', 'Role') + ': ' + c.role);
            if (c.roles?.length) details.push(t('역할', 'Roles') + ': ' + c.roles.join(', '));
            if (c.instrument) details.push(t('악기', 'Instrument') + ': ' + c.instrument);
            if (c.instruments?.length) details.push(t('악기', 'Instruments') + ': ' + c.instruments.join(', '));
            if (c.translations?.length) {
              details.push(t('번역', 'Translations') + ': ' + c.translations.map((t: any) => `${t.language}: ${t.name}`).join(', '));
            }
            if (c.identifiers?.length) {
              details.push('ID: ' + c.identifiers.map((id: any) => `${id.type}: ${id.value}`).join(', '));
            }
            return `${parts[0]}${details.length ? '\n  ' + details.join('\n  ') : ''}`;
          }).join('\n\n') || '',

          // Technical Specifications
          'Dolby Atmos': track.dolbyAtmos ? t('예', 'Yes') : t('아니오', 'No'),
          'Explicit Content': track.explicitContent ? t('예', 'Yes') : t('아니오', 'No'),
          'Stereo': track.stereo ? t('예', 'Yes') : t('아니오', 'No'),
          [t('타이틀 트랙', 'Title Track')]: track.isTitle ? t('예', 'Yes') : t('아니오', 'No'),
          [t('포커스 트랙', 'Focus Track')]: track.isFocusTrack ? t('예', 'Yes') : t('아니오', 'No')
        }
      });
    });

    // Distribution & Release Information
    sections.push({
      id: 'distribution',
      title: t('배급 및 릴리스 정보', 'Distribution & Release Information'),
      icon: <Globe className="w-5 h-5" />,
      data: {
        [t('배급 지역', 'Distribution Regions')]: submission.release?.territories ? (Array.isArray(submission.release.territories) ? submission.release.territories.join(', ') : JSON.stringify(submission.release.territories)) : '',
        [t('지역 유형', 'Territory Type')]: submission.release?.territoryType || '',
        [t('배급사', 'Distributors')]: submission.release?.distributors ? (Array.isArray(submission.release.distributors) ? submission.release.distributors.join(', ') : JSON.stringify(submission.release.distributors)) : '',
        [t('녹음 국가', 'Recording Country')]: submission.release?.recordingCountry || '',
        [t('녹음 언어', 'Recording Language')]: submission.release?.recordingLanguage || '',
        [t('릴리스 포맷', 'Release Format')]: submission.release?.releaseFormat || '',
        [t('가격 유형', 'Price Type')]: submission.release?.priceType || '',
        [t('부모 권고', 'Parental Advisory')]: submission.release?.parentalAdvisory || '',
        [t('컴필레이션 여부', 'Is Compilation')]: submission.release?.isCompilation || false,
        [t('이전 릴리스 여부', 'Previously Released')]: submission.release?.previouslyReleased || false,
        [t('플레이리스트 여부', 'This Is Playlist')]: submission.release?.thisIsPlaylist || false,
        [t('모션 아트워크', 'Motion Artwork')]: submission.release?.motionArtwork || false,
        [t('프리오더 활성화', 'Pre-Order Enabled')]: submission.release?.preOrderEnabled || false,
        [t('YouTube 쇼츠 미리보기', 'YouTube Shorts Previews')]: submission.release?.youtubeShortsPreviews || false,
        [t('릴리스 시간', 'Release Time')]: submission.release?.releaseTime || '',
        [t('선택된 타임존', 'Selected Timezone')]: submission.release?.selectedTimezone || '',
        [t('원본 릴리스 날짜', 'Original Release Date')]: submission.release?.originalReleaseDate || '',
        [t('소비자 릴리스 날짜', 'Consumer Release Date')]: submission.release?.consumerReleaseDate || '',
        [t('릴리스 UTC', 'Release UTC')]: submission.release?.releaseUTC || '',
        [t('원본 릴리스 UTC', 'Original Release UTC')]: submission.release?.originalReleaseUTC || '',
        [t('소비자 릴리스 UTC', 'Consumer Release UTC')]: submission.release?.consumerReleaseUTC || '',

        // Additional release info
        [t('릴리스 아티스트명', 'Release Artist Name')]: submission.release?.artistName || '',
        [t('싱크 이력 여부', 'Has Sync History')]: submission.release?.hasSyncHistory ? t('예', 'Yes') : t('아니오', 'No'),
        [t('무드', 'Moods')]: Array.isArray(submission.release?.moods) ? submission.release.moods.join(', ') : (submission.release?.moods ? JSON.stringify(submission.release.moods) : ''),
        [t('악기', 'Instruments')]: Array.isArray(submission.release?.instruments) ? submission.release.instruments.join(', ') : (submission.release?.instruments ? JSON.stringify(submission.release.instruments) : '')
      }
    });

    // Files
    sections.push({
      id: 'files',
      title: t('파일', 'Files'),
      icon: <FileText className="w-5 h-5" />,
      data: {
        [t('커버 아트', 'Cover Art')]: submission.files?.coverImageUrl || '',
        [t('아티스트 사진', 'Artist Photo')]: submission.files?.artistPhotoUrl || '',
        [t('모션 아트 URL', 'Motion Art URL')]: submission.files?.motionArtUrl || '',
        [t('뮤직 비디오 URL', 'Music Video URL')]: submission.files?.musicVideoUrl || '',
        [t('오디오 파일 수', 'Audio Files Count')]: submission.files?.audioFiles?.length || 0,
        [t('오디오 파일', 'Audio Files')]: submission.files?.audioFiles?.map((af: any, i: number) =>
          `${i + 1}. Track: ${af.trackId || ''} - ${af.fileName || ''} (${af.fileSize ? `${(af.fileSize / 1024 / 1024).toFixed(2)} MB` : ''})`
        ).join('\n') || '',
        [t('뮤직 비디오 파일', 'Music Video Files')]: submission.files?.musicVideoFiles?.length || 0,
        [t('뮤직 비디오 썸네일', 'Music Video Thumbnails')]: submission.files?.musicVideoThumbnails?.length || 0,
        [t('추가 파일 수', 'Additional Files Count')]: submission.files?.additionalFiles?.length || 0,
        [t('추가 파일', 'Additional Files')]: submission.files?.additionalFiles?.map((f: any, i: number) =>
          `${i + 1}. ${f.fileType || 'Unknown'}: ${f.fileName || ''}`
        ).join('\n') || ''
      }
    });

    // Review Status & Admin Info
    sections.push({
      id: 'review',
      title: t('검토 상태', 'Review Status'),
      icon: <CheckCircle className="w-5 h-5" />,
      data: {
        [t('상태', 'Status')]: submission.status || 'PENDING',
        [t('제출자', 'Submitter')]: submission.submitterName || '',
        [t('제출자 이메일', 'Submitter Email')]: submission.submitterEmail || '',
        [t('제출일', 'Submitted At')]: submission.createdAt || '',
        [t('수정일', 'Updated At')]: submission.updatedAt || '',
        [t('검토자', 'Reviewed By')]: submission.reviewedBy || '',
        [t('검토일', 'Reviewed At')]: submission.reviewedAt || '',
        [t('관리자 노트', 'Admin Notes')]: submission.adminNotes || ''
      }
    });

    // Marketing Fields (31 fields) - Check both release and marketing JSON field
    const marketingData = submission.marketing || {};
    const releaseData = submission.release || {};

    sections.push({
      id: 'marketing',
      title: t('마케팅 정보', 'Marketing Information'),
      icon: <Info className="w-5 h-5" />,
      data: {
        // Basic Album Info
        [t('앨범 소개', 'Album Introduction')]: marketingData.albumIntroduction || releaseData.albumIntroduction || '',
        [t('앨범 설명', 'Album Description')]: marketingData.albumDescription || releaseData.albumDescription || submission.albumDescription || '',
        [t('마케팅 키워드', 'Marketing Keywords')]: marketingData.marketingKeywords || releaseData.marketingKeywords || '',
        [t('타겟 대상', 'Target Audience')]: marketingData.targetAudience || releaseData.targetAudience || '',
        [t('프로모션 계획', 'Promotion Plans')]: marketingData.promotionPlans || releaseData.promotionPlans || '',

        // Artist Profile
        [t('아티스트 이름', 'Artist Name')]: marketingData.artistName || releaseData.artistName || submission.artistName || '',
        [t('아티스트 성별', 'Artist Gender')]: marketingData.artistGender || releaseData.artistGender || '',
        [t('아티스트 국가', 'Artist Country')]: marketingData.artistCountry || releaseData.artistCountry || '',
        [t('현재 거주 도시', 'Artist Current City')]: marketingData.artistCurrentCity || releaseData.artistCurrentCity || '',
        [t('고향', 'Artist Hometown')]: marketingData.artistHometown || releaseData.artistHometown || '',
        [t('아티스트 바이오', 'Artist Bio')]: marketingData.artistBio || releaseData.artistBio || submission.biography || '',

        // Social & Platform
        [t('Toundates URL', 'Toundates URL')]: marketingData.toundatesUrl || releaseData.toundatesUrl || '',
        [t('Spotify 아티스트 ID', 'Spotify Artist ID')]: marketingData.spotifyArtistId || releaseData.spotifyArtistId || submission.spotifyId || '',
        [t('Apple Music 아티스트 ID', 'Apple Music Artist ID')]: marketingData.appleMusicArtistId || releaseData.appleMusicArtistId || submission.appleMusicId || '',
        [t('SoundCloud 아티스트 ID', 'SoundCloud Artist ID')]: marketingData.soundcloudArtistId || releaseData.soundcloudArtistId || '',

        // Social Media URLs
        [t('YouTube URL', 'YouTube URL')]: marketingData.youtubeUrl || releaseData.youtubeUrl || '',
        [t('TikTok URL', 'TikTok URL')]: marketingData.tiktokUrl || releaseData.tiktokUrl || '',
        [t('Facebook URL', 'Facebook URL')]: marketingData.facebookUrl || releaseData.facebookUrl || '',
        [t('Instagram URL', 'Instagram URL')]: marketingData.instagramUrl || releaseData.instagramUrl || '',
        [t('X (Twitter) URL', 'X URL')]: marketingData.xUrl || releaseData.xUrl || '',
        [t('Twitch URL', 'Twitch URL')]: marketingData.twitchUrl || releaseData.twitchUrl || '',
        [t('Threads URL', 'Threads URL')]: marketingData.threadsUrl || releaseData.threadsUrl || '',

        // Marketing Details
        [t('사회 운동', 'Social Movements')]: marketingData.socialMovements || releaseData.socialMovements || '',
        [t('유사 아티스트', 'Similar Artists')]: marketingData.similarArtists || releaseData.similarArtists || '',
        [t('싱크 이력 여부', 'Has Sync History')]: marketingData.hasSyncHistory || releaseData.hasSyncHistory || false,
        [t('싱크 이력', 'Sync History')]: marketingData.syncHistory || releaseData.syncHistory || '',
        [t('아티스트 UGC 우선순위', 'Artist UGC Priorities')]: marketingData.artistUgcPriorities || releaseData.artistUgcPriorities || '',

        // Music Characteristics
        [t('무드', 'Moods')]: (marketingData.moods || releaseData.moods || []).join?.(', ') || '',
        [t('악기', 'Instruments')]: (marketingData.instruments || releaseData.instruments || []).join?.(', ') || '',
        [t('훅', 'Hook')]: marketingData.hook || releaseData.hook || '',
        [t('메인 피치', 'Main Pitch')]: marketingData.mainPitch || releaseData.mainPitch || '',

        // Marketing Strategy
        [t('마케팅 동력', 'Marketing Drivers')]: marketingData.marketingDrivers || releaseData.marketingDrivers || '',
        [t('소셜 미디어 계획', 'Social Media Plan')]: marketingData.socialMediaPlan || releaseData.socialMediaPlan || '',

        // Visual Assets
        [t('아티스트 아바타', 'Artist Avatar')]: marketingData.artistAvatar || releaseData.artistAvatar || '',
        [t('아티스트 로고', 'Artist Logo')]: marketingData.artistLogo || releaseData.artistLogo || '',
        [t('프레스 샷 URL', 'Press Shot URL')]: marketingData.pressShotUrl || releaseData.pressShotUrl || '',
        [t('프레스 샷 크레딧', 'Press Shot Credits')]: marketingData.pressShotCredits || releaseData.pressShotCredits || '',

        // Project & Campaign Info
        [t('우선순위 레벨', 'Priority Level')]: marketingData.priorityLevel || '',
        [t('프로젝트 유형', 'Project Type')]: marketingData.projectType || '',
        [t('캠페인 목표', 'Campaign Goals')]: marketingData.campaignGoals ? JSON.stringify(marketingData.campaignGoals, null, 2) : '',

        // Internal Notes
        [t('PR 라인', 'PR Line')]: marketingData.pr_line || '',
        [t('내부 노트', 'Internal Note')]: marketingData.internal_note || ''
      }
    });

    return sections;
  };

  const renderFileSection = () => {
    const { files } = submission;

    return (
      <div className="space-y-4">
        {/* Cover Art */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('커버 아트', 'Cover Art')}:
            </span>
            {files?.coverImageUrl && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewImage(getDirectUrl(files.coverImageUrl))}
                  className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  {t('미리보기', 'Preview')}
                </button>
                <a
                  href={files.coverImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t('다운로드', 'Download')}
                </a>
              </div>
            )}
          </div>
          {previewImage === getDirectUrl(files?.coverImageUrl) && files?.coverImageUrl && (
            <div className="mt-2">
              <img
                src={getDirectUrl(files.coverImageUrl)}
                alt="Cover Art"
                className="max-w-xs rounded-lg shadow-lg"
                onError={() => {
                  setPreviewImage(null);
                  toast.error(t('이미지를 불러올 수 없습니다', 'Cannot load image'));
                }}
              />
            </div>
          )}
        </div>

        {/* Artist Photo */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('아티스트 사진', 'Artist Photo')}:
            </span>
            {files?.artistPhotoUrl && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewImage(getDirectUrl(files.artistPhotoUrl))}
                  className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  {t('미리보기', 'Preview')}
                </button>
                <a
                  href={files.artistPhotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t('다운로드', 'Download')}
                </a>
              </div>
            )}
          </div>
          {previewImage === getDirectUrl(files?.artistPhotoUrl) && files?.artistPhotoUrl && (
            <div className="mt-2">
              <img
                src={getDirectUrl(files.artistPhotoUrl)}
                alt="Artist Photo"
                className="max-w-xs rounded-lg shadow-lg"
                onError={() => {
                  setPreviewImage(null);
                  toast.error(t('이미지를 불러올 수 없습니다', 'Cannot load image'));
                }}
              />
            </div>
          )}
        </div>

        {/* Audio Files */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">
            {t('오디오 파일', 'Audio Files')}:
          </span>
          {files?.audioFiles?.length > 0 ? (
            <div className="space-y-2">
              {files.audioFiles.map((file: any, index: number) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {submission.tracks?.[index]?.title || `Track ${index + 1}`}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPlayingAudio(playingAudio === file.dropboxUrl ? null : file.dropboxUrl)}
                        className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        {playingAudio === file.dropboxUrl ? t('정지', 'Stop') : t('재생', 'Play')}
                      </button>
                      <a
                        href={file.dropboxUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        {t('다운로드', 'Download')}
                      </a>
                    </div>
                  </div>
                  {playingAudio === file.dropboxUrl && (
                    <audio
                      controls
                      autoPlay
                      className="w-full mt-2"
                      src={getDirectUrl(file.dropboxUrl)}
                    >
                      Your browser does not support the audio element.
                    </audio>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {file.fileName} • {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-sm text-gray-500">{t('업로드된 오디오 파일이 없습니다', 'No audio files uploaded')}</span>
          )}
        </div>

        {/* Motion Art */}
        {files?.motionArtUrl && (
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('모션 아트', 'Motion Art')}:
              </span>
              <a
                href={files.motionArtUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                {t('다운로드', 'Download')}
              </a>
            </div>
          </div>
        )}

        {/* Music Video */}
        {files?.musicVideoUrl && (
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('뮤직 비디오', 'Music Video')}:
              </span>
              <a
                href={files.musicVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                {t('다운로드', 'Download')}
              </a>
            </div>
          </div>
        )}

        {/* Additional Files */}
        {files?.additionalFiles?.length > 0 && (
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">
              {t('추가 파일', 'Additional Files')}:
            </span>
            <div className="space-y-1">
              {files.additionalFiles.map((file: any, index: number) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{file.fileName}</span>
                  <a
                    href={file.dropboxUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-xs"
                  >
                    <Download className="w-3 h-3" />
                    {t('다운로드', 'Download')}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const sections = getSections();

  // Derived stats for quick stat cards
  const totalTracks = submission.tracks?.length || 0;
  const dolbyTracks = submission.tracks?.filter((tr: any) => tr.dolbyAtmos).length || 0;
  const explicitTracks = submission.tracks?.filter((tr: any) => tr.explicitContent).length || 0;
  const totalFiles =
    (submission.files?.coverImageUrl ? 1 : 0) +
    (submission.files?.artistPhotoUrl ? 1 : 0) +
    (submission.files?.audioFiles?.length || 0) +
    (submission.files?.musicVideoFiles?.length || 0) +
    (submission.files?.additionalFiles?.length || 0);

  // Track expandable rows
  const [expandedTracks, setExpandedTracks] = useState<Set<number>>(new Set());
  const toggleTrack = (idx: number) =>
    setExpandedTracks(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });

  // Show-more for info cards
  const [showMoreRelease, setShowMoreRelease] = useState(false);
  const [showMoreMarketing, setShowMoreMarketing] = useState(false);

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
      PENDING:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
      IN_REVIEW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    };
    return map[s?.toUpperCase()] || map['PENDING'];
  };
  const statusLabel = (s: string) => {
    const map: Record<string, [string, string]> = {
      APPROVED:  ['승인됨', 'Approved'],
      PENDING:   ['검토 중', 'Pending'],
      IN_REVIEW: ['검토 중', 'In Review'],
      REJECTED:  ['반려됨', 'Rejected'],
    };
    const pair = map[s?.toUpperCase()] || map['PENDING'];
    return t(pair[0], pair[1]);
  };

  const albumTypeColor = (type: string) => {
    const map: Record<string, string> = {
      SINGLE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
      EP:     'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      ALBUM:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    };
    return map[type?.toUpperCase()] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  const releaseDate = submission.releaseDate
    ? new Date(submission.releaseDate).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '-';

  const genres: string[] = Array.isArray(submission.genre)
    ? submission.genre
    : submission.genre
      ? [submission.genre]
      : [];

  // Section data map for copy buttons (keyed by id)
  const sectionMap = useMemo(() => {
    const map: Record<string, Section> = {};
    sections.forEach(s => { map[s.id] = s; });
    return map;
  }, [sections]);

  const CopyBtn = ({ sectionId }: { sectionId: string }) => {
    const sec = sectionMap[sectionId];
    const isCopied = copiedSections.has(sectionId);
    if (!sec) return null;
    return (
      <button
        onClick={() => copyToClipboard(formatSectionForCopy(sec), sectionId)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
          isCopied
            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
        )}
      >
        {isCopied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {isCopied ? t('복사됨', 'Copied') : t('복사', 'Copy')}
      </button>
    );
  };

  const InfoRow = ({ label, value }: { label: string; value?: string | null }) => {
    if (!value) return null;
    return (
      <div className="flex gap-2 py-1.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
        <span className="text-xs text-gray-500 dark:text-gray-400 w-32 shrink-0 pt-0.5">{label}</span>
        <span className="text-xs text-gray-900 dark:text-gray-100 font-medium break-all select-all">{value}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* ── Top bar: title + copy all ─────────────────────── */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('제출 상세 정보', 'Submission Details')}
        </h3>
        <button
          onClick={() => copyToClipboard(formatAllForCopy())}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          <Copy className="w-4 h-4" />
          {t('전체 복사', 'Copy All')}
        </button>
      </div>

      {/* ── Section 1: Hero ───────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex gap-6 flex-wrap sm:flex-nowrap">
          {/* Cover art */}
          <div className="shrink-0">
            {submission.files?.coverImageUrl ? (
              <div className="relative group w-48 h-48 sm:w-60 sm:h-60">
                <img
                  src={getDirectUrl(submission.files.coverImageUrl)}
                  alt={t('커버 아트', 'Cover Art')}
                  className="w-full h-full object-cover rounded-xl shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"%3E%3Crect width="240" height="240" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
                <button
                  onClick={() => setPreviewImage(getDirectUrl(submission.files.coverImageUrl))}
                  className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-xl transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                >
                  <Eye className="w-8 h-8 text-white" />
                </button>
              </div>
            ) : (
              <div className="w-48 h-48 sm:w-60 sm:h-60 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Disc3 className="w-16 h-16 text-gray-400 dark:text-gray-500" />
              </div>
            )}
          </div>

          {/* Album info */}
          <div className="flex-1 min-w-0">
            {/* Album type + genre badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {submission.albumType && (
                <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase', albumTypeColor(submission.albumType))}>
                  {submission.albumType}
                </span>
              )}
              {genres.slice(0, 3).map((g: string) => (
                <span key={g} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {g}
                </span>
              ))}
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight mb-1">
              {submission.albumTitle || submission.primaryTitle || t('제목 없음', 'No Title')}
            </h2>
            {submission.albumTitleEn && submission.albumTitleEn !== submission.albumTitle && (
              <p className="text-base text-gray-500 dark:text-gray-400 mb-1">{submission.albumTitleEn}</p>
            )}
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              {submission.artistName}
              {submission.artistNameEn && submission.artistNameEn !== submission.artistName && (
                <span className="text-sm text-gray-400 dark:text-gray-500 ml-2">({submission.artistNameEn})</span>
              )}
            </p>

            <div className="w-full border-t border-gray-200 dark:border-gray-700 mb-4" />

            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              <div>
                <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide block mb-0.5">UPC</span>
                <span className="text-sm font-mono text-gray-900 dark:text-gray-100 select-all">{submission.release?.upc || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide block mb-0.5">{t('카탈로그', 'Catalog')}</span>
                <span className="text-sm font-mono text-gray-900 dark:text-gray-100 select-all">{submission.release?.catalogNumber || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide block mb-0.5">{t('레이블', 'Label')}</span>
                <span className="text-sm text-gray-900 dark:text-gray-100">{submission.labelName || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide block mb-0.5">{t('발매일', 'Release')}</span>
                <span className="text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {releaseDate}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide block mb-0.5">{t('상태', 'Status')}</span>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium inline-block', statusColor(submission.status))}>
                  {statusLabel(submission.status)}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide block mb-0.5">{t('제출자', 'Submitter')}</span>
                <span className="text-sm text-gray-900 dark:text-gray-100 truncate block">{submission.submitterName || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Image preview lightbox */}
        {previewImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setPreviewImage(null)}
          >
            <img src={previewImage} alt="Preview" className="max-w-2xl max-h-[80vh] rounded-xl shadow-2xl" />
          </div>
        )}

        {submission.adminNotes && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">
              {t('관리자 노트', 'Admin Notes')}
            </span>
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">{submission.adminNotes}</p>
          </div>
        )}
      </div>

      {/* ── Section 2: Quick Stats ────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <Music className="w-5 h-5 text-purple-500" />,  value: totalTracks,   label: t('총 트랙', 'Total Tracks') },
          { icon: <Mic2 className="w-5 h-5 text-blue-500" />,     value: dolbyTracks,   label: 'Dolby Atmos' },
          { icon: <Shield className="w-5 h-5 text-red-500" />,    value: explicitTracks, label: t('Explicit', 'Explicit') },
          { icon: <FileAudio className="w-5 h-5 text-green-500" />, value: totalFiles,  label: t('파일', 'Files') },
        ].map(({ icon, value, label }) => (
          <div key={label} className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 flex items-center gap-3">
            {icon}
            <div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Section 3: Track List ─────────────────────────── */}
      {totalTracks > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <button onClick={() => toggleSection('tracks-summary')} className="flex items-center gap-2">
                {expandedSections.includes('tracks-summary') ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                <Music className="w-4 h-4 text-purple-500" />
                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                  {t('트랙 목록', 'Track List')} ({totalTracks})
                </span>
              </button>
            </div>
            <CopyBtn sectionId="tracks-summary" />
          </div>

          {expandedSections.includes('tracks-summary') && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-700/30">
                    <th className="px-4 py-2 w-8">#</th>
                    <th className="px-4 py-2">{t('제목', 'Title')}</th>
                    <th className="px-4 py-2">ISRC</th>
                    <th className="px-4 py-2">{t('길이', 'Duration')}</th>
                    <th className="px-4 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {submission.tracks?.map((track: any, idx: number) => {
                    const isOpen = expandedTracks.has(idx);
                    const audioFile = submission.files?.audioFiles?.find((af: any) => af.trackId === track.id || af.trackId === track._id);
                    return (
                      <React.Fragment key={idx}>
                        <tr
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                          onClick={() => toggleTrack(idx)}
                        >
                          <td className="px-4 py-2.5 text-sm text-gray-400 dark:text-gray-500 font-mono">
                            {track.trackNumber || idx + 1}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {track.titleKo || track.title || t('제목 없음', 'Untitled')}
                              </span>
                              {track.titleEn && track.titleEn !== track.titleKo && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">{track.titleEn}</span>
                              )}
                              {track.explicitContent && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">E</span>
                              )}
                              {track.dolbyAtmos && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">Atmos</span>
                              )}
                              {track.isTitle && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">{t('타이틀', 'Title')}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-xs font-mono text-gray-500 dark:text-gray-400 select-all">
                            {track.isrc || '-'}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">
                            {track.duration || '-'}
                          </td>
                          <td className="px-4 py-2.5">
                            {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className="bg-gray-50/80 dark:bg-gray-700/20">
                            <td colSpan={5} className="px-4 py-3">
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-1.5 text-xs">
                                {track.composer && <span className="text-gray-500 dark:text-gray-400">{t('작곡', 'Composer')}: <span className="text-gray-800 dark:text-gray-200 font-medium">{track.composer}</span></span>}
                                {track.lyricist && <span className="text-gray-500 dark:text-gray-400">{t('작사', 'Lyricist')}: <span className="text-gray-800 dark:text-gray-200 font-medium">{track.lyricist}</span></span>}
                                {track.arranger && <span className="text-gray-500 dark:text-gray-400">{t('편곡', 'Arranger')}: <span className="text-gray-800 dark:text-gray-200 font-medium">{track.arranger}</span></span>}
                                {track.producer && <span className="text-gray-500 dark:text-gray-400">{t('프로듀서', 'Producer')}: <span className="text-gray-800 dark:text-gray-200 font-medium">{track.producer}</span></span>}
                                {track.lyricsLanguage && <span className="text-gray-500 dark:text-gray-400">{t('가사 언어', 'Lyrics Lang')}: <span className="text-gray-800 dark:text-gray-200 font-medium">{track.lyricsLanguage}</span></span>}
                                {track.language && <span className="text-gray-500 dark:text-gray-400">{t('언어', 'Language')}: <span className="text-gray-800 dark:text-gray-200 font-medium">{track.language}</span></span>}
                                {track.genre && <span className="text-gray-500 dark:text-gray-400">{t('장르', 'Genre')}: <span className="text-gray-800 dark:text-gray-200 font-medium">{track.genre}</span></span>}
                                {track.previewStart && <span className="text-gray-500 dark:text-gray-400">{t('미리듣기 시작', 'Preview Start')}: <span className="text-gray-800 dark:text-gray-200 font-medium">{track.previewStart}</span></span>}
                                {track.versionType && track.versionType !== 'ORIGINAL' && <span className="text-gray-500 dark:text-gray-400">{t('버전', 'Version')}: <span className="text-gray-800 dark:text-gray-200 font-medium">{track.versionType}</span></span>}
                              </div>
                              {/* Contributors */}
                              {track.contributors?.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('기여자', 'Contributors')}</span>
                                  <div className="mt-1 flex flex-wrap gap-1.5">
                                    {track.contributors.map((c: any, ci: number) => (
                                      <span key={ci} className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded px-1.5 py-0.5">
                                        {c.name}{c.role ? ` · ${c.role}` : ''}{c.instrument ? ` · ${c.instrument}` : ''}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {/* Audio player */}
                              {audioFile?.dropboxUrl && (
                                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                  {playingAudio === audioFile.dropboxUrl ? (
                                    <div>
                                      <audio controls autoPlay className="w-full h-8" src={getDirectUrl(audioFile.dropboxUrl)} />
                                      <button onClick={() => setPlayingAudio(null)} className="mt-1 text-xs text-red-500 hover:text-red-700">{t('정지', 'Stop')}</button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setPlayingAudio(audioFile.dropboxUrl)}
                                      className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium"
                                    >
                                      <Play className="w-3.5 h-3.5" /> {t('오디오 재생', 'Play Audio')}
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Section 4: Info Cards Grid ────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Release Info card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span className="font-semibold text-gray-900 dark:text-white text-sm">{t('릴리스 정보', 'Release Info')}</span>
            </div>
            <CopyBtn sectionId="distribution" />
          </div>
          <div className="px-4 py-3">
            <InfoRow label={t('발매일', 'Release Date')} value={releaseDate} />
            <InfoRow label={t('저작권 (©)', 'Copyright (©)')} value={submission.release?.cRights || (submission.release?.copyrightYear ? `© ${submission.release.copyrightYear} ${submission.release.copyrightHolder || ''}` : undefined)} />
            <InfoRow label={t('저작권 (℗)', 'Copyright (℗)')} value={submission.release?.pRights || (submission.release?.productionYear ? `℗ ${submission.release.productionYear} ${submission.release.productionHolder || ''}` : undefined)} />
            <InfoRow label={t('배급 지역', 'Territories')} value={
              submission.release?.territoryType === 'WORLDWIDE'
                ? t('전 세계', 'WORLDWIDE')
                : Array.isArray(submission.release?.territories)
                  ? submission.release.territories.slice(0, 5).join(', ') + (submission.release.territories.length > 5 ? ` +${submission.release.territories.length - 5}` : '')
                  : undefined
            } />
            <InfoRow label={t('릴리스 포맷', 'Format')} value={submission.release?.releaseFormat} />
            {showMoreRelease && (
              <>
                <InfoRow label={t('녹음 국가', 'Recording Country')} value={submission.release?.recordingCountry} />
                <InfoRow label={t('녹음 언어', 'Recording Language')} value={submission.release?.recordingLanguage} />
                <InfoRow label={t('가격 유형', 'Price Type')} value={submission.release?.priceType} />
                <InfoRow label={t('원본 릴리스일', 'Original Release')} value={submission.release?.originalReleaseDate} />
              </>
            )}
            <button
              onClick={() => setShowMoreRelease(v => !v)}
              className="mt-2 text-xs text-purple-600 dark:text-purple-400 hover:underline"
            >
              {showMoreRelease ? t('접기', 'Show less') : t('더보기', 'Show more')}
            </button>
          </div>
        </div>

        {/* Artist Info card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-pink-500" />
              <span className="font-semibold text-gray-900 dark:text-white text-sm">{t('아티스트 정보', 'Artist Info')}</span>
            </div>
            <CopyBtn sectionId="artist" />
          </div>
          <div className="px-4 py-3">
            <InfoRow label={t('아티스트', 'Artist')} value={submission.artistName} />
            <InfoRow label={t('영문명', 'English Name')} value={submission.artistNameEn} />
            <InfoRow label={t('유형', 'Type')} value={submission.artistType} />
            <InfoRow label="Spotify" value={submission.spotifyId} />
            <InfoRow label="Apple Music" value={submission.appleMusicId} />
            {(() => {
              const socialLinks = submission.socialLinks || {};
              const instagram = socialLinks.instagram || (submission.marketing || {}).instagramUrl || (submission.release || {}).instagramUrl;
              return <InfoRow label="Instagram" value={instagram} />;
            })()}
          </div>
        </div>

        {/* Files card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <FileAudio className="w-4 h-4 text-green-500" />
              <span className="font-semibold text-gray-900 dark:text-white text-sm">{t('파일', 'Files')}</span>
            </div>
            <CopyBtn sectionId="files" />
          </div>
          <div className="px-4 py-3 space-y-2">
            {/* Cover art status */}
            <div className="flex items-center gap-2">
              {submission.files?.coverImageUrl
                ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
              <span className="text-xs text-gray-700 dark:text-gray-300">
                {t('커버 아트', 'Cover Art')}
                {submission.files?.coverImageUrl && (
                  <button
                    onClick={() => setPreviewImage(getDirectUrl(submission.files.coverImageUrl))}
                    className="ml-2 text-purple-600 dark:text-purple-400 hover:underline"
                  >{t('미리보기', 'Preview')}</button>
                )}
              </span>
            </div>
            {/* Audio files */}
            <div className="flex items-center gap-2">
              {(submission.files?.audioFiles?.length || 0) === totalTracks && totalTracks > 0
                ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                : <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />}
              <span className="text-xs text-gray-700 dark:text-gray-300">
                {t('오디오 파일', 'Audio Files')}: {submission.files?.audioFiles?.length || 0} / {totalTracks}
              </span>
            </div>
            {/* Music video */}
            <div className="flex items-center gap-2">
              {submission.files?.musicVideoUrl || (submission.files?.musicVideoFiles?.length || 0) > 0
                ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                : <Info className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />}
              <span className="text-xs text-gray-700 dark:text-gray-300">
                {t('뮤직 비디오', 'Music Video')}: {(submission.files?.musicVideoFiles?.length || 0) > 0 ? (submission.files?.musicVideoFiles?.length) : (submission.files?.musicVideoUrl ? 1 : 0)}
              </span>
            </div>
            {/* Dropbox link */}
            {submission.files?.coverImageUrl && (
              <a
                href={submission.files.coverImageUrl.split('/n3rve-submissions/')[0] + '/n3rve-submissions/'}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Download className="w-3.5 h-3.5" />
                {t('Dropbox에서 보기', 'View in Dropbox')}
              </a>
            )}
            {/* Full file viewer button */}
            <button
              onClick={() => toggleSection('files')}
              className="mt-1 text-xs text-purple-600 dark:text-purple-400 hover:underline"
            >
              {expandedSections.includes('files') ? t('파일 숨기기', 'Hide files') : t('모든 파일 보기', 'View all files')}
            </button>
            {expandedSections.includes('files') && (
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                {renderFileSection()}
              </div>
            )}
          </div>
        </div>

        {/* Marketing card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-gray-900 dark:text-white text-sm">{t('마케팅', 'Marketing')}</span>
            </div>
            <CopyBtn sectionId="marketing" />
          </div>
          <div className="px-4 py-3">
            {(() => {
              const md = submission.marketing || {};
              const rd = submission.release || {};
              return (
                <>
                  <InfoRow label={t('앨범 소개', 'Description')} value={(md.albumIntroduction || rd.albumIntroduction || md.albumDescription || submission.albumDescription || '').slice(0, 120) || undefined} />
                  <InfoRow label={t('키워드', 'Keywords')} value={md.marketingKeywords || rd.marketingKeywords} />
                  <InfoRow label={t('타겟 대상', 'Target')} value={md.targetAudience || rd.targetAudience} />
                  <InfoRow label={t('무드', 'Mood')} value={(md.moods || rd.moods || []).join?.(', ') || undefined} />
                  <InfoRow label={t('악기', 'Instruments')} value={(md.instruments || rd.instruments || []).join?.(', ') || undefined} />
                  {showMoreMarketing && (
                    <>
                      <InfoRow label={t('유사 아티스트', 'Similar Artists')} value={md.similarArtists || rd.similarArtists} />
                      <InfoRow label={t('훅', 'Hook')} value={md.hook || rd.hook} />
                      <InfoRow label={t('메인 피치', 'Main Pitch')} value={md.mainPitch || rd.mainPitch} />
                      <InfoRow label={t('프로모션 계획', 'Promo Plans')} value={md.promotionPlans || rd.promotionPlans} />
                    </>
                  )}
                  <button
                    onClick={() => setShowMoreMarketing(v => !v)}
                    className="mt-2 text-xs text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    {showMoreMarketing ? t('접기', 'Show less') : t('더보기', 'Show more')}
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── Section 5: Remaining collapsible sections ─────── */}
      {(['product', 'artist', 'distribution', 'review', 'marketing'] as const).map((id) => {
        const section = sectionMap[id];
        if (!section) return null;
        const isExpanded = expandedSections.includes(id);
        const isCopied = copiedSections.has(id);
        return (
          <div key={id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <button onClick={() => toggleSection(id)} className="flex items-center gap-2 flex-1 text-left">
                {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                <span className="text-gray-500 dark:text-gray-400">{section.icon}</span>
                <span className="font-semibold text-gray-900 dark:text-white text-sm">{section.title}</span>
              </button>
              <button
                onClick={() => copyToClipboard(formatSectionForCopy(section), id)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                  isCopied
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                )}
              >
                {isCopied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? t('복사됨', 'Copied') : t('섹션 복사', 'Copy Section')}
              </button>
            </div>
            {isExpanded && (
              <div className="p-4">
                <dl className="grid grid-cols-1 gap-2">
                  {Object.entries(section.data).map(([key, value]) => {
                    if (value === null || value === undefined || value === '') return null;
                    return (
                      <div key={key} className="grid grid-cols-1 sm:grid-cols-2 gap-1 py-1.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{key}</dt>
                        <dd className="text-xs text-gray-900 dark:text-gray-100 font-mono select-all whitespace-pre-wrap break-all">{formatValue(value)}</dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            )}
          </div>
        );
      })}

      {/* Individual track sections (collapsed by default) */}
      {submission.tracks?.map((_: any, index: number) => {
        const section = sectionMap[`track-${index}`];
        if (!section) return null;
        const isExpanded = expandedSections.includes(`track-${index}`);
        const isCopied = copiedSections.has(`track-${index}`);
        return (
          <div key={`track-section-${index}`} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <button onClick={() => toggleSection(`track-${index}`)} className="flex items-center gap-2 flex-1 text-left">
                {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                <Music className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-gray-900 dark:text-white text-sm">{section.title}</span>
              </button>
              <button
                onClick={() => copyToClipboard(formatSectionForCopy(section), `track-${index}`)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                  isCopied
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                )}
              >
                {isCopied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? t('복사됨', 'Copied') : t('섹션 복사', 'Copy Section')}
              </button>
            </div>
            {isExpanded && (
              <div className="p-4">
                <dl className="grid grid-cols-1 gap-2">
                  {Object.entries(section.data).map(([key, value]) => {
                    if (value === null || value === undefined || value === '') return null;
                    return (
                      <div key={key} className="grid grid-cols-1 sm:grid-cols-2 gap-1 py-1.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{key}</dt>
                        <dd className="text-xs text-gray-900 dark:text-gray-100 font-mono select-all whitespace-pre-wrap break-all">{formatValue(value)}</dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            )}
          </div>
        );
      })}

      {/* ── Validation Status ─────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-sm">
          <Package className="w-4 h-4 text-gray-500" />
          {t('제출 검증 상태', 'Submission Validation')}
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
            <span className="text-xs text-gray-700 dark:text-gray-300">{t('모든 필수 메타데이터 필드 입력됨', 'All required metadata fields completed')}</span>
          </div>
          <div className="flex items-center gap-2">
            {submission.files?.coverImageUrl
              ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
            <span className="text-xs text-gray-700 dark:text-gray-300">{t('커버 아트 업로드됨', 'Cover art uploaded')}</span>
          </div>
          <div className="flex items-center gap-2">
            {(submission.files?.audioFiles?.length || 0) === totalTracks && totalTracks > 0
              ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              : <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />}
            <span className="text-xs text-gray-700 dark:text-gray-300">
              {t('오디오 파일', 'Audio Files')}: {submission.files?.audioFiles?.length || 0} / {totalTracks} {t('트랙', 'Tracks')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {dolbyTracks > 0
              ? <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
              : <Info className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />}
            <span className="text-xs text-gray-700 dark:text-gray-300">
              Dolby Atmos: {dolbyTracks > 0 ? `${dolbyTracks} ${t('트랙', 'tracks')}` : t('미지원', 'Not Supported')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetailView;
