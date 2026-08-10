import {
  User,
  Employee,
  AttendanceRecord,
  SavedReport,
  FilterOptions,
  LeaveRequest,
  LeaveStatus,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_REPORTS,
  INITIAL_LEAVE_REQUESTS,
} from '../data/mockData';

// API Client with fallback to LocalStorage for resilient offline/standalone operation
const STORAGE_KEYS = {
  USERS: 'ams_users',
  EMPLOYEES: 'ams_employees',
  ATTENDANCE: 'ams_attendance',
  REPORTS: 'ams_reports',
  LEAVE_REQUESTS: 'ams_leave_requests',
  CURRENT_USER: 'ams_current_user',
};

function getLocalData<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setLocalData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

// Initialize default storage if empty
export function initLocalStorage(): void {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    setLocalData(STORAGE_KEYS.USERS, INITIAL_USERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
    setLocalData(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
    setLocalData(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  }
  if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
    setLocalData(STORAGE_KEYS.REPORTS, INITIAL_REPORTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS)) {
    setLocalData(STORAGE_KEYS.LEAVE_REQUESTS, INITIAL_LEAVE_REQUESTS);
  }
}

export const api = {
  // Auth
  login: async (email: string, password?: string): Promise<{ token: string; user: User }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setLocalData(STORAGE_KEYS.CURRENT_USER, data.user);
        return data;
      }
    } catch (e) {
      console.warn('Backend API unavailable, falling back to local storage auth', e);
    }

    // Local fallback
    initLocalStorage();
    const users = getLocalData<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      throw new Error('Invalid email credentials');
    }

    const result = { token: `jwt_${user.id}_${Date.now()}`, user };
    setLocalData(STORAGE_KEYS.CURRENT_USER, user);
    return result;
  },

  register: async (userData: Partial<User>): Promise<{ token: string; user: User }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (res.ok) {
        const data = await res.json();
        setLocalData(STORAGE_KEYS.CURRENT_USER, data.user);
        return data;
      }
    } catch (e) {
      console.warn('Backend API unavailable, using local register', e);
    }

    initLocalStorage();
    const users = getLocalData<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const newUser: User = {
      id: `u_${Date.now()}`,
      email: userData.email || '',
      name: userData.name || 'New User',
      role: userData.role || 'Student/Employee',
      department: userData.department || 'General',
      employeeId: userData.employeeId,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString().split('T')[0],
    };

    users.push(newUser);
    setLocalData(STORAGE_KEYS.USERS, users);
    setLocalData(STORAGE_KEYS.CURRENT_USER, newUser);
    return { token: `jwt_${newUser.id}`, user: newUser };
  },

  getCurrentUser: (): User | null => {
    return getLocalData<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) return await res.json();
    } catch (e) {
      /* ignore fallback */
    }
    initLocalStorage();
    return getLocalData<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  deleteUser: async (id: string): Promise<boolean> => {
    try {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
    } catch (e) {
      /* ignore */
    }
    const users = getLocalData<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS).filter((u) => u.id !== id);
    setLocalData(STORAGE_KEYS.USERS, users);
    return true;
  },

  // Employees / Students
  getEmployees: async (filters?: Partial<FilterOptions>): Promise<Employee[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.searchQuery) params.append('search', filters.searchQuery);
      if (filters?.department) params.append('department', filters.department);
      if (filters?.type) params.append('type', filters.type);

      const res = await fetch(`/api/employees?${params.toString()}`);
      if (res.ok) return await res.json();
    } catch (e) {
      /* ignore */
    }

    initLocalStorage();
    let emps = getLocalData<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);

    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      emps = emps.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q)
      );
    }
    if (filters?.department && filters.department !== 'All Departments') {
      emps = emps.filter((e) => e.department === filters.department);
    }
    if (filters?.type && filters.type !== 'All') {
      emps = emps.filter((e) => e.type === filters.type);
    }

    return emps;
  },

  addEmployee: async (empData: Partial<Employee>): Promise<Employee> => {
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empData),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      /* fallback */
    }

    initLocalStorage();
    const emps = getLocalData<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const prefix = empData.type === 'Student' ? 'S' : 'E';
    const count = emps.filter((e) => e.type === (empData.type || 'Employee')).length + 1;
    const newId = empData.id || `${prefix}${String(count + 5).padStart(3, '0')}`;

    const newEmp: Employee = {
      id: newId,
      name: empData.name || 'New Member',
      email: empData.email || 'user@system.com',
      type: empData.type || 'Employee',
      department: empData.department || 'Engineering',
      designation: empData.designation || 'Member',
      joinDate: empData.joinDate || new Date().toISOString().split('T')[0],
      phone: empData.phone || '+1 (555) 000-0000',
      status: empData.status || 'Active',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };

    emps.push(newEmp);
    setLocalData(STORAGE_KEYS.EMPLOYEES, emps);
    return newEmp;
  },

  updateEmployee: async (id: string, empData: Partial<Employee>): Promise<Employee> => {
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empData),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      /* fallback */
    }

    const emps = getLocalData<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const idx = emps.findIndex((e) => e.id === id);
    if (idx !== -1) {
      emps[idx] = { ...emps[idx], ...empData };
      setLocalData(STORAGE_KEYS.EMPLOYEES, emps);
      return emps[idx];
    }
    throw new Error('Member not found');
  },

  deleteEmployee: async (id: string): Promise<boolean> => {
    try {
      await fetch(`/api/employees/${id}`, { method: 'DELETE' });
    } catch (e) {
      /* fallback */
    }

    const emps = getLocalData<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES).filter(
      (e) => e.id !== id
    );
    setLocalData(STORAGE_KEYS.EMPLOYEES, emps);

    const att = getLocalData<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE).filter(
      (a) => a.employeeId !== id
    );
    setLocalData(STORAGE_KEYS.ATTENDANCE, att);

    return true;
  },

  // Attendance
  getAttendance: async (filters: FilterOptions): Promise<AttendanceRecord[]> => {
    try {
      const params = new URLSearchParams();
      if (filters.date) params.append('date', filters.date);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.department) params.append('department', filters.department);
      if (filters.status) params.append('status', filters.status);
      if (filters.searchQuery) params.append('searchQuery', filters.searchQuery);

      const res = await fetch(`/api/attendance?${params.toString()}`);
      if (res.ok) return await res.json();
    } catch (e) {
      /* fallback */
    }

    initLocalStorage();
    let records = getLocalData<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);

    if (filters.date) {
      records = records.filter((r) => r.date === filters.date);
    } else if (filters.startDate && filters.endDate) {
      records = records.filter((r) => r.date >= filters.startDate! && r.date <= filters.endDate!);
    }

    if (filters.department && filters.department !== 'All Departments') {
      records = records.filter((r) => r.department === filters.department);
    }

    if (filters.status && filters.status !== 'All') {
      records = records.filter((r) => r.status === filters.status);
    }

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      records = records.filter(
        (r) =>
          r.employeeName.toLowerCase().includes(q) ||
          r.employeeId.toLowerCase().includes(q)
      );
    }

    return records;
  },

  markAttendance: async (
    date: string,
    recordsMap: Record<string, { status: AttendanceRecord['status']; notes?: string; checkInTime?: string }>
  ): Promise<boolean> => {
    const payload = Object.entries(recordsMap).map(([employeeId, val]) => ({
      employeeId,
      status: val.status,
      notes: val.notes,
      checkInTime: val.checkInTime,
    }));

    try {
      const res = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, records: payload }),
      });
      if (res.ok) return true;
    } catch (e) {
      /* fallback */
    }

    initLocalStorage();
    let attendance = getLocalData<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    const employees = getLocalData<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);

    payload.forEach((rec) => {
      const emp = employees.find((e) => e.id === rec.employeeId);
      const existingIdx = attendance.findIndex(
        (a) => a.date === date && a.employeeId === rec.employeeId
      );

      const record: AttendanceRecord = {
        id: existingIdx !== -1 ? attendance[existingIdx].id : `att-${date}-${rec.employeeId}`,
        date,
        employeeId: rec.employeeId,
        employeeName: emp ? emp.name : 'Member',
        department: emp ? emp.department : 'General',
        status: rec.status,
        checkInTime: rec.checkInTime || (rec.status === 'Present' ? '09:00 AM' : rec.status === 'Late' ? '09:45 AM' : undefined),
        notes: rec.notes,
      };

      if (existingIdx !== -1) {
        attendance[existingIdx] = record;
      } else {
        attendance.push(record);
      }
    });

    setLocalData(STORAGE_KEYS.ATTENDANCE, attendance);
    return true;
  },

  // Reports
  getReports: async (): Promise<SavedReport[]> => {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) return await res.json();
    } catch (e) {
      /* fallback */
    }

    initLocalStorage();
    return getLocalData<SavedReport[]>(STORAGE_KEYS.REPORTS, INITIAL_REPORTS);
  },

  generateReport: async (params: {
    title: string;
    startDate: string;
    endDate: string;
    departmentFilter: string;
    generatedBy: string;
  }): Promise<SavedReport> => {
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      /* fallback */
    }

    initLocalStorage();
    const reports = getLocalData<SavedReport[]>(STORAGE_KEYS.REPORTS, INITIAL_REPORTS);
    const attendance = getLocalData<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);

    const filtered = attendance.filter((a) => {
      const dMatch = a.date >= params.startDate && a.date <= params.endDate;
      const deptMatch =
        !params.departmentFilter ||
        params.departmentFilter === 'All Departments' ||
        a.department === params.departmentFilter;
      return dMatch && deptMatch;
    });

    const present = filtered.filter((r) => r.status === 'Present').length;
    const absent = filtered.filter((r) => r.status === 'Absent').length;
    const leave = filtered.filter((r) => r.status === 'Leave').length;
    const late = filtered.filter((r) => r.status === 'Late').length;
    const total = filtered.length;
    const pct = total > 0 ? Number(((present + late * 0.5) / total * 100).toFixed(1)) : 0;

    const newReport: SavedReport = {
      id: `rep-${Date.now()}`,
      title: params.title,
      startDate: params.startDate,
      endDate: params.endDate,
      generatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      generatedBy: params.generatedBy,
      departmentFilter: params.departmentFilter,
      totalRecords: total,
      presentCount: present,
      absentCount: absent,
      leaveCount: leave,
      lateCount: late,
      attendancePercentage: pct,
      records: filtered,
    };

    reports.unshift(newReport);
    setLocalData(STORAGE_KEYS.REPORTS, reports);
    return newReport;
  },

  // Leave Requests
  getLeaveRequests: async (): Promise<LeaveRequest[]> => {
    try {
      const res = await fetch('/api/leave-requests');
      if (res.ok) return await res.json();
    } catch (e) {
      /* fallback */
    }

    initLocalStorage();
    return getLocalData<LeaveRequest[]>(STORAGE_KEYS.LEAVE_REQUESTS, INITIAL_LEAVE_REQUESTS);
  },

  createLeaveRequest: async (
    params: Omit<LeaveRequest, 'id' | 'status' | 'appliedAt'>
  ): Promise<LeaveRequest> => {
    initLocalStorage();
    const requests = getLocalData<LeaveRequest[]>(STORAGE_KEYS.LEAVE_REQUESTS, INITIAL_LEAVE_REQUESTS);

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newRequest: LeaveRequest = {
      ...params,
      id: `lr-${Date.now()}`,
      status: 'Pending',
      appliedAt: formattedDate,
    };

    requests.unshift(newRequest);
    setLocalData(STORAGE_KEYS.LEAVE_REQUESTS, requests);
    return newRequest;
  },

  updateLeaveStatus: async (
    id: string,
    status: LeaveStatus,
    reviewerName: string
  ): Promise<LeaveRequest> => {
    initLocalStorage();
    const requests = getLocalData<LeaveRequest[]>(STORAGE_KEYS.LEAVE_REQUESTS, INITIAL_LEAVE_REQUESTS);
    const idx = requests.findIndex((r) => r.id === id);

    if (idx === -1) throw new Error('Leave request not found');

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    requests[idx].status = status;
    requests[idx].reviewedAt = formattedDate;
    requests[idx].reviewedBy = reviewerName;

    setLocalData(STORAGE_KEYS.LEAVE_REQUESTS, requests);

    // If approved, automatically update or mark attendance for that date as 'Leave'
    if (status === 'Approved') {
      const req = requests[idx];
      await api.markAttendance(req.startDate, {
        [req.employeeId]: {
          status: 'Leave',
          notes: `Approved Leave: ${req.reason}`,
        },
      });
    }

    return requests[idx];
  },
};
