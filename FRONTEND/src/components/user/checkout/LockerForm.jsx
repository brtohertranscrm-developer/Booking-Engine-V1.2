import React from 'react';
import { AlertCircle, CheckCircle2, Package, Calendar, MapPin, Info } from 'lucide-react';

const LockerForm = ({ 
  isKycApproved, navigate, 
  lockerSize, setLockerSize, 
  lockerLocation, 
  startDate, setStartDate, 
  endDate, setEndDate 
}) => {
  return (
    <div className="md:col-span-2 space-y-6 animate-fade-in-up">
      
      {/* Notifikasi KYC */}
      {!isKycApproved ? (
        <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
          <AlertCircle size={24} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-700 mb-1">Verifikasi KYC Diperlukan</h3>
            <p className="text-sm text-red-600 mb-3">Sistem loker pintar kami membutuhkan verifikasi identitas untuk keamanan barang Anda.</p>
            <button onClick={() => navigate('/dashboard')} className="text-sm font-bold bg-white text-red-600 px-4 py-2 rounded-lg shadow-sm hover:bg-red-50">Lengkapi Sekarang</button>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <CheckCircle2 size={24} className="text-green-500 shrink-0" />
          <span className="font-bold text-green-700 text-sm">Identitas Terverifikasi. Anda siap menyewa loker!</span>
        </div>
      )}

      {/* Pilihan Ukuran Loker */}
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-brand-dark mb-6 flex items-center gap-2">
          <Package className="text-blue-600"/> Pilih Ukuran Loker
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div 
            onClick={() => setLockerSize('Medium')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${lockerSize === 'Medium' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-white hover:border-blue-200'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="font-bold text-brand-dark">Medium (M)</div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${lockerSize === 'Medium' ? 'border-blue-600' : 'border-gray-300'}`}>
                {lockerSize === 'Medium' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>}
              </div>
            </div>
            <div className="text-xs text-gray-500 mb-3">Muat 1 Tas Carrier 40L atau 2 Tas Ransel biasa.</div>
            <div className="font-extrabold text-blue-600">Rp 25.000 <span className="text-[10px] text-gray-400 font-normal">/ hari</span></div>
          </div>

          <div 
            onClick={() => setLockerSize('Large')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${lockerSize === 'Large' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-white hover:border-blue-200'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="font-bold text-brand-dark">Large (L)</div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${lockerSize === 'Large' ? 'border-blue-600' : 'border-gray-300'}`}>
                {lockerSize === 'Large' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>}
              </div>
            </div>
            <div className="text-xs text-gray-500 mb-3">Muat 1 Koper Kabin (20 inch) + 1 Tas Ransel.</div>
            <div className="font-extrabold text-blue-600">Rp 40.000 <span className="text-[10px] text-gray-400 font-normal">/ hari</span></div>
          </div>
        </div>
      </div>

      {/* Form Jadwal & Lokasi */}
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-brand-dark mb-6 flex items-center gap-2"><Calendar className="text-blue-600"/> Jadwal & Lokasi</h2>
        
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-4 mb-6">
           <div className="p-3 bg-white rounded-lg shadow-sm text-blue-600"><MapPin size={24}/></div>
           <div>
             <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Lokasi Smart Loker</div>
             <div className="font-bold text-brand-dark">{lockerLocation}</div>
           </div>
         </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Tanggal Masuk</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-sm font-bold outline-none focus:border-blue-600 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Tanggal Keluar</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-sm font-bold outline-none focus:border-blue-600 transition-colors" />
          </div>
        </div>
      </div>

      {/* Info Keamanan */}
      <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl flex gap-4">
        <Info size={24} className="text-blue-500 shrink-0" />
        <div className="text-sm text-blue-900 leading-relaxed">
          <strong>Akses Mandiri 24/7.</strong> Setelah pembayaran berhasil, Anda akan mendapatkan PIN akses unik dan QR Code di menu pesanan Anda untuk membuka pintu loker secara mandiri kapan saja.
        </div>
      </div>

    </div>
  );
};

export default LockerForm;