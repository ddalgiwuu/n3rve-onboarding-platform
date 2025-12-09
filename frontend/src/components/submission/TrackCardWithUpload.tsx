import { motion } from 'framer-motion';
import { GripVertical, Trash2, Music2 } from 'lucide-react';
import { clsx } from 'clsx';
import { AudioFileUploader } from './AudioFileUploader';

interface Track {
  id: string;
  titleKo: string;
  titleEn: string;
  composer: string;
  lyricist: string;
  arranger?: string;
  isrc?: string;
  explicitContent: boolean;
  audioFile?: File | string;
}

interface TrackCardWithUploadProps {
  track: Track;
  index: number;
  onUpdate: (id: string, field: string, value: any) => void;
  onRemove: (id: string) => void;
  onAudioUpload: (id: string, file: File | null) => void;
  className?: string;
}

export function TrackCardWithUpload({
  track,
  index,
  onUpdate,
  onRemove,
  onAudioUpload,
  className
}: TrackCardWithUploadProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={clsx(
        'p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl',
        'hover:border-purple-500/30 transition-all',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <GripVertical size={20} className="text-gray-500 cursor-grab active:cursor-grabbing" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm">
              {index + 1}
            </div>
            <h3 className="font-semibold text-white">Track {index + 1}</h3>
          </div>
        </div>

        <button
          onClick={() => onRemove(track.id)}
          className="
            p-2 rounded-lg
            bg-red-500/10 hover:bg-red-500/20
            border border-red-500/30
            text-red-400
            transition-all
          "
          aria-label="Remove track"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Track Info Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Track Metadata */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              트랙명 (한글) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={track.titleKo}
              onChange={(e) => onUpdate(track.id, 'titleKo', e.target.value)}
              className="
                w-full px-4 py-3 rounded-xl
                bg-white/5 border border-white/10
                text-white placeholder-gray-500
                outline-none focus:ring-2 focus:ring-purple-500/50
                transition-all
              "
              placeholder="예: 워크 잇"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Track Title (EN) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={track.titleEn}
              onChange={(e) => onUpdate(track.id, 'titleEn', e.target.value)}
              className="
                w-full px-4 py-3 rounded-xl
                bg-white/5 border border-white/10
                text-white placeholder-gray-500
                outline-none focus:ring-2 focus:ring-purple-500/50
                transition-all
              "
              placeholder="e.g., Work It"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-white mb-2">작곡가</label>
              <input
                type="text"
                value={track.composer}
                onChange={(e) => onUpdate(track.id, 'composer', e.target.value)}
                className="
                  w-full px-4 py-2 rounded-lg
                  bg-white/5 border border-white/10
                  text-white placeholder-gray-500
                  outline-none focus:ring-2 focus:ring-purple-500/50
                  transition-all text-sm
                "
                placeholder="Composer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">작사가</label>
              <input
                type="text"
                value={track.lyricist}
                onChange={(e) => onUpdate(track.id, 'lyricist', e.target.value)}
                className="
                  w-full px-4 py-2 rounded-lg
                  bg-white/5 border border-white/10
                  text-white placeholder-gray-500
                  outline-none focus:ring-2 focus:ring-purple-500/50
                  transition-all text-sm
                "
                placeholder="Lyricist"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">ISRC</label>
            <input
              type="text"
              value={track.isrc || ''}
              onChange={(e) => onUpdate(track.id, 'isrc', e.target.value)}
              className="
                w-full px-4 py-2 rounded-lg
                bg-white/5 border border-white/10
                text-white placeholder-gray-500 font-mono
                outline-none focus:ring-2 focus:ring-purple-500/50
                transition-all text-sm
              "
              placeholder="US-XXX-XX-XXXXX"
            />
          </div>

          <label className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all">
            <input
              type="checkbox"
              checked={track.explicitContent}
              onChange={(e) => onUpdate(track.id, 'explicitContent', e.target.checked)}
              className="w-5 h-5 rounded border-white/20"
            />
            <div>
              <p className="text-white font-medium text-sm">Explicit Content</p>
              <p className="text-xs text-gray-400">Contains explicit lyrics or content</p>
            </div>
          </label>
        </div>

        {/* Right: Audio Upload */}
        <div>
          <AudioFileUploader
            value={track.audioFile || null}
            onChange={(file) => onAudioUpload(track.id, file)}
            trackTitle={track.titleKo || track.titleEn}
            required
          />
        </div>
      </div>
    </motion.div>
  );
}
