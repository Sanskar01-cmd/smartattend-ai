import React, { useState, useEffect } from 'react';
import { loginApi, registerApi, getAdminSetupStatusApi, setupFirstAdminApi } from '../services/api';
import { AuthResponse } from '../types';
import { LogoIcon, ShieldCheckIcon, AlertIcon, CheckIcon } from '../components/Icons';

interface AuthViewProps {
  onAuthSuccess: (authData: AuthResponse) => void;
  defaultMode?: 'login' | 'register' | 'admin';
  onCancel?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onAuthSuccess,
  defaultMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'admin'>(defaultMode);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Admin Setup Status
  const [needsAdminSetup, setNeedsAdminSetup] = useState<boolean>(false);
  const [adminSetupMode, setAdminSetupMode] = useState<boolean>(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state (Student)
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [course, setCourse] = useState('B.Tech Computer Science');
  const [academicYear, setAcademicYear] = useState('2025 - 2026');
  const [phoneNumber, setPhoneNumber] = useState('');

  // First Admin Setup form state
  const [adminName, setAdminName] = useState('System Administrator');
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminEmail, setAdminEmail] = useState('admin@college.edu');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');

  useEffect(() => {
    getAdminSetupStatusApi().then((res) => {
      setNeedsAdminSetup(res.needs_setup);
      if (res.needs_setup) {
        setAdminSetupMode(true);
      }
    });
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent, portal: 'student' | 'admin') => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMessage(
        portal === 'admin'
          ? 'Please enter your Administrator Username/Email and Password.'
          : 'Please provide your Email/Student ID and Password.'
      );
      return;
    }

    setLoading(true);
    try {
      const response = await loginApi({
        identifier: loginIdentifier.trim(),
        password: loginPassword,
        portal_type: portal,
      });

      if (portal === 'admin' && response.role !== 'admin' && !response.user.is_staff && !response.user.is_superuser) {
        setErrorMessage('Access Denied: This account lacks Administrator privileges.');
        return;
      }

      setSuccessMessage(response.message || (portal === 'admin' ? 'Administrator authenticated successfully!' : 'Login successful!'));
      setTimeout(() => onAuthSuccess(response), 400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please check credentials.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fullName.trim() || !studentId.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const response = await registerApi({
        full_name: fullName.trim(),
        student_id: studentId.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirm_password: confirmPassword,
        department,
        course,
        academic_year: academicYear,
        phone_number: phoneNumber.trim(),
      });
      setSuccessMessage('Registration successful! Signing in to your student portal...');
      setTimeout(() => onAuthSuccess(response), 600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please review errors.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!adminUsername.trim() || !adminEmail.trim() || !adminPassword || !adminConfirmPassword) {
      setErrorMessage('Please complete all fields for Administrator initialization.');
      return;
    }

    if (adminPassword !== adminConfirmPassword) {
      setErrorMessage('Administrator passwords do not match.');
      return;
    }

    if (adminPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const response = await setupFirstAdminApi({
        name: adminName.trim(),
        username: adminUsername.trim(),
        email: adminEmail.trim().toLowerCase(),
        password: adminPassword,
      });

      setSuccessMessage('First Administrator account initialized successfully! Loading console...');
      setNeedsAdminSetup(false);
      setAdminSetupMode(false);
      setTimeout(() => onAuthSuccess(response), 600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'First Administrator initialization failed.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-4 sm:py-8 px-4">
      <div className={`bg-slate-900/90 border rounded-2xl p-6 sm:p-8 shadow-2xl relative backdrop-blur-md transition-all ${
        mode === 'admin' ? 'border-rose-900/60 shadow-rose-950/20' : 'border-slate-800'
      }`}>
        {/* Branding header */}
        <div className="text-center mb-6">
          <div className={`inline-flex w-12 h-12 rounded-2xl p-0.5 shadow-glow-sm items-center justify-center mb-3 ${
            mode === 'admin'
              ? 'bg-gradient-to-tr from-rose-600 to-amber-500'
              : 'bg-gradient-to-tr from-brand-600 to-cyan-500'
          }`}>
            <div className="w-full h-full bg-navy-950 rounded-[14px] flex items-center justify-center">
              {mode === 'admin' ? (
                <ShieldCheckIcon className="w-6 h-6 text-rose-400" />
              ) : (
                <LogoIcon className="w-6 h-6 text-cyan-400" />
              )}
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            SmartAttend <span className={mode === 'admin' ? 'text-rose-400' : 'text-cyan-400'}>
              {mode === 'admin' ? 'Admin' : 'AI'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'admin'
              ? 'Institutional Administrator & Event Coordinator Portal'
              : 'College Event & Workshop Attendance Management Portal'}
          </p>
        </div>

        {/* Tab Switcher (3 Modes) */}
        <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800 gap-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-brand-600 text-white shadow-glow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Student Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-brand-600 text-white shadow-glow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Student Sign Up
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('admin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'admin'
                ? 'bg-rose-700 text-white shadow-glow-sm'
                : 'text-rose-400 hover:text-rose-300'
            }`}
          >
            <ShieldCheckIcon className="w-3.5 h-3.5" />
            <span>Admin Portal</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
            <AlertIcon className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. Student Login Form */}
        {mode === 'login' && (
          <form onSubmit={(e) => handleLoginSubmit(e, 'student')} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Email Address or Student ID <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                required
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="e.g. sanskar@college.edu or CS-2024-001"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 placeholder:text-slate-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Password <span className="text-cyan-400">*</span>
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 placeholder:text-slate-600 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-glow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Authenticating with Backend...</span>
              ) : (
                <span>Sign In as Student</span>
              )}
            </button>

            <div className="pt-3 border-t border-slate-800/80 text-center text-[11px] text-slate-400 space-y-1.5">
              <p>
                Don&apos;t have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-cyan-400 hover:underline font-semibold"
                >
                  Register as Student
                </button>
              </p>
              <p className="text-slate-400">
                Are you an event coordinator or administrator?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('admin');
                    setErrorMessage(null);
                  }}
                  className="text-rose-400 hover:underline font-semibold"
                >
                  Switch to Admin Portal
                </button>
              </p>
            </div>
          </form>
        )}

        {/* 2. Admin Portal View: Either Setup First Admin OR Sign In */}
        {mode === 'admin' && (
          <div className="space-y-4 text-xs">
            {needsAdminSetup || adminSetupMode ? (
              /* First-Time Initial Admin Setup Form */
              <form onSubmit={handleAdminSetupSubmit} className="space-y-3.5">
                <div className="p-3 rounded-xl bg-gradient-to-r from-rose-950/60 to-slate-900 border border-rose-800/60 text-[11px] text-rose-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-300">
                    <ShieldCheckIcon className="w-4 h-4 text-rose-400" />
                    <span>First-Time Institutional Setup</span>
                  </div>
                  <p className="leading-relaxed">
                    No administrator account exists in the database. Initialize the first Administrator account below. Once created, public administrator signup will be permanently locked.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Administrator Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Dean of Technology / Faculty Coordinator"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Admin Username <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="admin"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Institutional Email <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@college.edu"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Password (min 8 chars) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Confirm Password <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={adminConfirmPassword}
                      onChange={(e) => setAdminConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-glow-sm flex items-center justify-center gap-2"
                >
                  <ShieldCheckIcon className="w-4 h-4" />
                  {loading ? (
                    <span>Initializing Administrator Account...</span>
                  ) : (
                    <span>Initialize First Administrator &amp; Sign In</span>
                  )}
                </button>
              </form>
            ) : (
              /* Regular Administrator Sign In Form */
              <form onSubmit={(e) => handleLoginSubmit(e, 'admin')} className="space-y-4">
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 text-[11px] text-rose-300 flex items-start gap-2">
                  <ShieldCheckIcon className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Restricted Institutional Console:</strong> Reserved for verified administrators and faculty coordinators. Student accounts are rejected by backend authorization.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Administrator Username or Email <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="admin or admin@college.edu"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 placeholder:text-slate-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Administrator Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 placeholder:text-slate-600 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-glow-sm flex items-center justify-center gap-2"
                >
                  <ShieldCheckIcon className="w-4 h-4" />
                  {loading ? (
                    <span>Verifying Administrator Credentials...</span>
                  ) : (
                    <span>Sign In to Admin Portal</span>
                  )}
                </button>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Initial Admin: <strong className="text-slate-200">admin</strong></span>
                  <span className="font-mono text-cyan-400">SecureAdminPass123</span>
                </div>
              </form>
            )}

            <div className="pt-3 border-t border-slate-800/80 text-center text-[11px] text-slate-400 space-y-1">
              <p>
                Not an administrator?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                  }}
                  className="text-cyan-400 hover:underline font-semibold"
                >
                  Return to Student Login
                </button>
              </p>
            </div>
          </div>
        )}

        {/* 3. Student Registration Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Full Legal Name <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Sanskar Agre"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500 placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Student Roll ID <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. CS-2024-001"
                  className="w-full bg-slate-950 border border-slate-800 text-white font-mono rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500 placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                College Email Address <span className="text-cyan-400">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sanskar@college.edu"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500 placeholder:text-slate-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Department <span className="text-cyan-400">*</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
                >
                  <option value="Computer Science & Engineering">Computer Science &amp; Eng.</option>
                  <option value="Artificial Intelligence & Data Science">AI &amp; Data Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication">Electronics &amp; Comm.</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Course / Degree <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="B.Tech Computer Science"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Academic Year <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="2025 - 2026"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Password (min 8 chars) <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500 placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Confirm Password <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500 placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-glow-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span>Creating Student Account in Database...</span>
              ) : (
                <span>Complete Student Sign Up</span>
              )}
            </button>

            <div className="pt-2 text-center text-[11px] text-slate-400">
              Already have a student account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-cyan-400 hover:underline font-semibold"
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
