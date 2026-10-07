import React from 'react';
import { Link } from 'react-router-dom';
import { Disc, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center gap-4">
      <div className="w-16 h-16 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center">
        <Disc className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-black text-white">404 - Page Not Found</h1>
      <p className="text-zinc-400 text-sm max-w-md">
        We couldn't find the page or track you were looking for. It might have been moved or removed.
      </p>
      <Link
        to="/"
        className="mt-2 px-6 py-2.5 rounded-full bg-brand-500 hover:bg-brand-400 text-black font-bold text-sm flex items-center gap-2 transition-all shadow-lg"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Home
      </Link>
    </div>
  );
};
