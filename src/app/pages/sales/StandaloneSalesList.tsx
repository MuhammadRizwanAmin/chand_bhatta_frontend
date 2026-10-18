import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, RefreshCw, Calendar, Filter, Edit, Trash2, X, Save, Loader2, Banknote, Building2, CreditCard, Receipt, Smartphone } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';

import { DataTable, Column } from '../../components/DataTable';
import { useConfirm } from '../../components/ConfirmProvider';
import { Sale } from './types';
import { SalesActionMenu } from './SalesActionMenu';
import { ViewSaleModal } from './ViewSaleModal';
import { salesService } from '../../services/sales/salesService';

// ─── Constants ────────────────────────────────────────────────────────────────
const paymentColors: Record<string, string> = {
  Paid:    'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Partial: 'bg-orange-100 text-orange-700',
  BTR:     'bg-purple-100 text-purple-700',
};

const kitchenColors: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  ready:     'bg-green-100 text-green-700',
  served:    'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

const methodMeta: Record<string, { color: string; icon: React.ReactNode }> = {
  cash:   { color: 'bg-emerald-100 text-emerald-700', icon: <Banknote size={13} /> },
  bank:   { color: 'bg-orange-100 text-orange-700',   icon: <Building2 size={13} /> },
  card:   { color: 'bg-blue-100 text-blue-700',       icon: <CreditCard size={13} /> },
  cheque: { color: 'bg-purple-100 text-purple-700',   icon: <Receipt size={13} /> },
  online: { color: 'bg-pink-100 text-pink-700',       icon: <Smartphone size={13} /> },
};

const METHOD_OPTIONS = ['cash', 'bank', 'card', 'cheque', 'online'];
const DATE_PRESETS = [
  { label: 'Today',      getValue: () => { const d = today(); return { s: d, e: d }; } },
  { label: 'Yesterday',  getValue: () => { const d = daysAgo(1); return { s: d, e: d }; } },
  { label: 'This Week',  getValue: () => ({ s: startOfWeek(), e: today() }) },
  { label: 'This Month', getValue: () => ({ s: startOfMonth(), e: today() }) },
  { label: 'Last Month', getValue: () => lastMonth() },
];

function today() { return new Date().toISOString().split('T')[0]; }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; }
function startOfWeek() { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().split('T')[0]; }
function startOfMonth() { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; }
function lastMonth() {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1);
  const s = d.toISOString().split('T')[0];
  const e = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  return { s, e };
}

const inputCls = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]';

// ─── Payment type ─────────────────────────────────────────────────────────────
interface Payment { id: number; method: string; amount: number; bankId?: number; transactionId?: string; note?: string; date?: string; }
interface Bank { id: number; bankName: string; accountTitle?: string; }

// ─── Component ────────────────────────────────────────────────────────────────
export default function StandaloneSalesList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { confirm } = useConfirm();

  // Data
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);

  // Filters — default to today so daily view is always shown first
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [returnFilter, setReturnFilter] = useState(false);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [activePreset, setActivePreset] = useState('Today');

  // View modal
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Edit payment modal
  const [editPayment, setEditPayment] = useState<{ payment: Payment; sale: Sale } | null>(null);
  const [editForm, setEditForm] = useState({ method: 'cash', amount: '', bankId: '', transactionId: '', note: '', date: today() });
  const [saving, setSaving] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate)   params.endDate   = endDate;
      if (statusFilter !== 'All') params.status = statusFilter;
      const response = await salesService.getAll(params);
      setSales(response.data || []);
    } catch {
      toast.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Apply today filter if navigated from POS with ?today=1
  useEffect(() => {
    if (searchParams.get('today') === '1') {
      const t = today();
      setStartDate(t);
      setEndDate(t);
      setActivePreset('Today');
    }
  }, [searchParams]);

  // Load banks once
  useEffect(() => {
    salesService.getBanks().then(setBanks).catch(() => {});
  }, []);

  // ── Date preset ───────────────────────────────────────────────────────────────
  const applyPreset = (preset: typeof DATE_PRESETS[0]) => {
    const { s, e } = preset.getValue();
    setStartDate(s); setEndDate(e); setActivePreset(preset.label);
  };
  const clearDates = () => { setStartDate(''); setEndDate(''); setActivePreset(''); };

  // ── Delete sale ───────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Delete Sale', message: 'Are you sure? This cannot be undone.' });
    if (!ok) return;
    try {
      await salesService.deleteSale(id);
      toast.success('Sale deleted');
      fetchData();
    } catch { toast.error('Failed to delete sale'); }
  };

  // ── Delete payment ────────────────────────────────────────────────────────────
  const handleDeletePayment = async (sale: Sale, payment: Payment) => {
    const ok = await confirm({ title: 'Delete Payment', message: `Delete PKR ${Number(payment.amount).toLocaleString()} payment?` });
    if (!ok) return;
    try {
      await salesService.deletePayment(sale.id, payment.id);
      toast.success('Payment deleted');
      fetchData();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to delete payment'); }
  };

  // ── Open edit payment ─────────────────────────────────────────────────────────
  const openEditPayment = (sale: Sale, payment: Payment) => {
    setEditPayment({ payment, sale });
    setEditForm({
      method:        payment.method || 'cash',
      amount:        String(payment.amount),
      bankId:        payment.bankId ? String(payment.bankId) : '',
      transactionId: payment.transactionId || '',
      note:          payment.note || '',
      date:          payment.date ? payment.date.split('T')[0] : today(),
    });
  };

  // ── Save edit payment ─────────────────────────────────────────────────────────
  const handleSavePayment = async () => {
    if (!editPayment) return;
    const amt = Number(editForm.amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    setSaving(true);
    try {
      await salesService.editPayment(editPayment.sale.id, editPayment.payment.id, {
        method: editForm.method,
        amount: amt,
        bankId: editForm.bankId ? Number(editForm.bankId) : null,
        transactionId: editForm.transactionId || undefined,
        note: editForm.note || undefined,
        date: editForm.date,
      });
      toast.success('Payment updated');
      setEditPayment(null);
      fetchData();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to update payment'); }
    finally { setSaving(false); }
  };

  // ── Client-side search filter ─────────────────────────────────────────────────
  const filtered = sales.filter(s => {
    const q = search.toLowerCase();
    const cName = s.customerName || s.Reservation?.customer?.name || '';
    const cPhone = s.customerPhone || s.Reservation?.customer?.phone || '';
    const matchSearch = !q || cName.toLowerCase().includes(q) || s.prefix?.toLowerCase().includes(q) || cPhone.includes(q);
    const matchReturn = !returnFilter || (s.returnStatus && s.returnStatus !== 'None');
    return matchSearch && matchReturn;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const totalRevenue   = filtered.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
  const totalReceived  = filtered.reduce((sum, s) => sum + Number(s.advancePaid || 0), 0);
  const totalBalance   = filtered.reduce((sum, s) => sum + Number(s.balanceAmount || 0), 0);
  const totalRefunded  = filtered.reduce((sum, s) => sum + Number(s.refundAmount || 0), 0);
  const paidCount      = filtered.filter(s => s.paymentStatus === 'Paid' || Number(s.balanceAmount || 0) <= 0).length;

  // ── Columns ───────────────────────────────────────────────────────────────────
  const columns: Column<Sale>[] = [
    {
      header: 'Sale ID', accessorKey: 'prefix', sortable: true,
      cell: (s) => (
        <span 
          className="font-semibold text-[#1D4ED8] text-sm cursor-pointer hover:underline"
          onClick={() => { setSelectedSale(s); setViewModalOpen(true); }}
        >
          {s.prefix}
        </span>
      ),
    },
    {
      header: 'Customer', accessorKey: 'customerName', sortable: true,
      cell: (s) => {
        const cName = s.customerName || s.Reservation?.customer?.name || 'Walk-in';
        const cPhone = s.customerPhone || s.Reservation?.customer?.phone;
        return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#7C3AED] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{cName === 'Walk-in' ? 'WI' : cName.slice(0,2).toUpperCase()}</span>
          </div>
          <div>
            <div className="font-medium text-sm text-gray-900">{cName}</div>
            {cPhone && <div className="text-xs text-gray-400">{cPhone}</div>}
            {s.reservationId && (
              <span className="text-xs text-indigo-600 font-medium">Res #{s.Reservation?.refno || s.reservationId}</span>
            )}
          </div>
        </div>
      )},
    },
    {
      header: 'Total', accessorKey: 'totalAmount', sortable: true,
      cell: (s) => <span className="font-bold text-gray-900">PKR {Number(s.totalAmount || 0).toLocaleString()}</span>,
    },
    {
      header: 'Tax', accessorKey: 'taxAmount',
      cell: (s) => <span className="text-sm text-gray-600">{Number(s.taxAmount) > 0 ? `PKR ${Number(s.taxAmount).toLocaleString()} ${Number(s.taxPercentage) > 0 ? `(${s.taxPercentage}%)` : ''}` : '—'}</span>,
    },
    {
      header: 'Paid',
      cell: (s) => <span className="text-sm text-green-700 font-medium">PKR {Number(s.advancePaid || 0).toLocaleString()}</span>,
    },
    {
      header: 'Refunded',
      cell: (s) => (
        <span className={`text-sm font-medium ${Number(s.refundAmount) > 0 ? 'text-red-600' : 'text-gray-300'}`}>
          {Number(s.refundAmount) > 0 ? `PKR ${Number(s.refundAmount).toLocaleString()}` : '—'}
        </span>
      ),
    },
    {
      header: 'Balance',
      cell: (s) => (
        <span className={`text-sm font-medium ${Number(s.balanceAmount) > 0 ? 'text-red-600' : 'text-gray-400'}`}>
          PKR {Number(s.balanceAmount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (s) => {
        const st = s.paymentStatus || (Number(s.balanceAmount) <= 0 ? 'Paid' : (Number(s.advancePaid) > 0 ? 'Partial' : 'Pending'));
        return (
        <div className="flex flex-col gap-1 items-start">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${paymentColors[st] || 'bg-gray-100 text-gray-700'}`}>
              {st}
            </span>
            {s.reservationId && (
              <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200" title={`Billed to Room / Res #${s.Reservation?.refno || s.reservationId}`}>
                BTR
              </span>
            )}
          </div>
          {s.returnStatus && s.returnStatus !== 'None' && (
            <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
              {s.returnStatus === 'Full' ? 'Fully Returned' : 'Partial Return'}
            </span>
          )}
        </div>
      )},
    },
    {
      header: 'Kitchen',
      cell: (s) => {
        const st = s.kitchenOrder?.status;
        return st
          ? <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${kitchenColors[st] || ''}`}>{st}</span>
          : <span className="text-gray-300 text-sm">—</span>;
      },
    },
    {
      header: 'Date', accessorKey: 'createdAt', sortable: true,
      cell: (s) => (
        <span className="text-xs text-gray-600">
          {new Date(s.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (s) => (
        <SalesActionMenu
          sale={s}
          onView={(d) => { setSelectedSale(d); setViewModalOpen(true); }}
          onDelete={handleDelete}
          onPaymentSuccess={fetchData}
          onReturnSuccess={fetchData}
          onEditPayment={(payment) => openEditPayment(s, payment)}
          onDeletePayment={(payment) => handleDeletePayment(s, payment)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Standard Sales History</h1>
          <p className="text-gray-600 mt-1">All independent POS sales and linked reservation extras</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} disabled={loading} className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => navigate('/pos')} className="flex items-center gap-2 bg-[#1D4ED8] text-white px-5 py-2.5 rounded-lg hover:bg-[#1E40AF] transition-colors font-medium">
            <Plus size={18} /> New POS Sale
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Revenue',   value: totalRevenue,  color: 'from-[#1D4ED8] to-[#3B82F6]' },
          { label: 'Total Received',  value: totalReceived, color: 'from-emerald-500 to-emerald-600' },
          { label: 'Outstanding',     value: totalBalance,  color: 'from-rose-500 to-rose-600' },
          { label: 'Total Refunded',  value: totalRefunded, color: 'from-orange-500 to-orange-600' },
          { label: 'Paid Sales',      value: paidCount,     color: 'from-violet-500 to-violet-600', isCount: true },
        ].map(c => (
          <div key={c.label} className={`bg-gradient-to-br ${c.color} rounded-xl p-5 text-white`}>
            <div className="text-sm text-white/80">{c.label}</div>
            {loading
              ? <div className="h-7 bg-white/20 rounded-lg animate-pulse mt-2" />
              : <div className="text-2xl font-bold mt-1">{c.isCount ? c.value : `PKR ${Number(c.value).toLocaleString()}`}</div>
            }
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3 border border-gray-100">
        {/* Date Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <Calendar size={15} className="text-gray-400" />
          {DATE_PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium border transition-colors ${
                activePreset === p.label
                  ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                  : 'border-gray-200 text-gray-600 hover:border-[#1D4ED8] hover:text-[#1D4ED8]'
              }`}
            >
              {p.label}
            </button>
          ))}
          {(startDate || endDate) && (
            <button onClick={clearDates} className="px-3 py-1.5 text-xs rounded-lg font-medium border border-red-200 text-red-600 hover:bg-red-50">
              Clear Dates
            </button>
          )}
        </div>

        {/* Search + custom date + status */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search customer or sale ID..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-gray-400 shrink-0" />
            <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setActivePreset(''); }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
            <span className="text-gray-400 text-sm">to</span>
            <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setActivePreset(''); }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Partial">Partial</option>
          </select>
          <button
            onClick={() => setReturnFilter(r => !r)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              returnFilter
                ? 'bg-red-600 text-white border-red-600'
                : 'border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600'
            }`}
          >
            {returnFilter ? <X size={13} /> : <Filter size={13} />}
            Returns Only
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filtered} pageSize={15} loading={loading} />

      {/* View Modal */}
      <ViewSaleModal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} sale={selectedSale} />

      {/* Edit Payment Modal */}
      {editPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A]">
              <div>
                <h2 className="text-lg font-semibold text-white">Edit Payment</h2>
                <p className="text-white/60 text-xs mt-0.5">{editPayment.sale.prefix} · {editPayment.sale.customerName || 'Walk-in'}</p>
              </div>
              <button onClick={() => setEditPayment(null)} className="p-2 text-gray-400 hover:text-white rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">PKR</span>
                  <input type="number" value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" placeholder="0" min={1} />
                </div>
              </div>
              {/* Method */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Method</label>
                <div className="grid grid-cols-5 gap-2">
                  {METHOD_OPTIONS.map(m => {
                    const meta = methodMeta[m] || methodMeta['cash'];
                    const sel = editForm.method === m;
                    return (
                      <button key={m} type="button" onClick={() => setEditForm(f => ({ ...f, method: m, bankId: !['bank','card','cheque'].includes(m) ? '' : f.bankId }))}
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all ${sel ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                        {meta.icon}<span className="capitalize">{m}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Bank */}
              {['bank','card','cheque'].includes(editForm.method) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bank Account</label>
                  <select value={editForm.bankId} onChange={e => setEditForm(f => ({ ...f, bankId: e.target.value }))} className={inputCls}>
                    <option value="">— Select Bank —</option>
                    {banks.map(b => <option key={b.id} value={b.id}>{b.bankName}{b.accountTitle ? ` (${b.accountTitle})` : ''}</option>)}
                  </select>
                </div>
              )}
              {/* TXN + Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Transaction ID</label>
                  <input type="text" value={editForm.transactionId} onChange={e => setEditForm(f => ({ ...f, transactionId: e.target.value }))} className={inputCls} placeholder="TXN123..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date</label>
                  <input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
                </div>
              </div>
              {/* Note */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Note</label>
                <textarea rows={2} value={editForm.note} onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))} className={inputCls} placeholder="Optional..." />
              </div>
              {/* Buttons */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button onClick={handleSavePayment} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1D4ED8] text-white py-2.5 rounded-lg hover:bg-[#1E40AF] transition-colors disabled:opacity-60 font-medium text-sm">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {saving ? 'Saving...' : 'Update Payment'}
                </button>
                <button onClick={() => setEditPayment(null)} className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}