import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-dark-surface/60 p-4 rounded-xl border border-white/5 animate-pulse flex flex-col gap-3">
      <div className="w-full aspect-square bg-white/10 rounded-lg" />
      <div className="h-4 bg-white/10 rounded w-3/4" />
      <div className="h-3 bg-white/5 rounded w-1/2" />
    </div>
  );
};

export const TrackRowSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg animate-pulse">
      <div className="w-6 h-4 bg-white/5 rounded" />
      <div className="w-10 h-10 bg-white/10 rounded shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/10 rounded w-1/3" />
        <div className="h-3 bg-white/5 rounded w-1/4" />
      </div>
      <div className="w-16 h-4 bg-white/5 rounded hidden md:block" />
      <div className="w-10 h-4 bg-white/5 rounded" />
    </div>
  );
};
