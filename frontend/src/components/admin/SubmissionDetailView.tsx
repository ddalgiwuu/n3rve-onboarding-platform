import React, { useState } from 'react';
import {
  Copy, ChevronDown, ChevronRight, Music, Album, FileText, Globe,
  Info, Users,
  CheckCircle, XCircle, AlertCircle,
  Package, Download, Eye, Play
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

  return (
    <div className="space-y-6">
      {/* Header with Copy All Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('제출 상세 정보', 'Submission Details')}
        </h3>
        <button
          onClick={() => copyToClipboard(formatAllForCopy())}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Copy className="w-4 h-4" />
          {t('전체 복사', 'Copy All')}
        </button>
      </div>

      {/* Submission Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('제출 상태', 'Submission Status')}:
            </span>
            <span className={cn(
              'px-3 py-1 rounded-full text-sm font-medium',
              submission.status === 'approved' && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
              submission.status === 'pending' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
              submission.status === 'rejected' && 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
            )}>
              {submission.status === 'approved' && t('승인됨', 'Approved')}
              {submission.status === 'pending' && t('검토 중', 'Under Review')}
              {submission.status === 'rejected' && t('거절됨', 'Rejected')}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {t('제출일', 'Submission Date')}: {new Date(submission.createdAt).toLocaleDateString()}
          </div>
        </div>
        {submission.adminNotes && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('관리자 노트', 'Admin Notes')}:
            </span>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{submission.adminNotes}</p>
          </div>
        )}
      </div>

      {/* Sections */}
      {sections.map((section) => {
        const isExpanded = expandedSections.includes(section.id);
        const isCopied = copiedSections.has(section.id);

        return (
          <div
            key={section.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Section Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50">
              <button
                onClick={() => toggleSection(section.id)}
                className="flex items-center gap-3 flex-1 text-left"
              >
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
                <div className="flex items-center gap-2">
                  {section.icon}
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {section.title}
                  </h4>
                </div>
              </button>
              <button
                onClick={() => copyToClipboard(formatSectionForCopy(section), section.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors',
                  isCopied
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                )}
              >
                {isCopied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {t('복사됨', 'Copied')}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    {t('섹션 복사', 'Copy Section')}
                  </>
                )}
              </button>
            </div>

            {/* Section Content */}
            {isExpanded && (
              <div className="p-4">
                {section.id === 'files' ? (
                  renderFileSection()
                ) : (
                  // Regular section content
                  <dl className="grid grid-cols-1 gap-3">
                    {Object.entries(section.data).map(([key, value]) => {
                      if (value === null || value === undefined || value === '') return null;

                      return (
                        <div key={key} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {key}:
                          </dt>
                          <dd className="text-sm text-gray-900 dark:text-gray-100 font-mono select-all">
                            {formatValue(value)}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Validation Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          {t('제출 검증 상태', 'Submission Validation Status')}
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm">{t('모든 필수 메타데이터 필드 입력됨', 'All required metadata fields completed')}</span>
          </div>
          <div className="flex items-center gap-2">
            {submission.files?.coverImageUrl ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm">{t('커버 아트 업로드됨', 'Cover art uploaded')}</span>
          </div>
          <div className="flex items-center gap-2">
            {submission.files?.audioFiles?.length === submission.tracks?.length ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            )}
            <span className="text-sm">
              {t('오디오 파일', 'Audio Files')}: {submission.files?.audioFiles?.length || 0} / {submission.tracks?.length || 0} {t('트랙', 'Tracks')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {submission.album?.dolbyAtmos ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Info className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm">
              Dolby Atmos: {submission.album?.dolbyAtmos ? t('지원', 'Supported') : t('미지원', 'Not Supported')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetailView;
