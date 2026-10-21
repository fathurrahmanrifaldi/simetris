// src/views/LoginView.tsx
import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle, Info } from 'lucide-react';
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
    if (!password) {
      setError('Silakan masukkan kata sandi.');
      return;
    }
    handleLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 font-sans select-none relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <img
            src="/images/icon.png"
            alt="SIMETRIS Logo"
            className="w-16 h-16 rounded-2xl object-contain shadow-xl shadow-emerald-950/50 mb-3 border border-emerald-500/20 bg-slate-800"
          />
          <div className="flex items-center space-x-2">
            <span className="font-black tracking-tight text-2xl text-white">SIMETRIS</span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Sistem Manajemen Inventaris & Kedaluwarsa Sembako
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
                placeholder="owner@simetris.test"
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
                placeholder="password"
                required
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

        {/* Informasi Pilihan Akun Demo (Kata-kata saja) */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-center space-x-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pilihan Akun Demo</span>
          </div>

          <div className="bg-slate-800/70 rounded-xl p-3.5 border border-slate-700/80 space-y-2.5 text-xs">
            <div className="flex items-start space-x-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
              <div className="leading-snug">
                <span className="font-semibold text-white">Owner:</span>{' '}
                <span className="font-mono text-slate-300 text-[11px]">
                  <span className="text-emerald-300 font-semibold select-all">owner@simetris.test</span>, sandi:{' '}
                  <span className="text-emerald-300 font-semibold select-all">password</span>
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-2.5 pt-1 border-t border-slate-700/50">
              <span className="w-2 h-2 rounded-full bg-slate-500 mt-1 shrink-0" />
              <div className="leading-snug">
                <span className="font-semibold text-slate-400">Staf:</span>{' '}
                <span className="font-mono text-slate-400 text-[11px]">
                  <span className="text-slate-300 font-semibold">staf@simetris.test</span>, sandi:{' '}
                  <span className="text-slate-300 font-semibold">staf123</span>
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-3 text-center">
            Silakan ketik email dan sandi di atas pada formulir untuk masuk ke sistem.
          </p>
        </div>

        {/* Footer info */}
        <div className="mt-4 text-center text-[10px] text-slate-600">
          Dilindungi oleh sistem otentikasi peran SIMETRIS
        </div>
      </div>
    </div>
  );
};
