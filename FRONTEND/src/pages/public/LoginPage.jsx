import React, { useState } from 'react';
import { useAuthForm } from '../../hooks/useAuthForm';
import LoginForm from '../../components/public/auth/LoginForm';
import ForgotPasswordForm from '../../components/public/auth/ForgotPasswordForm';

export default function LoginPage() {
  const { 
    isLoading, 
    error, 
    forgotStatus, 
    setForgotStatus, 
    handleLoginSubmit, 
    handleForgotPasswordSubmit 
  } = useAuthForm();

  const [isForgotMode, setIsForgotMode] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans text-slate-900">
      
      {/* BACKGROUND AURA */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-rose-500 rounded-full blur-[150px] opacity-10 pointer-events-none -ml-40 -mt-40"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-slate-900 rounded-full blur-[120px] opacity-5 pointer-events-none -mr-20 -mb-20"></div>

      {/* KARTU UTAMA */}
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 p-8 sm:p-10 relative z-10 border border-slate-100 overflow-hidden">
        
        {isForgotMode ? (
          <ForgotPasswordForm 
            isLoading={isLoading}
            status={forgotStatus}
            setStatus={setForgotStatus}
            onSubmit={handleForgotPasswordSubmit}
            onBackClick={() => setIsForgotMode(false)}
          />
        ) : (
          <LoginForm 
            isLoading={isLoading}
            error={error}
            onSubmit={handleLoginSubmit}
            onForgotClick={() => setIsForgotMode(true)}
          />
        )}

      </div>
    </div>
  );
}