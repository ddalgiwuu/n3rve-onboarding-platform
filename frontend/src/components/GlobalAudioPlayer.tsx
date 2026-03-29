import { useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, X, Music } from 'lucide-react';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

function formatTime(seconds: number) {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function GlobalAudioPlayer() {
  const {
    track, isPlaying, currentTime, duration, volume, muted,
    togglePlay, seek, setVolume, toggleMute, close,
  } = useAudioPlayer();

  const seekBarRef = useRef<HTMLDivElement>(null);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = seekBarRef.current;
    if (!bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(percent * duration);
  };

  const handleSeekDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    handleSeekClick(e);
  };

  if (!track) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-zinc-900/95 sm:backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.15)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
      {/* Progress bar */}
      <div
        ref={seekBarRef}
        className="relative w-full h-1.5 group cursor-pointer hover:h-2.5 transition-all duration-150"
        onClick={handleSeekClick}
        onMouseMove={handleSeekDrag}
      >
        <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-700" />
        <div className="absolute inset-y-0 left-0 bg-zinc-300 dark:bg-zinc-600" style={{ width: `${Math.min(progressPercent + 10, 100)}%` }} />
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-blue-500 transition-[width] duration-100" style={{ width: `${progressPercent}%` }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-md border-2 border-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-2.5">
        {/* Cover + Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-none sm:w-60">
          {track.coverUrl
            ? <img src={track.coverUrl} alt="" loading="lazy" className="h-11 w-11 rounded-lg object-cover flex-shrink-0 shadow-md" />
            : <div className="h-11 w-11 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex-shrink-0 flex items-center justify-center">
                <Music className="h-5 w-5 text-zinc-400" />
              </div>
          }
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{track.trackName}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{track.artistName}</p>
          </div>
        </div>

        {/* Center: Controls + Time */}
        <div className="hidden sm:flex flex-col items-center gap-0.5 flex-1">
          <button onClick={togglePlay}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 active:scale-95">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
            <span className="w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
            <span>/</span>
            <span className="w-10 tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Mobile: play button */}
        <div className="sm:hidden">
          <button onClick={togglePlay}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-lg">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>
        </div>

        {/* Volume + Close */}
        <div className="hidden sm:flex items-center gap-2 w-48 justify-end">
          <button onClick={toggleMute} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <div className="relative w-20 h-1 cursor-pointer">
            <div className="absolute inset-0 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <div className="absolute inset-y-0 left-0 rounded-full bg-zinc-400" style={{ width: `${(muted ? 0 : volume) * 100}%` }} />
            <input
              type="range" min={0} max={1} step={0.02}
              value={muted ? 0 : volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
          <button onClick={close} className="ml-1 rounded-full p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile: time + close */}
        <div className="sm:hidden flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
          <span className="tabular-nums">{formatTime(currentTime)}</span>
          <button onClick={close} className="p-1 text-zinc-400"><X className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
