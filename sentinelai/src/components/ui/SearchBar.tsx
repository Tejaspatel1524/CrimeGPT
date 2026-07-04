import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 bg-[#0B1220] border border-[#223047] rounded-lg text-sm text-[#F8FAFC] placeholder-[#98A2B3] focus:outline-none focus:border-[#00B8FF] focus:ring-1 focus:ring-[#00B8FF]/20 transition-all"
      />
    </div>
  );
}
