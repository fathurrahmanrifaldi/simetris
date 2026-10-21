// src/App.tsx
import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { ProductsView } from './views/ProductsView';
import { StockMovementsView } from './views/StockMovementsView';
import { BatchesView } from './views/BatchesView';
import { PurchasingView } from './views/PurchasingView';
import { StockOpnameView } from './views/StockOpnameView';
import { ReportsView } from './views/ReportsView';
import { AuditLogView } from './views/AuditLogView';
import { SettingsView } from './views/SettingsView';
import { store } from './lib/storage';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => store.isAuthenticated());
  const [currentView, setCurrentView] = useState('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const checkViewPermission = (view: string): boolean => {
    if (view === 'products' && !store.canManageProducts()) return false;
    if (
      view === 'purchasing' &&
      !(store.isOwner() || store.canManageSuppliers() || store.canCreatePO() || store.canConfirmReceipt())
    )
      return false;
    if (view === 'audit' && !store.isOwner()) return false;
    if (view === 'settings' && !store.isOwner()) return false;
    return true;
  };

  const handleNavigate = (view: string) => {
    if (checkViewPermission(view)) {
      setCurrentView(view);
    } else {
      setCurrentView('dashboard');
    }
  };

  // Ensure currentView remains valid if user permissions change
  useEffect(() => {
    if (isAuthenticated && !checkViewPermission(currentView)) {
      setCurrentView('dashboard');
    }
  }, [isAuthenticated, refreshTrigger, currentView]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentView('dashboard');
    handleRefresh();
  };

  const handleLogout = async () => {
    await store.logout();
    setIsAuthenticated(false);
    setCurrentView('dashboard');
    setMobileSidebarOpen(false);
  };

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation Bar with Mobile Drawer Toggle */}
      <Navbar
        onNavigate={handleNavigate}
        onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
      />

      {/* Mobile & Tablet Drawer Modal */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative max-w-xs w-full bg-white shadow-2xl z-50 flex flex-col h-full animate-in slide-in-from-left duration-200">
            <Sidebar
              currentView={currentView}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
              isMobileDrawer={true}
              onCloseMobile={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar (hidden on mobile and tablet) */}
        <div className="hidden lg:flex shrink-0">
          <Sidebar
            currentView={currentView}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-5 lg:p-8 min-w-0 overflow-y-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              key={refreshTrigger}
              onNavigate={handleNavigate}
              onRefresh={handleRefresh}
            />
          )}
          {currentView === 'products' && (
            <ProductsView
              key={refreshTrigger}
              onRefresh={handleRefresh}
            />
          )}
          {currentView === 'movements' && (
            <StockMovementsView key={refreshTrigger} onRefresh={handleRefresh} />
          )}
          {currentView === 'batches' && (
            <BatchesView key={refreshTrigger} onRefresh={handleRefresh} />
          )}
          {currentView === 'purchasing' && (
            <PurchasingView key={refreshTrigger} onRefresh={handleRefresh} />
          )}
          {currentView === 'opname' && (
            <StockOpnameView key={refreshTrigger} onRefresh={handleRefresh} />
          )}
          {currentView === 'reports' && (
            <ReportsView key={refreshTrigger} />
          )}
          {currentView === 'audit' && (
            <AuditLogView key={refreshTrigger} />
          )}
          {currentView === 'settings' && (
            <SettingsView key={refreshTrigger} onRefresh={handleRefresh} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
