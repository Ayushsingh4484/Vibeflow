// Comprehensive utility to extract authentic song title and artist from YouTube video titles
// Eliminates YouTube video clutter (e.g. 'Official Video', '4K', 'Lyrical', label names like T-Series/Saregama)

const KNOWN_LABELS = new Set([
  't-series',
  't-series apna punjab',
  'tseries',
  'saregama',
  'saregama music',
  'saregama telugu',
  'saregama tamil',
  'zee music company',
  'zee music',
  'sony music india',
  'sony music south',
  'sonymusicindiavevo',
  'sony music',
  'tips official',
  'tips music',
  'tips',
  'yrf',
  'yash raj films',
  'speed records',
  'times music',
  'aditya music',
  'lahari music',
  'white hill music',
  'geet mp3',
  'divo music',
  'redlist - worldwide songs',
  'redlist',
  'worldwide songs',
  'sursangeet',
  'venus',
  'pen movies',
  't-series bhaktisagar',
  'desimusicfactory',
  't-series regional',
]);

export interface CleanedTrackMetadata {
  title: string;
  artist: string;
}

function normalize(str: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isKnownLabel(name?: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase().trim();
  if (KNOWN_LABELS.has(lower)) return true;
  return (
    lower.includes('records') ||
    lower.includes('music company') ||
    lower.includes('music channel') ||
    lower.includes('worldwide songs') ||
    lower.includes('official channel') ||
    lower.includes('vevo') ||
    lower.includes('music label') ||
    lower.includes('saregama') ||
    lower.includes('t-series')
  );
}

function cleanQuotes(str: string): string {
  if (!str) return '';
  return str
    .replace(/^['"“‘`]+|['"”’`]+$/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function cleanBracketNoise(str: string): string {
  return str
    // Remove bracketed noise
    .replace(
      /\s*[\(\[](?:official\s*(?:music|lyric|audio|video|visualizer)?\s*(?:video|audio|track)?|lyrics?|lyric\s*video|full\s*(?:video|song|audio)|4k(?:\s*ultra\s*hd)?|8k|hd|video\s*song|visuali[zs]er|extended|hq|audio|music\s*video|remastered|explicit|teaser|trailer|motion\s*poster)[\)\]]/gi,
      ''
    )
    .replace(/\s*[\(\[](?:from\s*["'][^"']+["'])[\)\]]/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\[\s*\]/g, '')
    .trim();
}

function cleanSongClutter(str: string): string {
  return str
    .replace(/\s+(?:full\s*song\s*(?:with\s*lyrics?)?|with\s*lyrics?|lyric\s*video|full\s*video|video\s*song|official\s*(?:audio|video)|audio\s*song|song)\b/gi, '')
    .trim();
}

export function cleanTrackMetadata(rawTitle: string, channelOrArtist?: string): CleanedTrackMetadata {
  let raw = (rawTitle || '').trim();
  if (!raw || raw === 'YouTube Song' || raw === 'Trending Song') {
    return {
      title: 'Trending Music',
      artist: channelOrArtist && !isKnownLabel(channelOrArtist) ? channelOrArtist.trim() : 'Artist',
    };
  }

  // 1. Strip common prefixes like 'LYRICAL: ', 'OFFICIAL VIDEO: ', 'AUDIO: '
  raw = raw.replace(
    /^(?:lyrical(?:\s*video)?|official(?:\s*music)?(?:\s*video)?|full(?:\s*video)?(?:\s*song)?|audio(?:\s*song)?|video(?:\s*song)?|teaser|trailer)\s*[:|-]\s*/i,
    ''
  );

  // 2. Remove standard bracket noise
  let cleaned = cleanBracketNoise(raw);

  let finalTitle = '';
  let finalArtist = '';

  // 3. Pipe-separated titles (e.g., Indian releases: "One Bottle Down | Yo Yo Honey Singh | T-Series")
  if (cleaned.includes('|')) {
    const pipeParts = cleaned.split(/\s*\|\s*/).map((p) => cleanQuotes(cleanBracketNoise(p))).filter(Boolean);

    if (pipeParts.length > 0) {
      let p0 = pipeParts[0];

      // If p0 has colon (e.g. "MILLIONAIRE SONG (Full Video): @YoYoHoneySingh")
      if (p0.includes(':')) {
        const colonSplit = p0.split(/\s*:\s*/);
        finalTitle = cleanQuotes(cleanSongClutter(cleanBracketNoise(colonSplit[0])));
        const afterColon = colonSplit.slice(1).join(' ').replace(/@/, '').trim();
        if (afterColon && !isKnownLabel(afterColon)) {
          finalArtist = cleanQuotes(afterColon);
        }
      } else {
        // Remove trailing descriptors like "- Video Song", "Full Song with LYRICS", etc.
        p0 = p0.replace(/\s*-\s*(?:video\s*song|official\s*(?:video|audio)|music\s*video|lyric\s*video|audio\s*song|audio)\b.*/i, '');
        finalTitle = cleanQuotes(cleanSongClutter(p0));
      }

      // Find best artist from the rest of pipe parts
      if (!finalArtist) {
        const KNOWN_PRIORITY_ARTISTS = [
          'anirudh ravichander',
          'anirudh',
          'yo yo honey singh',
          'honey singh',
          'karan aujla',
          'diljit dosanjh',
          'ap dhillon',
          'arijit singh',
          'sid sriram',
          'a.r. rahman',
          'ar rahman',
          'shreya ghoshal',
          'pritam',
          'devi sri prasad',
          'thaman s',
          'thaman',
          'badshah',
          'guru randhawa',
          'neha kakkar',
          'jubin nautiyal',
          'atif aslam',
          'sonu nigam',
        ];

        // Check if any candidate matches high priority artist
        for (let i = 1; i < pipeParts.length; i++) {
          const candidate = pipeParts[i];
          const candNorm = candidate.toLowerCase();
          if (KNOWN_PRIORITY_ARTISTS.some((a) => candNorm.includes(a))) {
            finalArtist = cleanQuotes(candidate);
            break;
          }
        }

        // If no priority artist found, take first valid non-label, non-marketing candidate
        if (!finalArtist) {
          for (let i = 1; i < pipeParts.length; i++) {
            const candidate = pipeParts[i];
            if (isKnownLabel(candidate)) continue;
            if (/^(?:latest|new|trending|full|video|song|official|hindi|punjabi|tamil|telugu|bhojpuri|music|hit)\b/i.test(candidate)) continue;
            if (/@\w+/.test(candidate)) {
              finalArtist = cleanQuotes(candidate.replace(/@/, ''));
              break;
            }
            if (!finalArtist) {
              finalArtist = candidate;
            }
          }
        }
      }
    }
  }

  // 4. Dash separated (e.g., "Bruno Mars - Risk It All" or "With You - AP Dhillon")
  if (!finalTitle && (cleaned.includes(' - ') || cleaned.includes(' – ') || cleaned.includes(' — '))) {
    const dashMatch = cleaned.match(/^([^-–—]+)\s*[-–—]\s*([^-–—]+)(?:\s*[-–—]\s*(.*))?$/);
    if (dashMatch) {
      const left = cleanQuotes(cleanBracketNoise(dashMatch[1]));
      const right = cleanQuotes(cleanBracketNoise(dashMatch[2]));

      const normChannel = channelOrArtist ? normalize(channelOrArtist) : '';
      const normLeft = normalize(left);
      const normRight = normalize(right);

      // If channel name matches left or right
      if (normChannel && (normChannel.includes(normLeft) || normLeft.includes(normChannel))) {
        finalArtist = left;
        finalTitle = cleanSongClutter(right);
      } else if (normChannel && (normChannel.includes(normRight) || normRight.includes(normChannel))) {
        finalArtist = right;
        finalTitle = cleanSongClutter(left);
      } else {
        // Standard convention: Left is Artist, Right is Song Title
        finalArtist = left;
        finalTitle = cleanSongClutter(right);
      }
    }
  }

  // 5. Colon separated (e.g., "Yo Yo Honey Singh : Dheere Dheere")
  if (!finalTitle && cleaned.includes(':')) {
    const colonParts = cleaned.split(/\s*:\s*/).map((p) => cleanQuotes(cleanBracketNoise(p))).filter(Boolean);
    if (colonParts.length === 2) {
      const p0 = colonParts[0];
      const p1 = colonParts[1];
      if (isKnownLabel(p0)) {
        finalTitle = cleanSongClutter(p1);
      } else {
        finalArtist = p0;
        finalTitle = cleanSongClutter(p1);
      }
    }
  }

  // Fallback: If still not parsed, clean whatever title string we have
  if (!finalTitle) {
    let fallback = cleaned
      .replace(/\s*[-|]\s*(?:video\s*song|official\s*(?:video|audio)|music\s*video|lyric\s*video|audio\s*song|audio)\b.*/i, '')
      .trim();
    finalTitle = cleanSongClutter(fallback);
  }

  // Strip artist name from title if it was appended (e.g. "LOW FADE KARAN AUJLA" -> "LOW FADE")
  if (channelOrArtist && !isKnownLabel(channelOrArtist)) {
    const normCh = normalize(channelOrArtist);
    if (normCh.length > 2 && normalize(finalTitle).endsWith(normCh)) {
      const regex = new RegExp(`\\s*${channelOrArtist.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*$`, 'i');
      finalTitle = finalTitle.replace(regex, '').trim();
    }
  }

  // Fallback artist resolution
  if (!finalArtist) {
    if (channelOrArtist && !isKnownLabel(channelOrArtist)) {
      finalArtist = channelOrArtist.trim();
    } else {
      finalArtist = 'Artist';
    }
  }

  // Final trim and quote stripping
  finalTitle = cleanQuotes(finalTitle);
  finalArtist = cleanQuotes(finalArtist);

  if (normalize(finalArtist) === 'yoyohoneysingh') {
    finalArtist = 'Yo Yo Honey Singh';
  } else if (normalize(finalArtist) === 'jvke') {
    finalArtist = 'JVKE';
  } else if (normalize(finalArtist) === 'apdhillon') {
    finalArtist = 'AP Dhillon';
  }

  // Capitalize properly if title is completely UPPERCASE
  if (finalTitle && finalTitle === finalTitle.toUpperCase() && finalTitle.length > 3) {
    finalTitle = finalTitle
      .toLowerCase()
      .split(' ')
      .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : ''))
      .join(' ');
  }

  // Capitalize artist properly if completely UPPERCASE
  if (finalArtist && finalArtist === finalArtist.toUpperCase() && finalArtist.length > 3) {
    finalArtist = finalArtist
      .toLowerCase()
      .split(' ')
      .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : ''))
      .join(' ');
  }

  return {
    title: finalTitle || 'Music Track',
    artist: finalArtist || 'Artist',
  };
}
