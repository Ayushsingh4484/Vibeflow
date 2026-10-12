import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Setting up clean VibeFlow database with initial users...');

  // Ensure directories exist
  const audioDir = path.resolve(__dirname, '../uploads/audio');
  const artworkDir = path.resolve(__dirname, '../uploads/artwork');
  const avatarDir = path.resolve(__dirname, '../uploads/avatars');

  [audioDir, artworkDir, avatarDir].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  // Ensure clean admin and demo accounts exist
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@vibeflow.com' },
    update: {},
    create: {
      name: 'VibeFlow Admin',
      email: 'admin@vibeflow.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@vibeflow.com' },
    update: {},
    create: {
      name: 'Alex Mercer',
      email: 'user@vibeflow.com',
      passwordHash: userPassword,
      role: 'USER',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
    },
  });

  console.log('👤 Standard demo accounts ready (admin@vibeflow.com & user@vibeflow.com).');
  console.log('✨ Database clean - no predefined songs seeded.');
}

main()
  .catch((e) => {
    console.error('❌ Error in seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
