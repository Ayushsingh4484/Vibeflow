import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { authService } from '../services/authService';
import { User, ShieldCheck, Camera, LogOut } from 'lucide-react';
import { formatDate } from '../utils/format';

export const ProfilePage: React.FC = () => {
  const { user, setUser, logout } = useAuthStore();
  const { addToast } = useToastStore();

  const [name, setName] = useState(user?.name || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatarPreview(user.avatarUrl || null);
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      if (avatarFile) formData.append('avatar', avatarFile);

      const res = await authService.updateProfile(formData);
      setUser(res.user);
      addToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-8">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 rounded-2xl bg-gradient-to-b from-zinc-800 to-[#181818] border border-white/5 shadow-xl">
        {/* Avatar with upload hover overlay */}
        <label className="relative w-36 h-36 rounded-full overflow-hidden shadow-2xl bg-zinc-800 border-4 border-white/10 group cursor-pointer shrink-0">
          {avatarPreview ? (
            <img src={avatarPreview} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-brand-500 text-black font-black text-4xl">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
            <Camera className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </label>

        {/* User Info */}
        <div className="flex flex-col gap-2 text-center sm:text-left min-w-0 flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Profile</span>
            {user.role === 'ADMIN' && (
              <span className="flex items-center gap-1 text-xs font-bold bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" /> Admin
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight truncate">
            {user.name}
          </h1>
          <p className="text-xs text-zinc-400">
            {user.email} • Member since {formatDate(user.createdAt)}
          </p>
        </div>
      </div>

      {/* Profile Settings Form */}
      <div className="p-6 rounded-2xl bg-[#181818] border border-white/5 flex flex-col gap-6">
        <h2 className="text-lg font-bold text-white tracking-tight">Edit Profile</h2>

        <form onSubmit={handleUpdate} className="flex flex-col gap-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Email (read-only)</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-500 cursor-not-allowed"
            />
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-full bg-brand-500 hover:bg-brand-400 text-black font-bold text-xs shadow-lg transition-all"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={logout}
              className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Log out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
