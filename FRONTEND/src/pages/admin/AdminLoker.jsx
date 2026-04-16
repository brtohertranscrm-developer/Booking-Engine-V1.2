import React, { useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { useLoker } from '../../hooks/useLoker';
import LokerTable from '../../components/admin/loker/LokerTable';
import LokerModal from '../../components/admin/loker/LokerModal';

export default function AdminLoker() {
  const { lockers, isLoading, addLocker, updateLockerStatus } = useLoker();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="animate-fade-in-up pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="text-rose-500" /> Manajemen Loker
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Kelola unit Smart Loker dan status pemeliharaan.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto bg-slate-900 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-rose-500 transition-all shadow-lg active:scale-95"
        >
          <Plus size={18} /> Tambah Loker
        </button>
      </div>

      {/* TABEL LOKER */}
      <LokerTable 
        lockers={lockers} 
        isLoading={isLoading} 
        onUpdateStatus={updateLockerStatus} 
      />

      {/* MODAL TAMBAH LOKER */}
      {isModalOpen && (
        <LokerModal 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={addLocker} 
        />
      )}

    </div>
  );
}