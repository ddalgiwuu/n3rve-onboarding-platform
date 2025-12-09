import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { savedArtistsService, SavedArtist, SavedContributor } from '@/services/savedArtists.service';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

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
  recordArtistUsage: (id: string) => Promise<SavedArtist>
  searchArtists: (query: string) => SavedArtist[]
  addContributor: (contributor: Omit<SavedContributor, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>) => Promise<SavedContributor>
  updateContributor: (id: string, updates: Partial<SavedContributor>) => Promise<void>
  deleteContributor: (id: string) => Promise<void>
  recordContributorUsage: (id: string) => Promise<SavedContributor>
  searchContributors: (query: string) => SavedContributor[]
}

const SavedArtistsContext = createContext<SavedArtistsContextType | undefined>(undefined);

const initialState: SavedArtistsState = {
  artists: [],
  contributors: [],
  loading: false,
  error: null
};

const LOCAL_STORAGE_ARTISTS_KEY = 'n3rve_saved_artists';
const LOCAL_STORAGE_CONTRIBUTORS_KEY = 'n3rve_saved_contributors';

// Helper functions for localStorage with user-specific keys
const getLocalStorageKey = (baseKey: string, userId?: string) => {
  const id = userId || 'anonymous';
  return `${baseKey}_${id}`;
};

const loadFromLocalStorage = <T,>(baseKey: string, userId?: string, defaultValue: T[] = []): T[] => {
  try {
    const key = getLocalStorageKey(baseKey, userId);
    const stored = localStorage.getItem(key);
    logger.debug(`SavedArtistsContext: Loading from localStorage key: ${key}, found:`, !!stored);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    logger.error(`Error loading ${baseKey} from localStorage:`, error);
    return defaultValue;
  }
};

const saveToLocalStorage = <T,>(baseKey: string, data: T[], userId?: string): void => {
  try {
    const key = getLocalStorageKey(baseKey, userId);
    localStorage.setItem(key, JSON.stringify(data));
    logger.debug(`SavedArtistsContext: Saved ${data.length} items to localStorage key: ${key}`);
  } catch (error) {
    logger.error(`Error saving ${baseKey} to localStorage:`, error);
  }
};

export function SavedArtistsProvider({ children }: { children: ReactNode }) {
  const auth = useAuthStore();
  const userId = auth.user?.id;

  // Initialize state with localStorage data for the current user
  const [state, setState] = useState<SavedArtistsState>(() => ({
    ...initialState,
    artists: loadFromLocalStorage<SavedArtist>(LOCAL_STORAGE_ARTISTS_KEY, userId),
    contributors: loadFromLocalStorage<SavedContributor>(LOCAL_STORAGE_CONTRIBUTORS_KEY, userId)
  }));

  const fetchArtists = async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      logger.debug('SavedArtistsContext: fetchArtists called, isAuthenticated:', isAuth, 'userId:', userId);
      setState(prev => ({ ...prev, loading: true, error: null }));

      // If authenticated, fetch from server and sync with localStorage
      if (isAuth) {
        const artists = await savedArtistsService.getArtists();
        logger.debug('SavedArtistsContext: Fetched', artists.length, 'artists from server');
        setState(prev => ({ ...prev, artists, loading: false }));
        saveToLocalStorage(LOCAL_STORAGE_ARTISTS_KEY, artists, userId);
      } else {
        // Not authenticated, use localStorage data
        const localArtists = loadFromLocalStorage<SavedArtist>(LOCAL_STORAGE_ARTISTS_KEY, userId);
        logger.debug('SavedArtistsContext: Loaded', localArtists.length, 'artists from localStorage');
        setState(prev => ({ ...prev, artists: localArtists, loading: false }));
      }
    } catch (error: any) {
      // 401 errors are expected when not authenticated - handle silently
      if (error?.response?.status === 401 || error?.message?.includes('401')) {
        logger.debug('SavedArtistsContext: Not authenticated, using localStorage');
      } else {
        logger.error('SavedArtistsContext: Error fetching artists:', error);
      }
      // On error, fallback to localStorage
      const localArtists = loadFromLocalStorage<SavedArtist>(LOCAL_STORAGE_ARTISTS_KEY, userId);
      setState(prev => ({ ...prev, artists: localArtists, error, loading: false }));
    }
  };

  const fetchContributors = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // If authenticated, fetch from server and sync with localStorage
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const contributors = await savedArtistsService.getContributors();
        setState(prev => ({ ...prev, contributors, loading: false }));
        saveToLocalStorage(LOCAL_STORAGE_CONTRIBUTORS_KEY, contributors, userId);
      } else {
        // Not authenticated, use localStorage data
        const localContributors = loadFromLocalStorage<SavedContributor>(LOCAL_STORAGE_CONTRIBUTORS_KEY, userId);
        setState(prev => ({ ...prev, contributors: localContributors, loading: false }));
      }
    } catch (error: any) {
      // 401 errors are expected when not authenticated - handle silently
      if (error?.response?.status === 401 || error?.message?.includes('401')) {
        logger.debug('SavedArtistsContext: Not authenticated, using localStorage for contributors');
      } else {
        logger.error('Error fetching contributors:', error);
      }
      // On error, fallback to localStorage
      const localContributors = loadFromLocalStorage<SavedContributor>(LOCAL_STORAGE_CONTRIBUTORS_KEY, userId);
      setState(prev => ({ ...prev, contributors: localContributors, error, loading: false }));
    }
  };

  const addArtist = async (artist: Omit<SavedArtist, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>) => {
    try {
      logger.debug('SavedArtistsContext: addArtist called with:', artist);
      let newArtist: SavedArtist;

      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        // If authenticated, save to server
        newArtist = await savedArtistsService.addArtist(artist);
        logger.debug('SavedArtistsContext: Artist added to server:', newArtist);
        // Refetch to sync
        await fetchArtists();
      } else {
        // If not authenticated, save to localStorage only
        newArtist = {
          ...artist,
          id: `local_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
          usageCount: 0
        };

        const currentArtists = [...state.artists, newArtist];
        setState(prev => ({ ...prev, artists: currentArtists }));
        saveToLocalStorage(LOCAL_STORAGE_ARTISTS_KEY, currentArtists, userId);
      }

      return newArtist;
    } catch (error) {
      logger.error('SavedArtistsContext: Error adding artist:', error);
      setState(prev => ({ ...prev, error }));
      throw error;
    }
  };

  const updateArtist = async (id: string, updates: Partial<SavedArtist>) => {
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth && !id.startsWith('local_')) {
        // If authenticated and it's a server artist, update on server
        const updatedArtist = await savedArtistsService.updateArtist(id, updates);
        setState(prev => ({
          ...prev,
          artists: prev.artists.map(a => a.id === id ? updatedArtist : a)
        }));
        // Sync to localStorage
        saveToLocalStorage(LOCAL_STORAGE_ARTISTS_KEY, state.artists.map(a => a.id === id ? updatedArtist : a), userId);
      } else {
        // If not authenticated or it's a local artist, update in localStorage only
        const updatedArtists = state.artists.map(a =>
          a.id === id ? { ...a, ...updates } : a
        );
        setState(prev => ({ ...prev, artists: updatedArtists }));
        saveToLocalStorage(LOCAL_STORAGE_ARTISTS_KEY, updatedArtists, userId);
      }
    } catch (error) {
      setState(prev => ({ ...prev, error }));
      throw error;
    }
  };

  const deleteArtist = async (id: string) => {
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth && !id.startsWith('local_')) {
        // If authenticated and it's a server artist, delete from server
        await savedArtistsService.deleteArtist(id);
      }

      // Always update local state and localStorage
      const filteredArtists = state.artists.filter(a => a.id !== id);
      setState(prev => ({
        ...prev,
        artists: filteredArtists
      }));
      saveToLocalStorage(LOCAL_STORAGE_ARTISTS_KEY, filteredArtists, userId);
    } catch (error) {
      setState(prev => ({ ...prev, error }));
      throw error;
    }
  };

  const recordArtistUsage = async (id: string) => {
    try {
      let updatedArtist: SavedArtist;

      const isAuth = await authService.isAuthenticated();
      if (isAuth && !id.startsWith('local_')) {
        // If authenticated and it's a server artist, update on server
        updatedArtist = await savedArtistsService.recordArtistUsage(id);
      } else {
        // If not authenticated or it's a local artist, update locally
        const artist = state.artists.find(a => a.id === id);
        if (!artist) throw new Error('Artist not found');

        updatedArtist = {
          ...artist,
          usageCount: artist.usageCount + 1,
          lastUsed: new Date().toISOString()
        };
      }

      const updatedArtists = state.artists.map(a => a.id === id ? updatedArtist : a);
      setState(prev => ({
        ...prev,
        artists: updatedArtists
      }));
      saveToLocalStorage(LOCAL_STORAGE_ARTISTS_KEY, updatedArtists, userId);

      return updatedArtist;
    } catch (error) {
      setState(prev => ({ ...prev, error }));
      throw error;
    }
  };

  const searchArtists = (query: string) => {
    if (!query.trim()) return state.artists;

    return state.artists.filter(artist =>
      artist.name.toLowerCase().includes(query.toLowerCase()) ||
      artist.translations.some(t => t.name.toLowerCase().includes(query.toLowerCase()))
    );
  };

  const addContributor = async (contributor: Omit<SavedContributor, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>) => {
    try {
      let newContributor: SavedContributor;

      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        // If authenticated, save to server
        newContributor = await savedArtistsService.addContributor(contributor);
        // Refetch to sync
        await fetchContributors();
      } else {
        // If not authenticated, save to localStorage only
        newContributor = {
          ...contributor,
          id: `local_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
          usageCount: 0
        };

        const currentContributors = [...state.contributors, newContributor];
        setState(prev => ({ ...prev, contributors: currentContributors }));
        saveToLocalStorage(LOCAL_STORAGE_CONTRIBUTORS_KEY, currentContributors, userId);
      }

      return newContributor;
    } catch (error) {
      logger.error('Error adding contributor:', error);
      setState(prev => ({ ...prev, error }));
      throw error;
    }
  };

  const updateContributor = async (id: string, updates: Partial<SavedContributor>) => {
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth && !id.startsWith('local_')) {
        // If authenticated and it's a server contributor, update on server
        const updatedContributor = await savedArtistsService.updateContributor(id, updates);
        setState(prev => ({
          ...prev,
          contributors: prev.contributors.map(c => c.id === id ? updatedContributor : c)
        }));
        // Sync to localStorage
        saveToLocalStorage(LOCAL_STORAGE_CONTRIBUTORS_KEY, state.contributors.map(c => c.id === id ? updatedContributor : c), userId);
      } else {
        // If not authenticated or it's a local contributor, update in localStorage only
        const updatedContributors = state.contributors.map(c =>
          c.id === id ? { ...c, ...updates } : c
        );
        setState(prev => ({ ...prev, contributors: updatedContributors }));
        saveToLocalStorage(LOCAL_STORAGE_CONTRIBUTORS_KEY, updatedContributors, userId);
      }
    } catch (error) {
      setState(prev => ({ ...prev, error }));
      throw error;
    }
  };

  const deleteContributor = async (id: string) => {
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth && !id.startsWith('local_')) {
        // If authenticated and it's a server contributor, delete from server
        await savedArtistsService.deleteContributor(id);
      }

      // Always update local state and localStorage
      const filteredContributors = state.contributors.filter(c => c.id !== id);
      setState(prev => ({
        ...prev,
        contributors: filteredContributors
      }));
      saveToLocalStorage(LOCAL_STORAGE_CONTRIBUTORS_KEY, filteredContributors, userId);
    } catch (error) {
      setState(prev => ({ ...prev, error }));
      throw error;
    }
  };

  const recordContributorUsage = async (id: string) => {
    try {
      let updatedContributor: SavedContributor;

      const isAuth = await authService.isAuthenticated();
      if (isAuth && !id.startsWith('local_')) {
        // If authenticated and it's a server contributor, update on server
        updatedContributor = await savedArtistsService.recordContributorUsage(id);
      } else {
        // If not authenticated or it's a local contributor, update locally
        const contributor = state.contributors.find(c => c.id === id);
        if (!contributor) throw new Error('Contributor not found');

        updatedContributor = {
          ...contributor,
          usageCount: contributor.usageCount + 1,
          lastUsed: new Date().toISOString()
        };
      }

      const updatedContributors = state.contributors.map(c => c.id === id ? updatedContributor : c);
      setState(prev => ({
        ...prev,
        contributors: updatedContributors
      }));
      saveToLocalStorage(LOCAL_STORAGE_CONTRIBUTORS_KEY, updatedContributors, userId);

      return updatedContributor;
    } catch (error) {
      setState(prev => ({ ...prev, error }));
      throw error;
    }
  };

  const searchContributors = (query: string) => {
    if (!query.trim()) return state.contributors;

    return state.contributors.filter(contributor =>
      contributor.name.toLowerCase().includes(query.toLowerCase()) ||
      contributor.translations.some(t => t.name.toLowerCase().includes(query.toLowerCase())) ||
      contributor.roles.some(r => r.toLowerCase().includes(query.toLowerCase())) ||
      contributor.instruments.some(i => i.toLowerCase().includes(query.toLowerCase()))
    );
  };

  // Load data on mount and when user changes
  useEffect(() => {
    logger.debug('SavedArtistsContext: useEffect triggered, userId:', userId, 'hasToken:', authService.hasToken());
    fetchArtists();
    fetchContributors();
  }, [userId]);

  // Sync localStorage data with server when user logs in
  useEffect(() => {
    if (authService.hasToken() && userId) {
      logger.debug('SavedArtistsContext: User logged in, syncing localStorage data for user:', userId);
      // Get local artists (those with IDs starting with 'local_')
      const localArtists = state.artists.filter(a => a.id.startsWith('local_'));

      // Sync each local artist to server
      localArtists.forEach(async (localArtist) => {
        try {
          const { id, createdAt, lastUsed, usageCount, ...artistData } = localArtist;
          await savedArtistsService.addArtist(artistData);
        } catch (error) {
          logger.error('Failed to sync local artist:', error);
        }
      });

      // Get local contributors (those with IDs starting with 'local_')
      const localContributors = state.contributors.filter(c => c.id.startsWith('local_'));

      // Sync each local contributor to server
      localContributors.forEach(async (localContributor) => {
        try {
          const { id, createdAt, lastUsed, usageCount, ...contributorData } = localContributor;
          await savedArtistsService.addContributor(contributorData);
        } catch (error) {
          logger.error('Failed to sync local contributor:', error);
        }
      });

      // After syncing, refetch from server to get updated data
      if (localArtists.length > 0 || localContributors.length > 0) {
        setTimeout(() => {
          fetchArtists();
          fetchContributors();
        }, 1000);
      }
    }
  }, [userId]);

  const value: SavedArtistsContextType = {
    ...state,
    fetchArtists,
    fetchContributors,
    addArtist,
    updateArtist,
    deleteArtist,
    recordArtistUsage,
    searchArtists,
    addContributor,
    updateContributor,
    deleteContributor,
    recordContributorUsage,
    searchContributors
  };

  return (
    <SavedArtistsContext.Provider value={value}>
      {children}
    </SavedArtistsContext.Provider>
  );
}

export function useSavedArtistsStore() {
  const context = useContext(SavedArtistsContext);
  if (context === undefined) {
    throw new Error('useSavedArtistsStore must be used within a SavedArtistsProvider');
  }
  return context;
}
