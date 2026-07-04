import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  position?: 'left' | 'right';
}

export default function Drawer({ isOpen, onClose, title, children, position = 'right' }: DrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Drawer */}
      <div
        className={`relative w-[420px] max-w-full h-full bg-[#070B14] border-[#223047] shadow-2xl overflow-y-auto animate-slide-in ${
          position === 'left' ? 'border-r' : 'border-l ml-auto'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-[#070B14] border-b border-[#223047]">
          <h3 className="text-sm font-semibold text-[#F8FAFC]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#0B1220] text-[#98A2B3] hover:text-[#F8FAFC] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
