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
} from 'lucide-react';
import { store } from '../lib/storage';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const isOwner = store.isOwner();
  const canProducts = store.canManageProducts();
  const canPurchasing = isOwner || store.canManageSuppliers() || store.canCreatePO() || store.canConfirmReceipt();
  const summary = store.getDashboardSummary();

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

  return (
    <aside className="w-64 bg-white border-r border-slate-200 shrink-0 min-h-[calc(100vh-4rem)] flex flex-col justify-between py-4 select-none">
      <div className="px-3 space-y-1">
        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Menu Utama
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
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

      {/* Info card at bottom */}
      <div className="px-4 py-3 mx-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
        <div className="font-semibold text-slate-800 flex items-center justify-between">
          <span>FEFO Engine</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 leading-snug">
          Otomatis memprioritaskan stok dengan kedaluwarsa terdekat untuk melindungi profit toko.
        </p>
      </div>
    </aside>
  );
};
