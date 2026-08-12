import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcrypt';
import {
  INITIAL_USERS,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_REPORTS,
} from './src/data/mockData.js';
import {
  User,
  Employee,
  AttendanceRecord,
  SavedReport,
  AttendanceStatus,
} from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory user passwords map (stores email -> bcrypt hash)
const userPasswords = new Map<string, string>();

// Seed default users in backend for robust demo verification
const DEFAULT_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Sarah Connor',
    email: 'admin@system.com',
    role: 'Admin',
    department: 'Human Resources',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    createdAt: '2024-01-15',
  },
  {
    id: 'usr-2',
    name: 'Prof. David Miller',
    email: 'david.m@university.edu',
    role: 'Teacher/HR',
    department: 'Computer Science Dept',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    createdAt: '2024-02-01',
  },
  {
    id: 'usr-3',
    name: 'Alex Johnson',
    email: 'alex.j@student.edu',
    role: 'Student/Employee',
    department: 'Computer Science Dept',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2024-03-10',
  },
  {
    id: 'usr-4',
    name: 'Emily Davis',
    email: 'emily.d@company.com',
    role: 'Student/Employee',
    department: 'Engineering',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    createdAt: '2024-03-12',
  },
];

let users: User[] = [...DEFAULT_USERS];
let employees: Employee[] = [...INITIAL_EMPLOYEES];
let attendance: AttendanceRecord[] = [...INITIAL_ATTENDANCE];
let reports: SavedReport[] = [...INITIAL_REPORTS];

// Seed password hashes on startup
DEFAULT_USERS.forEach((u) => {
  userPasswords.set(u.email.toLowerCase(), bcrypt.hashSync('password123', 10));
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth Endpoints
  app.post('/api/auth/login', async (req, res) => {
    try {
      // 1. Input Handling
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'The email or password you entered is incorrect.',
        });
      }

      const cleanEmail = email.trim().toLowerCase();

      // 2. Database Check
      const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

      // Security: Constant-time hash fallback to prevent response timing leakage when user doesn't exist
      const DUMMY_HASH = '$2b$10$e7I3291.6888463836182.dummyhashfortimingmitigation';
      const passwordHashToCompare = user ? (userPasswords.get(cleanEmail) || DUMMY_HASH) : DUMMY_HASH;

      // 3. Password Verification (bcrypt comparison)
      const isPasswordValid = await bcrypt.compare(password, passwordHashToCompare);

      // 4. Error Handling & Security: Generic message to block user-enumeration
      if (!user || !isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'The email or password you entered is incorrect.',
        });
      }

      // Generate mock JWT token
      const token = `jwt_token_${user.id}_${Date.now()}`;
      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          avatar: user.avatar,
          employeeId: user.employeeId,
        },
      });
    } catch (error) {
      console.error('Backend Auth login failure:', error);
      return res.status(500).json({
        success: false,
        message: 'The email or password you entered is incorrect.',
      });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, name, role, department, employeeId, password } = req.body;

      if (!email || !name || !role) {
        return res.status(400).json({ error: 'Email, name, and role are required' });
      }

      const cleanEmail = email.trim().toLowerCase();

      const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }

      const newUser: User = {
        id: `u_${Date.now()}`,
        email: cleanEmail,
        name,
        role: role || 'Student/Employee',
        department: department || 'General',
        employeeId: employeeId || undefined,
        avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        createdAt: new Date().toISOString().split('T')[0],
      };

      // Hash password using bcrypt and store
      const plainPassword = password || 'password123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      userPasswords.set(cleanEmail, hashedPassword);

      users.push(newUser);
      const token = `jwt_token_${newUser.id}_${Date.now()}`;
      return res.status(201).json({ token, user: newUser });
    } catch (error) {
      console.error('Registration Endpoint Error:', error);
      return res.status(500).json({ error: 'Failed to complete registration' });
    }
  });

  // User Management
  app.get('/api/users', (req, res) => {
    res.json(users);
  });

  app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    users = users.filter((u) => u.id !== id);
    res.json({ success: true, message: 'User deleted successfully' });
  });

  // Employees / Students Management
  app.get('/api/employees', (req, res) => {
    const { search, department, type } = req.query;
    let result = [...employees];

    if (search) {
      const q = (search as string).toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q)
      );
    }

    if (department && department !== 'All Departments') {
      result = result.filter((e) => e.department === department);
    }

    if (type && type !== 'All') {
      result = result.filter((e) => e.type === type);
    }

    res.json(result);
  });

  app.post('/api/employees', (req, res) => {
    const { name, email, type, department, designation, phone, status } = req.body;

    if (!name || !email || !department) {
      return res.status(400).json({ error: 'Name, email, and department are required' });
    }

    // Auto-generate ID if not provided (e.g., E006 or S104)
    const prefix = type === 'Student' ? 'S' : 'E';
    const count = employees.filter((e) => e.type === (type || 'Employee')).length + 1;
    const autoId = `${prefix}${String(count + 5).padStart(3, '0')}`;
    const id = req.body.id || autoId;

    const newEmp: Employee = {
      id,
      name,
      email,
      type: type || 'Employee',
      department,
      designation: designation || (type === 'Student' ? 'Student' : 'Staff'),
      joinDate: req.body.joinDate || new Date().toISOString().split('T')[0],
      phone: phone || '+1 (555) 000-0000',
      status: status || 'Active',
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
    };

    employees.push(newEmp);
    res.status(201).json(newEmp);
  });

  app.put('/api/employees/:id', (req, res) => {
    const { id } = req.params;
    const idx = employees.findIndex((e) => e.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Employee or Student not found' });
    }

    employees[idx] = { ...employees[idx], ...req.body };
    res.json(employees[idx]);
  });

  app.delete('/api/employees/:id', (req, res) => {
    const { id } = req.params;
    employees = employees.filter((e) => e.id !== id);
    // Also cleanup attendance records for this employee
    attendance = attendance.filter((a) => a.employeeId !== id);
    res.json({ success: true });
  });

  // Attendance Operations
  app.get('/api/attendance', (req, res) => {
    const { date, startDate, endDate, department, status, searchQuery } = req.query;
    let result = [...attendance];

    if (date) {
      result = result.filter((a) => a.date === date);
    } else if (startDate && endDate) {
      result = result.filter((a) => a.date >= (startDate as string) && a.date <= (endDate as string));
    }

    if (department && department !== 'All Departments') {
      result = result.filter((a) => a.department === department);
    }

    if (status && status !== 'All') {
      result = result.filter((a) => a.status === status);
    }

    if (searchQuery) {
      const q = (searchQuery as string).toLowerCase();
      result = result.filter(
        (a) =>
          a.employeeName.toLowerCase().includes(q) ||
          a.employeeId.toLowerCase().includes(q)
      );
    }

    res.json(result);
  });

  app.post('/api/attendance/mark', (req, res) => {
    const { records, date } = req.body;

    if (!Array.isArray(records) || !date) {
      return res.status(400).json({ error: 'Records array and date are required' });
    }

    records.forEach((rec: { employeeId: string; status: AttendanceStatus; notes?: string; checkInTime?: string }) => {
      const emp = employees.find((e) => e.id === rec.employeeId);
      const existingIdx = attendance.findIndex(
        (a) => a.date === date && a.employeeId === rec.employeeId
      );

      const recordData: AttendanceRecord = {
        id: existingIdx !== -1 ? attendance[existingIdx].id : `att-${date}-${rec.employeeId}`,
        date,
        employeeId: rec.employeeId,
        employeeName: emp ? emp.name : 'Unknown',
        department: emp ? emp.department : 'General',
        status: rec.status,
        checkInTime: rec.checkInTime || (rec.status === 'Present' ? '09:00 AM' : rec.status === 'Late' ? '09:45 AM' : undefined),
        notes: rec.notes || undefined,
      };

      if (existingIdx !== -1) {
        attendance[existingIdx] = recordData;
      } else {
        attendance.push(recordData);
      }
    });

    res.json({ success: true, count: records.length, date });
  });

  // Reports
  app.get('/api/reports', (req, res) => {
    res.json(reports);
  });

  app.post('/api/reports', (req, res) => {
    const { title, startDate, endDate, departmentFilter, generatedBy } = req.body;

    const filteredRecords = attendance.filter((a) => {
      const dateMatch = a.date >= startDate && a.date <= endDate;
      const deptMatch = !departmentFilter || departmentFilter === 'All Departments' || a.department === departmentFilter;
      return dateMatch && deptMatch;
    });

    const present = filteredRecords.filter((r) => r.status === 'Present').length;
    const absent = filteredRecords.filter((r) => r.status === 'Absent').length;
    const leave = filteredRecords.filter((r) => r.status === 'Leave').length;
    const late = filteredRecords.filter((r) => r.status === 'Late').length;
    const total = filteredRecords.length;
    const percentage = total > 0 ? Number(((present + late * 0.5) / total * 100).toFixed(1)) : 0;

    const newReport: SavedReport = {
      id: `rep-${Date.now()}`,
      title: title || `Attendance Report (${startDate} to ${endDate})`,
      startDate,
      endDate,
      generatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      generatedBy: generatedBy || 'System Admin',
      departmentFilter: departmentFilter || 'All Departments',
      totalRecords: total,
      presentCount: present,
      absentCount: absent,
      leaveCount: leave,
      lateCount: late,
      attendancePercentage: percentage,
      records: filteredRecords,
    };

    reports.unshift(newReport);
    res.status(201).json(newReport);
  });

  // Overview Stats
  app.get('/api/stats', (req, res) => {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const todaysRecords = attendance.filter((a) => a.date === date);

    const totalActiveEmployees = employees.filter((e) => e.status === 'Active').length;
    const present = todaysRecords.filter((r) => r.status === 'Present').length;
    const absent = todaysRecords.filter((r) => r.status === 'Absent').length;
    const leave = todaysRecords.filter((r) => r.status === 'Leave').length;
    const late = todaysRecords.filter((r) => r.status === 'Late').length;

    const rate = totalActiveEmployees > 0
      ? Math.round(((present + late * 0.5) / totalActiveEmployees) * 100)
      : 0;

    res.json({
      date,
      totalEmployees: totalActiveEmployees,
      markedToday: todaysRecords.length,
      present,
      absent,
      leave,
      late,
      attendanceRate: rate,
    });
  });

  // Vite Middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
