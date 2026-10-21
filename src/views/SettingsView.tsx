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
  Trash2,
  UserX,
  UserCheck,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { store } from '../lib/storage';
import { Modal } from '../components/Modal';
import type { BusinessMember, Profile } from '../types/database';

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
  const [staffPassword, setStaffPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [permProd, setPermProd] = useState(false);
  const [permSupp, setPermSupp] = useState(false);
  const [permPo, setPermPo] = useState(false);
  const [permReceipt, setPermReceipt] = useState(true);
  const [staffError, setStaffError] = useState('');

  // Staff deletion & deactivation modals and notification
  const [deactivateTarget, setDeactivateTarget] = useState<(BusinessMember & { profile: Profile }) | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<(BusinessMember & { profile: Profile }) | null>(null);
  const [staffActionMsg, setStaffActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleToggleActive = (userId: string, current: boolean, memberName?: string) => {
    try {
      const nextActive = !current;
      store.updateMemberPermissions(userId, { is_active: nextActive });
      setStaffActionMsg({
        type: 'success',
        text: `Akun staf ${memberName ? `"${memberName}"` : ''} berhasil ${nextActive ? 'diaktifkan kembali' : 'dinonaktifkan'}.`,
      });
      setTimeout(() => setStaffActionMsg(null), 4000);
      setDeactivateTarget(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteStaff = (userId: string, memberName?: string) => {
    try {
      store.deleteStaffMember(userId);
      setStaffActionMsg({
        type: 'success',
        text: `Akun staf ${memberName ? `"${memberName}"` : ''} berhasil dihapus dari sistem.`,
      });
      setTimeout(() => setStaffActionMsg(null), 4000);
      setDeleteTarget(null);
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

  const handleCloseCreateStaffModal = () => {
    setCreateStaffModalOpen(false);
    setStaffName('');
    setStaffEmail('');
    setStaffPassword('');
    setShowPassword(false);
    setStaffError('');
    setPermProd(false);
    setPermSupp(false);
    setPermPo(false);
    setPermReceipt(true);
  };

  const handleCreateStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');
    if (!staffPassword.trim()) {
      setStaffError('Kata sandi staf wajib diisi.');
      return;
    }
    if (staffPassword.trim().length < 4) {
      setStaffError('Kata sandi staf minimal 4 karakter.');
      return;
    }
    try {
      store.createStaffMember(
        staffName.trim(),
        staffEmail.trim(),
        {
          can_manage_products: permProd,
          can_manage_suppliers: permSupp,
          can_create_po: permPo,
          can_confirm_receipt: permReceipt,
        },
        staffPassword.trim()
      );
      handleCloseCreateStaffModal();
      setStaffActionMsg({
        type: 'success',
        text: `Akun staf "${staffName.trim()}" berhasil dibuat dengan kata sandi yang ditentukan.`,
      });
      setTimeout(() => setStaffActionMsg(null), 4000);
      onRefresh();
    } catch (err: any) {
      setStaffError(err.message || 'Gagal membuat akun staf.');
    }
  };

  const handleResetDemoData = () => {
    if (confirm('Apakah Anda yakin ingin mengatur ulang data SIMETRIS ke kondisi awal? Semua data produk, kategori, dan transaksi yang baru dicatat akan kembali kosong.')) {
      store.resetToDefault();
      onRefresh();
      alert('Data SIMETRIS berhasil direset ke kondisi awal (kosong).');
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
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Staf</span>
            </button>
          )}
        </div>

        {staffActionMsg && (
          <div
            className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all ${
              staffActionMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{staffActionMsg.text}</span>
            </div>
            <button
              onClick={() => setStaffActionMsg(null)}
              className="text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <p className="text-xs text-slate-500">
          Sesuai SRS Bagian 4.10, Staf dapat diberikan izin granular: Kelola Produk, Kelola Pemasok, Buat PO, dan
          Konfirmasi Penerimaan Barang. Owner memiliki hak penuh serta wewenang untuk menonaktifkan atau menghapus akun staf.
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
                <th className="py-2.5 px-3 text-center">Aksi Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => {
                const isMemberOwner = m.role === 'owner';
                return (
                  <tr
                    key={m.user_id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      !m.is_active ? 'bg-slate-50/50' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className={`font-semibold ${m.is_active ? 'text-slate-900' : 'text-slate-500 line-through'}`}>
                        {m.profile.full_name}
                      </div>
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
                        disabled={isMemberOwner || !isOwner || !m.is_active}
                        onChange={(e) => handleTogglePermission(m.user_id, 'can_manage_products', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 disabled:opacity-40"
                        title={!m.is_active ? 'Akun staf sedang dinonaktifkan' : undefined}
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={isMemberOwner || m.can_manage_suppliers}
                        disabled={isMemberOwner || !isOwner || !m.is_active}
                        onChange={(e) => handleTogglePermission(m.user_id, 'can_manage_suppliers', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 disabled:opacity-40"
                        title={!m.is_active ? 'Akun staf sedang dinonaktifkan' : undefined}
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={isMemberOwner || m.can_create_po}
                        disabled={isMemberOwner || !isOwner || !m.is_active}
                        onChange={(e) => handleTogglePermission(m.user_id, 'can_create_po', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 disabled:opacity-40"
                        title={!m.is_active ? 'Akun staf sedang dinonaktifkan' : undefined}
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={isMemberOwner || m.can_confirm_receipt}
                        disabled={isMemberOwner || !isOwner || !m.is_active}
                        onChange={(e) => handleTogglePermission(m.user_id, 'can_confirm_receipt', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 disabled:opacity-40"
                        title={!m.is_active ? 'Akun staf sedang dinonaktifkan' : undefined}
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {isMemberOwner ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Tetap Aktif</span>
                        </span>
                      ) : m.is_active ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-300">
                          <UserX className="w-3 h-3 text-rose-500" />
                          <span>Dinonaktifkan</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {isMemberOwner ? (
                        <span className="text-[11px] text-slate-400 italic font-medium">Akun Utama</span>
                      ) : (
                        <div className="flex items-center justify-center space-x-1.5">
                          {m.is_active ? (
                            <button
                              type="button"
                              onClick={() => setDeactivateTarget(m)}
                              className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                              title="Nonaktifkan akses akun staf ini"
                            >
                              <UserX className="w-3 h-3 text-amber-600" />
                              <span>Nonaktifkan</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleActive(m.user_id, false, m.profile.full_name)}
                              className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                              title="Aktifkan kembali akses staf ini"
                            >
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                              <span>Aktifkan</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(m)}
                            className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                            title="Hapus akun staf secara permanen"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span>Hapus</span>
                          </button>
                        </div>
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
              <div className="text-xs font-bold text-slate-900">Atur Ulang Data SIMETRIS</div>
              <div className="text-[11px] text-slate-500">
                Mengembalikan seluruh data produk, batch, dan transaksi ke kondisi awal (kosong).
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

      {/* Modal: Konfirmasi Nonaktifkan Staf */}
      <Modal
        isOpen={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        title="Konfirmasi Nonaktifkan Akun Staf"
        subtitle="Membatasi akses masuk akun staf ke sistem SIMETRIS"
        maxWidth="md"
      >
        {deactivateTarget && (
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-1.5">
                <p className="font-semibold text-slate-900">
                  Apakah Anda yakin ingin menonaktifkan akun staf{' '}
                  <span className="font-bold underline">{deactivateTarget.profile.full_name}</span>?
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Staf dengan email <code className="bg-amber-100/70 px-1 py-0.5 rounded font-mono text-amber-900">{deactivateTarget.profile.email}</code> tidak akan dapat masuk (login) ke sistem SIMETRIS sampai diaktifkan kembali oleh Owner.
                </p>
                <p className="text-[11px] text-amber-800">
                  Semua data transaksi, pergerakan persediaan, dan sesi opname yang pernah dilakukan staf tetap tersimpan secara aman dalam riwayat audit.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeactivateTarget(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleToggleActive(deactivateTarget.user_id, true, deactivateTarget.profile.full_name)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Ya, Nonaktifkan Akun</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Konfirmasi Hapus Akun Staf */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Konfirmasi Hapus Akun Staf"
        subtitle="Tindakan penghapusan akun staf secara permanen"
        maxWidth="md"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 space-y-1.5">
                <p className="font-semibold text-slate-900">
                  Apakah Anda yakin ingin menghapus akun staf{' '}
                  <span className="font-bold underline text-rose-700">{deleteTarget.profile.full_name}</span>?
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Akun staf dengan email <code className="bg-rose-100/70 px-1 py-0.5 rounded font-mono text-rose-900">{deleteTarget.profile.email}</code> akan dihapus secara permanen dari daftar anggota toko dan tidak dapat digunakan lagi.
                </p>
                <p className="text-[11px] text-rose-700">
                  Catatan: Catatan jejak audit (audit log) atas aktivitas masa lalu tetap tersimpan secara aman sebagai bukti riwayat audit toko.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteStaff(deleteTarget.user_id, deleteTarget.profile.full_name)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Akun Staf</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Create Staff */}
      <Modal
        isOpen={createStaffModalOpen}
        onClose={handleCloseCreateStaffModal}
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kata Sandi (Password) *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                placeholder="Masukkan kata sandi akun staf"
                required
                minLength={4}
                className="w-full text-xs pl-8 pr-9 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Minimal 4 karakter. Digunakan oleh staf untuk masuk ke akun SIMETRIS.
            </span>
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
              onClick={handleCloseCreateStaffModal}
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
