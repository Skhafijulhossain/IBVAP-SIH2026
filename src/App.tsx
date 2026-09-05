import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/layout/Header';
import { Sidebar, ActivePage } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { CameraManagementPage } from './pages/CameraManagementPage';
import { AlertsPage } from './pages/AlertsPage';
import { EventHistoryPage } from './pages/EventHistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { IncidentModal } from './components/alerts/IncidentModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Menu, X, ShieldAlert, Bell, ChevronRight } from 'lucide-react';

const AppContent: React.FC = () => {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const { selectedAlert, setSelectedAlert, activeToastAlert, dismissToastAlert } = useApp();

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
      case 'settings':
        return <SettingsPage />;
      case 'login':
        return <LoginPage onSuccess={() => setActivePage('dashboard')} />;
      default:
        return <DashboardPage onNavigate={(p) => setActivePage(p)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black font-sans">
      {/* Top Header */}
      <Header />

      {/* Main Layout Body */}
      <div className="flex-1 flex flex-row relative">
        {/* Mobile Navigation Toggle Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden fixed bottom-4 right-4 z-50 p-3 rounded-full bg-sky-600 text-white shadow-2xl border border-sky-400/40"
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

      {/* Live Red Alert Notification Toast (Responsive on Mobile & Desktop) */}
      {activeToastAlert && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-bounce">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/95 via-red-900/90 to-black/95 border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.8)] backdrop-blur-xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-red-600 text-white shadow-lg animate-pulse shrink-0 mt-0.5">
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
                    className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow flex items-center gap-1"
                  >
                    <span>Inspect Threat</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={dismissToastAlert}
                    className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={dismissToastAlert}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              title="Close Notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Global Incident Evidence Modal if an alert is selected */}
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
