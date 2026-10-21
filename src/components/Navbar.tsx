// src/components/Navbar.tsx
import React from 'react';
import {
  AlertTriangle,
  Clock,
  Shield,
  User,
  Menu,
} from 'lucide-react';
import { store } from '../lib/storage';

interface NavbarProps {
  onNavigate: (view: string) => void;
  onOpenMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, onOpenMobileSidebar }) => {
  const business = store.getBusiness();
  const activeUser = store.getActiveUser();
  const activeMember = store.getActiveMember();
  const dashboardSummary = store.getDashboardSummary();

  const totalExpiryAlerts = dashboardSummary.warning_expiry_count + dashboardSummary.urgent_expiry_count;

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Buka Menu Navigasi"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer min-w-0"
            onClick={() => onNavigate('dashboard')}
          >
            <img
              src="/images/icon.png"
              alt="SIMETRIS Logo"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain shadow-md shadow-emerald-950/40 border border-emerald-500/20 bg-slate-800 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold tracking-tight text-base sm:text-lg text-white">SIMETRIS</span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate max-w-[130px] sm:max-w-xs">
                {business.name}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Alerts & User Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Expiry alerts badge */}
          {totalExpiryAlerts > 0 && (
            <button
              onClick={() => onNavigate('batches')}
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/80 hover:bg-amber-900 transition-colors cursor-pointer"
              title="Periksa barang mendekati kedaluwarsa"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{totalExpiryAlerts} Mendekati Exp</span>
            </button>
          )}

          {/* Expired alert */}
          {dashboardSummary.expired_batch_count > 0 && (
            <button
              onClick={() => onNavigate('batches')}
              className="flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-rose-950/90 text-rose-300 border border-rose-800 hover:bg-rose-900 animate-pulse transition-colors cursor-pointer"
              title="Ada barang kedaluwarsa yang masih bersaldo!"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{dashboardSummary.expired_batch_count} Exp</span>
            </button>
          )}

          {/* User Profile Badge (Logout is now placed in sidebar under settings) */}
          <div className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                activeMember.role === 'owner' ? 'bg-amber-500 text-slate-900' : 'bg-emerald-500 text-white'
              }`}
            >
              {activeMember.role === 'owner' ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-slate-200 leading-tight">{activeUser.full_name}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                {activeMember.role === 'owner' ? 'Owner' : 'Staff'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
