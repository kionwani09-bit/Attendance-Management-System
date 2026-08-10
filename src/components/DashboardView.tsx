import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarCheck,
  Search,
  UserCheck2,
  ShieldCheck,
  UserPlus,
  FileSpreadsheet,
  ClipboardCheck,
  Mail,
  Phone,
  Building,
  Check,
  X,
  Calendar,
  User as UserIcon,
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
  const userRole = currentUser?.role || 'Admin';
  const userDept = currentUser?.department || 'All Departments';

  const [selectedDept, setSelectedDept] = useState(
    userRole === 'Teacher/HR' && userDept !== 'All' ? userDept : 'All Departments'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [leaveFilter, setLeaveFilter] = useState<'pending' | 'all'>('pending');

  const pendingLeaveCount = leaveRequests.filter((lr) => lr.status === 'Pending').length;

  // Filter records for selected date
  const todaysRecords = attendanceRecords.filter((r) => r.date === selectedDate);
  const activeEmployees = employees.filter((e) => e.status === 'Active');

  const presentCount = todaysRecords.filter((r) => r.status === 'Present').length;
  const absentCount = todaysRecords.filter((r) => r.status === 'Absent').length;
  const leaveCount = todaysRecords.filter((r) => r.status === 'Leave').length;
  const lateCount = todaysRecords.filter((r) => r.status === 'Late').length;

  const totalMembers = activeEmployees.length;

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

  // Employee-specific records if logged in as Student/Employee
  const myEmpId = currentUser?.employeeId || 'E001';
  const myRecords = attendanceRecords.filter((r) => r.employeeId === myEmpId);
  const myPresent = myRecords.filter((r) => r.status === 'Present').length;
  const myAbsent = myRecords.filter((r) => r.status === 'Absent').length;
  const myLeave = myRecords.filter((r) => r.status === 'Leave').length;
  const myLate = myRecords.filter((r) => r.status === 'Late').length;
  const myTotal = myRecords.length || 1;
  const myRate = Math.round(((myPresent + myLate * 0.5) / myTotal) * 100);

  return (
    <div className="space-y-6">
      {/* Role-Specific Top Bar Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              {userRole === 'Admin'
                ? 'System Administrator'
                : userRole === 'Teacher/HR'
                ? 'HR & Department Portal'
                : 'Employee Self-Service'}
            </span>
            <span className="text-xs text-slate-400">• Logged in as {currentUser?.name}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {userRole === 'Admin'
              ? 'Administrator Control Panel'
              : userRole === 'Teacher/HR'
              ? 'Department Management Console'
              : 'Personal Attendance Portal'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {userRole === 'Admin'
              ? 'Full organizational oversight, directory management, and system-wide attendance audit.'
              : userRole === 'Teacher/HR'
              ? 'Department workforce management, daily verification, and report generation.'
              : 'Overview of your personal attendance logs, present history, and leave requests.'}
          </p>
        </div>

        {/* Date Selector & Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          {userRole !== 'Student/Employee' && (
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
              <span className="text-xs font-medium text-slate-500">Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-slate-900 text-xs font-bold focus:outline-none cursor-pointer"
              />
            </div>
          )}

          {userRole === 'Admin' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab('users')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                <span>Manage Directory</span>
              </button>
              <button
                onClick={() => onNavigateTab('mark')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Mark Attendance</span>
              </button>
            </div>
          )}

          {userRole === 'Teacher/HR' && (
            <button
              onClick={() => onNavigateTab('mark')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Mark Today's Attendance</span>
            </button>
          )}

          {userRole === 'Student/Employee' && (
            <button
              onClick={() => onNavigateTab('my_attendance')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
            >
              <UserCheck2 className="w-3.5 h-3.5" />
              <span>View Full Logs</span>
            </button>
          )}
        </div>
      </div>

      {/* Role View: Student/Employee View */}
      {userRole === 'Student/Employee' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Attendance Rate</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{myRate}%</div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${myRate}%` }}></div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold text-green-600 uppercase">Present Days</div>
              <div className="text-2xl font-bold text-green-600 mt-1">{myPresent}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold text-red-500 uppercase">Absent Days</div>
              <div className="text-2xl font-bold text-red-500 mt-1">{myAbsent}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold text-amber-600 uppercase">Leave Days</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">{myLeave}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold text-indigo-600 uppercase">Late Days</div>
              <div className="text-2xl font-bold text-indigo-600 mt-1">{myLate}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Your Recent Attendance Logs</h3>
              <button
                onClick={() => onNavigateTab('my_attendance')}
                className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
              >
                Apply for Leave →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Time Logged</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {myRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-400">
                        No attendance history found.
                      </td>
                    </tr>
                  ) : (
                    myRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600">{r.date}</td>
                        <td className="py-3 px-4">{getStatusBadge(r.status)}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{r.checkInTime || '-'}</td>
                        <td className="py-3 px-4 text-slate-500 italic">{r.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Role View: Admin / HR View */
        <>
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-medium text-slate-500 uppercase mb-1">Total Members</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalMembers}</h3>
              <div className="mt-2 text-xs text-indigo-600 font-medium">Active Profiles</div>
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
              <p className="text-xs font-medium text-slate-500 uppercase mb-1">Leave / Delayed</p>
              <h3 className="text-2xl font-bold text-slate-900">{leaveCount + lateCount}</h3>
              <div className="mt-2 text-xs text-amber-600 font-medium">
                {leaveCount} Leave • {lateCount} Late
              </div>
            </div>
          </div>

          {/* Leave Requests Approval Management Center */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-900 text-base">Leave Approvals & Requests</h2>
                    {pendingLeaveCount > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                        {pendingLeaveCount} Pending Approval
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                        All Caught Up
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review applicant profiles, detailed reasons, and approve or cancel requests.
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

            {leaveRequests.filter((lr) => leaveFilter === 'pending' ? lr.status === 'Pending' : true).length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                {leaveFilter === 'pending'
                  ? 'No pending leave requests requiring admin attention.'
                  : 'No leave requests recorded.'}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {leaveRequests
                  .filter((lr) => (leaveFilter === 'pending' ? lr.status === 'Pending' : true))
                  .map((lr) => (
                    <div key={lr.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        {/* Left: Applicant Full Details */}
                        <div className="flex items-start gap-4 flex-1">
                          <img
                            src={lr.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                            alt={lr.employeeName}
                            className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
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
                                  <Clock className="w-3 h-3 text-amber-600" /> Pending Review
                                </span>
                              )}
                              {lr.status === 'Approved' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-green-600" /> Approved
                                </span>
                              )}
                              {lr.status === 'Rejected' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                                  <XCircle className="w-3 h-3 text-red-600" /> Cancelled / Rejected
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
                              {lr.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {lr.email}
                                </span>
                              )}
                              {lr.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {lr.phone}
                                </span>
                              )}
                            </div>

                            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/80 border border-amber-200/60 text-amber-900 font-bold">
                                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                Leave Requested For: <span className="font-mono text-indigo-700">{lr.startDate}</span>
                              </div>
                              <span className="text-slate-400 text-[11px]">Applied on {lr.appliedAt}</span>
                            </div>

                            {/* Reason Box */}
                            <div className="mt-2 p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-700">
                              <span className="font-bold text-slate-900 block mb-0.5">Reason for Leave Request:</span>
                              <p className="italic">{lr.reason}</p>
                            </div>
                          </div>
                        </div>

                        {/* Right: Admin Actions (Approve / Cancel) */}
                        {onUpdateLeaveStatus && lr.status === 'Pending' && (
                          <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                            <button
                              onClick={() => onUpdateLeaveStatus(lr.id, 'Approved')}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                            >
                              <Check className="w-4 h-4" /> Approve Leave
                            </button>
                            <button
                              onClick={() => onUpdateLeaveStatus(lr.id, 'Rejected')}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
                            >
                              <X className="w-4 h-4" /> Cancel / Reject
                            </button>
                          </div>
                        )}
                        {lr.status !== 'Pending' && (
                          <div className="text-right text-xs text-slate-500 italic shrink-0">
                            Reviewed by {lr.reviewedBy || 'Admin'}<br />
                            {lr.reviewedAt}
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
                <h2 className="font-bold text-slate-800 text-base">Daily Attendance Registry</h2>
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
        </>
      )}
    </div>
  );
};

