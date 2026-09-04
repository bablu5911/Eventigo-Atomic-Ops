import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden animate-pulse shadow-lg">
      <div className="h-48 bg-slate-800/80 w-full" />
      <div className="p-5 space-y-4">
        <div className="h-4 bg-slate-800 rounded w-1/3" />
        <div className="h-6 bg-slate-800 rounded w-3/4" />
        <div className="h-4 bg-slate-800 rounded w-1/2" />
        <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
          <div className="h-5 bg-slate-800 rounded w-1/4" />
          <div className="h-9 bg-slate-800 rounded-lg w-1/3" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
