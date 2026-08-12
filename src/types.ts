export type Role = 'Admin' | 'Teacher/HR' | 'Student/Employee';

export type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Late';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export type EmployeeType = 'Employee' | 'Student';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  type?: EmployeeType;
  designation?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  startDate: string;
  reportBackDate?: string;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  department?: string;
  avatar?: string;
  employeeId?: string; // linked employee/student profile ID
  createdAt?: string;
}

export interface Employee {
  id: string; // e.g. E001, E002, S101
  employeeId?: string;
  name: string;
  email: string;
  type: EmployeeType;
  department: string;
  designation: string; // e.g. Senior Developer, Professor, Student
  joinDate: string;
  phone: string;
  status: 'Active' | 'Inactive';
  avatar?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  employeeId: string;
  employeeName: string;
  department: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  checkInTime?: string;
  notes?: string;
  verifiedBy?: string;
}

export interface AttendanceSummary {
  date: string;
  total: number;
  present: number;
  absent: number;
  leave: number;
  late: number;
  percentage: number;
}

export interface SavedReport {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  generatedBy: string;
  departmentFilter: string;
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  lateCount: number;
  attendancePercentage: number;
  records: AttendanceRecord[];
}

export interface FilterOptions {
  date?: string;
  startDate?: string;
  endDate?: string;
  department?: string;
  status?: string;
  searchQuery?: string;
  type?: string;
}
