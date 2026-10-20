// src/views/StockOpnameView.tsx
import React, { useState } from 'react';
import {
  ClipboardCheck,
  Plus,
  AlertTriangle,
  Download,
  Eye,
  Check,
  X,
} from 'lucide-react';
import { store, exportToCsv } from '../lib/storage';
import { Modal } from '../components/Modal';
import type { StockOpname, StockAdjustment } from '../types/database';

interface StockOpnameViewProps {
  onRefresh: () => void;
}

export const StockOpnameView: React.FC<StockOpnameViewProps> = ({ onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'adjustments'>('sessions');

  // Modals
  const [newOpnameModalOpen, setNewOpnameModalOpen] = useState(false);
  const [viewOpnameModalOpen, setViewOpnameModalOpen] = useState(false);
  const [selectedOpname, setSelectedOpname] = useState<StockOpname | null>(null);

  // New Opname Form State
  const batches = store.getBatches().filter((b) => b.product?.is_active);
  const [counts, setCounts] = useState<Record<string, { counted: number; reason: string }>>({});
  const [opnameError, setOpnameError] = useState('');

  // Review adjustment modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedAdj, setSelectedAdj] = useState<StockAdjustment | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNote, setReviewNote] = useState('');
  const [reviewError, setReviewError] = useState('');

  const isOwner = store.isOwner();
  const opnames = store.getOpnames();
  const adjustments = store.getAdjustments();
  const pendingAdjustments = adjustments.filter((a) => a.status === 'pending');

  const openNewOpname = () => {
    const initialCounts: Record<string, { counted: number; reason: string }> = {};
    for (const b of batches) {
      initialCounts[b.id] = {
        counted: b.quantity_on_hand,
        reason: '',
      };
    }
    setCounts(initialCounts);
    setOpnameError('');
    setNewOpnameModalOpen(true);
  };

  const handleCountChange = (batchId: string, value: number) => {
    setCounts((prev) => ({
      ...prev,
      [batchId]: {
        ...(prev[batchId] || { counted: 0, reason: '' }),
        counted: value,
      },
    }));
  };

  const handleReasonChange = (batchId: string, reason: string) => {
    setCounts((prev) => ({
      ...prev,
      [batchId]: {
        ...(prev[batchId] || { counted: 0, reason: '' }),
        reason,
      },
    }));
  };

  const handleSubmitOpname = (e: React.FormEvent) => {
    e.preventDefault();
    setOpnameError('');

    const itemsToSubmit = batches.map((b) => {
      const entry = counts[b.id] || { counted: b.quantity_on_hand, reason: '' };
      return {
        batch_id: b.id,
        counted_quantity: Number(entry.counted),
        reason: entry.reason,
      };
    });

    try {
      store.submit_stock_opname({ items: itemsToSubmit });
      setNewOpnameModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setOpnameError(err.message || 'Gagal menyimpan hasil stock opname.');
    }
  };

  const openReviewModal = (adj: StockAdjustment, action: 'approve' | 'reject') => {
    setSelectedAdj(adj);
    setReviewAction(action);
    setReviewNote(action === 'approve' ? 'Disetujui setelah diverifikasi fisik' : 'Ditolak: perlu penghitungan ulang');
    setReviewError('');
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    if (!selectedAdj) return;

    try {
      store.review_stock_adjustment(selectedAdj.id, reviewAction === 'approve', reviewNote);
      setReviewModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setReviewError(err.message || 'Gagal memproses peninjauan.');
    }
  };

  const handleExportCSV = () => {
    if (activeTab === 'sessions') {
      const headers = ['ID Opname', 'Status', 'Dimulai Oleh', 'Waktu Mulai', 'Waktu Selesai', 'Total Item'];
      const rows = opnames.map((o) => [
        o.id,
        o.status,
        o.starter_profile?.full_name || 'Staff',
        o.started_at,
        o.completed_at || '-',
        o.items?.length || 0,
      ]);
      exportToCsv('Riwayat_Stock_Opname', headers, rows);
    } else {
      const headers = ['Produk', 'Batch', 'Perubahan Delta', 'Alasan', 'Status', 'Diajukan Oleh', 'Waktu Pengajuan'];
      const rows = adjustments.map((a) => [
        a.product?.name || '-',
        a.batch?.batch_code || 'Default',
        a.quantity_delta,
        a.reason,
        a.status,
        a.requester_profile?.full_name || 'Staff',
        a.created_at,
      ]);
      exportToCsv('Daftar_Penyesuaian_Stok', headers, rows);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Stock Opname & Penyesuaian</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan perhitungan fisik, verifikasi selisih, dan alur persetujuan koreksi stok persediaan sembako.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={openNewOpname}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Mulai Stock Opname</span>
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'sessions' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Sesi Opname ({opnames.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('adjustments')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'adjustments' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Pengajuan Koreksi</span>
              {pendingAdjustments.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-200 text-purple-900 font-bold">
                  {pendingAdjustments.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* TAB 1: SESSIONS */}
        {activeTab === 'sessions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Waktu Mulai</th>
                  <th className="py-2.5 px-3">Petugas Pelaksana</th>
                  <th className="py-2.5 px-2">Total Item Dihitung</th>
                  <th className="py-2.5 px-2 text-center">Selisih Ditemukan</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {opnames.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Belum ada riwayat stock opname. Klik "Mulai Stock Opname" untuk memulai perhitungan fisik toko.
                    </td>
                  </tr>
                ) : (
                  opnames.map((o) => {
                    const diffItems = (o.items || []).filter((i) => i.difference !== 0);
                    return (
                      <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {new Date(o.started_at).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {o.starter_profile?.full_name || 'Petugas'}
                        </td>
                        <td className="py-2.5 px-2 text-slate-700">
                          {o.items?.length || 0} batch item
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold">
                          {diffItems.length > 0 ? (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              {diffItems.length} produk berselisih
                            </span>
                          ) : (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Cocok Sempurna (0)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {o.status === 'completed' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Selesai (Completed)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                              Menunggu Review Owner
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedOpname(o);
                              setViewOpnameModalOpen(true);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            title="Lihat Rincian Selisih"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: ADJUSTMENTS */}
        {activeTab === 'adjustments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Produk</th>
                  <th className="py-2.5 px-2">Batch</th>
                  <th className="py-2.5 px-2 text-right">Koreksi (Delta)</th>
                  <th className="py-2.5 px-3">Alasan Koreksi</th>
                  <th className="py-2.5 px-2">Diajukan Oleh</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Tidak ada catatan pengajuan penyesuaian stok.
                    </td>
                  </tr>
                ) : (
                  adjustments.map((adj) => {
                    const isPositive = adj.quantity_delta > 0;
                    return (
                      <tr key={adj.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                          {new Date(adj.created_at).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {adj.product?.name}
                        </td>
                        <td className="py-2.5 px-2 font-mono text-slate-600">
                          {adj.batch?.batch_code || 'Default'}
                        </td>
                        <td
                          className={`py-2.5 px-2 text-right font-bold font-mono text-sm ${
                            isPositive ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isPositive ? `+${adj.quantity_delta}` : adj.quantity_delta}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{adj.reason}</td>
                        <td className="py-2.5 px-2 text-slate-600">
                          {adj.requester_profile?.full_name || 'Staff'}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {adj.status === 'approved' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Disetujui
                            </span>
                          ) : adj.status === 'rejected' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              Ditolak
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              Menunggu Review
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {adj.status === 'pending' && isOwner && (
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => openReviewModal(adj, 'approve')}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-xs flex items-center space-x-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Setujui</span>
                              </button>
                              <button
                                onClick={() => openReviewModal(adj, 'reject')}
                                className="px-2 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold text-[11px] flex items-center space-x-1"
                              >
                                <X className="w-3 h-3" />
                                <span>Tolak</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: New Stock Opname */}
      <Modal
        isOpen={newOpnameModalOpen}
        onClose={() => setNewOpnameModalOpen(false)}
        title="Formulir Penghitungan Fisik (Stock Opname)"
        subtitle="Masukkan hasil perhitungan fisik aktual di gudang/toko. Selisih wajib disertai alasan."
        maxWidth="4xl"
      >
        <form onSubmit={handleSubmitOpname} className="space-y-4">
          {opnameError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
              {opnameError}
            </div>
          )}

          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg text-xs text-purple-900">
            <strong>Catatan Otoritas:</strong> Jika diajukan oleh <strong>Owner</strong>, penyesuaian stok langsung
            diterapkan. Jika diajukan oleh <strong>Staff</strong>, selisih masuk antrean persetujuan Owner terlebih dahulu.
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Produk & Batch</th>
                  <th className="py-2.5 px-2 text-right">Saldo Sistem</th>
                  <th className="py-2.5 px-3 text-center">Hitung Fisik</th>
                  <th className="py-2.5 px-2 text-right">Selisih</th>
                  <th className="py-2.5 px-3">Alasan Selisih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => {
                  const entry = counts[b.id] || { counted: b.quantity_on_hand, reason: '' };
                  const diff = entry.counted - b.quantity_on_hand;
                  const hasDiff = diff !== 0;

                  return (
                    <tr key={b.id} className={hasDiff ? 'bg-amber-50/40' : 'hover:bg-slate-50/50'}>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{b.product?.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {b.product?.sku} {b.batch_code ? `• Batch: ${b.batch_code}` : ''}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-800">
                        {b.quantity_on_hand}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={entry.counted}
                          onChange={(e) => handleCountChange(b.id, Number(e.target.value))}
                          required
                          className="w-24 px-2 py-1 border border-slate-300 rounded font-mono text-center font-bold focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold">
                        {diff > 0 ? (
                          <span className="text-emerald-600">+{diff}</span>
                        ) : diff < 0 ? (
                          <span className="text-rose-600">{diff}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={entry.reason}
                          onChange={(e) => handleReasonChange(b.id, e.target.value)}
                          placeholder={hasDiff ? 'Wajib isi alasan selisih...' : 'Sesuai fisik'}
                          required={hasDiff}
                          className={`w-full px-2 py-1 border rounded text-xs focus:outline-hidden ${
                            hasDiff ? 'border-amber-400 bg-amber-50/40' : 'border-slate-200'
                          }`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setNewOpnameModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors"
            >
              Kirim Hasil Stock Opname
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Review Adjustment */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={reviewAction === 'approve' ? 'Setujui Koreksi Stok' : 'Tolak Koreksi Stok'}
        subtitle="Verifikasi perubahan kuantitas fisik sebelum memperbarui buku besar persediaan"
        maxWidth="md"
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          {reviewError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
              {reviewError}
            </div>
          )}

          {selectedAdj && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
              <div>
                <span className="text-slate-500">Produk:</span>{' '}
                <strong>{selectedAdj.product?.name}</strong>
              </div>
              <div>
                <span className="text-slate-500">Koreksi Kuantitas:</span>{' '}
                <strong className={selectedAdj.quantity_delta > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {selectedAdj.quantity_delta > 0 ? `+${selectedAdj.quantity_delta}` : selectedAdj.quantity_delta}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Alasan Pelapor:</span> {selectedAdj.reason}
              </div>
              <div>
                <span className="text-slate-500">Diajukan Oleh:</span>{' '}
                {selectedAdj.requester_profile?.full_name}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Review Owner</label>
            <textarea
              rows={2}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setReviewModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-xs transition-colors ${
                reviewAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {reviewAction === 'approve' ? 'Konfirmasi Setujui' : 'Konfirmasi Tolak'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Opname Details */}
      <Modal
        isOpen={viewOpnameModalOpen}
        onClose={() => setViewOpnameModalOpen(false)}
        title="Rincian Hasil Stock Opname"
        subtitle="Detail perbandingan saldo sistem dengan hasil perhitungan fisik"
        maxWidth="2xl"
      >
        {selectedOpname && (
          <div className="space-y-4 text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold">
                  <tr>
                    <th className="py-2 px-2">Produk</th>
                    <th className="py-2 px-2 text-right">Sistem</th>
                    <th className="py-2 px-2 text-right">Fisik</th>
                    <th className="py-2 px-2 text-right">Selisih</th>
                    <th className="py-2 px-3">Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedOpname.items || []).map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 px-2 font-medium">{item.product?.name}</td>
                      <td className="py-2 px-2 text-right font-mono">{item.system_quantity}</td>
                      <td className="py-2 px-2 text-right font-mono font-bold">{item.counted_quantity}</td>
                      <td className="py-2 px-2 text-right font-mono font-bold">
                        {item.difference > 0 ? (
                          <span className="text-emerald-600">+{item.difference}</span>
                        ) : item.difference < 0 ? (
                          <span className="text-rose-600">{item.difference}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{item.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewOpnameModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
