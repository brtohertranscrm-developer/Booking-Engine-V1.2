import React from 'react';

const BookingTable = ({ data, onEdit }) => {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500 font-medium">
        Belum ada transaksi
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {data.map((b) => (
        <div 
          key={b.order_id} 
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
        >
          {/* Bagian Header Kartu: Order ID & Status */}
          <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
            <span className="font-mono text-xs font-bold text-gray-600">
              {b.order_id}
            </span>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold text-white tracking-wider uppercase ${
              b.status === 'active' ? 'bg-blue-500' : 
              b.status === 'completed' ? 'bg-green-500' : 
              b.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'
            }`}>
              {b.status}
            </span>
          </div>

          {/* Bagian Body Kartu: Informasi Detail */}
          <div className="p-4 flex-1 space-y-4">
            
            {/* Info Pelanggan & Item (Kiri & Kanan) */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">Pelanggan</p>
                <p className="font-bold text-sm text-gray-800">{b.user_name}</p>
                <p className="text-xs text-gray-500">{b.user_phone}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">Item</p>
                <p className="font-bold text-sm text-gray-800">{b.item_name}</p>
                <span className="inline-block mt-0.5 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded font-semibold uppercase">
                  {b.item_type}
                </span>
              </div>
            </div>

            {/* Tanggal Sewa */}
            <div className="border-t border-gray-100 pt-3">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">Durasi Sewa</p>
              <p className="text-xs font-medium text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100 inline-block">
                {new Date(b.start_date).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})} 
                <span className="mx-2 text-gray-400">➔</span> 
                {new Date(b.end_date).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}
              </p>
            </div>

            {/* Pembayaran & Harga */}
            <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center border border-gray-100">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">Pembayaran</p>
                <span className={`px-2 py-1 rounded text-[10px] font-bold text-white uppercase ${
                  b.payment_status === 'paid' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {b.payment_status}
                </span>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">Total Harga</p>
                <p className="font-black text-sm text-gray-800">
                  Rp {b.total_price?.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

          </div>

          {/* Bagian Footer Kartu: Tombol Aksi */}
          <div className="p-4 border-t border-gray-100">
            <button 
              onClick={() => onEdit(b)} 
              className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg text-sm hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
            >
              Update Status Pesanan
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BookingTable;