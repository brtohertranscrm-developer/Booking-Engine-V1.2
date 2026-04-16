import React, { useState } from 'react';
import { Search, Loader2, MapPin, Lock, Unlock } from 'lucide-react';

const LokerTable = ({ lockers, isLoading, onUpdateStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLockers = lockers.filter(locker => 
    locker.locker_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    locker.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      {/* Search Toolbar */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nomor atau lokasi..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-rose-500" size={40} /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest font-black border-b border-slate-100">
                <th className="p-5">No. Loker</th>
                <th className="p-5">Lokasi</th>
                <th className="p-5">Harga / Jam</th>
                <th className="p-5 text-center">Status</th>
                <th className="p-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredLockers.length === 0 ? (
                <tr><td colSpan="5" className="text-center p-10 text-slate-400 font-bold">Tidak ada loker.</td></tr>
              ) : (
                filteredLockers.map((locker) => (
                  <tr key={locker.id} className="border-b border-slate-50 hover:bg-rose-50/30 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-black shadow-sm
                          ${locker.status === 'available' ? 'bg-green-50 text-green-600 border-green-200' : 
                            locker.status === 'occupied' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-red-50 text-red-600 border-red-200'}`}
                        >
                          {locker.status === 'occupied' ? <Lock size={16}/> : <Unlock size={16}/>}
                        </div>
                        <span className="font-black text-slate-900 tracking-widest">{locker.locker_number}</span>
                      </div>
                    </td>
                    <td className="p-5 font-bold text-slate-700 italic text-xs">
                      <MapPin size={12} className="inline mr-1 text-rose-500"/>{locker.location}
                    </td>
                    <td className="p-5 font-black text-slate-900 text-base">
                      Rp {Number(locker.price_per_hour).toLocaleString('id-ID')}
                    </td>
                    <td className="p-5 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        locker.status === 'available' ? 'bg-green-100 text-green-700' : 
                        locker.status === 'occupied' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {locker.status}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <button 
                        onClick={() => onUpdateStatus(locker.id, locker.status)}
                        disabled={locker.status === 'occupied'}
                        className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm
                          ${locker.status === 'available' ? 'bg-slate-900 text-white hover:bg-rose-500' : 'bg-green-500 text-white disabled:opacity-50'}`}
                      >
                        {locker.status === 'available' ? 'Set Perbaikan' : locker.status === 'maintenance' ? 'Set Tersedia' : 'In Use'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LokerTable;