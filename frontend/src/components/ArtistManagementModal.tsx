import { useState } from 'react'
import { X, Plus, Trash2, Users, User, Music, ExternalLink } from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'

interface Artist {
  id: string
  name: string
  role: 'main' | 'featured' | 'additional'
  spotifyId?: string
  appleId?: string
}

interface ArtistManagementModalProps {
  isOpen: boolean
  onClose: () => void
  artists: Artist[]
  onSave: (artists: Artist[]) => void
  albumLevel?: boolean // true for album-level artists, false for track-level
}

export default function ArtistManagementModal({
  isOpen,
  onClose,
  artists: initialArtists,
  onSave,
  albumLevel = true
}: ArtistManagementModalProps) {
  const { language } = useLanguageStore()
  const t = (ko: string, en: string) => language === 'ko' ? ko : en
  
  const [artists, setArtists] = useState<Artist[]>(initialArtists)
  const [newArtist, setNewArtist] = useState<Partial<Artist>>({
    name: '',
    role: 'additional',
    spotifyId: '',
    appleId: ''
  })
  const [errors, setErrors] = useState<string[]>([])

  const validateArtist = () => {
    const errs: string[] = []
    if (!newArtist.name?.trim()) {
      errs.push(t('아티스트 이름을 입력하세요', 'Please enter artist name'))
    }
    if (artists.some(a => a.name.toLowerCase() === newArtist.name?.toLowerCase())) {
      errs.push(t('이미 추가된 아티스트입니다', 'Artist already added'))
    }
    setErrors(errs)
    return errs.length === 0
  }

  const addArtist = () => {
    if (validateArtist()) {
      const artist: Artist = {
        id: Date.now().toString(),
        name: newArtist.name!.trim(),
        role: newArtist.role as Artist['role'],
        spotifyId: newArtist.spotifyId?.trim(),
        appleId: newArtist.appleId?.trim()
      }
      setArtists([...artists, artist])
      setNewArtist({ name: '', role: 'additional', spotifyId: '', appleId: '' })
      setErrors([])
    }
  }

  const removeArtist = (id: string) => {
    setArtists(artists.filter(a => a.id !== id))
  }

  const updateArtistRole = (id: string, role: Artist['role']) => {
    setArtists(artists.map(a => a.id === id ? { ...a, role } : a))
  }

  const handleSave = () => {
    onSave(artists)
    onClose()
  }

  if (!isOpen) return null

  const getRoleIcon = (role: Artist['role']) => {
    switch (role) {
      case 'main': return <User className="w-4 h-4" />
      case 'featured': return <Music className="w-4 h-4" />
      case 'additional': return <Users className="w-4 h-4" />
    }
  }

  const getRoleLabel = (role: Artist['role']) => {
    switch (role) {
      case 'main': return t('메인 아티스트', 'Main Artist')
      case 'featured': return t('피처링', 'Featured')
      case 'additional': return t('참여 아티스트', 'Additional Artist')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {albumLevel 
              ? t('앨범 아티스트 관리', 'Manage Album Artists')
              : t('트랙 아티스트 관리', 'Manage Track Artists')
            }
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Add New Artist */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              {t('새 아티스트 추가', 'Add New Artist')}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('아티스트 이름', 'Artist Name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newArtist.name || ''}
                    onChange={(e) => setNewArtist({ ...newArtist, name: e.target.value })}
                    placeholder={t('아티스트명 입력', 'Enter artist name')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('역할', 'Role')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newArtist.role}
                    onChange={(e) => setNewArtist({ ...newArtist, role: e.target.value as Artist['role'] })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
                  >
                    {albumLevel && <option value="main">{t('메인 아티스트', 'Main Artist')}</option>}
                    <option value="featured">{t('피처링', 'Featured')}</option>
                    <option value="additional">{t('참여 아티스트', 'Additional Artist')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Spotify ID {t('(선택사항)', '(Optional)')}
                  </label>
                  <input
                    type="text"
                    value={newArtist.spotifyId || ''}
                    onChange={(e) => setNewArtist({ ...newArtist, spotifyId: e.target.value })}
                    placeholder="spotify:artist:XXXXXXXXX"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Apple Music ID {t('(선택사항)', '(Optional)')}
                  </label>
                  <input
                    type="text"
                    value={newArtist.appleId || ''}
                    onChange={(e) => setNewArtist({ ...newArtist, appleId: e.target.value })}
                    placeholder="123456789"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
                  />
                </div>
              </div>

              {errors.length > 0 && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {errors.map((err, idx) => <p key={idx}>{err}</p>)}
                </div>
              )}

              <button
                onClick={addArtist}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('아티스트 추가', 'Add Artist')}
              </button>
            </div>
          </div>

          {/* Artist List */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {t('등록된 아티스트', 'Registered Artists')} ({artists.length})
            </h3>
            
            {artists.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {t('등록된 아티스트가 없습니다', 'No artists registered')}
              </div>
            ) : (
              <div className="space-y-2">
                {artists.map((artist) => (
                  <div
                    key={artist.id}
                    className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                        {getRoleIcon(artist.role)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {artist.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {getRoleLabel(artist.role)}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          {artist.spotifyId && (
                            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" />
                              Spotify
                            </span>
                          )}
                          {artist.appleId && (
                            <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" />
                              Apple Music
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {albumLevel && (
                        <select
                          value={artist.role}
                          onChange={(e) => updateArtistRole(artist.id, e.target.value as Artist['role'])}
                          className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
                        >
                          <option value="main">{t('메인', 'Main')}</option>
                          <option value="featured">{t('피처링', 'Featured')}</option>
                          <option value="additional">{t('참여', 'Additional')}</option>
                        </select>
                      )}
                      <button
                        onClick={() => removeArtist(artist.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t('취소', 'Cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {t('저장', 'Save')}
          </button>
        </div>
      </div>
    </div>
  )
}