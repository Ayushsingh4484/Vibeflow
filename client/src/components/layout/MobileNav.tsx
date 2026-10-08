import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Library, User, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const MobileNav: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-full text-[11px] font-semibold transition-all duration-300 ${
      isActive
        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105'
        : 'text-zinc-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
    }`;

  return (
    <nav className="md:hidden fixed bottom-3 inset-x-4 max-w-sm mx-auto z-40 bg-white/90 dark:bg-[#16171e]/90 backdrop-blur-2xl border border-black/5 dark:border-white/10 rounded-full p-1.5 shadow-2xl flex items-center justify-around">
      <NavLink to="/" className={getLinkClass}>
        <Home className="w-4 h-4" />
        <span className="text-[10px]">Home</span>
      </NavLink>

      <NavLink to="/search" className={getLinkClass}>
        <Compass className="w-4 h-4" />
        <span className="text-[10px]">Browse</span>
      </NavLink>

      <NavLink to="/library" className={getLinkClass}>
        <Library className="w-4 h-4" />
        <span className="text-[10px]">Library</span>
      </NavLink>

      {user?.role === 'ADMIN' ? (
        <NavLink to="/admin" className={getLinkClass}>
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px]">Admin</span>
        </NavLink>
      ) : (
        <NavLink to={isAuthenticated ? '/profile' : '/login'} className={getLinkClass}>
          <User className="w-4 h-4" />
          <span className="text-[10px]">{isAuthenticated ? 'Profile' : 'Log in'}</span>
        </NavLink>
      )}
    </nav>
  );
};
