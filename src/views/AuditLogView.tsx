// src/views/AuditLogView.tsx
import React, { useState } from 'react';
import { ShieldCheck, Download, ShieldAlert, Search } from 'lucide-react';
import { store, exportToCsv } from '../lib/storage';

export const AuditLogView: React.FC = () => {
  const isOwner = store.isOwner();
  const logs = store.getAuditLogs();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOwner) {
    return (
      <div className="bg-white rounded-xl border border-rose-200 p-8 text-center max-w-lg mx-auto shadow-xs space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Akses Ditolak (42501)</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Sesuai kebijakan keamanan SIMETRIS (PRD §4.1 & SRS FR-AUD.02), modul Audit Log hanya dapat diakses oleh peran{' '}
          <strong>Owner</strong>. Silakan beralih ke akun Owner melalui pemilih pengguna di bilah navigasi atas.
        </p>
      </div>
    );
  }

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.table_name.toLowerCase().includes(term) ||
      (log.actor_name && log.actor_name.toLowerCase().includes(term))
    );
  });

  const handleExportCSV = () => {
    const headers = ['ID', 'Waktu', 'Pelaku', 'Aksi', 'Tabel', 'ID Rekaman', 'Data Baru'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.created_at,
      l.actor_name || 'System',
      l.action,
      l.table_name,
      l.record_id || '-',
      l.new_data ? JSON.stringify(l.new_data) : '-',
    ]);
    exportToCsv('Audit_Log_SIMETRIS', headers, rows);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Jejak Audit Keamanan (Audit Log)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Append-only audit trail: mencatat seluruh peristiwa krusial, perubahan produk, transaksi persediaan, dan izin staf.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>Ekspor CSV</span>
        </button>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700">Total Aktivitas Tercatat: {filteredLogs.length}</div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari aksi, tabel, atau pelaku..."
              className="text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Pelaku</th>
                <th className="py-2.5 px-3">Aksi</th>
                <th className="py-2.5 px-2">Tabel Target</th>
                <th className="py-2.5 px-2">ID Rekaman</th>
                <th className="py-2.5 px-3">Rincian Perubahan (Payload)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada log yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('id-ID', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {log.actor_name || 'System'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-slate-600">{log.table_name}</td>
                    <td className="py-2.5 px-2 font-mono text-slate-400 text-[11px]">
                      {log.record_id ? log.record_id.slice(0, 12) + '...' : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-600 max-w-sm truncate" title={JSON.stringify(log.new_data)}>
                      {log.new_data ? JSON.stringify(log.new_data) : log.old_data ? JSON.stringify(log.old_data) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
