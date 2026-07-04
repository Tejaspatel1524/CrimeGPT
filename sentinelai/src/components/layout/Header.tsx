import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, Search, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchVal, setSearchVal] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      navigate(`/cases?q=${encodeURIComponent(searchVal)}`);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between gap-6 px-6 border-b border-[#223047] bg-[#070B14]">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search cases, entities, officers..."
            className="w-full pl-10 pr-4 py-2 bg-[#0B1220] border border-[#223047] rounded-lg text-sm text-[#F8FAFC] placeholder-[#98A2B3] focus:outline-none focus:border-[#00B8FF] focus:ring-1 focus:ring-[#00B8FF]/20 transition-all"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-[#98A2B3] hover:text-[#F8FAFC] hover:bg-[#0B1220] transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00B8FF] rounded-full" />
        </button>

        {/* User Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 pl-3 border-l border-[#223047] hover:bg-[#0B1220] rounded-lg pr-2 py-1 transition-colors"
          >
            <div className="hidden lg:block text-right">
              <p className="text-sm font-medium text-[#F8FAFC]">{user?.full_name || 'User'}</p>
              <p className="text-xs text-[#98A2B3]">{user?.department || user?.role || 'Officer'}</p>
            </div>
            {user?.profile_photo ? (
              <img
                src={user.profile_photo}
                alt={user.full_name}
                className="w-10 h-10 rounded-lg object-cover border border-[#223047]"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-[#00B8FF]/10 border border-[#00B8FF]/20 flex items-center justify-center">
                <span className="text-sm font-bold text-[#00B8FF]">
                  {user ? getInitials(user.full_name) : <User className="w-5 h-5" />}
                </span>
              </div>
            )}
            <ChevronDown className={`w-4 h-4 text-[#98A2B3] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#121B2A] border border-[#223047] rounded-lg shadow-2xl overflow-hidden animate-fade-in">
              <div className="p-4 border-b border-[#223047]">
                <p className="text-sm font-medium text-[#F8FAFC]">{user?.full_name}</p>
                <p className="text-xs text-[#98A2B3] mt-0.5">{user?.email}</p>
              </div>
              <div className="p-2">
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-[#F8FAFC] hover:bg-[#0B1220] rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  View Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-[#F8FAFC] hover:bg-[#0B1220] rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings & Profile
                </Link>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#FF4D6D] hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
