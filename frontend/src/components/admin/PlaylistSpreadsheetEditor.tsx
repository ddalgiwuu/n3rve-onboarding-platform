import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Upload,
  Download,
  Trash2,
  Save,
  Copy,
  Check,
  Music,
  ExternalLink
} from 'lucide-react';
import { clsx } from 'clsx';
import * as Dialog from '@radix-ui/react-dialog';

interface PlaylistEntry {
  id: string;
  playlistName: string;
  platform: 'SPOTIFY' | 'APPLE_MUSIC' | 'YOUTUBE_MUSIC';
  position?: number;
  playlistUrl?: string;
  curatorName?: string;
  followers?: number;
  notes?: string;
  addedBy?: string;
  addedAt?: string;
}

interface PlaylistSpreadsheetEditorProps {
  reportId: string;
  upc: string;
  playlists: PlaylistEntry[];
  onSave: (playlists: PlaylistEntry[]) => Promise<void>;
  onImport?: (file: File) => Promise<void>;
  className?: string;
}

const PLATFORMS = [
  { value: 'SPOTIFY', label: 'Spotify', color: 'bg-green-500' },
  { value: 'APPLE_MUSIC', label: 'Apple Music', color: 'bg-pink-500' },
  { value: 'YOUTUBE_MUSIC', label: 'YouTube Music', color: 'bg-red-500' }
];

export function PlaylistSpreadsheetEditor({
  reportId,
  upc,
  playlists: initialPlaylists,
  onSave,
  onImport,
  className
}: PlaylistSpreadsheetEditorProps) {
  const [playlists, setPlaylists] = useState<PlaylistEntry[]>(initialPlaylists);
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [copiedRows, setCopiedRows] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle cell edit
  const handleCellChange = (rowId: string, field: string, value: any) => {
    setPlaylists(prev =>
      prev.map(p =>
        p.id === rowId ? { ...p, [field]: value } : p
      )
    );
  };

  // Add new row
  const handleAddRow = (data?: Partial<PlaylistEntry>) => {
    const newPlaylist: PlaylistEntry = {
      id: `new-${Date.now()}`,
      playlistName: data?.playlistName || '',
      platform: data?.platform || 'SPOTIFY',
      position: data?.position,
      playlistUrl: data?.playlistUrl,
      curatorName: data?.curatorName,
      followers: data?.followers,
      notes: data?.notes,
      addedBy: 'current-user', // TODO: Get from auth context
      addedAt: new Date().toISOString()
    };

    setPlaylists(prev => [...prev, newPlaylist]);
    setShowAddModal(false);
  };

  // Delete selected rows
  const handleDeleteSelected = () => {
    if (selectedRows.size === 0) return;

    if (confirm(`Delete ${selectedRows.size} playlist(s)?`)) {
      setPlaylists(prev => prev.filter(p => !selectedRows.has(p.id)));
      setSelectedRows(new Set());
    }
  };

  // Copy selected rows
  const handleCopySelected = () => {
    const selectedPlaylists = playlists.filter(p => selectedRows.has(p.id));
    const tsv = selectedPlaylists
      .map(p => [
        p.playlistName,
        p.platform,
        p.position || '',
        p.curatorName || '',
        p.playlistUrl || ''
      ].join('\t'))
      .join('\n');

    navigator.clipboard.writeText(tsv);
    setCopiedRows(true);
    setTimeout(() => setCopiedRows(false), 2000);
  };

  // Save all changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(playlists);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle row selection
  const toggleRowSelection = (rowId: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  // Handle file import
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImport) {
      await onImport(file);
    }
  };

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="
              flex items-center gap-2 px-4 py-2
              bg-purple-500 hover:bg-purple-600
              rounded-lg text-white font-medium
              transition-all
            "
          >
            <Plus size={18} />
            Add Playlist
          </button>

          {onImport && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.csv"
                onChange={handleFileImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="
                  flex items-center gap-2 px-4 py-2
                  bg-white/5 hover:bg-white/10
                  border border-white/10
                  rounded-lg text-white font-medium
                  transition-all
                "
              >
                <Upload size={18} />
                Import
              </button>
            </>
          )}

          <button
            onClick={handleCopySelected}
            disabled={selectedRows.size === 0}
            className="
              flex items-center gap-2 px-4 py-2
              bg-white/5 hover:bg-white/10
              border border-white/10
              rounded-lg text-white font-medium
              transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {copiedRows ? <Check size={18} /> : <Copy size={18} />}
            Copy Selected
          </button>

          <button
            onClick={handleDeleteSelected}
            disabled={selectedRows.size === 0}
            className="
              flex items-center gap-2 px-4 py-2
              bg-red-500/10 hover:bg-red-500/20
              border border-red-500/30
              rounded-lg text-red-400 font-medium
              transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <Trash2 size={18} />
            Delete ({selectedRows.size})
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="
            flex items-center gap-2 px-6 py-2
            bg-gradient-to-r from-purple-500 to-pink-500
            hover:shadow-lg hover:shadow-purple-500/50
            rounded-lg text-white font-medium
            transition-all
            disabled:opacity-50
          "
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="p-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedRows.size === playlists.length && playlists.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRows(new Set(playlists.map(p => p.id)));
                    } else {
                      setSelectedRows(new Set());
                    }
                  }}
                  className="w-4 h-4 rounded border-white/20 bg-white/5"
                />
              </th>
              <th className="p-4 text-left text-sm font-medium text-gray-400 uppercase">Platform</th>
              <th className="p-4 text-left text-sm font-medium text-gray-400 uppercase">Playlist Name</th>
              <th className="p-4 text-left text-sm font-medium text-gray-400 uppercase">Curator</th>
              <th className="p-4 text-left text-sm font-medium text-gray-400 uppercase">Position</th>
              <th className="p-4 text-left text-sm font-medium text-gray-400 uppercase">Followers</th>
              <th className="p-4 text-left text-sm font-medium text-gray-400 uppercase">URL</th>
              <th className="p-4 text-left text-sm font-medium text-gray-400 uppercase">Notes</th>
              <th className="p-4"></th>
            </tr>
          </thead>

          <tbody>
            {playlists.map((playlist, index) => (
              <tr
                key={playlist.id}
                className={clsx(
                  'border-b border-white/5 hover:bg-white/5 transition-colors',
                  selectedRows.has(playlist.id) && 'bg-purple-500/10'
                )}
              >
                {/* Checkbox */}
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(playlist.id)}
                    onChange={() => toggleRowSelection(playlist.id)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5"
                  />
                </td>

                {/* Platform */}
                <td className="p-4">
                  <select
                    value={playlist.platform}
                    onChange={(e) => handleCellChange(playlist.id, 'platform', e.target.value)}
                    className="
                      px-3 py-1.5 rounded-lg
                      bg-white/5 border border-white/10
                      text-white text-sm
                      outline-none focus:ring-2 focus:ring-purple-500/50
                    "
                  >
                    {PLATFORMS.map(p => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Playlist Name */}
                <td className="p-4">
                  <input
                    type="text"
                    value={playlist.playlistName}
                    onChange={(e) => handleCellChange(playlist.id, 'playlistName', e.target.value)}
                    className="
                      w-full px-3 py-1.5 rounded-lg
                      bg-transparent border border-transparent
                      hover:border-white/10 focus:border-purple-500/50
                      text-white text-sm
                      outline-none
                    "
                    placeholder="Playlist name..."
                  />
                </td>

                {/* Curator */}
                <td className="p-4">
                  <input
                    type="text"
                    value={playlist.curatorName || ''}
                    onChange={(e) => handleCellChange(playlist.id, 'curatorName', e.target.value)}
                    className="
                      w-full px-3 py-1.5 rounded-lg
                      bg-transparent border border-transparent
                      hover:border-white/10 focus:border-purple-500/50
                      text-white text-sm
                      outline-none
                    "
                    placeholder="Curator..."
                  />
                </td>

                {/* Position */}
                <td className="p-4">
                  <input
                    type="number"
                    value={playlist.position || ''}
                    onChange={(e) => handleCellChange(playlist.id, 'position', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="
                      w-24 px-3 py-1.5 rounded-lg
                      bg-transparent border border-transparent
                      hover:border-white/10 focus:border-purple-500/50
                      text-white text-sm
                      outline-none
                    "
                    placeholder="#"
                    min="1"
                  />
                </td>

                {/* Followers */}
                <td className="p-4">
                  <input
                    type="number"
                    value={playlist.followers || ''}
                    onChange={(e) => handleCellChange(playlist.id, 'followers', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="
                      w-32 px-3 py-1.5 rounded-lg
                      bg-transparent border border-transparent
                      hover:border-white/10 focus:border-purple-500/50
                      text-white text-sm
                      outline-none
                    "
                    placeholder="Followers..."
                  />
                </td>

                {/* URL */}
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={playlist.playlistUrl || ''}
                      onChange={(e) => handleCellChange(playlist.id, 'playlistUrl', e.target.value)}
                      className="
                        flex-1 px-3 py-1.5 rounded-lg
                        bg-transparent border border-transparent
                        hover:border-white/10 focus:border-purple-500/50
                        text-white text-sm
                        outline-none
                      "
                      placeholder="https://..."
                    />
                    {playlist.playlistUrl && (
                      <a
                        href={playlist.playlistUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-white/10 rounded transition-colors"
                      >
                        <ExternalLink size={14} className="text-gray-400" />
                      </a>
                    )}
                  </div>
                </td>

                {/* Notes */}
                <td className="p-4">
                  <input
                    type="text"
                    value={playlist.notes || ''}
                    onChange={(e) => handleCellChange(playlist.id, 'notes', e.target.value)}
                    className="
                      w-full px-3 py-1.5 rounded-lg
                      bg-transparent border border-transparent
                      hover:border-white/10 focus:border-purple-500/50
                      text-white text-sm
                      outline-none
                    "
                    placeholder="Notes..."
                  />
                </td>

                {/* Delete button */}
                <td className="p-4">
                  <button
                    onClick={() => {
                      if (confirm('Delete this playlist entry?')) {
                        setPlaylists(prev => prev.filter(p => p.id !== playlist.id));
                      }
                    }}
                    className="
                      p-1.5 rounded hover:bg-red-500/20
                      text-gray-400 hover:text-red-400
                      transition-all
                    "
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}

            {playlists.length === 0 && (
              <tr>
                <td colSpan={9} className="p-12 text-center">
                  <Music size={48} className="mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 mb-2">No playlists added yet</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="text-sm text-purple-400 hover:text-purple-300"
                  >
                    Add your first playlist →
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Playlist Modal */}
      <Dialog.Root open={showAddModal} onOpenChange={setShowAddModal}>
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="
                fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                w-full max-w-2xl
                bg-gray-900/95 backdrop-blur-xl border border-white/10
                rounded-2xl shadow-2xl overflow-hidden z-50
                p-6
              "
            >
              <Dialog.Title className="text-xl font-semibold text-white mb-6">
                Add Playlist Placement
              </Dialog.Title>

              <AddPlaylistForm
                onSubmit={handleAddRow}
                onCancel={() => setShowAddModal(false)}
              />
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

// Add Playlist Form Component
interface AddPlaylistFormProps {
  onSubmit: (data: Partial<PlaylistEntry>) => void;
  onCancel: () => void;
}

function AddPlaylistForm({ onSubmit, onCancel }: AddPlaylistFormProps) {
  const [formData, setFormData] = useState<Partial<PlaylistEntry>>({
    platform: 'SPOTIFY'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Platform */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Platform <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {PLATFORMS.map(platform => (
            <button
              key={platform.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, platform: platform.value as any }))}
              className={clsx(
                'p-3 rounded-lg border text-sm font-medium transition-all',
                formData.platform === platform.value
                  ? `${platform.color} text-white border-transparent`
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
              )}
            >
              {platform.label}
            </button>
          ))}
        </div>
      </div>

      {/* Playlist Name */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Playlist Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          required
          value={formData.playlistName || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, playlistName: e.target.value }))}
          className="
            w-full px-4 py-3 rounded-xl
            bg-white/5 border border-white/10
            text-white placeholder-gray-500
            outline-none focus:ring-2 focus:ring-purple-500/50
          "
          placeholder="Today's Top Hits"
        />
      </div>

      {/* Position & Followers */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Position</label>
          <input
            type="number"
            value={formData.position || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value ? parseInt(e.target.value) : undefined }))}
            className="
              w-full px-4 py-3 rounded-xl
              bg-white/5 border border-white/10
              text-white placeholder-gray-500
              outline-none focus:ring-2 focus:ring-purple-500/50
            "
            placeholder="#1"
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Followers</label>
          <input
            type="number"
            value={formData.followers || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, followers: e.target.value ? parseInt(e.target.value) : undefined }))}
            className="
              w-full px-4 py-3 rounded-xl
              bg-white/5 border border-white/10
              text-white placeholder-gray-500
              outline-none focus:ring-2 focus:ring-purple-500/50
            "
            placeholder="1,000,000"
          />
        </div>
      </div>

      {/* Curator & URL */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">Curator Name</label>
        <input
          type="text"
          value={formData.curatorName || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, curatorName: e.target.value }))}
          className="
            w-full px-4 py-3 rounded-xl
            bg-white/5 border border-white/10
            text-white placeholder-gray-500
            outline-none focus:ring-2 focus:ring-purple-500/50
          "
          placeholder="Spotify Editorial"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">Playlist URL</label>
        <input
          type="url"
          value={formData.playlistUrl || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, playlistUrl: e.target.value }))}
          className="
            w-full px-4 py-3 rounded-xl
            bg-white/5 border border-white/10
            text-white placeholder-gray-500
            outline-none focus:ring-2 focus:ring-purple-500/50
          "
          placeholder="https://open.spotify.com/playlist/..."
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">Notes</label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          className="
            w-full px-4 py-3 rounded-xl
            bg-white/5 border border-white/10
            text-white placeholder-gray-500
            outline-none focus:ring-2 focus:ring-purple-500/50
            resize-none
          "
          placeholder="Additional notes..."
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="
            flex-1 px-4 py-3 rounded-xl
            bg-white/5 hover:bg-white/10
            border border-white/10
            text-white font-medium
            transition-all
          "
        >
          Cancel
        </button>

        <button
          type="submit"
          className="
            flex-1 px-4 py-3 rounded-xl
            bg-gradient-to-r from-purple-500 to-pink-500
            hover:shadow-lg hover:shadow-purple-500/50
            text-white font-medium
            transition-all
          "
        >
          Add Playlist
        </button>
      </div>
    </form>
  );
}
