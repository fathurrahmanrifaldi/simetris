// src/components/Navbar.tsx
import React from 'react';
import {
  Package,
  AlertTriangle,
  Clock,
  Shield,
  User,
  LogOut,
} from 'lucide-react';
import { store } from '../lib/storage';

interface NavbarProps {
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, onLogout }) => {
  const business = store.getBusiness();
  const activeUser = store.getActiveUser();
  const activeMember = store.getActiveMember();
  const dashboardSummary = store.getDashboardSummary();

  const totalExpiryAlerts = dashboardSummary.warning_expiry_count + dashboardSummary.urgent_expiry_count;

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-900/30">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-tight text-lg text-white">SIMETRIS</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                Sembako
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium truncate max-w-[200px] sm:max-w-xs">{business.name}</p>
          </div>
        </div>

        {/* Status alerts & User profile / Logout */}
        <div className="flex items-center space-x-3">
          {/* Expiry alerts badge */}
          {totalExpiryAlerts > 0 && (
            <button
              onClick={() => onNavigate('batches')}
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/80 hover:bg-amber-900 transition-colors"
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
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/90 text-rose-300 border border-rose-800 hover:bg-rose-900 animate-pulse transition-colors"
              title="Ada barang kedaluwarsa yang masih bersaldo!"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{dashboardSummary.expired_batch_count} Kedaluwarsa</span>
            </button>
          )}

          {/* User Profile Badge & Logout Button */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  activeMember.role === 'owner' ? 'bg-amber-500 text-slate-900' : 'bg-emerald-500 text-white'
                }`}
              >
                {activeMember.role === 'owner' ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-slate-200 leading-tight">{activeUser.full_name}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                  {activeMember.role === 'owner' ? 'Owner' : 'Staff'}
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/70 hover:border-rose-800 hover:text-rose-300 border border-slate-700 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
              title="Keluar dari akun"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
