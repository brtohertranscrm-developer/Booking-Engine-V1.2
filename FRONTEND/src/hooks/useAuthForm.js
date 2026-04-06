import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const useAuthForm = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext) || {}; 
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotStatus, setForgotStatus] = useState({ type: '', message: '' });

  // Jika di production akan memakai URL asli, jika di local dev akan memakai path relatif (berkat proxy)
  const API_URL = import.meta.env.VITE_API_URL || '';

  // --- FUNGSI LOGIN ---
  const handleLoginSubmit = async (formData) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();

      if (result.success) {
        if (login) login(result.user, result.token); 
        if (result.user.role === 'admin') navigate('/admin'); 
        else navigate('/dashboard'); 
      } else {
        setError(result.error || 'Email atau password salah.');
      }
    } catch (err) {
      setError('Gagal terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- FUNGSI REGISTRASI (BARU DITAMBAHKAN) ---
  const handleRegisterSubmit = async (formData) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();

      if (result.success) {
        alert(result.message);
        navigate('/login'); 
        return true;
      } else {
        setError(result.error || 'Terjadi kesalahan saat registrasi.');
        return false;
      }
    } catch (err) {
      setError('Gagal terhubung ke server.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // --- FUNGSI LUPA PASSWORD ---
  const handleForgotPasswordSubmit = async (email) => {
    setIsLoading(true);
    setForgotStatus({ type: '', message: '' });
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const result = await response.json();

      if (result.success) {
        setForgotStatus({ type: 'success', message: 'Tautan reset sandi telah dikirim.' });
        return true; 
      } else {
        setForgotStatus({ type: 'error', message: result.error || 'Gagal mengirim email reset.' });
        return false;
      }
    } catch (err) {
      setForgotStatus({ type: 'error', message: 'Gagal terhubung ke server.' });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    isLoading, error, forgotStatus, setForgotStatus, 
    handleLoginSubmit, handleRegisterSubmit, handleForgotPasswordSubmit 
  };
};