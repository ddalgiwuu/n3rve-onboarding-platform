import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Search,
  UserPlus,
  Check,
  AlertCircle,
  Music,
  Globe,
  ExternalLink
} from 'lucide-react';
import { clsx } from 'clsx';

interface SavedArtist {
  id: string;
  name: string;
  translations?: Array<{ language: string; name: string }>;
  status: 'DRAFT' | 'COMPLETE' | 'VERIFIED';
  country?: string;
  bio?: string;
  completionScore?: number;
  releaseCount?: number;
  dspProfiles?: Array<{ platform: string; verified: boolean }>;
}

interface ArtistSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  savedArtists: SavedArtist[];
  onSelectArtist: (artist: SavedArtist) => void;
  onCreateArtist: (type: 'quick' | 'full') => void;
}

export function ArtistSelectionModal({
  open,
  onOpenChange,
  savedArtists,
  onSelectArtist,
  onCreateArtist
}: ArtistSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'COMPLETE' | 'DRAFT'>('all');

  // Filter and search artists
  const filteredArtists = useMemo(() => {
    let filtered = savedArtists;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(a => a.status === filterStatus);
    }

    // Search by name
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.translations?.some(t => t.name.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [savedArtists, searchQuery, filterStatus]);

  const handleSelectArtist = (artist: SavedArtist) => {
    if (artist.status === 'DRAFT') {
      // Show warning but allow selection
      if (!confirm(`Artist "${artist.name}" has incomplete profile. Continue anyway?`)) {
        return;
      }
    }
    onSelectArtist(artist);
    onOpenChange(false);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'COMPLETE':
        return { color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30', icon: Check };
      case 'VERIFIED':
        return { color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/30', icon: Check };
      default:
        return { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500/30', icon: AlertCircle };
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
        </Dialog.Overlay>

        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="
              fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              w-full max-w-4xl max-h-[90vh]
              bg-gray-900/95 backdrop-blur-xl border border-white/10
              rounded-2xl shadow-2xl overflow-hidden z-50
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <Dialog.Title className="text-xl font-semibold text-white">
                Select or Create Artist
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </Dialog.Close>
            </div>

            {/* Search & Filters */}
            <div className="p-6 space-y-4 border-b border-white/10">
              {/* Search bar */}
              <div className="relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by artist name..."
                  className="
                    w-full pl-12 pr-4 py-3
                    bg-white/5 border border-white/10 rounded-xl
                    text-white placeholder-gray-500
                    outline-none focus:ring-2 focus:ring-purple-500/50
                    transition-all
                  "
                />
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Filter:</span>
                {['all', 'COMPLETE', 'DRAFT'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status as any)}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      filterStatus === status
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    )}
                  >
                    {status === 'all' ? 'All' : status}
                  </button>
                ))}
              </div>

              {/* Create buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onCreateArtist('quick');
                    onOpenChange(false);
                  }}
                  className="
                    flex-1 flex items-center justify-center gap-2
                    px-4 py-3 rounded-xl font-medium
                    bg-white/5 hover:bg-white/10
                    border border-white/10 hover:border-purple-500/50
                    text-white transition-all
                  "
                >
                  <UserPlus size={18} />
                  Quick Create
                </button>
                <button
                  onClick={() => {
                    onCreateArtist('full');
                    onOpenChange(false);
                  }}
                  className="
                    flex-1 flex items-center justify-center gap-2
                    px-4 py-3 rounded-xl font-medium
                    bg-gradient-to-r from-purple-500 to-pink-500
                    hover:shadow-lg hover:shadow-purple-500/50
                    text-white transition-all
                  "
                >
                  <UserPlus size={18} />
                  Full Profile
                </button>
              </div>
            </div>

            {/* Artist list */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {filteredArtists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredArtists.map((artist) => {
                    const statusConfig = getStatusConfig(artist.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <motion.button
                        key={artist.id}
                        onClick={() => handleSelectArtist(artist)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="
                          p-4 rounded-xl text-left
                          bg-white/5 backdrop-blur-md
                          border border-white/10
                          hover:border-purple-500/50 hover:bg-white/10
                          transition-all group
                        "
                      >
                        {/* Artist info */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white mb-1">
                              {artist.name}
                            </h3>
                            {artist.country && (
                              <div className="flex items-center gap-1 text-sm text-gray-400">
                                <Globe size={14} />
                                {artist.country}
                              </div>
                            )}
                          </div>

                          {/* Status badge */}
                          <div className={clsx(
                            'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium',
                            statusConfig.bgColor,
                            statusConfig.borderColor,
                            statusConfig.color,
                            'border'
                          )}>
                            <StatusIcon size={12} />
                            {artist.status}
                          </div>
                        </div>

                        {/* Bio preview */}
                        {artist.bio && (
                          <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                            {artist.bio}
                          </p>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {artist.releaseCount !== undefined && (
                            <div className="flex items-center gap-1">
                              <Music size={12} />
                              {artist.releaseCount} releases
                            </div>
                          )}
                          {artist.completionScore !== undefined && (
                            <div>
                              Profile: {artist.completionScore}%
                            </div>
                          )}
                          {artist.dspProfiles && artist.dspProfiles.length > 0 && (
                            <div className="flex items-center gap-1">
                              <ExternalLink size={12} />
                              {artist.dspProfiles.filter(d => d.verified).length} verified DSPs
                            </div>
                          )}
                        </div>

                        {/* Warning for DRAFT artists */}
                        {artist.status === 'DRAFT' && (
                          <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                            <p className="text-xs text-yellow-400">
                              ⚠️ Profile incomplete - some DSPs may reject submission
                            </p>
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search size={48} className="mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 mb-2">No artists found</p>
                  <p className="text-sm text-gray-500">
                    {searchQuery
                      ? 'Try a different search term or create a new artist'
                      : 'Create your first artist to get started'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="p-4 border-t border-white/10 bg-black/20">
              <p className="text-xs text-gray-500 text-center">
                💡 Tip: Complete artist profiles improve DSP acceptance rates
              </p>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
