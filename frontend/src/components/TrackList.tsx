import { useState, useEffect } from 'react'
import { Plus, Music, AlertCircle, Info, Upload, Download } from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'
import TrackForm from './TrackForm'
import { v4 as uuidv4 } from 'uuid'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import {
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface TrackArtist {
  id: string
  name: string
  type: 'primary' | 'featuring'
  translations: Array<{ id: string; language: string; name: string }>
  identifiers: Array<{ type: string; value: string; url?: string }>
  isNewArtist: boolean
}

interface Track {
  id: string
  number: number
  title: string
  version?: string
  isrc?: string
  duration?: string
  explicit: boolean
  artists: TrackArtist[]
  contributors: any[]
  isDolbyAtmos?: boolean
  isTrackPreview?: boolean
  musicVideos?: any[]
}

interface TrackListProps {
  tracks: Track[]
  albumArtists: TrackArtist[]
  releaseType: 'Single' | 'EP' | 'Album' | 'Compilation'
  onUpdate: (tracks: Track[]) => void
}

export default function TrackList({ tracks, albumArtists, releaseType, onUpdate }: TrackListProps) {
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const [localTracks, setLocalTracks] = useState<Track[]>(tracks)

  useEffect(() => {
    setLocalTracks(tracks)
  }, [tracks])

  // Get track count limits based on release type
  const getTrackLimits = () => {
    switch (releaseType) {
      case 'Single':
        return { min: 1, max: 3, description: t('1-3 트랙', '1-3 tracks') }
      case 'EP':
        return { min: 4, max: 6, description: t('4-6 트랙', '4-6 tracks') }
      case 'Album':
        return { min: 7, max: 999, description: t('7개 이상 트랙', '7+ tracks') }
      case 'Compilation':
        return { min: 1, max: 999, description: t('제한 없음', 'No limit') }
      default:
        return { min: 1, max: 999, description: '' }
    }
  }

  const limits = getTrackLimits()

  // Add new track
  const addTrack = () => {
    const newTrack: Track = {
      id: uuidv4(),
      number: localTracks.length + 1,
      title: '',
      explicit: false,
      artists: albumArtists.map(artist => ({
        ...artist,
        type: 'primary' as const
      })),
      contributors: [],
      musicVideos: []
    }
    const updatedTracks = [...localTracks, newTrack]
    setLocalTracks(updatedTracks)
    onUpdate(updatedTracks)
  }

  // Update track
  const updateTrack = (updatedTrack: Track) => {
    const updatedTracks = localTracks.map(track => 
      track.id === updatedTrack.id ? updatedTrack : track
    )
    setLocalTracks(updatedTracks)
    onUpdate(updatedTracks)
  }

  // Delete track
  const deleteTrack = (trackId: string) => {
    if (localTracks.length <= limits.min) {
      alert(t(
        `${releaseType}는 최소 ${limits.min}개의 트랙이 필요합니다`,
        `${releaseType} requires at least ${limits.min} tracks`
      ))
      return
    }

    const updatedTracks = localTracks
      .filter(track => track.id !== trackId)
      .map((track, index) => ({ ...track, number: index + 1 }))
    
    setLocalTracks(updatedTracks)
    onUpdate(updatedTracks)
  }

  // Handle drag and drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = localTracks.findIndex(track => track.id === active.id)
    const newIndex = localTracks.findIndex(track => track.id === over.id)

    const reorderedTracks = arrayMove(localTracks, oldIndex, newIndex).map((track, index) => ({
      ...track,
      number: index + 1
    }))

    setLocalTracks(reorderedTracks)
    onUpdate(reorderedTracks)
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Calculate total duration
  const totalDuration = localTracks.reduce((sum, track) => {
    return sum + (track.duration ? parseInt(track.duration) : 0)
  }, 0)

  const formatTotalDuration = () => {
    const hours = Math.floor(totalDuration / 3600)
    const minutes = Math.floor((totalDuration % 3600) / 60)
    const seconds = totalDuration % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Validation warnings
  const getValidationWarnings = () => {
    const warnings = []
    
    if (localTracks.length < limits.min) {
      warnings.push(t(
        `${releaseType}는 최소 ${limits.min}개의 트랙이 필요합니다`,
        `${releaseType} requires at least ${limits.min} tracks`
      ))
    }
    
    if (releaseType !== 'Compilation' && localTracks.length > limits.max) {
      warnings.push(t(
        `${releaseType}는 최대 ${limits.max}개의 트랙만 가능합니다`,
        `${releaseType} can have maximum ${limits.max} tracks`
      ))
    }

    const tracksWithoutTitle = localTracks.filter(t => !t.title).length
    if (tracksWithoutTitle > 0) {
      warnings.push(t(
        `${tracksWithoutTitle}개 트랙의 제목이 없습니다`,
        `${tracksWithoutTitle} tracks are missing titles`
      ))
    }

    const tracksWithoutArtists = localTracks.filter(t => t.artists.length === 0).length
    if (tracksWithoutArtists > 0) {
      warnings.push(t(
        `${tracksWithoutArtists}개 트랙의 아티스트가 없습니다`,
        `${tracksWithoutArtists} tracks are missing artists`
      ))
    }

    return warnings
  }

  const warnings = getValidationWarnings()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Music className="w-5 h-5" />
            {t('트랙 목록', 'Track List')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {releaseType} • {limits.description} • {t('현재', 'Current')}: {localTracks.length} {t('트랙', 'tracks')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {}}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {t('트랙 가져오기', 'Import Tracks')}
          </button>
          <button
            onClick={addTrack}
            disabled={localTracks.length >= limits.max && releaseType !== 'Compilation'}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('트랙 추가', 'Add Track')}
          </button>
        </div>
      </div>

      {/* Validation Warnings */}
      {warnings.length > 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="space-y-1">
              {warnings.map((warning, idx) => (
                <p key={idx} className="text-sm text-yellow-800 dark:text-yellow-200">
                  {warning}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Track List */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={localTracks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {localTracks.map((track) => (
              <SortableTrackItem
                key={track.id}
                track={track}
                albumArtists={albumArtists}
                onUpdate={updateTrack}
                onDelete={deleteTrack}
                totalTracks={localTracks.length}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Summary */}
      {localTracks.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">{t('총 트랙 수', 'Total Tracks')}</p>
              <p className="font-medium">{localTracks.length}</p>
            </div>
            <div>
              <p className="text-gray-500">{t('총 재생 시간', 'Total Duration')}</p>
              <p className="font-medium">{formatTotalDuration()}</p>
            </div>
            <div>
              <p className="text-gray-500">{t('명시적 콘텐츠', 'Explicit Content')}</p>
              <p className="font-medium">
                {localTracks.filter(t => t.explicit).length} {t('트랙', 'tracks')}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Dolby Atmos</p>
              <p className="font-medium">
                {localTracks.filter(t => t.isDolbyAtmos).length} {t('트랙', 'tracks')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Help Info */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
            <p className="font-medium">{t('트랙 관리 안내', 'Track Management Guide')}</p>
            <ul className="space-y-1 ml-4">
              <li>• {t('드래그 & 드롭으로 트랙 순서를 변경할 수 있습니다', 'Drag & drop to reorder tracks')}</li>
              <li>• {t('앨범 아티스트는 모든 트랙에 자동 적용됩니다', 'Album artists are automatically applied to all tracks')}</li>
              <li>• {t('트랙별로 추가 아티스트와 기여자를 설정할 수 있습니다', 'You can add additional artists and contributors per track')}</li>
              <li>• {t('ISRC 코드는 트랙별로 고유해야 합니다', 'ISRC codes must be unique per track')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Sortable Track Item Component
interface SortableTrackItemProps {
  track: Track
  albumArtists: TrackArtist[]
  onUpdate: (track: Track) => void
  onDelete: (trackId: string) => void
  totalTracks: number
}

function SortableTrackItem({ track, albumArtists, onUpdate, onDelete, totalTracks }: SortableTrackItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: track.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? 'shadow-lg' : ''}
    >
      <TrackForm
        track={track}
        albumArtists={albumArtists}
        onUpdate={onUpdate}
        onDelete={onDelete}
        totalTracks={totalTracks}
      />
    </div>
  )
}