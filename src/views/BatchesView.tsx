// src/views/BatchesView.tsx
import React, { useState } from 'react';
import {
  CalendarClock,
  AlertTriangle,
  Download,
  Trash2,
  CheckCircle2,
  AlertOctagon,
  Search,
} from 'lucide-react';
import { store, exportToCsv } from '../lib/storage';
import { Modal } from '../components/Modal';

interface BatchesViewProps {
  onRefresh: () => void;
}

export const BatchesView: React.FC<BatchesViewProps> = ({ onRefresh }) => {
  const [filterState, setFilterState] = useState<'all' | 'warning' | 'urgent' | 'expired'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Disposal Modal
  const [disposeModalOpen, setDisposeModalOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [disposeQty, setDisposeQty] = useState('');
  const [disposeReason, setDisposeReason] = useState('');
  const [disposeError, setDisposeError] = useState('');

  const business = store.getBusiness();
  const batchViews = store.getBatchStatusViews();

  // Filter logic
  const filteredBatches = batchViews.filter((b) => {
    // Only perishable products with expiry_date
    if (!b.expiry_date) return false;

    const matchesSearch =
      b.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.batch_code.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterState === 'all') return true;
    if (filterState === 'expired') return b.expiry_state === 'expired';
    if (filterState === 'urgent') return b.expiry_state === 'urgent';
    if (filterState === 'warning') return b.expiry_state === 'warning';
    return true;
  });

  const openDisposeModal = (batchId: string, maxQty: number) => {
    setSelectedBatchId(batchId);
    setDisposeQty(String(maxQty));
    setDisposeReason('Pemusnahan barang kedaluwarsa sesuai SOP');
    setDisposeError('');
    setDisposeModalOpen(true);
  };

  const handleDisposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDisposeError('');
    try {
      const b = batchViews.find((item) => item.batch_id === selectedBatchId);
      if (!b) throw new Error('Batch tidak ditemukan.');

      store.record_stock_out({
        product_id: b.product_id,
        batch_id: b.batch_id,
        quantity: Number(disposeQty),
        movement_type: 'expired',
        reason: disposeReason,
        idempotency_key: 'idem-disp-' + crypto.randomUUID(),
      });

      setDisposeModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setDisposeError(err.message || 'Gagal memproses pemusnahan barang kedaluwarsa.');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'SKU',
      'Nama Produk',
      'Satuan',
      'Kode Batch',
      'Tgl Diterima',
      'Tgl Kedaluwarsa',
      'Sisa Hari',
      'Status',
      'Jumlah Stok',
    ];
    const rows = filteredBatches.map((b) => [
      b.sku,
      b.product_name,
      b.unit_name,
      b.batch_code || 'Utama',
      b.received_date,
      b.expiry_date || '-',
      b.days_to_expiry != null ? b.days_to_expiry : '-',
      b.expiry_state,
      b.quantity_on_hand,
    ]);
    exportToCsv('Daftar_Batch_Kedaluwarsa', headers, rows);
  };

  const selectedBatchInfo = batchViews.find((b) => b.batch_id === selectedBatchId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Pemantauan Batch & Kedaluwarsa</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
              Prinsip FEFO
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ambang batas toko saat ini: Peringatan Awal ≤ {business.expiry_warning_days} hari, Peringatan Mendesak ≤{' '}
            {business.expiry_urgent_days} hari.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Info Rules Banner */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Invarian Stok Kedaluwarsa:</span> Barang yang tanggal kedaluwarsanya telah lewat
            otomatis <strong>dikeluarkan dari stok layak jual</strong> dan tidak dapat dijual ke pelanggan. Barang tersebut
            wajib dipisahkan dan dicatat keluar dengan transaksi pemusnahan (jenis <code>expired</code>).
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-600">
            <button
              onClick={() => setFilterState('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterState === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Semua Batch ({batchViews.filter((b) => b.expiry_date).length})
            </button>
            <button
              onClick={() => setFilterState('warning')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterState === 'warning' ? 'bg-white text-amber-900 shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Waspada (≤30h) ({batchViews.filter((b) => b.expiry_state === 'warning').length})
            </button>
            <button
              onClick={() => setFilterState('urgent')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterState === 'urgent' ? 'bg-white text-orange-900 shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Mendesak (≤7h) ({batchViews.filter((b) => b.expiry_state === 'urgent').length})
            </button>
            <button
              onClick={() => setFilterState('expired')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterState === 'expired' ? 'bg-white text-rose-900 shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Kedaluwarsa ({batchViews.filter((b) => b.expiry_state === 'expired').length})
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari produk atau batch..."
              className="text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden w-56"
            />
          </div>
        </div>

        {/* Batches Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Produk</th>
                <th className="py-2.5 px-3">Kode Batch</th>
                <th className="py-2.5 px-2">Tgl Diterima</th>
                <th className="py-2.5 px-2">Tgl Kedaluwarsa</th>
                <th className="py-2.5 px-2 font-bold">Sisa Waktu</th>
                <th className="py-2.5 px-2 text-right">Kuantitas Stok</th>
                <th className="py-2.5 px-2 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada batch yang memenuhi kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b) => {
                  const isExpired = b.expiry_state === 'expired';
                  const isUrgent = b.expiry_state === 'urgent';
                  const isWarning = b.expiry_state === 'warning';

                  return (
                    <tr
                      key={b.batch_id}
                      className={`hover:bg-slate-50/80 transition-colors ${isExpired ? 'bg-rose-50/40' : ''}`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{b.product_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{b.sku}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                        {b.batch_code || <span className="text-slate-400">Default</span>}
                      </td>
                      <td className="py-2.5 px-2 text-slate-500 font-mono">{b.received_date}</td>
                      <td className="py-2.5 px-2 font-mono font-semibold text-slate-900">
                        {b.expiry_date}
                      </td>
                      <td className="py-2.5 px-2 font-bold font-mono">
                        {typeof b.days_to_expiry === 'number' ? (
                          b.days_to_expiry < 0 ? (
                            <span className="text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                              Lewat {Math.abs(b.days_to_expiry)} hari
                            </span>
                          ) : b.days_to_expiry <= 7 ? (
                            <span className="text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">
                              Tersisa {b.days_to_expiry} hari
                            </span>
                          ) : (
                            <span className={b.days_to_expiry <= 30 ? 'text-amber-700' : 'text-slate-700'}>
                              Tersisa {b.days_to_expiry} hari
                            </span>
                          )
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                        {b.quantity_on_hand} {b.unit_name}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {isExpired ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <AlertOctagon className="w-3 h-3 text-rose-600" />
                            <span>Kedaluwarsa</span>
                          </span>
                        ) : isUrgent ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-300">
                            <AlertTriangle className="w-3 h-3 text-orange-600" />
                            <span>Mendesak (≤7h)</span>
                          </span>
                        ) : isWarning ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <CalendarClock className="w-3 h-3 text-amber-600" />
                            <span>Waspada (≤30h)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Aman</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {isExpired && b.quantity_on_hand > 0 ? (
                          <button
                            onClick={() => openDisposeModal(b.batch_id, b.quantity_on_hand)}
                            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] shadow-xs flex items-center space-x-1 ml-auto"
                            title="Keluarkan barang kedaluwarsa"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Keluarkan</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Siap Jual</span>
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

      {/* Modal: Dispose Expired Stock */}
      <Modal
        isOpen={disposeModalOpen}
        onClose={() => setDisposeModalOpen(false)}
        title="Keluarkan Barang Kedaluwarsa"
        subtitle="Mencatat pengeluaran fisik barang yang sudah tidak layak jual dari sistem persediaan"
      >
        <form onSubmit={handleDisposeSubmit} className="space-y-4">
          {disposeError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
              {disposeError}
            </div>
          )}

          {selectedBatchInfo && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div>
                <span className="text-slate-500">Produk:</span>{' '}
                <strong className="text-slate-900">{selectedBatchInfo.product_name}</strong> ({selectedBatchInfo.sku})
              </div>
              <div>
                <span className="text-slate-500">Kode Batch:</span>{' '}
                <span className="font-mono">{selectedBatchInfo.batch_code || 'Utama'}</span>
              </div>
              <div>
                <span className="text-slate-500">Tanggal Exp:</span>{' '}
                <strong className="text-rose-700">{selectedBatchInfo.expiry_date}</strong> (Sudah kedaluwarsa)
              </div>
              <div>
                <span className="text-slate-500">Stok Tercatat:</span>{' '}
                <strong className="text-slate-900">{selectedBatchInfo.quantity_on_hand} {selectedBatchInfo.unit_name}</strong>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kuantitas yang Dikeluarkan *</label>
            <input
              type="number"
              step="any"
              min="0.001"
              max={selectedBatchInfo?.quantity_on_hand}
              value={disposeQty}
              onChange={(e) => setDisposeQty(e.target.value)}
              required
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Pemusnahan *</label>
            <textarea
              rows={2}
              value={disposeReason}
              onChange={(e) => setDisposeReason(e.target.value)}
              required
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDisposeModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
            >
              Konfirmasi Pemusnahan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
