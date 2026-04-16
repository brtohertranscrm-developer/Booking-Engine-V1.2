import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';

export const useFinance = () => {
  const [summary, setSummary] = useState(null);
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [fleetPerformance, setFleetPerformance] = useState({ motors: [], lockers: [] });
  const [expenses, setExpenses] = useState([]);
  const [posTransactions, setPosTransactions] = useState([]);
  const [profitLoss, setProfitLoss] = useState([]);
  const [receivables, setReceivables] = useState([]);
  const [breakdown, setBreakdown] = useState({ by_type: [], by_status: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        summaryData,
        dailyData,
        monthlyData,
        fleetData,
        expenseData,
        posData,
        plData,
        receivableData,
        breakdownData
      ] = await Promise.allSettled([
        apiFetch(`/api/admin/finance/summary?period=${period}`),
        apiFetch('/api/admin/finance/daily-revenue?days=30'),
        apiFetch('/api/admin/finance/monthly-revenue'),
        apiFetch('/api/admin/finance/fleet-performance?period=30'),
        apiFetch('/api/admin/finance/expenses'),
        apiFetch('/api/admin/finance/pos'),
        apiFetch('/api/admin/finance/profit-loss'),
        apiFetch('/api/admin/finance/receivables'),
        apiFetch('/api/admin/finance/breakdown')
      ]);

      if (summaryData.status === 'fulfilled') setSummary(summaryData.value.data);
      if (dailyData.status === 'fulfilled') setDailyRevenue(dailyData.value.data);
      if (monthlyData.status === 'fulfilled') setMonthlyRevenue(monthlyData.value.data);
      if (fleetData.status === 'fulfilled') setFleetPerformance(fleetData.value.data);
      if (expenseData.status === 'fulfilled') setExpenses(expenseData.value.data);
      if (posData.status === 'fulfilled') setPosTransactions(posData.value.data);
      if (plData.status === 'fulfilled') setProfitLoss(plData.value.data);
      if (receivableData.status === 'fulfilled') setReceivables(receivableData.value.data);
      if (breakdownData.status === 'fulfilled') setBreakdown(breakdownData.value.data);
    } catch (err) {
      console.error('Finance fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  const addExpense = async (data) => {
    try {
      await apiFetch('/api/admin/finance/expenses', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      const updated = await apiFetch('/api/admin/finance/expenses');
      setExpenses(updated.data);
      return true;
    } catch (err) {
      alert('Gagal mencatat pengeluaran: ' + err.message);
      return false;
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Hapus catatan pengeluaran ini?')) return;
    try {
      await apiFetch(`/api/admin/finance/expenses/${id}`, { method: 'DELETE' });
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const createPosTransaction = async (data) => {
    try {
      const result = await apiFetch('/api/admin/finance/pos', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      const updated = await apiFetch('/api/admin/finance/pos');
      setPosTransactions(updated.data);
      return result.data;
    } catch (err) {
      alert('Gagal mencatat transaksi POS: ' + err.message);
      return null;
    }
  };

  const formatRupiah = (val) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    summary, dailyRevenue, monthlyRevenue, fleetPerformance,
    expenses, posTransactions, profitLoss, receivables, breakdown,
    isLoading, period, setPeriod,
    addExpense, deleteExpense, createPosTransaction,
    formatRupiah, formatDate, refresh: fetchAll
  };
};
