export function OverviewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-[#061070] border border-white/[0.06] rounded-xl p-5 animate-pulse">
            <div className="h-4 w-32 bg-white/[0.04] rounded mb-4" />
            <div className="space-y-3">
              <div className="h-3 w-24 bg-white/[0.04] rounded" />
              <div className="h-5 w-full bg-white/[0.04] rounded" />
              <div className="h-3 w-24 bg-white/[0.04] rounded" />
              <div className="h-5 w-3/4 bg-white/[0.04] rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-[#061070] border border-white/[0.06] rounded-xl p-5 animate-pulse">
        <div className="h-4 w-48 bg-white/[0.04] rounded mb-4" />
        <div className="h-2 w-full bg-white/[0.04] rounded mb-4" />
        <div className="grid grid-cols-7 gap-3">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="h-20 bg-white/[0.04] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="bg-[#061070] border border-white/[0.06] rounded-xl p-4 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/[0.04] rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-white/[0.04] rounded" />
              <div className="h-3 w-32 bg-white/[0.04] rounded" />
              <div className="h-3 w-full bg-white/[0.04] rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EvidenceSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="bg-[#061070] border border-white/[0.06] rounded-xl p-4 animate-pulse">
          <div className="h-32 w-full bg-white/[0.04] rounded-lg mb-3" />
          <div className="h-4 w-3/4 bg-white/[0.04] rounded mb-2" />
          <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-3 mb-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-8 flex-1 bg-white/[0.04] rounded animate-pulse" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          {[1, 2, 3, 4, 5].map(j => (
            <div key={j} className="h-10 flex-1 bg-white/[0.04] rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}
