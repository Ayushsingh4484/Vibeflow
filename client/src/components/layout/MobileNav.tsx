import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Library, Heart, ShieldCheck, User } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const MobileNav: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-1 py-2 flex-1 text-[11px] font-medium transition-colors ${
      isActive ? 'text-brand-400 font-bold' : 'text-zinc-400 hover:text-white'
    }`;

  return (
    <nav className="md:hidden fixed bottom-20 inset-x-0 bg-[#121212]/95 backdrop-blur-xl border-t border-white/10 z-20 flex items-center justify-around px-2 shadow-2xl">
      <NavLink to="/" className={linkClass}>
        <Home className="w-5 h-5" />
        <span>Home</span>
      </NavLink>

      <NavLink to="/search" className={linkClass}>
        <Search className="w-5 h-5" />
        <span>Search</span>
      </NavLink>

      <NavLink to="/library" className={linkClass}>
        <Library className="w-5 h-5" />
        <span>Library</span>
      </NavLink>

      <NavLink to="/liked" className={linkClass}>
        <Heart className="w-5 h-5" />
        <span>Liked</span>
      </NavLink>

      {user?.role === 'ADMIN' ? (
        <NavLink to="/admin" className={linkClass}>
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-400 font-bold">Admin</span>
        </NavLink>
      ) : (
        <NavLink to={isAuthenticated ? '/profile' : '/login'} className={linkClass}>
          <User className="w-5 h-5" />
          <span>{isAuthenticated ? 'Profile' : 'Log in'}</span>
        </NavLink>
      )}
    </nav>
  );
};
