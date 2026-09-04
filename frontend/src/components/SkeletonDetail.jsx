import React from 'react';

const SkeletonDetail = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-pulse">
      <div className="h-80 bg-slate-800 rounded-2xl w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-8 bg-slate-800 rounded w-2/3" />
          <div className="h-4 bg-slate-800 rounded w-1/4" />
          <div className="h-32 bg-slate-800 rounded-xl w-full" />
        </div>
        <div className="h-64 bg-slate-800 rounded-2xl w-full" />
      </div>
    </div>
  );
};

export default SkeletonDetail;
