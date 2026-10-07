import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { MobileNav } from './MobileNav';
import { Player } from '../player/Player';
import { QueueDrawer } from '../player/QueueDrawer';
import { ToastContainer } from '../common/Toast';

interface MainLayoutProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-white select-none">
      {/* Left Sidebar (Desktop) */}
      <div className="hidden md:flex h-[calc(100vh-5rem)]">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)] overflow-hidden bg-[#121212] m-0 md:my-2 md:mr-2 md:rounded-xl relative">
        <TopNav searchQuery={searchQuery} onSearchChange={onSearchChange} />
        
        <main className="flex-1 overflow-y-auto pb-24 md:pb-12 relative">
          <Outlet />
        </main>
      </div>

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
