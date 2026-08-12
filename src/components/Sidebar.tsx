import React from 'react';
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  FileSpreadsheet,
  UserCheck2,
} from 'lucide-react';
import { Role } from '../types';

export type TabType = 'dashboard' | 'mark' | 'users' | 'reports' | 'my_attendance';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  userRole: Role;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
}) => {
  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard Overview',
      icon: LayoutDashboard,
      roles: ['Admin'],
    },
    {
      id: 'mark' as TabType,
      label: 'Mark Attendance',
      icon: ClipboardCheck,
      roles: ['Admin'],
      badge: 'Daily',
    },
    {
      id: 'users' as TabType,
      label: 'Members Directory',
      icon: Users,
      roles: ['Admin'],
    },
    {
      id: 'reports' as TabType,
      label: 'Reports & Exports',
      icon: FileSpreadsheet,
      roles: ['Admin'],
      badge: 'Excel/PDF',
    },
    {
      id: 'my_attendance' as TabType,
      label: 'My Attendance & Leave',
      icon: UserCheck2,
      roles: ['Student/Employee', 'Teacher/HR', 'Admin'],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="w-full md:w-64 bg-slate-900 flex flex-col flex-shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
      <div className="py-5 flex-1">
        <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Main Menu
        </div>
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-slate-800 text-white border-l-4 border-indigo-500'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
