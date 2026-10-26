import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { ArtistAvatar } from './ArtistAvatar';

interface CardProps {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  type?: 'album' | 'artist' | 'playlist' | 'track';
  source?: 'local' | 'jamendo' | 'youtube';
  badge?: string;
  linkTo?: string;
  onPlay?: (e: React.MouseEvent) => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  imageUrl,
  type = 'album',
  source,
  badge,
  linkTo,
  onPlay,
}) => {
  const navigate = useNavigate();
  const isArtist = type === 'artist';

  const handleClick = () => {
    if (linkTo) {
      navigate(linkTo);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="liquid-glass-card group relative p-3.5 rounded-2xl md:rounded-3xl cursor-pointer flex flex-col gap-3 shrink-0 overflow-hidden"
    >
      {/* Specular top light edge */}
      <div className="liquid-specular-top opacity-60 group-hover:opacity-100 transition-opacity" />

      {/* Artwork Container */}
      <div className="relative aspect-square w-full overflow-hidden shadow-md bg-zinc-100 dark:bg-zinc-800/80 rounded-xl md:rounded-2xl border border-black/5 dark:border-white/10">
        {isArtist ? (
          <ArtistAvatar
            src={imageUrl}
            name={title}
            imgClassName="group-hover:scale-105 transition-transform duration-500"
          />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 rounded-xl md:rounded-2xl"
            loading="lazy"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (imageUrl.startsWith('http') && !img.src.includes('/api/stream/image')) {
                img.src = `/api/stream/image?url=${encodeURIComponent(imageUrl)}`;
              } else {
                img.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(title)}`;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-rose-700 text-white rounded-xl md:rounded-2xl">
            <span className="text-3xl font-extrabold">{title.charAt(0)}</span>
          </div>
        )}

        {/* Source Badge */}
        {(badge || source === 'jamendo' || source === 'youtube') && (
          <span
            className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md text-[9px] font-black backdrop-blur-md border tracking-wider uppercase shadow-sm ${
              source === 'youtube'
                ? 'bg-red-600/80 text-white border-red-500/40'
                : 'bg-black/60 text-amber-300 border-amber-500/30'
            }`}
          >
            {badge || (source === 'youtube' ? 'YouTube' : 'Jamendo')}
          </span>
        )}

        {/* Play Button Overlay */}
        {onPlay && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(e);
            }}
            className="liquid-btn absolute bottom-3 right-3 w-11 h-11 bg-gradient-to-tr from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white rounded-full flex items-center justify-center shadow-xl shadow-red-500/40 border-t border-white/40 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200"
            title={`Play ${title}`}
          >
            <Play className="w-5 h-5 fill-current ml-0.5 text-white" />
          </button>
        )}
      </div>

      {/* Info Container */}
      <div className="flex flex-col gap-0.5 min-w-0 px-0.5">
        <h3 className="font-bold text-sm md:text-base text-slate-900 dark:text-white truncate group-hover:text-red-500 transition-colors">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
