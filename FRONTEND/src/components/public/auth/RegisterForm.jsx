import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, ArrowRight, Loader2, AlertCircle, Gift } from 'lucide-react';

const RegisterForm = ({ isLoading, error, onSubmit }) => {
  const [formData, setFormData] = useState({ 
    name: '', email: '', phone: '', password: '', referred_by: '' 
  });

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
        <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Buat Akun</h1>
        <p className="text-slate-500 text-sm font-medium">Bergabunglah dan mulai petualangan Anda bersama Brother Trans hari ini.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold flex items-start gap-3 border border-red-100">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Nama Lengkap</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none transition-all placeholder:text-slate-300 placeholder:font-medium" placeholder="Bima Sena" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none transition-all placeholder:text-slate-300 placeholder:font-medium" placeholder="bima@email.com" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Nomor HP / WA</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" name="phone" required value={formData.phone} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none transition-all placeholder:text-slate-300 placeholder:font-medium" placeholder="08123456789" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none transition-all placeholder:text-slate-300 placeholder:font-medium" placeholder="Minimal 6 karakter" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1.5 block ml-1">Kode Referral (Opsional)</label>
          <div className="relative">
            <Gift className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
            <input type="text" name="referred_by" value={formData.referred_by} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-sm font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-indigo-300 placeholder:font-medium uppercase" placeholder="BR-NAMA-123" />
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 hover:bg-rose-500 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-xl shadow-slate-900/10 active:scale-95">
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Daftar Sekarang'} 
          {!isLoading && <ArrowRight size={20} />}
        </button>
      </form>

      <div className="mt-8 text-center text-sm font-bold text-slate-400 pt-6 border-t border-slate-100">
        Sudah punya akun? <Link to="/login" className="text-rose-500 hover:text-slate-900 transition-colors">Masuk di sini</Link>
      </div>
    </div>
  );
};

export default RegisterForm;