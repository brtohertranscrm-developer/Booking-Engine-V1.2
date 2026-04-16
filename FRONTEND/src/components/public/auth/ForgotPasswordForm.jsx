import React, { useState } from 'react';
import { Mail, Loader2, AlertCircle, KeyRound, CheckCircle2, ChevronLeft } from 'lucide-react';

const ForgotPasswordForm = ({ isLoading, status, setStatus, onSubmit, onBackClick }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await onSubmit(email);
    if (success) setEmail(''); // Kosongkan form jika berhasil terkirim
  };

  return (
    <div className="animate-fade-in-up">
      <button 
        onClick={() => { onBackClick(); setStatus({type:'', message:''}); }}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold text-[10px] uppercase tracking-widest mb-8 transition-colors"
      >
        <ChevronLeft size={16} /> Kembali ke Login
      </button>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 transform -rotate-3">
          <KeyRound size={32} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Lupa Sandi?</h1>
        <p className="text-slate-500 text-sm font-medium">Masukkan email terdaftar Anda. Kami akan mengirimkan tautan untuk membuat sandi baru.</p>
      </div>

      {status.message && (
        <div className={`mb-6 p-4 rounded-2xl text-sm font-bold flex items-start gap-3 border ${status.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
          {status.type === 'success' ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" /> : <AlertCircle size={20} className="shrink-0 mt-0.5" />}
          <p>{status.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Email Terdaftar</label>
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none transition-all placeholder:text-slate-300"
              placeholder="email@anda.com"
            />
          </div>
        </div>

        <button 
          type="submit" disabled={isLoading}
          className="w-full bg-rose-500 text-white font-black py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 hover:bg-rose-600 transition-all disabled:bg-rose-200 disabled:cursor-not-allowed shadow-xl shadow-rose-500/20 active:scale-95"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Kirim Tautan Reset'} 
        </button>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;