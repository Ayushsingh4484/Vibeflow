import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { MobileNav } from './MobileNav';
import { Player } from '../player/Player';
import { NowPlayingModal } from '../player/NowPlayingModal';
import { QueueDrawer } from '../player/QueueDrawer';
import { ToastContainer } from '../common/Toast';

interface MainLayoutProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onSearchSelect?: (val: string) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSelect,
}) => {
  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#eef1f6] dark:bg-[#06070a] text-slate-900 dark:text-white select-none transition-colors">
      {/* Ambient Liquid Glow Orbs (Subtle colorful refractions through frosted glass) */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 ambient-liquid-glow-1 rounded-full opacity-60 dark:opacity-40 animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="pointer-events-none absolute top-1/3 -right-32 w-[32rem] h-[32rem] ambient-liquid-glow-2 rounded-full opacity-50 dark:opacity-30" />
      <div className="pointer-events-none absolute -bottom-36 left-1/3 w-[36rem] h-[36rem] ambient-liquid-glow-3 rounded-full opacity-45 dark:opacity-25" />

      {/* Left Sidebar (Desktop) */}
      <div className="hidden md:flex h-full z-10">
        <Sidebar />
      </div>

      {/* Main Content Area: Floating Liquid Glass Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white/80 dark:bg-[#0e1017]/75 backdrop-blur-3xl m-0 md:my-2 md:mr-2 md:rounded-3xl border-0 md:border border-black/5 dark:border-white/10 shadow-2xl relative z-10">
        {/* Specular top light edge */}
        <div className="liquid-specular-top hidden md:block" />

        <TopNav
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onSearchSelect={onSearchSelect}
        />

        <main className="flex-1 overflow-y-auto pb-32 md:pb-28 relative">
          <Outlet />
        </main>
      </div>

      {/* Full Now Playing Overlay Modal */}
      <NowPlayingModal />

      {/* Queue Drawer */}
      <QueueDrawer />

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Persistent Audio Player */}
      <Player />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};
