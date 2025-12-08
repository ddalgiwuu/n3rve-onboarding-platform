import { useEffect, useRef, useState } from 'react';

interface ModernWaveformProps {
  waveformData?: number[];
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  onSeek?: (time: number) => void;
  className?: string;
}

/**
 * Modern Waveform - Soft Pastel Professional Design
 * Muted colors, rounded design, sophisticated and clean
 */
export default function ModernWaveform({
  waveformData = [],
  isPlaying = false,
  currentTime = 0,
  duration = 0,
  onSeek,
  className = ''
}: ModernWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Generate realistic waveform pattern
  const normalizedData = waveformData.length > 0
    ? waveformData.slice(0, 50)
    : Array.from({ length: 50 }, (_, i) => {
      const baseAmplitude = Math.sin(i / 5) * 0.3 + 0.5;
      const variation = Math.random() * 0.2;
      return Math.min(Math.max(baseAmplitude + variation, 0.15), 0.95);
    });

  const handleInteraction = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !onSeek || duration === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newTime = (percentage / 100) * duration;
    onSeek(newTime);
  };

  const handleMouseDown = () => setIsDragging(true);

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && containerRef.current && onSeek && duration > 0) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        const newTime = (percentage / 100) * duration;
        onSeek(newTime);
      }
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging, onSeek, duration]);

  return (
    <div
      ref={containerRef}
      className={`
        relative h-14 rounded-lg
        bg-slate-900 dark:bg-slate-950
        border border-slate-700 dark:border-slate-800
        ${onSeek ? 'cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-600' : ''}
        transition-all duration-200
        ${className}
      `}
      onClick={handleInteraction}
      onMouseDown={handleMouseDown}
      onMouseLeave={() => setHoveredBar(null)}
    >
      {/* Progress background - More visible */}
      <div
        className="absolute inset-y-0 left-0 bg-indigo-900/40 dark:bg-indigo-900/60 transition-all duration-300 ease-out rounded-l-lg"
        style={{ width: `${progress}%` }}
      />

      {/* Waveform bars - Simplified and visible */}
      <div className="relative h-full flex items-center gap-0.5 px-2 pt-6 pb-1">
        {normalizedData.map((amplitude, index) => {
          const barProgress = (index / normalizedData.length) * 100;
          const isPassed = barProgress <= progress;
          const isHovered = hoveredBar === index;
          const heightPercent = Math.max(amplitude * 100, 25);

          return (
            <div
              key={index}
              className={`
                flex-1 rounded-sm
                transition-all duration-150
                ${isHovered ? 'scale-110' : 'scale-100'}
              `}
              style={{
                height: `${heightPercent}%`,
                transformOrigin: 'bottom',
                background: isPassed
                  ? 'linear-gradient(to top, rgb(99, 102, 241), rgb(139, 92, 246))'
                  : 'linear-gradient(to top, rgba(99, 102, 241, 0.5), rgba(139, 92, 246, 0.4))'
              }}
              onMouseEnter={() => setHoveredBar(index)}
            />
          );
        })}
      </div>

      {/* Hover indicator - Bright and clear */}
      {hoveredBar !== null && onSeek && (
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-white/80 pointer-events-none shadow-sm"
          style={{ left: `${(hoveredBar / normalizedData.length) * 100}%` }}
        />
      )}

      {/* Time labels - High contrast */}
      {duration > 0 && (
        <div className="absolute top-1.5 left-3 right-3 flex justify-between text-[10px] font-bold pointer-events-none">
          <span className="bg-indigo-500 text-white px-2 py-0.5 rounded shadow-sm">
            {formatTime(currentTime)}
          </span>
          <span className="bg-slate-700 text-white px-2 py-0.5 rounded shadow-sm">
            {formatTime(duration)}
          </span>
        </div>
      )}
    </div>
  );
}

// Helper function
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
