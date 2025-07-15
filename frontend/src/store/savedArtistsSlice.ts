import { createSlice, PayloadAction } from '@reduxjs/toolkit'

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
}

const initialState: SavedArtistsState = {
  artists: [],
  contributors: [],
  loading: false,
  error: null
}

const savedArtistsSlice = createSlice({
  name: 'savedArtists',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setArtists: (state, action: PayloadAction<SavedArtist[]>) => {
      state.artists = action.payload
    },
    setContributors: (state, action: PayloadAction<SavedContributor[]>) => {
      state.contributors = action.payload
    },
    addArtist: (state, action: PayloadAction<SavedArtist>) => {
      state.artists.push(action.payload)
    },
    updateArtist: (state, action: PayloadAction<{ id: string; updates: Partial<SavedArtist> }>) => {
      const index = state.artists.findIndex(a => a.id === action.payload.id)
      if (index !== -1) {
        state.artists[index] = { ...state.artists[index], ...action.payload.updates }
      }
    },
    deleteArtist: (state, action: PayloadAction<string>) => {
      state.artists = state.artists.filter(a => a.id !== action.payload)
    },
    addContributor: (state, action: PayloadAction<SavedContributor>) => {
      state.contributors.push(action.payload)
    },
    updateContributor: (state, action: PayloadAction<{ id: string; updates: Partial<SavedContributor> }>) => {
      const index = state.contributors.findIndex(c => c.id === action.payload.id)
      if (index !== -1) {
        state.contributors[index] = { ...state.contributors[index], ...action.payload.updates }
      }
    },
    deleteContributor: (state, action: PayloadAction<string>) => {
      state.contributors = state.contributors.filter(c => c.id !== action.payload)
    }
  }
})

export const { 
  setLoading, 
  setError, 
  setArtists, 
  setContributors,
  addArtist,
  updateArtist,
  deleteArtist,
  addContributor,
  updateContributor,
  deleteContributor
} = savedArtistsSlice.actions

export default savedArtistsSlice.reducer