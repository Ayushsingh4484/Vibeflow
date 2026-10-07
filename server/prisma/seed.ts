import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Helper to generate a playable PCM WAV audio file with melodies and chords
function generateWavAudio(durationSeconds: number, baseFreq: number, melodyNotes: number[]): Buffer {
  const sampleRate = 44100;
  const numChannels = 2;
  const bitsPerSample = 16;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;

  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20); // AudioFormat PCM = 1
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate music synthesis (harmonic chords + melody + beat pulse)
  let offset = 44;
  const beatInterval = sampleRate * 0.5; // 120 BPM

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    
    // Smooth envelope attack/decay at beginning and end
    let masterEnv = 1;
    if (t < 1) masterEnv = t;
    if (t > durationSeconds - 2) masterEnv = Math.max(0, (durationSeconds - t) / 2);

    // Chord base
    const bass = Math.sin(2 * Math.PI * baseFreq * t) * 0.3;
    const chord3 = Math.sin(2 * Math.PI * (baseFreq * 1.25) * t) * 0.2;
    const chord5 = Math.sin(2 * Math.PI * (baseFreq * 1.5) * t) * 0.2;

    // Melody arpeggio
    const noteIdx = Math.floor((t * 4) % melodyNotes.length);
    const melFreq = melodyNotes[noteIdx];
    const melEnv = Math.exp(-((t * 4) % 1) * 3);
    const melody = Math.sin(2 * Math.PI * melFreq * t) * 0.35 * melEnv;

    // Kick / percussion pulse
    const beatPhase = (i % Math.floor(beatInterval)) / beatInterval;
    const kick = Math.sin(2 * Math.PI * 60 * Math.exp(-beatPhase * 10) * beatPhase) * Math.exp(-beatPhase * 5) * 0.4;

    const sampleLeft = Math.max(-1, Math.min(1, (bass + chord3 + melody + kick) * masterEnv * 0.7));
    const sampleRight = Math.max(-1, Math.min(1, (bass + chord5 + melody + kick) * masterEnv * 0.7));

    buffer.writeInt16LE(Math.floor(sampleLeft * 32767), offset);
    buffer.writeInt16LE(Math.floor(sampleRight * 32767), offset + 2);
    offset += 4;
  }

  return buffer;
}

// Helper to generate a crisp modern SVG artwork
function generateSvgArtwork(title: string, subtitle: string, color1: string, color2: string, iconType: string = 'wave'): string {
  const iconShapes: Record<string, string> = {
    wave: `<path d="M50 250 Q 150 150 250 250 T 450 250" fill="none" stroke="white" stroke-width="12" stroke-linecap="round" opacity="0.8"/>
           <path d="M50 220 Q 150 320 250 220 T 450 220" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" opacity="0.5"/>`,
    synth: `<polygon points="250,100 380,350 120,350" fill="none" stroke="white" stroke-width="12" opacity="0.85"/>
            <circle cx="250" cy="240" r="45" fill="white" opacity="0.6"/>`,
    disk: `<circle cx="250" cy="250" r="140" fill="none" stroke="white" stroke-width="8" opacity="0.7"/>
           <circle cx="250" cy="250" r="80" fill="none" stroke="white" stroke-width="6" opacity="0.5"/>
           <circle cx="250" cy="250" r="30" fill="white" opacity="0.9"/>`,
    nebula: `<circle cx="200" cy="200" r="100" fill="white" opacity="0.15"/>
             <circle cx="300" cy="280" r="80" fill="white" opacity="0.2"/>
             <path d="M100 400 L400 100" stroke="white" stroke-width="10" opacity="0.6"/>`,
  };

  const selectedShape = iconShapes[iconType] || iconShapes.wave;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color1}"/>
      <stop offset="100%" stop-color="${color2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.6"/>
    </radialGradient>
  </defs>
  <rect width="500" height="500" rx="32" fill="url(#grad)"/>
  <rect width="500" height="500" rx="32" fill="url(#glow)"/>
  <g>${selectedShape}</g>
  <rect x="25" y="380" width="450" height="95" rx="16" fill="rgba(0, 0, 0, 0.45)"/>
  <text x="50" y="422" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800" fill="#ffffff">${title}</text>
  <text x="50" y="455" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="500" fill="rgba(255,255,255,0.8)">${subtitle}</text>
</svg>`;
}

async function main() {
  console.log('🌱 Starting VibeFlow Database Seeding with Real Audio & Artwork...');

  // Ensure directories
  const audioDir = path.resolve(__dirname, '../uploads/audio');
  const artworkDir = path.resolve(__dirname, '../uploads/artwork');
  const avatarDir = path.resolve(__dirname, '../uploads/avatars');

  [audioDir, artworkDir, avatarDir].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  // Clean old database records
  await prisma.recentlyPlayed.deleteMany({});
  await prisma.likedTrack.deleteMany({});
  await prisma.playlistTrack.deleteMany({});
  await prisma.playlist.deleteMany({});
  await prisma.track.deleteMany({});
  await prisma.album.deleteMany({});
  await prisma.artist.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned existing records.');

  // Create Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'VibeFlow Admin',
      email: 'admin@vibeflow.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      name: 'Alex Mercer',
      email: 'user@vibeflow.com',
      passwordHash: userPassword,
      role: 'USER',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
    },
  });

  console.log('👤 Created Users: admin@vibeflow.com & user@vibeflow.com');

  // Track & Audio Definitions
  const demoAudioFiles = [
    { filename: 'midnight_city_vibes.wav', duration: 45, base: 130.81, notes: [261.63, 329.63, 392.0, 523.25] },
    { filename: 'neon_dreams.wav', duration: 40, base: 146.83, notes: [293.66, 369.99, 440.0, 587.33] },
    { filename: 'lofi_rain.wav', duration: 50, base: 110.0, notes: [220.0, 261.63, 329.63, 440.0] },
    { filename: 'synthwave_sunset.wav', duration: 42, base: 164.81, notes: [329.63, 415.3, 493.88, 659.25] },
    { filename: 'deep_focus.wav', duration: 48, base: 123.47, notes: [246.94, 311.13, 369.99, 493.88] },
    { filename: 'electric_pulse.wav', duration: 38, base: 174.61, notes: [349.23, 440.0, 523.25, 698.46] },
    { filename: 'chill_frequencies.wav', duration: 52, base: 98.0, notes: [196.0, 246.94, 293.66, 392.0] },
    { filename: 'starlight_drift.wav', duration: 46, base: 138.59, notes: [277.18, 349.23, 415.3, 554.37] },
    { filename: 'cosmic_echo.wav', duration: 44, base: 155.56, notes: [311.13, 392.0, 466.16, 622.25] },
    { filename: 'hyperdrive.wav', duration: 36, base: 185.0, notes: [369.99, 466.16, 554.37, 739.99] },
  ];

  console.log('🎼 Generating synthesized audio files in uploads/audio...');
  for (const trackAudio of demoAudioFiles) {
    const audioPath = path.join(audioDir, trackAudio.filename);
    const wavBuffer = generateWavAudio(trackAudio.duration, trackAudio.base, trackAudio.notes);
    fs.writeFileSync(audioPath, wavBuffer);
  }

  // Artwork Definitions
  const demoArtworks = [
    { filename: 'art_luna_eclipse.svg', title: 'Luna Eclipse', sub: 'Electronic & Synth', c1: '#8B5CF6', c2: '#EC4899', icon: 'wave' },
    { filename: 'art_aura_waves.svg', title: 'Aura Waves', sub: 'Ambient & Lo-Fi', c1: '#06B6D4', c2: '#3B82F6', icon: 'nebula' },
    { filename: 'art_hyperion_drive.svg', title: 'Hyperion Drive', sub: 'Cyberpunk Retrowave', c1: '#F97316', c2: '#EF4444', icon: 'synth' },
    { filename: 'art_velvet_horizon.svg', title: 'Velvet Horizon', sub: 'Indie & Chillout', c1: '#10B981', c2: '#059669', icon: 'disk' },
    { filename: 'art_solaris_echo.svg', title: 'Solaris Echo', sub: 'Melodic Techno', c1: '#6366F1', c2: '#A855F7', icon: 'synth' },

    { filename: 'cover_midnight_run.svg', title: 'Midnight Run', sub: 'Album by Luna Eclipse', c1: '#4F46E5', c2: '#7C3AED', icon: 'synth' },
    { filename: 'cover_celestial_tides.svg', title: 'Celestial Tides', sub: 'Album by Aura Waves', c1: '#0284C7', c2: '#0D9488', icon: 'wave' },
    { filename: 'cover_cyber_city.svg', title: 'Cyber City 2099', sub: 'Album by Hyperion Drive', c1: '#DC2626', c2: '#F59E0B', icon: 'synth' },
    { filename: 'cover_golden_hour.svg', title: 'Golden Hour', sub: 'Album by Velvet Horizon', c1: '#D97706', c2: '#EA580C', icon: 'disk' },
    { filename: 'cover_quantum_beats.svg', title: 'Quantum Beats', sub: 'Album by Solaris Echo', c1: '#7E22CE', c2: '#BE185D', icon: 'nebula' },
    { filename: 'cover_playlist_top.svg', title: "Today's Top Vibes", sub: 'Curated by VibeFlow', c1: '#1DB954', c2: '#191414', icon: 'wave' },
    { filename: 'cover_playlist_lofi.svg', title: 'Late Night Lo-Fi', sub: 'Deep Study Beats', c1: '#475569', c2: '#1E293B', icon: 'nebula' },
    { filename: 'cover_playlist_drive.svg', title: 'Cyberpunk Drive', sub: 'Night Highway Beats', c1: '#E11D48', c2: '#4C1D95', icon: 'synth' },
  ];

  console.log('🎨 Generating crisp custom SVG artworks in uploads/artwork...');
  for (const art of demoArtworks) {
    const artPath = path.join(artworkDir, art.filename);
    const svgContent = generateSvgArtwork(art.title, art.sub, art.c1, art.c2, art.icon);
    fs.writeFileSync(artPath, svgContent);
  }

  // Create Artists
  const artistsData = [
    {
      name: 'Luna Eclipse',
      bio: 'Electronic producer and synthesist sculpting euphoric synthscapes and melodic rhythms.',
      imageUrl: 'http://localhost:5000/uploads/artwork/art_luna_eclipse.svg',
    },
    {
      name: 'Aura Waves',
      bio: 'Master of ambient textures, soothing lo-fi soundscapes, and calming harmonic frequencies.',
      imageUrl: 'http://localhost:5000/uploads/artwork/art_aura_waves.svg',
    },
    {
      name: 'Hyperion Drive',
      bio: 'High-octane cyberpunk and retrowave artist delivering cinematic basslines and neon aesthetics.',
      imageUrl: 'http://localhost:5000/uploads/artwork/art_hyperion_drive.svg',
    },
    {
      name: 'Velvet Horizon',
      bio: 'Warm indie acoustic and chillout grooves designed for sunsets and relaxed road trips.',
      imageUrl: 'http://localhost:5000/uploads/artwork/art_velvet_horizon.svg',
    },
    {
      name: 'Solaris Echo',
      bio: 'Deep melodic techno and atmospheric electronic music produced for festival mainstages.',
      imageUrl: 'http://localhost:5000/uploads/artwork/art_solaris_echo.svg',
    },
  ];

  const createdArtists: Record<string, any> = {};
  for (const a of artistsData) {
    const artist = await prisma.artist.create({ data: a });
    createdArtists[a.name] = artist;
  }
  console.log(`🎤 Created ${Object.keys(createdArtists).length} Artists.`);

  // Create Albums
  const albumsData = [
    {
      title: 'Midnight Run',
      artistId: createdArtists['Luna Eclipse'].id,
      coverUrl: 'http://localhost:5000/uploads/artwork/cover_midnight_run.svg',
      releaseDate: '2025-11-12',
    },
    {
      title: 'Celestial Tides',
      artistId: createdArtists['Aura Waves'].id,
      coverUrl: 'http://localhost:5000/uploads/artwork/cover_celestial_tides.svg',
      releaseDate: '2025-08-20',
    },
    {
      title: 'Cyber City 2099',
      artistId: createdArtists['Hyperion Drive'].id,
      coverUrl: 'http://localhost:5000/uploads/artwork/cover_cyber_city.svg',
      releaseDate: '2026-01-15',
    },
    {
      title: 'Golden Hour',
      artistId: createdArtists['Velvet Horizon'].id,
      coverUrl: 'http://localhost:5000/uploads/artwork/cover_golden_hour.svg',
      releaseDate: '2025-06-01',
    },
    {
      title: 'Quantum Beats',
      artistId: createdArtists['Solaris Echo'].id,
      coverUrl: 'http://localhost:5000/uploads/artwork/cover_quantum_beats.svg',
      releaseDate: '2026-02-28',
    },
  ];

  const createdAlbums: Record<string, any> = {};
  for (const alb of albumsData) {
    const album = await prisma.album.create({ data: alb });
    createdAlbums[alb.title] = album;
  }
  console.log(`💿 Created ${Object.keys(createdAlbums).length} Albums.`);

  // Create Tracks with real audio URLs
  const tracksData = [
    {
      title: 'Midnight City Vibes',
      artistId: createdArtists['Luna Eclipse'].id,
      albumId: createdAlbums['Midnight Run'].id,
      audioUrl: 'http://localhost:5000/uploads/audio/midnight_city_vibes.wav',
      coverUrl: 'http://localhost:5000/uploads/artwork/cover_midnight_run.svg',
      duration: 45,
      genre: 'Synthwave',
      trackNumber: 1,
      playCount: 1420,
    },
    {
      title: 'Neon Dreams',
      artistId: createdArtists['Luna Eclipse'].id,
      albumId: createdAlbums['Midnight Run'].id,
      audioUrl: 'http://localhost:5000/uploads/audio/neon_dreams.wav',
      coverUrl: 'http://localhost:5000/uploads/artwork/cover_midnight_run.svg',
      duration: 40,
      genre: 'Synthwave',
      trackNumber: 2,
      playCount: 980,
    },
    {
      title: 'Lo-Fi Rain on Neon Windows',
      artistId: createdArtists['Aura Waves'].id,
      albumId: createdAlbums['Celestial Tides'].id,
      audioUrl: 'http://localhost:5000/uploads/audio/lofi_rain.wav',
      coverUrl: 'http://localhost:5000/uploads/artwork/cover_celestial_tides.svg',
      duration: 50,
      genre: 'Lo-Fi',
      trackNumber: 1,
      playCount: 3120,
    },
    {
      title: 'Celestial Drifting',
      artistId: createdArtists['Aura Waves'].id,
      albumId: createdAlbums['Celestial Tides'].id,
      audioUrl: 'http://localhost:5000/uploads/audio/chill_frequencies.wav',
      coverUrl: 'http://localhost:5000/uploads/artwork/cover_celestial_tides.svg',
      duration: 52,
      genre: 'Ambient',
      trackNumber: 2,
      playCount: 1850,
    },
    {
      title: 'Hyperdrive Neon Overdrive',
      artistId: createdArtists['Hyperion Drive'].id,
      albumId: createdAlbums['Cyber City 2099'].id,
      audioUrl: 'http://localhost:5000/uploads/audio/hyperdrive.wav',
      coverUrl: 'http://localhost:5000/uploads/artwork/cover_cyber_city.svg',
      duration: 36,
      genre: 'Cyberpunk',
      trackNumber: 1,
      playCount: 2450,
    },
    {
      title: 'Electric Pulse',
      artistId: createdArtists['Hyperion Drive'].id,
      albumId: createdAlbums['Cyber City 2099'].id,
      audioUrl: 'http://localhost:5000/uploads/audio/electric_pulse.wav',
      coverUrl: 'http://localhost:5000/uploads/artwork/cover_cyber_city.svg',
      duration: 38,
      genre: 'Cyberpunk',
      trackNumber: 2,
      playCount: 1720,
    },
    {
      title: 'Golden Sunset Breeze',
      artistId: createdArtists['Velvet Horizon'].id,
      albumId: createdAlbums['Golden Hour'].id,
      audioUrl: 'http://localhost:5000/uploads/audio/synthwave_sunset.wav',
      coverUrl: 'http://localhost:5000/uploads/artwork/cover_golden_hour.svg',
      duration: 42,
      genre: 'Chillout',
      trackNumber: 1,
      playCount: 1640,
    },
    {
      title: 'Starlight Drift',
      artistId: createdArtists['Velvet Horizon'].id,
      albumId: createdAlbums['Golden Hour'].id,
      audioUrl: 'http://localhost:5000/uploads/audio/starlight_drift.wav',
      coverUrl: 'http://localhost:5000/uploads/artwork/cover_golden_hour.svg',
      duration: 46,
      genre: 'Indie Pop',
      trackNumber: 2,
      playCount: 1290,
    },
    {
      title: 'Deep Focus Pulse',
      artistId: createdArtists['Solaris Echo'].id,
      albumId: createdAlbums['Quantum Beats'].id,
      audioUrl: 'http://localhost:5000/uploads/audio/deep_focus.wav',
      coverUrl: 'http://localhost:5000/uploads/artwork/cover_quantum_beats.svg',
      duration: 48,
      genre: 'Melodic Techno',
      trackNumber: 1,
      playCount: 2890,
    },
    {
      title: 'Cosmic Echo Horizons',
      artistId: createdArtists['Solaris Echo'].id,
      albumId: createdAlbums['Quantum Beats'].id,
      audioUrl: 'http://localhost:5000/uploads/audio/cosmic_echo.wav',
      coverUrl: 'http://localhost:5000/uploads/artwork/cover_quantum_beats.svg',
      duration: 44,
      genre: 'Deep House',
      trackNumber: 2,
      playCount: 2150,
    },
  ];

  const createdTracks = [];
  for (const t of tracksData) {
    const track = await prisma.track.create({ data: t });
    createdTracks.push(track);
  }
  console.log(`🎶 Created ${createdTracks.length} Playable Tracks.`);

  // Create Playlists
  const playlistsData = [
    {
      name: "Today's Top Vibes",
      description: 'The absolute best electronic, synthwave, and chill tracks trending right now on VibeFlow.',
      coverUrl: 'http://localhost:5000/uploads/artwork/cover_playlist_top.svg',
      userId: admin.id,
      trackIds: [createdTracks[0].id, createdTracks[2].id, createdTracks[4].id, createdTracks[6].id, createdTracks[8].id],
    },
    {
      name: 'Late Night Lo-Fi',
      description: 'Mellow beats, soothing keys, and ambient frequencies for focus and relaxation.',
      coverUrl: 'http://localhost:5000/uploads/artwork/cover_playlist_lofi.svg',
      userId: admin.id,
      trackIds: [createdTracks[2].id, createdTracks[3].id, createdTracks[7].id, createdTracks[8].id],
    },
    {
      name: 'Cyberpunk Highway Drive',
      description: 'High energy synth rhythms and bass pulses built for high-speed night drives.',
      coverUrl: 'http://localhost:5000/uploads/artwork/cover_playlist_drive.svg',
      userId: demoUser.id,
      trackIds: [createdTracks[4].id, createdTracks[5].id, createdTracks[0].id, createdTracks[9].id],
    },
  ];

  for (const p of playlistsData) {
    const playlist = await prisma.playlist.create({
      data: {
        name: p.name,
        description: p.description,
        coverUrl: p.coverUrl,
        userId: p.userId,
      },
    });

    for (let i = 0; i < p.trackIds.length; i++) {
      await prisma.playlistTrack.create({
        data: {
          playlistId: playlist.id,
          trackId: p.trackIds[i],
          position: i,
        },
      });
    }
  }
  console.log(`📑 Created ${playlistsData.length} Curated Playlists.`);

  // Create Likes for Demo User
  for (let i = 0; i < 4; i++) {
    await prisma.likedTrack.create({
      data: {
        userId: demoUser.id,
        trackId: createdTracks[i].id,
      },
    });
  }
  console.log('❤️ Seeded Liked Tracks.');

  // Create Recently Played History
  for (let i = 0; i < createdTracks.length; i++) {
    await prisma.recentlyPlayed.create({
      data: {
        userId: demoUser.id,
        trackId: createdTracks[i].id,
        playedAt: new Date(Date.now() - (createdTracks.length - i) * 3600000),
      },
    });
  }
  console.log('🕒 Seeded Recently Played.');

  console.log('\n✨ Database seeding completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
