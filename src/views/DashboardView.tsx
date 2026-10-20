// src/views/DashboardView.tsx
import React, { useState } from 'react';
import {
  Boxes,
  AlertTriangle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingCart,
  PlusCircle,
  MinusCircle,
  FileText,
  ClipboardList,
  AlertOctagon,
  ExternalLink,
} from 'lucide-react';
import { store } from '../lib/storage';
import { Modal } from '../components/Modal';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  onRefresh: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onRefresh }) => {
  const summary = store.getDashboardSummary();
  const reorderNeeds = store.getReorderNeeds();
  const batchViews = store.getBatchStatusViews();
  const recentMovements = store.getStockMovements().slice(0, 5);
  const products = store.getProducts().filter((p) => p.is_active);

  // Modals state
  const [stockInModalOpen, setStockInModalOpen] = useState(false);
  const [stockOutModalOpen, setStockOutModalOpen] = useState(false);
  const [quickPOModalOpen, setQuickPOModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Form states for Quick Stock In
  const [inProductId, setInProductId] = useState('');
  const [inQty, setInQty] = useState('');
  const [inType, setInType] = useState<'other_in' | 'opening_balance'>('other_in');
  const [inReason, setInReason] = useState('');
  const [inExpiry, setInExpiry] = useState('');
  const [inBatchCode, setInBatchCode] = useState('');
  const [inError, setInError] = useState('');

  // Form states for Quick Stock Out
  const [outProductId, setOutProductId] = useState('');
  const [outQty, setOutQty] = useState('');
  const [outType, setOutType] = useState<'sale' | 'damaged' | 'internal_use' | 'other_out' | 'expired'>('sale');
  const [outReason, setOutReason] = useState('');
  const [outError, setOutError] = useState('');

  const isOwner = store.isOwner();

  // Urgent and expired batches
  const urgentBatches = batchViews.filter(
    (b) => (b.expiry_state === 'urgent' || b.expiry_state === 'expired' || b.expiry_state === 'warning') && b.quantity_on_hand > 0
  );

  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInError('');
    try {
      store.record_stock_in({
        product_id: inProductId,
        quantity: Number(inQty),
        movement_type: inType,
        reason: inReason,
        expiry_date: inExpiry || null,
        batch_code: inBatchCode,
        idempotency_key: 'idem-' + crypto.randomUUID(),
      });
      setStockInModalOpen(false);
      setInProductId('');
      setInQty('');
      setInReason('');
      setInExpiry('');
      setInBatchCode('');
      onRefresh();
    } catch (err: any) {
      setInError(err.message || 'Gagal mencatat barang masuk.');
    }
  };

  const handleStockOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOutError('');
    try {
      store.record_stock_out({
        product_id: outProductId,
        quantity: Number(outQty),
        movement_type: outType,
        reason: outReason,
        idempotency_key: 'idem-' + crypto.randomUUID(),
      });
      setStockOutModalOpen(false);
      setOutProductId('');
      setOutQty('');
      setOutReason('');
      onRefresh();
    } catch (err: any) {
      setOutError(err.message || 'Gagal mencatat barang keluar.');
    }
  };

  const handleQuickPoOpen = (prodId: string) => {
    setSelectedProductId(prodId);
    setQuickPOModalOpen(true);
  };

  const selectedInProduct = products.find((p) => p.id === inProductId);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick Action Bar */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="max-w-xl">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Dashboard Ringkasan Inventaris</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau ketersediaan stok sembako, pergerakan barang, dan antisipasi kedaluwarsa secara tepat waktu.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setStockInModalOpen(true)}
            className="inline-flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Barang Masuk</span>
          </button>
          <button
            onClick={() => setStockOutModalOpen(true)}
            className="inline-flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <MinusCircle className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Barang Keluar</span>
          </button>
          {store.canCreatePO() && (
            <button
              onClick={() => onNavigate('purchasing')}
              className="inline-flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Buat PO</span>
            </button>
          )}
          <button
            onClick={() => onNavigate('opname')}
            className="inline-flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <ClipboardList className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Stock Opname</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Active Products */}
        <div
          onClick={() => onNavigate('products')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Produk Aktif</span>
            <Boxes className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary.active_products}</div>
          <div className="text-[11px] text-slate-500 mt-1">Total item terdaftar</div>
        </div>

        {/* Low Stock */}
        <div
          onClick={() => onNavigate('products')}
          className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 hover:border-amber-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold">Stok Menipis</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-800">{summary.low_stock_count}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">≤ Batas stok minimum</div>
        </div>

        {/* Out of Stock */}
        <div
          onClick={() => onNavigate('products')}
          className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/30 hover:border-rose-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-semibold">Stok Habis</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-800">{summary.out_of_stock_count}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">Saldo tersedia 0</div>
        </div>

        {/* Approaching Expiry */}
        <div
          onClick={() => onNavigate('batches')}
          className="bg-white p-4 rounded-xl border border-amber-200 hover:border-amber-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold">Mendekati Exp</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {summary.warning_expiry_count + summary.urgent_expiry_count}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            {summary.urgent_expiry_count > 0 ? `${summary.urgent_expiry_count} urgent (≤7hr)` : '≤30 hari lagi'}
          </div>
        </div>

        {/* Expired Batches */}
        <div
          onClick={() => onNavigate('batches')}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${
            summary.expired_batch_count > 0
              ? 'bg-rose-100/70 border-rose-300 text-rose-900'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">Kedaluwarsa</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700">{summary.expired_batch_count}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">
            {summary.expired_batch_count > 0 ? 'Wajib dikeluarkan' : 'Tidak ada batch exp'}
          </div>
        </div>

        {/* Today Movements */}
        <div
          onClick={() => onNavigate('movements')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Mutasi Hari Ini</span>
            <FileText className="w-4 h-4 text-slate-700" />
          </div>
          <div className="flex items-baseline space-x-2 text-slate-900">
            <span className="text-sm font-bold text-emerald-600">+{summary.today_in_qty}</span>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-bold text-rose-600">-{summary.today_out_qty}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Masuk / Keluar</div>
        </div>
      </div>

      {/* Main Sections: Reorder Needs & Expiry Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kebutuhan Pengadaan (Reorder Needs) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <span>Daftar Kebutuhan Pengadaan</span>
                  {reorderNeeds.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-300">
                      {reorderNeeds.length} Item
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Produk dengan stok di bawah ambang batas minimum yang perlu dipesan ulang.
                </p>
              </div>
              <button
                onClick={() => onNavigate('purchasing')}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1"
              >
                <span>Lihat PO</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              {reorderNeeds.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  Semua stok produk berada di atas batas minimum. Tidak ada kebutuhan mendesak saat ini.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Produk</th>
                      <th className="py-2.5 px-2">Stok Ada</th>
                      <th className="py-2.5 px-2">Min</th>
                      <th className="py-2.5 px-2 text-rose-600">Kurang</th>
                      <th className="py-2.5 px-2">Dipesan</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reorderNeeds.slice(0, 5).map((item) => (
                      <tr key={item.product_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.sku}</div>
                        </td>
                        <td className="py-2.5 px-2 font-medium">
                          {item.available_qty} {item.unit_name}
                        </td>
                        <td className="py-2.5 px-2 text-slate-500">
                          {item.min_stock} {item.unit_name}
                        </td>
                        <td className="py-2.5 px-2 font-bold text-rose-600">
                          {item.shortfall_qty} {item.unit_name}
                        </td>
                        <td className="py-2.5 px-2">
                          {item.incoming_qty > 0 ? (
                            <span className="text-blue-600 font-medium">+{item.incoming_qty}</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleQuickPoOpen(item.product_id)}
                            className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] border border-emerald-200 transition-colors"
                          >
                            Pesan
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {reorderNeeds.length > 5 && (
            <div className="pt-3 border-t border-slate-100 text-center">
              <button
                onClick={() => onNavigate('products')}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                Lihat {reorderNeeds.length - 5} produk lainnya →
              </button>
            </div>
          )}
        </div>

        {/* Peringatan Kedaluwarsa & Kritis */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <span>Peringatan Kedaluwarsa (FEFO)</span>
                  {urgentBatches.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold border border-rose-300">
                      {urgentBatches.length} Batch
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Batch dengan masa kedaluwarsa mendekati batas atau sudah lewat tanggalnya.
                </p>
              </div>
              <button
                onClick={() => onNavigate('batches')}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1"
              >
                <span>Semua Batch</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              {urgentBatches.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  Tidak ada batch yang mendekati kedaluwarsa atau kedaluwarsa. Kondisi persediaan aman.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Produk & Batch</th>
                      <th className="py-2.5 px-2">Tgl Exp</th>
                      <th className="py-2.5 px-2">Sisa Hari</th>
                      <th className="py-2.5 px-2">Stok</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {urgentBatches.slice(0, 5).map((b) => (
                      <tr key={b.batch_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{b.product_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {b.batch_code || 'Batch Utama'}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-slate-600 font-medium">
                          {b.expiry_date || '-'}
                        </td>
                        <td className="py-2.5 px-2 font-bold">
                          {typeof b.days_to_expiry === 'number' ? (
                            b.days_to_expiry < 0 ? (
                              <span className="text-rose-700">Lewat {Math.abs(b.days_to_expiry)} hr</span>
                            ) : (
                              <span className={b.days_to_expiry <= 7 ? 'text-amber-700' : 'text-slate-700'}>
                                {b.days_to_expiry} hr
                              </span>
                            )
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-2.5 px-2 font-semibold">
                          {b.quantity_on_hand} {b.unit_name}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {b.expiry_state === 'expired' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              Kedaluwarsa
                            </span>
                          ) : b.expiry_state === 'urgent' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-300">
                              Mendesak (≤7h)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              Waspada (≤30h)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {urgentBatches.length > 5 && (
            <div className="pt-3 border-t border-slate-100 text-center">
              <button
                onClick={() => onNavigate('batches')}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                Lihat {urgentBatches.length - 5} batch lainnya →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Stock Movements Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Aktivitas Mutasi Stok Terkini</h2>
            <p className="text-xs text-slate-500 mt-0.5">Transaksi barang masuk dan keluar terbaru yang tercatat di sistem.</p>
          </div>
          <button
            onClick={() => onNavigate('movements')}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1"
          >
            <span>Buku Besar Lengkap</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          {recentMovements.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">Belum ada aktivitas mutasi stok tercatat.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Produk</th>
                  <th className="py-2.5 px-2">Jenis Mutasi</th>
                  <th className="py-2.5 px-2 text-right">Jumlah</th>
                  <th className="py-2.5 px-2 text-right">Saldo Batch</th>
                  <th className="py-2.5 px-3">Alasan / Referensi</th>
                  <th className="py-2.5 px-3">Pelaku</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentMovements.map((m) => {
                  const isPositive = m.quantity_delta > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(m.created_at).toLocaleString('id-ID', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{m.product?.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{m.product?.sku}</div>
                      </td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider inline-flex items-center space-x-1 ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowDownLeft className="w-3 h-3 mr-0.5" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 mr-0.5" />
                          )}
                          <span>{m.movement_type.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td
                        className={`py-2.5 px-2 text-right font-bold font-mono text-sm ${
                          isPositive ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isPositive ? `+${m.quantity_delta}` : m.quantity_delta}
                      </td>
                      <td className="py-2.5 px-2 text-right font-semibold text-slate-700 font-mono">
                        {m.balance_after}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={m.reason || ''}>
                        {m.reason || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {m.creator_profile?.full_name || 'System'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal: Quick Stock In */}
      <Modal
        isOpen={stockInModalOpen}
        onClose={() => setStockInModalOpen(false)}
        title="Catat Barang Masuk"
        subtitle="Mencatat penambahan stok persediaan barang manual atau saldo awal"
      >
        <form onSubmit={handleStockInSubmit} className="space-y-4">
          {inError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
              {inError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Produk *</label>
            <select
              value={inProductId}
              onChange={(e) => setInProductId(e.target.value)}
              required
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="">-- Pilih Produk --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Masuk *</label>
              <select
                value={inType}
                onChange={(e) => setInType(e.target.value as any)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="other_in">Barang Masuk Lainnya (other_in)</option>
                {isOwner && <option value="opening_balance">Saldo Awal (opening_balance)</option>}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kuantitas Masuk *</label>
              <input
                type="number"
                step="any"
                min="0.001"
                value={inQty}
                onChange={(e) => setInQty(e.target.value)}
                placeholder="cth. 10"
                required
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          {selectedInProduct?.track_expiry && (
            <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200/80 space-y-3">
              <div className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>Pengaturan Batch & Kedaluwarsa Produk</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tanggal Kedaluwarsa *</label>
                  <input
                    type="date"
                    value={inExpiry}
                    onChange={(e) => setInExpiry(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kode Batch (Opsional)</label>
                  <input
                    type="text"
                    value={inBatchCode}
                    onChange={(e) => setInBatchCode(e.target.value)}
                    placeholder="cth. BATCH-01"
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alasan Masuk {inType === 'other_in' ? '*' : '(Opsional)'}
            </label>
            <textarea
              rows={2}
              value={inReason}
              onChange={(e) => setInReason(e.target.value)}
              placeholder="Contoh: Pengembalian sisa konsinyasi, bonus supplier, dll."
              required={inType === 'other_in'}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStockInModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              Simpan Mutasi Masuk
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Quick Stock Out */}
      <Modal
        isOpen={stockOutModalOpen}
        onClose={() => setStockOutModalOpen(false)}
        title="Catat Barang Keluar"
        subtitle="Mencatat pengeluaran stok untuk penjualan, rusak, pemakaian internal, dll. Menggunakan algoritma FEFO otomatis."
      >
        <form onSubmit={handleStockOutSubmit} className="space-y-4">
          {outError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
              {outError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Produk *</label>
            <select
              value={outProductId}
              onChange={(e) => setOutProductId(e.target.value)}
              required
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="">-- Pilih Produk --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Keluar *</label>
              <select
                value={outType}
                onChange={(e) => setOutType(e.target.value as any)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="sale">Penjualan (sale)</option>
                <option value="damaged">Barang Rusak (damaged)</option>
                <option value="internal_use">Pemakaian Internal (internal_use)</option>
                <option value="expired">Barang Kedaluwarsa (expired)</option>
                <option value="other_out">Lainnya (other_out - wajib alasan)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kuantitas Keluar *</label>
              <input
                type="number"
                step="any"
                min="0.001"
                value={outQty}
                onChange={(e) => setOutQty(e.target.value)}
                placeholder="cth. 3"
                required
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keterangan / Alasan {outType === 'other_out' ? '*' : '(Opsional)'}
            </label>
            <textarea
              rows={2}
              value={outReason}
              onChange={(e) => setOutReason(e.target.value)}
              placeholder="Contoh: Terjual ke langganan warung, kemasan robek, dipakai karyawan, dll."
              required={outType === 'other_out'}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 flex items-start space-x-2">
            <span className="font-bold text-slate-700">Catatan FEFO:</span>
            <span>
              Sistem akan memotong otomatis batch dengan masa kedaluwarsa terdekat. Validasi stok mencegah saldo menjadi negatif.
            </span>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStockOutModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              Simpan Mutasi Keluar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Quick PO Action */}
      <Modal
        isOpen={quickPOModalOpen}
        onClose={() => setQuickPOModalOpen(false)}
        title="Buat Pesanan Pembelian Cepat"
        subtitle="Buat PO untuk produk yang kekurangan stok"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            {selectedProductId && products.find((p) => p.id === selectedProductId)
              ? `Pengadaan untuk produk: ${products.find((p) => p.id === selectedProductId)?.name}. `
              : ''}
            Silakan buka modul <strong>Pengadaan & PO</strong> untuk memilih pemasok dan mengatur jumlah pesanan secara terinci.
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setQuickPOModalOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Tutup
            </button>
            <button
              onClick={() => {
                setQuickPOModalOpen(false);
                onNavigate('purchasing');
              }}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
            >
              Buka Halaman Pengadaan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
