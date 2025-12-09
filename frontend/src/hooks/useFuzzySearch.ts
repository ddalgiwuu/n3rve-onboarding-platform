import { useMemo } from 'react';
import Fuse from 'fuse.js';

export interface FuseSearchOptions<T> {
  keys: Array<{ name: string; weight: number }>;
  threshold?: number;
  distance?: number;
  includeScore?: boolean;
}

/**
 * Reusable fuzzy search hook using Fuse.js
 * @param data - Array of searchable items
 * @param options - Fuse.js configuration options
 * @returns Search function that returns filtered and sorted results
 */
export function useFuzzySearch<T>(
  data: T[],
  options: FuseSearchOptions<T>
) {
  // Create Fuse instance with memoization (only recreate if data changes)
  const fuse = useMemo(() => {
    const fuseOptions: Fuse.IFuseOptions<T> = {
      keys: options.keys.map(k => ({
        name: k.name,
        weight: k.weight
      })),
      threshold: options.threshold ?? 0.4,
      distance: options.distance ?? 100,
      includeScore: options.includeScore ?? true,
      ignoreLocation: true, // Search entire string, not just beginning
      useExtendedSearch: false,
      minMatchCharLength: 1,
      shouldSort: true
    };

    return new Fuse(data, fuseOptions);
  }, [data, options.keys, options.threshold, options.distance, options.includeScore]);

  // Return search function
  const search = useMemo(() => {
    return (query: string): T[] => {
      if (!query || query.trim() === '') {
        return data;
      }

      const results = fuse.search(query);

      // Extract items from Fuse.js results
      return results.map(result => result.item);
    };
  }, [fuse, data]);

  return search;
}
