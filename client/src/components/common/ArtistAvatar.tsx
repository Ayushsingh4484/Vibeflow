import React, { useState, useEffect } from 'react';

interface ArtistAvatarProps {
  src?: string | null;
  name: string;
  className?: string;
  imgClassName?: string;
  alt?: string;
  loading?: 'lazy' | 'eager';
}

const getInitials = (name: string): string => {
  if (!name) return 'A';
  const clean = name.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return name.slice(0, 2).toUpperCase() || 'A';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const GRADIENTS = [
  'from-rose-600 to-red-800',
  'from-violet-600 to-purple-900',
  'from-blue-600 to-indigo-900',
  'from-amber-600 to-orange-800',
  'from-emerald-600 to-teal-900',
  'from-fuchsia-600 to-pink-900',
  'from-cyan-600 to-blue-900',
];

const getGradientForName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
};

export const ArtistAvatar: React.FC<ArtistAvatarProps> = ({
  src,
  name,
  className = '',
  imgClassName = '',
  alt,
  loading = 'lazy',
}) => {
  // Stage 0: direct load
  // Stage 1: retry via backend proxy endpoint (/api/stream/image?url=...)
  // Stage 2: fallback to initials
  const [retryStage, setRetryStage] = useState<number>(0);
  const [currentSrc, setCurrentSrc] = useState<string | null>(src || null);
  const [hasError, setHasError] = useState<boolean>(!src);

  useEffect(() => {
    setCurrentSrc(src || null);
    setRetryStage(0);
    setHasError(!src);
  }, [src]);

  const handleError = () => {
    if (
      retryStage === 0 &&
      currentSrc &&
      currentSrc.startsWith('http') &&
      !currentSrc.includes('/api/stream/image')
    ) {
      // First failure: retry through backend proxy without referrer
      const proxyUrl = `/api/stream/image?url=${encodeURIComponent(currentSrc)}`;
      setRetryStage(1);
      setCurrentSrc(proxyUrl);
    } else {
      // Proxy failed or invalid source: show elegant initials avatar
      setRetryStage(2);
      setHasError(true);
    }
  };

  const initials = getInitials(name);
  const gradient = getGradientForName(name);

  if (hasError || !currentSrc) {
    return (
      <div
        className={`w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br ${gradient} text-white select-none shadow-inner ${className}`}
        aria-label={name}
      >
        <span className="font-extrabold text-sm sm:text-base md:text-lg tracking-wider drop-shadow-md">
          {initials}
        </span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt || name}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={handleError}
      className={`w-full h-full object-cover object-center rounded-full ${imgClassName} ${className}`}
    />
  );
};

export default ArtistAvatar;
