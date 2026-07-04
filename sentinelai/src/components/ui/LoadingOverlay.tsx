import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070B14]/80 backdrop-blur-sm">
      <div className="bg-[#121B2A] border border-[#223047] rounded-lg px-6 py-4 flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-[#00B8FF] animate-spin" />
        <span className="text-sm font-medium text-[#F8FAFC]">{message}</span>
      </div>
    </div>
  );
}
