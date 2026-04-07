import { useState, useEffect } from 'react';

export const useArmada = () => {
  const [armada, setArmada] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  const fetchArmada = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/admin/motors', { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (result.success) setArmada(result.data);
    } catch (error) { console.error("Gagal ambil armada:", error); } 
    finally { setLoading(false); }
  };

  const addArmada = async (data) => {
    try {
      await fetch('http://localhost:5001/api/admin/motors', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
      fetchArmada();
    } catch (error) { console.error(error); }
  };

  const editArmada = async (id, data) => {
    try {
      await fetch(`http://localhost:5001/api/admin/motors/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
      fetchArmada(); 
    } catch (error) { console.error(error); }
  };

  const deleteArmada = async (id) => {
    if(!window.confirm("Yakin ingin menghapus katalog motor ini beserta SEMUA plat nomornya?")) return;
    try {
      await fetch(`http://localhost:5001/api/admin/motors/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchArmada();
    } catch (error) { console.error(error); }
  };

  // --- FUNGSI BARU UNTUK MANAJEMEN PLAT NOMOR (UNIT) ---
  const fetchUnits = async (motorId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/admin/motors/${motorId}/units`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) { console.error(error); return []; }
  };

  const addUnit = async (motorId, data) => {
    try {
      await fetch(`http://localhost:5001/api/admin/motors/${motorId}/units`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
      fetchArmada(); // Refresh agar stok bertambah
    } catch (error) { console.error(error); }
  };

  const updateUnit = async (unitId, data) => {
    try {
      await fetch(`http://localhost:5001/api/admin/units/${unitId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
      fetchArmada(); // Refresh stok jika status diubah
    } catch (error) { console.error(error); }
  };

  const deleteUnit = async (unitId) => {
    if(!window.confirm("Hapus plat nomor ini permanen?")) return false;
    try {
      await fetch(`http://localhost:5001/api/admin/units/${unitId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchArmada(); // Refresh stok
      return true;
    } catch (error) { console.error(error); return false; }
  };

  useEffect(() => { fetchArmada(); }, []);

  return { armada, loading, addArmada, editArmada, deleteArmada, fetchUnits, addUnit, updateUnit, deleteUnit };
};