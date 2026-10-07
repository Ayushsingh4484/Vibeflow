import React, { useState } from 'react';
import { Modal } from './Modal';
import { playlistService } from '../../services/playlistService';
import { useToastStore } from '../../store/useToastStore';
import { Music, Upload } from 'lucide-react';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (playlist: any) => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { addToast } = useToastStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Please enter a playlist name', 'error');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      if (description.trim()) formData.append('description', description.trim());
      if (coverFile) formData.append('cover', coverFile);

      const res = await playlistService.createPlaylist(formData);
      addToast(`Created playlist "${res.playlist.name}"!`, 'success');
      if (onCreated) onCreated(res.playlist);
      onClose();
      // Reset form
      setName('');
      setDescription('');
      setCoverFile(null);
      setCoverPreview(null);
    } catch (err: any) {
      addToast(err.message || 'Failed to create playlist', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Playlist">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {/* Cover upload container */}
          <label className="relative w-36 h-36 rounded-xl bg-zinc-800 border-2 border-dashed border-zinc-600 hover:border-brand-500 cursor-pointer flex flex-col items-center justify-center overflow-hidden shrink-0 group transition-colors">
            {coverPreview ? (
              <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-400 group-hover:text-brand-400">
                <Music className="w-8 h-8" />
                <span className="text-xs font-medium flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" /> Upload Cover
                </span>
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {/* Text fields */}
          <div className="flex-1 flex flex-col gap-3 w-full">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Playlist Name</label>
              <input
                type="text"
                placeholder="My Awesome Playlist"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Description (optional)</label>
              <textarea
                placeholder="Add an optional description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-full text-sm font-semibold bg-brand-500 hover:bg-brand-400 text-black shadow-lg disabled:opacity-50 transition-all"
          >
            {loading ? 'Creating...' : 'Create Playlist'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
