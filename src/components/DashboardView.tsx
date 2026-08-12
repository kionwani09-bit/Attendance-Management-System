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
  Shield,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Send,
  FileText,
} from 'lucide-react';
import {
  AttendanceRecord,
  Employee,
  AttendanceStatus,
  User,
  LeaveRequest,
  LeaveStatus,
  EmployeeType,
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
  onRequestLeave?: (data: {
    startDate: string;
    reason: string;
    employeeId: string;
    employeeName: string;
    department: string;
    type?: EmployeeType;
    designation?: string;
    email?: string;
    phone?: string;
    avatar?: string;
  }) => void;
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
  onRequestLeave,
}) => {
  const userRole = currentUser?.role || 'Admin';
  const userDept = currentUser?.department || 'Computer Science';

  // State for Dept filter - default to user department for Teacher/HR
  const [selectedDept, setSelectedDept] = useState(
    userRole === 'Teacher/HR' && userDept !== 'All' ? userDept : 'All Departments'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [leaveFilter, setLeaveFilter] = useState<'pending' | 'all'>('pending');

  // Leave Form State for Student/Employee
  const [leaveDate, setLeaveDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState('');
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);

  // Stats calculation
  const todaysRecords = attendanceRecords.filter((r) => r.date === selectedDate);
  const activeEmployees = employees.filter((e) => e.status === 'Active');

  const totalMembers = activeEmployees.length;
  const presentCount = todaysRecords.filter((r) => r.status === 'Present').length;
  const absentCount = todaysRecords.filter((r) => r.status === 'Absent').length;
  const leaveCount = todaysRecords.filter((r) => r.status === 'Leave').length;
  const lateCount = todaysRecords.filter((r) => r.status === 'Late').length;

  // Department-specific stats for Teacher/HR
  const deptEmployees = activeEmployees.filter(
    (e) => e.department === userDept || selectedDept === 'All Departments'
  );
  const deptTodaysRecords = todaysRecords.filter(
    (r) => r.department === userDept || selectedDept === 'All Departments'
  );
  const deptPresent = deptTodaysRecords.filter((r) => r.status === 'Present').length;
  const deptAbsent = deptTodaysRecords.filter((r) => r.status === 'Absent').length;
  const deptLeave = deptTodaysRecords.filter((r) => r.status === 'Leave').length;
  const deptLate = deptTodaysRecords.filter((r) => r.status === 'Late').length;
  const deptRate =
    deptEmployees.length > 0
      ? Math.round(((deptPresent + deptLate * 0.5) / deptEmployees.length) * 100)
      : 100;

  // Student/Employee personal stats
  const myEmpId = currentUser?.employeeId || 'E001';
  const myEmployee = employees.find((e) => e.id === myEmpId) || employees[0];
  const myRecords = attendanceRecords.filter(
    (r) =>
      r.employeeId === myEmpId ||
      r.employeeName.toLowerCase().includes((currentUser?.name || '').toLowerCase())
  );
  const myLeaveRequests = leaveRequests.filter(
    (lr) =>
      lr.employeeId === myEmpId ||
      lr.employeeName.toLowerCase().includes((currentUser?.name || '').toLowerCase())
  );

  const myPresent = myRecords.filter((r) => r.status === 'Present').length;
  const myAbsent = myRecords.filter((r) => r.status === 'Absent').length;
  const myLeave = myRecords.filter((r) => r.status === 'Leave').length;
  const myLate = myRecords.filter((r) => r.status === 'Late').length;
  const myTotal = myRecords.length || 1;
  const myRate = Math.round(((myPresent + myLate * 0.5) / myTotal) * 100);

  // Today's attendance record for current student/employee
  const myTodayRecord = todaysRecords.find(
    (r) =>
      r.employeeId === myEmpId ||
      r.employeeName.toLowerCase().includes((currentUser?.name || '').toLowerCase())
  );

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

  const handleApplyLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason || !onRequestLeave) return;

    onRequestLeave({
      startDate: leaveDate,
      reason: leaveReason,
      employeeId: myEmpId,
      employeeName: currentUser?.name || 'Student/Employee',
      department: myEmployee?.department || currentUser?.department || 'Computer Science',
      type: myEmployee?.type || 'Student',
      designation: myEmployee?.designation || 'Student',
      email: currentUser?.email || myEmployee?.email || '',
      phone: myEmployee?.phone || '+1 (555) 019-2834',
      avatar: currentUser?.avatar || myEmployee?.avatar,
    });

    setLeaveSubmitted(true);
    setTimeout(() => {
      setLeaveSubmitted(false);
      setIsLeaveModalOpen(false);
      setLeaveReason('');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Date Selector & Role Operational Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {userRole === 'Admin' && (
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
          )}
          {userRole === 'Teacher/HR' && (
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
          )}
          {userRole === 'Student/Employee' && (
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <UserIcon className="w-5 h-5" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                {userRole === 'Admin' && 'System Admin Control Center'}
                {userRole === 'Teacher/HR' && `Teacher / HR Portal (${userDept})`}
                {userRole === 'Student/Employee' && 'Student / Employee Attendance Portal'}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  userRole === 'Admin'
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    : userRole === 'Teacher/HR'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {userRole === 'Admin' && 'Full Control'}
                {userRole === 'Teacher/HR' && 'Class / Dept Oversight'}
                {userRole === 'Student/Employee' && 'Self-Service'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {userRole === 'Admin' &&
                'Manage system members, review leave applications, and supervise daily attendance records.'}
              {userRole === 'Teacher/HR' &&
                `Overviewing student & staff attendance for ${userDept} department.`}
              {userRole === 'Student/Employee' &&
                'Track your personal attendance logs, check-in status, and apply for leave requests.'}
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-lg self-end md:self-center">
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

      {/* ======================================================================== */}
      {/* ROLE 1: ADMIN DASHBOARD VIEW                                             */}
      {/* ======================================================================== */}
      {userRole === 'Admin' && (
        <div className="space-y-6">
          {/* Quick Action Hub Bar */}
          <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold">Admin Management Shortcuts:</span>
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
                <UserPlus className="w-3.5 h-3.5 text-indigo-400" /> Manage Directory
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
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-900 text-base">Global Leave Approvals</h2>
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
                    Review leave requests across all departments and approve or cancel.
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
                            </div>

                            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/80 border border-amber-200/60 text-amber-900 font-bold">
                                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                Requested Date: <span className="font-mono text-indigo-700">{lr.startDate}</span>
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
                <h2 className="font-bold text-slate-800 text-base">Global Daily Attendance Registry</h2>
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
      )}

      {/* ======================================================================== */}
      {/* ROLE 2: TEACHER / HR DASHBOARD VIEW                                      */}
      {/* ======================================================================== */}
      {userRole === 'Teacher/HR' && (
        <div className="space-y-6">
          {/* Quick Action Bar for Teacher/HR */}
          <div className="bg-purple-950 text-white p-4 rounded-xl border border-purple-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-purple-300" />
              <span className="text-xs font-bold">Class / Department Quick Actions ({userDept}):</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onNavigateTab('mark')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                <ClipboardCheck className="w-3.5 h-3.5" /> Mark Class Attendance
              </button>
              <button
                onClick={() => onNavigateTab('users')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-900/80 hover:bg-purple-900 text-purple-100 text-xs font-bold rounded-lg cursor-pointer transition-colors border border-purple-700"
              >
                <Users className="w-3.5 h-3.5 text-purple-300" /> View Class Members
              </button>
              <button
                onClick={() => onNavigateTab('reports')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-900/80 hover:bg-purple-900 text-purple-100 text-xs font-bold rounded-lg cursor-pointer transition-colors border border-purple-700"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-purple-300" /> Class Attendance Report
              </button>
            </div>
          </div>

          {/* Department Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-medium text-slate-500 uppercase mb-1">Class / Dept Roster</p>
              <h3 className="text-2xl font-bold text-slate-900">{deptEmployees.length}</h3>
              <div className="mt-2 text-xs text-purple-700 font-medium">Members in {userDept}</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-medium text-slate-500 uppercase mb-1">Dept Attendance Rate</p>
              <h3 className="text-2xl font-bold text-slate-900">{deptRate}%</h3>
              <div className="mt-2 text-xs text-green-600 font-medium">
                {deptPresent} Verified Present Today
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-medium text-slate-500 uppercase mb-1">Dept Absences</p>
              <h3 className="text-2xl font-bold text-slate-900">{deptAbsent}</h3>
              <div className="mt-2 text-xs text-red-500 font-medium">Flagged Absences</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-medium text-slate-500 uppercase mb-1">Dept Leave Requests</p>
              <h3 className="text-2xl font-bold text-slate-900">{deptLeave + deptLate}</h3>
              <div className="mt-2 text-xs text-amber-600 font-medium">
                {deptLeave} On Leave • {deptLate} Late
              </div>
            </div>
          </div>

          {/* Teacher/HR Leave Approvals for Department */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-purple-50/50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-purple-700" />
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Class Leave Applications</h2>
                  <p className="text-xs text-slate-500">
                    Review and recommend/approve leave requests submitted by students/staff in {userDept}.
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full border border-purple-200">
                {userDept} Scope
              </span>
            </div>

            {leaveRequests.filter(
              (lr) =>
                lr.department === userDept || lr.department.toLowerCase().includes(userDept.toLowerCase())
            ).length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No leave applications recorded for members in {userDept}.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {leaveRequests
                  .filter(
                    (lr) =>
                      lr.department === userDept ||
                      lr.department.toLowerCase().includes(userDept.toLowerCase())
                  )
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
                              {lr.status === 'Pending' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  Pending Review
                                </span>
                              )}
                              {lr.status === 'Approved' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                                  Approved
                                </span>
                              )}
                              {lr.status === 'Rejected' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                  Rejected
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-slate-500 font-medium">
                              {lr.designation || 'Student'} • {lr.email}
                            </div>

                            <div className="pt-2 flex items-center gap-2 text-xs">
                              <span className="font-bold text-slate-700">Requested Date:</span>
                              <span className="font-mono text-indigo-700 font-bold">{lr.startDate}</span>
                              <span className="text-slate-400 text-[11px] ml-2">Applied on {lr.appliedAt}</span>
                            </div>

                            <div className="mt-2 p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-700 italic">
                              "{lr.reason}"
                            </div>
                          </div>
                        </div>

                        {onUpdateLeaveStatus && lr.status === 'Pending' && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => onUpdateLeaveStatus(lr.id, 'Approved')}
                              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve Leave
                            </button>
                            <button
                              onClick={() => onUpdateLeaveStatus(lr.id, 'Rejected')}
                              className="px-4 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Department Class Attendance Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-800 text-base">{userDept} Class Registry</h2>
                <p className="text-xs text-slate-500 mt-0.5">Records for {selectedDate}</p>
              </div>

              <button
                onClick={() => onNavigateTab('mark')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer shadow-xs"
              >
                Mark Class Attendance
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase">
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-3.5">ID</th>
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Check-In Time</th>
                    <th className="px-6 py-3.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-700 divide-y divide-slate-100">
                  {deptTodaysRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        No attendance records logged for {userDept} on {selectedDate}.
                      </td>
                    </tr>
                  ) : (
                    deptTodaysRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 font-mono text-purple-700 font-bold">{r.employeeId}</td>
                        <td className="px-6 py-3 font-bold text-slate-900">{r.employeeName}</td>
                        <td className="px-6 py-3 text-slate-500">{r.department}</td>
                        <td className="px-6 py-3">{getStatusBadge(r.status)}</td>
                        <td className="px-6 py-3 font-mono text-slate-500">{r.checkInTime || '-'}</td>
                        <td className="px-6 py-3 italic text-slate-500">{r.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* ROLE 3: STUDENT / EMPLOYEE DASHBOARD VIEW                                */}
      {/* ======================================================================== */}
      {userRole === 'Student/Employee' && (
        <div className="space-y-6">
          {/* Personal Profile Hero Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={
                  currentUser?.avatar ||
                  myEmployee?.avatar ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                }
                alt={currentUser?.name}
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-xs"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{currentUser?.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ID: {myEmpId}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {myEmployee?.type || 'Student'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                  <span>{myEmployee?.department || currentUser?.department || 'Computer Science'}</span>
                  <span>•</span>
                  <span>{myEmployee?.designation || 'Student'}</span>
                  <span>•</span>
                  <span>{currentUser?.email}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer self-stretch md:self-auto justify-center"
            >
              <CalendarCheck className="w-4 h-4" /> Request Leave
            </button>
          </div>

          {/* Today's Attendance Real-Time Status Highlight Card */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Today's Attendance Status ({selectedDate})
              </div>
              <div className="flex items-center gap-3">
                {myTodayRecord?.status === 'Present' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verified Present at {myTodayRecord.checkInTime || '09:00 AM'}
                  </span>
                )}
                {myTodayRecord?.status === 'Late' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full text-xs font-bold">
                    <Clock className="w-4 h-4 text-indigo-400" /> Logged Late at {myTodayRecord.checkInTime || '09:45 AM'}
                  </span>
                )}
                {myTodayRecord?.status === 'Leave' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold">
                    <CalendarCheck className="w-4 h-4 text-amber-400" /> On Approved Leave
                  </span>
                )}
                {myTodayRecord?.status === 'Absent' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-xs font-bold">
                    <XCircle className="w-4 h-4 text-rose-400" /> Flagged Absent
                  </span>
                )}
                {!myTodayRecord && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-xs font-bold">
                    <Clock className="w-4 h-4 text-slate-400" /> Attendance Register Pending for Today
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('my_attendance')}
              className="text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View Full History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Personal KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Attendance Rate</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{myRate}%</div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${myRate}%` }}></div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold text-emerald-600 uppercase">Present Days</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{myPresent}</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold text-rose-500 uppercase">Absent Days</div>
              <div className="text-2xl font-bold text-rose-500 mt-1">{myAbsent}</div>
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

          {/* My Leave Applications Tracker */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-800">My Leave Applications & Status</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {myLeaveRequests.length} Submitted
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Applied Date</th>
                    <th className="py-3 px-4">Leave Requested Date</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Approval Status</th>
                    <th className="py-3 px-4">Reviewer Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {myLeaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-400">
                        No leave applications submitted yet.
                      </td>
                    </tr>
                  ) : (
                    myLeaveRequests.map((lr) => (
                      <tr key={lr.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono text-slate-500">{lr.appliedAt}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">{lr.startDate}</td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-800 font-medium">{lr.reason}</td>
                        <td className="py-3 px-4">
                          {lr.status === 'Pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" /> Pending Admin Review
                            </span>
                          )}
                          {lr.status === 'Approved' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved
                            </span>
                          )}
                          {lr.status === 'Rejected' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" /> Rejected / Cancelled
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {lr.reviewedBy ? `Reviewed by ${lr.reviewedBy} on ${lr.reviewedAt}` : 'Awaiting review'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Personal Recent Attendance Logs */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Your Attendance Logs History</h3>
              <span className="text-xs text-slate-500">{myRecords.length} entries</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Time Logged</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
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

          {/* Student/Employee Request Leave Modal */}
          {isLeaveModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-emerald-600" /> Apply for Leave
                  </h3>
                  <button
                    onClick={() => setIsLeaveModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {leaveSubmitted ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-lg text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Leave application submitted successfully for review!</span>
                  </div>
                ) : (
                  <form onSubmit={handleApplyLeaveSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Requested Leave Date
                      </label>
                      <input
                        type="date"
                        required
                        value={leaveDate}
                        onChange={(e) => setLeaveDate(e.target.value)}
                        className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Reason for Leave Request
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="e.g. Medical appointment, family event..."
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      ></textarea>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsLeaveModalOpen(false)}
                        className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" /> Submit Request
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
