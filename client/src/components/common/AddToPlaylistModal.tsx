import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Track, Playlist } from '../../types';
import { playlistService } from '../../services/playlistService';
import { useToastStore } from '../../store/useToastStore';
import { Music, Plus, Check } from 'lucide-react';

interface AddToPlaylistModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  track,
  isOpen,
  onClose,
}) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const { addToast } = useToastStore();

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      playlistService
        .getUserPlaylists()
        .then((res) => {
          setPlaylists(res.playlists);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!track) return null;

  const handleAddToPlaylist = async (playlist: Playlist) => {
    try {
      await playlistService.addTrackToPlaylist(playlist.id, track.id, track);
      setAddedIds((prev) => new Set(prev).add(playlist.id));
      addToast(`Added "${track.title}" to "${playlist.name}"`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to add track', 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add to Playlist">
      <div className="flex flex-col gap-4">
        {/* Track info banner */}
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-900 border border-white/5">
          {(track.artworkUrl || track.coverUrl) ? (
            <img
              src={(track.artworkUrl || track.coverUrl)!}
              alt={track.title}
              className="w-10 h-10 rounded object-cover bg-zinc-800"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(track.title)}`;
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center">
              <Music className="w-5 h-5 text-zinc-500" />
            </div>
          )}
          <div className="flex-col min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">{track.title}</h4>
            <p className="text-xs text-zinc-400 truncate">{track.artist?.name || 'Artist'}</p>
          </div>
        </div>

        {/* Playlists List */}
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-8 text-center text-zinc-500 text-sm">Loading playlists...</div>
          ) : playlists.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-sm">
              You haven't created any playlists yet.
            </div>
          ) : (
            playlists.map((p) => {
              const isAdded = addedIds.has(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => handleAddToPlaylist(p)}
                  disabled={isAdded}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {p.coverUrl ? (
                      <img src={p.coverUrl} alt={p.name} className="w-9 h-9 rounded object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded bg-zinc-800 flex items-center justify-center">
                        <Music className="w-4 h-4 text-zinc-400" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-white truncate group-hover:text-brand-400">
                      {p.name}
                    </span>
                  </div>

                  {isAdded ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-brand-400 bg-brand-500/10 px-2 py-1 rounded">
                      <Check className="w-3.5 h-3.5" /> Added
                    </span>
                  ) : (
                    <Plus className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full text-sm font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
