import { useState, useEffect } from 'react'
import { 
  Music, Users, Clock, ChevronDown, ChevronUp, 
  Trash2, Edit2, Check, X,
  Mic, Languages, Link as LinkIcon, Info, Video
} from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'
import ContributorForm from './ContributorForm'
import ArtistSelector from './ArtistSelector'
import MusicVideoForm from './MusicVideoForm'
import { v4 as uuidv4 } from 'uuid'

interface TrackArtist {
  id: string
  name: string
  type: 'primary' | 'featuring'
  translations: Array<{ id: string; language: string; name: string }>
  identifiers: Array<{ type: string; value: string; url?: string }>
  isNewArtist: boolean
}

interface TrackContributor {
  id: string
  name: string
  roles: string[]
  instruments: string[]
  translations: Array<{ id: string; language: string; name: string }>
  identifiers: Array<{ type: string; value: string; url?: string }>
}

interface MusicVideo {
  id: string
  title: string
  version?: string
  audioISRC: string
  videoISRC?: string
  duration?: string
  explicit: boolean
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
  contributors: TrackContributor[]
  isDolbyAtmos?: boolean
  isTrackPreview?: boolean
  musicVideos?: MusicVideo[]
}

interface TrackFormProps {
  track: Track
  albumArtists: TrackArtist[] // Primary artists from album level
  onUpdate: (track: Track) => void
  onDelete: (trackId: string) => void
  totalTracks: number
}

export default function TrackForm({ track, albumArtists, onUpdate, onDelete, totalTracks }: TrackFormProps) {
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [localTrack, setLocalTrack] = useState<Track>(track)
  const [showContributorForm, setShowContributorForm] = useState(false)
  const [showArtistForm, setShowArtistForm] = useState(false)
  const [showArtistSelector, setShowArtistSelector] = useState(false)
  const [showContributorSelector, setShowContributorSelector] = useState(false)
  const [showMusicVideoForm, setShowMusicVideoForm] = useState(false)
  const [editingContributor, setEditingContributor] = useState<any>(null)
  const [editingArtistType, setEditingArtistType] = useState<'primary' | 'featuring'>('primary')
  const [editingMusicVideo, setEditingMusicVideo] = useState<MusicVideo | null>(null)

  // Sync album artists to track on mount and when albumArtists change
  useEffect(() => {
    if (albumArtists.length > 0 && localTrack.artists.length === 0) {
      setLocalTrack(prev => ({
        ...prev,
        artists: albumArtists.map(artist => ({
          ...artist,
          type: 'primary' as const
        }))
      }))
    }
  }, [albumArtists])

  // Duration formatting
  const formatDuration = (seconds: string | number) => {
    const sec = typeof seconds === 'string' ? parseInt(seconds) : seconds
    const mins = Math.floor(sec / 60)
    const secs = sec % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const parseDuration = (duration: string) => {
    const [mins, secs] = duration.split(':').map(n => parseInt(n) || 0)
    return (mins * 60 + secs).toString()
  }

  // Handle saving
  const handleSave = () => {
    onUpdate(localTrack)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setLocalTrack(track)
    setIsEditing(false)
  }

  // Artist management
  const addArtist = (type: 'primary' | 'featuring') => {
    setEditingArtistType(type)
    setEditingContributor(null)
    setShowArtistSelector(true)
  }

  const removeArtist = (artistId: string) => {
    setLocalTrack(prev => ({
      ...prev,
      artists: prev.artists.filter(a => a.id !== artistId)
    }))
  }

  const handleArtistSave = (contributor: any) => {
    const newArtist: TrackArtist = {
      id: contributor.id,
      name: contributor.name,
      type: editingArtistType,
      translations: contributor.translations,
      identifiers: contributor.identifiers,
      isNewArtist: contributor.isNewArtist
    }

    if (editingContributor) {
      setLocalTrack(prev => ({
        ...prev,
        artists: prev.artists.map(a => a.id === newArtist.id ? newArtist : a)
      }))
    } else {
      setLocalTrack(prev => ({
        ...prev,
        artists: [...prev.artists, newArtist]
      }))
    }

    setShowArtistForm(false)
    setEditingContributor(null)
  }

  // Contributor management
  const handleContributorSave = (contributor: any) => {
    if (editingContributor) {
      setLocalTrack(prev => ({
        ...prev,
        contributors: prev.contributors.map(c => c.id === contributor.id ? contributor : c)
      }))
    } else {
      setLocalTrack(prev => ({
        ...prev,
        contributors: [...prev.contributors, contributor]
      }))
    }

    setShowContributorForm(false)
    setEditingContributor(null)
  }

  const removeContributor = (contributorId: string) => {
    setLocalTrack(prev => ({
      ...prev,
      contributors: prev.contributors.filter(c => c.id !== contributorId)
    }))
  }

  // Handle artist selection from saved artists
  const handleArtistSelection = (artist: any) => {
    const newArtist: TrackArtist = {
      id: artist.id,
      name: artist.name,
      type: editingArtistType,
      translations: artist.translations,
      identifiers: artist.identifiers,
      isNewArtist: false
    }

    setLocalTrack(prev => ({
      ...prev,
      artists: [...prev.artists, newArtist]
    }))

    setShowArtistSelector(false)
  }

  // Handle contributor selection from saved contributors
  const handleContributorSelection = (contributor: any) => {
    setLocalTrack(prev => ({
      ...prev,
      contributors: [...prev.contributors, contributor]
    }))

    setShowContributorSelector(false)
  }

  // Music video management
  const handleMusicVideoSave = (video: MusicVideo) => {
    const videos = localTrack.musicVideos || []
    
    if (editingMusicVideo) {
      setLocalTrack(prev => ({
        ...prev,
        musicVideos: videos.map(v => v.id === video.id ? video : v)
      }))
    } else {
      setLocalTrack(prev => ({
        ...prev,
        musicVideos: [...videos, { ...video, id: uuidv4() }]
      }))
    }

    setShowMusicVideoForm(false)
    setEditingMusicVideo(null)
  }

  const removeMusicVideo = (videoId: string) => {
    setLocalTrack(prev => ({
      ...prev,
      musicVideos: (prev.musicVideos || []).filter(v => v.id !== videoId)
    }))
  }

  // Group artists by type for display
  const primaryArtists = localTrack.artists.filter(a => a.type === 'primary')
  const featuringArtists = localTrack.artists.filter(a => a.type === 'featuring')
  const musicVideos = localTrack.musicVideos || []

  return (
    <>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Track Header */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-400">
                  {track.number.toString().padStart(2, '0')}
                </span>
                <Music className="w-5 h-5 text-gray-400" />
              </div>

              {isEditing ? (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={localTrack.title}
                    onChange={(e) => setLocalTrack(prev => ({ ...prev, title: e.target.value }))}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                    placeholder={t('트랙 제목', 'Track Title')}
                  />
                  <input
                    type="text"
                    value={localTrack.version || ''}
                    onChange={(e) => setLocalTrack(prev => ({ ...prev, version: e.target.value }))}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                    placeholder={t('버전 (선택)', 'Version (Optional)')}
                  />
                </div>
              ) : (
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {track.title}
                    {track.version && (
                      <span className="ml-2 text-sm text-gray-500">({track.version})</span>
                    )}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {primaryArtists.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {primaryArtists.map(a => a.name).join(', ')}
                      </span>
                    )}
                    {featuringArtists.length > 0 && (
                      <span className="flex items-center gap-1">
                        feat. {featuringArtists.map(a => a.name).join(', ')}
                      </span>
                    )}
                    {track.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(track.duration)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {track.explicit && (
                <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full">
                  Explicit
                </span>
              )}
              {track.isDolbyAtmos && (
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs rounded-full">
                  Dolby Atmos
                </span>
              )}
              
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-6 space-y-6 border-t border-gray-200 dark:border-gray-700">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('ISRC 코드', 'ISRC Code')}
                </label>
                <input
                  type="text"
                  value={localTrack.isrc || ''}
                  onChange={(e) => setLocalTrack(prev => ({ ...prev, isrc: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  placeholder="USRC17607839"
                  maxLength={12}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('재생 시간', 'Duration')}
                </label>
                <input
                  type="text"
                  value={localTrack.duration ? formatDuration(localTrack.duration) : ''}
                  onChange={(e) => setLocalTrack(prev => ({ 
                    ...prev, 
                    duration: parseDuration(e.target.value) 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  placeholder="3:45"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localTrack.explicit}
                    onChange={(e) => setLocalTrack(prev => ({ ...prev, explicit: e.target.checked }))}
                    className="rounded text-purple-500"
                  />
                  <span className="text-sm">{t('명시적 콘텐츠', 'Explicit Content')}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localTrack.isDolbyAtmos || false}
                    onChange={(e) => setLocalTrack(prev => ({ ...prev, isDolbyAtmos: e.target.checked }))}
                    className="rounded text-purple-500"
                  />
                  <span className="text-sm">Dolby Atmos</span>
                </label>
              </div>
            </div>

            {/* Artists Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {t('아티스트', 'Artists')}
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => addArtist('primary')}
                    className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    {t('주 아티스트 추가', 'Add Primary Artist')}
                  </button>
                  <button
                    onClick={() => addArtist('featuring')}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {t('피처링 추가', 'Add Featuring')}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {/* Primary Artists */}
                {primaryArtists.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">{t('주 아티스트', 'Primary Artists')}</p>
                    <div className="space-y-2">
                      {primaryArtists.map(artist => (
                        <div key={artist.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Mic className="w-4 h-4 text-purple-500" />
                            <div>
                              <p className="font-medium">{artist.name}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                {artist.translations.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Languages className="w-3 h-3" />
                                    {artist.translations.length} {t('번역', 'translations')}
                                  </span>
                                )}
                                {artist.identifiers.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <LinkIcon className="w-3 h-3" />
                                    {artist.identifiers.length} {t('연동', 'links')}
                                  </span>
                                )}
                                {artist.isNewArtist && (
                                  <span className="text-orange-600">{t('신규', 'New')}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingContributor({
                                  ...artist,
                                  roles: ['performer'],
                                  instruments: []
                                })
                                setEditingArtistType('primary')
                                setShowArtistForm(true)
                              }}
                              className="p-1 text-gray-600 hover:text-gray-800"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeArtist(artist.id)}
                              className="p-1 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Featuring Artists */}
                {featuringArtists.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">{t('피처링 아티스트', 'Featuring Artists')}</p>
                    <div className="space-y-2">
                      {featuringArtists.map(artist => (
                        <div key={artist.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Mic className="w-4 h-4 text-blue-500" />
                            <div>
                              <p className="font-medium">{artist.name}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                {artist.translations.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Languages className="w-3 h-3" />
                                    {artist.translations.length} {t('번역', 'translations')}
                                  </span>
                                )}
                                {artist.identifiers.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <LinkIcon className="w-3 h-3" />
                                    {artist.identifiers.length} {t('연동', 'links')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingContributor({
                                  ...artist,
                                  roles: ['featuring'],
                                  instruments: []
                                })
                                setEditingArtistType('featuring')
                                setShowArtistForm(true)
                              }}
                              className="p-1 text-gray-600 hover:text-gray-800"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeArtist(artist.id)}
                              className="p-1 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Album Artist Sync Info */}
              {albumArtists.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {t(
                        '앨범 레벨에서 설정한 주 아티스트가 자동으로 반영됩니다. 트랙별로 추가 아티스트를 설정할 수 있습니다.',
                        'Primary artists from album level are automatically applied. You can add additional artists per track.'
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Contributors Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {t('기여자', 'Contributors')}
                </h4>
                <button
                  onClick={() => {
                    setEditingContributor(null)
                    setShowContributorSelector(true)
                  }}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  {t('기여자 추가', 'Add Contributor')}
                </button>
              </div>

              {localTrack.contributors.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <p className="text-gray-500">
                    {t('트랙 기여자가 없습니다', 'No track contributors')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {localTrack.contributors.map(contributor => (
                    <div key={contributor.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">{contributor.name}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {contributor.roles.map(role => (
                            <span key={role} className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">
                              {role}
                            </span>
                          ))}
                          {contributor.instruments.map(instrument => (
                            <span key={instrument} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                              {instrument}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingContributor(contributor)
                            setShowContributorForm(true)
                          }}
                          className="p-1 text-gray-600 hover:text-gray-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeContributor(contributor.id)}
                          className="p-1 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Music Videos Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  {t('뮤직비디오', 'Music Videos')}
                </h4>
                <button
                  onClick={() => {
                    setEditingMusicVideo(null)
                    setShowMusicVideoForm(true)
                  }}
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {t('뮤직비디오 추가', 'Add Music Video')}
                </button>
              </div>

              {musicVideos.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <p className="text-gray-500">
                    {t('뮤직비디오가 없습니다', 'No music videos')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {musicVideos.map(video => (
                    <div key={video.id} className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Video className="w-4 h-4 text-indigo-500" />
                        <div>
                          <p className="font-medium">
                            {video.title}
                            {video.version && <span className="ml-2 text-sm text-gray-500">({video.version})</span>}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Audio ISRC: {video.audioISRC}</span>
                            {video.videoISRC && <span>Video ISRC: {video.videoISRC}</span>}
                            {video.duration && <span>{formatDuration(video.duration)}</span>}
                            {video.explicit && (
                              <span className="text-red-600">{t('명시적', 'Explicit')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingMusicVideo(video)
                            setShowMusicVideoForm(true)
                          }}
                          className="p-1 text-gray-600 hover:text-gray-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeMusicVideo(video.id)}
                          className="p-1 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Delete Track */}
            {totalTracks > 1 && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => onDelete(track.id)}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('트랙 삭제', 'Delete Track')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contributor Form Modal */}
      {(showContributorForm || showArtistForm) && (
        <ContributorForm
          contributor={editingContributor}
          onSave={showArtistForm ? handleArtistSave : handleContributorSave}
          onCancel={() => {
            setShowContributorForm(false)
            setShowArtistForm(false)
            setEditingContributor(null)
          }}
          trackId={track.id}
          isArtist={showArtistForm}
        />
      )}

      {/* Artist Selector Modal */}
      {showArtistSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {t(
                  editingArtistType === 'primary' ? '주 아티스트 선택' : '피처링 아티스트 선택',
                  editingArtistType === 'primary' ? 'Select Primary Artist' : 'Select Featuring Artist'
                )}
              </h2>
              <button
                onClick={() => setShowArtistSelector(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ArtistSelector
              key={`artist-selector-${Date.now()}`} // Force remount to fetch latest data
              type="artist"
              onSelect={handleArtistSelection}
              onCreateNew={() => {
                setShowArtistSelector(false)
                setShowArtistForm(true)
              }}
              selectedIds={localTrack.artists.map(a => a.id)}
            />
          </div>
        </div>
      )}

      {/* Contributor Selector Modal */}
      {showContributorSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {t('기여자 선택', 'Select Contributor')}
              </h2>
              <button
                onClick={() => setShowContributorSelector(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ArtistSelector
              type="contributor"
              onSelect={handleContributorSelection}
              onCreateNew={() => {
                setShowContributorSelector(false)
                setShowContributorForm(true)
              }}
              selectedIds={localTrack.contributors.map(c => c.id)}
            />
          </div>
        </div>
      )}

      {/* Music Video Form Modal */}
      {showMusicVideoForm && (
        <MusicVideoForm
          video={editingMusicVideo || {
            id: '',
            title: '',
            audioISRC: '',
            explicit: false
          }}
          audioTracks={[
            {
              id: track.id,
              title: track.title,
              isrc: track.isrc
            }
          ]}
          onSave={handleMusicVideoSave}
          onCancel={() => {
            setShowMusicVideoForm(false)
            setEditingMusicVideo(null)
          }}
        />
      )}
    </>
  )
}