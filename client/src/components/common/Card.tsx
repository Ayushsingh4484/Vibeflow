import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';

interface CardProps {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  type?: 'album' | 'artist' | 'playlist' | 'track';
  source?: 'local' | 'jamendo';
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
      className="group relative bg-white dark:bg-[#1c1d24] hover:bg-zinc-50 dark:hover:bg-[#252632] p-3.5 rounded-2xl md:rounded-3xl transition-all duration-300 cursor-pointer flex flex-col gap-3 border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 shrink-0"
    >
      {/* Artwork Container */}
      <div className="relative aspect-square w-full overflow-hidden shadow-md bg-zinc-100 dark:bg-zinc-800 rounded-xl md:rounded-2xl">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              isArtist ? 'rounded-full' : 'rounded-xl md:rounded-2xl'
            }`}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(title)}`;
            }}
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-rose-700 text-white ${
              isArtist ? 'rounded-full' : 'rounded-xl md:rounded-2xl'
            }`}
          >
            <span className="text-3xl font-extrabold">{title.charAt(0)}</span>
          </div>
        )}

        {/* Source Badge */}
        {(badge || source === 'jamendo') && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-black/70 backdrop-blur-md text-amber-300 border border-amber-500/30 tracking-wider uppercase">
            {badge || 'Jamendo'}
          </span>
        )}

        {/* Play Button Overlay */}
        {onPlay && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(e);
            }}
            className="absolute bottom-3 right-3 w-11 h-11 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-red-500/30 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 active:scale-95"
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
