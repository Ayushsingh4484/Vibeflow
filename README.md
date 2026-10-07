# 🎵 VibeFlow — Modern Full-Stack Music Streaming Platform

VibeFlow is a production-quality, full-stack music streaming platform built with modern web technologies, providing genuine audio streaming with HTTP Range requests, real album and artist artwork, a persistent global player, user authentication, playlist management, and an administration dashboard.

---

## ✨ Features

- **🎧 Seamless Global Audio Player**: Centralized Zustand store with HTML5 Audio & MediaSession API. Continues playing across page navigation without interruption.
- **⚡ Real Audio Upload System**: Admin upload interface supporting multi-format audio files (MP3, WAV, FLAC, OGG, M4A) and artwork files with immediate playback.
- **🌊 HTTP Range Streaming**: Proper `206 Partial Content` audio streaming with scrubbing, seeking, and buffering.
- **🔐 Real JWT Authentication**: Secure password hashing with bcrypt, protected routes, user profile management, and persistent session tokens.
- **🔍 Full-Catalog Search**: Debounced instant search across tracks, artists, albums, and playlists with top result matching and genre categories.
- **📑 Playlist Lifecycle**: Create, update, reorder tracks, and delete custom playlists.
- **❤️ Liked Songs & Recently Played**: Instant optimistic UI liking and listening history tracking.
- **🛡️ Comprehensive Admin Suite**: Metrics dashboard, track manager, artist manager, album release manager, and user role management.
- **✨ Premium Dark UI/UX**: Emerald green accent palette, glassmorphism headers, smooth hover animations, and responsive mobile navigation.

---

## 🛠️ Tech Stack

### **Frontend (`/client`)**
- **Framework**: React 18 + Vite 6 + TypeScript
- **Styling**: Tailwind CSS, CSS Grid, Custom Range Sliders & Glassmorphism
- **State Management**: Zustand (Global Audio Player, Auth, Toast Notifications)
- **Routing**: React Router v7
- **Icons**: Lucide React

### **Backend (`/server`)**
- **Runtime & Server**: Node.js + Express + TypeScript
- **Database & ORM**: SQLite (default zero-config) / PostgreSQL ready with Prisma ORM
- **Authentication**: JSON Web Tokens (JWT) + BcryptJS
- **Media Processing**: Multer + Music-Metadata
- **Audio Streaming**: Custom HTTP Range Streamer (`206 Partial Content`)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js 18+ installed

### 2. Install Dependencies & Build
From the project root:
```bash
# Install root dependencies
npm install

# Setup server
cd server
npm install
npx prisma generate
npx prisma db push
npm run seed
cd ..

# Setup client
cd client
npm install
cd ..
```

### 3. Start Development Servers
Run both backend API and frontend client concurrently:
```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API Server**: [http://localhost:5000](http://localhost:5000)
- **Static Media Uploads**: [http://localhost:5000/uploads](http://localhost:5000/uploads)

---

## 👥 Demo Accounts (Pre-Seeded)

| Role | Email | Password | Access |
|---|---|---|---|
| **Administrator** | `admin@vibeflow.com` | `admin123` | Full Admin Dashboard, Audio Uploads, User Management |
| **Regular User** | `user@vibeflow.com` | `password123` | Playlists, Liked Songs, Listening History |

*Note: Quick 1-click fill buttons are available on the Login screen for instant access.*

---

## 📡 API Endpoints Reference

### **Authentication**
- `POST /api/auth/register` - Create user account
- `POST /api/auth/login` - Authenticate user & retrieve JWT
- `GET /api/auth/me` - Get current authenticated user
- `PUT /api/auth/profile` - Update display name and avatar

### **Tracks**
- `GET /api/tracks` - List tracks (supports `?genre=`, `?artistId=`, `?albumId=`, `?search=`, `?sort=`)
- `GET /api/tracks/:id` - Get track details
- `POST /api/tracks` - Upload audio & artwork (Admin only)
- `PUT /api/tracks/:id` - Edit track metadata (Admin only)
- `DELETE /api/tracks/:id` - Delete track (Admin only)
- `POST /api/tracks/:id/like` - Like a track
- `DELETE /api/tracks/:id/like` - Unlike a track
- `POST /api/tracks/:id/play` - Log play count & recently played

### **Artists & Albums**
- `GET /api/artists` & `GET /api/artists/:id`
- `POST /api/artists` & `PUT /api/artists/:id` (Admin only)
- `GET /api/albums` & `GET /api/albums/:id`
- `POST /api/albums` & `PUT /api/albums/:id` (Admin only)

### **Playlists**
- `GET /api/playlists` - List featured playlists
- `GET /api/playlists/user/me` - Get current user playlists
- `POST /api/playlists` - Create new playlist
- `PUT /api/playlists/:id` - Edit playlist
- `DELETE /api/playlists/:id` - Delete playlist
- `POST /api/playlists/:id/tracks` - Add track to playlist
- `DELETE /api/playlists/:id/tracks/:trackId` - Remove track

### **Search & Streaming**
- `GET /api/search?q=:query` - Categorized search results
- `GET /api/stream/track/:id` - HTTP Range audio stream
- `GET /api/stream/file/:filename` - Direct audio stream

### **Administration**
- `GET /api/admin/stats` - Platform metrics and totals
- `GET /api/admin/users` - User directory
- `PUT /api/admin/users/:id/role` - Promote/demote user roles
- `DELETE /api/admin/users/:id` - Delete user account

---

## 📦 Production Deployment

1. **Build Backend**:
   ```bash
   cd server && npm run build
   ```
2. **Build Frontend**:
   ```bash
   cd client && npm run build
   ```
3. **Environment Setup**:
   Set `NODE_ENV=production`, `DATABASE_URL` (SQLite or PostgreSQL connection string), `JWT_SECRET`, and `CLIENT_URL`.
4. **Start Production Server**:
   ```bash
   cd server && npm start
   ```
