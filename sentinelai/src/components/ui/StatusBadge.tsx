type BadgeVariant = 'success' | 'warning' | 'danger' | 'primary' | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  success: 'bg-[#00D084]/10 text-[#00D084] border-[#00D084]/20',
  warning: 'bg-[#FFB020]/10 text-[#FFB020] border-[#FFB020]/20',
  danger: 'bg-[#FF4D6D]/10 text-[#FF4D6D] border-[#FF4D6D]/20',
  primary: 'bg-[#00B8FF]/10 text-[#00B8FF] border-[#00B8FF]/20',
  neutral: 'bg-[#223047]/50 text-[#98A2B3] border-[#223047]',
};

export default function StatusBadge({ label, variant, className = '' }: StatusBadgeProps) {
  return (
    <span className={`
      inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border
      ${variants[variant]}
      ${className}
    `}>
      {label}
    </span>
  );
}
