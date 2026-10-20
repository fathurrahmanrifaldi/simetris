import React, { useState } from 'react';
import { Package, Lock, Mail, ArrowRight, Shield, User, AlertCircle } from 'lucide-react';
import { store } from '../lib/storage';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (targetEmail: string, targetPass: string) => {
    setError('');
    setIsLoading(true);

    try {
      const res = await store.login(targetEmail, targetPass);
      if (res.success) {
        onLoginSuccess();
      } else {
        setError(res.error || 'Gagal masuk ke sistem. Periksa email dan kata sandi.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat proses login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Silakan masukkan alamat email.');
      return;
    }
    handleLogin(email, password || 'password123');
  };

  const handleQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('password123');
    handleLogin(quickEmail, 'password123');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 font-sans select-none relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/40 mb-3">
            <Package className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-black tracking-tight text-2xl text-white">SIMETRIS</span>
            <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              Sembako
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Sistem Manajemen Inventaris & Kedaluwarsa Berkah Jaya
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cth. owner@berkahjaya.com"
                required
                className="w-full text-xs bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
          >
            <span>{isLoading ? 'Memproses Masuk...' : 'Masuk ke Sistem'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Login Helper */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
            Pilihan Akun Demo (1-Klik Masuk)
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('owner@berkahjaya.com')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-md bg-amber-950 text-amber-400 border border-amber-800/80 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                    Hj. Siti Rahmah (Owner)
                  </div>
                  <div className="text-[10px] text-slate-400">owner@berkahjaya.com • Hak Akses Penuh</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                Owner
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('budi@berkahjaya.com')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800/80 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
                    Budi Santoso (Staff Operasional)
                  </div>
                  <div className="text-[10px] text-slate-400">budi@berkahjaya.com • Produk, PO, Terima</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                Staff
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('andi@berkahjaya.com')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-md bg-blue-950 text-blue-400 border border-blue-800/80 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors">
                    Andi Wijaya (Staff Gudang)
                  </div>
                  <div className="text-[10px] text-slate-400">andi@berkahjaya.com • Tanpa Izin Produk/PO</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/60">
                Staff
              </span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-5 text-center text-[11px] text-slate-500">
          Dilindungi oleh otentikasi peran FEFO SIMETRIS
        </div>
      </div>
    </div>
  );
};
