import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { LibraryPage } from './pages/LibraryPage';
import { LikedSongsPage } from './pages/LikedSongsPage';
import { RecentlyPlayedPage } from './pages/RecentlyPlayedPage';
import { PlaylistPage } from './pages/PlaylistPage';
import { AlbumPage } from './pages/AlbumPage';
import { ArtistPage } from './pages/ArtistPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { useAuthStore } from './store/useAuthStore';

export const AppContent: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { initAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    initAuth();

    // Listen to custom genre click events from search page cards
    const handleCategorySearch = (e: any) => {
      setSearchQuery(e.detail);
      navigate('/search');
    };
    window.addEventListener('vibeflow-search', handleCategorySearch);
    return () => window.removeEventListener('vibeflow-search', handleCategorySearch);
  }, []);

  return (
    <Routes>
      <Route
        element={
          <MainLayout
            searchQuery={searchQuery}
            onSearchChange={(val) => setSearchQuery(val)}
          />
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage searchQuery={searchQuery} />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/liked" element={<LikedSongsPage />} />
        <Route path="/recently-played" element={<RecentlyPlayedPage />} />
        <Route path="/playlist/:id" element={<PlaylistPage />} />
        <Route path="/album/:id" element={<AlbumPage />} />
        <Route path="/artist/:id" element={<ArtistPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
