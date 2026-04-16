import React from 'react';
import { Package, Loader2, ShieldCheck } from 'lucide-react';

const LockerSummary = ({ 
  lockerSize, basePrice, totalDays, totalPrice, 
  isKycApproved, startDate, endDate, isProcessing, handlePayment 
}) => {
  return (
    <div className="md:col-span-1 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden sticky top-24">
        
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
              <Package size={32} />
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded inline-block mb-1">Smart Loker</div>
              <div className="font-bold text-brand-dark leading-tight">Ukuran {lockerSize}</div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <h3 className="font-bold text-brand-dark mb-4">Rincian Pembayaran</h3>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Harga per hari</span>
            <span className="font-bold text-brand-dark">Rp {basePrice.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Durasi Sewa</span>
            <span className="font-bold text-brand-dark">{totalDays} Hari</span>
          </div>
          
          <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-gray-500 font-medium">Total Bayar</span>
            <span className="text-2xl font-extrabold text-blue-600">Rp {totalPrice.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="p-6 pt-0">
          <button 
            onClick={handlePayment}
            disabled={!isKycApproved || !startDate || !endDate || isProcessing}
            className={`w-full py-4 rounded-xl font-bold transition-all shadow-md flex justify-center items-center gap-2 ${
              isKycApproved && startDate && endDate && !isProcessing
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 active:scale-95' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isProcessing ? (
              <><Loader2 size={18} className="animate-spin" /> Memproses...</>
            ) : !isKycApproved ? (
              'Lengkapi KYC Dahulu'
            ) : !startDate || !endDate ? (
              'Pilih Tanggal Dahulu'
            ) : (
              'Bayar Sekarang'
            )}
          </button>
          <div className="mt-4 flex items-start gap-2 text-xs text-gray-400">
            <ShieldCheck size={14} className="shrink-0 text-blue-600" />
            <p>Loker diawasi CCTV 24 jam. Barang terlarang dan berbahaya dilarang keras disimpan di dalam loker.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LockerSummary;