import React from 'react';
import { Track } from '../../types';
import { TrackRow } from './TrackRow';
import { Clock } from 'lucide-react';

interface TrackTableProps {
  tracks: Track[];
  playlistId?: string;
  onRemoveFromPlaylist?: (trackId: string) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
  showHeader?: boolean;
}

export const TrackTable: React.FC<TrackTableProps> = ({
  tracks,
  playlistId,
  onRemoveFromPlaylist,
  onOpenAddToPlaylist,
  showHeader = true,
}) => {
  if (tracks.length === 0) {
    return (
      <div className="py-12 text-center text-zinc-500">
        <p className="text-base font-medium">No tracks found.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {showHeader && (
        <div className="flex items-center gap-4 px-4 py-2 border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
          <div className="w-6 text-center">#</div>
          <div className="flex-1">Title</div>
          <div className="hidden md:block flex-1">Album</div>
          <div className="w-6" />
          <div className="w-12 text-right flex justify-end">
            <Clock className="w-4 h-4" />
          </div>
          <div className="w-6" />
        </div>
      )}

      <div className="flex flex-col gap-1">
        {tracks.map((track, idx) => (
          <TrackRow
            key={`${track.id}-${idx}`}
            track={track}
            index={idx}
            playlistId={playlistId}
            onRemoveFromPlaylist={onRemoveFromPlaylist}
            onOpenAddToPlaylist={onOpenAddToPlaylist}
            allTracks={tracks}
          />
        ))}
      </div>
    </div>
  );
};
