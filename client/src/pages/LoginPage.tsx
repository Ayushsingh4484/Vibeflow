import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { Disc, Lock, Mail, ShieldCheck, User } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please enter email and password', 'error');
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      addToast('Logged in successfully!', 'success');
      navigate('/');
    } catch (err: any) {
      addToast(err.message || 'Login failed. Please check credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (role: 'user' | 'admin') => {
    if (role === 'admin') {
      setEmail('admin@vibeflow.com');
      setPassword('admin123');
    } else {
      setEmail('user@vibeflow.com');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 bg-transparent">
      <div className="w-full max-w-md bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-[#222222] rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 animate-slide-up">
        {/* Brand Logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-xl shadow-red-500/25">
            <Disc className="w-7 h-7 text-white animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Log in to VibeFlow
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Stream high-fidelity music anytime, anywhere</p>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div className="flex flex-col gap-2 p-3.5 bg-black/5 dark:bg-[#111111] border border-black/5 dark:border-[#222222] rounded-2xl text-xs">
          <span className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px]">
            ⚡ Quick Demo Accounts
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo('user')}
              className="flex items-center justify-center gap-1.5 py-2 px-2 bg-white dark:bg-[#181818] border border-black/5 dark:border-[#222222] hover:bg-zinc-100 dark:hover:bg-[#222222] rounded-xl text-slate-900 dark:text-white font-bold transition-colors shadow-sm"
            >
              <User className="w-3.5 h-3.5 text-zinc-500" /> Demo User
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('admin')}
              className="flex items-center justify-center gap-1.5 py-2 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 font-bold transition-colors shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Demo Admin
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Email address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-black/5 dark:bg-[#111111] border border-black/10 dark:border-[#222222] rounded-2xl pl-10 pr-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-black/5 dark:bg-[#111111] border border-black/10 dark:border-[#222222] rounded-2xl pl-10 pr-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-extrabold text-sm shadow-xl shadow-red-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-red-500 hover:underline font-bold">
            Sign up for VibeFlow
          </Link>
        </div>
      </div>
    </div>
  );
};
