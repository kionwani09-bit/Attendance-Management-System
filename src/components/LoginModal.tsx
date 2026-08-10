import React, { useState } from 'react';
import {
  UserCheck,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  Key,
  ShieldCheck,
} from 'lucide-react';
import { Role } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onLogin: (email: string) => Promise<void>;
  onRegister: (data: {
    email: string;
    name: string;
    role: Role;
    department: string;
  }) => Promise<void>;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onLogin,
  onRegister,
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register Fields
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('Admin');
  const [department, setDepartment] = useState('Engineering');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegisterMode) {
        if (!name || !email) {
          setError('Please fill in all required fields');
          setLoading(false);
          return;
        }
        await onRegister({ email, name, role, department });
      } else {
        if (!email) {
          setError('Please enter your email address');
          setLoading(false);
          return;
        }
        await onLogin(email);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-xl relative space-y-6 text-slate-800 animate-fade-in my-auto">
        {/* Logo Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 mx-auto flex items-center justify-center text-indigo-600 shadow-xs">
            <UserCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {isRegisterMode ? 'Create an Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-500">
            {isRegisterMode
              ? 'Enter your details to request workspace authorization'
              : 'Sign in to access your attendance console & reports'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Michael Scott"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="name@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              {!isRegisterMode && (
                <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-[11px] font-semibold text-indigo-600 hover:underline">
                  Forgot password?
                </a>
              )}
            </div>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {isRegisterMode && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Admin">Admin</option>
                  <option value="Teacher/HR">Teacher / HR</option>
                  <option value="Student/Employee">Student / Employee</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Computer Science Dept">CS Dept</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 mt-3"
          >
            <span>{loading ? 'Authenticating...' : isRegisterMode ? 'Register Account' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-2">
          <div>
            {isRegisterMode ? (
              <span>
                Already have an account?{' '}
                <button
                  onClick={() => setIsRegisterMode(false)}
                  className="text-indigo-600 font-bold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{' '}
                <button
                  onClick={() => setIsRegisterMode(true)}
                  className="text-indigo-600 font-bold hover:underline cursor-pointer"
                >
                  Create one
                </button>
              </span>
            )}
          </div>
          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Secure Enterprise Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
};

