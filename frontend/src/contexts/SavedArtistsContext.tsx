import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { savedArtistsService, SavedArtist, SavedContributor } from '@/services/savedArtists.service'

interface SavedArtistsState {
  artists: SavedArtist[]
  contributors: SavedContributor[]
  loading: boolean
  error: any
}

interface SavedArtistsContextType extends SavedArtistsState {
  fetchArtists: () => Promise<void>
  fetchContributors: () => Promise<void>
  addArtist: (artist: Omit<SavedArtist, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>) => Promise<SavedArtist>
  updateArtist: (id: string, updates: Partial<SavedArtist>) => Promise<void>
  deleteArtist: (id: string) => Promise<void>
  useArtist: (id: string) => Promise<SavedArtist>
  searchArtists: (query: string) => SavedArtist[]
  addContributor: (contributor: Omit<SavedContributor, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>) => Promise<SavedContributor>
  updateContributor: (id: string, updates: Partial<SavedContributor>) => Promise<void>
  deleteContributor: (id: string) => Promise<void>
  useContributor: (id: string) => Promise<SavedContributor>
  searchContributors: (query: string) => SavedContributor[]
}

const SavedArtistsContext = createContext<SavedArtistsContextType | undefined>(undefined)

const initialState: SavedArtistsState = {
  artists: [],
  contributors: [],
  loading: false,
  error: null
}

export function SavedArtistsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SavedArtistsState>(initialState)

  const fetchArtists = async () => {
    try {
      console.log('SavedArtistsContext: Starting to fetch artists')
      setState(prev => ({ ...prev, loading: true, error: null }))
      const artists = await savedArtistsService.getArtists()
      console.log('SavedArtistsContext: Fetched artists:', artists)
      setState(prev => ({ ...prev, artists, loading: false }))
    } catch (error) {
      console.error('SavedArtistsContext: Error fetching artists:', error)
      setState(prev => ({ ...prev, error, loading: false }))
      // Don't throw here, let the UI handle the error state
    }
  }

  const fetchContributors = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      const contributors = await savedArtistsService.getContributors()
      setState(prev => ({ ...prev, contributors, loading: false }))
    } catch (error) {
      console.error('Error fetching contributors:', error)
      setState(prev => ({ ...prev, error, loading: false }))
      // Don't throw here, let the UI handle the error state
    }
  }

  const addArtist = async (artist: Omit<SavedArtist, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>) => {
    try {
      console.log('SavedArtistsContext: Starting to add artist:', artist)
      const newArtist = await savedArtistsService.addArtist(artist)
      console.log('SavedArtistsContext: Artist added successfully:', newArtist)
      
      // Refetch the entire list to ensure proper sorting and synchronization
      console.log('SavedArtistsContext: Refetching artists list...')
      await fetchArtists()
      console.log('SavedArtistsContext: Artists list refetched successfully')
      
      return newArtist
    } catch (error) {
      console.error('SavedArtistsContext: Error adding artist:', error)
      setState(prev => ({ ...prev, error }))
      throw error
    }
  }

  const updateArtist = async (id: string, updates: Partial<SavedArtist>) => {
    try {
      const updatedArtist = await savedArtistsService.updateArtist(id, updates)
      setState(prev => ({
        ...prev,
        artists: prev.artists.map(a => a.id === id ? updatedArtist : a)
      }))
    } catch (error) {
      setState(prev => ({ ...prev, error }))
      throw error
    }
  }

  const deleteArtist = async (id: string) => {
    try {
      await savedArtistsService.deleteArtist(id)
      setState(prev => ({
        ...prev,
        artists: prev.artists.filter(a => a.id !== id)
      }))
    } catch (error) {
      setState(prev => ({ ...prev, error }))
      throw error
    }
  }

  const useArtist = async (id: string) => {
    try {
      const artist = await savedArtistsService.useArtist(id)
      setState(prev => ({
        ...prev,
        artists: prev.artists.map(a => a.id === id ? artist : a)
      }))
      return artist
    } catch (error) {
      setState(prev => ({ ...prev, error }))
      throw error
    }
  }

  const searchArtists = (query: string) => {
    if (!query.trim()) return state.artists
    
    return state.artists.filter(artist => 
      artist.name.toLowerCase().includes(query.toLowerCase()) ||
      artist.translations.some(t => t.name.toLowerCase().includes(query.toLowerCase()))
    )
  }

  const addContributor = async (contributor: Omit<SavedContributor, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>) => {
    try {
      const newContributor = await savedArtistsService.addContributor(contributor)
      // Refetch the entire list to ensure proper sorting and synchronization
      await fetchContributors()
      return newContributor
    } catch (error) {
      console.error('Error adding contributor:', error)
      setState(prev => ({ ...prev, error }))
      throw error
    }
  }

  const updateContributor = async (id: string, updates: Partial<SavedContributor>) => {
    try {
      const updatedContributor = await savedArtistsService.updateContributor(id, updates)
      setState(prev => ({
        ...prev,
        contributors: prev.contributors.map(c => c.id === id ? updatedContributor : c)
      }))
    } catch (error) {
      setState(prev => ({ ...prev, error }))
      throw error
    }
  }

  const deleteContributor = async (id: string) => {
    try {
      await savedArtistsService.deleteContributor(id)
      setState(prev => ({
        ...prev,
        contributors: prev.contributors.filter(c => c.id !== id)
      }))
    } catch (error) {
      setState(prev => ({ ...prev, error }))
      throw error
    }
  }

  const useContributor = async (id: string) => {
    try {
      const contributor = await savedArtistsService.useContributor(id)
      setState(prev => ({
        ...prev,
        contributors: prev.contributors.map(c => c.id === id ? contributor : c)
      }))
      return contributor
    } catch (error) {
      setState(prev => ({ ...prev, error }))
      throw error
    }
  }

  const searchContributors = (query: string) => {
    if (!query.trim()) return state.contributors
    
    return state.contributors.filter(contributor => 
      contributor.name.toLowerCase().includes(query.toLowerCase()) ||
      contributor.translations.some(t => t.name.toLowerCase().includes(query.toLowerCase())) ||
      contributor.roles.some(r => r.toLowerCase().includes(query.toLowerCase())) ||
      contributor.instruments.some(i => i.toLowerCase().includes(query.toLowerCase()))
    )
  }

  // Load data on mount
  useEffect(() => {
    fetchArtists()
    fetchContributors()
  }, [])

  const value: SavedArtistsContextType = {
    ...state,
    fetchArtists,
    fetchContributors,
    addArtist,
    updateArtist,
    deleteArtist,
    useArtist,
    searchArtists,
    addContributor,
    updateContributor,
    deleteContributor,
    useContributor,
    searchContributors
  }

  return (
    <SavedArtistsContext.Provider value={value}>
      {children}
    </SavedArtistsContext.Provider>
  )
}

export function useSavedArtistsStore() {
  const context = useContext(SavedArtistsContext)
  if (context === undefined) {
    throw new Error('useSavedArtistsStore must be used within a SavedArtistsProvider')
  }
  return context
}