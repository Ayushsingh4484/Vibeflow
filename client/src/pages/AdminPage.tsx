import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { trackService } from '../services/trackService';
import { artistService } from '../services/artistService';
import { albumService } from '../services/albumService';
import { AdminStats, Track, Artist, Album, User } from '../types';
import { useToastStore } from '../store/useToastStore';
import { usePlayerStore } from '../store/usePlayerStore';
import {
  ShieldCheck,
  Music,
  Users,
  Disc,
  Radio,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Play,
  BarChart3,
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { formatTime, formatDate } from '../utils/format';
import { LiquidNavContainer } from '../components/common/LiquidNavIndicator';

export const AdminPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'tracks' | 'artists' | 'albums' | 'users'>('overview');
  const [loading, setLoading] = useState(true);

  // Upload Track Modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadArtistName, setUploadArtistName] = useState('');
  const [uploadAlbumTitle, setUploadAlbumTitle] = useState('');
  const [uploadGenre, setUploadGenre] = useState('Electronic');
  const [uploadAudioFile, setUploadAudioFile] = useState<File | null>(null);
  const [uploadCoverFile, setUploadCoverFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Create Artist Modal state
  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);
  const [artistName, setArtistName] = useState('');
  const [artistBio, setArtistBio] = useState('');
  const [artistImageFile, setArtistImageFile] = useState<File | null>(null);

  // Create Album Modal state
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumArtistId, setAlbumArtistId] = useState('');
  const [albumCoverFile, setAlbumCoverFile] = useState<File | null>(null);

  const { addToast } = useToastStore();
  const { playTrack } = usePlayerStore();

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, tracksRes, artistsRes, albumsRes, usersRes] = await Promise.all([
        adminService.getStats(),
        trackService.getTracks({ limit: 100 }),
        artistService.getArtists({ limit: 100 }),
        albumService.getAlbums({ limit: 100 }),
        adminService.getUsers(),
      ]);

      setStats(statsRes.stats);
      setTracks(tracksRes.tracks || []);
      setArtists(artistsRes.artists || []);
      setAlbums(albumsRes.albums || []);
      setUsers(usersRes.users || []);
    } catch (err: any) {
      addToast(err.message || 'Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleUploadTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadArtistName.trim() || !uploadAudioFile) {
      addToast('Please provide song title, artist, and audio file', 'error');
      return;
    }

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', uploadTitle.trim());
      formData.append('artistName', uploadArtistName.trim());
      if (uploadAlbumTitle.trim()) formData.append('albumTitle', uploadAlbumTitle.trim());
      formData.append('genre', uploadGenre);
      formData.append('audio', uploadAudioFile);
      if (uploadCoverFile) formData.append('cover', uploadCoverFile);

      const res = await trackService.createTrack(formData);
      addToast(`Uploaded track "${res.track.title}"!`, 'success');
      setIsUploadModalOpen(false);
      // Reset
      setUploadTitle('');
      setUploadArtistName('');
      setUploadAlbumTitle('');
      setUploadAudioFile(null);
      setUploadCoverFile(null);
      loadAllData();
    } catch (err: any) {
      addToast(err.message || 'Failed to upload track', 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleCreateArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistName.trim()) return;

    try {
      const formData = new FormData();
      formData.append('name', artistName.trim());
      if (artistBio.trim()) formData.append('bio', artistBio.trim());
      if (artistImageFile) formData.append('image', artistImageFile);

      await artistService.createArtist(formData);
      addToast(`Artist "${artistName}" created!`, 'success');
      setIsArtistModalOpen(false);
      setArtistName('');
      setArtistBio('');
      setArtistImageFile(null);
      loadAllData();
    } catch (err: any) {
      addToast(err.message || 'Failed to create artist', 'error');
    }
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumTitle.trim() || !albumArtistId) {
      addToast('Please provide album title and select artist', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', albumTitle.trim());
      formData.append('artistId', albumArtistId);
      if (albumCoverFile) formData.append('cover', albumCoverFile);

      await albumService.createAlbum(formData);
      addToast(`Album "${albumTitle}" created!`, 'success');
      setIsAlbumModalOpen(false);
      setAlbumTitle('');
      setAlbumArtistId('');
      setAlbumCoverFile(null);
      loadAllData();
    } catch (err: any) {
      addToast(err.message || 'Failed to create album', 'error');
    }
  };

  const handleDeleteTrack = async (id: string, title: string) => {
    if (!confirm(`Delete track "${title}"?`)) return;
    try {
      await trackService.deleteTrack(id);
      addToast(`Deleted track "${title}"`, 'info');
      setTracks((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      addToast(err.message || 'Failed to delete track', 'error');
    }
  };

  const handleDeleteArtist = async (id: string, name: string) => {
    if (!confirm(`Delete artist "${name}"?`)) return;
    try {
      await artistService.deleteArtist(id);
      addToast(`Deleted artist "${name}"`, 'info');
      setArtists((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      addToast(err.message || 'Failed to delete artist', 'error');
    }
  };

  const handleDeleteAlbum = async (id: string, title: string) => {
    if (!confirm(`Delete album "${title}"?`)) return;
    try {
      await albumService.deleteAlbum(id);
      addToast(`Deleted album "${title}"`, 'info');
      setAlbums((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      addToast(err.message || 'Failed to delete album', 'error');
    }
  };

  const handleUpdateRole = async (userId: string, currentRole: 'USER' | 'ADMIN') => {
    const nextRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await adminService.updateUserRole(userId, nextRole);
      addToast(`User role updated to ${nextRole}`, 'success');
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: nextRole } : u)));
    } catch (err: any) {
      addToast(err.message || 'Failed to update role', 'error');
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Delete user "${name}"?`)) return;
    try {
      await adminService.deleteUser(userId);
      addToast(`Deleted user "${name}"`, 'info');
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      addToast(err.message || 'Failed to delete user', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto pb-24">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-500/20 to-pink-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">VibeFlow Management Suite</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Manage audio catalog, users, albums, and streaming metrics</p>
          </div>
        </div>

        {/* Global Action: Upload Audio */}
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-5 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-red-500/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Upload className="w-4 h-4" /> Upload New Track
        </button>
      </div>

      {/* Tabs with Liquid Water-Drop Effect */}
      <LiquidNavContainer
        direction="horizontal"
        className="flex items-center gap-2 overflow-x-auto pb-1"
        pillBorderRadius="rounded-full"
      >
        {(['overview', 'tracks', 'artists', 'albums', 'users'] as const).map((tab) => (
          <button
            key={tab}
            data-active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`liquid-btn relative z-10 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors duration-200 select-none ${
              activeTab === tab
                ? 'text-white'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </LiquidNavContainer>

      {/* Tab Content */}
      {loading ? (
        <div className="py-20 text-center text-zinc-500">Loading admin suite...</div>
      ) : activeTab === 'overview' ? (
        <div className="flex flex-col gap-6">
          {/* Stats Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-2xl liquid-glass-card relative overflow-hidden flex flex-col gap-1 shadow-md">
              <div className="liquid-specular-top" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-red-500" /> Tracks
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{stats?.totalTracks || 0}</span>
            </div>
            <div className="p-4 rounded-2xl liquid-glass-card relative overflow-hidden flex flex-col gap-1 shadow-md">
              <div className="liquid-specular-top" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" /> Artists
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{stats?.totalArtists || 0}</span>
            </div>
            <div className="p-4 rounded-2xl liquid-glass-card relative overflow-hidden flex flex-col gap-1 shadow-md">
              <div className="liquid-specular-top" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5 text-purple-400" /> Albums
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{stats?.totalAlbums || 0}</span>
            </div>
            <div className="p-4 rounded-2xl liquid-glass-card relative overflow-hidden flex flex-col gap-1 shadow-md">
              <div className="liquid-specular-top" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" /> Playlists
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{stats?.totalPlaylists || 0}</span>
            </div>
            <div className="p-4 rounded-2xl liquid-glass-card relative overflow-hidden flex flex-col gap-1 shadow-md">
              <div className="liquid-specular-top" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" /> Users
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{stats?.totalUsers || 0}</span>
            </div>
            <div className="p-4 rounded-2xl liquid-glass-card relative overflow-hidden flex flex-col gap-1 shadow-md">
              <div className="liquid-specular-top" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-pink-400" /> Total Plays
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{stats?.totalPlays || 0}</span>
            </div>
          </div>

          {/* Quick Management Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl liquid-glass-card relative overflow-hidden flex flex-col justify-between gap-4 shadow-lg">
              <div className="liquid-specular-top" />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Audio Track Management</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Upload raw audio files and cover art directly to local or cloud storage.</p>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="w-full py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Upload Track
              </button>
            </div>

            <div className="p-5 rounded-3xl liquid-glass-card relative overflow-hidden flex flex-col justify-between gap-4 shadow-lg">
              <div className="liquid-specular-top" />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Artist Directory</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Register new artist profiles, bios, and official artist imagery.</p>
              </div>
              <button
                onClick={() => setIsArtistModalOpen(true)}
                className="w-full py-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-slate-900 dark:text-white font-bold text-xs rounded-xl transition-colors"
              >
                Add Artist
              </button>
            </div>

            <div className="p-5 rounded-3xl liquid-glass-card relative overflow-hidden flex flex-col justify-between gap-4 shadow-lg">
              <div className="liquid-specular-top" />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Album Releases</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Create albums and organize songs into full discography releases.</p>
              </div>
              <button
                onClick={() => setIsAlbumModalOpen(true)}
                className="w-full py-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-slate-900 dark:text-white font-bold text-xs rounded-xl transition-colors"
              >
                Add Album
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === 'tracks' ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tracks Catalog ({tracks.length})</h2>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-500/20"
            >
              <Plus className="w-4 h-4" /> Add Track
            </button>
          </div>

          <div className="liquid-glass-card rounded-2xl border border-black/5 dark:border-white/10 overflow-hidden relative shadow-lg">
            <div className="liquid-specular-top" />
            <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
              <thead className="bg-black/5 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 uppercase font-semibold border-b border-black/5 dark:border-white/10">
                <tr>
                  <th className="p-3.5">Track</th>
                  <th className="p-3.5">Artist</th>
                  <th className="p-3.5">Genre</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Plays</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {tracks.map((t) => (
                  <tr key={t.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="p-3.5 flex items-center gap-3">
                      {t.coverUrl && (
                        <img src={t.coverUrl} alt={t.title} className="w-8 h-8 rounded-lg object-cover shadow-sm" />
                      )}
                      <span className="font-semibold text-slate-900 dark:text-white">{t.title}</span>
                    </td>
                    <td className="p-3.5">{t.artist?.name || '—'}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 text-[11px] font-medium border border-black/5 dark:border-white/5">{t.genre}</span>
                    </td>
                    <td className="p-3.5 tabular-nums font-mono">{formatTime(t.duration)}</td>
                    <td className="p-3.5 font-bold text-red-500 font-mono">{t.playCount}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => playTrack(t, tracks)}
                          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-zinc-500 hover:text-slate-900 dark:hover:text-white"
                          title="Preview"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          onClick={() => handleDeleteTrack(t.id, t.title)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-zinc-500 hover:text-rose-500"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'artists' ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Artists ({artists.length})</h2>
            <button
              onClick={() => setIsArtistModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-500/20"
            >
              <Plus className="w-4 h-4" /> Add Artist
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {artists.map((art) => (
              <div
                key={art.id}
                className="p-4 rounded-2xl liquid-glass-card relative overflow-hidden flex items-center justify-between gap-3 shadow-md"
              >
                <div className="liquid-specular-top" />
                <div className="flex items-center gap-3 min-w-0">
                  {art.imageUrl ? (
                    <img src={art.imageUrl} alt={art.name} className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-white/10" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center font-black">
                      {art.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{art.name}</h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{art._count?.tracks || 0} tracks</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteArtist(art.id, art.name)}
                  className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'albums' ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Albums ({albums.length})</h2>
            <button
              onClick={() => setIsAlbumModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-500/20"
            >
              <Plus className="w-4 h-4" /> Add Album
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {albums.map((alb) => (
              <div
                key={alb.id}
                className="p-4 rounded-2xl liquid-glass-card relative overflow-hidden flex items-center justify-between gap-3 shadow-md"
              >
                <div className="liquid-specular-top" />
                <div className="flex items-center gap-3 min-w-0">
                  {alb.coverUrl ? (
                    <img src={alb.coverUrl} alt={alb.title} className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-sm" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center">
                      <Disc className="w-6 h-6 text-zinc-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{alb.title}</h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{alb.artist?.name || 'Artist'}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteAlbum(alb.id, alb.title)}
                  className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'users' ? (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Users Management ({users.length})</h2>
          <div className="liquid-glass-card rounded-2xl border border-black/5 dark:border-white/10 overflow-hidden relative shadow-lg">
            <div className="liquid-specular-top" />
            <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
              <thead className="bg-black/5 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 uppercase font-semibold border-b border-black/5 dark:border-white/10">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Joined</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">{u.name}</td>
                    <td className="p-3.5 text-zinc-500 dark:text-zinc-400">{u.email}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                            : 'bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5 text-zinc-500 dark:text-zinc-400 font-mono">{formatDate(u.createdAt)}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleUpdateRole(u.id, u.role)}
                          className="px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-slate-900 dark:text-white font-semibold text-[11px] transition-colors"
                        >
                          {u.role === 'ADMIN' ? 'Make User' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-zinc-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Upload Track Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Audio Track & Artwork"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleUploadTrack} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Track Title *</label>
              <input
                type="text"
                placeholder="e.g. Midnight Waves"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                required
                className="w-full bg-black/10 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Artist Name *</label>
              <input
                type="text"
                placeholder="e.g. Luna Eclipse"
                value={uploadArtistName}
                onChange={(e) => setUploadArtistName(e.target.value)}
                required
                className="w-full bg-black/10 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Album Title (optional)</label>
              <input
                type="text"
                placeholder="e.g. Neon Horizon"
                value={uploadAlbumTitle}
                onChange={(e) => setUploadAlbumTitle(e.target.value)}
                className="w-full bg-black/10 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Genre</label>
              <select
                value={uploadGenre}
                onChange={(e) => setUploadGenre(e.target.value)}
                className="w-full bg-black/10 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
              >
                <option value="Electronic" className="bg-slate-900 text-white">Electronic</option>
                <option value="Synthwave" className="bg-slate-900 text-white">Synthwave</option>
                <option value="Lo-Fi" className="bg-slate-900 text-white">Lo-Fi</option>
                <option value="Ambient" className="bg-slate-900 text-white">Ambient</option>
                <option value="Cyberpunk" className="bg-slate-900 text-white">Cyberpunk</option>
                <option value="Deep House" className="bg-slate-900 text-white">Deep House</option>
                <option value="Indie Pop" className="bg-slate-900 text-white">Indie Pop</option>
                <option value="Melodic Techno" className="bg-slate-900 text-white">Melodic Techno</option>
                <option value="Chillout" className="bg-slate-900 text-white">Chillout</option>
              </select>
            </div>
          </div>

          {/* Audio File Input */}
          <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Music className="w-4 h-4 text-red-500" /> Select Audio File (MP3, WAV, FLAC, OGG) *
            </label>
            <input
              type="file"
              accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a"
              onChange={(e) => setUploadAudioFile(e.target.files?.[0] || null)}
              required
              className="text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-red-500 file:text-white hover:file:bg-red-600 cursor-pointer"
            />
          </div>

          {/* Artwork File Input */}
          <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Disc className="w-4 h-4 text-purple-400" /> Select Artwork File (JPG, PNG, WEBP, SVG)
            </label>
            <input
              type="file"
              accept="image/*,.jpg,.jpeg,.png,.webp,.svg"
              onChange={(e) => setUploadCoverFile(e.target.files?.[0] || null)}
              className="text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 rounded-full text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadLoading}
              className="px-6 py-2 rounded-full text-xs font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center gap-1.5 transition-all"
            >
              {uploadLoading ? 'Uploading...' : 'Save & Publish Track'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Artist Modal */}
      <Modal
        isOpen={isArtistModalOpen}
        onClose={() => setIsArtistModalOpen(false)}
        title="Add New Artist"
      >
        <form onSubmit={handleCreateArtist} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Artist Name *</label>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              required
              className="w-full bg-black/10 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Biography</label>
            <textarea
              value={artistBio}
              onChange={(e) => setArtistBio(e.target.value)}
              rows={3}
              className="w-full bg-black/10 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Artist Photo / Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setArtistImageFile(e.target.files?.[0] || null)}
              className="text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={() => setIsArtistModalOpen(false)}
              className="px-4 py-2 rounded-full text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-full text-xs font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all"
            >
              Create Artist
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Album Modal */}
      <Modal
        isOpen={isAlbumModalOpen}
        onClose={() => setIsAlbumModalOpen(false)}
        title="Add New Album"
      >
        <form onSubmit={handleCreateAlbum} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Album Title *</label>
            <input
              type="text"
              value={albumTitle}
              onChange={(e) => setAlbumTitle(e.target.value)}
              required
              className="w-full bg-black/10 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Artist *</label>
            <select
              value={albumArtistId}
              onChange={(e) => setAlbumArtistId(e.target.value)}
              required
              className="w-full bg-black/10 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
            >
              <option value="" className="bg-slate-900 text-white">Select an Artist</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id} className="bg-slate-900 text-white">
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Album Artwork</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAlbumCoverFile(e.target.files?.[0] || null)}
              className="text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={() => setIsAlbumModalOpen(false)}
              className="px-4 py-2 rounded-full text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-full text-xs font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all"
            >
              Create Album
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
