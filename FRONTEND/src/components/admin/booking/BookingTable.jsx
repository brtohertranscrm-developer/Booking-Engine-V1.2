import React, { useState } from 'react';
import { Search, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

const BookingTable = ({ data, onEdit }) => {
  // State untuk Accordion, Search, dan Filter Tanggal
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Fungsi toggle accordion
  const toggleExpand = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Fungsi format tanggal untuk perbandingan filter
  const formatDateForCompare = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Filter data berdasarkan pencarian dan tanggal
  const filteredData = data.filter((b) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      b.order_id?.toLowerCase().includes(searchLower) ||
      b.user_name?.toLowerCase().includes(searchLower) ||
      b.user_phone?.includes(searchLower);

    const matchDate = filterDate 
      ? (formatDateForCompare(b.start_date) === filterDate || formatDateForCompare(b.end_date) === filterDate) 
      : true;

    return matchesSearch && matchDate;
  });

  return (
    <div className="space-y-6">
      
      {/* --- BAGIAN FILTER & PENCARIAN --- */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari Order ID, Nama, atau No HP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filter Tanggal */}
        <div className="relative w-full sm:w-auto min-w-[180px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar size={18} className="text-slate-400" />
          </div>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-600"
          />
          {filterDate && (
            <button 
              onClick={() => setFilterDate('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-lg font-bold hover:bg-red-200"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* --- DAFTAR DATA PESANAN (KARTU ACCORDION) --- */}
      {data.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center text-slate-500 font-medium">
          Belum ada transaksi di sistem.
        </div>
      ) : filteredData.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center text-slate-500 font-medium">
          Tidak ada pesanan yang cocok dengan pencarian/filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredData.map((b) => {
            const isExpanded = expandedOrderId === b.order_id;

            return (
              <div 
                key={b.order_id} 
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all duration-300"
              >
                {/* HEADER KARTU (Hanya Kode Booking & Status) */}
                <div 
                  onClick={() => toggleExpand(b.order_id)}
                  className="p-4 cursor-pointer hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
                >
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Order ID</p>
                    <span className="font-mono text-sm font-black text-slate-800">
                      {b.order_id}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-[6px] text-[10px] font-bold text-white tracking-wider uppercase ${
                      b.status === 'active' ? 'bg-blue-500' : 
                      b.status === 'completed' ? 'bg-green-500' : 
                      b.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}>
                      {b.status}
                    </span>
                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {/* BODY & FOOTER KARTU (Konten Tersembunyi) */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-white animate-in slide-in-from-top-2 fade-in duration-200 flex flex-col">
                    
                    <div className="p-4 flex-1 space-y-4">
                      {/* Info Pelanggan & Item */}
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Pelanggan</p>
                          <p className="font-bold text-sm text-slate-800 line-clamp-1">{b.user_name}</p>
                          <p className="text-xs text-slate-500">{b.user_phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Item</p>
                          <p className="font-bold text-sm text-slate-800 line-clamp-1">{b.item_name}</p>
                          <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded font-semibold uppercase">
                            {b.item_type}
                          </span>
                        </div>
                      </div>

                      {/* Tanggal Sewa */}
                      <div className="border-t border-slate-100 pt-3">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Durasi Sewa</p>
                        <p className="text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 inline-block w-full text-center">
                          {new Date(b.start_date).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})} 
                          <span className="mx-2 text-slate-400">➔</span> 
                          {new Date(b.end_date).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}
                        </p>
                      </div>

                      {/* Pembayaran & Harga */}
                      <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center border border-slate-100">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Status Bayar</p>
                          <span className={`px-2 py-1 rounded text-[10px] font-bold text-white uppercase ${
                            b.payment_status === 'paid' ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                            {b.payment_status}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Total Harga</p>
                          <p className="font-black text-sm text-slate-800">
                            Rp {b.total_price?.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="p-3 bg-slate-50/50 border-t border-slate-100">
                      <button 
                        onClick={() => onEdit(b)} 
                        className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 shadow-sm"
                      >
                        Update Pesanan
                      </button>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookingTable;