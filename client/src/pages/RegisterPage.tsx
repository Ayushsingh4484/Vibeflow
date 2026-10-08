import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { Disc, Lock, Mail, User } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      addToast('Please fill out all fields', 'error');
      return;
    }

    if (password.length < 6) {
      addToast('Password must be at least 6 characters long', 'error');
      return;
    }

    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      addToast('Welcome to VibeFlow! Account created successfully.', 'success');
      navigate('/');
    } catch (err: any) {
      addToast(err.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
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
            Sign up for VibeFlow
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Join listeners around the world</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">What should we call you?</label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Your Name or Username"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-black/5 dark:bg-[#111111] border border-black/10 dark:border-[#222222] rounded-2xl pl-10 pr-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

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
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Create a Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="At least 6 characters"
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          Already have an account?{' '}
          <Link to="/login" className="text-red-500 hover:underline font-bold">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
};
