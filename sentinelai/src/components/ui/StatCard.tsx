import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  accent?: boolean;
}

export default function StatCard({ label, value, subtitle, icon: Icon, trend, trendValue, accent = false }: StatCardProps) {
  const trendColors = {
    up: 'text-[#00D084]',
    down: 'text-[#FF4D6D]',
    neutral: 'text-[#98A2B3]',
  };

  return (
    <div className={`
      bg-[#121B2A] border border-[#223047] rounded-lg p-4
      ${accent ? 'border-t-2 border-t-[#00B8FF]' : ''}
      hover:border-[#2a3d5a] transition-all duration-200
    `}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-[#0B1220] flex items-center justify-center">
            <Icon className="w-4 h-4 text-[#00B8FF]" />
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-[#F8FAFC] tracking-tight font-mono">{value}</p>
          {subtitle && <p className="text-xs text-[#98A2B3] mt-1">{subtitle}</p>}
        </div>
        {trend && trendValue && (
          <span className={`text-sm font-semibold ${trendColors[trend]}`}>{trendValue}</span>
        )}
      </div>
    </div>
  );
}
