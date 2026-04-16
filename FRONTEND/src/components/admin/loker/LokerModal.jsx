import React, { useState } from 'react';
import { Package, X, Loader2 } from 'lucide-react';

const LokerModal = ({ onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newLocker, setNewLocker] = useState({
    locker_number: '', location: 'Stasiun Lempuyangan, Yogyakarta', price_per_hour: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await onSubmit(newLocker);
    if (success) {
      onClose(); // Tutup modal jika berhasil disimpan
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
          <h3 className="font-black text-xl flex items-center gap-2"><Package size={20}/> Unit Loker Baru</h3>
          <button onClick={onClose} className="hover:text-rose-500 transition-colors"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Nomor Loker</label>
            <input 
              required 
              value={newLocker.locker_number} 
              onChange={e => setNewLocker({...newLocker, locker_number: e.target.value.toUpperCase()})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black focus:ring-2 focus:ring-rose-500 outline-none" 
              placeholder="Contoh: LKR-01" 
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Lokasi</label>
            <select 
              value={newLocker.location} 
              onChange={e => setNewLocker({...newLocker, location: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-rose-500 outline-none"
            >
              <option value="Stasiun Lempuyangan, Yogyakarta">Lempuyangan, YK</option>
              <option value="Stasiun Solo Balapan, Solo">Solo Balapan, SL</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Harga / Jam</label>
            <input 
              type="number" 
              required 
              value={newLocker.price_per_hour} 
              onChange={e => setNewLocker({...newLocker, price_per_hour: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-rose-500 outline-none" 
              placeholder="5000" 
            />
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full bg-rose-500 text-white font-black py-4 rounded-xl hover:bg-slate-900 transition-all flex justify-center items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Simpan Loker'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LokerModal;