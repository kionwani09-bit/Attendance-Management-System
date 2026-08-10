import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  FileText,
  Search,
  Filter,
  Calendar,
  Save,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarCheck,
  Building2,
  Sparkles,
  Printer,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { AttendanceRecord, SavedReport } from '../types';
import { DEPARTMENTS } from '../data/mockData';
import { exportToExcel, exportToPDF, exportToCSV } from '../utils/exportUtils';

interface AttendanceReportsViewProps {
  attendanceRecords: AttendanceRecord[];
  savedReports: SavedReport[];
  onGenerateReport: (params: {
    title: string;
    startDate: string;
    endDate: string;
    departmentFilter: string;
    generatedBy: string;
  }) => Promise<void>;
  currentUserRole: string;
}

export const AttendanceReportsView: React.FC<AttendanceReportsViewProps> = ({
  attendanceRecords,
  savedReports,
  onGenerateReport,
  currentUserRole,
}) => {
  // Date Range state default to May 2025 or current month
  const [startDate, setStartDate] = useState('2025-05-01');
  const [endDate, setEndDate] = useState('2025-05-31');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [reportTitle, setReportTitle] = useState('Custom Attendance Summary');
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [reportSavedSuccess, setReportSavedSuccess] = useState(false);

  // Filter attendance records based on inputs
  const filteredRecords = attendanceRecords.filter((rec) => {
    const inDateRange = rec.date >= startDate && rec.date <= endDate;
    const matchesDept =
      selectedDept === 'All Departments' || rec.department === selectedDept;
    const matchesStatus = selectedStatus === 'All' || rec.status === selectedStatus;
    const matchesSearch =
      rec.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.employeeId.toLowerCase().includes(searchQuery.toLowerCase());

    return inDateRange && matchesDept && matchesStatus && matchesSearch;
  });

  // Calculate Breakdown Statistics
  const totalCount = filteredRecords.length;
  const presentCount = filteredRecords.filter((r) => r.status === 'Present').length;
  const absentCount = filteredRecords.filter((r) => r.status === 'Absent').length;
  const leaveCount = filteredRecords.filter((r) => r.status === 'Leave').length;
  const lateCount = filteredRecords.filter((r) => r.status === 'Late').length;

  const attendancePercentage =
    totalCount > 0
      ? Number(((presentCount + lateCount * 0.5) / totalCount * 100).toFixed(1))
      : 0;

  // Preset Date Range Handlers
  const setPresetRange = (preset: 'today' | 'may2025' | 'thisMonth' | 'allTime') => {
    const today = new Date().toISOString().split('T')[0];
    if (preset === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'may2025') {
      setStartDate('2025-05-01');
      setEndDate('2025-05-31');
    } else if (preset === 'thisMonth') {
      const d = new Date();
      const firstDay = new Date(d.getFullYear(), d.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      setStartDate(firstDay);
      setEndDate(today);
    } else if (preset === 'allTime') {
      setStartDate('2025-01-01');
      setEndDate('2026-12-31');
    }
  };

  const handleExportExcel = () => {
    exportToExcel(
      filteredRecords,
      `Attendance_Report_${startDate}_to_${endDate}.xlsx`,
      'Attendance Summary'
    );
  };

  const handleExportPDF = () => {
    exportToPDF(
      filteredRecords,
      'Attendance Management Report',
      `Period: ${startDate} to ${endDate} | Dept: ${selectedDept}`
    );
  };

  const handleExportCSV = () => {
    exportToCSV(
      filteredRecords,
      `Attendance_Export_${startDate}_to_${endDate}.csv`
    );
  };

  const handleSaveSnapshot = async () => {
    setIsSavingReport(true);
    try {
      await onGenerateReport({
        title: reportTitle || `Report (${startDate} to ${endDate})`,
        startDate,
        endDate,
        departmentFilter: selectedDept,
        generatedBy: `System User (${currentUserRole})`,
      });
      setReportSavedSuccess(true);
      setTimeout(() => setReportSavedSuccess(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Range Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
              Export & Reporting Studio
            </p>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Attendance Reports & Analytics
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Filter records by custom date ranges and export directly to Excel or PDF documents.
            </p>
          </div>

          {/* Export Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={filteredRecords.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-40"
              title="Download Excel spreadsheet (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Excel
            </button>

            <button
              onClick={handleExportPDF}
              disabled={filteredRecords.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-40"
              title="Generate PDF Document"
            >
              <FileText className="w-4 h-4" /> Export PDF
            </button>

            <button
              onClick={handleExportCSV}
              disabled={filteredRecords.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Date Presets & Filter Controls */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Date Range Presets:</span>
              <button
                onClick={() => setPresetRange('may2025')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                  startDate === '2025-05-01' && endDate === '2025-05-31'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                May 2025 (Sample)
              </button>
              <button
                onClick={() => setPresetRange('today')}
                className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={() => setPresetRange('thisMonth')}
                className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
              >
                Current Month
              </button>
              <button
                onClick={() => setPresetRange('allTime')}
                className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
              >
                All Available
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
            {/* Start Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Department
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Attendance Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present Only</option>
                <option value="Absent">Absent Only</option>
                <option value="Leave">On Leave Only</option>
                <option value="Late">Late Only</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Search ID / Name
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="John, E001..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Records
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-green-600 uppercase tracking-wider">
            Present
          </div>
          <div className="text-2xl font-bold text-green-600 mt-1">{presentCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-red-500 uppercase tracking-wider">
            Absent
          </div>
          <div className="text-2xl font-bold text-red-500 mt-1">{absentCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
            On Leave
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{leaveCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
            Late
          </div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{lateCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Attendance %
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{attendancePercentage}%</div>
        </div>
      </div>

      {/* Save Report Snapshot Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Report Title to Save Snapshot:
          </label>
          <input
            type="text"
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <button
          onClick={handleSaveSnapshot}
          disabled={isSavingReport || filteredRecords.length === 0}
          className="w-full sm:w-auto px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
        >
          <Save className="w-4 h-4 text-white" />
          <span>{isSavingReport ? 'Saving Report...' : 'Save Report Snapshot'}</span>
        </button>
      </div>

      {reportSavedSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>Report snapshot saved into reports database table!</span>
        </div>
      )}

      {/* Filtered Attendance Records Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Filtered Attendance Log ({filteredRecords.length} records)
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {startDate} ~ {endDate}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Member ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Check-In Time</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No matching attendance records found in selected range.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500">{r.date}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{r.employeeId}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{r.employeeName}</td>
                    <td className="py-3 px-4 text-slate-500">{r.department}</td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4 text-slate-500 font-mono">{r.checkInTime || '-'}</td>
                    <td className="py-3 px-4 text-slate-500 italic">{r.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Saved Reports Archive */}
      {savedReports.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            Saved Reports History (Database Archive)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {savedReports.map((rep) => (
              <div
                key={rep.id}
                className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{rep.title}</h4>
                  <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
                    <div>
                      Range: {rep.startDate} to {rep.endDate}
                    </div>
                    <div>
                      Records: {rep.totalRecords} | Attendance Rate:{' '}
                      <strong className="text-green-700">{rep.attendancePercentage}%</strong>
                    </div>
                    <div className="text-slate-400">Generated: {rep.generatedAt}</div>
                  </div>
                </div>

                <button
                  onClick={() => exportToPDF(rep.records, rep.title)}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1 border border-slate-200 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" /> PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
