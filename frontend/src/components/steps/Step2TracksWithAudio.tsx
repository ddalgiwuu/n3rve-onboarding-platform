import { Reorder } from 'framer-motion';
import { Plus, Music2 } from 'lucide-react';
import { TrackCardWithUpload } from '../submission/TrackCardWithUpload';

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

interface Step2TracksWithAudioProps {
  tracks: Track[];
  onTracksChange: (tracks: Track[]) => void;
  onTrackUpdate: (id: string, field: string, value: any) => void;
  onTrackRemove: (id: string) => void;
  onAudioUpload: (id: string, file: File | null) => void;
}

export function Step2TracksWithAudio({
  tracks,
  onTracksChange,
  onTrackUpdate,
  onTrackRemove,
  onAudioUpload
}: Step2TracksWithAudioProps) {
  const handleAddTrack = () => {
    const newTrack: Track = {
      id: `track-${Date.now()}`,
      titleKo: '',
      titleEn: '',
      composer: '',
      lyricist: '',
      explicitContent: false
    };

    onTracksChange([...tracks, newTrack]);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">트랙 정보</h2>
        <p className="text-gray-400">각 트랙의 정보와 오디오 파일을 입력하세요</p>
      </div>

      {/* Tracks List */}
      {tracks.length > 0 ? (
        <Reorder.Group
          axis="y"
          values={tracks}
          onReorder={onTracksChange}
          className="space-y-4"
        >
          {tracks.map((track, index) => (
            <Reorder.Item key={track.id} value={track}>
              <TrackCardWithUpload
                track={track}
                index={index}
                onUpdate={onTrackUpdate}
                onRemove={onTrackRemove}
                onAudioUpload={onAudioUpload}
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : (
        <div className="text-center py-16 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
          <Music2 size={48} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 mb-6">트랙이 없습니다</p>
        </div>
      )}

      {/* Add Track Button */}
      <button
        onClick={handleAddTrack}
        className="
          w-full flex items-center justify-center gap-2
          px-6 py-4 rounded-xl
          bg-white/5 hover:bg-white/10
          border-2 border-dashed border-white/20 hover:border-purple-500/50
          text-white font-medium
          transition-all
        "
      >
        <Plus size={20} />
        트랙 추가
      </button>

      {/* Helper text */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <p className="text-sm text-blue-200">
          💡 Tip: 드래그하여 트랙 순서를 변경할 수 있습니다
        </p>
      </div>
    </div>
  );
}
