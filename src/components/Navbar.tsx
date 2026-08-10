import React from 'react';
import {
  UserCheck,
  LogOut,
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  selectedDate?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 shadow-xs">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
          <UserCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-base tracking-tight">SYSTECH</span>
            <span className="text-slate-300 font-normal">/</span>
            <span className="text-slate-600 font-semibold text-xs sm:text-sm">Attendance Engine</span>
          </div>
        </div>
      </div>

      {/* User Profile & Logout */}
      <div className="flex items-center gap-2 sm:gap-4">
        {currentUser && (
          <div className="flex items-center gap-2.5">
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full border border-slate-200 object-cover"
            />
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {currentUser.role}
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
