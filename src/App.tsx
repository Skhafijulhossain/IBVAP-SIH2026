import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/layout/Header';
import { Sidebar, ActivePage } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { CameraManagementPage } from './pages/CameraManagementPage';
import { AlertsPage } from './pages/AlertsPage';
import { EventHistoryPage } from './pages/EventHistoryPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { IncidentModal } from './components/alerts/IncidentModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Menu, X, ShieldAlert, ChevronRight, Shield } from 'lucide-react';

const AppContent: React.FC = () => {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const { selectedAlert, setSelectedAlert, activeToastAlert, dismissToastAlert } = useApp();
  const { isAuthenticated, isLoading } = useAuth();

  // Loading state during token/session verification
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-600 via-blue-700 to-cyan-500 shadow-xl border border-sky-400/40">
            <Shield className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold tracking-wider text-[var(--text)] font-mono uppercase">
              IBVAP DEFENSE SECURITY SYSTEM
            </h2>
            <p className="text-xs text-[var(--muted)]">Verifying Operator Clearance & Token Session...</p>
          </div>
          <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-sky-500 to-emerald-400 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Route Protection: Unauthenticated users are strictly kept on the authentication portal
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col selection:bg-sky-500 selection:text-white font-sans transition-colors duration-200">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4 lg:p-6">
          {authMode === 'signin' ? (
            <SignInPage
              onNavigateToSignUp={() => setAuthMode('signup')}
              onSuccess={() => {
                setActivePage('dashboard');
              }}
            />
          ) : (
            <SignUpPage
              onNavigateToSignIn={() => setAuthMode('signin')}
              onSuccess={() => {
                setAuthMode('signin');
                setActivePage('dashboard');
              }}
            />
          )}
        </main>
      </div>
    );
  }

  const renderCurrentPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage onNavigate={(p) => setActivePage(p)} />;
      case 'monitoring':
        return <LiveMonitoringPage />;
      case 'cameras':
        return <CameraManagementPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'events':
        return <EventHistoryPage />;
      case 'login':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div>
                <h2 className="text-lg font-black text-[var(--text)]">Operator Clearance Portal</h2>
                <p className="text-xs text-[var(--muted)]">Manage security authorization or switch tactical profile</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAuthMode('signin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    authMode === 'signin'
                      ? 'bg-sky-600 text-white'
                      : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border)]'
                  }`}
                >
                  Sign In View
                </button>
                <button
                  onClick={() => setAuthMode('signup')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    authMode === 'signup'
                      ? 'bg-sky-600 text-white'
                      : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border)]'
                  }`}
                >
                  Sign Up View
                </button>
              </div>
            </div>
            {authMode === 'signin' ? (
              <SignInPage
                onNavigateToSignUp={() => setAuthMode('signup')}
                onSuccess={() => setActivePage('dashboard')}
              />
            ) : (
              <SignUpPage
                onNavigateToSignIn={() => setAuthMode('signin')}
                onSuccess={() => {
                  setAuthMode('signin');
                  setActivePage('dashboard');
                }}
              />
            )}
          </div>
        );
      default:
        return <DashboardPage onNavigate={(p) => setActivePage(p)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col selection:bg-sky-500 selection:text-white font-sans transition-colors duration-200">
      {/* Top Header */}
      <Header />

      {/* Main Layout Body */}
      <div className="flex-1 flex flex-row relative">
        {/* Mobile Navigation Toggle Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden fixed bottom-4 right-4 z-50 p-3 rounded-full bg-sky-600 text-white shadow-xl border border-sky-400/30 hover:bg-sky-500 transition-colors cursor-pointer"
          title="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Sidebar */}
        <Sidebar
          activePage={activePage}
          onSelectPage={(p) => setActivePage(p)}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full overflow-x-hidden">
          {renderCurrentPage()}
        </main>
      </div>

      {/* Live Red Alert Notification Toast */}
      {activeToastAlert && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-bounce">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/95 via-red-900/90 to-black/95 border border-red-500/80 shadow-xl backdrop-blur-xl flex items-start justify-between gap-3 text-white">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-red-600 text-white shadow-md animate-pulse shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-red-300">
                    CRITICAL THREAT DETECTED
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-red-500 text-black font-mono font-black text-[10px]">
                    {activeToastAlert.id}
                  </span>
                </div>
                <div className="text-xs font-bold text-white mt-0.5 truncate">
                  {activeToastAlert.cameraName} • {activeToastAlert.sector}
                </div>
                <p className="text-[11px] text-red-100/90 mt-1 line-clamp-2 leading-tight">
                  {activeToastAlert.description}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedAlert(activeToastAlert);
                      dismissToastAlert();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow flex items-center gap-1 cursor-pointer"
                  >
                    <span>Inspect Threat</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={dismissToastAlert}
                    className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={dismissToastAlert}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Global Incident Evidence Modal */}
      {selectedAlert && (
        <IncidentModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
