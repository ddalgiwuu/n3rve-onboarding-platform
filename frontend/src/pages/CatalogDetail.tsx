import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Music, Clock, ChevronDown, ChevronRight,
  ExternalLink, Disc3, Users, FileText, Globe, MessageSquare,
  FolderOpen, ClipboardList, Headphones, Shield, Tag, Video, Calendar, Send,
  Play, Square, Download,
} from 'lucide-react';
import catalogApi from '../lib/catalog-api';
import { formatDuration } from '../utils/format';
import type { CatalogAsset, CatalogContributor } from '../types/catalog';

/* ─── Utility Components ─── */

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
      <button
        className="flex w-full items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-zinc-400" />
          <h2 className="font-semibold text-zinc-900 dark:text-white">{title}</h2>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-zinc-400" /> : <ChevronRight className="h-4 w-4 text-zinc-400" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: any; mono?: boolean }) {
  if (value === null || value === undefined || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No')
    : typeof value === 'object' ? JSON.stringify(value)
    : String(value);
  return (
    <div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`text-sm text-zinc-800 dark:text-zinc-200 ${mono ? 'font-mono' : ''}`}>{display}</p>
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

function StateTag({ state }: { state: string }) {
  const cls = state === 'DELIVERED'
    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    : state === 'DRAFT'
    ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{state}</span>;
}

function StatusTag({ status }: { status: string }) {
  const cls = status === 'approved'
    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    : status === 'pending'
    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>Submission: {status?.toUpperCase()}</span>;
}

function SourceBadge({ source }: { source?: string }) {
  if (!source) return null;
  const cls = source === 'catalog'
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    : source === 'submission'
    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300';
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{source}</span>;
}

function TagPills({ items }: { items?: string[] | null }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <span key={i} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
          {item}
        </span>
      ))}
    </div>
  );
}

function LinkField({ label, url }: { label: string; url?: string | null }) {
  if (!url) return null;
  return (
    <div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm text-blue-500 hover:underline dark:text-blue-400">
        {url.length > 60 ? url.slice(0, 60) + '...' : url} <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

function DspLink({ url, type }: { url?: string | null; type: 'spotify' | 'apple' }) {
  if (!url) return null;
  const label = type === 'spotify' ? 'Spotify' : 'Apple Music';
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600">
      {label} <ExternalLink className="h-3 w-3" />
    </a>
  );
}

function ContributorsByRole({ contributors }: { contributors: CatalogContributor[] }) {
  const grouped: Record<string, CatalogContributor[]> = {};
  for (const c of contributors) {
    if (!grouped[c.role]) grouped[c.role] = [];
    if (!grouped[c.role].find(x => x.personId === c.personId)) {
      grouped[c.role].push(c);
    }
  }
  return (
    <div className="space-y-2 pl-4">
      {Object.entries(grouped).map(([role, people]) => (
        <div key={role}>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{role}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {people.map(c => (
              <span key={c.personId} className="inline-flex items-center gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                {c.name}
                <DspLink url={c.spotifyUrl} type="spotify" />
                <DspLink url={c.appleMusicUrl} type="apple" />
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Sub-Section for Tracks ─── */

function TrackSubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{title}</p>
      {children}
    </div>
  );
}

/* ─── Track Row ─── */

function TrackRow({ asset, index }: { asset: any; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  const title = asset.version ? `${asset.name} (${asset.version})` : asset.name;

  return (
    <div className="border-b border-zinc-100 last:border-0 dark:border-zinc-700">
      {/* Header */}
      <button
        className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="w-6 text-center text-sm text-zinc-400">{asset.sequence || index + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-zinc-900 dark:text-white truncate">{title}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            {asset.isrc && <span className="font-mono">ISRC: {asset.isrc}</span>}
            {asset.isTitleTrack && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Title</span>}
            {asset.isFocusTrack && <span className="rounded bg-purple-100 px-1.5 py-0.5 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Focus</span>}
            {asset.assetCatalogTier && <span>Tier: {asset.assetCatalogTier}</span>}
            {asset.versionTypes?.length > 0 && (
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-700">
                {asset.versionTypes.map((v: any) => v.name).join(', ')}
              </span>
            )}
          </div>
        </div>
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {formatDuration(asset.duration)}
        </span>
        {expanded ? <ChevronDown className="h-4 w-4 text-zinc-400" /> : <ChevronRight className="h-4 w-4 text-zinc-400" />}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="space-y-4 px-4 pb-4 pt-2">
          {/* 기본 정보 */}
          <TrackSubSection title="기본 정보">
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
              <Field label="Version Type" value={asset.versionTypes?.map((v: any) => v.name).join(', ')} />
              <Field label="Track Version" value={asset.version || asset.assetVersion} />
              <Field label="Is Title Track" value={asset.isTitleTrack} />
              <Field label="Is Focus Track" value={asset.isFocusTrack} />
              <Field label="Display Artist" value={asset.displayArtist} />
            </FieldGrid>
          </TrackSubSection>

          {/* 아티스트 & 기여자 */}
          {(asset.artists?.length > 0 || asset.contributors?.length > 0 || asset.featuringArtists?.length > 0) && (
            <TrackSubSection title="아티스트 & 기여자">
              {asset.artists?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Track Artists</p>
                  <div className="flex flex-wrap gap-2">
                    {asset.artists.map((a: any, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                        {a.name} {a.primary && <span className="text-xs text-zinc-400">(Primary)</span>}
                        <DspLink url={a.spotifyUrl} type="spotify" />
                        <DspLink url={a.appleMusicUrl} type="apple" />
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {asset.featuringArtists?.length > 0 && (
                <div className="space-y-1 mt-2">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Featuring Artists</p>
                  <div className="flex flex-wrap gap-2">
                    {asset.featuringArtists.map((a: any, i: number) => (
                      <span key={i} className="text-sm text-zinc-700 dark:text-zinc-300">{a.name || a}</span>
                    ))}
                  </div>
                </div>
              )}
              {asset.contributors?.length > 0 && (
                <div className="mt-2">
                  <ContributorsByRole contributors={asset.contributors} />
                </div>
              )}
              <FieldGrid>
                <Field label="Composer" value={asset.composer} />
                <Field label="Lyricist" value={asset.lyricist} />
                <Field label="Arranger" value={asset.arranger} />
                <Field label="Producer" value={asset.producer} />
                <Field label="Mixer" value={asset.mixer} />
                <Field label="Masterer" value={asset.masterer} />
              </FieldGrid>
              {asset.publishers && (
                <Field label="Publishers" value={asset.publishers} />
              )}
            </TrackSubSection>
          )}

          {/* 장르 */}
          <TrackSubSection title="장르">
            <FieldGrid>
              <Field label="Genre" value={asset.genre?.name} />
              <Field label="Subgenre" value={asset.subgenre?.name} />
              <Field label="Alternate Genre" value={asset.alternateGenre?.name} />
              <Field label="Alternate Subgenre" value={asset.alternateSubgenre?.name} />
            </FieldGrid>
          </TrackSubSection>

          {/* 오디오 */}
          <TrackSubSection title="오디오">
            <FieldGrid>
              <Field label="Sample Rate" value={asset.audio?.sampleRate || asset.sampleRate} />
              <Field label="Bit Depth" value={asset.audio?.bitDepth || asset.bitDepth} />
              <Field label="Audio Format" value={asset.audio?.format || asset.audioFormat} />
              <Field label="Dolby Atmos" value={asset.dolbyAtmos} />
              <Field label="Stereo" value={asset.stereo} />
              <Field label="Audio File" value={asset.audioFileInfo?.filename} />
              <Field label="Audio Quality" value={asset.audioFileInfo?.quality} />
              <Field label="File Size" value={asset.audioFileInfo?.size} />
              <Field label="Dolby Atmos" value={asset.dolbyAtmosFileInfo ? 'Yes' : 'No'} />
              <Field label="Audio Language" value={asset.audioLanguage} />
              <Field label="Metadata Language" value={asset.metadataLanguage} />
            </FieldGrid>
          </TrackSubSection>

          {/* 콘텐츠 */}
          <TrackSubSection title="콘텐츠">
            <FieldGrid>
              <Field label="Language" value={asset.language} />
              <Field label="Audio Language" value={asset.audioLocale || asset.audioLanguage} />
              <Field label="Lyrics Language" value={asset.lyricsLanguage} />
              <Field label="Metadata Language" value={asset.metadataLanguage} />
              <Field label="Explicit Content" value={asset.explicitContent} />
              <Field label="Parental Advisory" value={asset.parentalAdvisory} />
            </FieldGrid>
            {asset.lyricsFileUrl && (
              <LinkField label="Lyrics File URL" url={asset.lyricsFileUrl} />
            )}
            {(asset.hasLyrics && asset.lyrics) && (
              <div className="mt-2">
                <button
                  className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  onClick={(e) => { e.stopPropagation(); setShowLyrics(!showLyrics); }}
                >
                  {showLyrics ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  <FileText className="h-3 w-3" /> 가사
                </button>
                {showLyrics && (
                  <pre className="mt-2 max-h-60 overflow-auto rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 whitespace-pre-wrap dark:bg-zinc-900 dark:text-zinc-300">
                    {asset.lyrics}
                  </pre>
                )}
              </div>
            )}
          </TrackSubSection>

          {/* 권리 */}
          <TrackSubSection title="권리">
            <FieldGrid>
              <Field label="Asset Copyright" value={asset.pLineText || asset.assetCopyright} />
              <Field label="Rights Claim" value={asset.rightsClaim} />
              <Field label="Rights Holder" value={asset.rightsHolderName} />
              <Field label="Rights Ownership" value={asset.rightsOwnership} />
              <Field label="Recording Year" value={asset.recordingYear} />
              <Field label="Recording Location" value={asset.recordingLocation} />
              <Field label="Country of Recording" value={asset.countryOfRecording} />
              <Field label="Country of Commissioning" value={asset.countryOfCommissioning} />
              <Field label="Rights Contract Begin Date" value={asset.rightsContractBeginDate} />
              <Field label="Asset Release Date" value={asset.assetReleaseDate} />
              <Field label="Asset Catalog Tier" value={asset.assetCatalogTier} />
              <Field label="Rights Ownership Name" value={asset.rightsOwnershipName} />
              <Field label="ISWC" value={asset.iswc} mono />
              <Field label="Courtesy Line" value={asset.courtesyLine} />
            </FieldGrid>
          </TrackSubSection>

          {/* 프리뷰 */}
          <TrackSubSection title="프리뷰">
            <FieldGrid>
              <Field label="Preview Start" value={asset.previewStart} />
              <Field label="Preview End" value={asset.previewEnd} />
              <Field label="Preview Length" value={asset.previewLength} />
              <Field label="Playtime Start Short Clip" value={asset.playtimeStartShortClip} />
              <Field label="YouTube Short Preview" value={asset.youtubeShortPreview} />
            </FieldGrid>
          </TrackSubSection>

          {/* 비디오 */}
          <TrackSubSection title="비디오">
            <FieldGrid>
              <Field label="Has Music Video" value={asset.hasMusicVideo} />
              <Field label="Music Video ISRC" value={asset.musicVideoIsrc} mono />
            </FieldGrid>
          </TrackSubSection>

          {/* 가용성 */}
          <TrackSubSection title="가용성">
            <FieldGrid>
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
              <Field label="YouTube Short Preview" value={asset.youtubeShortPreview} />
              <Field label="Preview Length" value={asset.previewLength} />
            </FieldGrid>
          </TrackSubSection>

          {/* 기타 */}
          <TrackSubSection title="기타">
            <FieldGrid>
              <Field label="Tags" value={asset.tags} />
              <Field label="Extra Fields" value={asset.extraFields} />
              <Field label="Translations" value={asset.translations} />
            </FieldGrid>
          </TrackSubSection>

          {/* 태그 & 기타 */}
          {(asset.tags?.length > 0 || asset.extraFields) && (
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1">태그 & 기타</p>
              <div className="grid grid-cols-2 gap-2">
                {asset.tags?.length > 0 && (
                  <div className="col-span-2 flex flex-wrap gap-1">
                    {asset.tags.map((tag: string, i: number) => (
                      <span key={i} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-700">{tag}</span>
                    ))}
                  </div>
                )}
                {asset.extraFields && Object.entries(asset.extraFields).map(([k, v]: [string, any]) => (
                  v ? <Field key={k} label={`Extra ${k}`} value={v} /> : null
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */

export default function CatalogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const type = (searchParams.get('type') as 'catalog' | 'submission') || 'catalog';
  const navigate = useNavigate();
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ['catalog-unified-detail', id, type],
    queryFn: () => catalogApi.getUnifiedProduct(id!, type).then(r => r.data),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-zinc-400">불러오는 중...</div>;
  }

  if (!product) {
    return <div className="flex h-64 items-center justify-center text-zinc-400">프로덕트를 찾을 수 없습니다</div>;
  }

  const p = product as any;
  const marketing = p.marketing || {};
  const files = p.files || {};
  const assets = p.assets || [];

  function toRawUrl(url: string) {
    if (!url) return url;
    if (url.includes('dropbox.com') && !url.includes('raw=1')) {
      return url.includes('dl=0') ? url.replace('dl=0', 'raw=1') : url + (url.includes('?') ? '&' : '?') + 'raw=1';
    }
    return url;
  }

  // Merge audioFiles from both top-level and files object
  const audioFiles = p.audioFiles?.length ? p.audioFiles : files.audioFiles || [];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        onClick={() => navigate('/admin/catalog')}
      >
        <ArrowLeft className="h-4 w-4" /> 카탈로그로 돌아가기
      </button>

      {/* ── Section 1: Header (not collapsible) ── */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex items-start gap-6">
          {p.coverImageUrl && (
            <div className="flex-shrink-0">
              <img
                src={p.coverImageUrl.includes('dropbox.com') && !p.coverImageUrl.includes('raw=1')
                  ? p.coverImageUrl.replace('dl=0', 'raw=1')
                  : p.coverImageUrl}
                alt={p.name}
                className="h-40 w-40 rounded-lg object-cover shadow-md"
              />
            </div>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{p.name}</h1>
              {p.releaseVersion && (
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-sm text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                  {p.releaseVersion}
                </span>
              )}
              {p.state && <StateTag state={p.state} />}
              {p.submissionStatus && <StatusTag status={p.submissionStatus} />}
              <SourceBadge source={p.source} />
            </div>
            <p className="mt-1 text-zinc-600 dark:text-zinc-300">{p.displayArtist}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {[p.label, p.albumType].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
      </div>

      {/* ── Section 2: Release Metadata ── */}
      <Section title="릴리스 정보" icon={Disc3}>
        <FieldGrid>
          <Field label="UPC" value={p.upc} mono />
          <Field label="Catalog Number" value={p.catalogNumber} mono />
          <Field label="FUGA ID" value={p.fugaId} mono />
          <Field label="EAN" value={p.ean} mono />

          <Field label="Consumer Release Date" value={p.consumerReleaseDate?.split?.('T')?.[0] || p.consumerReleaseDate} />
          <Field label="Original Release Date" value={p.originalReleaseDate?.split?.('T')?.[0] || p.originalReleaseDate} />
          <Field label="Release Time" value={p.releaseTime} />
          <Field label="Timezone" value={p.timezone} />

          <Field label="Genre" value={p.genre?.name || p.genre} />
          <Field label="Subgenre" value={p.subgenre?.name || p.subgenre} />
          <Field label="Secondary Genre" value={p.secondaryGenre?.name || p.secondaryGenre} />
          <Field label="Secondary Subgenre" value={p.secondarySubgenre?.name || p.secondarySubgenre} />

          <Field label="Language" value={p.language} />
          <Field label="Recording Country" value={p.recordingCountry} />
          <Field label="Recording Language" value={p.recordingLanguage} />

          <Field label="© Line" value={p.cLineText} />
          <Field label="Copyright Holder" value={p.copyrightHolder} />
          <Field label="Copyright Year" value={p.copyrightYear} />
          <Field label="℗ Line" value={p.pLineText} />
          <Field label="Production Holder" value={p.productionHolder} />
          <Field label="Production Year" value={p.productionYear || p.pLineYear} />

          <Field label="Release Format" value={p.releaseFormatType} />
          <Field label="Price Type" value={p.priceType} />
          <Field label="Pre-order" value={p.preorder} />

          <Field label="Territory Type" value={p.territoryType} />
          <Field label="Territories" value={Array.isArray(p.territories) ? p.territories.join(', ') : p.territories} />

          <Field label="Is Compilation" value={p.isCompilation} />
          <Field label="Previously Released" value={p.previouslyReleased} />
          <Field label="Motion Artwork" value={p.motionArtwork} />
          <Field label="YouTube Shorts Previews" value={p.youtubeShortsPreview} />

          <Field label="Parental Advisory" value={p.parentalAdvisory} />
          <Field label="Explicit Content" value={p.explicitContent} />

          <Field label="Product Type" value={p.productType} />
          <Field label="Suborg" value={Array.isArray(p.suborg) ? p.suborg.join(', ') : p.suborg} />

          <Field label="Synced At" value={p.syncedAt ? new Date(p.syncedAt).toLocaleString('ko-KR') : undefined} />
          <Field label="Added Date" value={p.addedDate} />
          <Field label="Created At" value={p.createdAt ? new Date(p.createdAt).toLocaleString('ko-KR') : undefined} />

          <Field label="Courtesy Line" value={p.courtesyLine} />
          <Field label="Label Copy Info" value={p.labelCopyInfo} />
          <Field label="Album Notes" value={p.albumNotes} />
          <Field label="Metadata Language" value={p.metadataLanguage} />
          <Field label="Catalog Tier" value={p.catalogTier} />
          <Field label="Total Volumes" value={p.totalVolumes} />
          <Field label="Is Compilation" value={p.isCompilation} />
          <Field label="Preorder Date" value={p.preorderDate} />
          <Field label="Recording Year" value={p.recordingYear} />
          <Field label="Recording Location" value={p.recordingLocation} />
          <Field label="Alternate Genre" value={p.alternateGenre?.name} />
          <Field label="Alternate Subgenre" value={p.alternateSubgenre?.name} />
        </FieldGrid>
        {p.extraFields && (
          <div className="col-span-full mt-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Extra Fields</p>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(p.extraFields).map(([key, val]: [string, any]) => (
                val ? <Field key={key} label={`Extra ${key}`} value={val} /> : null
              ))}
            </div>
          </div>
        )}
        {p.productTags?.length > 0 && (
          <div className="col-span-full">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Tags</p>
            <div className="flex flex-wrap gap-1">
              {p.productTags.map((tag: string, i: number) => (
                <span key={i} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-700 dark:text-zinc-300">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* ── Delivery Instructions ── */}
      {p.deliveryInstructions && (
        <Section title="배포 상태" icon={Send} defaultOpen={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="py-2 text-left text-xs text-zinc-500">DSP</th>
                  <th className="py-2 text-left text-xs text-zinc-500">Release Date</th>
                  <th className="py-2 text-left text-xs text-zinc-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(p.deliveryInstructions) ? p.deliveryInstructions : []).map((d: any, i: number) => (
                  <tr key={i} className="border-b border-zinc-100 dark:border-zinc-700/50">
                    <td className="py-2 text-zinc-800 dark:text-zinc-200">{d.dsp || d.name}</td>
                    <td className="py-2 text-zinc-600 dark:text-zinc-400">{d.releaseDate || d.release_date}</td>
                    <td className="py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${
                        (d.status || '').toLowerCase().includes('delivered') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        (d.status || '').toLowerCase().includes('cancelled') ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>{d.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ── Section 3: Artists ── */}
      <Section title="아티스트" icon={Users}>
        {p.artists?.length > 0 && (
          <div className="space-y-3 mb-4">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Artists</p>
            <div className="flex flex-wrap gap-3">
              {p.artists.map((artist: any, i: number) => (
                <div key={i} className="inline-flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{artist.name}</span>
                  {artist.primary && (
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Primary</span>
                  )}
                  <DspLink url={artist.spotifyUrl} type="spotify" />
                  <DspLink url={artist.appleMusicUrl} type="apple" />
                </div>
              ))}
            </div>
          </div>
        )}
        {p.albumFeaturingArtists?.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Featuring Artists</p>
            <div className="flex flex-wrap gap-2">
              {p.albumFeaturingArtists.map((a: any, i: number) => (
                <span key={i} className="text-sm text-zinc-700 dark:text-zinc-300">{a.name || a}</span>
              ))}
            </div>
          </div>
        )}
        <FieldGrid>
          <Field label="Artist Type" value={p.artistType} />
          <Field label="Spotify ID" value={p.spotifyId} mono />
          <Field label="Apple Music ID" value={p.appleMusicId} mono />
          <Field label="YouTube Channel ID" value={p.youtubeChannelId} mono />
        </FieldGrid>
        {/* Artist extended fields */}
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
          <Field label="ISNI" value={p.artists?.[0]?.isni} mono />
          <Field label="IPN" value={p.artists?.[0]?.ipn} mono />
          <Field label="Country of Origin" value={p.artists?.[0]?.countryOfOrigin} />
          <Field label="Booking Agent" value={p.artists?.[0]?.bookingAgent} />
          <Field label="YouTube OAC" value={p.artists?.[0]?.youtubeOac} />
        </div>
        {p.biography && (
          <div className="mt-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Biography</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{p.biography}</p>
          </div>
        )}
        {p.socialLinks && Object.keys(p.socialLinks).length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Social Links</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(p.socialLinks).map(([platform, url]) => (
                url && (
                  <a key={platform} href={url as string} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600">
                    {platform} <ExternalLink className="h-3 w-3" />
                  </a>
                )
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* ── Section 4: Marketing ── */}
      <Section title="마케팅" icon={MessageSquare} defaultOpen={false}>
        <FieldGrid>
          <Field label="Project Type" value={marketing.projectType} />
          <Field label="Priority Level" value={marketing.priorityLevel} />
        </FieldGrid>
        {marketing.hook && (
          <div className="mt-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Hook</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{marketing.hook}</p>
          </div>
        )}
        {marketing.mainPitch && (
          <div className="mt-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Main Pitch</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{marketing.mainPitch}</p>
          </div>
        )}

        {(marketing.moods?.length > 0 || marketing.instruments?.length > 0) && (
          <div className="mt-3 space-y-2">
            {marketing.moods?.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Moods</p>
                <TagPills items={marketing.moods} />
              </div>
            )}
            {marketing.instruments?.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Instruments</p>
                <TagPills items={marketing.instruments} />
              </div>
            )}
          </div>
        )}

        {marketing.marketingDrivers && (
          <div className="mt-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Marketing Drivers</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{typeof marketing.marketingDrivers === 'string' ? marketing.marketingDrivers : JSON.stringify(marketing.marketingDrivers)}</p>
          </div>
        )}
        {marketing.socialMediaPlan && (
          <div className="mt-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Social Media Plan</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{marketing.socialMediaPlan}</p>
          </div>
        )}

        <div className="mt-3">
          <FieldGrid>
            <Field label="Target Audience" value={marketing.targetAudience} />
            <Field label="Similar Artists" value={marketing.similarArtists} />
            <Field label="Marketing Keywords" value={marketing.marketingKeywords} />
            <Field label="Artist Bio" value={marketing.artistBio} />
            <Field label="Artist Gender" value={marketing.artistGender} />
          </FieldGrid>
        </div>

        {/* Social URLs from marketing */}
        <div className="mt-3">
          <FieldGrid>
            <LinkField label="YouTube" url={marketing.youtubeUrl || marketing.youtube} />
            <LinkField label="TikTok" url={marketing.tiktokUrl || marketing.tiktok} />
            <LinkField label="X (Twitter)" url={marketing.xUrl || marketing.twitter} />
            <LinkField label="Twitch" url={marketing.twitchUrl || marketing.twitch} />
            <LinkField label="Threads" url={marketing.threadsUrl || marketing.threads} />
            <LinkField label="SoundCloud" url={marketing.soundcloudUrl || marketing.soundcloud} />
            <LinkField label="Facebook" url={marketing.facebookUrl || marketing.facebook} />
            <LinkField label="Instagram" url={marketing.instagramUrl || marketing.instagram} />
          </FieldGrid>
        </div>

        {marketing.campaignGoals && (
          <div className="mt-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Campaign Goals</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{typeof marketing.campaignGoals === 'string' ? marketing.campaignGoals : JSON.stringify(marketing.campaignGoals)}</p>
          </div>
        )}

        {(p.albumIntroduction || marketing.albumIntroduction) && (
          <div className="mt-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Album Introduction</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{p.albumIntroduction || marketing.albumIntroduction}</p>
          </div>
        )}
        {(p.albumDescription || marketing.albumDescription) && (
          <div className="mt-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Album Description</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{p.albumDescription || marketing.albumDescription}</p>
          </div>
        )}

        {marketing.promotionPlans && (
          <div className="mt-3">
            <Field label="Promotion Plans" value={marketing.promotionPlans} />
          </div>
        )}
        {marketing.syncHistory && (
          <div className="mt-3">
            <Field label="Sync History" value={marketing.syncHistory} />
          </div>
        )}
      </Section>

      {/* ── Section 5: Tracks ── */}
      <Section title={`트랙 (${assets.length})`} icon={Music}>
        <div className="-mx-4 -mb-4 -mt-4">
          {assets.length === 0 && (
            <p className="p-4 text-sm text-zinc-400">트랙 정보가 없습니다</p>
          )}
          {assets.map((asset: any, i: number) => (
            <TrackRow key={asset.id || i} asset={asset} index={i} />
          ))}
        </div>
      </Section>

      {/* ── Section 6: Files ── */}
      <Section title="파일" icon={FolderOpen} defaultOpen={false}>
        <div className="space-y-4">
          <LinkField label="Cover Image URL" url={files.coverImageUrl || p.coverImageUrl} />
          {(files.coverImageUrl || p.coverImageUrl) && (
            <img
              src={files.coverImageUrl || p.coverImageUrl}
              alt="Cover"
              className="h-24 w-24 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700"
            />
          )}
          <LinkField label="Artist Photo URL" url={files.artistPhotoUrl} />
          <LinkField label="Motion Art URL" url={files.motionArtUrl} />
          <LinkField label="Music Video URL" url={files.musicVideoUrl} />

          {audioFiles.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Audio Files ({audioFiles.length})</p>
              <div className="space-y-2">
                {audioFiles.map((f: any, i: number) => {
                  const rawUrl = toRawUrl(f.dropboxUrl || f.url || '');
                  const isPlaying = playingUrl === rawUrl;
                  return (
                    <div key={i} className="flex items-center gap-3 rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-700/50">
                      {rawUrl && (
                        <button
                          onClick={() => setPlayingUrl(isPlaying ? null : rawUrl)}
                          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                            isPlaying
                              ? 'bg-red-500 text-white'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          {isPlaying ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                          {f.fileName || f.trackId || `Track ${i + 1}`}
                        </p>
                        {f.fileSize && (
                          <p className="text-xs text-zinc-400">{(f.fileSize / 1024 / 1024).toFixed(1)} MB</p>
                        )}
                      </div>
                      {rawUrl && (
                        <a href={f.dropboxUrl || f.url} target="_blank" rel="noopener noreferrer"
                          className="flex-shrink-0 text-zinc-400 hover:text-blue-500">
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                      {isPlaying && (
                        <audio src={rawUrl} autoPlay controls className="hidden"
                          onEnded={() => setPlayingUrl(null)} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {files.dolbyAtmosFiles?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Dolby Atmos Files</p>
              <div className="space-y-1">
                {files.dolbyAtmosFiles.map((f: any, i: number) => (
                  <div key={i} className="text-sm text-zinc-700 dark:text-zinc-300">
                    {f.fileName || JSON.stringify(f)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {files.lyricsFiles?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Lyrics Files</p>
              <div className="space-y-1">
                {files.lyricsFiles.map((f: any, i: number) => (
                  <LinkField key={i} label={f.fileName || `Lyrics ${i + 1}`} url={f.url || f.dropboxUrl} />
                ))}
              </div>
            </div>
          )}

          {files.musicVideoFiles?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Music Video Files</p>
              <div className="space-y-1">
                {files.musicVideoFiles.map((f: any, i: number) => (
                  <LinkField key={i} label={f.fileName || `MV ${i + 1}`} url={f.url || f.dropboxUrl} />
                ))}
              </div>
            </div>
          )}

          {files.musicVideoThumbnails?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Music Video Thumbnails</p>
              <div className="space-y-1">
                {files.musicVideoThumbnails.map((f: any, i: number) => (
                  <LinkField key={i} label={f.fileName || `Thumbnail ${i + 1}`} url={f.url || f.dropboxUrl} />
                ))}
              </div>
            </div>
          )}

          {files.additionalFiles?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Additional Files</p>
              <div className="space-y-1">
                {files.additionalFiles.map((f: any, i: number) => (
                  <LinkField key={i} label={f.fileName || `File ${i + 1}`} url={f.url || f.dropboxUrl} />
                ))}
              </div>
            </div>
          )}

          {/* If files is empty */}
          {Object.keys(files).length === 0 && !p.coverImageUrl && (
            <p className="text-sm text-zinc-400">파일 정보가 없습니다</p>
          )}
        </div>
      </Section>

      {/* ── Section 7: Submission Info ── */}
      <Section title="제출 정보" icon={ClipboardList} defaultOpen={false}>
        <FieldGrid>
          <Field label="Submitter Name" value={p.submitterName} />
          <Field label="Submitter Email" value={p.submitterEmail} />
          <Field label="Submission Status" value={p.submissionStatus?.toUpperCase()} />
          <Field label="Reviewed By" value={p.reviewedBy} />
          <Field label="Reviewed At" value={p.reviewedAt ? new Date(p.reviewedAt).toLocaleString('ko-KR') : undefined} />
          <Field label="Created At" value={p.createdAt ? new Date(p.createdAt).toLocaleString('ko-KR') : undefined} />
          <Field label="Updated At" value={p.updatedAt ? new Date(p.updatedAt).toLocaleString('ko-KR') : undefined} />
        </FieldGrid>
        {p.adminNotes && (
          <div className="mt-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Admin Notes</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{p.adminNotes}</p>
          </div>
        )}
      </Section>
    </div>
  );
}
