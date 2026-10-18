import {
  Search, Download, CreditCard, Smartphone,
  Edit, Trash2, X, Save, Loader2, CreditCard as CardIcon,
  Banknote, Building2, RefreshCw, Receipt, Utensils
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import api from '../../services/api';
import { toast } from 'sonner';
import { useConfirm } from '../../components/ConfirmProvider';
import { usePermissions } from '../../hooks/usePermissions';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PaymentRow {
  id: number;
  sourceType: 'reservation' | 'sale' | 'journal';
  sourceId: number;
  refno: string;         // e.g. Res refno or Sale prefix
  guestName: string;
  roomNumber?: string;
  amount: number;
  method: string;
  bankId?: number | null;
  transactionId?: string;
  note?: string;
  date: string;
  status: string;
  resStatus?: string;
  refundedAmount?: number;
}

interface Bank { id: number; bankName: string; }

const EMPTY_FORM = {
  method: 'cash',
  amount: '',
  bankId: '',
  transactionId: '',
  note: '',
  date: new Date().toISOString().split('T')[0],
};

const METHOD_OPTIONS = ['cash', 'bank', 'card'];

const methodMeta: Record<string, { color: string; icon: React.ReactNode }> = {
  cash: { color: 'bg-emerald-100 text-emerald-700', icon: <Banknote size={13} /> },
  bank: { color: 'bg-orange-100 text-orange-700', icon: <Building2 size={13} /> },
  card: { color: 'bg-blue-100 text-blue-700', icon: <CreditCard size={13} /> },
  cheque: { color: 'bg-purple-100 text-purple-700', icon: <Receipt size={13} /> },
  online: { color: 'bg-pink-100 text-pink-700', icon: <Smartphone size={13} /> },
};

const inputCls = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]';

// ─── Component ────────────────────────────────────────────────────────────────
export function Payments() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [customDate, setCustomDate] = useState({ from: '', to: '' });
  const [banks, setBanks] = useState<Bank[]>([]);

  // Edit modal state
  const [editTarget, setEditTarget] = useState<PaymentRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const { user, canEdit, canDelete, canEditOrDelete } = usePermissions();

  const { confirm } = useConfirm();

  // ── Fetch banks ─────────────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/banks').then(r => setBanks(r.data?.data || r.data || [])).catch(() => { });
  }, []);

  // ── Fetch all payments ──────────────────────────────────────────────────────
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const [resData, saleData, journalData] = await Promise.allSettled([
        api.get('/reservation', { params: { limit: 500, page: 1 } }),
        api.get('/sales'),
        api.get('/income/journal')
      ]);

      const rows: PaymentRow[] = [];

      // — Reservations —
      if (resData.status === 'fulfilled') {
        const reservations = resData.value.data?.data || resData.value.data || [];
        for (const res of reservations) {
          const payments = res.payments || [];
          const resRefund = Number(res.refundedAmount || 0);

          const roomStr = Array.isArray(res.rooms) && res.rooms.length > 0
            ? res.rooms.map((r: any) => r.roomNo || r.roomNumber || r.name).filter(Boolean).join(', ')
            : (res.roomNo || res.roomNumber || '');

          if (payments.length > 0) {
            payments.forEach((p: any, idx: number) => {
              rows.push({
                id: p.id,
                sourceType: 'reservation',
                sourceId: res.id,
                refno: res.refno || `RES-${res.id}`,
                guestName: res.customer?.name || res.customerName || 'Guest',
                roomNumber: roomStr,
                amount: Number(p.amount || 0),
                method: (p.method || 'cash').toLowerCase(),
                bankId: p.bankId,
                transactionId: p.transactionId,
                note: p.note,
                date: p.date || p.createdAt || '',
                status: res.status === 'cancelled' ? 'cancelled' : (p.status || 'paid'),
                resStatus: res.status,
                refundedAmount: idx === 0 ? resRefund : 0,
              });
            });
          } else if (resRefund > 0 || res.status === 'cancelled') {
            // Include cancelled / refunded reservation even if no advance payment entry exists
            rows.push({
              id: res.id,
              sourceType: 'reservation',
              sourceId: res.id,
              refno: res.refno || `RES-${res.id}`,
              guestName: res.customer?.name || res.customerName || 'Guest',
              roomNumber: roomStr,
              amount: 0,
              method: 'cash',
              date: res.updatedAt || res.createdAt || '',
              status: 'cancelled',
              resStatus: res.status,
              refundedAmount: resRefund,
            });
          }
        }
      }

      // — Sales —
      if (saleData.status === 'fulfilled') {
        const sales = saleData.value.data?.data || saleData.value.data || [];
        for (const sale of sales) {
          const payments = sale.payments || [];
          const resRooms = sale.Reservation?.rooms && Array.isArray(sale.Reservation.rooms)
            ? sale.Reservation.rooms.map((r: any) => r.roomNo || r.roomNumber || r.name).filter(Boolean).join(', ')
            : '';
          const roomStr = sale.roomNumber || resRooms || (sale.tableNumber ? `Table ${sale.tableNumber}` : '');

          for (const p of payments) {
            rows.push({
              id: p.id,
              sourceType: 'sale',
              sourceId: sale.id,
              refno: sale.prefix || sale.Reservation?.refno || `SL-${sale.id}`,
              guestName: sale.customerName || sale.customer?.name || 'Walk-in',
              roomNumber: roomStr,
              amount: Number(p.amount || 0),
              method: (p.method || 'cash').toLowerCase(),
              bankId: p.bankId,
              transactionId: p.transactionId,
              note: p.note,
              date: p.date || p.createdAt || '',
              status: p.status || 'paid',
              resStatus: sale.Reservation?.status || '',
              refundedAmount: 0,
            });
          }
        }
      }

      // — Journal Entries —
      if (journalData.status === 'fulfilled') {
        const journals = journalData.value.data?.data || journalData.value.data || [];
        for (const j of journals) {
          if (j.type === 'income') {
            rows.push({
              id: j.id,
              sourceType: 'journal',
              sourceId: j.id,
              refno: `JNL-${j.id}`,
              guestName: j.category || 'Manual Entry',
              roomNumber: '',
              amount: Number(j.amount || 0),
              method: (j.method || 'cash').toLowerCase(),
              bankId: j.bankId,
              transactionId: undefined,
              note: j.description,
              date: j.date || j.createdAt || '',
              status: 'paid',
            });
          }
        }
      }

      // Sort by date desc
      rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPayments(rows);
    } catch (err) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  // ── Filtered data ───────────────────────────────────────────────────────────
  const selectedDate = (() => {
    const today = new Date();
    if (dateFilter === 'yesterday') {
      const yest = new Date();
      yest.setDate(today.getDate() - 1);
      const yDate = yest.toISOString().split('T')[0];
      return { from: yDate, to: yDate };
    }
    if (dateFilter === 'week') {
      const start = new Date();
      start.setDate(today.getDate() - today.getDay());
      return {
        from: start.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
      };
    }
    if (dateFilter === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        from: start.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
      };
    }
    if (dateFilter === 'custom' && customDate.from && customDate.to) {
      return { from: customDate.from, to: customDate.to };
    }
    if (dateFilter === 'all') {
      return { from: '', to: '' };
    }
    const formatted = today.toISOString().split('T')[0];
    return { from: formatted, to: formatted };
  })();

  const filtered = payments.filter(p => {
    if (methodFilter !== 'all' && p.method !== methodFilter) return false;
    if (typeFilter !== 'all' && p.sourceType !== typeFilter) return false;
    if (dateFilter !== 'all' && selectedDate.from && selectedDate.to) {
      const pDate = p.date.split('T')[0];
      if (pDate < selectedDate.from || pDate > selectedDate.to) return false;
    }
    return true;
  });

  // ── Stats ───────────────────────────────────────────────────────────────────
  const totalAmount = filtered.reduce((s, p) => s + p.amount, 0);
  const resTotal = filtered.filter(p => p.sourceType === 'reservation').reduce((s, p) => s + p.amount, 0);
  const saleTotal = filtered.filter(p => p.sourceType === 'sale').reduce((s, p) => s + p.amount, 0);
  const journalTotal = filtered.filter(p => p.sourceType === 'journal').reduce((s, p) => s + p.amount, 0);
  const refundTotal = filtered.reduce((s, p) => s + Number(p.refundedAmount || 0), 0);
  const otherTotal = filtered.filter(p => p.sourceType !== 'reservation' && p.sourceType !== 'sale' && p.sourceType !== 'journal').reduce((s, p) => s + p.amount, 0);

  // ── Open edit modal ─────────────────────────────────────────────────────────
  const openEdit = (row: PaymentRow) => {
    setEditTarget(row);
    setForm({
      method: row.method,
      amount: String(row.amount),
      bankId: row.bankId ? String(row.bankId) : '',
      transactionId: row.transactionId || '',
      note: row.note || '',
      date: row.date ? row.date.split('T')[0] : new Date().toISOString().split('T')[0],
    });
  };

  // ── Save edit ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!editTarget) return;
    const amt = Number(form.amount);
    if (!amt || amt <= 0) { toast.error('Amount must be greater than 0'); return; }

    setSaving(true);
    try {
      const payload: any = {
        method: form.method,
        amount: amt,
        transactionId: form.transactionId || undefined,
        note: form.note || undefined,
        date: form.date,
        bankId: form.bankId ? Number(form.bankId) : null,
      };

      if (editTarget.sourceType === 'reservation') {
        // PUT /reservation/:reservationId/payment/:paymentId
        await api.put(`/reservation/${editTarget.sourceId}/payment/${editTarget.id}`, payload);
      } else if (editTarget.sourceType === 'sale') {
        // PUT /sales/:id/payment/:paymentId
        await api.put(`/sales/${editTarget.sourceId}/payment/${editTarget.id}`, payload);
      } else {
        toast.error('Editing manual journal entry payments is not supported here');
        setSaving(false);
        return;
      }

      toast.success('Payment updated successfully');
      setEditTarget(null);
      fetchPayments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update payment');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (row: PaymentRow) => {
    const ok = await confirm({
      title: 'Delete Payment Record',
      message: `Are you sure you want to delete this PKR ${row.amount.toLocaleString()} payment? This will update the reservation/sale balance.`,
      confirmText: 'Delete',
      confirmVariant: 'danger',
    });
    if (!ok) return;

    try {
      if (row.sourceType === 'reservation') {
        await api.delete(`/reservation/${row.sourceId}/payment/${row.id}`);
      } else if (row.sourceType === 'sale') {
        await api.delete(`/sales/${row.sourceId}/payment/${row.id}`);
      } else {
        toast.error('Deleting manual journal payments is not supported here');
        return;
      }
      toast.success('Payment deleted');
      fetchPayments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete payment');
    }
  };

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns: Column<PaymentRow>[] = [
    {
      header: 'Reference',
      accessorKey: 'refno',
      sortable: true,
      cell: (p) => (
        <div>
          <span className="text-sm font-semibold text-[#1D4ED8]">{p.refno}</span>
          <div className="mt-0.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${p.sourceType === 'reservation'
                ? 'bg-indigo-100 text-indigo-700'
                : p.sourceType === 'sale'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-700'
              }`}>
              {p.sourceType === 'reservation' ? '🏨 Booking' : p.sourceType === 'sale' ? '🛒 Sale' : '📔 Journal'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Guest / Customer',
      accessorKey: 'guestName',
      sortable: true,
      cell: (p) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#7C3AED] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{p.guestName.slice(0, 2).toUpperCase()}</span>
          </div>
          <span className="text-sm font-medium text-gray-900">{p.guestName}</span>
        </div>
      ),
    },
    {
      header: 'Room',
      accessorKey: 'roomNumber',
      sortable: true,
      cell: (p) => {
        if (!p.roomNumber || !p.roomNumber.trim()) {
          return <span className="text-xs text-gray-400 font-mono">—</span>;
        }
        const rawVal = p.roomNumber.trim();
        const isTable = rawVal.toLowerCase().includes('table');

        if (isTable) {
          const tblName = rawVal.replace(/table/gi, '').trim();
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs">
              <Utensils size={12} className="text-amber-600 flex-shrink-0" />
              <span>Table {tblName || rawVal}</span>
            </span>
          );
        }

        const roomList = rawVal
          .replace(/rooms?/gi, '')
          .split(/[,&]+/)
          .map((r) => r.trim())
          .filter(Boolean);

        if (roomList.length === 0) {
          return <span className="text-xs text-gray-400 font-mono">—</span>;
        }

        if (roomList.length === 1) {
          return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200/80">
              Rm {roomList[0]}
            </span>
          );
        }

        return (
          <div className="flex items-center gap-1 flex-wrap max-w-[220px]">
            {roomList.map((rm, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80"
              >
                Rm {rm}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      sortable: true,
      cell: (p) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-900">
            PKR {Number(p.amount).toLocaleString()}
          </span>
          {Boolean(p.refundedAmount && p.refundedAmount > 0) && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md mt-0.5 w-max">
              <span>Refund: PKR {Number(p.refundedAmount).toLocaleString()}</span>
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Method',
      accessorKey: 'method',
      sortable: true,
      cell: (p) => {
        const meta = methodMeta[p.method] || methodMeta['cash'];
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${meta.color}`}>
            {meta.icon}{p.method}
          </span>
        );
      },
    },
    {
      header: 'Date',
      accessorKey: 'date',
      sortable: true,
      cell: (p) => (
        <div>
          <div className="text-sm text-gray-900">
            {p.date ? new Date(p.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
          </div>
          {p.transactionId && (
            <div className="text-xs text-gray-400 font-mono mt-0.5 truncate max-w-[120px]">{p.transactionId}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (p) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${p.status === 'paid' ? 'bg-green-100 text-green-700' :
            p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
          }`}>
          {p.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (p) => {
        const isNonAdmin = user?.role?.toLowerCase() !== 'admin';
        const isRestrictedStatus = p.resStatus === 'checked_out' || p.resStatus === 'cancelled';
        const hideActions = isNonAdmin && isRestrictedStatus;

        return (
          <div className="flex items-center gap-1">
            {canEdit && !hideActions && (
              <button
                onClick={() => openEdit(p)}
                className="p-1.5 text-gray-400 hover:text-[#1D4ED8] hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit payment"
              >
                <Edit size={14} />
              </button>
            )}
            {canDelete && !hideActions && (
              <button
                onClick={() => handleDelete(p)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete payment"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // ── Summary Cards ───────────────────────────────────────────────────────────
  const stats = [
    { label: 'Total Collected', value: totalAmount, color: 'from-[#1D4ED8] to-[#3B82F6]', text: 'white', sub: `${filtered.length} transactions` },
    { label: 'Booking', value: resTotal, color: 'from-indigo-500 to-indigo-600', text: 'white', sub: `${filtered.filter(p => p.sourceType === 'reservation').length} txns` },
    { label: 'Manual Journal', value: journalTotal, color: 'from-slate-500 to-slate-600', text: 'white', sub: `${filtered.filter(p => p.sourceType === 'journal').length} txns` },
    { label: 'POS', value: saleTotal, color: 'from-amber-500 to-amber-600', text: 'white', sub: `${filtered.filter(p => p.sourceType === 'sale').length} txns` },
    { label: 'Total Refunded', value: refundTotal, color: 'from-rose-500 to-red-600', text: 'white', sub: `${filtered.filter(p => Number(p.refundedAmount) > 0).length} refunds` },
    { label: 'Other Payment', value: otherTotal, color: 'from-emerald-500 to-emerald-600', text: 'white', sub: `${filtered.filter(p => p.sourceType !== 'reservation' && p.sourceType !== 'sale' && p.sourceType !== 'journal').length} txns` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Payments</h1>
          <p className="text-gray-600 mt-1">All incoming payments from bookings, sales and manual journals</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPayments}
            disabled={loading}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-5 text-white`}>
            <div className="text-sm text-white/80">{s.label}</div>
            {loading ? (
              <div className="h-8 bg-white/20 rounded-lg animate-pulse mt-2" />
            ) : (
              <div className="text-2xl font-bold mt-1">PKR {s.value.toLocaleString()}</div>
            )}
            <div className="text-xs text-white/70 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search reference, guest, room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customDate.from}
                onChange={(e) => setCustomDate(prev => ({ ...prev, from: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={customDate.to}
                onChange={(e) => setCustomDate(prev => ({ ...prev, to: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>
          )}

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
          >
            <option value="all">All Methods</option>
            {METHOD_OPTIONS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
          >
            <option value="all">All Types</option>
            <option value="reservation">Booking Payments</option>
            <option value="sale">Sale Payments</option>
            <option value="journal">Manual Journals</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        searchQuery={search}
        searchKeys={['refno', 'guestName', 'roomNumber', 'transactionId']}
        pageSize={15}
        loading={loading}
      />

      {/* ── Edit Payment Modal ─────────────────────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A]">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CardIcon size={18} /> Edit Payment
                </h2>
                <p className="text-white/60 text-xs mt-0.5">
                  {editTarget.sourceType === 'reservation' ? '🏨 Booking' : editTarget.sourceType === 'sale' ? '🛒 Sale' : '📔 Journal'} — {editTarget.refno} · {editTarget.guestName} {editTarget.roomNumber ? `· (${editTarget.roomNumber.toLowerCase().includes('table') || editTarget.roomNumber.toLowerCase().includes('room') ? editTarget.roomNumber : `Room ${editTarget.roomNumber}`})` : ''}
                </p>
              </div>
              <button
                onClick={() => setEditTarget(null)}
                className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Info banner for reservation */}
              {editTarget.sourceType === 'reservation' && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2.5 text-xs text-indigo-700 font-medium">
                  ℹ️ This is a <strong>reservation payment</strong>. Editing will recalculate the booking balance automatically.
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">PKR</span>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                    placeholder="0"
                    min={1}
                  />
                </div>
              </div>

              {/* Method */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Payment Method</label>
                <div className="grid grid-cols-5 gap-2">
                  {METHOD_OPTIONS.map(m => {
                    const meta = methodMeta[m] || methodMeta['cash'];
                    const isSelected = form.method === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, method: m, bankId: m !== 'bank' && m !== 'card' ? '' : f.bankId }))}
                        className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg border-2 text-xs font-semibold transition-all ${isSelected
                            ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {meta.icon}
                        <span className="capitalize">{m}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bank selector (visible for bank/card) */}
              {(form.method === 'bank' || form.method === 'card' || form.method === 'cheque') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bank Account</label>
                  <select
                    value={form.bankId}
                    onChange={e => setForm(f => ({ ...f, bankId: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">— Select Bank —</option>
                    {banks.map(b => (
                      <option key={b.id} value={b.id}>{b.bankName}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Transaction ID & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Transaction ID</label>
                  <input
                    type="text"
                    value={form.transactionId}
                    onChange={e => setForm(f => ({ ...f, transactionId: e.target.value }))}
                    className={inputCls}
                    placeholder="TXN123..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Note</label>
                <textarea
                  rows={2}
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  className={inputCls}
                  placeholder="Optional note..."
                />
              </div>

              {/* Footer buttons */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1D4ED8] text-white py-2.5 rounded-lg hover:bg-[#1E40AF] transition-colors disabled:opacity-60 font-medium text-sm"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {saving ? 'Saving...' : 'Update Payment'}
                </button>
                <button
                  onClick={() => setEditTarget(null)}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
