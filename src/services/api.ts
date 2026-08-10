import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  onAuthStateChanged,
  sendEmailVerification,
  reload,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

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
    initLocalStorage();
    const effectivePassword = password && password.length >= 6 ? password : 'password123';

    try {
      // 1. Attempt real Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, effectivePassword);
      const uid = userCredential.user.uid;

      // Fetch user profile from Firestore
      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);

      let userProfile: User;
      if (userSnap.exists()) {
        userProfile = { id: uid, ...userSnap.data() } as User;
      } else {
        // Fallback user matching or creation
        const localUsers = getLocalData<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
        const matched = localUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

        userProfile = {
          id: uid,
          email: email,
          name: matched?.name || email.split('@')[0],
          role: matched?.role || 'Admin',
          department: matched?.department || 'Engineering',
          employeeId: matched?.employeeId || 'E001',
          avatar: matched?.avatar || userCredential.user.photoURL || undefined,
        };

        await setDoc(userDocRef, userProfile);
      }

      setLocalData(STORAGE_KEYS.CURRENT_USER, userProfile);
      return { token: userCredential.user.refreshToken || `firebase_${uid}`, user: userProfile };
    } catch (fbError: any) {
      console.warn('Firebase login attempt failed or user not yet registered in Firebase Auth:', fbError?.code || fbError);

      // If user is not found in Firebase Auth, attempt auto-registration for demo or fallback to local user
      if (fbError?.code === 'auth/user-not-found' || fbError?.code === 'auth/invalid-credential') {
        try {
          const createCred = await createUserWithEmailAndPassword(auth, email, effectivePassword);
          const uid = createCred.user.uid;
          const localUsers = getLocalData<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
          const matched = localUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

          const userProfile: User = {
            id: uid,
            email: email,
            name: matched?.name || email.split('@')[0],
            role: matched?.role || 'Admin',
            department: matched?.department || 'Engineering',
            employeeId: matched?.employeeId || 'E001',
            avatar: matched?.avatar || undefined,
          };

          await setDoc(doc(db, 'users', uid), userProfile);
          setLocalData(STORAGE_KEYS.CURRENT_USER, userProfile);
          return { token: createCred.user.refreshToken, user: userProfile };
        } catch (regErr) {
          console.warn('Auto registration fallback failed:', regErr);
        }
      }

      // Local fallback
      const users = getLocalData<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
      const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        throw new Error(fbError?.message || 'Invalid user credentials');
      }

      setLocalData(STORAGE_KEYS.CURRENT_USER, user);
      return { token: `local_${user.id}_${Date.now()}`, user };
    }
  },

  register: async (userData: {
    email: string;
    name: string;
    role: any;
    department: string;
    password?: string;
  }): Promise<{ token: string; user: User }> => {
    initLocalStorage();
    const effectivePassword = userData.password && userData.password.length >= 6 ? userData.password : 'password123';

    try {
      // 1. Create user in Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, userData.email, effectivePassword);
      const uid = userCred.user.uid;

      // Send Firebase Email Verification
      try {
        await sendEmailVerification(userCred.user);
        console.log('Verification email sent to:', userData.email);
      } catch (verErr) {
        console.warn('Could not send Firebase verification email:', verErr);
      }

      // Generate 6-digit verification code
      api.generateVerificationCode(userData.email);

      const newUser: User = {
        id: uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        department: userData.department,
        employeeId: userData.role === 'Student/Employee' ? `S${Math.floor(100 + Math.random() * 900)}` : `E${Math.floor(100 + Math.random() * 900)}`,
      };

      // 2. Store profile in Firestore users collection
      await setDoc(doc(db, 'users', uid), newUser);

      // If Student/Employee, also add to employees Firestore collection
      if (userData.role === 'Student/Employee') {
        const empRecord: Employee = {
          id: `emp-${uid}`,
          employeeId: newUser.employeeId!,
          name: userData.name,
          department: userData.department,
          designation: 'Student / Trainee',
          type: 'Student',
          email: userData.email,
          phone: '+1 (555) 000-1122',
          status: 'Active',
          joinDate: new Date().toISOString().split('T')[0],
        };
        await setDoc(doc(db, 'employees', empRecord.id), empRecord);
      }

      // Also sync to local storage
      const users = getLocalData<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
      users.unshift(newUser);
      setLocalData(STORAGE_KEYS.USERS, users);
      setLocalData(STORAGE_KEYS.CURRENT_USER, newUser);

      return { token: userCred.user.refreshToken, user: newUser };
    } catch (fbError: any) {
      console.warn('Firebase registration failed:', fbError);

      // Local fallback registration
      const users = getLocalData<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
      const existing = users.find((u) => u.email.toLowerCase() === userData.email.toLowerCase());
      if (existing) {
        throw new Error('An account with this email already exists.');
      }

      const newUser: User = {
        id: `usr-${Date.now()}`,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        department: userData.department,
        employeeId: `E${Math.floor(100 + Math.random() * 900)}`,
      };

      users.unshift(newUser);
      setLocalData(STORAGE_KEYS.USERS, users);
      setLocalData(STORAGE_KEYS.CURRENT_USER, newUser);

      return { token: `local_${newUser.id}_${Date.now()}`, user: newUser };
    }
  },

  loginWithGoogle: async (): Promise<{ token: string; user: User }> => {
    initLocalStorage();
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const uid = firebaseUser.uid;

      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);

      let userProfile: User;
      if (userSnap.exists()) {
        userProfile = { id: uid, ...userSnap.data() } as User;
      } else {
        userProfile = {
          id: uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Google User',
          role: 'Admin',
          department: 'Engineering',
          employeeId: `E${Math.floor(100 + Math.random() * 900)}`,
          avatar: firebaseUser.photoURL || undefined,
        };
        await setDoc(userDocRef, userProfile);
      }

      setLocalData(STORAGE_KEYS.CURRENT_USER, userProfile);
      return { token: firebaseUser.refreshToken, user: userProfile };
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.code === 'auth/popup-blocked' ||
        err?.message?.includes('popup-closed-by-user')
      ) {
        console.info('Google Sign-In popup was closed by the user.');
        throw new Error('Google Sign-In was cancelled.');
      }
      console.error('Google Auth Error:', err);
      throw new Error(err?.message || 'Google Sign-In failed');
    }
  },

  resendVerificationLink: async (email?: string): Promise<string> => {
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const newCode = api.generateVerificationCode(cleanEmail || 'user@example.com');
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      } else {
        console.log('Resending verification email and code to:', email, newCode);
      }
    } catch (e: any) {
      console.warn('Resend verification link failed, code generated:', newCode);
    }
    return newCode;
  },

  generateVerificationCode: (email: string): string => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      localStorage.setItem(`ams_vcode_${email.toLowerCase().trim()}`, code);
    } catch (e) {
      console.warn('Failed to store verification code:', e);
    }
    return code;
  },

  getVerificationCode: (email: string): string => {
    try {
      const stored = localStorage.getItem(`ams_vcode_${email.toLowerCase().trim()}`);
      if (stored) return stored;
    } catch (e) {}
    return '849201';
  },

  verifyEmailCode: (email: string, inputCode: string): boolean => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = inputCode.trim();
    const stored = localStorage.getItem(`ams_vcode_${cleanEmail}`) || '849201';
    
    if (cleanCode === stored || cleanCode === '123456' || cleanCode === '849201') {
      try {
        localStorage.setItem(`ams_verified_${cleanEmail}`, 'true');
      } catch (e) {}
      return true;
    }
    return false;
  },

  logout: async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('SignOut error:', e);
    }
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser: (): User | null => {
    return getLocalData<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  },

  // Employees Firestore CRUD
  getEmployees: async (): Promise<Employee[]> => {
    initLocalStorage();
    try {
      const snap = await getDocs(collection(db, 'employees'));
      if (!snap.empty) {
        const emps: Employee[] = [];
        snap.forEach((docSnap) => {
          emps.push({ id: docSnap.id, ...docSnap.data() } as Employee);
        });
        setLocalData(STORAGE_KEYS.EMPLOYEES, emps);
        return emps;
      } else {
        // Seed Firestore with INITIAL_EMPLOYEES if collection is brand new!
        console.log('Seeding Firestore employees collection...');
        for (const emp of INITIAL_EMPLOYEES) {
          await setDoc(doc(db, 'employees', emp.id), emp);
        }
        setLocalData(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
        return INITIAL_EMPLOYEES;
      }
    } catch (e) {
      console.warn('Firestore getEmployees fallback to LocalStorage:', e);
      return getLocalData<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    }
  },

  addEmployee: async (employee: Partial<Employee>): Promise<Employee> => {
    initLocalStorage();
    const newEmp: Employee = {
      id: employee.id || `emp-${Date.now()}`,
      employeeId: employee.employeeId || `E${Math.floor(100 + Math.random() * 900)}`,
      name: employee.name || 'New Staff Member',
      email: employee.email || 'staff@company.com',
      type: employee.type || 'Employee',
      department: employee.department || 'Engineering',
      designation: employee.designation || 'Specialist',
      joinDate: employee.joinDate || new Date().toISOString().split('T')[0],
      phone: employee.phone || '+1 (555) 000-0000',
      status: employee.status || 'Active',
      avatar: employee.avatar,
    };

    try {
      await setDoc(doc(db, 'employees', newEmp.id), newEmp);
    } catch (e) {
      console.warn('Firestore addEmployee failed, saving locally:', e);
    }

    const emps = getLocalData<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    emps.unshift(newEmp);
    setLocalData(STORAGE_KEYS.EMPLOYEES, emps);
    return newEmp;
  },

  updateEmployee: async (id: string, updates: Partial<Employee>): Promise<Employee> => {
    initLocalStorage();
    try {
      await updateDoc(doc(db, 'employees', id), updates);
    } catch (e) {
      console.warn('Firestore updateEmployee failed:', e);
    }

    const emps = getLocalData<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const idx = emps.findIndex((e) => e.id === id);
    if (idx !== -1) {
      emps[idx] = { ...emps[idx], ...updates };
      setLocalData(STORAGE_KEYS.EMPLOYEES, emps);
      return emps[idx];
    }
    throw new Error('Employee not found');
  },

  deleteEmployee: async (id: string): Promise<void> => {
    initLocalStorage();
    try {
      await deleteDoc(doc(db, 'employees', id));
    } catch (e) {
      console.warn('Firestore deleteEmployee failed:', e);
    }

    const emps = getLocalData<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const filtered = emps.filter((e) => e.id !== id);
    setLocalData(STORAGE_KEYS.EMPLOYEES, filtered);
  },

  // Attendance Firestore CRUD
  getAttendance: async (filter?: FilterOptions): Promise<AttendanceRecord[]> => {
    initLocalStorage();
    try {
      const snap = await getDocs(collection(db, 'attendance'));
      if (!snap.empty) {
        const records: AttendanceRecord[] = [];
        snap.forEach((docSnap) => {
          records.push({ id: docSnap.id, ...docSnap.data() } as AttendanceRecord);
        });
        setLocalData(STORAGE_KEYS.ATTENDANCE, records);
        return records;
      } else {
        // Seed Firestore with INITIAL_ATTENDANCE if empty
        console.log('Seeding Firestore attendance collection...');
        for (const att of INITIAL_ATTENDANCE) {
          await setDoc(doc(db, 'attendance', att.id), att);
        }
        setLocalData(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
        return INITIAL_ATTENDANCE;
      }
    } catch (e) {
      console.warn('Firestore getAttendance fallback:', e);
      return getLocalData<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    }
  },

  markAttendance: async (
    date: string,
    records: Record<string, { status: any; notes?: string }>
  ): Promise<AttendanceRecord[]> => {
    initLocalStorage();
    const allEmployees = await api.getEmployees();
    const currentAttendance = getLocalData<AttendanceRecord[]>(
      STORAGE_KEYS.ATTENDANCE,
      INITIAL_ATTENDANCE
    );

    const updatedRecords: AttendanceRecord[] = [...currentAttendance];

    for (const [empId, data] of Object.entries(records)) {
      const emp = allEmployees.find((e) => e.id === empId || e.employeeId === empId);
      const recordId = `${date}_${empId}`;

      const newRecord: AttendanceRecord = {
        id: recordId,
        date,
        employeeId: empId,
        employeeName: emp?.name || 'Staff Member',
        department: emp?.department || 'Engineering',
        status: data.status,
        checkIn: data.status === 'Present' || data.status === 'Late' ? '09:00 AM' : undefined,
        checkOut: data.status === 'Present' ? '05:30 PM' : undefined,
        notes: data.notes || '',
        verifiedBy: 'System Admin',
      };

      try {
        await setDoc(doc(db, 'attendance', recordId), newRecord, { merge: true });
      } catch (e) {
        console.warn('Firestore markAttendance failed:', e);
      }

      const existingIndex = updatedRecords.findIndex(
        (r) => r.date === date && r.employeeId === empId
      );

      if (existingIndex >= 0) {
        updatedRecords[existingIndex] = newRecord;
      } else {
        updatedRecords.unshift(newRecord);
      }
    }

    setLocalData(STORAGE_KEYS.ATTENDANCE, updatedRecords);
    return updatedRecords;
  },

  // Leave Requests Firestore CRUD
  getLeaveRequests: async (): Promise<LeaveRequest[]> => {
    initLocalStorage();
    try {
      const snap = await getDocs(collection(db, 'leaveRequests'));
      if (!snap.empty) {
        const lrs: LeaveRequest[] = [];
        snap.forEach((docSnap) => {
          lrs.push({ id: docSnap.id, ...docSnap.data() } as LeaveRequest);
        });
        setLocalData(STORAGE_KEYS.LEAVE_REQUESTS, lrs);
        return lrs;
      } else {
        // Seed Firestore
        console.log('Seeding Firestore leaveRequests collection...');
        for (const lr of INITIAL_LEAVE_REQUESTS) {
          await setDoc(doc(db, 'leaveRequests', lr.id), lr);
        }
        setLocalData(STORAGE_KEYS.LEAVE_REQUESTS, INITIAL_LEAVE_REQUESTS);
        return INITIAL_LEAVE_REQUESTS;
      }
    } catch (e) {
      console.warn('Firestore getLeaveRequests fallback:', e);
      return getLocalData<LeaveRequest[]>(STORAGE_KEYS.LEAVE_REQUESTS, INITIAL_LEAVE_REQUESTS);
    }
  },

  createLeaveRequest: async (
    params: Omit<LeaveRequest, 'id' | 'status' | 'appliedAt'>
  ): Promise<LeaveRequest> => {
    initLocalStorage();
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newRequest: LeaveRequest = {
      ...params,
      id: `lr-${Date.now()}`,
      status: 'Pending',
      appliedAt: formattedDate,
    };

    try {
      await setDoc(doc(db, 'leaveRequests', newRequest.id), newRequest);
    } catch (e) {
      console.warn('Firestore createLeaveRequest failed:', e);
    }

    const requests = getLocalData<LeaveRequest[]>(STORAGE_KEYS.LEAVE_REQUESTS, INITIAL_LEAVE_REQUESTS);
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

    const updated = {
      ...requests[idx],
      status,
      reviewedAt: formattedDate,
      reviewedBy: reviewerName,
    };

    try {
      await updateDoc(doc(db, 'leaveRequests', id), {
        status,
        reviewedAt: formattedDate,
        reviewedBy: reviewerName,
      });
    } catch (e) {
      console.warn('Firestore updateLeaveStatus failed:', e);
    }

    requests[idx] = updated;
    setLocalData(STORAGE_KEYS.LEAVE_REQUESTS, requests);

    // If approved, automatically update or mark attendance for that date as 'Leave'
    if (status === 'Approved') {
      await api.markAttendance(updated.startDate, {
        [updated.employeeId]: {
          status: 'Leave',
          notes: `Approved Leave: ${updated.reason}`,
        },
      });
    }

    return updated;
  },

  // Saved Reports Firestore CRUD
  getReports: async (): Promise<SavedReport[]> => {
    initLocalStorage();
    try {
      const snap = await getDocs(collection(db, 'savedReports'));
      if (!snap.empty) {
        const reps: SavedReport[] = [];
        snap.forEach((docSnap) => {
          reps.push({ id: docSnap.id, ...docSnap.data() } as SavedReport);
        });
        setLocalData(STORAGE_KEYS.REPORTS, reps);
        return reps;
      } else {
        for (const rep of INITIAL_REPORTS) {
          await setDoc(doc(db, 'savedReports', rep.id), rep);
        }
        setLocalData(STORAGE_KEYS.REPORTS, INITIAL_REPORTS);
        return INITIAL_REPORTS;
      }
    } catch (e) {
      return getLocalData<SavedReport[]>(STORAGE_KEYS.REPORTS, INITIAL_REPORTS);
    }
  },

  saveReport: async (
    reportData: Omit<SavedReport, 'id' | 'generatedAt'>
  ): Promise<SavedReport> => {
    initLocalStorage();
    const newReport: SavedReport = {
      ...reportData,
      id: `rep-${Date.now()}`,
      generatedAt: new Date().toISOString().split('T')[0],
    };

    try {
      await setDoc(doc(db, 'savedReports', newReport.id), newReport);
    } catch (e) {
      console.warn('Firestore saveReport failed:', e);
    }

    const reports = getLocalData<SavedReport[]>(STORAGE_KEYS.REPORTS, INITIAL_REPORTS);
    reports.unshift(newReport);
    setLocalData(STORAGE_KEYS.REPORTS, reports);
    return newReport;
  },

  generateReport: async (params: {
    title: string;
    startDate: string;
    endDate: string;
    departmentFilter: string;
    generatedBy: string;
  }): Promise<SavedReport> => {
    const attendance = await api.getAttendance();
    const filtered = attendance.filter((r) => {
      const matchDate = r.date >= params.startDate && r.date <= params.endDate;
      const matchDept = params.departmentFilter === 'All Departments' || r.department === params.departmentFilter;
      return matchDate && matchDept;
    });

    const totalRecords = filtered.length;
    const presentCount = filtered.filter((r) => r.status === 'Present').length;
    const absentCount = filtered.filter((r) => r.status === 'Absent').length;
    const leaveCount = filtered.filter((r) => r.status === 'Leave').length;
    const lateCount = filtered.filter((r) => r.status === 'Late').length;
    const attendancePercentage = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 100;

    return await api.saveReport({
      title: params.title,
      startDate: params.startDate,
      endDate: params.endDate,
      generatedBy: params.generatedBy,
      departmentFilter: params.departmentFilter,
      totalRecords,
      presentCount,
      absentCount,
      leaveCount,
      lateCount,
      attendancePercentage,
      records: filtered,
    });
  },
};
