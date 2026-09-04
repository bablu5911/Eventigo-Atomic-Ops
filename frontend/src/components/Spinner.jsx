import React from 'react';

const Spinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className={`flex justify-center items-center py-4 ${className}`}>
      <div
        className={`${sizeClasses[size] || sizeClasses.md} border-slate-700 border-t-cyan-500 rounded-full animate-spin`}
      />
    </div>
  );
};

export default Spinner;
