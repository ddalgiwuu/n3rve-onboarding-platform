import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

interface PlayerTrack {
  url: string;
  trackName: string;
  artistName: string;
  coverUrl?: string;
}

interface AudioPlayerContextType {
  track: PlayerTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  play: (track: PlayerTrack) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  close: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  return ctx;
}

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [track, setTrack] = useState<PlayerTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);

  // Create audio element once
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = 1;
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  // Track time updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);
    const onError = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, []);

  const play = useCallback(async (newTrack: PlayerTrack) => {
    const audio = audioRef.current;
    if (!audio) return;

    setTrack(newTrack);
    setCurrentTime(0);
    setDuration(0);

    // Resolve Dropbox temporary link
    let streamUrl = newTrack.url;
    try {
      if (newTrack.url.includes('dropbox.com')) {
        const { default: api } = await import('../lib/api');
        const res = await api.get('/catalog/audio/stream-url', {
          params: { url: newTrack.url },
        });
        if (res.data?.url) streamUrl = res.data.url;
      }
    } catch { /* fallback to original */ }

    audio.src = streamUrl;
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play().then(() => setIsPlaying(true)).catch(() => {}); }
  }, [isPlaying]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((vol: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = vol;
    setVolumeState(vol);
    setMuted(vol === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (muted) { audio.volume = volume || 0.8; setMuted(false); }
    else { audio.volume = 0; setMuted(true); }
  }, [muted, volume]);

  const close = useCallback(() => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.src = ''; }
    setTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  return (
    <AudioPlayerContext.Provider value={{
      track, isPlaying, currentTime, duration, volume, muted,
      play, togglePlay, seek, setVolume, toggleMute, close,
    }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}
