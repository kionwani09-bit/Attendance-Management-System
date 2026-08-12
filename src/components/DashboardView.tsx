import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarCheck,
  Search,
  UserPlus,
  FileSpreadsheet,
  ClipboardCheck,
  Check,
  X,
  Calendar,
  User as UserIcon,
  Building,
  Sparkles,
} from 'lucide-react';
import {
  AttendanceRecord,
  Employee,
  AttendanceStatus,
  User,
  LeaveRequest,
  LeaveStatus,
} from '../types';
import { DEPARTMENTS } from '../data/mockData';

interface DashboardViewProps {
  currentUser: User | null;
  attendanceRecords: AttendanceRecord[];
  employees: Employee[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  onNavigateTab: (tab: 'mark' | 'reports' | 'users' | 'my_attendance') => void;
  leaveRequests?: LeaveRequest[];
  onUpdateLeaveStatus?: (id: string, status: LeaveStatus) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  attendanceRecords,
  employees,
  selectedDate,
  setSelectedDate,
  onNavigateTab,
  leaveRequests = [],
  onUpdateLeaveStatus,
}) => {
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [searchQuery, setSearchQuery] = useState('');
  const [leaveFilter, setLeaveFilter] = useState<'pending' | 'all'>('pending');

  // Stats calculation
  const todaysRecords = attendanceRecords.filter((r) => r.date === selectedDate);
  const activeEmployees = employees.filter((e) => e.status === 'Active');

  const totalMembers = employees.length;
  const presentCount = todaysRecords.filter((r) => r.status === 'Present').length;
  const absentCount = todaysRecords.filter((r) => r.status === 'Absent').length;
  const leaveCount = todaysRecords.filter((r) => r.status === 'Leave').length;
  const lateCount = todaysRecords.filter((r) => r.status === 'Late').length;

  const pendingLeaveCount = leaveRequests.filter((lr) => lr.status === 'Pending').length;

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'Present':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3" /> VERIFIED
          </span>
        );
      case 'Absent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">
            <XCircle className="w-3 h-3" /> ABSENT
          </span>
        );
      case 'Leave':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">
            <CalendarCheck className="w-3 h-3" /> ON LEAVE
          </span>
        );
      case 'Late':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold">
            <Clock className="w-3 h-3" /> LATE
          </span>
        );
    }
  };

  // Filtered list for table view
  const filteredRecords = todaysRecords.filter((r) => {
    const matchesDept =
      selectedDept === 'All Departments' || r.department === selectedDept;
    const matchesSearch =
      r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Admin Alert Notification for Pending Leave Requests */}
      {pendingLeaveCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-950 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold flex items-center gap-2">
                Pending Leave Applications Requiring Decision
                <span className="px-2 py-0.5 rounded-full text-xs bg-amber-200 text-amber-900 font-bold">
                  {pendingLeaveCount} Request{pendingLeaveCount > 1 ? 's' : ''}
                </span>
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Student/Employee or Teacher/HR members have submitted leave requests. Review and approve or decline them below to notify the applicant.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setLeaveFilter('pending');
              const el = document.getElementById('leave-applications-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer transition-colors shrink-0 shadow-2xs"
          >
            Review Now
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor daily attendance, track member metrics, and manage leave applications.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-lg">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-semibold text-slate-500">Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-slate-900 text-xs font-bold focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold">Quick Shortcuts:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('mark')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            <ClipboardCheck className="w-3.5 h-3.5" /> Mark Daily Attendance
          </button>
          <button
            onClick={() => onNavigateTab('users')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition-colors border border-slate-700"
          >
            <UserPlus className="w-3.5 h-3.5 text-indigo-400" /> Members Directory
          </button>
          <button
            onClick={() => onNavigateTab('reports')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition-colors border border-slate-700"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-400" /> Export Reports
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase mb-1">Total Members</p>
          <h3 className="text-2xl font-bold text-slate-900">{totalMembers}</h3>
          <div className="mt-2 text-xs text-indigo-600 font-medium">Active System Profiles</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase mb-1">Verified Present</p>
          <h3 className="text-2xl font-bold text-slate-900">{presentCount}</h3>
          <div className="mt-2 text-xs text-green-600 font-medium">
            {totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0}% Attendance Rate
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase mb-1">Unexcused / Absent</p>
          <h3 className="text-2xl font-bold text-slate-900">{absentCount}</h3>
          <div className="mt-2 text-xs text-red-500 font-medium">Flagged Absences</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase mb-1">Leave & Delayed</p>
          <h3 className="text-2xl font-bold text-slate-900">{leaveCount + lateCount}</h3>
          <div className="mt-2 text-xs text-amber-600 font-medium">
            {leaveCount} Leave • {lateCount} Late
          </div>
        </div>
      </div>

      {/* Leave Requests Approval Management Center */}
      <div id="leave-applications-section" className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-indigo-600" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-base">Leave Applications</h2>
                {pendingLeaveCount > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    {pendingLeaveCount} Pending
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                    All Reviewed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review submitted leave applications and update approval status.
              </p>
            </div>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setLeaveFilter('pending')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                leaveFilter === 'pending'
                  ? 'bg-white text-indigo-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({pendingLeaveCount})
            </button>
            <button
              onClick={() => setLeaveFilter('all')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                leaveFilter === 'all'
                  ? 'bg-white text-indigo-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All History ({leaveRequests.length})
            </button>
          </div>
        </div>

        {leaveRequests.filter((lr) => (leaveFilter === 'pending' ? lr.status === 'Pending' : true)).length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {leaveFilter === 'pending'
              ? 'No pending leave requests requiring attention.'
              : 'No leave requests recorded.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {leaveRequests
              .filter((lr) => (leaveFilter === 'pending' ? lr.status === 'Pending' : true))
              .map((lr) => (
                <div key={lr.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <img
                        src={lr.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                        alt={lr.employeeName}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                      />
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{lr.employeeName}</h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            ID: {lr.employeeId}
                          </span>
                          {lr.type && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {lr.type}
                            </span>
                          )}
                          {lr.status === 'Pending' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" /> Pending
                            </span>
                          )}
                          {lr.status === 'Approved' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-green-600" /> Approved
                            </span>
                          )}
                          {lr.status === 'Rejected' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-red-600" /> Rejected
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                          {lr.designation && (
                            <span className="flex items-center gap-1">
                              <UserIcon className="w-3.5 h-3.5 text-slate-400" /> {lr.designation}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-slate-400" /> {lr.department}
                          </span>
                        </div>

                        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/80 border border-amber-200/60 text-amber-900 font-bold">
                            <Calendar className="w-3.5 h-3.5 text-amber-600" />
                            Leave Date: <span className="font-mono text-indigo-700">{lr.startDate}</span>
                          </div>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/80 border border-emerald-200/60 text-emerald-900 font-bold">
                            <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Report Back Date: <span className="font-mono text-emerald-700">{lr.reportBackDate || lr.startDate}</span>
                          </div>
                          <span className="text-slate-400 text-[11px]">Applied on {lr.appliedAt}</span>
                        </div>

                        <div className="mt-2 p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-700">
                          <span className="font-bold text-slate-900 block mb-0.5">Reason for Leave Request:</span>
                          <p className="italic">{lr.reason}</p>
                        </div>
                      </div>
                    </div>

                    {onUpdateLeaveStatus && lr.status === 'Pending' && (
                      <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                        <button
                          onClick={() => onUpdateLeaveStatus(lr.id, 'Approved')}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => onUpdateLeaveStatus(lr.id, 'Rejected')}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
                        >
                          <X className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Daily Attendance Registry Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-800 text-base">Daily Attendance Register</h2>
            <p className="text-xs text-slate-500 mt-0.5">Showing records for {selectedDate}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Member or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border-transparent rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <button
              onClick={() => onNavigateTab('mark')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer shadow-xs"
            >
              Mark Attendance
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase">
              <tr className="border-b border-slate-100">
                <th className="px-6 py-3.5">Identifier</th>
                <th className="px-6 py-3.5">Member Name</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Time Logged</th>
                <th className="px-6 py-3.5">Notes</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 text-xs">
                    No records found for date {selectedDate}.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-6 py-3 font-mono text-indigo-600 text-xs font-bold">
                      {rec.employeeId}
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900">{rec.employeeName}</td>
                    <td className="px-6 py-3 text-slate-500 text-xs">{rec.department}</td>
                    <td className="px-6 py-3">{getStatusBadge(rec.status)}</td>
                    <td className="px-6 py-3 font-mono text-xs text-slate-500">
                      {rec.checkInTime || '-'}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500 italic">
                      {rec.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredRecords.length} records</span>
          <button
            onClick={() => onNavigateTab('reports')}
            className="text-indigo-600 hover:underline font-medium cursor-pointer flex items-center gap-1"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Complete Register →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
