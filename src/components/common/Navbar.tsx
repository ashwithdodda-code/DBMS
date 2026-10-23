import React from 'react';
import { ShieldCheck, Compass, Car, Calendar, User, ArrowRight, LayoutDashboard } from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenOperations: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, onOpenOperations }) => {
  return (
    <header className="sticky top-0 z-40 bg-[#080B10]/95 backdrop-blur-md border-b border-[#263241]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onNavigate('/')}
          className="text-lg font-bold tracking-tight text-[#F4F7FA] whitespace-nowrap shrink-0 flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="w-2.5 h-2.5 rounded-sm bg-[#C7F36B] inline-block" />
          <span>VELOCITY <span className="text-[#C7F36B]">OS</span></span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#93A1B2]">
          <button
            onClick={() => onNavigate('/vehicles')}
            className={`hover:text-[#F4F7FA] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentPath === '/vehicles' ? 'text-[#C7F36B]' : ''
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Fleet Discovery</span>
          </button>
          
          <button
            onClick={() => onNavigate('/#how-it-works')}
            className="hover:text-[#F4F7FA] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Compass className="w-4 h-4" />
            <span>How It Works</span>
          </button>

          <button
            onClick={() => onNavigate('/my-bookings')}
            className={`hover:text-[#F4F7FA] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentPath.startsWith('/my-bookings') ? 'text-[#C7F36B]' : ''
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>My Bookings</span>
          </button>

          <button
            onClick={() => onNavigate('/profile')}
            className={`hover:text-[#F4F7FA] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentPath === '/profile' ? 'text-[#C7F36B]' : ''
            }`}
          >
            <User className="w-4 h-4" />
            <span>Customer Profile</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action (Mode Switcher to Operations Console) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenOperations}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#18212C] hover:bg-[#263241] border border-[#263241] text-[#F4F7FA] hover:text-[#C7F36B] transition-all whitespace-nowrap shrink-0"
            title="Switch to Admin & Operations Fleet Console"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-[#C7F36B]" />
            <span>Operations Console</span>
            <ArrowRight className="w-3 h-3 text-[#93A1B2]" />
          </button>
        </div>
      </div>
    </header>
  );
};
