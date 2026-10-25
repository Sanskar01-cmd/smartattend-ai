import { useState, useEffect, useCallback } from 'react';
import {
  NavigationTab,
  BackendHealthResponse,
  AuthUser,
  ApiStudentProfile,
  AuthResponse,
  PanelType,
} from './types';
import { Navbar } from './components/Navbar';
import { StudentSidebar } from './components/StudentSidebar';
import { AdminSidebar } from './components/AdminSidebar';
import { Footer } from './components/Footer';

// Student Panel Views
import { DashboardView } from './views/DashboardView';
import { EventsView } from './views/EventsView';
import { MyPassesView } from './views/MyPassesView';
import { AttendanceHistoryView } from './views/AttendanceHistoryView';
import { StudentCertificatesView } from './views/StudentCertificatesView';
import { DigitalProfileView } from './views/DigitalProfileView';
import { AIAssistantView } from './views/AIAssistantView';

// Admin Panel Views
import { AdminDashboardView } from './views/AdminDashboardView';
import { AdminEventsView } from './views/AdminEventsView';
import { AdminStudentsView } from './views/AdminStudentsView';
import { AdminRegistrationsView } from './views/AdminRegistrationsView';
import { AdminQRScannerView } from './views/AdminQRScannerView';
import { AdminReportsView } from './views/AdminReportsView';
import { AdminCertificatesView } from './views/AdminCertificatesView';
import { AdminSettingsView } from './views/AdminSettingsView';

// Auth
import { AuthView } from './views/AuthView';
import { checkBackendHealth, getStoredToken, getProfileApi, logoutApi } from './services/api';
import { ShieldCheckIcon, AlertIcon } from './components/Icons';

export function App() {
  const [currentPanel, setCurrentPanel] = useState<PanelType>('student');
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [_backendHealth, setBackendHealth] = useState<BackendHealthResponse | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [checkingBackend, setCheckingBackend] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [studentProfile, setStudentProfile] = useState<ApiStudentProfile | null>(null);
  const [authDefaultMode, setAuthDefaultMode] = useState<'login' | 'register' | 'admin'>('login');

  const isAdmin = currentUser?.role === 'admin' || currentUser?.is_staff || currentUser?.is_superuser;

  // Restore authenticated session from token on mount
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      getProfileApi()
        .then((data) => {
          if (data.user) {
            setCurrentUser(data.user);
            if (data.user.role === 'admin' || data.user.is_staff || data.user.is_superuser) {
              setCurrentPanel('admin');
              setActiveTab('admin-dashboard');
            }
          }
          if (data.profile) {
            setStudentProfile(data.profile);
            if (!data.user) {
              setCurrentUser({
                id: data.profile.id,
                username: data.profile.student_id,
                email: data.profile.email,
                role: 'student',
                first_name: data.profile.full_name.split(' ')[0] || '',
                last_name: data.profile.full_name.split(' ').slice(1).join(' ') || '',
                is_verified: true,
              });
            }
          }
        })
        .catch(() => {
          setCurrentUser(null);
          setStudentProfile(null);
        });
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    setCheckingBackend(true);
    const result = await checkBackendHealth();
    setBackendOnline(result.online);
    if (result.online && result.data) {
      setBackendHealth(result.data);
    }
    setCheckingBackend(false);
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const handleOpenAuth = (defaultMode: 'login' | 'register' | 'admin' = 'login') => {
    setAuthDefaultMode(defaultMode);
    setActiveTab('auth');
  };

  const handleAuthSuccess = (authData: AuthResponse) => {
    setCurrentUser(authData.user);
    if (authData.profile) {
      setStudentProfile(authData.profile);
    }

    const isUserAdmin =
      authData.role === 'admin' ||
      authData.user?.role === 'admin' ||
      authData.user?.is_staff ||
      authData.user?.is_superuser;

    if (isUserAdmin) {
      setCurrentPanel('admin');
      setActiveTab('admin-dashboard');
    } else {
      setCurrentPanel('student');
      setActiveTab('dashboard');
    }
  };

  const handleLogout = async () => {
    await logoutApi();
    setCurrentUser(null);
    setStudentProfile(null);
    setCurrentPanel('student');
    setActiveTab('dashboard');
  };

  const handleProfileUpdated = (freshProfile: ApiStudentProfile) => {
    setStudentProfile(freshProfile);
    if (currentUser) {
      const parts = freshProfile.full_name.split(' ');
      setCurrentUser({
        ...currentUser,
        first_name: parts[0] || currentUser.first_name,
        last_name: parts.slice(1).join(' ') || currentUser.last_name,
      });
    }
  };

  const handleSwitchPanel = (targetPanel: PanelType) => {
    if (targetPanel === 'admin') {
      setCurrentPanel('admin');
      if (!isAdmin) {
        // Show role gate or login
        setActiveTab('admin-dashboard');
      } else {
        setActiveTab('admin-dashboard');
      }
    } else {
      setCurrentPanel('student');
      setActiveTab('dashboard');
    }
  };

  const renderActiveView = () => {
    // 1. Auth View
    if (activeTab === 'auth') {
      return (
        <AuthView
          defaultMode={authDefaultMode}
          onAuthSuccess={handleAuthSuccess}
          onCancel={() => {
            if (currentPanel === 'admin') {
              setActiveTab('admin-dashboard');
            } else {
              setActiveTab('dashboard');
            }
          }}
        />
      );
    }

    // 2. Admin Panel Section
    if (currentPanel === 'admin') {
      if (!isAdmin) {
        return (
          <div className="max-w-xl mx-auto py-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-400 mx-auto flex items-center justify-center">
              <AlertIcon className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Access Denied: Administrator Privileges Required
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              This institutional panel is protected by backend role-based access control.
              Student accounts and unauthenticated visitors cannot access administrative modules.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => handleSwitchPanel('student')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Return to Student Portal
              </button>
              <button
                onClick={() => handleOpenAuth('admin')}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <ShieldCheckIcon className="w-4 h-4" />
                <span>Admin Sign In</span>
              </button>
            </div>
          </div>
        );
      }

      switch (activeTab) {
        case 'admin-dashboard':
          return (
            <AdminDashboardView
              currentUser={currentUser}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          );
        case 'admin-events':
          return <AdminEventsView />;
        case 'admin-students':
          return <AdminStudentsView />;
        case 'admin-registrations':
          return <AdminRegistrationsView />;
        case 'admin-scanner':
          return <AdminQRScannerView />;
        case 'admin-reports':
          return <AdminReportsView />;
        case 'admin-certificates':
          return <AdminCertificatesView />;
        case 'admin-settings':
          return <AdminSettingsView />;
        default:
          return (
            <AdminDashboardView
              currentUser={currentUser}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          );
      }
    }

    // 3. Student Panel Section
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={(tab) => setActiveTab(tab)}
            currentUser={currentUser}
            profile={studentProfile}
            onRequireLogin={() => handleOpenAuth('login')}
          />
        );
      case 'events':
        return (
          <EventsView
            onNavigate={(tab) => setActiveTab(tab)}
            currentUser={currentUser}
            onRequireLogin={() => handleOpenAuth('login')}
          />
        );
      case 'passes':
        return <MyPassesView onRequireLogin={() => handleOpenAuth('login')} />;
      case 'attendance':
        return <AttendanceHistoryView onRequireLogin={() => handleOpenAuth('login')} />;
      case 'certificates':
        return <StudentCertificatesView onRequireLogin={() => handleOpenAuth('login')} />;
      case 'profile':
        return (
          <DigitalProfileView
            currentUser={currentUser}
            profile={studentProfile}
            onProfileUpdated={handleProfileUpdated}
            onRequireLogin={() => handleOpenAuth('login')}
          />
        );
      case 'assistant':
        return <AIAssistantView />;
      default:
        return (
          <DashboardView
            onNavigate={(tab) => setActiveTab(tab)}
            currentUser={currentUser}
            profile={studentProfile}
            onRequireLogin={() => handleOpenAuth('login')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans selection:bg-brand-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        backendOnline={backendOnline}
        checkingBackend={checkingBackend}
        onRefreshHealth={fetchHealth}
        currentUser={currentUser}
        profile={studentProfile}
        currentPanel={currentPanel}
        onSwitchPanel={handleSwitchPanel}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onNavigate={(tab) => setActiveTab(tab)}
      />

      {/* Main Layout Body: Panel-Specific Sidebar + Dynamic View Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {currentPanel === 'admin' ? (
          <AdminSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            currentUser={currentUser}
            onOpenAuth={handleOpenAuth}
            onLogout={handleLogout}
            onSwitchToStudent={() => handleSwitchPanel('student')}
          />
        ) : (
          <StudentSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            currentUser={currentUser}
            onOpenAuth={handleOpenAuth}
            onLogout={handleLogout}
            onSwitchToAdmin={() => handleSwitchPanel('admin')}
          />
        )}

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
          {renderActiveView()}
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
