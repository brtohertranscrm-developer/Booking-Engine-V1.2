import React from 'react';
import { Loader2, XCircle } from 'lucide-react';
import { useLockerCatalog } from '../../hooks/useLockerCatalog';
import LockerHero from '../../components/public/catalog/LockerHero';
import LockerCard from '../../components/public/catalog/LockerCard';

export default function LockerCatalog() {
  const { lockerLocations, isLoading, error, startDate, endDate, handleSelectLocker } = useLockerCatalog();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <div className="bg-brand-light min-h-screen pb-20 animate-fade-in-up">
      
      {/* 1. Header (Warna Biru) */}
      <LockerHero startDate={startDate} endDate={endDate} />

      {/* 2. Error Message */}
      {error && (
        <div className="max-w-5xl mx-auto mt-8 px-4">
          <div className="bg-red-50 text-red-600 p-6 rounded-[2rem] border border-red-100 text-center font-bold">
            <XCircle size={32} className="mx-auto mb-2 opacity-50" /> {error}
          </div>
        </div>
      )}

      {/* 3. Daftar Kartu Loker */}
      {!error && lockerLocations.length === 0 ? (
        <div className="text-center mt-10 text-gray-500 font-bold">
          Belum ada data loker di database. Tambahkan melalui Admin Panel.
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 space-y-8">
          {lockerLocations.map((loc) => (
            <LockerCard 
              key={loc.id} 
              loc={loc} 
              onSelect={handleSelectLocker} 
            />
          ))}
        </div>
      )}

    </div>
  );
}