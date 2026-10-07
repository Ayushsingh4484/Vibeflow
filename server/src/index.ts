import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { ENV } from './config/env';
import { UPLOADS_DIR } from './services/storageService';

// Import route handlers
import authRoutes from './routes/authRoutes';
import trackRoutes from './routes/trackRoutes';
import artistRoutes from './routes/artistRoutes';
import albumRoutes from './routes/albumRoutes';
import playlistRoutes from './routes/playlistRoutes';
import searchRoutes from './routes/searchRoutes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import streamRoutes from './routes/streamRoutes';
import jamendoRoutes from './routes/jamendoRoutes';

const app = express();

// Middlewares
app.use(
  cors({
    origin: true, // Allow all origins in dev / production frontend
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static file serving with proper cache headers & CORS
app.use(
  '/uploads',
  cors(),
  express.static(UPLOADS_DIR, {
    maxAge: '1d',
    setHeaders: (res) => {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  })
);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'VibeFlow API',
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/jamendo', jamendoRoutes);

// 404 Route handler
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: `API route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

// Start Server
app.listen(ENV.PORT, () => {
  console.log(`\n🎵 =========================================`);
  console.log(`🚀 VibeFlow API Server running at http://localhost:${ENV.PORT}`);
  console.log(`📁 Uploads available at http://localhost:${ENV.PORT}/uploads`);
  console.log(`🎵 =========================================\n`);
});

export default app;
