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
  };

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar onNavigate={handleNavigate} onLogout={handleLogout} />

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar currentView={currentView} onNavigate={handleNavigate} />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {currentView === 'dashboard' && (
            <DashboardView key={refreshTrigger} onNavigate={handleNavigate} onRefresh={handleRefresh} />
          )}
          {currentView === 'products' && (
            <ProductsView key={refreshTrigger} onRefresh={handleRefresh} />
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
