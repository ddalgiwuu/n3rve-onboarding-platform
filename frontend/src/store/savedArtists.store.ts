// Compatibility layer for Jotai migration
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  savedArtistsAtom,
  fetchArtistsAtom,
  fetchContributorsAtom,
  addArtistAtom,
  updateArtistAtom,
  deleteArtistAtom,
  useArtistAtom,
  searchArtistsAtom,
  addContributorAtom,
  updateContributorAtom,
  deleteContributorAtom,
  useContributorAtom,
  searchContributorsAtom
} from '@/atoms/savedArtistsAtom'

export function useSavedArtistsStore() {
  const savedArtistsState = useAtomValue(savedArtistsAtom)
  const fetchArtists = useSetAtom(fetchArtistsAtom)
  const fetchContributors = useSetAtom(fetchContributorsAtom)
  const addArtist = useSetAtom(addArtistAtom)
  const updateArtist = useSetAtom(updateArtistAtom)
  const deleteArtist = useSetAtom(deleteArtistAtom)
  const useArtist = useSetAtom(useArtistAtom)
  const searchArtists = useSetAtom(searchArtistsAtom)
  const addContributor = useSetAtom(addContributorAtom)
  const updateContributor = useSetAtom(updateContributorAtom)
  const deleteContributor = useSetAtom(deleteContributorAtom)
  const useContributor = useSetAtom(useContributorAtom)
  const searchContributors = useSetAtom(searchContributorsAtom)
  
  return {
    ...savedArtistsState,
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
}