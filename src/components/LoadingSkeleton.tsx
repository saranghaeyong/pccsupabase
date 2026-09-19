import React from 'react';

export const LoadingSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-3 border border-[#EAE4DC] shadow-xs flex flex-col justify-between animate-pulse"
        >
          <div className="w-full aspect-[4/5] rounded-xl bg-[#EFE9E2] mb-3.5" />
          <div className="px-1.5 pb-1 space-y-2.5">
            <div className="h-4 bg-[#E2DBD1] rounded-md w-3/4" />
            <div className="space-y-1.5">
              <div className="h-3 bg-[#EFE9E2] rounded-md w-1/2" />
              <div className="h-3 bg-[#EFE9E2] rounded-md w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
