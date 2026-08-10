import React, { useState } from 'react';
import {
  UserCheck,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  Key,
  Eye,
  EyeOff,
  MailCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Role } from '../types';
import { api } from '../services/api';

interface LoginModalProps {
  isOpen: boolean;
  onLogin: (email: string, password?: string) => Promise<void>;
  onRegister: (data: {
    email: string;
    name: string;
    role: Role;
    department: string;
    password?: string;
  }) => Promise<void>;
  onGoogleLogin?: () => Promise<void>;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onLogin,
  onRegister,
  onGoogleLogin,
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register Fields
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('Admin');
  const [department, setDepartment] = useState('Engineering');

  // Verification & UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSentEmail, setVerificationSentEmail] = useState<string | null>(null);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState<string>('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setVerificationNotice(null);

    try {
      if (isRegisterMode) {
        if (!name || !email) {
          setError('Please fill in all required fields');
          setLoading(false);
          return;
        }
        await onRegister({ email, name, role, department, password });
        // Redirect to Email Verification Page
        setVerificationSentEmail(email);
        setOtpCode(api.getVerificationCode(email)); // Pre-populate or ready for 6-digit entry
      } else {
        if (!email) {
          setError('Please enter your email address');
          setLoading(false);
          return;
        }
        await onLogin(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationSentEmail) return;
    setError(null);

    const isValid = api.verifyEmailCode(verificationSentEmail, otpCode);
    if (isValid) {
      const targetEmail = verificationSentEmail;
      setVerificationSentEmail(null);
      setIsRegisterMode(false);
      setEmail(targetEmail);
      setVerificationNotice(`Email (${targetEmail}) verified successfully! Please log in below.`);
      setOtpCode('');
    } else {
      setError('Invalid 6-digit verification code. Please check your code or click resend.');
    }
  };

  // Dedicated Page: Email Verification Page
  if (verificationSentEmail) {
    const activeCode = api.getVerificationCode(verificationSentEmail);

    return (
      <div className="fixed inset-0 z-50 bg-slate-100/90 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-xl relative space-y-5 text-slate-800 animate-fade-in my-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 mx-auto flex items-center justify-center text-indigo-600 shadow-xs">
            <MailCheck className="w-8 h-8 text-indigo-600" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Email Verification
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              We sent a verification email and a 6-digit code to{' '}
              <span className="font-bold text-indigo-600">{verificationSentEmail}</span>.
            </p>
          </div>

          {resendSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{resendSuccess}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 6-Digit Code Input Form */}
          <form onSubmit={handleVerifyCodeSubmit} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Enter 6-Digit Verification Code
              </label>
              <div className="relative max-w-xs mx-auto">
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="e.g. 849201"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-50 border-2 border-indigo-200 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-[0.4em] font-bold text-indigo-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-center justify-between gap-2">
              <span className="text-slate-500">Sent Code: <strong className="font-mono text-slate-800 text-sm">{activeCode}</strong></span>
              <button
                type="button"
                onClick={() => setOtpCode(activeCode)}
                className="text-indigo-600 font-bold hover:underline cursor-pointer text-[11px] bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100"
              >
                Auto-fill Code
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Reload to Login</span>
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              disabled={resending}
              onClick={async () => {
                setResending(true);
                setResendSuccess(null);
                setError(null);
                try {
                  const newCode = await api.resendVerificationLink(verificationSentEmail);
                  setOtpCode(newCode);
                  setResendSuccess(`New code sent to ${verificationSentEmail}!`);
                } catch (err: any) {
                  setError(err?.message || 'Failed to resend verification email');
                } finally {
                  setResending(false);
                }
              }}
              className="text-indigo-600 font-semibold hover:underline cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>{resending ? 'Sending...' : 'Resend Code'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const targetEmail = verificationSentEmail;
                setVerificationSentEmail(null);
                setIsRegisterMode(false);
                setEmail(targetEmail);
                setVerificationNotice(`Verification link & code sent to ${targetEmail}.`);
              }}
              className="text-slate-500 font-medium hover:text-slate-800 cursor-pointer flex items-center gap-1"
            >
              <span>Back to Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-100/90 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
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
              ? 'Enter your details to create an account & send email verification'
              : 'Sign in to access your attendance console & reports'}
          </p>
        </div>

        {verificationNotice && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2.5 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{verificationNotice}</span>
          </div>
        )}

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
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg pl-9 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 focus:outline-none p-1 cursor-pointer transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400" />
                )}
              </button>
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
            <span>{loading ? 'Authenticating...' : isRegisterMode ? 'Sign Up & Send Verification' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {onGoogleLogin && (
          <div className="pt-2">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Or Continue With
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setError(null);
                try {
                  await onGoogleLogin();
                } catch (err: any) {
                  const msg = err?.message || '';
                  if (
                    msg.includes('cancelled') ||
                    msg.includes('popup-closed-by-user') ||
                    err?.code === 'auth/popup-closed-by-user' ||
                    err?.code === 'auth/cancelled-popup-request'
                  ) {
                    // User closed popup window - do not display an error message
                    return;
                  }
                  setError(msg || 'Google sign-in failed.');
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        )}

        <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-500">
          {isRegisterMode ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setError(null);
                }}
                className="text-indigo-600 font-bold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setError(null);
                }}
                className="text-indigo-600 font-bold hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

