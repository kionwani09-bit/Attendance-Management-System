import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, TabType } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { MarkAttendanceView } from './components/MarkAttendanceView';
import { ManageUsersView } from './components/ManageUsersView';
import { AttendanceReportsView } from './components/AttendanceReportsView';
import { EmployeeSelfView } from './components/EmployeeSelfView';
import { LoginModal } from './components/LoginModal';
import { api, initLocalStorage } from './services/api';
import {
  User,
  Employee,
  AttendanceRecord,
  SavedReport,
  Role,
  AttendanceStatus,
  LeaveRequest,
  LeaveStatus,
  EmployeeType,
} from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Default to today's date
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Application Data States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  // Initialize and load data on boot
  useEffect(() => {
    initLocalStorage();
    const user = api.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setIsLoginModalOpen(false);
      if (user.role === 'Student/Employee') {
        setActiveTab('my_attendance');
      } else {
        setActiveTab('dashboard');
      }
    } else {
      setCurrentUser(null);
      setIsLoginModalOpen(true);
    }

    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const emps = await api.getEmployees();
      const att = await api.getAttendance({});
      const reps = await api.getReports();
      const lrs = await api.getLeaveRequests();

      setEmployees(emps);
      setAttendanceRecords(att);
      setSavedReports(reps);
      setLeaveRequests(lrs);
    } catch (e) {
      console.error('Data loading error:', e);
    }
  };

  // Auth Handlers
  const handleLogin = async (email: string, password?: string) => {
    const res = await api.login(email, password);
    setCurrentUser(res.user);
    setIsLoginModalOpen(false);
    if (res.user.role === 'Student/Employee') {
      setActiveTab('my_attendance');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleRegister = async (data: {
    email: string;
    name: string;
    role: Role;
    department: string;
    password?: string;
  }) => {
    const res = await api.register(data);
    setCurrentUser(res.user);
    setIsLoginModalOpen(false);
    if (res.user.role === 'Student/Employee') {
      setActiveTab('my_attendance');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleGoogleLogin = async () => {
    const res = await api.loginWithGoogle();
    setCurrentUser(res.user);
    setIsLoginModalOpen(false);
    if (res.user.role === 'Student/Employee') {
      setActiveTab('my_attendance');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setIsLoginModalOpen(true);
  };

  const handleRoleSwitch = (newRole: Role) => {
    if (!currentUser) return;

    let targetEmail = currentUser.email;
    if (newRole === 'Admin') targetEmail = 'admin@system.com';
    else if (newRole === 'Teacher/HR') targetEmail = 'teacher@system.com';
    else if (newRole === 'Student/Employee') targetEmail = 'john@system.com';

    api.login(targetEmail).then((res) => {
      setCurrentUser(res.user);
    });
  };

  // Attendance Save Handler
  const handleSaveAttendance = async (
    date: string,
    recordsMap: Record<
      string,
      { status: AttendanceStatus; notes?: string; checkInTime?: string }
    >
  ) => {
    await api.markAttendance(date, recordsMap);
    await loadAllData();
  };

  // Member Management Handlers
  const handleAddEmployee = async (empData: Partial<Employee>) => {
    await api.addEmployee(empData);
    await loadAllData();
  };

  const handleUpdateEmployee = async (id: string, empData: Partial<Employee>) => {
    await api.updateEmployee(id, empData);
    await loadAllData();
  };

  const handleDeleteEmployee = async (id: string) => {
    await api.deleteEmployee(id);
    await loadAllData();
  };

  // Report Generator Handler
  const handleGenerateReport = async (params: {
    title: string;
    startDate: string;
    endDate: string;
    departmentFilter: string;
    generatedBy: string;
  }) => {
    await api.generateReport(params);
    await loadAllData();
  };

  // Student/Employee Leave Request
  const handleRequestLeave = async (data: {
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
  }) => {
    await api.createLeaveRequest(data);
    await loadAllData();
  };

  // Admin / HR Leave Request Decision
  const handleUpdateLeaveStatus = async (id: string, status: LeaveStatus) => {
    await api.updateLeaveStatus(id, status, currentUser?.name || 'Admin');
    await loadAllData();
  };

  if (!currentUser || isLoginModalOpen) {
    return (
      <LoginModal
        isOpen={true}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onGoogleLogin={handleGoogleLogin}
      />
    );
  }

  const effectiveTab = activeTab;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onRoleSwitch={handleRoleSwitch}
        selectedDate={selectedDate}
      />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={effectiveTab}
          setActiveTab={(tab) => {
            if (currentUser?.role === 'Student/Employee' && tab !== 'dashboard' && tab !== 'my_attendance') {
              return;
            }
            setActiveTab(tab);
          }}
          userRole={currentUser?.role || 'Admin'}
        />

        {/* Main Workspace Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {effectiveTab === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              attendanceRecords={attendanceRecords}
              employees={employees}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              onNavigateTab={(tab) => setActiveTab(tab)}
              leaveRequests={leaveRequests}
              onUpdateLeaveStatus={handleUpdateLeaveStatus}
            />
          )}

          {effectiveTab === 'mark' && (
            <MarkAttendanceView
              employees={employees}
              attendanceRecords={attendanceRecords}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              onSaveAttendance={handleSaveAttendance}
            />
          )}

          {effectiveTab === 'users' && (
            <ManageUsersView
              employees={employees}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
            />
          )}

          {effectiveTab === 'reports' && (
            <AttendanceReportsView
              attendanceRecords={attendanceRecords}
              savedReports={savedReports}
              onGenerateReport={handleGenerateReport}
              currentUserRole={currentUser?.role || 'Admin'}
            />
          )}

          {effectiveTab === 'my_attendance' && currentUser && (
            <EmployeeSelfView
              currentUser={currentUser}
              attendanceRecords={attendanceRecords}
              employees={employees}
              leaveRequests={leaveRequests}
              onRequestLeave={handleRequestLeave}
            />
          )}
        </main>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen || !currentUser}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onGoogleLogin={handleGoogleLogin}
      />
    </div>
  );
}
