import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Bike, Package,
  Plus, Trash2, Receipt, AlertCircle, ChevronRight, X, Loader2,
  CreditCard, Wallet, FileText, BarChart2, Users, Clock,
  ArrowUpRight, ArrowDownRight, Filter, Download, RefreshCw,
  CheckCircle2, Banknote, PieChartIcon, Target, CalendarRange
} from 'lucide-react';
import { useFinance } from '../../hooks/useFinance';

// ===================================================================
// KONSTANTA & HELPERS
// ===================================================================
const EXPENSE_CATEGORIES = [
  'Bahan Bakar & Transportasi', 'Bengkel & Suku Cadang',
  'Sewa Tempat / Garasi', 'Gaji & Honor Karyawan',
  'Utilitas (Listrik, Air, Internet)', 'Marketing & Promosi',
  'Perlengkapan Kantor', 'Asuransi', 'Pajak & Perizinan', 'Lain-lain'
];

const MOTOR_OPTIONS = [
  'Yamaha NMAX 155', 'Honda Vario 125', 'Honda PCX 160',
  'Yamaha Aerox 155', 'Honda Beat', 'Vespa Sprint 150',
  'Honda ADV 160', 'Yamaha Mio', 'Honda Scoopy', 'Honda Stylo'
];

const PIE_COLORS = ['#78081C', '#BE123C', '#f43f5e', '#fb7185', '#fda4af'];

const formatShortRupiah = (val) => {
  if (!val) return 'Rp 0';
  if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(1)}M`;
  if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}Jt`;
  if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}Rb`;
  return `Rp ${val}`;
};

const CustomTooltip = ({ active, payload, label, formatRupiah }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 text-sm">
      <p className="font-black text-slate-300 text-[10px] uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.name !== 'Transaksi'
            ? formatRupiah(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

// ===================================================================
// SUB-KOMPONEN: STAT CARD
// ===================================================================
const StatCard = ({ label, value, sub, icon: Icon, trend, trendVal, color = 'rose', small = false }) => {
  const colorMap = {
    rose: 'bg-rose-50 text-rose-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-50 text-slate-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={18} />
        </div>
      </div>
      <div>
        <div className={`font-black text-slate-900 ${small ? 'text-xl' : 'text-2xl'} tracking-tight leading-none`}>
          {value}
        </div>
        {sub && <p className="text-[11px] text-slate-400 font-medium mt-1">{sub}</p>}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-[11px] font-bold ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trendVal || trend)}% vs bulan lalu
        </div>
      )}
    </div>
  );
};

// ===================================================================
// TAB: OVERVIEW
// ===================================================================
const OverviewTab = ({ summary, dailyRevenue, monthlyRevenue, breakdown, profitLoss, formatRupiah }) => {
  const pieData = breakdown.by_type?.map(t => ({
    name: t.item_type === 'motor' ? 'Rental Motor' : 'Smart Loker',
    value: t.revenue
  })) || [];

  const plChartData = profitLoss.map(p => ({
    bulan: p.period?.slice(5) || p.period,
    Pendapatan: p.income,
    Pengeluaran: p.expenses,
    Profit: p.profit
  }));

  return (
    <div className="space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pendapatan Bersih"
          value={formatShortRupiah(summary?.net_revenue)}
          sub="Setelah pengeluaran"
          icon={TrendingUp}
          color="green"
          trend={12}
        />
        <StatCard
          label="Pendapatan Kotor"
          value={formatShortRupiah(summary?.gross_revenue)}
          sub="Booking + POS tunai"
          icon={DollarSign}
          color="rose"
          trend={8}
        />
        <StatCard
          label="Total Pengeluaran"
          value={formatShortRupiah(summary?.total_expenses)}
          sub="Operasional bulan ini"
          icon={TrendingDown}
          color="amber"
        />
        <StatCard
          label="Rata-rata Booking"
          value={formatShortRupiah(summary?.average_order_value)}
          sub={`${summary?.booking_count || 0} transaksi`}
          icon={ShoppingCart}
          color="blue"
        />
      </div>

      {/* Revenue Area Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-black text-slate-900 text-lg">Tren Pendapatan Harian</h3>
            <p className="text-slate-500 text-xs font-medium mt-0.5">30 hari terakhir</p>
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg">
            30 Hari
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={dailyRevenue}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#78081C" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#78081C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
              tickFormatter={(v) => v?.slice(5)} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
              tickFormatter={(v) => formatShortRupiah(v)} width={60} />
            <Tooltip content={<CustomTooltip formatRupiah={formatRupiah} />} />
            <Area type="monotone" dataKey="revenue" name="Pendapatan" stroke="#78081C" strokeWidth={2.5}
              fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: '#78081C' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* P&L Chart + Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-black text-slate-900 text-base mb-1">Laporan Laba Rugi</h3>
          <p className="text-slate-400 text-xs font-medium mb-5">6 bulan terakhir</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={plChartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="bulan" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                tickFormatter={(v) => formatShortRupiah(v)} width={58} />
              <Tooltip content={<CustomTooltip formatRupiah={formatRupiah} />} />
              <Bar dataKey="Pendapatan" fill="#78081C" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pengeluaran" fill="#fda4af" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3 justify-center">
            {[['#78081C', 'Pendapatan'], ['#fda4af', 'Pengeluaran'], ['#10b981', 'Profit']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                <div className="w-3 h-3 rounded-sm" style={{ background: c }}></div>{l}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-black text-slate-900 text-base mb-1">Sumber Pendapatan</h3>
          <p className="text-slate-400 text-xs font-medium mb-4">Bulan ini</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={75}
                  dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatRupiah(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-slate-300 text-sm">
              Belum ada data
            </div>
          )}
          <div className="space-y-2 mt-3">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: PIE_COLORS[i] }}></div>
                  <span className="text-slate-600">{d.name}</span>
                </div>
                <span className="text-slate-900">{formatShortRupiah(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===================================================================
// TAB: FLEET ANALYTICS
// ===================================================================
const FleetTab = ({ fleetPerformance, formatRupiah }) => {
  const motors = fleetPerformance.motors || [];
  const maxBookings = Math.max(...motors.map(m => m.total_bookings), 1);

  const getPerformanceLabel = (idx, total) => {
    if (idx === 0) return { label: '🔥 Paling Laris', color: 'bg-rose-100 text-rose-700' };
    if (idx === total - 1 && total > 1) return { label: '🐢 Slow Mover', color: 'bg-slate-100 text-slate-500' };
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Unit Paling Laris" value={motors[0]?.item_name?.split(' ').slice(0, 2).join(' ') || '-'}
          sub={`${motors[0]?.total_bookings || 0} booking`} icon={Target} color="rose" small />
        <StatCard label="Total Hari Tersewa" value={`${motors.reduce((a, m) => a + (m.total_days_rented || 0), 0)} Hari`}
          sub="Seluruh armada motor" icon={CalendarRange} color="blue" small />
        <StatCard label="Revenue Armada" value={formatShortRupiah(motors.reduce((a, m) => a + m.total_revenue, 0))}
          sub="30 hari terakhir" icon={Banknote} color="green" small />
      </div>

      {/* Fleet Bar Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-black text-slate-900 text-base mb-1">Performa per Unit Armada</h3>
        <p className="text-slate-400 text-xs font-medium mb-5">Berdasarkan jumlah booking — 30 hari terakhir</p>
        {motors.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(motors.length * 48, 200)}>
            <BarChart data={motors} layout="vertical" barCategoryGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="item_name" width={160} tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip formatRupiah={formatRupiah} />} />
              <Bar dataKey="total_bookings" name="Booking" radius={[0, 6, 6, 0]}
                background={{ fill: '#f8fafc', radius: [0, 6, 6, 0] }}>
                {motors.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#78081C' : i === motors.length - 1 ? '#cbd5e1' : `hsl(${355 - i * 25}, ${70 - i * 5}%, ${30 + i * 8}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-16 text-center text-slate-400 font-medium">Belum ada data booking armada.</div>
        )}
      </div>

      {/* Fleet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {motors.map((m, i) => {
          const badge = getPerformanceLabel(i, motors.length);
          const pct = Math.round((m.total_bookings / maxBookings) * 100);
          return (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-black text-slate-900 text-sm">{m.item_name}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Motor</p>
                </div>
                {badge && (
                  <span className={`text-[9px] font-black uppercase tracking-wide px-2 py-1 rounded-lg ${badge.color}`}>
                    {badge.label}
                  </span>
                )}
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>{m.total_bookings} Booking</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: i === 0 ? '#78081C' : i === motors.length - 1 ? '#cbd5e1' : '#f43f5e' }}></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-50">
                <div>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Revenue</p>
                  <p className="font-black text-slate-900 text-sm">{formatShortRupiah(m.total_revenue)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Hari Tersewa</p>
                  <p className="font-black text-slate-900 text-sm">{m.total_days_rented || 0} Hari</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {motors.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-400 font-medium">
          Belum ada data booking armada untuk periode ini.
        </div>
      )}
    </div>
  );
};

// ===================================================================
// TAB: POS (Point of Sale)
// ===================================================================
const POSTab = ({ posTransactions, createPosTransaction, formatRupiah, formatDate }) => {
  const [showForm, setShowForm] = useState(false);
  const [showReceipt, setShowReceipt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', item_type: 'motor',
    item_name: '', duration_days: 1, price_per_day: '',
    payment_method: 'cash', notes: ''
  });

  const totalAmount = (parseInt(form.price_per_day) || 0) * (parseInt(form.duration_days) || 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await createPosTransaction(form);
    if (result) {
      setShowReceipt({ ...form, ...result, total_amount: result.total_amount });
      setForm({ customer_name: '', customer_phone: '', item_type: 'motor', item_name: '', duration_days: 1, price_per_day: '', payment_method: 'cash', notes: '' });
      setShowForm(false);
    }
    setIsSubmitting(false);
  };

  const PAYMENT_ICONS = { cash: '💵', transfer: '🏦', qris: '📱', card: '💳' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-slate-900 text-lg">Point of Sale</h2>
          <p className="text-slate-500 text-xs font-medium mt-0.5">Catat transaksi tunai / manual tanpa booking online</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-slate-900 text-white px-5 py-3 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-rose-600 transition-all shadow-lg active:scale-95">
          <Plus size={18} /> Transaksi Baru
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Transaksi', value: posTransactions.length, icon: Receipt, color: 'rose' },
          { label: 'Revenue POS', value: formatShortRupiah(posTransactions.reduce((a, t) => a + t.total_amount, 0)), icon: Banknote, color: 'green' },
          { label: 'Rata-rata Nilai', value: formatShortRupiah(posTransactions.length ? Math.round(posTransactions.reduce((a, t) => a + t.total_amount, 0) / posTransactions.length) : 0), icon: Target, color: 'blue' },
          { label: 'Transaksi Cash', value: posTransactions.filter(t => t.payment_method === 'cash').length, icon: Wallet, color: 'amber' },
        ].map((s, i) => (
          <StatCard key={i} label={s.label} value={s.value} icon={s.icon} color={s.color} small />
        ))}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="font-black text-slate-700 text-sm uppercase tracking-wider">Riwayat Transaksi POS</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{posTransactions.length} Record</span>
        </div>
        {posTransactions.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-medium">Belum ada transaksi POS.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-slate-50 text-[10px] text-slate-500 font-black uppercase tracking-widest border-b border-slate-100">
                <tr>
                  {['Order ID', 'Pelanggan', 'Item', 'Durasi', 'Total', 'Bayar', 'Tanggal', 'Aksi'].map(h => (
                    <th key={h} className="px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {posTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-bold text-slate-500">{t.order_id}</td>
                    <td className="px-5 py-3">
                      <p className="font-bold text-slate-900 text-xs">{t.customer_name}</p>
                      <p className="text-[10px] text-slate-400">{t.customer_phone}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-bold text-slate-800 text-xs">{t.item_name}</p>
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-black uppercase">{t.item_type}</span>
                    </td>
                    <td className="px-5 py-3 text-xs font-bold text-slate-600">{t.duration_days} Hari</td>
                    <td className="px-5 py-3 font-black text-slate-900 text-sm">{formatShortRupiah(t.total_amount)}</td>
                    <td className="px-5 py-3">
                      <span className="text-sm">{PAYMENT_ICONS[t.payment_method] || '💰'}</span>
                      <span className="text-[10px] font-bold text-slate-500 ml-1 uppercase">{t.payment_method}</span>
                    </td>
                    <td className="px-5 py-3 text-[11px] text-slate-400 font-medium">{formatDate(t.created_at)}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => setShowReceipt(t)}
                        className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors" title="Lihat Struk">
                        <Receipt size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* POS Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
              <h3 className="font-black text-lg flex items-center gap-2"><ShoppingCart size={20} className="text-rose-400" /> Transaksi POS Baru</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label-style">Nama Pelanggan</label>
                  <input type="text" required value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })}
                    className="input-style" placeholder="Nama lengkap pelanggan" />
                </div>
                <div>
                  <label className="label-style">No. WhatsApp</label>
                  <input type="text" value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })}
                    className="input-style" placeholder="08xx-xxxx-xxxx" />
                </div>
                <div>
                  <label className="label-style">Tipe Item</label>
                  <select value={form.item_type} onChange={e => setForm({ ...form, item_type: e.target.value, item_name: '' })}
                    className="input-style appearance-none">
                    <option value="motor">Motor</option>
                    <option value="locker">Loker</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label-style">Nama Item / Unit</label>
                  {form.item_type === 'motor' ? (
                    <select value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })}
                      required className="input-style appearance-none">
                      <option value="">— Pilih Motor —</option>
                      {MOTOR_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  ) : (
                    <input type="text" required value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })}
                      className="input-style" placeholder="Nama item / unit" />
                  )}
                </div>
                <div>
                  <label className="label-style">Harga per Hari (Rp)</label>
                  <input type="number" required min="1000" value={form.price_per_day} onChange={e => setForm({ ...form, price_per_day: e.target.value })}
                    className="input-style font-mono" placeholder="75000" />
                </div>
                <div>
                  <label className="label-style">Durasi (Hari)</label>
                  <input type="number" required min="1" value={form.duration_days} onChange={e => setForm({ ...form, duration_days: e.target.value })}
                    className="input-style font-mono" />
                </div>
                <div>
                  <label className="label-style">Metode Pembayaran</label>
                  <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}
                    className="input-style appearance-none">
                    <option value="cash">💵 Tunai (Cash)</option>
                    <option value="transfer">🏦 Transfer Bank</option>
                    <option value="qris">📱 QRIS</option>
                    <option value="card">💳 Kartu</option>
                  </select>
                </div>
                <div>
                  <label className="label-style">Total Pembayaran</label>
                  <div className="input-style bg-rose-50 border-rose-200 font-black text-rose-700 text-lg">
                    {totalAmount > 0 ? `Rp ${totalAmount.toLocaleString('id-ID')}` : '—'}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="label-style">Catatan (Opsional)</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="input-style resize-none h-20" placeholder="Keterangan tambahan..." />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting || !totalAmount}
                className="w-full bg-slate-900 hover:bg-rose-600 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg active:scale-95">
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Receipt size={18} />}
                {isSubmitting ? 'Memproses...' : `Catat & Cetak Struk — Rp ${totalAmount.toLocaleString('id-ID')}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-black text-base flex items-center gap-2"><Receipt size={18} className="text-rose-400" /> Struk Pembayaran</h3>
              <button onClick={() => setShowReceipt(null)}><X size={20} className="text-slate-400 hover:text-white" /></button>
            </div>
            <div className="p-6 font-mono text-sm">
              <div className="text-center mb-5">
                <p className="font-black text-2xl text-slate-900 tracking-tight">BrotherTrans</p>
                <p className="text-slate-400 text-xs mt-0.5">Struk Resmi Transaksi</p>
                <div className="border-t-2 border-dashed border-slate-200 my-4"></div>
              </div>
              {[
                ['Order ID', showReceipt.order_id],
                ['Tanggal', formatDate(showReceipt.created_at || new Date().toISOString())],
                ['Pelanggan', showReceipt.customer_name],
                ['HP/WA', showReceipt.customer_phone || '-'],
                ['Item', showReceipt.item_name],
                ['Durasi', `${showReceipt.duration_days} Hari`],
                ['Harga/Hari', formatRupiah(showReceipt.price_per_day)],
                ['Bayar Via', (PAYMENT_ICONS[showReceipt.payment_method] || '💰') + ' ' + (showReceipt.payment_method || 'cash').toUpperCase()],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 text-xs">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-bold text-slate-900 text-right max-w-[55%]">{v}</span>
                </div>
              ))}
              <div className="border-t-2 border-dashed border-slate-200 my-4"></div>
              <div className="flex justify-between items-center">
                <span className="font-black text-slate-700 uppercase tracking-wide text-xs">TOTAL</span>
                <span className="font-black text-rose-600 text-xl">{formatRupiah(showReceipt.total_amount)}</span>
              </div>
              <div className="mt-5 text-center text-slate-400 text-[10px]">
                <p>Terima kasih telah menggunakan</p>
                <p className="font-bold">Brother Trans — Jogja & Solo</p>
              </div>
            </div>
            <div className="px-6 pb-5">
              <button onClick={() => window.print()}
                className="w-full py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-rose-600 transition-all text-sm flex items-center justify-center gap-2">
                <Download size={16} /> Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`.label-style{display:block;font-size:10px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px}.input-style{width:100%;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;font-size:13px;font-weight:600;color:#0f172a;outline:none;transition:all 0.2s}.input-style:focus{border-color:#78081C;box-shadow:0 0 0 2px rgba(120,8,28,0.08)}`}</style>
    </div>
  );
};

// ===================================================================
// TAB: ACCOUNTING (Pengeluaran + P&L)
// ===================================================================
const AccountingTab = ({ expenses, addExpense, deleteExpense, profitLoss, formatRupiah, formatDate }) => {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ category: EXPENSE_CATEGORIES[0], description: '', amount: '', date: new Date().toISOString().slice(0, 10) });

  const totalExpense = expenses.reduce((a, e) => a + e.amount, 0);
  const expenseByCategory = EXPENSE_CATEGORIES.map(cat => ({
    name: cat.split(' ').slice(0, 2).join(' '),
    fullName: cat,
    value: expenses.filter(e => e.category === cat).reduce((a, e) => a + e.amount, 0)
  })).filter(c => c.value > 0).sort((a, b) => b.value - a.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const ok = await addExpense(form);
    if (ok) {
      setForm({ category: EXPENSE_CATEGORIES[0], description: '', amount: '', date: new Date().toISOString().slice(0, 10) });
      setShowForm(false);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-slate-900 text-lg">Akuntansi & Pengeluaran</h2>
          <p className="text-slate-500 text-xs font-medium">Catat biaya operasional untuk laporan laba rugi yang akurat</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-slate-900 text-white px-5 py-3 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-rose-600 transition-all shadow-lg active:scale-95">
          <Plus size={18} /> Catat Pengeluaran
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Pengeluaran" value={formatShortRupiah(totalExpense)} sub="Semua kategori" icon={TrendingDown} color="rose" small />
        <StatCard label="Terbesar" value={expenseByCategory[0]?.name || '-'} sub={formatShortRupiah(expenseByCategory[0]?.value)} icon={AlertCircle} color="amber" small />
        <StatCard label="Jumlah Entri" value={expenses.length} sub="Catatan pengeluaran" icon={FileText} color="blue" small />
        <StatCard label="Rata-rata/Entri" value={formatShortRupiah(expenses.length ? Math.round(totalExpense / expenses.length) : 0)} sub="Per transaksi" icon={Target} color="slate" small />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense by Category Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-black text-slate-900 text-base mb-4">Pengeluaran per Kategori</h3>
          {expenseByCategory.length > 0 ? (
            <div className="space-y-3">
              {expenseByCategory.slice(0, 6).map((c, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                    <span className="truncate max-w-[60%]">{c.name}</span>
                    <span>{formatShortRupiah(c.value)}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${Math.round((c.value / (expenseByCategory[0]?.value || 1)) * 100)}%`,
                      background: PIE_COLORS[i % PIE_COLORS.length]
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-300 text-sm">Belum ada data</div>
          )}
        </div>

        {/* Expense List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="font-black text-slate-700 text-xs uppercase tracking-widest">Catatan Pengeluaran</span>
          </div>

          {/* Inline Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="p-4 border-b border-slate-100 bg-rose-50/30">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="col-span-2">
                  <select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-rose-500 focus:outline-none appearance-none">
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <input type="text" required placeholder="Deskripsi pengeluaran" value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-rose-500 focus:outline-none" />
                </div>
                <div>
                  <input type="number" required placeholder="Jumlah (Rp)" min="1000" value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:border-rose-500 focus:outline-none" />
                </div>
                <div>
                  <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-rose-500 focus:outline-none" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={isSubmitting}
                    className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl text-xs font-black hover:bg-rose-600 transition-colors flex items-center justify-center gap-1">
                    {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Simpan
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-3 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50">
                    Batal
                  </button>
                </div>
              </div>
            </form>
          )}

          {expenses.length === 0 ? (
            <div className="py-14 text-center text-slate-400 font-medium text-sm">Belum ada catatan pengeluaran.</div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
              {expenses.map((e) => (
                <div key={e.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wide">{e.category?.split(' ').slice(0, 2).join(' ')}</span>
                    </div>
                    <p className="font-bold text-slate-900 text-xs mt-0.5 truncate">{e.description}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{formatDate(e.date)}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="font-black text-slate-900 text-sm whitespace-nowrap">{formatShortRupiah(e.amount)}</span>
                    <button onClick={() => deleteExpense(e.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ===================================================================
// TAB: PIUTANG (Receivables)
// ===================================================================
const ReceivablesTab = ({ receivables, formatRupiah, formatDate }) => {
  const totalReceivables = receivables.reduce((a, r) => a + r.total_price, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Piutang" value={formatShortRupiah(totalReceivables)} sub="Belum terbayar" icon={AlertCircle} color="amber" small />
        <StatCard label="Jumlah Tagihan" value={receivables.length} sub="Transaksi belum lunas" icon={FileText} color="rose" small />
        <StatCard label="Rata-rata Tagihan" value={formatShortRupiah(receivables.length ? Math.round(totalReceivables / receivables.length) : 0)} sub="Per transaksi" icon={Target} color="blue" small />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-amber-50/50 flex items-center gap-2">
          <AlertCircle size={16} className="text-amber-500" />
          <span className="font-black text-slate-700 text-xs uppercase tracking-widest">Tagihan Belum Lunas (AR)</span>
        </div>
        {receivables.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
            <p className="font-bold text-slate-500">Semua tagihan telah dilunasi!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-slate-50 text-[10px] text-slate-500 font-black uppercase tracking-widest border-b border-slate-100">
                <tr>
                  {['Order ID', 'Pelanggan', 'Item', 'Tagihan', 'Tgl Sewa', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {receivables.map((r) => (
                  <tr key={r.order_id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-bold text-slate-500">{r.order_id}</td>
                    <td className="px-5 py-3">
                      <p className="font-bold text-slate-900 text-xs">{r.user_name}</p>
                      <p className="text-[10px] text-slate-400">{r.user_phone}</p>
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-700 text-xs">{r.item_name}</td>
                    <td className="px-5 py-3 font-black text-amber-600 text-sm">{formatShortRupiah(r.total_price)}</td>
                    <td className="px-5 py-3 text-[11px] text-slate-400 font-medium">{formatDate(r.start_date)}</td>
                    <td className="px-5 py-3">
                      <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wide">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ===================================================================
// MAIN COMPONENT
// ===================================================================
export default function AdminFinance() {
  const finance = useFinance();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart2 },
    { key: 'fleet', label: 'Analitik Armada', icon: Bike },
    { key: 'pos', label: 'POS Kasir', icon: ShoppingCart },
    { key: 'accounting', label: 'Pembukuan', icon: FileText },
    { key: 'receivables', label: 'Piutang (AR)', icon: AlertCircle },
  ];

  const PERIOD_OPTIONS = [
    { val: 'today', label: 'Hari ini' },
    { val: 'week', label: '7 Hari' },
    { val: 'month', label: '30 Hari' },
    { val: 'year', label: '1 Tahun' },
  ];

  if (finance.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-rose-500">
        <Loader2 size={48} className="animate-spin mb-4" />
        <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Memuat Data Keuangan...</p>
      </div>
    );
  }

  return (
    <div className="pb-16 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className="text-rose-500" /> Finance Dashboard
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            POS · Laporan · Analitik Armada · Pembukuan · Piutang
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Filter */}
          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {PERIOD_OPTIONS.map(p => (
              <button key={p.val} onClick={() => finance.setPeriod(p.val)}
                className={`px-4 py-2.5 text-xs font-black transition-all ${finance.period === p.val
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-50'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={finance.refresh}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 shadow-sm transition-colors"
            title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Quick KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 mb-8">
        {[
          { l: 'Revenue Bersih', v: formatShortRupiah(finance.summary?.net_revenue), icon: TrendingUp, c: '#10b981' },
          { l: 'Total Booking', v: finance.summary?.booking_count || 0, icon: ShoppingCart, c: '#78081C' },
          { l: 'POS Tunai', v: formatShortRupiah(finance.summary?.pos_revenue), icon: Banknote, c: '#f59e0b' },
          { l: 'Pengeluaran', v: formatShortRupiah(finance.summary?.total_expenses), icon: TrendingDown, c: '#ef4444' },
          { l: 'Piutang', v: finance.receivables.length + ' Tagihan', icon: AlertCircle, c: '#8b5cf6' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: k.c + '15' }}>
              <k.icon size={16} style={{ color: k.c }} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{k.l}</p>
              <p className="font-black text-slate-900 text-sm truncate">{k.v}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto bg-white border border-slate-200 rounded-2xl p-1.5 mb-8 gap-1 shadow-sm scrollbar-hide">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black transition-all ${activeTab === t.key
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
              <Icon size={16} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <OverviewTab
            summary={finance.summary}
            dailyRevenue={finance.dailyRevenue}
            monthlyRevenue={finance.monthlyRevenue}
            breakdown={finance.breakdown}
            profitLoss={finance.profitLoss}
            formatRupiah={finance.formatRupiah}
          />
        )}
        {activeTab === 'fleet' && (
          <FleetTab
            fleetPerformance={finance.fleetPerformance}
            formatRupiah={finance.formatRupiah}
          />
        )}
        {activeTab === 'pos' && (
          <POSTab
            posTransactions={finance.posTransactions}
            createPosTransaction={finance.createPosTransaction}
            formatRupiah={finance.formatRupiah}
            formatDate={finance.formatDate}
          />
        )}
        {activeTab === 'accounting' && (
          <AccountingTab
            expenses={finance.expenses}
            addExpense={finance.addExpense}
            deleteExpense={finance.deleteExpense}
            profitLoss={finance.profitLoss}
            formatRupiah={finance.formatRupiah}
            formatDate={finance.formatDate}
          />
        )}
        {activeTab === 'receivables' && (
          <ReceivablesTab
            receivables={finance.receivables}
            formatRupiah={finance.formatRupiah}
            formatDate={finance.formatDate}
          />
        )}
      </div>
    </div>
  );
}
