import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  CalendarCheck,
  Save,
  Search,
  Filter,
  CheckCheck,
  X,
  AlertCircle,
  Building2,
  Calendar,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { Employee, AttendanceRecord, AttendanceStatus } from '../types';
import { DEPARTMENTS } from '../data/mockData';

interface MarkAttendanceViewProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  onSaveAttendance: (
    date: string,
    recordsMap: Record<
      string,
      { status: AttendanceStatus; notes?: string; checkInTime?: string }
    >
  ) => Promise<void>;
}

export const MarkAttendanceView: React.FC<MarkAttendanceViewProps> = ({
  employees,
  attendanceRecords,
  selectedDate,
  setSelectedDate,
  onSaveAttendance,
}) => {
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedType, setSelectedType] = useState<'All' | 'Employee' | 'Student'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local state for current pending marks: { employeeId -> { status, notes, checkInTime } }
  const [pendingMarks, setPendingMarks] = useState<
    Record<
      string,
      { status: AttendanceStatus; notes: string; checkInTime: string }
    >
  >({});

  // Sync state whenever selectedDate or attendanceRecords changes
  useEffect(() => {
    const activeEmps = employees.filter((e) => e.status === 'Active');
    const existingForDate = attendanceRecords.filter((r) => r.date === selectedDate);

    const initialMarks: Record<
      string,
      { status: AttendanceStatus; notes: string; checkInTime: string }
    > = {};

    activeEmps.forEach((emp) => {
      const match = existingForDate.find((r) => r.employeeId === emp.id);
      initialMarks[emp.id] = {
        status: match ? match.status : 'Present',
        notes: match?.notes || '',
        checkInTime: match?.checkInTime || '09:00 AM',
      };
    });

    setPendingMarks(initialMarks);
    setSaveSuccess(false);
  }, [selectedDate, employees, attendanceRecords]);

  const activeEmployees = employees.filter((e) => e.status === 'Active');

  const filteredEmployees = activeEmployees.filter((emp) => {
    const matchesDept =
      selectedDept === 'All Departments' || emp.department === selectedDept;
    const matchesType = selectedType === 'All' || emp.type === selectedType;
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesType && matchesSearch;
  });

  const handleStatusChange = (
    empId: string,
    status: AttendanceStatus
  ) => {
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    setPendingMarks((prev) => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        status,
        checkInTime:
          status === 'Present' && (!prev[empId]?.checkInTime || prev[empId]?.checkInTime === '-')
            ? nowTime
            : status === 'Late' && (!prev[empId]?.checkInTime || prev[empId]?.checkInTime === '-')
            ? nowTime
            : prev[empId]?.checkInTime || '',
      },
    }));
    setSaveSuccess(false);
  };

  const handleNoteChange = (empId: string, notes: string) => {
    setPendingMarks((prev) => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        notes,
      },
    }));
  };

  const handleTimeChange = (empId: string, time: string) => {
    setPendingMarks((prev) => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        checkInTime: time,
      },
    }));
  };

  const markAll = (status: AttendanceStatus) => {
    const updated = { ...pendingMarks };
    filteredEmployees.forEach((emp) => {
      updated[emp.id] = {
        ...updated[emp.id],
        status,
        checkInTime: status === 'Present' ? '09:00 AM' : status === 'Late' ? '09:45 AM' : '',
      };
    });
    setPendingMarks(updated);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onSaveAttendance(selectedDate, pendingMarks);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Counts calculation from pendingMarks
  type PendingMark = { status: AttendanceStatus; notes: string; checkInTime: string };
  const pendingList = Object.values(pendingMarks) as PendingMark[];
  const presentCount = pendingList.filter((m) => m.status === 'Present').length;
  const absentCount = pendingList.filter((m) => m.status === 'Absent').length;
  const leaveCount = pendingList.filter((m) => m.status === 'Leave').length;
  const lateCount = pendingList.filter((m) => m.status === 'Late').length;

  return (
    <div className="space-y-6">
      {/* Header Controls Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
              Interactive Register
            </p>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Mark Daily Attendance
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select attendance status for each active member. Changes persist directly to storage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date selector with quick shortcuts */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <label className="text-xs font-bold text-slate-600">Calendar Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-slate-900 text-xs font-bold focus:outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedDate === new Date().toISOString().split('T')[0]
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 1);
                    setSelectedDate(d.toISOString().split('T')[0]);
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Yesterday
                </button>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Saving Records...'
                  : saveSuccess
                  ? 'Saved to Database!'
                  : 'Save Attendance'}
              </span>
            </button>
          </div>
        </div>

        {/* Quick Bulk Action Buttons & Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-1">Bulk Shortcuts:</span>
            <button
              onClick={() => markAll('Present')}
              className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark All Present
            </button>
            <button
              onClick={() => markAll('Absent')}
              className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Mark All Absent
            </button>
          </div>

          {/* Quick Counter Badges */}
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 font-bold">
              Present: {presentCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 font-bold">
              Absent: {absentCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-bold">
              Leave: {leaveCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
              Late: {lateCount}
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Employee ID or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Member Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">All Types (Employees & Students)</option>
              <option value="Employee">Employees Only</option>
              <option value="Student">Students Only</option>
            </select>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>
              Attendance for <strong>{selectedDate}</strong> successfully saved to database!
            </span>
          </div>
          <span className="text-[10px] text-emerald-500">Auto-saved</span>
        </div>
      )}

      {/* Attendance Marking Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Member ID</th>
                <th className="py-3.5 px-4">Member Name</th>
                <th className="py-3.5 px-4">Department & Role</th>
                <th className="py-3.5 px-4 text-center">Attendance Status</th>
                <th className="py-3.5 px-4">Check-In Time</th>
                <th className="py-3.5 px-4">Notes / Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No active members found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const currentMark = pendingMarks[emp.id] || {
                    status: 'Present',
                    notes: '',
                    checkInTime: '09:00 AM',
                  };

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                        {emp.id}
                      </td>

                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={emp.avatar}
                            alt={emp.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{emp.name}</div>
                            <div className="text-[10px] text-slate-500">{emp.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">{emp.department}</div>
                        <div className="text-[10px] text-slate-500">{emp.designation}</div>
                      </td>

                      {/* Attendance Status Controls */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Present */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(emp.id, 'Present')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              currentMark.status === 'Present'
                                ? 'bg-green-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:text-green-700 hover:bg-slate-200'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Present
                          </button>

                          {/* Absent */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(emp.id, 'Absent')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              currentMark.status === 'Absent'
                                ? 'bg-red-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:text-red-700 hover:bg-slate-200'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" /> Absent
                          </button>

                          {/* Leave */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(emp.id, 'Leave')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              currentMark.status === 'Leave'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:text-amber-700 hover:bg-slate-200'
                            }`}
                          >
                            <CalendarCheck className="w-3.5 h-3.5" /> Leave
                          </button>

                          {/* Late */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(emp.id, 'Late')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              currentMark.status === 'Late'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:text-indigo-700 hover:bg-slate-200'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" /> Late
                          </button>
                        </div>
                      </td>

                      {/* Check-In Time */}
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          value={currentMark.checkInTime}
                          onChange={(e) => handleTimeChange(emp.id, e.target.value)}
                          placeholder="09:00 AM"
                          disabled={currentMark.status === 'Absent' || currentMark.status === 'Leave'}
                          className="w-24 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </td>

                      {/* Notes / Remarks */}
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          value={currentMark.notes}
                          onChange={(e) => handleNoteChange(emp.id, e.target.value)}
                          placeholder="Optional remark..."
                          className="w-full bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-50 px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Showing {filteredEmployees.length} active members on {selectedDate}.
          </p>

          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Attendance Records
          </button>
        </div>
      </div>
    </div>
  );
};
