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
}

export const MainLayout: React.FC<MainLayoutProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-100 dark:bg-[#09090b] text-slate-900 dark:text-white select-none transition-colors">
      {/* Left Sidebar (Desktop) */}
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#14151a] m-0 md:my-2 md:mr-2 md:rounded-3xl border-0 md:border border-black/5 dark:border-white/5 shadow-2xl relative">
        <TopNav searchQuery={searchQuery} onSearchChange={onSearchChange} />

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
