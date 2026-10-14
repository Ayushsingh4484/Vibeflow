export interface GenreCategory {
  name: string;
  query: string;
  imageUrl: string;
  artistHint: string;
  gradient: string;
}

export const HOME_GENRE_CATEGORIES: GenreCategory[] = [
  {
    name: 'Bollywood',
    query: 'Bollywood Hits',
    imageUrl: 'https://lh3.googleusercontent.com/W_yOqnKSDYyeVOY_AsXhuAtb6rW3vCL3GtJ9DA1GxWOrJfyeSOqzvTv_TkFHijdkVPXWutASBlRFPg=w600-h600-p-l90-rj',
    artistHint: 'Arijit Singh & Shreya Ghoshal',
    gradient: 'from-amber-950/80 via-black/40 to-transparent',
  },
  {
    name: 'Punjabi Hits',
    query: 'Punjabi Hits',
    imageUrl: 'https://yt3.googleusercontent.com/7EYXXMXY594V8y4sZT2aawmdKgDAGTu5jNm9C-HpR3jY9cZJ0NMxS__nZKBdWZ1PUpJPjc2BAA=w600-h600-p-l90-rj',
    artistHint: 'Diljit Dosanjh & AP Dhillon',
    gradient: 'from-orange-950/80 via-black/40 to-transparent',
  },
  {
    name: 'Pop Hits',
    query: 'Pop Hits',
    imageUrl: 'https://yt3.googleusercontent.com/RCpTA6EXJQyjVFDosWOKa2SMmqkua_lA9mHPDWWciLwgqpZLz-k8rXWRF_367trrQ7up9BUwCbk6kRk=w600-h600-p-l90-rj',
    artistHint: 'Taylor Swift & Billie Eilish',
    gradient: 'from-pink-950/80 via-black/40 to-transparent',
  },
  {
    name: 'Hip-Hop & Rap',
    query: 'Hip-Hop',
    imageUrl: 'https://yt3.googleusercontent.com/MxNjcRJ-uK4Xvx7u90IhEFLQM8x9LIGTA9VCKHq5U4Wn2jOgiWaMtg-qz329SIzqnCyhdCCB3MpdAGs=w600-h600-p-l90-rj',
    artistHint: 'Drake, Eminem & Sidhu Moose Wala',
    gradient: 'from-purple-950/80 via-black/40 to-transparent',
  },
  {
    name: 'Electronic / EDM',
    query: 'Electronic Dance',
    imageUrl: 'https://yt3.googleusercontent.com/1-Ipiq-y8WyAcWn88nuxwTHaaBWMg8VkCBuP3puDCec-neD3v-7SqoBRzmmBKmA-lir_Ie70yw9EKHk=w600-h600-p-l90-rj',
    artistHint: 'Alan Walker & Martin Garrix',
    gradient: 'from-blue-950/80 via-black/40 to-transparent',
  },
  {
    name: 'Rock & Arena',
    query: 'Rock',
    imageUrl: 'https://lh3.googleusercontent.com/IOKuXtp8PCQ_Fc-vaRKm3sKIXBxFV51gZheLTH5br-YGnWHFQf_Jywcuk7wbprYRoEbQyS_XZY6-nMJX=w600-h600-p-l90-rj',
    artistHint: 'Coldplay & Arena Rock',
    gradient: 'from-red-950/80 via-black/40 to-transparent',
  },
  {
    name: 'R&B & Soul',
    query: 'R&B Soul',
    imageUrl: 'https://lh3.googleusercontent.com/U-SAmNOu4TynE818gLCfKsuHZ0U5YNEtO9mrjSI9WCCKERs98LzrCal5kajBBTQNwdcisoB2Bn-pHp4=w600-h600-p-l90-rj',
    artistHint: 'The Weeknd & Bruno Mars',
    gradient: 'from-rose-950/80 via-black/40 to-transparent',
  },
  {
    name: 'Indian Classical & Sufi',
    query: 'A. R. Rahman Sufi',
    imageUrl: 'https://yt3.googleusercontent.com/vHMOuDn8gr3SW9Pm8yFgmtYzM5kj4ayng5HKRjW0OyjG9mPK923XMVtTZTt4NUG_1aemWNLSQ27zjtA=w600-h600-p-l90-rj',
    artistHint: 'A. R. Rahman & Sufi Maestros',
    gradient: 'from-emerald-950/80 via-black/40 to-transparent',
  },
  {
    name: 'Chill & Acoustic',
    query: 'Acoustic Chill',
    imageUrl: 'https://lh3.googleusercontent.com/jQoBIAS6JjFGpcqQY1M_Mh3AasOvFENCdVRxkgax1a0K6qiq7AgE3MbJ6Jtt-Jndcarvoawmrg66KTny=w600-h600-p-l90-rj',
    artistHint: 'Ed Sheeran & Acoustic Melodies',
    gradient: 'from-teal-950/80 via-black/40 to-transparent',
  },
  {
    name: 'Lo-Fi Study Beats',
    query: 'Lo-Fi Beats',
    imageUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
    artistHint: 'Late Night Chill & Study',
    gradient: 'from-indigo-950/80 via-black/40 to-transparent',
  },
];
