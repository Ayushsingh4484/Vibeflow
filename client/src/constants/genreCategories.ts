export interface GenreCategory {
  name: string;
  query: string;
  imageUrl: string;
  artistHint: string;
  gradient: string;
}

export const HOME_GENRE_CATEGORIES: GenreCategory[] = [
  {
    name: 'Electronic',
    query: 'Electronic',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    artistHint: 'EDM & House Anthems',
    gradient: 'from-blue-950/80 via-black/40 to-transparent',
  },
  {
    name: 'Chill Vibes',
    query: 'Chill',
    imageUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
    artistHint: 'Relaxed Melodies',
    gradient: 'from-cyan-950/80 via-black/40 to-transparent',
  },
  {
    name: 'Lo-Fi Beats',
    query: 'Lo-Fi',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    artistHint: 'Late Night Study Beats',
    gradient: 'from-amber-950/80 via-black/40 to-transparent',
  },
  {
    name: 'Rock',
    query: 'Rock',
    imageUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&auto=format&fit=crop&q=80',
    artistHint: 'Classic & Modern Rock',
    gradient: 'from-red-950/80 via-black/40 to-transparent',
  },
  {
    name: 'Pop',
    query: 'Pop',
    imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80',
    artistHint: 'Chart-Topping Hits',
    gradient: 'from-pink-950/80 via-black/40 to-transparent',
  },
  {
    name: 'Jazz',
    query: 'Jazz',
    imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&auto=format&fit=crop&q=80',
    artistHint: 'Smooth Brass & Keys',
    gradient: 'from-yellow-950/80 via-black/40 to-transparent',
  },
  {
    name: 'Ambient',
    query: 'Ambient',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
    artistHint: 'Deep Soundscapes',
    gradient: 'from-sky-950/80 via-black/40 to-transparent',
  },
  {
    name: 'Focus & Study',
    query: 'Focus',
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80',
    artistHint: 'Calm Instrumental',
    gradient: 'from-emerald-950/80 via-black/40 to-transparent',
  },
];
