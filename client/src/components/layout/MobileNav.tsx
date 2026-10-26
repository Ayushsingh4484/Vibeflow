import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Library, User, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { LiquidNavContainer } from '../common/LiquidNavIndicator';

export const MobileNav: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `liquid-btn relative z-10 flex flex-col items-center justify-center gap-0.5 py-1.5 px-4 rounded-full text-[11px] font-bold transition-colors duration-200 select-none ${
      isActive
        ? 'text-white'
        : 'text-zinc-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
    }`;

  return (
    <nav className="md:hidden fixed bottom-3 inset-x-4 max-w-sm mx-auto z-40 liquid-glass-player rounded-full p-1.5 shadow-2xl flex items-center justify-around overflow-hidden border border-white/60 dark:border-white/15">
      <div className="liquid-specular-top" />
      <LiquidNavContainer
        direction="horizontal"
        className="flex items-center justify-around w-full"
        pillBorderRadius="rounded-full"
      >
        <NavLink to="/" className={getLinkClass}>
          <Home className="w-4 h-4" />
          <span className="text-[10px]">Home</span>
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
      </LiquidNavContainer>
    </nav>
  );
};
