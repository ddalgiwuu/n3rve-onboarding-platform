import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Music, ChevronDown, ChevronRight,
  ExternalLink, Disc3, Users, FileText, MessageSquare,
  FolderOpen, ClipboardList, Headphones, Video, Send,
  Play, Download, Pause, Volume2, VolumeX,
  Mic2, Film, Image as ImageIcon, X,
} from 'lucide-react';
import catalogApi from '../lib/catalog-api';
import { formatDuration } from '../utils/format';
import type { CatalogContributor } from '../types/catalog';

/* ─── Utility ─── */

function toRawUrl(url: string) {
  if (!url) return url;
  if (url.includes('dropbox.com') && !url.includes('raw=1')) {
    return url.includes('dl=0') ? url.replace('dl=0', 'raw=1') : url + (url.includes('?') ? '&' : '?') + 'raw=1';
  }
  return url;
}

function formatTime(seconds: number) {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ─── Utility Components ─── */

function Section({ title, icon: Icon, children, defaultOpen = true, accent }: {
  title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean; accent?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700/60 dark:bg-zinc-800/80 overflow-hidden shadow-sm">
      <button
        className="flex w-full items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-700/60 hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2.5">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent || 'bg-zinc-100 dark:bg-zinc-700'}`}>
            <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          </span>
          <h2 className="font-semibold text-zinc-900 dark:text-white text-sm">{title}</h2>
        </div>
        {open
          ? <ChevronDown className="h-4 w-4 text-zinc-400" />
          : <ChevronRight className="h-4 w-4 text-zinc-400" />}
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

function SubSection({ title }: { title: string }) {
  return (
    <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2 mt-4 first:mt-0">
      {title}
    </p>
  );
}

function Field({ label, value, mono = false }: { label: string; value: any; mono?: boolean }) {
  if (value === null || value === undefined || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No')
    : typeof value === 'object' ? JSON.stringify(value)
    : String(value);
  return (
    <div>
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-0.5">{label}</p>
      <p className={`text-sm text-zinc-800 dark:text-zinc-200 leading-snug ${mono ? 'font-mono text-xs' : ''}`}>{display}</p>
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

function StateTag({ state }: { state: string }) {
  const cls = state === 'DELIVERED'
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    : state === 'DRAFT'
    ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{state}</span>;
}

function StatusTag({ status }: { status: string }) {
  const cls = status === 'approved'
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    : status === 'pending'
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>Submission: {status?.toUpperCase()}</span>;
}

function SourceBadge({ source }: { source?: string }) {
  if (!source) return null;
  const cls = source === 'catalog'
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    : source === 'submission'
    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300';
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{source}</span>;
}

function TagPills({ items }: { items?: string[] | null }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700/70 dark:text-zinc-300">
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
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-0.5">{label}</p>
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
  const color = type === 'spotify'
    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30'
    : 'bg-pink-50 text-pink-700 hover:bg-pink-100 dark:bg-pink-900/20 dark:text-pink-400 dark:hover:bg-pink-900/30';
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${color}`}>
      {label} <ExternalLink className="h-2.5 w-2.5" />
    </a>
  );
}

/* ─── Track Detail Modal ─── */

function TrackDetailModal({ asset, onClose }: { asset: any; onClose: () => void }) {
  const [showLyrics, setShowLyrics] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl">
        {/* Modal header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-white">
              {asset.version ? `${asset.name} (${asset.version})` : asset.name}
            </h3>
            {asset.displayArtist && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{asset.displayArtist}</p>
            )}
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* 기본 정보 */}
          <div>
            <SubSection title="기본 정보" />
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
          </div>

          {/* 아티스트 & 기여자 */}
          {(asset.artists?.length > 0 || asset.contributors?.length > 0 || asset.featuringArtists?.length > 0) && (
            <div>
              <SubSection title="아티스트 & 기여자" />
              {asset.artists?.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">Track Artists</p>
                  <div className="flex flex-wrap gap-2">
                    {asset.artists.map((a: any, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                        {a.name}
                        {a.primary && <span className="text-xs text-zinc-400">(Primary)</span>}
                        <DspLink url={a.spotifyUrl} type="spotify" />
                        <DspLink url={a.appleMusicUrl} type="apple" />
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {asset.featuringArtists?.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">Featuring Artists</p>
                  <div className="flex flex-wrap gap-2">
                    {asset.featuringArtists.map((a: any, i: number) => (
                      <span key={i} className="text-sm text-zinc-700 dark:text-zinc-300">{a.name || a}</span>
                    ))}
                  </div>
                </div>
              )}
              {asset.contributors?.length > 0 && (
                <div className="mb-2">
                  {(() => {
                    const grouped: Record<string, CatalogContributor[]> = {};
                    for (const c of asset.contributors) {
                      if (!grouped[c.role]) grouped[c.role] = [];
                      if (!grouped[c.role].find((x: any) => x.personId === c.personId)) grouped[c.role].push(c);
                    }
                    return Object.entries(grouped).map(([role, people]) => (
                      <div key={role} className="mb-1.5">
                        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{role}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {people.map((c: any) => (
                            <span key={c.personId} className="inline-flex items-center gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                              {c.name}
                              <DspLink url={c.spotifyUrl} type="spotify" />
                              <DspLink url={c.appleMusicUrl} type="apple" />
                            </span>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
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
              {asset.publishers && <Field label="Publishers" value={asset.publishers} />}
            </div>
          )}

          {/* 장르 */}
          <div>
            <SubSection title="장르" />
            <FieldGrid>
              <Field label="Genre" value={asset.genre?.name} />
              <Field label="Subgenre" value={asset.subgenre?.name} />
              <Field label="Alternate Genre" value={asset.alternateGenre?.name} />
              <Field label="Alternate Subgenre" value={asset.alternateSubgenre?.name} />
            </FieldGrid>
          </div>

          {/* 오디오 */}
          <div>
            <SubSection title="오디오" />
            <FieldGrid>
              <Field label="Sample Rate" value={asset.audio?.sampleRate || asset.sampleRate} />
              <Field label="Bit Depth" value={asset.audio?.bitDepth || asset.bitDepth} />
              <Field label="Audio Format" value={asset.audio?.format || asset.audioFormat} />
              <Field label="Dolby Atmos" value={asset.dolbyAtmos} />
              <Field label="Stereo" value={asset.stereo} />
              <Field label="Audio File" value={asset.audioFileInfo?.filename} />
              <Field label="Audio Quality" value={asset.audioFileInfo?.quality} />
              <Field label="File Size" value={asset.audioFileInfo?.size} />
              <Field label="Audio Language" value={asset.audioLanguage} />
              <Field label="Metadata Language" value={asset.metadataLanguage} />
            </FieldGrid>
          </div>

          {/* 콘텐츠 */}
          <div>
            <SubSection title="콘텐츠" />
            <FieldGrid>
              <Field label="Language" value={asset.language} />
              <Field label="Audio Language" value={asset.audioLocale || asset.audioLanguage} />
              <Field label="Lyrics Language" value={asset.lyricsLanguage} />
              <Field label="Metadata Language" value={asset.metadataLanguage} />
              <Field label="Explicit Content" value={asset.explicitContent} />
              <Field label="Parental Advisory" value={asset.parentalAdvisory} />
            </FieldGrid>
            {asset.lyricsFileUrl && <div className="mt-2"><LinkField label="Lyrics File URL" url={asset.lyricsFileUrl} /></div>}
            {asset.hasLyrics && asset.lyrics && (
              <div className="mt-2">
                <button
                  className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  onClick={() => setShowLyrics(!showLyrics)}
                >
                  {showLyrics ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  <FileText className="h-3 w-3" /> 가사 보기
                </button>
                {showLyrics && (
                  <pre className="mt-2 max-h-48 overflow-auto rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700 whitespace-pre-wrap dark:bg-zinc-800 dark:text-zinc-300">
                    {asset.lyrics}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* 권리 */}
          <div>
            <SubSection title="권리" />
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
          </div>

          {/* 프리뷰 */}
          <div>
            <SubSection title="프리뷰 & 가용성" />
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
            </FieldGrid>
          </div>

          {/* 비디오 */}
          {(asset.hasMusicVideo || asset.musicVideoIsrc) && (
            <div>
              <SubSection title="비디오" />
              <FieldGrid>
                <Field label="Has Music Video" value={asset.hasMusicVideo} />
                <Field label="Music Video ISRC" value={asset.musicVideoIsrc} mono />
              </FieldGrid>
            </div>
          )}

          {/* 기타 */}
          {(asset.tags?.length > 0 || asset.extraFields) && (
            <div>
              <SubSection title="기타" />
              {asset.tags?.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">Tags</p>
                  <TagPills items={asset.tags} />
                </div>
              )}
              {asset.extraFields && (
                <FieldGrid>
                  {Object.entries(asset.extraFields).map(([k, v]: [string, any]) =>
                    v ? <Field key={k} label={`Extra ${k}`} value={v} /> : null
                  )}
                </FieldGrid>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Fixed Bottom Audio Player ─── */

interface PlayerState {
  url: string;
  trackName: string;
  artistName: string;
  coverUrl?: string;
}

function BottomPlayer({
  player,
  onClose,
}: {
  player: PlayerState | null;
  onClose: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!player) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = player.url;
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [player?.url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play(); setIsPlaying(true); }
  };

  const seek = (val: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = val;
    setCurrentTime(val);
  };

  const changeVolume = (val: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = val;
    setVolume(val);
    setMuted(val === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (muted) { audio.volume = volume || 0.8; setMuted(false); }
    else { audio.volume = 0; setMuted(true); }
  };

  if (!player) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/95 shadow-2xl">
      <audio ref={audioRef} />
      {/* Seek bar — full width at top of player */}
      <div className="px-4 pt-2">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={e => seek(parseFloat(e.target.value))}
          className="w-full h-1 accent-blue-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 px-4 pb-3 pt-1">
        {/* Cover + Info */}
        <div className="flex items-center gap-3 w-52 min-w-0">
          {player.coverUrl
            ? <img src={player.coverUrl} alt="" className="h-10 w-10 rounded-lg object-cover flex-shrink-0 shadow" />
            : <div className="h-10 w-10 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex-shrink-0 flex items-center justify-center">
                <Music className="h-4 w-4 text-zinc-400" />
              </div>
          }
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{player.trackName}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{player.artistName}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 mx-auto">
          <button onClick={togglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow">
            {isPlaying
              ? <Pause className="h-4 w-4" />
              : <Play className="h-4 w-4 ml-0.5" />}
          </button>
        </div>

        {/* Volume + Close */}
        <div className="flex items-center gap-2 w-52 justify-end">
          <button onClick={toggleMute} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={muted ? 0 : volume}
            onChange={e => changeVolume(parseFloat(e.target.value))}
            className="w-20 h-1 accent-blue-500 cursor-pointer"
          />
          <button onClick={onClose} className="ml-2 rounded-full p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Artist Card ─── */

function ArtistCard({ artist, role }: { artist: any; role?: string }) {
  return (
    <div className="group rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-300 hover:shadow-md transition-all dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-300 to-zinc-200 dark:from-zinc-600 dark:to-zinc-700">
          <Mic2 className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{artist.name}</p>
          {role && (
            <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
              role === 'Primary' || artist.primary
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400'
            }`}>
              {artist.primary ? 'Primary' : (role || 'Featuring')}
            </span>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {artist.spotifyUrl && <DspLink url={artist.spotifyUrl} type="spotify" />}
            {artist.appleMusicUrl && <DspLink url={artist.appleMusicUrl} type="apple" />}
          </div>
          {(artist.isni || artist.ipn) && (
            <div className="mt-1.5 flex gap-3">
              {artist.isni && <p className="text-[10px] font-mono text-zinc-400">ISNI: {artist.isni}</p>}
              {artist.ipn && <p className="text-[10px] font-mono text-zinc-400">IPN: {artist.ipn}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── File List Item ─── */

function FileListItem({ name, url, icon: Icon = FileText, size }: {
  name: string; url?: string | null; icon?: any; size?: number;
}) {
  if (!url) return null;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5 hover:border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600 transition-colors">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white dark:bg-zinc-700 shadow-sm border border-zinc-100 dark:border-zinc-600">
        <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{name}</p>
        {size && <p className="text-xs text-zinc-400">{(size / 1024 / 1024).toFixed(1)} MB</p>}
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="flex-shrink-0 rounded-lg p-1.5 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
        <Download className="h-4 w-4" />
      </a>
    </div>
  );
}

/* ─── Main Page ─── */

export default function CatalogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const type = (searchParams.get('type') as 'catalog' | 'submission') || 'catalog';
  const navigate = useNavigate();

  // All hooks before early returns
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [detailAsset, setDetailAsset] = useState<any>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ['catalog-unified-detail', id, type],
    queryFn: () => catalogApi.getUnifiedProduct(id!, type).then(r => r.data),
    enabled: !!id,
  });

  const playTrack = useCallback((url: string, trackName: string, artistName: string, coverUrl?: string) => {
    setPlayerState({ url: toRawUrl(url), trackName, artistName, coverUrl });
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500" />
          <p className="text-sm text-zinc-400">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="flex h-64 items-center justify-center text-zinc-400">프로덕트를 찾을 수 없습니다</div>;
  }

  const p = product as any;
  const marketing = p.marketing || {};
  const files = p.files || {};
  const assets = p.assets || [];
  const audioFiles: any[] = p.audioFiles?.length ? p.audioFiles : (files.audioFiles || []);

  const coverRawUrl = toRawUrl(p.coverImageUrl || files.coverImageUrl || '');

  // Map audio files to track URL by trackId/filename for matching against assets
  const audioFileMap: Record<string, string> = {};
  for (const f of audioFiles) {
    const key = f.trackId || f.fileName || '';
    const rawUrl = toRawUrl(f.dropboxUrl || f.url || '');
    if (key && rawUrl) audioFileMap[key] = rawUrl;
  }

  // Get playable URL for an asset
  const getAssetAudioUrl = (asset: any): string | null => {
    // Try matching by isrc, id, fileName patterns
    const candidates = [asset.isrc, asset.id, asset.name, `${asset.sequence}`];
    for (const key of candidates) {
      if (key && audioFileMap[key]) return audioFileMap[key];
    }
    // Fallback: use index match
    const idx = assets.indexOf(asset);
    if (idx >= 0 && audioFiles[idx]) {
      return toRawUrl(audioFiles[idx].dropboxUrl || audioFiles[idx].url || '');
    }
    return null;
  };

  const firstTrackUrl = audioFiles.length > 0
    ? toRawUrl(audioFiles[0].dropboxUrl || audioFiles[0].url || '')
    : null;

  const year = p.consumerReleaseDate
    ? new Date(p.consumerReleaseDate).getFullYear()
    : p.copyrightYear || p.productionYear;

  return (
    <div className="space-y-5 pb-32">
      {/* Track Detail Modal */}
      {detailAsset && (
        <TrackDetailModal asset={detailAsset} onClose={() => setDetailAsset(null)} />
      )}

      {/* Bottom Audio Player */}
      <BottomPlayer player={playerState} onClose={() => setPlayerState(null)} />

      {/* Back button */}
      <button
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
        onClick={() => navigate('/admin/catalog')}
      >
        <ArrowLeft className="h-4 w-4" /> 카탈로그로 돌아가기
      </button>

      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden rounded-2xl">
        {/* Gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-700 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-800" />
        {/* Blurred cover as background */}
        {coverRawUrl && (
          <div
            className="absolute inset-0 opacity-20 bg-cover bg-center"
            style={{ backgroundImage: `url(${coverRawUrl})`, filter: 'blur(24px)', transform: 'scale(1.1)' }}
          />
        )}
        <div className="relative px-6 py-8 flex flex-col sm:flex-row items-start sm:items-end gap-6">
          {/* Cover Art */}
          <div className="flex-shrink-0">
            {coverRawUrl
              ? <img src={coverRawUrl} alt={p.name} className="h-52 w-52 rounded-xl object-cover shadow-2xl ring-1 ring-white/10" />
              : <div className="h-52 w-52 rounded-xl bg-zinc-700 shadow-2xl flex items-center justify-center ring-1 ring-white/10">
                  <Disc3 className="h-16 w-16 text-zinc-500" />
                </div>
            }
          </div>

          {/* Metadata */}
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {p.state && <StateTag state={p.state} />}
              {p.submissionStatus && <StatusTag status={p.submissionStatus} />}
              <SourceBadge source={p.source} />
            </div>

            <h1 className="text-3xl font-bold text-white leading-tight line-clamp-2">
              {p.name}
              {p.releaseVersion && (
                <span className="ml-2 text-xl font-normal text-zinc-400">({p.releaseVersion})</span>
              )}
            </h1>
            <p className="mt-1 text-lg text-zinc-300">{p.displayArtist}</p>
            <p className="mt-0.5 text-sm text-zinc-400">
              {[p.label, p.releaseFormatType || p.albumType, year].filter(Boolean).join(' · ')}
            </p>

            {/* Quick actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              {firstTrackUrl && (
                <button
                  onClick={() => playTrack(firstTrackUrl, assets[0]?.name || 'Track 1', p.displayArtist, coverRawUrl)}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors shadow"
                >
                  <Play className="h-4 w-4 fill-zinc-900" /> Play
                </button>
              )}
              {(p.coverImageUrl || files.coverImageUrl) && (
                <a
                  href={p.coverImageUrl || files.coverImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                  <Download className="h-4 w-4" /> Download Cover
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── TRACKLIST ── */}
      <Section title={`트랙 (${assets.length})`} icon={Music} accent="bg-blue-100 dark:bg-blue-900/30">
        {assets.length === 0 && (
          <p className="text-sm text-zinc-400 text-center py-4">트랙 정보가 없습니다</p>
        )}
        <div className="-mx-5 -mb-5">
          {/* Header row */}
          {assets.length > 0 && (
            <div className="grid grid-cols-[2.5rem_1fr_4.5rem_2.5rem] items-center gap-2 px-5 py-2 border-b border-zinc-100 dark:border-zinc-700/60">
              <span className="text-[11px] font-semibold text-zinc-400 text-center">#</span>
              <span className="text-[11px] font-semibold text-zinc-400">Title</span>
              <span className="text-[11px] font-semibold text-zinc-400 text-right">Duration</span>
              <span />
            </div>
          )}
          {assets.map((asset: any, i: number) => {
            const audioUrl = getAssetAudioUrl(asset);
            const isActive = playerState?.url === (audioUrl ? toRawUrl(audioUrl) : null);
            const title = asset.version ? `${asset.name} (${asset.version})` : asset.name;

            return (
              <div
                key={asset.id || i}
                className={`group grid grid-cols-[2.5rem_1fr_4.5rem_2.5rem] items-center gap-2 px-5 py-3 border-b border-zinc-50 last:border-0 hover:bg-zinc-50 dark:border-zinc-700/30 dark:hover:bg-zinc-700/20 transition-colors cursor-pointer ${
                  isActive ? 'border-l-2 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10 pl-[18px]' : ''
                }`}
                onClick={() => setDetailAsset(asset)}
              >
                {/* Track number or playing indicator */}
                <span className={`text-sm text-center font-mono ${isActive ? 'text-blue-500' : 'text-zinc-400'}`}>
                  {isActive
                    ? <span className="flex justify-center"><span className="inline-block h-3 w-3 animate-pulse rounded-full bg-blue-500" /></span>
                    : asset.sequence || i + 1}
                </span>

                {/* Title + ISRC */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className={`text-sm font-medium truncate ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                      {title}
                    </p>
                    {asset.isTitleTrack && (
                      <span className="rounded-sm bg-blue-100 px-1 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">TITLE</span>
                    )}
                    {asset.isFocusTrack && (
                      <span className="rounded-sm bg-violet-100 px-1 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">FOCUS</span>
                    )}
                  </div>
                  {asset.isrc && (
                    <p className="text-[10px] font-mono text-zinc-400 mt-0.5">ISRC: {asset.isrc}</p>
                  )}
                </div>

                {/* Duration */}
                <span className="text-sm text-zinc-400 text-right tabular-nums">
                  {formatDuration(asset.duration)}
                </span>

                {/* Play button (visible on hover or when audio available) */}
                <div className="flex justify-center">
                  {audioUrl && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (isActive && playerState) {
                          setPlayerState(null);
                        } else {
                          playTrack(audioUrl, asset.name, asset.displayArtist || p.displayArtist, coverRawUrl);
                        }
                      }}
                      className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                        isActive
                          ? 'bg-blue-500 text-white opacity-100'
                          : 'bg-zinc-200 text-zinc-600 opacity-0 group-hover:opacity-100 dark:bg-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      {isActive
                        ? <Pause className="h-3 w-3" />
                        : <Play className="h-3 w-3 ml-0.5" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── ARTISTS ── */}
      <Section title="아티스트" icon={Users} accent="bg-violet-100 dark:bg-violet-900/30">
        {/* Primary + Featuring artists as cards */}
        {(p.artists?.length > 0 || p.albumFeaturingArtists?.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {p.artists?.map((artist: any, i: number) => (
              <ArtistCard key={i} artist={artist} role="Primary" />
            ))}
            {p.albumFeaturingArtists?.map((artist: any, i: number) => (
              <ArtistCard key={`feat-${i}`} artist={typeof artist === 'object' ? artist : { name: artist }} role="Featuring" />
            ))}
          </div>
        )}

        {/* Artist extended metadata */}
        <FieldGrid>
          <Field label="Artist Type" value={p.artistType} />
          <Field label="Spotify ID" value={p.spotifyId} mono />
          <Field label="Apple Music ID" value={p.appleMusicId} mono />
          <Field label="YouTube Channel ID" value={p.youtubeChannelId} mono />
          <Field label="Country of Origin" value={p.artists?.[0]?.countryOfOrigin} />
          <Field label="Booking Agent" value={p.artists?.[0]?.bookingAgent} />
          <Field label="YouTube OAC" value={p.artists?.[0]?.youtubeOac} />
        </FieldGrid>

        {p.biography && (
          <div className="mt-4">
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-1">Biography</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{p.biography}</p>
          </div>
        )}

        {p.socialLinks && Object.keys(p.socialLinks).length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Social Links</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(p.socialLinks).map(([platform, url]) =>
                url && (
                  <a key={platform} href={url as string} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600 transition-colors">
                    {platform} <ExternalLink className="h-3 w-3" />
                  </a>
                )
              )}
            </div>
          </div>
        )}
      </Section>

      {/* ── RELEASE INFO — Categorized ── */}
      <Section title="릴리스 정보" icon={Disc3} accent="bg-amber-100 dark:bg-amber-900/30">
        {/* 기본 정보 */}
        <SubSection title="기본 정보" />
        <FieldGrid>
          <Field label="UPC" value={p.upc} mono />
          <Field label="Catalog Number" value={p.catalogNumber} mono />
          <Field label="FUGA ID" value={p.fugaId} mono />
          <Field label="EAN" value={p.ean} mono />
          <Field label="Release Date" value={p.consumerReleaseDate?.split?.('T')?.[0] || p.consumerReleaseDate} />
          <Field label="Original Release Date" value={p.originalReleaseDate?.split?.('T')?.[0] || p.originalReleaseDate} />
          <Field label="Release Time" value={p.releaseTime} />
          <Field label="Timezone" value={p.timezone} />
          <Field label="Pre-order Date" value={p.preorderDate} />
          <Field label="Recording Year" value={p.recordingYear} />
          <Field label="Recording Location" value={p.recordingLocation} />
          <Field label="Added Date" value={p.addedDate} />
          <Field label="Synced At" value={p.syncedAt ? new Date(p.syncedAt).toLocaleString('ko-KR') : undefined} />
          <Field label="Created At" value={p.createdAt ? new Date(p.createdAt).toLocaleString('ko-KR') : undefined} />
        </FieldGrid>

        {/* 장르 & 언어 */}
        <SubSection title="장르 & 언어" />
        <FieldGrid>
          <Field label="Genre" value={p.genre?.name || p.genre} />
          <Field label="Subgenre" value={p.subgenre?.name || p.subgenre} />
          <Field label="Secondary Genre" value={p.secondaryGenre?.name || p.secondaryGenre} />
          <Field label="Secondary Subgenre" value={p.secondarySubgenre?.name || p.secondarySubgenre} />
          <Field label="Alternate Genre" value={p.alternateGenre?.name} />
          <Field label="Alternate Subgenre" value={p.alternateSubgenre?.name} />
          <Field label="Language" value={p.language} />
          <Field label="Metadata Language" value={p.metadataLanguage} />
          <Field label="Recording Language" value={p.recordingLanguage} />
          <Field label="Recording Country" value={p.recordingCountry} />
        </FieldGrid>

        {/* 권리 */}
        <SubSection title="권리" />
        <FieldGrid>
          <Field label="© Line" value={p.cLineText} />
          <Field label="Copyright Holder" value={p.copyrightHolder} />
          <Field label="Copyright Year" value={p.copyrightYear} />
          <Field label="℗ Line" value={p.pLineText} />
          <Field label="Production Holder" value={p.productionHolder} />
          <Field label="Production Year" value={p.productionYear || p.pLineYear} />
          <Field label="Courtesy Line" value={p.courtesyLine} />
          <Field label="Label Copy Info" value={p.labelCopyInfo} />
          <Field label="Album Notes" value={p.albumNotes} />
        </FieldGrid>

        {/* 배포 */}
        <SubSection title="배포" />
        <FieldGrid>
          <Field label="Territory Type" value={p.territoryType} />
          <Field label="Territories" value={Array.isArray(p.territories) ? p.territories.join(', ') : p.territories} />
          <Field label="Is Compilation" value={p.isCompilation} />
          <Field label="Product Type" value={p.productType} />
          <Field label="Release Format" value={p.releaseFormatType} />
          <Field label="Total Volumes" value={p.totalVolumes} />
          <Field label="Price Type" value={p.priceType} />
          <Field label="Catalog Tier" value={p.catalogTier} />
          <Field label="Pre-order" value={p.preorder} />
          <Field label="Previously Released" value={p.previouslyReleased} />
          <Field label="Motion Artwork" value={p.motionArtwork} />
          <Field label="YouTube Shorts Previews" value={p.youtubeShortsPreview} />
          <Field label="Parental Advisory" value={p.parentalAdvisory} />
          <Field label="Explicit Content" value={p.explicitContent} />
          <Field label="Suborg" value={Array.isArray(p.suborg) ? p.suborg.join(', ') : p.suborg} />
        </FieldGrid>

        {/* Extra Fields */}
        {p.extraFields && (
          <>
            <SubSection title="Extra Fields" />
            <FieldGrid>
              {Object.entries(p.extraFields).map(([key, val]: [string, any]) =>
                val ? <Field key={key} label={`Extra ${key}`} value={val} /> : null
              )}
            </FieldGrid>
          </>
        )}

        {/* Tags */}
        {p.productTags?.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-1.5">Tags</p>
            <TagPills items={p.productTags} />
          </div>
        )}
      </Section>

      {/* ── DELIVERY INSTRUCTIONS ── */}
      {p.deliveryInstructions && (
        <Section title="배포 상태" icon={Send} defaultOpen={false} accent="bg-emerald-100 dark:bg-emerald-900/30">
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-700">
                  <th className="px-5 py-2 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">DSP</th>
                  <th className="px-5 py-2 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Release Date</th>
                  <th className="px-5 py-2 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(p.deliveryInstructions) ? p.deliveryInstructions : []).map((d: any, i: number) => (
                  <tr key={i} className="border-b border-zinc-50 dark:border-zinc-700/50 hover:bg-zinc-50 dark:hover:bg-zinc-700/20 transition-colors">
                    <td className="px-5 py-2.5 font-medium text-zinc-800 dark:text-zinc-200">{d.dsp || d.name}</td>
                    <td className="px-5 py-2.5 text-zinc-500 dark:text-zinc-400">{d.releaseDate || d.release_date}</td>
                    <td className="px-5 py-2.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        (d.status || '').toLowerCase().includes('delivered') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        (d.status || '').toLowerCase().includes('cancelled') ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>{d.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ── MARKETING ── */}
      <Section title="마케팅" icon={MessageSquare} defaultOpen={false} accent="bg-pink-100 dark:bg-pink-900/30">
        <FieldGrid>
          <Field label="Project Type" value={marketing.projectType} />
          <Field label="Priority Level" value={marketing.priorityLevel} />
          <Field label="Target Audience" value={marketing.targetAudience} />
          <Field label="Similar Artists" value={marketing.similarArtists} />
          <Field label="Marketing Keywords" value={marketing.marketingKeywords} />
          <Field label="Artist Gender" value={marketing.artistGender} />
        </FieldGrid>

        {marketing.hook && (
          <div className="mt-4 rounded-xl bg-zinc-50 dark:bg-zinc-700/40 px-4 py-3">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">Hook</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{marketing.hook}</p>
          </div>
        )}
        {marketing.mainPitch && (
          <div className="mt-3 rounded-xl bg-zinc-50 dark:bg-zinc-700/40 px-4 py-3">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">Main Pitch</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{marketing.mainPitch}</p>
          </div>
        )}
        {(p.albumIntroduction || marketing.albumIntroduction) && (
          <div className="mt-3 rounded-xl bg-zinc-50 dark:bg-zinc-700/40 px-4 py-3">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">Album Introduction</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{p.albumIntroduction || marketing.albumIntroduction}</p>
          </div>
        )}
        {(p.albumDescription || marketing.albumDescription) && (
          <div className="mt-3 rounded-xl bg-zinc-50 dark:bg-zinc-700/40 px-4 py-3">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">Album Description</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{p.albumDescription || marketing.albumDescription}</p>
          </div>
        )}

        {(marketing.moods?.length > 0 || marketing.instruments?.length > 0) && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {marketing.moods?.length > 0 && (
              <div>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-1.5">Moods</p>
                <TagPills items={marketing.moods} />
              </div>
            )}
            {marketing.instruments?.length > 0 && (
              <div>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-1.5">Instruments</p>
                <TagPills items={marketing.instruments} />
              </div>
            )}
          </div>
        )}

        {(marketing.marketingDrivers || marketing.socialMediaPlan || marketing.campaignGoals || marketing.promotionPlans) && (
          <div className="mt-4 space-y-3">
            {marketing.marketingDrivers && (
              <Field label="Marketing Drivers" value={typeof marketing.marketingDrivers === 'string' ? marketing.marketingDrivers : JSON.stringify(marketing.marketingDrivers)} />
            )}
            {marketing.socialMediaPlan && (
              <Field label="Social Media Plan" value={marketing.socialMediaPlan} />
            )}
            {marketing.campaignGoals && (
              <Field label="Campaign Goals" value={typeof marketing.campaignGoals === 'string' ? marketing.campaignGoals : JSON.stringify(marketing.campaignGoals)} />
            )}
            {marketing.promotionPlans && <Field label="Promotion Plans" value={marketing.promotionPlans} />}
            {marketing.syncHistory && <Field label="Sync History" value={marketing.syncHistory} />}
            {marketing.artistBio && <Field label="Artist Bio" value={marketing.artistBio} />}
          </div>
        )}

        {/* Social URLs */}
        {(marketing.youtubeUrl || marketing.youtube || marketing.tiktokUrl || marketing.tiktok ||
          marketing.xUrl || marketing.twitter || marketing.twitchUrl || marketing.twitch ||
          marketing.threadsUrl || marketing.threads || marketing.soundcloudUrl || marketing.soundcloud ||
          marketing.facebookUrl || marketing.facebook || marketing.instagramUrl || marketing.instagram) && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Social Links</p>
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
        )}
      </Section>

      {/* ── FILES & MEDIA ── */}
      <Section title="파일 & 미디어" icon={FolderOpen} defaultOpen={false} accent="bg-cyan-100 dark:bg-cyan-900/30">
        {/* Cover Art */}
        {coverRawUrl && (
          <div className="mb-5">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Cover Art</p>
            <div className="flex items-start gap-4">
              <img src={coverRawUrl} alt="Cover" className="h-24 w-24 rounded-xl object-cover shadow border border-zinc-200 dark:border-zinc-700" />
              <div className="flex flex-col gap-1 pt-1">
                <a href={p.coverImageUrl || files.coverImageUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-500 hover:underline">
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Media files */}
        {(p.artistPhotoUrl || files.artistPhotoUrl || p.motionArtUrl || files.motionArtUrl ||
          p.musicVideoUrl || files.musicVideoUrl) && (
          <div className="mb-4 space-y-2">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Media</p>
            <FileListItem name="Artist Photo" url={p.artistPhotoUrl || files.artistPhotoUrl} icon={ImageIcon} />
            <FileListItem name="Motion Art" url={p.motionArtUrl || files.motionArtUrl} icon={Film} />
            <FileListItem name="Music Video" url={p.musicVideoUrl || files.musicVideoUrl} icon={Video} />
          </div>
        )}

        {/* Dolby Atmos */}
        {files.dolbyAtmosFiles?.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Dolby Atmos Files</p>
            <div className="space-y-1.5">
              {files.dolbyAtmosFiles.map((f: any, i: number) => (
                <FileListItem key={i} name={f.fileName || `Dolby Atmos ${i + 1}`} url={f.url || f.dropboxUrl} icon={Headphones} size={f.fileSize} />
              ))}
            </div>
          </div>
        )}

        {/* Lyrics Files */}
        {files.lyricsFiles?.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Lyrics Files</p>
            <div className="space-y-1.5">
              {files.lyricsFiles.map((f: any, i: number) => (
                <FileListItem key={i} name={f.fileName || `Lyrics ${i + 1}`} url={f.url || f.dropboxUrl} icon={FileText} />
              ))}
            </div>
          </div>
        )}

        {/* Music Video Files */}
        {files.musicVideoFiles?.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Music Video Files</p>
            <div className="space-y-1.5">
              {files.musicVideoFiles.map((f: any, i: number) => (
                <FileListItem key={i} name={f.fileName || `MV ${i + 1}`} url={f.url || f.dropboxUrl} icon={Video} size={f.fileSize} />
              ))}
            </div>
          </div>
        )}

        {/* Music Video Thumbnails */}
        {files.musicVideoThumbnails?.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">MV Thumbnails</p>
            <div className="space-y-1.5">
              {files.musicVideoThumbnails.map((f: any, i: number) => (
                <FileListItem key={i} name={f.fileName || `Thumbnail ${i + 1}`} url={f.url || f.dropboxUrl} icon={ImageIcon} />
              ))}
            </div>
          </div>
        )}

        {/* Additional Files */}
        {files.additionalFiles?.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Additional Files</p>
            <div className="space-y-1.5">
              {files.additionalFiles.map((f: any, i: number) => (
                <FileListItem key={i} name={f.fileName || `File ${i + 1}`} url={f.url || f.dropboxUrl} icon={FolderOpen} size={f.fileSize} />
              ))}
            </div>
          </div>
        )}

        {Object.keys(files).length === 0 && !p.coverImageUrl && (
          <p className="text-sm text-zinc-400 text-center py-4">파일 정보가 없습니다</p>
        )}
      </Section>

      {/* ── SUBMISSION INFO ── */}
      <Section title="제출 정보" icon={ClipboardList} defaultOpen={false} accent="bg-zinc-100 dark:bg-zinc-700/50">
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
          <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 px-4 py-3">
            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">Admin Notes</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{p.adminNotes}</p>
          </div>
        )}
      </Section>
    </div>
  );
}
