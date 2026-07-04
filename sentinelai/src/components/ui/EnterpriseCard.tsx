import type { ReactNode } from 'react';

interface EnterpriseCardProps {
  children: ReactNode;
  className?: string;
  accent?: boolean;
  hover?: boolean;
}

export default function EnterpriseCard({ children, className = '', accent = false, hover = true }: EnterpriseCardProps) {
  return (
    <div className={`
      bg-[#121B2A] border border-[#223047] rounded-lg
      ${accent ? 'border-t-2 border-t-[#00B8FF]' : ''}
      ${hover ? 'hover:border-[#2a3d5a] transition-all duration-200' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}
