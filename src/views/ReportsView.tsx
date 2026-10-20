// src/views/ReportsView.tsx
import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Layers,
  ShoppingBag,
  TrendingDown,
  FileSpreadsheet,
} from 'lucide-react';
import { store, exportToCsv } from '../lib/storage';

export const ReportsView: React.FC = () => {
  const [reportType, setReportType] = useState<
    'stock_balance' | 'movement_summary' | 'supplier_purchases' | 'slow_moving' | 'opname_discrepancy'
  >('stock_balance');

  const [dateRange, setDateRange] = useState<string>('30'); // 7, 30, 90, all

  const stockViews = store.getProductStockViews();
  const movements = store.getStockMovements();
  const suppliers = store.getSuppliers();
  const allReceipts = store['data'].goodsReceipts || [];
  const opnames = store.getOpnames();

  // Helper date filter
  const filterDateMs = Date.now() - Number(dateRange) * 86400000;
  const filteredMovements = movements.filter((m) => {
    if (dateRange === 'all') return true;
    return new Date(m.created_at).getTime() >= filterDateMs;
  });

  // 1. Stock Balance Data
  const stockBalanceData = stockViews.map((s) => {
    const val = (s.last_purchase_price || 0) * s.available_qty;
    return {
      ...s,
      estimated_value: val,
    };
  });
  const totalStockValue = stockBalanceData.reduce((sum, s) => sum + s.estimated_value, 0);

  // 2. Movement Summary Data (per product & movement_type)
  const movementSummaryMap: Record<string, { product_id: string; sku: string; name: string; in_qty: number; out_qty: number }> = {};
  for (const m of filteredMovements) {
    if (!movementSummaryMap[m.product_id]) {
      movementSummaryMap[m.product_id] = {
        product_id: m.product_id,
        sku: m.product?.sku || '-',
        name: m.product?.name || '-',
        in_qty: 0,
        out_qty: 0,
      };
    }
    if (m.quantity_delta > 0) {
      movementSummaryMap[m.product_id].in_qty += m.quantity_delta;
    } else {
      movementSummaryMap[m.product_id].out_qty += Math.abs(m.quantity_delta);
    }
  }
  const movementSummaryList = Object.values(movementSummaryMap);

  // 3. Purchases by Supplier
  const supplierPurchaseMap: Record<string, { supplier_id: string; name: string; receipt_count: number; total_value: number }> = {};
  for (const r of allReceipts) {
    const supp = suppliers.find((s) => s.id === r.supplier_id);
    const suppName = supp?.name || 'Pemasok Lain';
    if (!supplierPurchaseMap[r.supplier_id]) {
      supplierPurchaseMap[r.supplier_id] = {
        supplier_id: r.supplier_id,
        name: suppName,
        receipt_count: 0,
        total_value: 0,
      };
    }
    supplierPurchaseMap[r.supplier_id].receipt_count += 1;
    const rTotal = (r.items || []).reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);
    supplierPurchaseMap[r.supplier_id].total_value += rTotal;
  }
  const supplierPurchaseList = Object.values(supplierPurchaseMap);

  // 4. Slow Moving Products (stock > 0 and 0 sales in past 30 days)
  const thirtyDaysAgo = Date.now() - 30 * 86400000;
  const recentSaleProductIds = new Set(
    movements
      .filter((m) => m.movement_type === 'sale' && new Date(m.created_at).getTime() >= thirtyDaysAgo)
      .map((m) => m.product_id)
  );

  const slowMovingProducts = stockViews.filter(
    (s) => s.is_active && s.available_qty > 0 && !recentSaleProductIds.has(s.product_id)
  );

  // 5. Opname Discrepancies
  const opnameDiscrepancies: {
    opname_id: string;
    started_at: string;
    product_name: string;
    sku: string;
    system_qty: number;
    counted_qty: number;
    difference: number;
    reason: string;
  }[] = [];

  for (const o of opnames) {
    for (const item of o.items || []) {
      if (item.difference !== 0) {
        opnameDiscrepancies.push({
          opname_id: o.id,
          started_at: o.started_at,
          product_name: item.product?.name || '-',
          sku: item.product?.sku || '-',
          system_qty: item.system_quantity,
          counted_qty: item.counted_quantity,
          difference: item.difference,
          reason: item.reason || '-',
        });
      }
    }
  }

  const handleExportCurrentReport = () => {
    if (reportType === 'stock_balance') {
      const headers = ['SKU', 'Nama Produk', 'Kategori', 'Satuan', 'Stok Layak Jual', 'Stok Exp', 'Min Stok', 'Harga Beli Terakhir', 'Estimasi Nilai (Rp)'];
      const rows = stockBalanceData.map((s) => [
        s.sku,
        s.name,
        s.category_name || '-',
        s.unit_name,
        s.available_qty,
        s.expired_qty,
        s.min_stock,
        s.last_purchase_price || 0,
        s.estimated_value,
      ]);
      exportToCsv('Laporan_Saldo_Persediaan', headers, rows);
    } else if (reportType === 'movement_summary') {
      const headers = ['SKU', 'Nama Produk', 'Total Kuantitas Masuk', 'Total Kuantitas Keluar', 'Net'];
      const rows = movementSummaryList.map((m) => [m.sku, m.name, m.in_qty, m.out_qty, m.in_qty - m.out_qty]);
      exportToCsv('Laporan_Pergerakan_Stok', headers, rows);
    } else if (reportType === 'supplier_purchases') {
      const headers = ['Nama Pemasok', 'Jumlah Transaksi Penerimaan', 'Total Nilai Pembelian (Rp)'];
      const rows = supplierPurchaseList.map((s) => [s.name, s.receipt_count, s.total_value]);
      exportToCsv('Laporan_Pembelian_Pemasok', headers, rows);
    } else if (reportType === 'slow_moving') {
      const headers = ['SKU', 'Nama Produk', 'Kategori', 'Satuan', 'Stok Mengendap', 'Harga Beli Terakhir', 'Nilai Mengendap (Rp)'];
      const rows = slowMovingProducts.map((p) => [
        p.sku,
        p.name,
        p.category_name || '-',
        p.unit_name,
        p.available_qty,
        p.last_purchase_price || 0,
        (p.last_purchase_price || 0) * p.available_qty,
      ]);
      exportToCsv('Laporan_Barang_Lambat_Laku', headers, rows);
    } else if (reportType === 'opname_discrepancy') {
      const headers = ['Waktu Opname', 'SKU', 'Nama Produk', 'Saldo Sistem', 'Hasil Fisik', 'Selisih', 'Alasan'];
      const rows = opnameDiscrepancies.map((d) => [
        d.started_at,
        d.sku,
        d.product_name,
        d.system_qty,
        d.counted_qty,
        d.difference,
        d.reason,
      ]);
      exportToCsv('Laporan_Selisih_Stock_Opname', headers, rows);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Pusat Laporan & Analitik Bisnis</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan operasional untuk membantu evaluasi pengadaan, perputaran barang, dan audit persediaan.
          </p>
        </div>

        <button
          onClick={handleExportCurrentReport}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Unduh Laporan Aktif (CSV)</span>
        </button>
      </div>

      {/* Report Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <button
          onClick={() => setReportType('stock_balance')}
          className={`p-3 rounded-xl border text-left transition-all ${
            reportType === 'stock_balance'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <Layers className="w-4 h-4 mb-2 text-emerald-400" />
          <div className="text-xs font-bold">1. Saldo & Nilai Stok</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Kuantitas & estimasi nilai</div>
        </button>

        <button
          onClick={() => setReportType('movement_summary')}
          className={`p-3 rounded-xl border text-left transition-all ${
            reportType === 'movement_summary'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <BarChart3 className="w-4 h-4 mb-2 text-blue-400" />
          <div className="text-xs font-bold">2. Pergerakan Mutasi</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Total barang masuk/keluar</div>
        </button>

        <button
          onClick={() => setReportType('supplier_purchases')}
          className={`p-3 rounded-xl border text-left transition-all ${
            reportType === 'supplier_purchases'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <ShoppingBag className="w-4 h-4 mb-2 text-amber-400" />
          <div className="text-xs font-bold">3. Pembelian Pemasok</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Akumulasi transaksi vendor</div>
        </button>

        <button
          onClick={() => setReportType('slow_moving')}
          className={`p-3 rounded-xl border text-left transition-all ${
            reportType === 'slow_moving'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <TrendingDown className="w-4 h-4 mb-2 text-rose-400" />
          <div className="text-xs font-bold">4. Lambat Laku</div>
          <div className="text-[10px] text-slate-400 mt-0.5">0 penjualan 30 hari</div>
        </button>

        <button
          onClick={() => setReportType('opname_discrepancy')}
          className={`p-3 rounded-xl border text-left transition-all ${
            reportType === 'opname_discrepancy'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 mb-2 text-purple-400" />
          <div className="text-xs font-bold">5. Selisih Opname</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Audit selisih fisik vs sistem</div>
        </button>
      </div>

      {/* Main Report Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        {/* Report Sub-header & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {reportType === 'stock_balance' && 'Laporan Saldo Persediaan & Estimasi Nilai'}
              {reportType === 'movement_summary' && 'Ringkasan Pergerakan Mutasi Barang'}
              {reportType === 'supplier_purchases' && 'Laporan Pembelian per Pemasok'}
              {reportType === 'slow_moving' && 'Laporan Produk Bergerak Rendah (Lambat Laku)'}
              {reportType === 'opname_discrepancy' && 'Laporan Riwayat Selisih Stock Opname'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Data laporan sinkron langsung dengan buku besar transaksi.
            </p>
          </div>

          {(reportType === 'movement_summary' || reportType === 'supplier_purchases') && (
            <div className="flex items-center space-x-2 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-600">Rentang Waktu:</span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
              >
                <option value="7">7 Hari Terakhir</option>
                <option value="30">30 Hari Terakhir</option>
                <option value="90">90 Hari Terakhir</option>
                <option value="all">Semua Waktu</option>
              </select>
            </div>
          )}
        </div>

        {/* 1. STOCK BALANCE TABLE */}
        {reportType === 'stock_balance' && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-800">Total Estimasi Nilai Persediaan Toko</span>
                <div className="text-xl font-bold font-mono text-emerald-900 mt-0.5">
                  Rp {totalStockValue.toLocaleString('id-ID')}
                </div>
              </div>
              <span className="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-1 rounded font-medium">
                Metode: Last Purchase Price
              </span>
            </div>

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
                    <th className="py-2.5 px-2 text-right">Harga Beli Akhir</th>
                    <th className="py-2.5 px-3 text-right">Estimasi Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockBalanceData.map((s) => (
                    <tr key={s.product_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-600">{s.sku}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{s.name}</td>
                      <td className="py-2.5 px-2 text-slate-500">{s.category_name || '-'}</td>
                      <td className="py-2.5 px-2 text-slate-600">{s.unit_name}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                        {s.available_qty}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-rose-600 font-semibold">
                        {s.expired_qty > 0 ? s.expired_qty : '-'}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                        {s.last_purchase_price ? `Rp ${s.last_purchase_price.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        Rp {s.estimated_value.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. MOVEMENT SUMMARY TABLE */}
        {reportType === 'movement_summary' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Nama Produk</th>
                  <th className="py-2.5 px-2 text-right">Total Masuk (+)</th>
                  <th className="py-2.5 px-2 text-right">Total Keluar (-)</th>
                  <th className="py-2.5 px-3 text-right">Perubahan Bersih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movementSummaryList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Tidak ada mutasi stok tercatat dalam rentang waktu ini.
                    </td>
                  </tr>
                ) : (
                  movementSummaryList.map((m) => {
                    const net = m.in_qty - m.out_qty;
                    return (
                      <tr key={m.product_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-600">{m.sku}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{m.name}</td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-600">
                          +{m.in_qty}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-rose-600">
                          -{m.out_qty}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono font-bold ${
                            net >= 0 ? 'text-slate-900' : 'text-rose-600'
                          }`}
                        >
                          {net > 0 ? `+${net}` : net}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. SUPPLIER PURCHASES TABLE */}
        {reportType === 'supplier_purchases' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Nama Pemasok</th>
                  <th className="py-2.5 px-2 text-right">Frekuensi Penerimaan</th>
                  <th className="py-2.5 px-3 text-right">Total Akumulasi Pembelian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplierPurchaseList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400">
                      Belum ada transaksi pembelian tercatat.
                    </td>
                  </tr>
                ) : (
                  supplierPurchaseList.map((s) => (
                    <tr key={s.supplier_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{s.name}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                        {s.receipt_count} kali transaksi
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 text-sm">
                        Rp {s.total_value.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. SLOW MOVING TABLE */}
        {reportType === 'slow_moving' && (
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
              <strong>Kriteria Produk Lambat Laku:</strong> Produk yang memiliki stok tersedia di gudang/toko, tetapi
              tidak memiliki aktivitas transaksi penjualan dalam 30 hari terakhir. Perlu dievaluasi agar modal tidak
              tertahan terlalu lama.
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Nama Produk</th>
                    <th className="py-2.5 px-2">Kategori</th>
                    <th className="py-2.5 px-2 text-right">Stok Tertahan</th>
                    <th className="py-2.5 px-2 text-right">Harga Beli Terakhir</th>
                    <th className="py-2.5 px-3 text-right">Nilai Modal Tertahan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slowMovingProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Hebat! Semua produk yang memiliki stok aktif mengalami perputaran penjualan dalam 30 hari terakhir.
                      </td>
                    </tr>
                  ) : (
                    slowMovingProducts.map((p) => {
                      const tiedValue = (p.last_purchase_price || 0) * p.available_qty;
                      return (
                        <tr key={p.product_id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-600">{p.sku}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{p.name}</td>
                          <td className="py-2.5 px-2 text-slate-500">{p.category_name || '-'}</td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-800">
                            {p.available_qty} {p.unit_name}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                            Rp {(p.last_purchase_price || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-800">
                            Rp {tiedValue.toLocaleString('id-ID')}
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

        {/* 5. OPNAME DISCREPANCIES TABLE */}
        {reportType === 'opname_discrepancy' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Waktu Opname</th>
                  <th className="py-2.5 px-3">Produk</th>
                  <th className="py-2.5 px-2 text-right">Saldo Sistem</th>
                  <th className="py-2.5 px-2 text-right">Hitung Fisik</th>
                  <th className="py-2.5 px-2 text-right">Selisih</th>
                  <th className="py-2.5 px-3">Alasan / Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {opnameDiscrepancies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Tidak ada riwayat selisih stock opname tercatat.
                    </td>
                  </tr>
                ) : (
                  opnameDiscrepancies.map((d, index) => (
                    <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(d.started_at).toLocaleString('id-ID', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{d.product_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{d.sku}</div>
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono">{d.system_qty}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-semibold">{d.counted_qty}</td>
                      <td
                        className={`py-2.5 px-2 text-right font-mono font-bold ${
                          d.difference > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {d.difference > 0 ? `+${d.difference}` : d.difference}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{d.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
