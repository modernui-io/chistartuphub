import { memo } from 'react';

const PageSkeleton = memo(function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#050A14] animate-pulse">
      {/* Header skeleton */}
      <div className="h-20 bg-white/5 border-b border-white/10" />
      
      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Title skeleton */}
        <div className="h-12 bg-white/5 rounded w-1/3 mb-8" />
        
        {/* Content blocks */}
        <div className="space-y-4">
          <div className="h-32 bg-white/5 rounded" />
          <div className="h-32 bg-white/5 rounded" />
          <div className="h-32 bg-white/5 rounded" />
        </div>
      </div>
    </div>
  );
});

export default PageSkeleton;
