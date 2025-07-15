import { create } from 'zustand'
import api from '@/lib/api'

export interface SavedArtist {
  id: string
  name: string
  translations: Array<{ language: string; name: string }>
  identifiers: Array<{ 
    type: 'SPOTIFY' | 'APPLE_MUSIC' | 'YOUTUBE' | 'ISNI' | 'IPI'
    value: string
    url?: string 
  }>
  createdAt: string
  lastUsed: string
  usageCount: number
}

export interface SavedContributor {
  id: string
  name: string
  roles: string[]
  instruments: string[]
  translations: Array<{ language: string; name: string }>
  identifiers: Array<{ 
    type: 'SPOTIFY' | 'APPLE_MUSIC' | 'YOUTUBE' | 'ISNI' | 'IPI'
    value: string
    url?: string 
  }>
  createdAt: string
  lastUsed: string
  usageCount: number
}

interface SavedArtistsState {
  artists: SavedArtist[]
  contributors: SavedContributor[]
  loading: boolean
  error: string | null
  
  // Fetch actions
  fetchArtists: (search?: string) => Promise<void>
  fetchContributors: (search?: string, roles?: string[], instruments?: string[]) => Promise<void>
  
  // Artist actions
  addArtist: (artist: Omit<SavedArtist, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>) => Promise<SavedArtist>
  updateArtist: (id: string, artist: Partial<SavedArtist>) => Promise<void>
  deleteArtist: (id: string) => Promise<void>
  useArtist: (id: string) => Promise<SavedArtist | undefined>
  searchArtists: (query: string) => SavedArtist[]
  
  // Contributor actions
  addContributor: (contributor: Omit<SavedContributor, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>) => Promise<SavedContributor>
  updateContributor: (id: string, contributor: Partial<SavedContributor>) => Promise<void>
  deleteContributor: (id: string) => Promise<void>
  useContributor: (id: string) => Promise<SavedContributor | undefined>
  searchContributors: (query: string, roles?: string[], instruments?: string[]) => SavedContributor[]
}

export const useSavedArtistsStore = create<SavedArtistsState>((set, get) => ({
  artists: [],
  contributors: [],
  loading: false,
  error: null,

  // Fetch artists from backend
  fetchArtists: async (search) => {
    set({ loading: true, error: null })
    try {
      const response = await api.get('/saved-artists/artists', {
        params: { search, limit: 100 }
      })
      set({ artists: response.data, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  // Fetch contributors from backend
  fetchContributors: async (search, roles, instruments) => {
    set({ loading: true, error: null })
    try {
      const response = await api.get('/saved-artists/contributors', {
        params: { search, roles, instruments, limit: 100 }
      })
      set({ contributors: response.data, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  // Artist actions
  addArtist: async (artist) => {
    try {
      const response = await api.post('/saved-artists/artists', artist)
      const newArtist = response.data
      set((state) => ({
        artists: [...state.artists, newArtist]
      }))
      return newArtist
    } catch (error: any) {
      set({ error: error.message })
      throw error
    }
  },

  updateArtist: async (id, updates) => {
    // This would need a backend endpoint if needed
    set((state) => ({
      artists: state.artists.map(artist =>
        artist.id === id ? { ...artist, ...updates } : artist
      )
    }))
  },

  deleteArtist: async (id) => {
    try {
      await api.delete(`/saved-artists/artists/${id}`)
      set((state) => ({
        artists: state.artists.filter(artist => artist.id !== id)
      }))
    } catch (error: any) {
      set({ error: error.message })
      throw error
    }
  },

  useArtist: async (id) => {
    try {
      const response = await api.put(`/saved-artists/artists/${id}/use`)
      const updatedArtist = response.data
      set((state) => ({
        artists: state.artists.map(a =>
          a.id === id ? updatedArtist : a
        )
      }))
      return updatedArtist
    } catch (error: any) {
      set({ error: error.message })
      return undefined
    }
  },

  searchArtists: (query) => {
    const lowerQuery = query.toLowerCase()
    return get().artists.filter(artist => {
      // Search in name
      if (artist.name.toLowerCase().includes(lowerQuery)) return true
      
      // Search in translations
      if (artist.translations.some(t => t.name.toLowerCase().includes(lowerQuery))) return true
      
      // Search in identifiers
      if (artist.identifiers.some(i => i.value.toLowerCase().includes(lowerQuery))) return true
      
      return false
    }).sort((a, b) => {
      // Sort by usage count and last used
      if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount
      return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
    })
  },

  // Contributor actions
  addContributor: async (contributor) => {
    try {
      const response = await api.post('/saved-artists/contributors', contributor)
      const newContributor = response.data
      set((state) => ({
        contributors: [...state.contributors, newContributor]
      }))
      return newContributor
    } catch (error: any) {
      set({ error: error.message })
      throw error
    }
  },

  updateContributor: async (id, updates) => {
    // This would need a backend endpoint if needed
    set((state) => ({
      contributors: state.contributors.map(contributor =>
        contributor.id === id ? { ...contributor, ...updates } : contributor
      )
    }))
  },

  deleteContributor: async (id) => {
    try {
      await api.delete(`/saved-artists/contributors/${id}`)
      set((state) => ({
        contributors: state.contributors.filter(contributor => contributor.id !== id)
      }))
    } catch (error: any) {
      set({ error: error.message })
      throw error
    }
  },

  useContributor: async (id) => {
    try {
      const response = await api.put(`/saved-artists/contributors/${id}/use`)
      const updatedContributor = response.data
      set((state) => ({
        contributors: state.contributors.map(c =>
          c.id === id ? updatedContributor : c
        )
      }))
      return updatedContributor
    } catch (error: any) {
      set({ error: error.message })
      return undefined
    }
  },

  searchContributors: (query, roles = [], instruments = []) => {
    const lowerQuery = query.toLowerCase()
    return get().contributors.filter(contributor => {
      // Filter by query
      const matchesQuery = !query || (
        contributor.name.toLowerCase().includes(lowerQuery) ||
        contributor.translations.some(t => t.name.toLowerCase().includes(lowerQuery)) ||
        contributor.identifiers.some(i => i.value.toLowerCase().includes(lowerQuery))
      )
      
      // Filter by roles
      const matchesRoles = roles.length === 0 || 
        roles.some(role => contributor.roles.includes(role))
      
      // Filter by instruments
      const matchesInstruments = instruments.length === 0 || 
        instruments.some(instrument => contributor.instruments.includes(instrument))
      
      return matchesQuery && matchesRoles && matchesInstruments
    }).sort((a, b) => {
      // Sort by usage count and last used
      if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount
      return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
    })
  }
}))