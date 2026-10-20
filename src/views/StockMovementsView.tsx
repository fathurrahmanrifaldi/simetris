// src/views/StockMovementsView.tsx
import React, { useState } from 'react';
import {
  ArrowLeftRight,
  PlusCircle,
  MinusCircle,
  Download,
  RotateCcw,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Clock,
} from 'lucide-react';
import { store, exportToCsv } from '../lib/storage';
import { Modal } from '../components/Modal';
import type { MovementType } from '../types/database';

interface StockMovementsViewProps {
  onRefresh: () => void;
}

export const StockMovementsView: React.FC<StockMovementsViewProps> = ({ onRefresh }) => {
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modals
  const [stockInModalOpen, setStockInModalOpen] = useState(false);
  const [stockOutModalOpen, setStockOutModalOpen] = useState(false);
  const [reversalModalOpen, setReversalModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [reversalReason, setReversalReason] = useState<string>('');
  const [reversalError, setReversalError] = useState<string>('');

  // Form states for In
  const [inProductId, setInProductId] = useState('');
  const [inQty, setInQty] = useState('');
  const [inType, setInType] = useState<'other_in' | 'opening_balance'>('other_in');
  const [inReason, setInReason] = useState('');
  const [inExpiry, setInExpiry] = useState('');
  const [inBatchCode, setInBatchCode] = useState('');
  const [inError, setInError] = useState('');

  // Form states for Out
  const [outProductId, setOutProductId] = useState('');
  const [outQty, setOutQty] = useState('');
  const [outType, setOutType] = useState<'sale' | 'damaged' | 'internal_use' | 'other_out' | 'expired'>('sale');
  const [outReason, setOutReason] = useState('');
  const [outError, setOutError] = useState('');

  const isOwner = store.isOwner();
  const products = store.getProducts().filter((p) => p.is_active);
  const movements = store.getStockMovements();

  // Filter logic
  const filteredMovements = movements.filter((m) => {
    if (selectedProduct !== 'all' && m.product_id !== selectedProduct) return false;
    if (selectedType !== 'all' && m.movement_type !== selectedType) return false;
    if (startDate && m.created_at.split('T')[0] < startDate) return false;
    if (endDate && m.created_at.split('T')[0] > endDate) return false;
    return true;
  });

  // Calculate summary metrics
  const totalIn = filteredMovements.reduce((sum, m) => (m.quantity_delta > 0 ? sum + m.quantity_delta : sum), 0);
  const totalOut = filteredMovements.reduce((sum, m) => (m.quantity_delta < 0 ? sum + Math.abs(m.quantity_delta) : sum), 0);

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
      setInError(err.message || 'Gagal mencatat mutasi masuk.');
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
      setOutError(err.message || 'Gagal mencatat mutasi keluar.');
    }
  };

  const openReversalModal = (groupId: string) => {
    setSelectedGroupId(groupId);
    setReversalReason('');
    setReversalError('');
    setReversalModalOpen(true);
  };

  const handleReversalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReversalError('');
    try {
      store.reverse_stock_transaction(selectedGroupId, reversalReason);
      setReversalModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setReversalError(err.message || 'Gagal membalikkan transaksi.');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Waktu',
      'SKU',
      'Nama Produk',
      'Batch Code',
      'Tgl Kedaluwarsa',
      'Jenis Mutasi',
      'Perubahan (Delta)',
      'Saldo Batch Sesudahnya',
      'Alasan / Referensi',
      'Pelaku',
      'ID Grup Transaksi',
    ];
    const rows = filteredMovements.map((m) => [
      m.created_at,
      m.product?.sku || '-',
      m.product?.name || '-',
      m.batch?.batch_code || 'Default',
      m.batch?.expiry_date || '-',
      m.movement_type,
      m.quantity_delta,
      m.balance_after,
      m.reason || '-',
      m.creator_profile?.full_name || 'System',
      m.group_id,
    ]);
    exportToCsv('Buku_Besar_Mutasi_Stok', headers, rows);
  };

  const selectedInProduct = products.find((p) => p.id === inProductId);

  const getMovementLabel = (type: MovementType) => {
    const map: Record<MovementType, { label: string; color: string }> = {
      opening_balance: { label: 'Saldo Awal', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      purchase_receipt: { label: 'Penerimaan PO', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      other_in: { label: 'Masuk Lainnya', color: 'bg-teal-50 text-teal-700 border-teal-200' },
      adjustment_in: { label: 'Koreksi (+)', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      sale: { label: 'Penjualan', color: 'bg-slate-100 text-slate-800 border-slate-300' },
      damaged: { label: 'Barang Rusak', color: 'bg-rose-50 text-rose-700 border-rose-200' },
      expired: { label: 'Kedaluwarsa', color: 'bg-rose-100 text-rose-800 border-rose-300' },
      internal_use: { label: 'Pakai Sendiri', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      other_out: { label: 'Keluar Lainnya', color: 'bg-orange-50 text-orange-700 border-orange-200' },
      adjustment_out: { label: 'Koreksi (-)', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      reversal: { label: 'Pembalikan', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    };
    return map[type] || { label: type, color: 'bg-slate-100 text-slate-700' };
  };

  return (
    <div className="space-y-5">
      {/* Header and Actions */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Buku Besar Mutasi Stok</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
              Append-Only Ledger
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Setiap perubahan stok tercatat permanen dengan alasan, kuantitas, pelaku, dan saldo sesudahnya.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600 shrink-0" />
            <span className="whitespace-nowrap">Ekspor CSV</span>
          </button>
          <button
            onClick={() => setStockInModalOpen(true)}
            className="inline-flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Catat Barang Masuk</span>
          </button>
          <button
            onClick={() => setStockOutModalOpen(true)}
            className="inline-flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <MinusCircle className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Catat Barang Keluar</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500">Total Masuk (Filter)</span>
            <div className="text-xl font-bold text-emerald-600 font-mono mt-0.5">+{totalIn.toLocaleString('id-ID')}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500">Total Keluar (Filter)</span>
            <div className="text-xl font-bold text-rose-600 font-mono mt-0.5">-{totalOut.toLocaleString('id-ID')}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500">Net Delta</span>
            <div className={`text-xl font-bold font-mono mt-0.5 ${totalIn - totalOut >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {(totalIn - totalOut > 0 ? '+' : '') + (totalIn - totalOut).toLocaleString('id-ID')}
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Filter:</span>
          </div>

          {/* Product Filter */}
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="all">Semua Produk</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>

          {/* Movement Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="all">Semua Jenis Mutasi</option>
            <option value="sale">Penjualan (sale)</option>
            <option value="purchase_receipt">Penerimaan PO (purchase_receipt)</option>
            <option value="other_in">Barang Masuk Lainnya (other_in)</option>
            <option value="opening_balance">Saldo Awal (opening_balance)</option>
            <option value="damaged">Barang Rusak (damaged)</option>
            <option value="expired">Kedaluwarsa (expired)</option>
            <option value="internal_use">Pemakaian Internal (internal_use)</option>
            <option value="other_out">Barang Keluar Lainnya (other_out)</option>
            <option value="adjustment_in">Koreksi Masuk (adjustment_in)</option>
            <option value="adjustment_out">Koreksi Keluar (adjustment_out)</option>
            <option value="reversal">Pembalikan (reversal)</option>
          </select>

          {/* Date range */}
          <div className="flex items-center space-x-1 text-xs text-slate-600">
            <span>Dari:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs px-2 py-1 border border-slate-300 rounded-lg"
            />
            <span>S/D:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs px-2 py-1 border border-slate-300 rounded-lg"
            />
          </div>

          {(selectedProduct !== 'all' || selectedType !== 'all' || startDate || endDate) && (
            <button
              onClick={() => {
                setSelectedProduct('all');
                setSelectedType('all');
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-rose-600 hover:underline font-semibold ml-auto"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Produk</th>
                <th className="py-2.5 px-2">Batch</th>
                <th className="py-2.5 px-2">Jenis Mutasi</th>
                <th className="py-2.5 px-2 text-right">Perubahan (Delta)</th>
                <th className="py-2.5 px-2 text-right">Saldo Batch</th>
                <th className="py-2.5 px-3">Alasan / Referensi</th>
                <th className="py-2.5 px-3">Pelaku</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada catatan mutasi yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isPositive = m.quantity_delta > 0;
                  const typeInfo = getMovementLabel(m.movement_type);
                  const canReverse =
                    isOwner &&
                    m.movement_type !== 'reversal' &&
                    m.movement_type !== 'opening_balance' &&
                    m.movement_type !== 'purchase_receipt' &&
                    m.movement_type !== 'adjustment_in' &&
                    m.movement_type !== 'adjustment_out';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                        {new Date(m.created_at).toLocaleString('id-ID', {
                          dateStyle: 'short',
                          timeStyle: 'medium',
                        })}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{m.product?.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{m.product?.sku}</div>
                      </td>
                      <td className="py-2.5 px-2">
                        {m.batch?.expiry_date ? (
                          <div>
                            <div className="font-mono text-[10px] text-slate-700 font-semibold">
                              {m.batch.batch_code || 'Batch'}
                            </div>
                            <div className="text-[10px] text-slate-400">Exp: {m.batch.expiry_date}</div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">Default</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border inline-block ${typeInfo.color}`}
                        >
                          {typeInfo.label}
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
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {canReverse && (
                          <button
                            onClick={() => openReversalModal(m.group_id)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Balikkan Transaksi (Reversal)"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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

      {/* Modal: Reversal */}
      <Modal
        isOpen={reversalModalOpen}
        onClose={() => setReversalModalOpen(false)}
        title="Pembalikan Transaksi (Reversal)"
        subtitle="Membatalkan efek mutasi secara akuntansi dengan membuat transaksi pembalik yang tercatat."
      >
        <form onSubmit={handleReversalSubmit} className="space-y-4">
          {reversalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
              {reversalError}
            </div>
          )}

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
            <strong>Perhatian:</strong> Sesuai aturan PRD & SRS, transaksi final tidak boleh dihapus langsung. Pembalikan akan membuat entri transaksi baru bertipe <code>reversal</code> dengan membalikkan kuantitas dan memulihkan saldo.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan Pembalikan *</label>
            <textarea
              rows={3}
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              placeholder="Jelaskan alasan pembalikan (contoh: salah input jumlah barang keluar oleh staf)..."
              required
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setReversalModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              Proses Pembalikan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
