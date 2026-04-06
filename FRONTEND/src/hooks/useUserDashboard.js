import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const useUserDashboard = () => {
  const navigate = useNavigate();
  const { user, token, updateKycStatus } = useContext(AuthContext) || {}; 
  const authToken = token || localStorage.getItem('token');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [kycStatus, setKycStatus] = useState('unverified'); 
  const [bannerUrl, setBannerUrl] = useState('https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=1600&auto=format&fit=crop');
  const [topTravellers, setTopTravellers] = useState([]); 

  const fetchDashboardData = async () => {
    if (!authToken) { setIsLoading(false); return; }
    try {
      const timestamp = new Date().getTime(); 
      const response = await fetch(`${API_URL}/api/dashboard/me?_t=${timestamp}`, {
        headers: { 'Authorization': `Bearer ${authToken}`, 'Cache-Control': 'no-cache, no-store' }
      });
      const result = await response.json();
      
      const responseTop = await fetch(`${API_URL}/api/dashboard/top-travellers?_t=${timestamp}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const resultTop = await responseTop.json();

      if (result.success) {
        // 1. Simpan seluruh data dashboard ke state
        setDashboardData(result.data);
        
        if (result.data.user.profile_banner) setBannerUrl(result.data.user.profile_banner);

        // 2. Sinkronisasi status KYC lokal
        const freshKyc = String(result.data.user.kyc_status || 'unverified').toLowerCase();
        setKycStatus(freshKyc);
        
        // 3. Sinkronisasi status KYC global
        if (updateKycStatus) updateKycStatus(freshKyc);
      }
      if (resultTop.success) setTopTravellers(resultTop.data);
    } catch (error) {
      console.error('Gagal mengambil data dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Polling Otomatis Tiap 3 Detik
  useEffect(() => { 
    let isMounted = true;
    if (authToken) {
      fetchDashboardData(); 
      const interval = setInterval(() => {
        if(isMounted) fetchDashboardData();
      }, 3000);
      return () => {
        isMounted = false;
        clearInterval(interval);
      }
    } else {
      setIsLoading(false);
      navigate('/login');
    }
  }, [authToken, navigate]); 

  // FUNGSI UPDATE KYC CODE
  const verifyKycCode = async (accessCode) => {
    try {
      const response = await fetch(`${API_URL}/api/users/kyc/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ code: accessCode.trim().toUpperCase() })
      });
      const result = await response.json();
      if (result.success) {
        setKycStatus('verified');
        if (updateKycStatus) updateKycStatus('verified');
        fetchDashboardData(); 
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Terjadi kesalahan jaringan.' };
    }
  };

  // FUNGSI UPDATE PROFIL
  const saveProfile = async (editForm) => {
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(editForm)
      });
      const result = await response.json();
      if (result.success) {
        fetchDashboardData(); 
        return true;
      }
      return false;
    } catch (error) { return false; }
  };

  // FUNGSI UPLOAD BANNER
  const updateBanner = async (base64String) => {
    try {
      await fetch(`${API_URL}/api/users/update-banner`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }, 
        body: JSON.stringify({ bannerUrl: base64String }) 
      });
    } catch (error) { console.error(error); }
  };

  // UPDATE PENTING DI SINI
  return {
    dashboardData, 
    isLoading, 
    kycStatus, 
    bannerUrl, 
    setBannerUrl, 
    topTravellers,
    // Kita panggil dashboardData?.user lebih dulu agar data yang di-render adalah data real-time terbaru dari database
    user: dashboardData?.user || user,
    activeOrder: dashboardData?.activeOrder || null,
    verifyKycCode, 
    saveProfile, 
    updateBanner, 
    navigate
  };
};