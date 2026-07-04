interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export default function Skeleton({ className = '', width, height = 'h-4' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-[#223047]/30 rounded ${height} ${width || 'w-full'} ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-4">
      <Skeleton height="h-4" width="w-1/3" className="mb-3" />
      <Skeleton height="h-8" width="w-1/2" className="mb-2" />
      <Skeleton height="h-3" width="w-1/4" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-4 space-y-3">
      <div className="flex gap-4 mb-4">
        <Skeleton height="h-4" width="w-1/4" />
        <Skeleton height="h-4" width="w-1/4" />
        <Skeleton height="h-4" width="w-1/4" />
        <Skeleton height="h-4" width="w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton height="h-10" width="w-1/4" />
          <Skeleton height="h-10" width="w-1/4" />
          <Skeleton height="h-10" width="w-1/4" />
          <Skeleton height="h-10" width="w-1/4" />
        </div>
      ))}
    </div>
  );
}
