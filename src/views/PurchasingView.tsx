// src/views/PurchasingView.tsx
import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Users,
  PackageCheck,
  Download,
  Eye,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import { store, exportToCsv } from '../lib/storage';
import { Modal } from '../components/Modal';
import type { PurchaseOrder, POStatus } from '../types/database';

interface PurchasingViewProps {
  onRefresh: () => void;
}

export const PurchasingView: React.FC<PurchasingViewProps> = ({ onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'po' | 'receipts' | 'suppliers'>('po');
  const [poStatusFilter, setPoStatusFilter] = useState<string>('all');

  // Modals
  const [createPoModalOpen, setCreatePoModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [viewPoModalOpen, setViewPoModalOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);

  // Create PO Form state
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poExpectedDate, setPoExpectedDate] = useState('');
  const [poNote, setPoNote] = useState('');
  const [poItems, setPoItems] = useState<{ product_id: string; ordered_quantity: number; unit_cost: number }[]>([
    { product_id: '', ordered_quantity: 1, unit_cost: 0 },
  ]);
  const [poError, setPoError] = useState('');

  // Goods Receipt Form state
  const [grSupplierId, setGrSupplierId] = useState('');
  const [grPoId, setGrPoId] = useState('');
  const [grNote, setGrNote] = useState('');
  const [grItems, setGrItems] = useState<{
    product_id: string;
    quantity: number;
    unit_cost: number;
    expiry_date?: string;
    batch_code?: string;
  }[]>([]);
  const [grError, setGrError] = useState('');

  // Supplier Form state
  const [suppName, setSuppName] = useState('');
  const [suppPhone, setSuppPhone] = useState('');
  const [suppAddress, setSuppAddress] = useState('');
  const [suppNotes, setSuppNotes] = useState('');
  const [suppError, setSuppError] = useState('');

  const canCreatePO = store.canCreatePO();
  const canConfirm = store.canConfirmReceipt();
  const canSuppliers = store.canManageSuppliers();

  const suppliers = store.getSuppliers();
  const products = store.getProducts().filter((p) => p.is_active);
  const purchaseOrders = store.getPurchaseOrders();
  const allReceipts = store['data'].goodsReceipts || [];

  // Filtered POs
  const filteredPOs = purchaseOrders.filter((po) => {
    if (poStatusFilter === 'all') return true;
    return po.status === poStatusFilter;
  });

  const handleOpenCreatePO = () => {
    setPoSupplierId(suppliers[0]?.id || '');
    setPoExpectedDate('');
    setPoNote('');
    setPoItems([{ product_id: products[0]?.id || '', ordered_quantity: 10, unit_cost: products[0]?.last_purchase_price || 10000 }]);
    setPoError('');
    setCreatePoModalOpen(true);
  };

  const handleAddPoItemRow = () => {
    setPoItems([
      ...poItems,
      { product_id: products[0]?.id || '', ordered_quantity: 1, unit_cost: products[0]?.last_purchase_price || 10000 },
    ]);
  };

  const handleRemovePoItemRow = (index: number) => {
    if (poItems.length > 1) {
      setPoItems(poItems.filter((_, i) => i !== index));
    }
  };

  const handlePoItemChange = (index: number, field: string, value: any) => {
    const updated = [...poItems];
    (updated[index] as any)[field] = value;
    if (field === 'product_id') {
      const p = products.find((prod) => prod.id === value);
      if (p?.last_purchase_price) {
        updated[index].unit_cost = p.last_purchase_price;
      }
    }
    setPoItems(updated);
  };

  const handleCreatePoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPoError('');
    try {
      store.createPurchaseOrder({
        supplier_id: poSupplierId,
        expected_date: poExpectedDate || undefined,
        note: poNote,
        items: poItems,
      });
      setCreatePoModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setPoError(err.message || 'Gagal membuat pesanan pembelian.');
    }
  };

  const handleOpenReceiveModal = (po?: PurchaseOrder) => {
    if (po) {
      setGrPoId(po.id);
      setGrSupplierId(po.supplier_id);
      setGrNote(`Penerimaan dari PO #${po.po_no}`);
      const itemsToReceive = (po.items || [])
        .filter((item) => item.received_quantity < item.ordered_quantity)
        .map((item) => {
          const remaining = item.ordered_quantity - item.received_quantity;
          const prod = products.find((p) => p.id === item.product_id);
          return {
            product_id: item.product_id,
            quantity: remaining,
            unit_cost: item.unit_cost,
            expiry_date: prod?.track_expiry ? new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0] : '',
            batch_code: '',
          };
        });
      setGrItems(itemsToReceive);
    } else {
      setGrPoId('');
      setGrSupplierId(suppliers[0]?.id || '');
      setGrNote('Penerimaan pembelian langsung tanpa PO');
      setGrItems([
        {
          product_id: products[0]?.id || '',
          quantity: 10,
          unit_cost: products[0]?.last_purchase_price || 10000,
          expiry_date: products[0]?.track_expiry ? new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0] : '',
          batch_code: '',
        },
      ]);
    }
    setGrError('');
    setReceiveModalOpen(true);
  };

  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGrError('');
    try {
      store.receive_goods({
        supplier_id: grSupplierId,
        purchase_order_id: grPoId || null,
        note: grNote,
        items: grItems,
        idempotency_key: 'idem-gr-' + crypto.randomUUID(),
      });
      setReceiveModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setGrError(err.message || 'Gagal mencatat penerimaan barang.');
    }
  };

  const handleUpdatePoStatus = (poId: string, status: POStatus) => {
    try {
      store.set_purchase_order_status(poId, status);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuppError('');
    try {
      store.createSupplier({
        name: suppName,
        phone: suppPhone,
        address: suppAddress,
        notes: suppNotes,
        is_active: true,
      });
      setSupplierModalOpen(false);
      setSuppName('');
      setSuppPhone('');
      setSuppAddress('');
      setSuppNotes('');
      onRefresh();
    } catch (err: any) {
      setSuppError(err.message || 'Gagal menyimpan data pemasok.');
    }
  };

  const handleExportCSV = () => {
    if (activeTab === 'po') {
      const headers = ['No PO', 'Pemasok', 'Status', 'Tgl Pesan', 'Estimasi Tiba', 'Total Item', 'Catatan'];
      const rows = filteredPOs.map((p) => [
        `PO-${p.po_no}`,
        p.supplier?.name || '-',
        p.status,
        p.order_date,
        p.expected_date || '-',
        p.items?.length || 0,
        p.note || '-',
      ]);
      exportToCsv('Daftar_PO_SIMETRIS', headers, rows);
    } else if (activeTab === 'suppliers') {
      const headers = ['Nama Pemasok', 'Telepon', 'Alamat', 'Catatan', 'Status'];
      const rows = suppliers.map((s) => [s.name, s.phone || '-', s.address || '-', s.notes || '-', s.is_active ? 'Aktif' : 'Non-aktif']);
      exportToCsv('Daftar_Pemasok_SIMETRIS', headers, rows);
    }
  };

  const getStatusBadge = (status: POStatus) => {
    const map: Record<POStatus, { label: string; color: string }> = {
      draft: { label: 'Draf', color: 'bg-slate-100 text-slate-700 border-slate-300' },
      ordered: { label: 'Dipesan', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      partially_received: { label: 'Diterima Sebagian', color: 'bg-amber-100 text-amber-800 border-amber-300' },
      received: { label: 'Selesai / Diterima', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
      closed: { label: 'Ditutup (Kurang)', color: 'bg-slate-200 text-slate-800 border-slate-400' },
      cancelled: { label: 'Dibatalkan', color: 'bg-rose-100 text-rose-800 border-rose-300' },
    };
    return map[status] || { label: status, color: 'bg-slate-100 text-slate-700' };
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Pengadaan & Pesanan Pembelian</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data pemasok sembako, pesanan pembelian (PO), dan pencatatan penerimaan barang penuh maupun parsial.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600 shrink-0" />
            <span className="whitespace-nowrap">Ekspor CSV</span>
          </button>

          {canConfirm && (
            <button
              onClick={() => handleOpenReceiveModal()}
              className="inline-flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <PackageCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="whitespace-nowrap">Terima Barang</span>
            </button>
          )}

          {canCreatePO && (
            <button
              onClick={handleOpenCreatePO}
              className="inline-flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Buat PO Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('po')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'po' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Daftar PO ({purchaseOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('receipts')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'receipts' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <PackageCheck className="w-4 h-4" />
              <span>Riwayat Penerimaan ({allReceipts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('suppliers')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'suppliers' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Pemasok ({suppliers.length})</span>
            </button>
          </div>

          {activeTab === 'suppliers' && canSuppliers && (
            <button
              onClick={() => setSupplierModalOpen(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Pemasok</span>
            </button>
          )}
        </div>

        {/* PO TAB */}
        {activeTab === 'po' && (
          <div className="space-y-3">
            {/* Filter PO status */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-semibold text-slate-500">Status PO:</span>
              <select
                value={poStatusFilter}
                onChange={(e) => setPoStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium"
              >
                <option value="all">Semua Status</option>
                <option value="draft">Draf</option>
                <option value="ordered">Dipesan (Menunggu Pengiriman)</option>
                <option value="partially_received">Diterima Sebagian</option>
                <option value="received">Selesai (Diterima Penuh)</option>
                <option value="closed">Ditutup</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">No PO</th>
                    <th className="py-2.5 px-3">Pemasok</th>
                    <th className="py-2.5 px-2">Tgl Pesan</th>
                    <th className="py-2.5 px-2">Estimasi Tiba</th>
                    <th className="py-2.5 px-2">Item</th>
                    <th className="py-2.5 px-2">Total Estimasi</th>
                    <th className="py-2.5 px-2 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPOs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Belum ada pesanan pembelian pada kategori status ini.
                      </td>
                    </tr>
                  ) : (
                    filteredPOs.map((po) => {
                      const totalCost = (po.items || []).reduce(
                        (sum, item) => sum + item.ordered_quantity * item.unit_cost,
                        0
                      );
                      const statusBadge = getStatusBadge(po.status);

                      return (
                        <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            PO-{po.po_no}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {po.supplier?.name}
                          </td>
                          <td className="py-2.5 px-2 text-slate-600 font-mono">{po.order_date}</td>
                          <td className="py-2.5 px-2 text-slate-500 font-mono">
                            {po.expected_date || '-'}
                          </td>
                          <td className="py-2.5 px-2 text-slate-700">
                            {po.items?.length || 0} macam
                          </td>
                          <td className="py-2.5 px-2 font-mono font-semibold text-slate-900">
                            Rp {totalCost.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${statusBadge.color}`}
                            >
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => {
                                  setSelectedPo(po);
                                  setViewPoModalOpen(true);
                                }}
                                className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                title="Lihat Detail PO"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {po.status === 'draft' && canCreatePO && (
                                <button
                                  onClick={() => handleUpdatePoStatus(po.id, 'ordered')}
                                  className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[11px] font-semibold"
                                >
                                  Pesan
                                </button>
                              )}

                              {(po.status === 'ordered' || po.status === 'partially_received') && canConfirm && (
                                <button
                                  onClick={() => handleOpenReceiveModal(po)}
                                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold shadow-xs"
                                >
                                  Terima
                                </button>
                              )}

                              {po.status === 'draft' && canCreatePO && (
                                <button
                                  onClick={() => handleUpdatePoStatus(po.id, 'cancelled')}
                                  className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[11px] font-semibold"
                                >
                                  Batal
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GOODS RECEIPT TAB */}
        {activeTab === 'receipts' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">No Bukti Penerimaan</th>
                  <th className="py-2.5 px-3">Pemasok</th>
                  <th className="py-2.5 px-2">Referensi PO</th>
                  <th className="py-2.5 px-2">Waktu Penerimaan</th>
                  <th className="py-2.5 px-2">Diterima Oleh</th>
                  <th className="py-2.5 px-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Belum ada bukti penerimaan barang tercatat.
                    </td>
                  </tr>
                ) : (
                  allReceipts.map((gr) => {
                    const supp = suppliers.find((s) => s.id === gr.supplier_id);
                    const user = store.getProfiles().find((p) => p.id === gr.received_by);
                    return (
                      <tr key={gr.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          GR-{gr.receipt_no}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{supp?.name}</td>
                        <td className="py-2.5 px-2 text-slate-600 font-mono">
                          {gr.purchase_order_id ? 'Terkait PO' : 'Pembelian Langsung'}
                        </td>
                        <td className="py-2.5 px-2 text-slate-500 font-mono">
                          {new Date(gr.received_at).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-2.5 px-2 text-slate-700 font-medium">
                          {user?.full_name || 'Staff'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{gr.note || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SUPPLIERS TAB */}
        {activeTab === 'suppliers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Nama Pemasok</th>
                  <th className="py-2.5 px-3">Kontak / Telepon</th>
                  <th className="py-2.5 px-3">Alamat</th>
                  <th className="py-2.5 px-3">Catatan Operasional</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Belum ada data pemasok.
                    </td>
                  </tr>
                ) : (
                  suppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{s.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{s.phone || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{s.address || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-500">{s.notes || '-'}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Aktif
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create PO */}
      <Modal
        isOpen={createPoModalOpen}
        onClose={() => setCreatePoModalOpen(false)}
        title="Buat Pesanan Pembelian (Purchase Order)"
        subtitle="Membuat surat pesanan pengadaan ke pemasok sembako"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreatePoSubmit} className="space-y-4">
          {poError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
              {poError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Pemasok *</label>
              <select
                value={poSupplierId}
                onChange={(e) => setPoSupplierId(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estimasi Tiba (Expected Date)</label>
              <input
                type="date"
                value={poExpectedDate}
                onChange={(e) => setPoExpectedDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan PO</label>
            <input
              type="text"
              value={poNote}
              onChange={(e) => setPoNote(e.target.value)}
              placeholder="Contoh: Pengiriman pagi sebelum toko buka"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* PO Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Daftar Item Barang *</span>
              <button
                type="button"
                onClick={handleAddPoItemRow}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
              {poItems.map((item, index) => (
                <div key={index} className="p-3 bg-slate-50/50 flex items-center gap-2 text-xs">
                  <div className="flex-1">
                    <select
                      value={item.product_id}
                      onChange={(e) => handlePoItemChange(index, 'product_id', e.target.value)}
                      required
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-md bg-white"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      placeholder="Qty"
                      value={item.ordered_quantity}
                      onChange={(e) => handlePoItemChange(index, 'ordered_quantity', Number(e.target.value))}
                      required
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Harga Satuan (Rp)"
                      value={item.unit_cost}
                      onChange={(e) => handlePoItemChange(index, 'unit_cost', Number(e.target.value))}
                      required
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                  <div className="w-28 text-right font-mono font-semibold text-slate-800">
                    Rp {(item.ordered_quantity * item.unit_cost).toLocaleString('id-ID')}
                  </div>
                  {poItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePoItemRow(index)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreatePoModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              Simpan Draft PO
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Receive Goods */}
      <Modal
        isOpen={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        title="Penerimaan Barang (Goods Receipt)"
        subtitle="Mencatat kedatangan barang fisik dan memperbarui stok serta harga beli terakhir"
        maxWidth="2xl"
      >
        <form onSubmit={handleReceiveSubmit} className="space-y-4">
          {grError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
              {grError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pemasok *</label>
              <select
                value={grSupplierId}
                onChange={(e) => setGrSupplierId(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Penerimaan</label>
              <input
                type="text"
                value={grNote}
                onChange={(e) => setGrNote(e.target.value)}
                placeholder="No faktur supplier, kondisi pengiriman, dll."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Receive Item Rows */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800 block">Item yang Diterima *</span>
            <div className="space-y-3">
              {grItems.map((item, index) => {
                const prod = products.find((p) => p.id === item.product_id);
                return (
                  <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>{prod?.name || 'Produk'} ({prod?.sku})</span>
                      <span className="text-emerald-700">Rp {Number(item.unit_cost).toLocaleString('id-ID')} / {prod?.unit?.name}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Kuantitas Diterima *</label>
                        <input
                          type="number"
                          step="any"
                          min="0.001"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...grItems];
                            updated[index].quantity = Number(e.target.value);
                            setGrItems(updated);
                          }}
                          required
                          className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Harga Beli Satuan (Rp) *</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={item.unit_cost}
                          onChange={(e) => {
                            const updated = [...grItems];
                            updated[index].unit_cost = Number(e.target.value);
                            setGrItems(updated);
                          }}
                          required
                          className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white font-mono"
                        />
                      </div>

                      {prod?.track_expiry && (
                        <>
                          <div>
                            <label className="block text-[11px] font-semibold text-amber-800 mb-0.5">Tgl Kedaluwarsa *</label>
                            <input
                              type="date"
                              value={item.expiry_date || ''}
                              onChange={(e) => {
                                const updated = [...grItems];
                                updated[index].expiry_date = e.target.value;
                                setGrItems(updated);
                              }}
                              required
                              className="w-full px-2 py-1.5 border border-amber-300 bg-amber-50/50 rounded font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Kode Batch</label>
                            <input
                              type="text"
                              value={item.batch_code || ''}
                              onChange={(e) => {
                                const updated = [...grItems];
                                updated[index].batch_code = e.target.value;
                                setGrItems(updated);
                              }}
                              placeholder="cth: L01"
                              className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white font-mono"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setReceiveModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              Konfirmasi Penerimaan Stok
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View PO Details */}
      <Modal
        isOpen={viewPoModalOpen}
        onClose={() => setViewPoModalOpen(false)}
        title={selectedPo ? `Detail Pesanan Pembelian PO-${selectedPo.po_no}` : 'Detail PO'}
        subtitle="Rincian kuantitas yang dipesan dan progres penerimaan"
        maxWidth="lg"
      >
        {selectedPo && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500">Pemasok:</span> <strong>{selectedPo.supplier?.name}</strong>
              </div>
              <div>
                <span className="text-slate-500">Status:</span>{' '}
                <span className="font-bold uppercase tracking-wider">{selectedPo.status}</span>
              </div>
              <div>
                <span className="text-slate-500">Tanggal Pesan:</span> {selectedPo.order_date}
              </div>
              <div>
                <span className="text-slate-500">Estimasi Tiba:</span> {selectedPo.expected_date || '-'}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold">
                  <tr>
                    <th className="py-2 px-2">Produk</th>
                    <th className="py-2 px-2 text-right">Dipesan</th>
                    <th className="py-2 px-2 text-right">Diterima</th>
                    <th className="py-2 px-2 text-right">Harga Satuan</th>
                    <th className="py-2 px-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedPo.items || []).map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 px-2 font-medium">{item.product?.name}</td>
                      <td className="py-2 px-2 text-right font-mono">{item.ordered_quantity}</td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-emerald-600">
                        {item.received_quantity}
                      </td>
                      <td className="py-2 px-2 text-right font-mono">
                        Rp {item.unit_cost.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-semibold">
                        Rp {(item.ordered_quantity * item.unit_cost).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewPoModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Create Supplier */}
      <Modal
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        title="Tambah Pemasok Baru"
        subtitle="Registrasi data vendor dan nomor kontak distributor"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSupplierSubmit} className="space-y-4">
          {suppError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
              {suppError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Pemasok *</label>
            <input
              type="text"
              value={suppName}
              onChange={(e) => setSuppName(e.target.value)}
              placeholder="cth. PT Sumber Pangan Makmur"
              required
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Telepon / WA</label>
            <input
              type="text"
              value={suppPhone}
              onChange={(e) => setSuppPhone(e.target.value)}
              placeholder="cth. 081234567890"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Gudang / Kantor</label>
            <textarea
              rows={2}
              value={suppAddress}
              onChange={(e) => setSuppAddress(e.target.value)}
              placeholder="Alamat lengkap distributor"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan</label>
            <input
              type="text"
              value={suppNotes}
              onChange={(e) => setSuppNotes(e.target.value)}
              placeholder="Komoditas utama, jadwal rutin antar, dll."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSupplierModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              Simpan Pemasok
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
