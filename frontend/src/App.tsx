import React, { useState } from 'react';
import { Toaster } from 'sonner';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AlertsPage } from './pages/AlertsPage';
import { TrendsPage } from './pages/TrendsPage';
import { SettingsPage } from './pages/SettingsPage';

const MainShell: React.FC = () => {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // If not logged in, show Login page
  if (!currentUser) {
    return <LoginPage onSuccess={() => setActiveTab('dashboard')} />;
  }

  return (
    <div className="aqua-ambient-bg relative min-h-screen flex flex-col transition-colors duration-500">
      {/* Pure SVG/CSS Caustic Light Overlay */}
      <div className="aqua-caustic-overlay" aria-hidden="true" />

      {/* Top Navigation Bar */}
      <Navbar
        onToggleSidebar={() => setIsMobileSidebarOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Layout Body with Sidebar + Main Content */}
      <div className="relative z-10 flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardPage />}
          {activeTab === 'alerts' && <AlertsPage />}
          {activeTab === 'trends' && <TrendsPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <Toaster position="top-right" richColors closeButton />
      <MainShell />
    </AppProvider>
  );
}

export default App;
