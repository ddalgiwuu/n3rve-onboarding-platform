// Stub file for compatibility - savedArtists functionality is not implemented yet
export const useSavedArtistsStore = () => ({
  artists: [],
  contributors: [],
  loading: false,
  error: null,
  fetchArtists: async () => {},
  fetchContributors: async () => {},
  addArtist: async () => ({ id: '', name: '', translations: [], identifiers: [], createdAt: '', lastUsed: '', usageCount: 0 }),
  updateArtist: async () => {},
  deleteArtist: async () => {},
  useArtist: async () => undefined,
  searchArtists: () => [],
  addContributor: async () => ({ id: '', name: '', roles: [], instruments: [], translations: [], identifiers: [], createdAt: '', lastUsed: '', usageCount: 0 }),
  updateContributor: async () => {},
  deleteContributor: async () => {},
  useContributor: async () => undefined,
  searchContributors: () => []
})