import React from 'react';
import { Package } from 'lucide-react';
import { useCheckoutLocker } from '../../hooks/useCheckoutLocker';
import LockerForm from '../../components/user/checkout/LockerForm';
import LockerSummary from '../../components/user/checkout/LockerSummary';

export default function CheckoutLocker() {
  const {
    user, navigate,
    startDate, setStartDate,
    endDate, setEndDate,
    lockerSize, setLockerSize,
    lockerLocation, basePrice, totalDays, totalPrice,
    isKycApproved, isProcessing,
    handlePayment
  } = useCheckoutLocker();

  if (!user) return null;

  return (
    <div className="py-12 bg-brand-light min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <h1 className="text-3xl font-bold text-brand-dark mb-8 flex items-center gap-3 animate-fade-in-up">
          <Package className="text-blue-600" size={32} /> Konfirmasi Sewa Loker
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* KOLOM KIRI: Form Detail */}
          <LockerForm 
            isKycApproved={isKycApproved}
            navigate={navigate}
            lockerSize={lockerSize}
            setLockerSize={setLockerSize}
            lockerLocation={lockerLocation}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
          />

          {/* KOLOM KANAN: Ringkasan Harga */}
          <LockerSummary 
            lockerSize={lockerSize}
            basePrice={basePrice}
            totalDays={totalDays}
            totalPrice={totalPrice}
            isKycApproved={isKycApproved}
            startDate={startDate}
            endDate={endDate}
            isProcessing={isProcessing}
            handlePayment={handlePayment}
          />

        </div>
      </div>
    </div>
  );
}