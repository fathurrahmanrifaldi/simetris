// src/components/Sidebar.tsx
import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  CalendarClock,
  ShoppingCart,
  ClipboardCheck,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
  X,
  Shield,
  User,
} from 'lucide-react';
import { store } from '../lib/storage';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  isMobileDrawer?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onLogout,
  isMobileDrawer = false,
  onCloseMobile,
}) => {
  const isOwner = store.isOwner();
  const canProducts = store.canManageProducts();
  const canPurchasing = isOwner || store.canManageSuppliers() || store.canCreatePO() || store.canConfirmReceipt();
  const summary = store.getDashboardSummary();
  const activeUser = store.getActiveUser();
  const activeMember = store.getActiveMember();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: summary.low_stock_count > 0 ? `${summary.low_stock_count} kritis` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    ...(canProducts
      ? [
          {
            id: 'products',
            label: 'Produk & Satuan',
            icon: Boxes,
            badge: summary.out_of_stock_count > 0 ? `${summary.out_of_stock_count} habis` : undefined,
            badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
          },
        ]
      : []),
    {
      id: 'movements',
      label: 'Mutasi Stok',
      icon: ArrowLeftRight,
    },
    {
      id: 'batches',
      label: 'Batch & Kedaluwarsa',
      icon: CalendarClock,
      badge: summary.expired_batch_count > 0 ? `${summary.expired_batch_count} exp` : undefined,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    },
    ...(canPurchasing
      ? [
          {
            id: 'purchasing',
            label: 'Pengadaan & PO',
            icon: ShoppingCart,
            badge: summary.pending_po_count > 0 ? `${summary.pending_po_count} dipesan` : undefined,
            badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
          },
        ]
      : []),
    {
      id: 'opname',
      label: 'Stock Opname',
      icon: ClipboardCheck,
      badge: summary.pending_adjustments_count > 0 ? `${summary.pending_adjustments_count} review` : undefined,
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    },
    {
      id: 'reports',
      label: 'Laporan & CSV',
      icon: BarChart3,
    },
    ...(isOwner
      ? [
          {
            id: 'audit',
            label: 'Audit Log',
            icon: ShieldCheck,
            ownerOnly: true,
          },
          {
            id: 'settings',
            label: 'Pengaturan',
            icon: Settings,
          },
        ]
      : []),
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleLogoutClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
    onLogout();
  };

  return (
    <aside
      className={`bg-white select-none flex flex-col justify-between h-full ${
        isMobileDrawer
          ? 'w-full py-4'
          : 'w-64 border-r border-slate-200 shrink-0 min-h-[calc(100vh-4rem)] py-4'
      }`}
    >
      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        {/* Mobile drawer header */}
        {isMobileDrawer && (
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 px-1">
            <div className="flex items-center space-x-2.5">
              <img
                src="/images/icon.png"
                alt="SIMETRIS Logo"
                className="w-8 h-8 rounded-lg object-contain bg-slate-900 border border-emerald-500/20"
              />
              <div>
                <span className="font-extrabold text-sm tracking-tight text-slate-900 block">SIMETRIS</span>
                <span className="text-[10px] text-slate-500">{activeUser.full_name}</span>
              </div>
            </div>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* User profile card inside mobile drawer */}
        {isMobileDrawer && (
          <div className="mb-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center space-x-2.5">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                activeMember.role === 'owner' ? 'bg-amber-500 text-slate-900' : 'bg-emerald-500 text-white'
              }`}
            >
              {activeMember.role === 'owner' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 truncate">{activeUser.full_name}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                {activeMember.role === 'owner' ? 'Owner (Akses Penuh)' : 'Staff Operasional'}
              </div>
            </div>
          </div>
        )}

        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Menu Utama
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs font-semibold'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                    isActive ? 'bg-slate-800 text-slate-200 border-slate-700' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tombol Keluar (Di bawah menu pengaturan) */}
      <div className="px-3 pt-3 mt-auto border-t border-slate-200">
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer group"
          title="Keluar dari akun SIMETRIS"
        >
          <LogOut className="w-4 h-4 text-rose-500 group-hover:text-rose-600 shrink-0 transition-colors" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
};
