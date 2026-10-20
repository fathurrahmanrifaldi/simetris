// src/views/ProductsView.tsx
import React, { useState } from 'react';
import {
  Plus,
  Search,
  Download,
  Edit2,
  Archive,
  ArchiveRestore,
  Tag,
  Scale,
  Clock,
} from 'lucide-react';
import { store, exportToCsv } from '../lib/storage';
import { Modal } from '../components/Modal';
import type { Product } from '../types/database';

interface ProductsViewProps {
  onRefresh: () => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterTab, setFilterTab] = useState<'all' | 'low' | 'out' | 'archived'>('all');

  // Modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [unitModalOpen, setUnitModalOpen] = useState(false);

  // Form product state
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formUnitId, setFormUnitId] = useState('');
  const [formMinStock, setFormMinStock] = useState('0');
  const [formTrackExpiry, setFormTrackExpiry] = useState(false);
  const [formError, setFormError] = useState('');

  // Category & Unit form states
  const [newCatName, setNewCatName] = useState('');
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitDecimal, setNewUnitDecimal] = useState(false);

  const isOwner = store.isOwner();
  const canManage = store.canManageProducts();

  const products = store.getProducts();
  const stockViews = store.getProductStockViews();
  const categories = store.getCategories();
  const units = store.getUnits();

  // Filtered views
  const filteredList = stockViews.filter((item) => {
    // Search
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());

    // Category
    const prod = products.find((p) => p.id === item.product_id);
    const matchesCat = selectedCategory === 'all' || prod?.category_id === selectedCategory;

    // Tab filter
    if (filterTab === 'archived') {
      return !item.is_active && matchesSearch && matchesCat;
    }
    if (!item.is_active) return false;

    if (filterTab === 'low') return item.stock_state === 'low' && matchesSearch && matchesCat;
    if (filterTab === 'out') return item.stock_state === 'out' && matchesSearch && matchesCat;

    return matchesSearch && matchesCat;
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormSku('');
    setFormName('');
    setFormCategoryId(categories[0]?.id || '');
    setFormUnitId(units[0]?.id || '');
    setFormMinStock('10');
    setFormTrackExpiry(false);
    setFormError('');
    setProductModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormSku(p.sku);
    setFormName(p.name);
    setFormCategoryId(p.category_id || '');
    setFormUnitId(p.unit_id);
    setFormMinStock(String(p.min_stock));
    setFormTrackExpiry(p.track_expiry);
    setFormError('');
    setProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      if (editingProduct) {
        store.updateProduct(editingProduct.id, {
          sku: formSku,
          name: formName,
          category_id: formCategoryId || null,
          unit_id: formUnitId,
          min_stock: Number(formMinStock),
          track_expiry: formTrackExpiry,
        });
      } else {
        store.createProduct({
          sku: formSku,
          name: formName,
          category_id: formCategoryId || undefined,
          unit_id: formUnitId,
          min_stock: Number(formMinStock),
          track_expiry: formTrackExpiry,
        });
      }
      setProductModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan produk.');
    }
  };

  const handleArchive = (id: string) => {
    if (confirm('Yakin ingin mengarsipkan produk ini?')) {
      try {
        store.archiveProduct(id);
        onRefresh();
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  const handleUnarchive = (id: string) => {
    try {
      store.unarchiveProduct(id);
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      store.createCategory(newCatName);
      setNewCatName('');
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCreateUnit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      store.createUnit(newUnitName, newUnitDecimal);
      setNewUnitName('');
      setNewUnitDecimal(false);
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'SKU',
      'Nama Produk',
      'Kategori',
      'Satuan',
      'Stok Tersedia',
      'Stok Kedaluwarsa',
      'Batas Stok Min',
      'Status',
      'Pantau Kedaluwarsa',
      'Harga Beli Terakhir (Rp)',
      'Status Aktif',
    ];
    const rows = stockViews.map((s) => [
      s.sku,
      s.name,
      s.category_name || '-',
      s.unit_name,
      s.available_qty,
      s.expired_qty,
      s.min_stock,
      s.stock_state,
      s.track_expiry ? 'Ya' : 'Tidak',
      s.last_purchase_price || 0,
      s.is_active ? 'Aktif' : 'Arsip',
    ]);
    exportToCsv('Daftar_Produk_SIMETRIS', headers, rows);
  };

  return (
    <div className="space-y-5">
      {/* Header and Action Bar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manajemen Produk & Satuan</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar master produk sembako, stok minimum pengadaan, dan pengaturan pelacakan kedaluwarsa.
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

          {canManage && (
            <>
              <button
                onClick={() => setCategoryModalOpen(true)}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                <Tag className="w-3.5 h-3.5 text-slate-600" />
                <span>Kategori</span>
              </button>
              <button
                onClick={() => setUnitModalOpen(true)}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                <Scale className="w-3.5 h-3.5 text-slate-600" />
                <span>Satuan</span>
              </button>
              <button
                onClick={openCreateModal}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-600">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterTab === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Semua Aktif ({stockViews.filter((p) => p.is_active).length})
            </button>
            <button
              onClick={() => setFilterTab('low')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterTab === 'low' ? 'bg-white text-amber-900 shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Menipis ({stockViews.filter((p) => p.is_active && p.stock_state === 'low').length})
            </button>
            <button
              onClick={() => setFilterTab('out')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterTab === 'out' ? 'bg-white text-rose-900 shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Habis ({stockViews.filter((p) => p.is_active && p.stock_state === 'out').length})
            </button>
            <button
              onClick={() => setFilterTab('archived')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterTab === 'archived' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Arsip ({stockViews.filter((p) => !p.is_active).length})
            </button>
          </div>

          {/* Search & Category filter */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-hidden"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari SKU atau nama..."
                className="text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden w-48 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">Nama Produk</th>
                <th className="py-2.5 px-2">Kategori</th>
                <th className="py-2.5 px-2">Satuan</th>
                <th className="py-2.5 px-2 text-right">Stok Layak Jual</th>
                <th className="py-2.5 px-2 text-right">Stok Exp</th>
                <th className="py-2.5 px-2 text-right">Min Stok</th>
                <th className="py-2.5 px-2 text-center">Status</th>
                <th className="py-2.5 px-2 text-center">Kedaluwarsa</th>
                <th className="py-2.5 px-2 text-right">Harga Beli Akhir</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Tidak ada produk yang cocok dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const originalProd = products.find((p) => p.id === item.product_id);
                  return (
                    <tr key={item.product_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-600">{item.sku}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{item.name}</td>
                      <td className="py-2.5 px-2 text-slate-500">{item.category_name || '-'}</td>
                      <td className="py-2.5 px-2 text-slate-600">{item.unit_name}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                        {item.available_qty}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-semibold">
                        {item.expired_qty > 0 ? (
                          <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            {item.expired_qty}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-500">{item.min_stock}</td>
                      <td className="py-2.5 px-2 text-center">
                        {item.stock_state === 'out' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            Habis
                          </span>
                        ) : item.stock_state === 'low' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Menipis
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Cukup
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {item.track_expiry ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Dipantau</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                        {item.last_purchase_price
                          ? `Rp ${item.last_purchase_price.toLocaleString('id-ID')}`
                          : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {canManage && originalProd && (
                          <div className="flex items-center justify-end space-x-1">
                            {item.is_active ? (
                              <>
                                <button
                                  onClick={() => openEditModal(originalProd)}
                                  className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                  title="Edit Produk"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleArchive(item.product_id)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  title="Arsipkan Produk"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleUnarchive(item.product_id)}
                                className="p-1 rounded text-emerald-600 hover:bg-emerald-50 flex items-center space-x-1"
                                title="Pulihkan dari Arsip"
                              >
                                <ArchiveRestore className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-semibold">Aktifkan</span>
                              </button>
                            )}
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
      </div>

      {/* Modal: Add / Edit Product */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={editingProduct ? 'Edit Informasi Produk' : 'Tambah Produk Baru'}
        subtitle="Kelola master data sembako, kode SKU, dan aturan stok"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kode SKU *</label>
              <input
                type="text"
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
                placeholder="cth. BRS-RAM-05K"
                required
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono uppercase"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">SKU unik untuk produk aktif</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Produk *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="cth. Beras Ramos Setra 5kg"
                required
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
              <select
                value={formCategoryId}
                onChange={(e) => setFormCategoryId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="">-- Tanpa Kategori --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Satuan Dasar *</label>
              <select
                value={formUnitId}
                onChange={(e) => setFormUnitId(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.allows_decimal ? '(Desimal/Pecahan)' : '(Bulat)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Batas Minimum Stok {isOwner ? '*' : '(Hanya Owner)'}
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={formMinStock}
                onChange={(e) => setFormMinStock(e.target.value)}
                disabled={!isOwner}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono disabled:bg-slate-100 disabled:text-slate-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Pemicu peringatan pengadaan</span>
            </div>

            <div className="pt-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formTrackExpiry}
                  onChange={(e) => setFormTrackExpiry(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-800">Pantau Tanggal Kedaluwarsa</span>
              </label>
              <span className="text-[10px] text-slate-500 block mt-1">
                Wajib mencantumkan tanggal kedaluwarsa pada setiap batch penerimaan.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setProductModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              {editingProduct ? 'Perbarui Produk' : 'Simpan Produk'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Manage Categories */}
      <Modal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="Kelola Kategori Produk"
        subtitle="Pengelompokan jenis sembako"
        maxWidth="md"
      >
        <div className="space-y-4">
          <form onSubmit={handleCreateCategory} className="flex gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Nama kategori baru..."
              required
              className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
            <button
              type="submit"
              className="px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
            >
              Tambah
            </button>
          </form>

          <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {categories.map((c) => (
              <div key={c.id} className="px-3 py-2 text-xs text-slate-700 flex justify-between items-center">
                <span>{c.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {products.filter((p) => p.category_id === c.id).length} produk
                </span>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Modal: Manage Units */}
      <Modal
        isOpen={unitModalOpen}
        onClose={() => setUnitModalOpen(false)}
        title="Kelola Satuan Produk"
        subtitle="Satuan hitung dan dukungan bilangan desimal (pecahan)"
        maxWidth="md"
      >
        <div className="space-y-4">
          <form onSubmit={handleCreateUnit} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                placeholder="Nama satuan (cth: karung, kg, pcs)..."
                required
                className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                Tambah
              </button>
            </div>
            <label className="flex items-center space-x-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={newUnitDecimal}
                onChange={(e) => setNewUnitDecimal(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Dukung desimal / pecahan (misal 1.5 kg)</span>
            </label>
          </form>

          <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {units.map((u) => (
              <div key={u.id} className="px-3 py-2 text-xs text-slate-700 flex justify-between items-center">
                <span className="font-semibold">{u.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {u.allows_decimal ? 'Desimal diperbolehkan' : 'Bilangan bulat'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
