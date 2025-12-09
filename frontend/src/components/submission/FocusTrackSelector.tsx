import { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { clsx } from 'clsx';
import { Star, GripVertical, Music, TrendingUp, Info } from 'lucide-react';

interface Track {
  id: string;
  titleKo: string;
  titleEn: string;
  artists: string[];
  isTitle: boolean;
  isFocusTrack?: boolean;
  promotionPriority?: number;
}

interface FocusTrackSelectorProps {
  tracks: Track[];
  value: string[]; // Array of track IDs selected as focus tracks
  onChange: (value: string[]) => void;
  onPriorityChange?: (trackId: string, priority: number) => void;
  maxSelections?: number;
  className?: string;
}

export function FocusTrackSelector({
  tracks,
  value = [],
  onChange,
  onPriorityChange,
  maxSelections = 3,
  className
}: FocusTrackSelectorProps) {
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);

  const selectedTracks = value
    .map(id => tracks.find(t => t.id === id))
    .filter(Boolean) as Track[];

  const availableTracks = tracks.filter(t => !value.includes(t.id));

  const handleToggle = (trackId: string) => {
    if (value.includes(trackId)) {
      // Remove from focus tracks
      onChange(value.filter(id => id !== trackId));
    } else {
      // Add to focus tracks (if not at max)
      if (value.length < maxSelections) {
        onChange([...value, trackId]);
        // Set priority as next number
        if (onPriorityChange) {
          onPriorityChange(trackId, value.length + 1);
        }
      }
    }
  };

  const handleReorder = (newOrder: Track[]) => {
    const newValue = newOrder.map(t => t.id);
    onChange(newValue);

    // Update priorities based on new order
    if (onPriorityChange) {
      newOrder.forEach((track, index) => {
        onPriorityChange(track.id, index + 1);
      });
    }
  };

  const isMaxReached = value.length >= maxSelections;

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-purple-400" />
          Select Focus Track(s)
        </h3>
        <div className="flex items-start gap-2 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-200">
            Focus tracks are promoted separately to playlists and DSP editors.
            Select up to {maxSelections} tracks and drag to reorder by priority.
          </p>
        </div>
      </div>

      {/* Selected Focus Tracks (Reorderable) */}
      {selectedTracks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-400 uppercase">
              Focus Tracks ({selectedTracks.length}/{maxSelections})
            </h4>
            <span className="text-xs text-gray-500">
              Drag to reorder priority
            </span>
          </div>

          <Reorder.Group
            axis="y"
            values={selectedTracks}
            onReorder={handleReorder}
            className="space-y-2"
          >
            {selectedTracks.map((track, index) => (
              <Reorder.Item
                key={track.id}
                value={track}
                className="cursor-grab active:cursor-grabbing"
              >
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="
                    flex items-center gap-4 p-4
                    bg-gradient-to-r from-purple-500/20 to-pink-500/20
                    backdrop-blur-md border border-purple-500/30
                    rounded-xl hover:border-purple-500/50 transition-all
                    group
                  "
                >
                  {/* Drag handle */}
                  <GripVertical
                    size={20}
                    className="text-gray-500 group-hover:text-purple-400 transition-colors flex-shrink-0"
                  />

                  {/* Priority badge */}
                  <div className="
                    flex items-center justify-center
                    w-8 h-8 rounded-full
                    bg-purple-500 text-white font-bold text-sm
                    shadow-lg shadow-purple-500/50
                  ">
                    {index + 1}
                  </div>

                  {/* Track info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {track.titleKo}
                      {track.titleEn && track.titleEn !== track.titleKo && (
                        <span className="text-gray-400 ml-2">({track.titleEn})</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-400">
                      {track.artists.join(', ')}
                    </p>
                  </div>

                  {/* Title track badge */}
                  {track.isTitle && (
                    <div className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-400 font-medium">
                      Title
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleToggle(track.id)}
                    className="
                      p-2 rounded-lg
                      bg-red-500/10 hover:bg-red-500/20
                      border border-red-500/30 hover:border-red-500/50
                      text-red-400 hover:text-red-300
                      transition-all
                    "
                    aria-label={`Remove ${track.titleKo} from focus tracks`}
                  >
                    <Star size={18} className="fill-current" />
                  </button>
                </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      )}

      {/* Available Tracks */}
      {availableTracks.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-400 uppercase">
            Available Tracks
          </h4>

          <div className="space-y-2">
            {availableTracks.map((track) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onMouseEnter={() => setHoveredTrack(track.id)}
                onMouseLeave={() => setHoveredTrack(null)}
                className={clsx(
                  'flex items-center gap-4 p-4',
                  'bg-white/5 backdrop-blur-md border border-white/10',
                  'rounded-xl transition-all',
                  hoveredTrack === track.id && 'border-purple-500/30 bg-white/10',
                  isMaxReached && 'opacity-50 cursor-not-allowed'
                )}
              >
                {/* Music icon */}
                <Music size={20} className="text-gray-500 flex-shrink-0" />

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {track.titleKo}
                    {track.titleEn && track.titleEn !== track.titleKo && (
                      <span className="text-gray-400 ml-2">({track.titleEn})</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-400">
                    {track.artists.join(', ')}
                  </p>
                </div>

                {/* Title track badge */}
                {track.isTitle && (
                  <div className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-400 font-medium">
                    Title
                  </div>
                )}

                {/* Add button */}
                <button
                  type="button"
                  onClick={() => handleToggle(track.id)}
                  disabled={isMaxReached}
                  className={clsx(
                    'p-2 rounded-lg transition-all',
                    'border',
                    isMaxReached
                      ? 'bg-gray-500/10 border-gray-500/30 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 hover:border-purple-500/50 text-purple-400 hover:text-purple-300'
                  )}
                  aria-label={`Add ${track.titleKo} as focus track`}
                >
                  <Star size={18} className={clsx(
                    hoveredTrack === track.id && !isMaxReached && 'fill-current'
                  )} />
                </button>
              </motion.div>
            ))}
          </div>

          {isMaxReached && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-yellow-400 text-center mt-2"
            >
              Maximum {maxSelections} focus tracks selected. Remove one to add another.
            </motion.p>
          )}
        </div>
      )}

      {/* Empty state */}
      {tracks.length === 0 && (
        <div className="text-center py-12 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
          <Music size={48} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">No tracks available</p>
          <p className="text-sm text-gray-500 mt-2">
            Add tracks in the previous step to select focus tracks
          </p>
        </div>
      )}

      {/* Skip option */}
      {tracks.length > 0 && value.length === 0 && (
        <p className="text-sm text-gray-500 text-center">
          You can skip this step if you don't want to designate focus tracks
        </p>
      )}
    </div>
  );
}
