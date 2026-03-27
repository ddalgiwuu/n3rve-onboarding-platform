import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Music, Clock, User, ChevronDown, ChevronRight,
  FileText, ExternalLink, Mic2, Film,
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
    <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
      <p className="text-[11px] uppercase tracking-wider font-medium text-zinc-400 dark:text-zinc-500 mb-1">
        {label}
      </p>
      <p
        className={`text-[15px] font-semibold ${
          display
            ? 'text-zinc-900 dark:text-zinc-100'
            : 'text-zinc-300 dark:text-zinc-700 italic'
        } ${mono ? 'font-mono' : ''}`}
      >
        {display || '미입력'}
      </p>
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-0 sm:grid-cols-3 lg:grid-cols-4">
      {children}
    </div>
  );
}

/* ─── Section Wrapper ─── */

function Section({
  title,
  icon: Icon,
  accent,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: any;
  accent?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700/60 dark:bg-zinc-800/80 overflow-hidden shadow-sm">
      <button
        className="flex w-full items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-700/60 hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
              accent || 'bg-zinc-100 dark:bg-zinc-700'
            }`}
          >
            <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          </span>
          <h2 className="font-semibold text-zinc-900 dark:text-white text-sm">{title}</h2>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-zinc-400" />
        )}
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

/* ─── DSP Link ─── */

function DspLink({ url, type }: { url?: string | null; type: 'spotify' | 'apple' }) {
  if (!url) return null;
  const label = type === 'spotify' ? 'Spotify' : 'Apple Music';
  const color =
    type === 'spotify'
      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30'
      : 'bg-pink-50 text-pink-700 hover:bg-pink-100 dark:bg-pink-900/20 dark:text-pink-400 dark:hover:bg-pink-900/30';
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

/* ─── Badge ─── */

function Badge({ children, color = 'zinc' }: { children: React.ReactNode; color?: string }) {
  const colorMap: Record<string, string> = {
    zinc: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700/70 dark:text-zinc-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        colorMap[color] ?? colorMap.zinc
      }`}
    >
      {children}
    </span>
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

  /* ─── Loading / Error / Not found ─── */

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-zinc-300 border-t-zinc-600 animate-spin dark:border-zinc-700 dark:border-t-zinc-300" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">트랙 정보를 불러오는 중…</p>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-zinc-500 dark:text-zinc-400">데이터를 불러오지 못했습니다.</p>
          <button
            onClick={() => navigate(`/admin/catalog/${id}`)}
            className="text-sm text-blue-500 hover:underline"
          >
            앨범으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-zinc-500 dark:text-zinc-400">트랙을 찾을 수 없습니다. (index: {idx})</p>
          <button
            onClick={() => navigate(`/admin/catalog/${id}`)}
            className="text-sm text-blue-500 hover:underline"
          >
            앨범으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  /* ─── Derived values ─── */

  const trackTitle = asset.version
    ? `${asset.titleKo || asset.name} (${asset.version})`
    : asset.titleKo || asset.name;

  const groupedContributors: Record<string, CatalogContributor[]> = {};
  for (const c of asset.contributors ?? []) {
    if (!groupedContributors[c.role]) groupedContributors[c.role] = [];
    if (!groupedContributors[c.role].find((x: any) => x.personId === c.personId)) {
      groupedContributors[c.role].push(c);
    }
  }

  /* ─── Render ─── */

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* ── Page Header ── */}
      <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/90 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex items-center gap-4 py-4">
            {/* Back button */}
            <button
              onClick={() => navigate(`/admin/catalog/${id}`)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              앨범으로
            </button>

            <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

            {/* Track identity */}
            <div className="flex flex-1 items-center gap-3 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <Music className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </span>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white truncate leading-tight">
                  {trackTitle}
                </h1>
                {asset.displayArtist && (
                  <p className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    {asset.displayArtist}
                  </p>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              {asset.isrc && (
                <Badge color="blue">
                  <span className="font-mono">{asset.isrc}</span>
                </Badge>
              )}
              {asset.duration != null && (
                <Badge color="zinc">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDuration(asset.duration)}
                </Badge>
              )}
              <Badge color="violet">
                Track {idx + 1} of {totalTracks}
              </Badge>
            </div>
          </div>

          {/* Mobile badges row */}
          <div className="sm:hidden flex flex-wrap items-center gap-2 pb-3">
            {asset.isrc && (
              <Badge color="blue">
                <span className="font-mono text-[11px]">{asset.isrc}</span>
              </Badge>
            )}
            {asset.duration != null && (
              <Badge color="zinc">
                <Clock className="h-3 w-3 mr-1" />
                {formatDuration(asset.duration)}
              </Badge>
            )}
            <Badge color="violet">
              Track {idx + 1} of {totalTracks}
            </Badge>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-5">

        {/* 1. 기본 정보 */}
        <Section title="기본 정보" icon={Music} accent="bg-violet-100 dark:bg-violet-900/30">
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
            <Field label="Duration" value={asset.duration ? formatDuration(asset.duration) : undefined} />
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
          accent="bg-blue-100 dark:bg-blue-900/30"
        >
          {/* Track artists */}
          {asset.artists?.length > 0 && (
            <div className="mb-5">
              <p className="text-[11px] uppercase tracking-wider font-medium text-zinc-400 dark:text-zinc-500 mb-2">
                Track Artists
              </p>
              <div className="flex flex-wrap gap-3">
                {asset.artists.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    {a.fugaId ? (
                      <Link
                        to={`/admin/catalog/artists/${a.fugaId}`}
                        className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {a.name}
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        {a.name}
                      </span>
                    )}
                    {a.primary && (
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">(Primary)</span>
                    )}
                    <DspLink url={a.spotifyUrl} type="spotify" />
                    <DspLink url={a.appleMusicUrl} type="apple" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Featuring artists */}
          {asset.featuringArtists?.length > 0 && (
            <div className="mb-5">
              <p className="text-[11px] uppercase tracking-wider font-medium text-zinc-400 dark:text-zinc-500 mb-2">
                Featuring Artists
              </p>
              <div className="flex flex-wrap gap-3">
                {asset.featuringArtists.map((a: any, i: number) => (
                  <span key={i} className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {a.name || a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contributors grouped by role */}
          {Object.keys(groupedContributors).length > 0 && (
            <div className="mb-5">
              <p className="text-[11px] uppercase tracking-wider font-medium text-zinc-400 dark:text-zinc-500 mb-3">
                Contributors
              </p>
              <div className="space-y-3">
                {Object.entries(groupedContributors).map(([role, people]) => (
                  <div key={role}>
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
                      {role}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {people.map((c: any) => (
                        <div key={c.personId} className="flex items-center gap-1.5">
                          {c.personId ? (
                            <Link
                              to={`/admin/catalog/artists/${c.personId}`}
                              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {c.name}
                            </Link>
                          ) : (
                            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                              {c.name}
                            </span>
                          )}
                          <DspLink url={c.spotifyUrl} type="spotify" />
                          <DspLink url={c.appleMusicUrl} type="apple" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legacy credit fields */}
          <FieldGrid>
            <Field label="Composer" value={asset.composer} />
            <Field label="Lyricist" value={asset.lyricist} />
            <Field label="Arranger" value={asset.arranger} />
            <Field label="Producer" value={asset.producer} />
            <Field label="Mixer" value={asset.mixer} />
            <Field label="Masterer" value={asset.masterer} />
          </FieldGrid>
          {asset.publishers && (
            <div className="mt-4">
              <Field label="Publishers" value={asset.publishers} />
            </div>
          )}
        </Section>

        {/* 3. 장르 */}
        <Section title="장르" icon={Music} accent="bg-emerald-100 dark:bg-emerald-900/30">
          <FieldGrid>
            <Field label="Genre" value={asset.genre?.name} />
            <Field label="Subgenre" value={asset.subgenre?.name} />
            <Field label="Alternate Genre" value={asset.alternateGenre?.name} />
            <Field label="Alternate Subgenre" value={asset.alternateSubgenre?.name} />
          </FieldGrid>
        </Section>

        {/* 4. 오디오 */}
        <Section title="오디오" icon={Mic2} accent="bg-amber-100 dark:bg-amber-900/30">
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

        {/* 5. 콘텐츠 */}
        <Section title="콘텐츠" icon={FileText} accent="bg-sky-100 dark:bg-sky-900/30">
          <FieldGrid>
            <Field label="Language" value={asset.language} />
            <Field label="Audio Language" value={asset.audioLocale ?? asset.audioLanguage} />
            <Field label="Lyrics Language" value={asset.lyricsLanguage} />
            <Field label="Metadata Language" value={asset.metadataLanguage} />
            <Field label="Explicit Content" value={asset.explicitContent} />
            <Field label="Parental Advisory" value={asset.parentalAdvisory} />
          </FieldGrid>

          {/* Lyrics file link */}
          {asset.lyricsFileUrl && (
            <div className="mt-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <p className="text-[11px] uppercase tracking-wider font-medium text-zinc-400 dark:text-zinc-500 mb-1">
                Lyrics File URL
              </p>
              <a
                href={asset.lyricsFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-500 hover:underline dark:text-blue-400"
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
            <div className="mt-4">
              <button
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
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
                <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-zinc-50 p-4 text-sm text-zinc-700 whitespace-pre-wrap dark:bg-zinc-800/60 dark:text-zinc-300 leading-relaxed">
                  {asset.lyrics}
                </pre>
              )}
            </div>
          )}
        </Section>

        {/* 6. 권리 */}
        <Section title="권리" icon={FileText} accent="bg-rose-100 dark:bg-rose-900/30">
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
          accent="bg-indigo-100 dark:bg-indigo-900/30"
        >
          <FieldGrid>
            <Field label="Preview Start" value={asset.previewStart} />
            <Field label="Preview End" value={asset.previewEnd} />
            <Field label="Preview Length" value={asset.previewLength} />
            <Field
              label="Playtime Start Short Clip"
              value={asset.playtimeStartShortClip}
            />
            <Field
              label="YouTube Short Preview"
              value={asset.youtubeShortPreview}
            />
            <Field label="Availability" value={asset.availability} />
            <Field label="Pre-order Enabled" value={asset.preorderEnabled} />
            <Field label="Pre-order Date" value={asset.preorderDate} />
            <Field
              label="Has Custom Release Date"
              value={asset.hasCustomReleaseDate}
            />
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

        {/* 8. 기타 (tags / extraFields) — only rendered if data present */}
        {(asset.tags?.length > 0 || asset.extraFields) && (
          <Section title="기타" icon={FileText}>
            {asset.tags?.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] uppercase tracking-wider font-medium text-zinc-400 dark:text-zinc-500 mb-2">
                  Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {asset.tags.map((tag: string, i: number) => (
                    <span
                      key={i}
                      className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700/70 dark:text-zinc-300"
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

        {/* Bottom spacing */}
        <div className="h-8" />
      </div>
    </div>
  );
}
