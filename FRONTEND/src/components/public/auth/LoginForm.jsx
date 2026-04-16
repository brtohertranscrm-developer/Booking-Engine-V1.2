import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, LogIn } from 'lucide-react';

const LoginForm = ({ isLoading, error, onSubmit, onForgotClick }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-900/20 transform rotate-3">
          <LogIn size={32} className="text-rose-500 relative -ml-1" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Selamat Datang</h1>
        <p className="text-slate-500 text-sm font-medium">Masuk untuk mengelola pesanan dan melanjutkan perjalanan Anda.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold flex items-start gap-3 border border-red-100">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Email Anda</label>
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="email" name="email" required
              value={formData.email} onChange={handleChange}
              className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none transition-all placeholder:text-slate-300"
              placeholder="email@anda.com"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <button 
              type="button" onClick={onForgotClick}
              className="text-[10px] font-black text-rose-500 hover:text-slate-900 transition-colors uppercase tracking-widest"
            >
              Lupa?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="password" name="password" required
              value={formData.password} onChange={handleChange}
              className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none transition-all placeholder:text-slate-300"
              placeholder="Masukkan kata sandi"
            />
          </div>
        </div>

        <button 
          type="submit" disabled={isLoading}
          className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl mt-8 flex items-center justify-center gap-2 hover:bg-rose-500 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-xl shadow-slate-900/10 active:scale-95"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Masuk ke Akun'} 
          {!isLoading && <ArrowRight size={20} />}
        </button>
      </form>

      <div className="mt-8 text-center text-sm font-bold text-slate-400 pt-6 border-t border-slate-100">
        Belum bergabung? <Link to="/register" className="text-rose-500 hover:text-slate-900 transition-colors">Buat akun baru</Link>
      </div>
    </div>
  );
};

export default LoginForm;