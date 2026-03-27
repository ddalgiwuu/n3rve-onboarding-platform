import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Music, Clock, User, ChevronDown, ChevronRight,
  FileText, ExternalLink, Mic2, Film, Tag, Shield,
} from 'lucide-react';
import catalogApi from '../lib/catalog-api';
import { formatDuration } from '../utils/format';
import type { CatalogContributor } from '../types/catalog';

/* ─── Field Components ─── */

function Field({ label, value, mono }: { label: string; value?: any; mono?: boolean }) {
  const display =
    value === null || value === undefined || value === ''
      ? null
      : typeof value === 'boolean'
      ? value ? 'Yes' : 'No'
      : String(value);
  return (
    <div className="pb-4 border-b border-zinc-800">
      <p className="text-[11px] uppercase tracking-wider font-medium text-zinc-500 mb-1">
        {label}
      </p>
      <p
        className={`text-[15px] font-semibold ${
          display ? 'text-zinc-100' : 'text-zinc-700 italic'
        } ${mono ? 'font-mono' : ''}`}
      >
        {display || '미입력'}
      </p>
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-5">
      {children}
    </div>
  );
}

/* ─── Section Wrapper ─── */

function Section({
  title,
  icon: Icon,
  accent,
  iconColor,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: any;
  accent?: string;
  iconColor?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-zinc-700/60 bg-zinc-800/80 overflow-hidden shadow-sm">
      <button
        className="flex w-full items-center justify-between px-5 py-4 border-b border-zinc-700/60 hover:bg-zinc-700/30 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              accent || 'bg-zinc-700'
            }`}
          >
            <Icon className={`h-4 w-4 ${iconColor || 'text-zinc-400'}`} />
          </span>
          <h2 className="font-bold text-white text-base">{title}</h2>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-zinc-400" />
        )}
      </button>
      {open && <div className="p-7">{children}</div>}
    </div>
  );
}

/* ─── DSP Link ─── */

function DspLink({ url, type }: { url?: string | null; type: 'spotify' | 'apple' }) {
  if (!url) return null;
  const label = type === 'spotify' ? 'Spotify' : 'Apple Music';
  const color =
    type === 'spotify'
      ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50'
      : 'bg-pink-900/20 text-pink-400 hover:bg-pink-900/30';
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${color}`}
    >
      {label} <ExternalLink className="h-2.5 w-2.5" />
    </a>
  );
}

/* ─── Artist Card ─── */

function ArtistCard({
  name,
  role,
  fugaId,
  spotifyUrl,
  appleMusicUrl,
}: {
  name: string;
  role: 'Primary' | 'Featuring' | string;
  fugaId?: string | number | null;
  spotifyUrl?: string | null;
  appleMusicUrl?: string | null;
}) {
  const roleColor =
    role === 'Primary'
      ? 'bg-blue-900/40 text-blue-300 border-blue-700/50'
      : role === 'Featuring'
      ? 'bg-violet-900/40 text-violet-300 border-violet-700/50'
      : 'bg-zinc-700/60 text-zinc-300 border-zinc-600/50';

  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-700/50 bg-zinc-900/60 px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-700">
        <User className="h-4 w-4 text-zinc-400" />
      </div>
      <div className="min-w-0 flex-1">
        {fugaId ? (
          <Link
            to={`/admin/catalog/artists/${fugaId}`}
            className="text-sm font-semibold text-blue-400 hover:text-blue-300 hover:underline block truncate"
          >
            {name}
          </Link>
        ) : (
          <Link
            to={`/admin/catalog/artists?search=${encodeURIComponent(name)}`}
            className="text-sm font-semibold text-zinc-100 hover:text-blue-400 hover:underline block truncate"
          >
            {name}
          </Link>
        )}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${roleColor}`}>
            {role}
          </span>
          <DspLink url={spotifyUrl} type="spotify" />
          <DspLink url={appleMusicUrl} type="apple" />
        </div>
      </div>
    </div>
  );
}

/* ─── Contributor Group ─── */

function ContributorGroup({
  role,
  people,
}: {
  role: string;
  people: CatalogContributor[];
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 mb-2">
        {role}
      </p>
      <div className="flex flex-wrap gap-2">
        {people.map((c: any) => (
          <div
            key={c.personId ?? c.name}
            className="flex items-center gap-2 rounded-lg bg-zinc-900/60 border border-zinc-700/50 px-3 py-1.5"
          >
            {c.personId ? (
              <Link
                to={`/admin/catalog/artists/${c.personId}`}
                className="text-sm font-medium text-blue-400 hover:underline"
              >
                {c.name}
              </Link>
            ) : (
              <span className="text-sm font-medium text-zinc-200">{c.name}</span>
            )}
            <DspLink url={c.spotifyUrl} type="spotify" />
            <DspLink url={c.appleMusicUrl} type="apple" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function CatalogTrackDetail() {
  const { id, trackIndex } = useParams<{ id: string; trackIndex: string }>();
  const navigate = useNavigate();
  const [showLyrics, setShowLyrics] = useState(false);

  const idx = parseInt(trackIndex ?? '0', 10);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['catalog-unified', id],
    queryFn: async () => {
      const res = await catalogApi.getUnifiedProduct(id!, 'catalog');
      return res.data;
    },
    enabled: !!id,
  });

  const product = data?.product ?? data;
  const assets: any[] = product?.assets ?? [];
  const asset = assets[idx];
  const totalTracks = assets.length;

  /* ─── Loading ─── */

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-zinc-700 border-t-zinc-300 animate-spin" />
          <p className="text-sm text-zinc-400">트랙 정보를 불러오는 중…</p>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-zinc-400">데이터를 불러오지 못했습니다.</p>
          <button
            onClick={() => navigate(`/admin/catalog/${id}`)}
            className="text-sm text-blue-400 hover:underline"
          >
            앨범으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-zinc-400">트랙을 찾을 수 없습니다. (index: {idx})</p>
          <button
            onClick={() => navigate(`/admin/catalog/${id}`)}
            className="text-sm text-blue-400 hover:underline"
          >
            앨범으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  /* ─── Derived Values ─── */

  const rawTitle = asset.titleKo || asset.name || 'Untitled';
  const trackVersion = asset.version || asset.assetVersion;

  const groupedContributors: Record<string, CatalogContributor[]> = {};
  for (const c of asset.contributors ?? []) {
    if (!groupedContributors[c.role]) groupedContributors[c.role] = [];
    if (!groupedContributors[c.role].find((x: any) => x.personId === c.personId)) {
      groupedContributors[c.role].push(c);
    }
  }

  const hasArtists =
    (asset.artists?.length ?? 0) > 0 ||
    (asset.featuringArtists?.length ?? 0) > 0;
  const hasContributors = Object.keys(groupedContributors).length > 0;
  const hasLegacyCredits =
    asset.composer || asset.lyricist || asset.arranger ||
    asset.producer || asset.mixer || asset.masterer;

  /* ─── Render ─── */

  return (
    <div className="min-h-screen bg-zinc-950">

      {/* ── Dark Hero Header ── */}
      <div className="bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-800 border-b border-zinc-700/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-6 pb-8">

          {/* Back button */}
          <button
            onClick={() => navigate(`/admin/catalog/${id}`)}
            className="mb-6 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            앨범으로 돌아가기
          </button>

          <div className="flex items-start gap-5">
            {/* Track number circle */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-500 shadow-lg shadow-blue-900/30">
              <span className="text-2xl font-bold text-white">{idx + 1}</span>
            </div>

            {/* Title / Artist */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-2 mb-1">
                <h1 className="text-3xl font-bold text-white leading-tight truncate">
                  {rawTitle}
                </h1>
                {trackVersion && (
                  <span className="text-lg text-zinc-400 font-normal">
                    ({trackVersion})
                  </span>
                )}
              </div>
              {asset.displayArtist && (
                <p className="text-xl text-zinc-300 mt-0.5">{asset.displayArtist}</p>
              )}

              {/* Badges row */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {asset.isrc && (
                  <span className="inline-flex items-center rounded-full bg-blue-900/40 border border-blue-700/50 px-3 py-0.5 text-xs font-mono font-medium text-blue-300">
                    {asset.isrc}
                  </span>
                )}
                {asset.duration != null && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-700/60 border border-zinc-600/50 px-3 py-0.5 text-xs font-medium text-zinc-300">
                    <Clock className="h-3 w-3" />
                    {formatDuration(asset.duration)}
                  </span>
                )}
                {asset.isTitleTrack && (
                  <span className="inline-flex items-center rounded-full bg-violet-900/40 border border-violet-700/50 px-3 py-0.5 text-xs font-medium text-violet-300">
                    Title Track
                  </span>
                )}
                {asset.isFocusTrack && (
                  <span className="inline-flex items-center rounded-full bg-amber-900/40 border border-amber-700/50 px-3 py-0.5 text-xs font-medium text-amber-300">
                    Focus Track
                  </span>
                )}
                <span className="inline-flex items-center rounded-full bg-zinc-700/60 border border-zinc-600/50 px-3 py-0.5 text-xs font-medium text-zinc-400">
                  Track {idx + 1} of {totalTracks}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sections ── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-8">

        {/* 1. 기본 정보 */}
        <Section
          title="기본 정보"
          icon={Music}
          accent="bg-violet-900/40"
          iconColor="text-violet-400"
        >
          <FieldGrid>
            <Field label="Title (Ko)" value={asset.titleKo || asset.name} />
            <Field label="Title (En)" value={asset.titleEn} />
            <Field label="Title Language" value={asset.titleLanguage} />
            <Field label="Title Translations" value={asset.titleTranslations} />
            <Field label="Track Number" value={asset.sequence} />
            <Field label="Disc Number" value={asset.discNumber} />
            <Field label="Volume" value={asset.volume} />
            <Field label="ISRC" value={asset.isrc} mono />
            <Field label="ISWC" value={asset.iswc} mono />
            <Field
              label="Duration"
              value={asset.duration ? formatDuration(asset.duration) : undefined}
            />
            <Field label="Track Type" value={asset.trackType} />
            <Field
              label="Version Type"
              value={asset.versionTypes?.map((v: any) => v.name).join(', ')}
            />
            <Field label="Track Version" value={asset.version || asset.assetVersion} />
            <Field label="Is Title Track" value={asset.isTitleTrack} />
            <Field label="Is Focus Track" value={asset.isFocusTrack} />
            <Field label="Display Artist" value={asset.displayArtist} />
          </FieldGrid>
        </Section>

        {/* 2. 아티스트 & 기여자 */}
        <Section
          title="아티스트 & 기여자"
          icon={User}
          accent="bg-blue-900/40"
          iconColor="text-blue-400"
        >
          {/* Track artists */}
          {asset.artists?.length > 0 && (
            <div className="mb-6">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 mb-3">
                Track Artists
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {asset.artists.map((a: any, i: number) => (
                  <ArtistCard
                    key={i}
                    name={a.name}
                    role={a.primary ? 'Primary' : 'Artist'}
                    fugaId={a.fugaId}
                    spotifyUrl={a.spotifyUrl}
                    appleMusicUrl={a.appleMusicUrl}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Featuring artists */}
          {asset.featuringArtists?.length > 0 && (
            <div className="mb-6">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 mb-3">
                Featuring Artists
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {asset.featuringArtists.map((a: any, i: number) => (
                  <ArtistCard
                    key={i}
                    name={a.name || String(a)}
                    role="Featuring"
                    fugaId={a.fugaId}
                    spotifyUrl={a.spotifyUrl}
                    appleMusicUrl={a.appleMusicUrl}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Contributors */}
          {hasContributors && (
            <div className={`${hasArtists ? 'mt-6 pt-6 border-t border-zinc-700/60' : ''} mb-5`}>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 mb-4">
                Contributors
              </p>
              <div className="space-y-5">
                {Object.entries(groupedContributors).map(([role, people]) => (
                  <ContributorGroup key={role} role={role} people={people} />
                ))}
              </div>
            </div>
          )}

          {/* Legacy credit fields */}
          {hasLegacyCredits && (
            <div className={`${(hasArtists || hasContributors) ? 'mt-6 pt-6 border-t border-zinc-700/60' : ''}`}>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 mb-4">
                Credits
              </p>
              <FieldGrid>
                <Field label="Composer" value={asset.composer} />
                <Field label="Lyricist" value={asset.lyricist} />
                <Field label="Arranger" value={asset.arranger} />
                <Field label="Producer" value={asset.producer} />
                <Field label="Mixer" value={asset.mixer} />
                <Field label="Masterer" value={asset.masterer} />
              </FieldGrid>
            </div>
          )}

          {asset.publishers && (
            <div className="mt-4">
              <Field label="Publishers" value={asset.publishers} />
            </div>
          )}
        </Section>

        {/* 3. 장르 */}
        <Section
          title="장르"
          icon={Tag}
          accent="bg-emerald-900/40"
          iconColor="text-emerald-400"
        >
          <FieldGrid>
            <Field label="Genre" value={asset.genre?.name} />
            <Field label="Subgenre" value={asset.subgenre?.name} />
            <Field label="Alternate Genre" value={asset.alternateGenre?.name} />
            <Field label="Alternate Subgenre" value={asset.alternateSubgenre?.name} />
          </FieldGrid>
        </Section>

        {/* 4. 오디오 */}
        <Section
          title="오디오"
          icon={Mic2}
          accent="bg-amber-900/40"
          iconColor="text-amber-400"
        >
          <FieldGrid>
            <Field label="Sample Rate" value={asset.audio?.sampleRate ?? asset.sampleRate} />
            <Field label="Bit Depth" value={asset.audio?.bitDepth ?? asset.bitDepth} />
            <Field label="Audio Format" value={asset.audio?.format ?? asset.audioFormat} />
            <Field label="Dolby Atmos" value={asset.dolbyAtmos} />
            <Field label="Stereo" value={asset.stereo} />
            <Field label="Audio File" value={asset.audioFileInfo?.filename} />
            <Field label="Audio Quality" value={asset.audioFileInfo?.quality} />
            <Field label="File Size" value={asset.audioFileInfo?.size} />
            <Field label="Audio Language" value={asset.audioLanguage} />
            <Field label="Metadata Language" value={asset.metadataLanguage} />
          </FieldGrid>
        </Section>

        {/* 5. 콘텐츠 & 가사 */}
        <Section
          title="콘텐츠"
          icon={FileText}
          accent="bg-sky-900/40"
          iconColor="text-sky-400"
        >
          <FieldGrid>
            <Field label="Language" value={asset.language} />
            <Field label="Audio Language" value={asset.audioLocale ?? asset.audioLanguage} />
            <Field label="Lyrics Language" value={asset.lyricsLanguage} />
            <Field label="Metadata Language" value={asset.metadataLanguage} />
            <Field label="Explicit Content" value={asset.explicitContent} />
            <Field label="Parental Advisory" value={asset.parentalAdvisory} />
          </FieldGrid>

          {/* Lyrics file URL */}
          {asset.lyricsFileUrl && (
            <div className="mt-5 pb-4 border-b border-zinc-800">
              <p className="text-[11px] uppercase tracking-wider font-medium text-zinc-500 mb-1">
                Lyrics File URL
              </p>
              <a
                href={asset.lyricsFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-400 hover:underline"
              >
                {asset.lyricsFileUrl.length > 60
                  ? asset.lyricsFileUrl.slice(0, 60) + '...'
                  : asset.lyricsFileUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Expandable lyrics */}
          {asset.hasLyrics && asset.lyrics && (
            <div className="mt-5">
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-700/60 bg-zinc-900/60 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
                onClick={() => setShowLyrics(!showLyrics)}
              >
                {showLyrics ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                <FileText className="h-3.5 w-3.5" />
                가사 {showLyrics ? '닫기' : '보기'}
              </button>
              {showLyrics && (
                <pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-zinc-900 p-6 font-mono text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {asset.lyrics}
                </pre>
              )}
            </div>
          )}
        </Section>

        {/* 6. 권리 */}
        <Section
          title="권리"
          icon={Shield}
          accent="bg-rose-900/40"
          iconColor="text-rose-400"
        >
          <FieldGrid>
            <Field label="Asset Copyright" value={asset.pLineText ?? asset.assetCopyright} />
            <Field label="Rights Claim" value={asset.rightsClaim} />
            <Field label="Rights Holder" value={asset.rightsHolderName} />
            <Field label="Rights Ownership" value={asset.rightsOwnership} />
            <Field label="Rights Ownership Name" value={asset.rightsOwnershipName} />
            <Field label="Recording Year" value={asset.recordingYear} />
            <Field label="Recording Location" value={asset.recordingLocation} />
            <Field label="Country of Recording" value={asset.countryOfRecording} />
            <Field label="Country of Commissioning" value={asset.countryOfCommissioning} />
            <Field label="Rights Contract Begin Date" value={asset.rightsContractBeginDate} />
            <Field label="Asset Release Date" value={asset.assetReleaseDate} />
            <Field label="Asset Catalog Tier" value={asset.assetCatalogTier} />
            <Field label="ISWC" value={asset.iswc} mono />
            <Field label="Courtesy Line" value={asset.courtesyLine} />
          </FieldGrid>
        </Section>

        {/* 7. 프리뷰 & 비디오 */}
        <Section
          title="프리뷰 & 비디오"
          icon={Film}
          accent="bg-indigo-900/40"
          iconColor="text-indigo-400"
        >
          <FieldGrid>
            <Field label="Preview Start" value={asset.previewStart} />
            <Field label="Preview End" value={asset.previewEnd} />
            <Field label="Preview Length" value={asset.previewLength} />
            <Field label="Playtime Start Short Clip" value={asset.playtimeStartShortClip} />
            <Field label="YouTube Short Preview" value={asset.youtubeShortPreview} />
            <Field label="Availability" value={asset.availability} />
            <Field label="Pre-order Enabled" value={asset.preorderEnabled} />
            <Field label="Pre-order Date" value={asset.preorderDate} />
            <Field label="Has Custom Release Date" value={asset.hasCustomReleaseDate} />
            <Field label="Custom Release Date" value={asset.customReleaseDate} />
            <Field label="Custom Release Time" value={asset.customReleaseTime} />
            <Field label="Asset Territories" value={asset.assetTerritories} />
            <Field label="Available Separately" value={asset.availableSeparately} />
            <Field label="Allow Preorder" value={asset.allowPreorder} />
            <Field label="Preorder Type" value={asset.preorderType} />
            <Field label="Has Music Video" value={asset.hasMusicVideo} />
            <Field label="Music Video ISRC" value={asset.musicVideoIsrc} mono />
          </FieldGrid>
        </Section>

        {/* 8. 기타 — only if data present */}
        {(asset.tags?.length > 0 || asset.extraFields) && (
          <Section
            title="기타"
            icon={FileText}
            accent="bg-zinc-700"
            iconColor="text-zinc-400"
            defaultOpen={false}
          >
            {asset.tags?.length > 0 && (
              <div className="mb-5">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 mb-3">
                  Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {asset.tags.map((tag: string, i: number) => (
                    <span
                      key={i}
                      className="rounded-full bg-zinc-700/70 px-2.5 py-0.5 text-xs text-zinc-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {asset.extraFields && (
              <FieldGrid>
                {Object.entries(asset.extraFields).map(([k, v]: [string, any]) =>
                  v ? <Field key={k} label={`Extra: ${k}`} value={v} /> : null
                )}
              </FieldGrid>
            )}
          </Section>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
