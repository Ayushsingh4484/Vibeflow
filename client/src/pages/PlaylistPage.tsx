import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { playlistService } from '../services/playlistService';
import { Playlist, Track } from '../types';
import { TrackTable } from '../components/common/TrackTable';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { formatDuration } from '../utils/format';
import { Play, Shuffle, Music, Trash2, Edit3, BookmarkPlus, Check } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { AddToPlaylistModal } from '../components/common/AddToPlaylistModal';

export const PlaylistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { playQueue, toggleShuffle } = usePlayerStore();
  const { addToast } = useToastStore();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);

  const fetchPlaylist = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await playlistService.getPlaylistById(id);
      setPlaylist(res.playlist);
      setEditName(res.playlist.name);
      setEditDescription(res.playlist.description || '');
    } catch (err) {
      console.error('Fetch playlist error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylist();
  }, [id]);

  if (loading) {
    return <div className="py-20 text-center text-zinc-500">Loading playlist...</div>;
  }

  if (!playlist) {
    return (
      <div className="py-20 text-center text-zinc-500">
        <h2 className="text-xl font-bold text-white mb-2">Playlist not found</h2>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 rounded-full bg-white text-black font-semibold text-sm"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const isPrebuilt = (playlist as any).isPrebuilt || playlist.id.startsWith('prebuilt-') || playlist.id.startsWith('yt-playlist-');
  const isOwner = !isPrebuilt && (user?.id === playlist.userId || user?.role === 'ADMIN');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveToLibrary = async () => {
    if (!user) {
      addToast('Please log in to save this playlist to your library', 'info');
      navigate('/login');
      return;
    }
    setIsSaving(true);
    try {
      await playlistService.savePrebuiltPlaylist(playlist.id);
      setIsSaved(true);
      addToast(`Saved "${playlist.name}" to your library!`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to save playlist', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    try {
      await playlistService.removeTrackFromPlaylist(playlist.id, trackId);
      setPlaylist((prev) =>
        prev ? { ...prev, tracks: prev.tracks?.filter((t) => t.id !== trackId) } : null
      );
      addToast('Removed track from playlist', 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to remove track', 'error');
    }
  };

  const handleDeletePlaylist = async () => {
    if (!confirm(`Are you sure you want to delete "${playlist.name}"?`)) return;
    try {
      await playlistService.deletePlaylist(playlist.id);
      addToast(`Deleted playlist "${playlist.name}"`, 'success');
      navigate('/library');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete playlist', 'error');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', editName.trim());
      formData.append('description', editDescription.trim());
      if (editCoverFile) formData.append('cover', editCoverFile);

      const res = await playlistService.updatePlaylist(playlist.id, formData);
      setPlaylist((prev) => (prev ? { ...prev, ...res.playlist } : null));
      addToast('Playlist updated', 'success');
      setIsEditModalOpen(false);
    } catch (err: any) {
      addToast(err.message || 'Failed to update playlist', 'error');
    }
  };

  const tracks = playlist.tracks || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-end gap-6 p-6 bg-gradient-to-b from-zinc-800 via-zinc-900/60 to-transparent">
        {playlist.coverUrl ? (
          <img
            src={playlist.coverUrl}
            alt={playlist.name}
            referrerPolicy="no-referrer"
            className="w-44 h-44 md:w-52 md:h-52 rounded-2xl object-cover shadow-2xl shrink-0 bg-zinc-800"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (playlist.coverUrl && !img.src.includes('/api/stream/image')) {
                img.src = `/api/stream/image?url=${encodeURIComponent(playlist.coverUrl)}`;
              } else {
                img.src = `https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80`;
              }
            }}
          />
        ) : (
          <div className="w-44 h-44 md:w-52 md:h-52 rounded-2xl bg-gradient-to-br from-red-600 to-zinc-900 shadow-2xl flex items-center justify-center shrink-0">
            <Music className="w-20 h-20 text-white/70" />
          </div>
        )}

        <div className="flex flex-col gap-2 min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-red-500">
            {isPrebuilt ? 'Curated Playlist' : 'Playlist'}
          </span>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight truncate">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p className="text-sm text-zinc-300 font-normal leading-relaxed max-w-2xl">
              {playlist.description}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs md:text-sm text-zinc-300 font-medium mt-2">
            <span className="font-bold text-white">{playlist.user?.name || 'VibeFlow Curators'}</span>
            <span>•</span>
            <span>{tracks.length} {tracks.length === 1 ? 'song' : 'songs'}</span>
            {playlist.totalDuration ? (
              <>
                <span>•</span>
                <span className="text-zinc-400">{formatDuration(playlist.totalDuration)}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Action Controls & Track Table */}
      <div className="px-6 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          {tracks.length > 0 && (
            <>
              <button
                onClick={() => playQueue(tracks, 0)}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-2xl shadow-red-600/40 hover:scale-105 active:scale-95 transition-all"
                title="Play Playlist"
              >
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </button>
              <button
                onClick={() => {
                  toggleShuffle();
                  playQueue(tracks, 0);
                }}
                className="p-3 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                title="Shuffle Playlist"
              >
                <Shuffle className="w-6 h-6" />
              </button>
            </>
          )}

          {isPrebuilt && (
            <button
              onClick={handleSaveToLibrary}
              disabled={isSaving || isSaved}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-extrabold transition-all ${
                isSaved
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:scale-105 active:scale-95'
              }`}
              title="Save to your library"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Saved to Library</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-4 h-4 text-red-400" />
                  <span>Save to Library</span>
                </>
              )}
            </button>
          )}

          {isOwner && (
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Edit details"
              >
                <Edit3 className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={handleDeletePlaylist}
                className="p-2 text-rose-400 hover:text-rose-300 rounded-full hover:bg-rose-500/10 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Delete playlist"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>

        <TrackTable
          tracks={tracks}
          playlistId={playlist.id}
          onRemoveFromPlaylist={isOwner ? handleRemoveTrack : undefined}
          onOpenAddToPlaylist={(t) => setSelectedTrackForPlaylist(t)}
        />
      </div>

      {/* Edit Playlist Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Playlist Details"
      >
        <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Playlist Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Change Artwork</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setEditCoverFile(e.target.files?.[0] || null)}
              className="text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-full text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-full text-xs font-bold bg-brand-500 hover:bg-brand-400 text-black shadow-lg"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      <AddToPlaylistModal
        track={selectedTrackForPlaylist}
        isOpen={!!selectedTrackForPlaylist}
        onClose={() => setSelectedTrackForPlaylist(null)}
      />
    </div>
  );
};
