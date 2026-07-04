import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-lg bg-[#0B1220] border border-[#223047] flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[#98A2B3]" />
      </div>
      <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">{title}</h3>
      <p className="text-sm text-[#98A2B3] max-w-md mb-6">{description}</p>
      {action}
    </div>
  );
}
