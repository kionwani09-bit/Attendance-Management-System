import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
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

let users: User[] = [...INITIAL_USERS];
let employees: Employee[] = [...INITIAL_EMPLOYEES];
let attendance: AttendanceRecord[] = [...INITIAL_ATTENDANCE];
let reports: SavedReport[] = [...INITIAL_REPORTS];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth Endpoints
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate mock JWT token
    const token = `jwt_token_${user.id}_${Date.now()}`;
    res.json({
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
  });

  app.post('/api/auth/register', (req, res) => {
    const { email, name, role, department, employeeId } = req.body;

    if (!email || !name || !role) {
      return res.status(400).json({ error: 'Email, name, and role are required' });
    }

    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const newUser: User = {
      id: `u_${Date.now()}`,
      email,
      name,
      role: role || 'Student/Employee',
      department: department || 'General',
      employeeId: employeeId || undefined,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    users.push(newUser);
    const token = `jwt_token_${newUser.id}_${Date.now()}`;
    res.status(201).json({ token, user: newUser });
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
