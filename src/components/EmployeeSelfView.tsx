import React, { useState } from 'react';
import {
  CheckCircle2,
  CalendarCheck,
  Send,
  Clock,
  XCircle,
  FileText,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { AttendanceRecord, User, Employee, LeaveRequest, EmployeeType, AttendanceStatus } from '../types';

interface EmployeeSelfViewProps {
  currentUser: User;
  attendanceRecords: AttendanceRecord[];
  employees: Employee[];
  leaveRequests?: LeaveRequest[];
  onRequestLeave: (data: {
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

export const EmployeeSelfView: React.FC<EmployeeSelfViewProps> = ({
  currentUser,
  attendanceRecords,
  employees,
  leaveRequests = [],
  onRequestLeave,
}) => {
  const [leaveDate, setLeaveDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [leaveReason, setLeaveReason] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Link employee ID
  const empId = currentUser.employeeId || 'E001';
  const myEmployee = employees.find((e) => e.id === empId) || employees[0];

  // Filter records for this user
  const myRecords = attendanceRecords.filter(
    (r) =>
      r.employeeId === empId ||
      (r.employeeName && currentUser.name && r.employeeName.toLowerCase().includes(currentUser.name.toLowerCase()))
  );

  // Filter leave requests for this user
  const myLeaveRequests = leaveRequests.filter(
    (lr) =>
      lr.employeeId === empId ||
      (lr.email && currentUser.email && lr.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      (lr.employeeName && currentUser.name && lr.employeeName.toLowerCase().includes(currentUser.name.toLowerCase()))
  );

  // Find latest reviewed leave requests for notification alerts
  const reviewedRequests = myLeaveRequests.filter(
    (lr) => lr.status === 'Approved' || lr.status === 'Rejected'
  );

  const [dismissedNotifs, setDismissedNotifs] = useState<string[]>([]);

  const activeNotifs = reviewedRequests.filter(
    (lr) => !dismissedNotifs.includes(lr.id)
  );

  const total = myRecords.length;
  const presentCount = myRecords.filter((r) => r.status === 'Present').length;
  const absentCount = myRecords.filter((r) => r.status === 'Absent').length;
  const leaveCount = myRecords.filter((r) => r.status === 'Leave').length;
  const lateCount = myRecords.filter((r) => r.status === 'Late').length;

  const attendanceRate =
    total > 0
      ? Math.round(((presentCount + lateCount * 0.5) / total) * 100)
      : 100;

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason) return;
    onRequestLeave({
      startDate: leaveDate,
      reason: leaveReason,
      employeeId: empId,
      employeeName: currentUser.name,
      department: myEmployee?.department || currentUser.department || 'General',
      type: myEmployee?.type || 'Employee',
      designation: myEmployee?.designation || 'Member',
      email: currentUser.email || myEmployee?.email || '',
      phone: myEmployee?.phone || '+1 (555) 019-2834',
      avatar: currentUser.avatar || myEmployee?.avatar,
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setIsModalOpen(false);
      setLeaveReason('');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Leave Request Review Notifications Alert Banner */}
      {activeNotifs.length > 0 && (
        <div className="space-y-3">
          {activeNotifs.map((lr) => (
            <div
              key={lr.id}
              className={`p-4 rounded-xl border flex items-start justify-between gap-4 shadow-sm transition-all ${
                lr.status === 'Approved'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-start gap-3">
                {lr.status === 'Approved' ? (
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 bg-rose-100 rounded-lg text-rose-600 shrink-0">
                    <XCircle className="w-5 h-5" />
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-[10px] bg-white border border-current">
                      Notification
                    </span>
                    <h4 className="text-sm font-bold">
                      {lr.status === 'Approved'
                        ? 'Leave Request ACCEPTED'
                        : 'Leave Request CANCELLED / DECLINED'}
                    </h4>
                  </div>
                  <p className="text-xs font-medium">
                    Your leave application for <span className="font-bold font-mono">{lr.startDate}</span> (Reason: "{lr.reason}") has been{' '}
                    <span className="font-bold underline">
                      {lr.status === 'Approved' ? 'ACCEPTED' : 'CANCELLED'}
                    </span>{' '}
                    by Admin <span className="font-semibold">{lr.reviewedBy || 'Admin'}</span>
                    {lr.reviewedAt ? ` on ${lr.reviewedAt}` : ''}.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDismissedNotifs((prev) => [...prev, lr.id])}
                className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs cursor-pointer shrink-0"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar || myEmployee?.avatar}
            alt={currentUser.name}
            className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{currentUser.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                ID: {empId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {myEmployee?.department || 'Engineering'} • {myEmployee?.designation || 'Member'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <CalendarCheck className="w-4 h-4" /> Request Leave
        </button>
      </div>

      {/* Personal Attendance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Overall Attendance</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{attendanceRate}%</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full"
              style={{ width: `${attendanceRate}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-green-600 uppercase">Present Days</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{presentCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-red-500 uppercase">Absent Days</div>
          <div className="text-2xl font-bold text-red-500 mt-1">{absentCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-amber-600 uppercase">Leave Days</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{leaveCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-indigo-600 uppercase">Late Days</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{lateCount}</div>
        </div>
      </div>

      {/* Submitted Leave Applications Status */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">Your Leave Applications</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {myLeaveRequests.length} Applications
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Applied Date</th>
                <th className="py-3 px-4">Requested Date</th>
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
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{lr.startDate}</td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-800 font-medium">{lr.reason}</td>
                    <td className="py-3 px-4">
                      {lr.status === 'Pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" /> Pending Admin Review
                        </span>
                      )}
                      {lr.status === 'Approved' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                          <CheckCircle2 className="w-3 h-3 text-green-600" /> Approved
                        </span>
                      )}
                      {lr.status === 'Rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                          <XCircle className="w-3 h-3 text-red-600" /> Cancelled / Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {lr.reviewedBy ? `Reviewed by ${lr.reviewedBy} on ${lr.reviewedAt}` : 'Awaiting decision'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Personal History Log */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Personal Attendance Logs</h3>
          <span className="text-xs text-slate-500">{myRecords.length} entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Check-In Time</th>
                <th className="py-3.5 px-4">Notes / Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {myRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-slate-400">
                    No attendance records found for your account.
                  </td>
                </tr>
              ) : (
                myRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{r.date}</td>
                    <td className="py-3.5 px-4">
                      {r.status === 'Present' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                          Present
                        </span>
                      )}
                      {r.status === 'Absent' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                          Absent
                        </span>
                      )}
                      {r.status === 'Leave' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                          Leave
                        </span>
                      )}
                      {r.status === 'Late' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                          Late
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{r.checkInTime || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-500 italic">{r.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Application Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-indigo-600" /> Request Leave
            </h3>

            {submitted ? (
              <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span>Leave request submitted for approval!</span>
              </div>
            ) : (
              <form onSubmit={handleApplyLeave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Leave Date
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveDate}
                    onChange={(e) => setLeaveDate(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason for Leave
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Personal emergency, doctor appointment..."
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs cursor-pointer flex items-center gap-1.5"
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
  );
};
