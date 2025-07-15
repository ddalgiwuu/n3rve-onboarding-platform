import { atom } from 'jotai'

// Stub implementation - savedArtists functionality is not implemented yet
export const savedArtistsAtom = atom({
  artists: [],
  contributors: [],
  loading: false,
  error: null
})

// Action atoms that do nothing for now
export const fetchArtistsAtom = atom(
  null,
  async (get, set) => {
    // No-op
  }
)

export const fetchContributorsAtom = atom(
  null,
  async (get, set) => {
    // No-op
  }
)

export const addArtistAtom = atom(
  null,
  async (get, set, artist: any) => {
    return { 
      id: '', 
      name: '', 
      translations: [], 
      identifiers: [], 
      createdAt: '', 
      lastUsed: '', 
      usageCount: 0 
    }
  }
)

export const updateArtistAtom = atom(
  null,
  async (get, set, id: string, updates: any) => {
    // No-op
  }
)

export const deleteArtistAtom = atom(
  null,
  async (get, set, id: string) => {
    // No-op
  }
)

export const useArtistAtom = atom(
  null,
  async (get, set, id: string) => {
    return undefined
  }
)

export const searchArtistsAtom = atom(
  null,
  (get, set, query: string) => {
    return []
  }
)

export const addContributorAtom = atom(
  null,
  async (get, set, contributor: any) => {
    return { 
      id: '', 
      name: '', 
      roles: [], 
      instruments: [], 
      translations: [], 
      identifiers: [], 
      createdAt: '', 
      lastUsed: '', 
      usageCount: 0 
    }
  }
)

export const updateContributorAtom = atom(
  null,
  async (get, set, id: string, updates: any) => {
    // No-op
  }
)

export const deleteContributorAtom = atom(
  null,
  async (get, set, id: string) => {
    // No-op
  }
)

export const useContributorAtom = atom(
  null,
  async (get, set, id: string) => {
    return undefined
  }
)

export const searchContributorsAtom = atom(
  null,
  (get, set, query: string) => {
    return []
  }
)