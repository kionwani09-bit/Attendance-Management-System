import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  LogOut,
  Calendar,
  Clock,
} from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  currentUser: UserType | null;
  onLogout: () => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  selectedDate,
  setSelectedDate,
}) => {
  const [liveTime, setLiveTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 shadow-xs gap-4">
      {/* Brand & Title */}
      <div className="flex items-center gap-3 shrink-0">
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

      {/* Live Calendar Date & Clock Bar */}
      <div className="hidden lg:flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-[11px] font-bold uppercase text-slate-500">Calendar Date:</span>
          <span className="text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200"></div>

        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-700">
          <Clock className="w-4 h-4 text-indigo-600 animate-pulse shrink-0" />
          <span>{liveTime || '00:00:00 AM'}</span>
        </div>
      </div>

      {/* User Profile & Logout */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
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
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
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

