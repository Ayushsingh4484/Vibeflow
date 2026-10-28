export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '0 min';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours} hr ${mins} min`;
  }
  if (mins > 0) {
    return `${mins} min ${secs > 0 ? `${secs} sec` : ''}`;
  }
  return `${secs} sec`;
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return num.toString();
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const KNOWN_LABELS = new Set([
  't-series',
  'tseries',
  'saregama',
  'saregama telugu',
  'saregama music',
  'zee music company',
  'zee music',
  'sony music india',
  'sony music',
  'tips official',
  'tips',
  'yrf',
  'speed records',
  'divo music',
  'redlist - worldwide songs',
  'redlist',
  'worldwide songs',
  'sursangeet',
]);

function isLabel(name?: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase().trim();
  if (KNOWN_LABELS.has(lower)) return true;
  return (
    lower.includes('records') ||
    lower.includes('music company') ||
    lower.includes('worldwide songs') ||
    lower.includes('saregama') ||
    lower.includes('t-series')
  );
}

function cleanQuotes(str: string): string {
  return (str || '')
    .replace(/^['"“‘`]+|['"”’`]+$/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Extracts and cleans the genuine song title from raw YouTube or API titles
 */
export function cleanSongTitle(rawTitle: string): string {
  if (!rawTitle || rawTitle === 'YouTube Song' || rawTitle === 'Trending Song') {
    return 'Music Track';
  }

  let title = rawTitle.trim();

  // Strip prefix clutter
  title = title.replace(
    /^(?:lyrical(?:\s*video)?|official(?:\s*music)?(?:\s*video)?|full(?:\s*video)?(?:\s*song)?|audio(?:\s*song)?|video(?:\s*song)?|teaser|trailer)\s*[:|-]\s*/i,
    ''
  );

  // Strip bracket clutter (Official Video, 4K, etc.)
  title = title.replace(
    /\s*[\(\[](?:official\s*(?:music|lyric|audio|video|visualizer)?\s*(?:video|audio|track)?|lyrics?|lyric\s*video|full\s*(?:video|song|audio)|4k(?:\s*ultra\s*hd)?|8k|hd|video\s*song|visuali[zs]er|extended|hq|audio|music\s*video)[\)\]]/gi,
    ''
  );

  // If pipe separated (e.g. "One Bottle Down | Yo Yo Honey Singh | T-Series")
  if (title.includes('|')) {
    const parts = title.split(/\s*\|\s*/);
    let p0 = parts[0].trim();
    if (p0.includes(':')) {
      p0 = p0.split(/\s*:\s*/)[0];
    }
    p0 = p0.replace(/\s*-\s*(?:video\s*song|official\s*(?:video|audio)|music\s*video|lyric\s*video|audio\s*song|audio)\b.*/i, '');
    title = p0;
  } else if (title.includes(' - ') || title.includes(' – ')) {
    // "Artist - Song Title"
    const dashMatch = title.match(/^[^-–—]+\s*[-–—]\s*([^-–—]+)(?:\s*[-–—|]\s*(.*))?$/);
    if (dashMatch) {
      title = dashMatch[1].trim();
    }
  }

  // Remove trailing descriptors
  title = title.replace(
    /\s+(?:full\s*song\s*(?:with\s*lyrics?)?|with\s*lyrics?|lyric\s*video|full\s*video|video\s*song|official\s*(?:audio|video)|audio\s*song|song)\b/gi,
    ''
  );

  title = cleanQuotes(title);

  // Uppercase to title-case if whole string is all caps
  if (title && title === title.toUpperCase() && title.length > 3) {
    title = title
      .toLowerCase()
      .split(' ')
      .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : ''))
      .join(' ');
  }

  return title || 'Music Track';
}

/**
 * Extracts and cleans authentic artist name, filtering out YouTube channel labels
 */
export function cleanArtistName(rawArtist: string, rawTitle?: string): string {
  if (!rawArtist || rawArtist === 'YouTube Artist') {
    return 'Artist';
  }

  // If artist is already valid person name and not a record label
  if (!isLabel(rawArtist)) {
    let name = cleanQuotes(rawArtist);
    if (name.toLowerCase() === 'apdhillon') return 'AP Dhillon';
    if (name.toLowerCase() === 'yoyohoneysingh') return 'Yo Yo Honey Singh';
    if (name.toLowerCase() === 'jvke') return 'JVKE';
    return name;
  }

  // If artist was a label like T-Series or Saregama, try to extract real artist from rawTitle
  if (rawTitle) {
    const KNOWN_ARTISTS = [
      'Anirudh Ravichander',
      'Yo Yo Honey Singh',
      'Karan Aujla',
      'Diljit Dosanjh',
      'AP Dhillon',
      'Arijit Singh',
      'Sid Sriram',
      'A.R. Rahman',
      'Shreya Ghoshal',
      'Pritam',
      'Badshah',
      'Guru Randhawa',
      'Bruno Mars',
      'Taylor Swift',
      'Ed Sheeran',
      'Gracie Abrams',
      'Harry Styles',
      'JVKE',
    ];

    for (const artist of KNOWN_ARTISTS) {
      if (rawTitle.toLowerCase().includes(artist.toLowerCase())) {
        return artist;
      }
    }

    if (rawTitle.includes('|')) {
      const parts = rawTitle.split(/\s*\|\s*/).map((p) => cleanQuotes(p));
      for (let i = 1; i < parts.length; i++) {
        if (!isLabel(parts[i]) && !/^(?:latest|new|trending|full|video|song|official)\b/i.test(parts[i])) {
          return parts[i];
        }
      }
    }
  }

  return cleanQuotes(rawArtist);
}
