// src/views/SettingsView.tsx
import React, { useState } from 'react';
import {
  Settings,
  Store,
  Clock,
  Users,
  RotateCcw,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { store } from '../lib/storage';
import { Modal } from '../components/Modal';

interface SettingsViewProps {
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onRefresh }) => {
  const business = store.getBusiness();
  const members = store.getMembers();
  const isOwner = store.isOwner();

  // Store settings form
  const [storeName, setStoreName] = useState(business.name);
  const [warnDays, setWarnDays] = useState(String(business.expiry_warning_days));
  const [urgDays, setUrgDays] = useState(String(business.expiry_urgent_days));
  const [storeSavedMsg, setStoreSavedMsg] = useState('');

  // Staff creation modal
  const [createStaffModalOpen, setCreateStaffModalOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [permProd, setPermProd] = useState(false);
  const [permSupp, setPermSupp] = useState(false);
  const [permPo, setPermPo] = useState(false);
  const [permReceipt, setPermReceipt] = useState(true);
  const [staffError, setStaffError] = useState('');

  const handleSaveBusinessSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setStoreSavedMsg('');
    try {
      const w = Number(warnDays);
      const u = Number(urgDays);
      if (u < 0 || w <= u) {
        throw new Error('Ambang batas tidak valid: Peringatan awal harus lebih besar dari peringatan mendesak (≥ 0).');
      }
      store.updateBusiness({
        name: storeName.trim(),
        expiry_warning_days: w,
        expiry_urgent_days: u,
      });
      setStoreSavedMsg('Pengaturan usaha berhasil diperbarui.');
      setTimeout(() => setStoreSavedMsg(''), 3000);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleActive = (userId: string, current: boolean) => {
    try {
      store.updateMemberPermissions(userId, { is_active: !current });
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTogglePermission = (userId: string, key: string, val: boolean) => {
    try {
      store.updateMemberPermissions(userId, { [key]: val } as any);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');
    try {
      store.createStaffMember(staffName.trim(), staffEmail.trim(), {
        can_manage_products: permProd,
        can_manage_suppliers: permSupp,
        can_create_po: permPo,
        can_confirm_receipt: permReceipt,
      });
      setCreateStaffModalOpen(false);
      setStaffName('');
      setStaffEmail('');
      setPermProd(false);
      setPermSupp(false);
      setPermPo(false);
      setPermReceipt(true);
      onRefresh();
    } catch (err: any) {
      setStaffError(err.message || 'Gagal membuat akun staf.');
    }
  };

  const handleResetDemoData = () => {
    if (confirm('Apakah Anda yakin ingin mengatur ulang data demo SIMETRIS ke kondisi awal? Semua transaksi tambahan yang baru dicatat akan kembali ke bawaan pabrik.')) {
      store.resetToDefault();
      onRefresh();
      alert('Data demo berhasil direset ke kondisi awal.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Settings className="w-5 h-5 text-slate-700" />
            <span>Pengaturan Sistem & Otoritas</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi toko sembako, ambang waktu kedaluwarsa, izin staf, dan konektivitas database.
          </p>
        </div>
      </div>

      {/* 1. Pengaturan Toko & Ambang Kedaluwarsa */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-2.5">
          <Store className="w-4 h-4 text-emerald-600" />
          <span>Informasi Toko & Ambang Peringatan Kedaluwarsa</span>
        </h2>

        {storeSavedMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{storeSavedMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveBusinessSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Toko Sembako *</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                disabled={!isOwner}
                required
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Zona Waktu Sistem</label>
              <input
                type="text"
                value={business.timezone}
                disabled
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Default: Asia/Jakarta (WIB)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Peringatan Awal Kedaluwarsa (Hari)</span>
              </label>
              <input
                type="number"
                min="2"
                value={warnDays}
                onChange={(e) => setWarnDays(e.target.value)}
                disabled={!isOwner}
                required
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Batas batch masuk status Waspada (default: 30 hari).
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-orange-900 mb-1 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-600" />
                <span>Peringatan Mendesak Kedaluwarsa (Hari)</span>
              </label>
              <input
                type="number"
                min="1"
                value={urgDays}
                onChange={(e) => setUrgDays(e.target.value)}
                disabled={!isOwner}
                required
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Batas batch masuk status Mendesak (default: 7 hari).
              </span>
            </div>
          </div>

          {isOwner && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
              >
                Simpan Perubahan Toko
              </button>
            </div>
          )}
        </form>
      </div>

      {/* 2. Manajemen Pengguna & Izin Staf */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Manajemen Pengguna & Izin Staf Operasional</span>
          </h2>

          {isOwner && (
            <button
              onClick={() => setCreateStaffModalOpen(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Staf</span>
            </button>
          )}
        </div>

        <p className="text-xs text-slate-500">
          Sesuai SRS Bagian 4.10, Staf dapat diberikan izin granular: Kelola Produk, Kelola Pemasok, Buat PO, dan
          Konfirmasi Penerimaan Barang. Owner selalu memiliki hak penuh secara otomatis.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Nama & Email</th>
                <th className="py-2.5 px-2">Peran</th>
                <th className="py-2.5 px-2 text-center">Kelola Produk</th>
                <th className="py-2.5 px-2 text-center">Kelola Pemasok</th>
                <th className="py-2.5 px-2 text-center">Buat PO</th>
                <th className="py-2.5 px-2 text-center">Konfirmasi Terima</th>
                <th className="py-2.5 px-2 text-center">Status Akun</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => {
                const isMemberOwner = m.role === 'owner';
                return (
                  <tr key={m.user_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{m.profile.full_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{m.profile.email}</div>
                    </td>
                    <td className="py-2.5 px-2">
                      {isMemberOwner ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Owner
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                          Staff
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={isMemberOwner || m.can_manage_products}
                        disabled={isMemberOwner || !isOwner}
                        onChange={(e) => handleTogglePermission(m.user_id, 'can_manage_products', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={isMemberOwner || m.can_manage_suppliers}
                        disabled={isMemberOwner || !isOwner}
                        onChange={(e) => handleTogglePermission(m.user_id, 'can_manage_suppliers', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={isMemberOwner || m.can_create_po}
                        disabled={isMemberOwner || !isOwner}
                        onChange={(e) => handleTogglePermission(m.user_id, 'can_create_po', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={isMemberOwner || m.can_confirm_receipt}
                        disabled={isMemberOwner || !isOwner}
                        onChange={(e) => handleTogglePermission(m.user_id, 'can_confirm_receipt', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {isMemberOwner ? (
                        <span className="text-[10px] font-bold text-emerald-700">Tetap Aktif</span>
                      ) : (
                        <button
                          onClick={() => isOwner && handleToggleActive(m.user_id, m.is_active)}
                          disabled={!isOwner}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                            m.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                          }`}
                        >
                          {m.is_active ? 'Aktif' : 'Dinonaktifkan'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Atur Ulang Data Toko */}
      {isOwner && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-900">Atur Ulang Data Uji Demo</div>
              <div className="text-[11px] text-slate-500">
                Mengembalikan seluruh data toko sembako, batch kedaluwarsa, dan transaksi ke kondisi awal.
              </div>
            </div>
            <button
              onClick={handleResetDemoData}
              className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ke Default</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal: Create Staff */}
      <Modal
        isOpen={createStaffModalOpen}
        onClose={() => setCreateStaffModalOpen(false)}
        title="Tambah Akun Staf Baru"
        subtitle="Membuat profil pengguna staf dan menetapkan hak akses operasional"
        maxWidth="md"
      >
        <form onSubmit={handleCreateStaffSubmit} className="space-y-4">
          {staffError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
              {staffError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap Staf *</label>
            <input
              type="text"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="cth. Dedi Kurniawan"
              required
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Email *</label>
            <input
              type="email"
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              placeholder="cth. dedi@berkahjaya.com"
              required
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-800 block">Izin Akses Granular:</span>
            <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={permProd}
                onChange={(e) => setPermProd(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Izin Kelola Produk (Tambah / Edit Produk, Kategori, Satuan)</span>
            </label>
            <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={permSupp}
                onChange={(e) => setPermSupp(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Izin Kelola Pemasok (Tambah / Edit Vendor)</span>
            </label>
            <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={permPo}
                onChange={(e) => setPermPo(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Izin Membuat PO (Pesanan Pembelian)</span>
            </label>
            <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={permReceipt}
                onChange={(e) => setPermReceipt(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Izin Konfirmasi Penerimaan Barang (Goods Receipt)</span>
            </label>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateStaffModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              Buat Akun Staf
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
