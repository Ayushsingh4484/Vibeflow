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
      className="group relative bg-[#181818]/60 hover:bg-[#282828] p-4 rounded-xl transition-all duration-300 cursor-pointer flex flex-col gap-3.5 border border-white/5 hover:border-white/10 hover:shadow-xl hover:-translate-y-1"
    >
      {/* Artwork Container */}
      <div className="relative aspect-square w-full overflow-hidden shadow-lg bg-zinc-900 rounded-lg">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              isArtist ? 'rounded-full' : 'rounded-lg'
            }`}
            loading="lazy"
            onError={(e) => {
              // Fallback placeholder image
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(title)}`;
            }}
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-600 ${
              isArtist ? 'rounded-full' : 'rounded-lg'
            }`}
          >
            <span className="text-3xl font-bold">{title.charAt(0)}</span>
          </div>
        )}

        {/* Source Badge */}
        {(badge || source === 'jamendo') && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/70 backdrop-blur-md text-amber-300 border border-amber-500/30 tracking-wide uppercase">
            {badge || 'Jamendo'}
          </span>
        )}

        {/* Hover Play Button */}
        {onPlay && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(e);
            }}
            className="absolute bottom-3 right-3 w-12 h-12 bg-brand-500 hover:bg-brand-400 text-black rounded-full flex items-center justify-center shadow-2xl opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 active:scale-95"
            title={`Play ${title}`}
          >
            <Play className="w-5 h-5 fill-current ml-0.5 text-black" />
          </button>
        )}
      </div>

      {/* Info Container */}
      <div className="flex flex-col gap-1 min-w-0">
        <h3 className="font-bold text-base text-white truncate group-hover:text-brand-400 transition-colors">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-normal">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
