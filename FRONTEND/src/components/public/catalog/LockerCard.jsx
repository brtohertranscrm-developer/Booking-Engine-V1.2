import React from 'react';
import { MapPin, CheckCircle2, Package, XCircle, ArrowRight } from 'lucide-react';

const LockerCard = ({ loc, onSelect }) => {
  const isMediumFull = loc.availability.Medium.stock === 0;
  const isLargeFull = loc.availability.Large.stock === 0;

  return (
    <div className="bg-white rounded-[2rem] shadow-lg shadow-blue-900/5 border border-gray-100 overflow-hidden flex flex-col md:flex-row">
      
      {/* Bagian Kiri: Info Garasi */}
      <div className="w-full md:w-1/3 bg-gray-50 relative">
        <div className="h-48 md:h-full w-full">
          <img src={loc.image} alt={loc.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>
        <div className="absolute bottom-0 left-0 p-6 text-white">
          <span className="bg-blue-500 text-xs font-bold px-3 py-1 rounded-full mb-2 inline-block shadow-sm">
            {loc.city}
          </span>
          <h2 className="text-xl font-bold leading-tight mb-1">{loc.name}</h2>
          <div className="text-xs text-gray-200 flex items-center gap-1">
            <MapPin size={12} /> {loc.address}
          </div>
        </div>
      </div>

      {/* Bagian Kanan: Pilihan Ukuran Loker */}
      <div className="flex-1 p-6 sm:p-8">
        <div className="flex flex-wrap gap-3 mb-6">
          {loc.features.map((feat, idx) => (
            <span key={idx} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
              <CheckCircle2 size={14} className="text-blue-500"/> {feat}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* OPSI MEDIUM */}
          <div className={`border rounded-2xl p-5 flex flex-col justify-between h-full relative overflow-hidden transition-all ${
            isMediumFull ? 'border-gray-200 bg-gray-50 opacity-75' : 'border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer group'
          }`}>
            {isMediumFull && (
              <div className="absolute top-4 right-[-35px] bg-red-500 text-white text-[10px] font-black uppercase px-10 py-1 rotate-45 z-10 shadow-sm">HABIS</div>
            )}
            <div>
              <div className="flex justify-between items-start mb-3 relative z-20">
                <h3 className={`font-bold ${isMediumFull ? 'text-gray-400' : 'text-brand-dark group-hover:text-blue-600 transition-colors'}`}>Medium Loker</h3>
                <Package className={isMediumFull ? 'text-gray-300' : 'text-gray-400 group-hover:text-blue-500'} size={20} />
              </div>
              <ul className={`text-xs space-y-2 mb-4 ${isMediumFull ? 'text-gray-400' : 'text-gray-500'}`}>
                <li>• Muat 1 tas ransel besar 40L</li>
                <li>• Cocok untuk helm & jaket</li>
              </ul>
            </div>
            <div className="relative z-20">
              <div className={`font-extrabold mb-4 ${isMediumFull ? 'text-gray-400' : 'text-brand-dark'}`}>
                Rp {loc.availability.Medium.price.toLocaleString('id-ID')} <span className="text-[10px] font-normal">/ hari</span>
              </div>
              {isMediumFull ? (
                <button disabled className="w-full py-3 bg-gray-200 text-gray-500 font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                  <XCircle size={16} /> Kapasitas Penuh
                </button>
              ) : (
                <button onClick={() => onSelect('Medium', loc.name)} className="w-full py-3 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-colors text-sm flex items-center justify-center gap-2">
                  Pilih Medium <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>

          {/* OPSI LARGE */}
          <div className={`border rounded-2xl p-5 flex flex-col justify-between h-full relative overflow-hidden transition-all ${
            isLargeFull ? 'border-gray-200 bg-gray-50 opacity-75' : 'border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer group'
          }`}>
            {!isLargeFull && (
              <div className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-lg z-10 shadow-sm">Paling Laris</div>
            )}
            {isLargeFull && (
              <div className="absolute top-4 right-[-35px] bg-red-500 text-white text-[10px] font-black uppercase px-10 py-1 rotate-45 z-10 shadow-sm">HABIS</div>
            )}
            <div>
              <div className="flex justify-between items-start mb-3 relative z-20">
                <h3 className={`font-bold ${isLargeFull ? 'text-gray-400' : 'text-brand-dark group-hover:text-blue-600 transition-colors'}`}>Large Loker</h3>
                <Package className={isLargeFull ? 'text-gray-300' : 'text-gray-400 group-hover:text-blue-500'} size={20} />
              </div>
              <ul className={`text-xs space-y-2 mb-4 ${isLargeFull ? 'text-gray-400' : 'text-gray-500'}`}>
                <li>• Muat koper kabin 20"</li>
                <li>• Tambahan ruang untuk tas</li>
              </ul>
            </div>
            <div className="relative z-20">
              <div className={`font-extrabold mb-4 ${isLargeFull ? 'text-gray-400' : 'text-brand-dark'}`}>
                Rp {loc.availability.Large.price.toLocaleString('id-ID')} <span className="text-[10px] font-normal">/ hari</span>
              </div>
              {isLargeFull ? (
                <button disabled className="w-full py-3 bg-gray-200 text-gray-500 font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                  <XCircle size={16} /> Kapasitas Penuh
                </button>
              ) : (
                <button onClick={() => onSelect('Large', loc.name)} className="w-full py-3 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-colors text-sm flex items-center justify-center gap-2">
                  Pilih Large <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LockerCard;