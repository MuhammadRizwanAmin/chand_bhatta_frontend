import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Eye, Trash2, RefreshCw, Search, Receipt,
  CheckCircle2, Clock, AlertCircle, Wallet, X, Building2, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

import { billService } from '../../services/billService';
import { DataTable } from '../../components/DataTable';

interface Bill {
  id: number;
  billDate: string;
  grandTotal: number;
  paidAmount: number;
  balanceAmount?: number;
  status: string;
  returnStatus?: string;
  refundAmount?: number;
  supplierId: number;
  supplier?: { name: string };
}

interface Bank { id: number; bankName: string; accountTitle: string; }

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  UNPAID:         { label: 'Unpaid',         className: 'bg-gray-100 text-gray-600 border border-gray-200',     icon: <Clock size={12} /> },
  PARTIALLY_PAID: { label: 'Partial',        className: 'bg-amber-100 text-amber-700 border border-amber-200',  icon: <AlertCircle size={12} /> },
  PAID:           { label: 'Paid',           className: 'bg-emerald-100 text-emerald-700 border border-emerald-200', icon: <CheckCircle2 size={12} /> },
};

const PAYMENT_METHODS = [
  { label: 'Cash',          value: 'Cash' },
  { label: 'Card',          value: 'card' },
  { label: 'Bank Transfer', value: 'bank' },
  { label: 'Cheque',        value: 'Cheque' },
  { label: 'Online',        value: 'Online' },
];

export function PurchaseBillsList() {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Delete modal
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Payment modal
  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: '',
    bankId: '',
    referenceNo: '',
    amountPaid: '',
    paymentDate: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await billService.getBills();
      const data = res.data || res;
      setBills(Array.isArray(data) ? [...data].reverse() : []);
    } catch {
      toast.error('Failed to fetch purchase bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
    billService.getBanks().then(data => setBanks(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  // ─── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selectedId) return;
    setDeleting(true);
    try {
      await billService.deleteBill(selectedId);
      toast.success('Bill deleted successfully');
      setBills(prev => prev.filter(b => b.id !== selectedId));
      setDeleteModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete bill');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Payment Submit ──────────────────────────────────────────────────────
  const openPaymentModal = (bill: Bill) => {
    setSelectedBill(bill);
    const balance = bill.grandTotal - (bill.paidAmount || 0);
    setPaymentForm({
      paymentMethod: '',
      bankId: '',
      referenceNo: '',
      amountPaid: balance > 0 ? balance.toFixed(2) : '',
      paymentDate: new Date().toISOString().split('T')[0],
      remarks: '',
    });
    setPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (!paymentForm.paymentMethod || !paymentForm.amountPaid) {
      toast.error('Payment method and amount are required');
      return;
    }
    setPaymentLoading(true);
    try {
      await billService.addPayment({
        purchaseBillId: selectedBill!.id,
        supplierId: selectedBill!.supplierId,
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        bankId: (paymentForm.paymentMethod === 'bank' || paymentForm.paymentMethod === 'card') ? paymentForm.bankId || null : null,
        referenceNo: paymentForm.referenceNo,
        amountPaid: parseFloat(paymentForm.amountPaid),
        remarks: paymentForm.remarks,
      });
      toast.success('Payment recorded successfully!');
      setPaymentModal(false);
      fetchBills();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  // ─── Filtering ───────────────────────────────────────────────────────────
  const filtered = bills.filter(b => {
    const matchSearch = (b.supplier?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toString().includes(searchTerm);
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // ─── Stats ───────────────────────────────────────────────────────────────
  const totalBalance = bills.reduce((s, b) => s + (b.grandTotal - (b.paidAmount || 0)), 0);

  // ─── Columns ─────────────────────────────────────────────────────────────
  const columns = [
    {
      header: '#',
      cell: (row: Bill) => {
        const rowIndex = filtered.findIndex((bill) => bill.id === row.id);
        return (
          <span  onClick={() => navigate(`/finance/bills/view/${row.id}`)} className="cursor-pointer font-medium text-[#1D4ED8]">
            PB-{rowIndex >= 0 ? rowIndex + 1 : '-'}
          </span>
        );
      },
    },
    {
      header: 'Supplier',
      cell: (row: Bill) => <span className="font-medium text-gray-900">{row.supplier?.name || '—'}</span>,
    },
    {
      header: 'Bill Date',
      cell: (row: Bill) => <span className="text-sm text-gray-600">{new Date(row.billDate).toLocaleDateString()}</span>,
    },
    {
      header: 'Grand Total',
      cell: (row: Bill) => <span className="font-semibold text-gray-900">₨ {Number(row.grandTotal || 0).toLocaleString()}</span>,
    },
    {
      header: 'Balance',
      cell: (row: Bill) => {
        const balance = Number(row.grandTotal || 0) - Number(row.paidAmount || 0);
        return (
          <span className={`font-bold ${balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            ₨ {balance.toLocaleString()}
          </span>
        );
      },
    },
    {
      header: 'Status',
      cell: (row: Bill) => {
        const cfg = statusConfig[row.status] || { label: row.status, className: 'bg-gray-100 text-gray-600 border border-gray-200', icon: null };
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.className}`}>
            {cfg.icon} {cfg.label}
          </span>
        );
      },
    },
    {
      header: 'Return',
      cell: (row: Bill) => {
        if (!row.returnStatus || row.returnStatus === 'None') return <span className="text-gray-300 text-xs">—</span>;
        const cfg = row.returnStatus === 'Full'
          ? 'bg-red-100 text-red-700 border border-red-200'
          : 'bg-orange-100 text-orange-700 border border-orange-200';
        return (
          <div className="flex flex-col gap-0.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg}`}>
              <RotateCcw size={10} /> {row.returnStatus}
            </span>
            {Number(row.refundAmount || 0) > 0 && (
              <span className="text-xs text-orange-600 font-semibold">₨ {Number(row.refundAmount).toLocaleString()}</span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Actions',
      cell: (row: Bill) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/finance/bills/view/${row.id}`)}
            className="p-1.5 text-gray-500 hover:text-[#1D4ED8] hover:bg-blue-50 rounded-lg transition-colors"
            title="View"
          >
            <Eye size={16} />
          </button>
          {row.status !== 'PAID' && (
            <button
              onClick={() => openPaymentModal(row)}
              className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Add Payment"
            >
              <Wallet size={16} />
            </button>
          )}
          <button
            onClick={() => { setSelectedId(row.id); setDeleteModal(true); }}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Purchase Bills</h1>
          <p className="text-gray-600 mt-1">Track and manage supplier bills and payments</p>
        </div>
        <button
          onClick={fetchBills}
          disabled={loading}
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-[#1D4ED8]">
          <div className="text-gray-500 text-sm font-medium mb-1">Total Bills</div>
          <div className="text-3xl font-bold text-[#0F172A]">{loading ? '...' : bills.length}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-emerald-500">
          <div className="text-gray-500 text-sm font-medium mb-1">Paid</div>
          <div className="text-3xl font-bold text-emerald-600">{loading ? '...' : bills.filter(b => b.status === 'PAID').length}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-red-500">
          <div className="text-gray-500 text-sm font-medium mb-1">Total Outstanding</div>
          <div className="text-2xl font-bold text-red-600">{loading ? '...' : `₨ ${totalBalance.toLocaleString()}`}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-orange-500">
          <div className="text-gray-500 text-sm font-medium mb-1">Total Refunded</div>
          <div className="text-2xl font-bold text-orange-600">
            {loading ? '...' : `₨ ${bills.reduce((s, b) => s + Number(b.refundAmount || 0), 0).toLocaleString()}`}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by supplier or bill number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="sm:w-48 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <RefreshCw className="animate-spin mb-4 text-[#1D4ED8]" size={32} />
            <p>Loading bills...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Receipt size={48} className="mb-4 opacity-40" />
            <p className="font-semibold text-gray-600">No Bills Found</p>
            <p className="text-sm mt-1">Bills are generated from approved Purchase Orders.</p>
          </div>
        ) : (
          <DataTable columns={columns} data={filtered} pageSize={10} searchable={false} />
        )}
      </div>

      {/* ─── Payment Modal ────────────────────────────────────────────────── */}
      {paymentModal && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">Add Payment</h2>
                <p className="text-sm text-gray-500">{selectedBill.supplier?.name}</p>
              </div>
              <button onClick={() => setPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Bill Summary Strip */}
            <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex flex-wrap gap-4 text-sm">
              <span><span className="text-gray-500">Bill #</span> <span className="font-bold">{selectedBill.id}</span></span>
              <span><span className="text-gray-500">Total:</span> <span className="font-bold">₨ {selectedBill.grandTotal?.toLocaleString()}</span></span>
              <span><span className="text-gray-500">Balance:</span> <span className="font-bold text-red-600">₨ {(selectedBill.grandTotal - (selectedBill.paidAmount || 0)).toLocaleString()}</span></span>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Payment Method *</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={e => setPaymentForm(p => ({ ...p, paymentMethod: e.target.value, bankId: '' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  >
                    <option value="">Select Method</option>
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Payment Date</label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={e => setPaymentForm(p => ({ ...p, paymentDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>

                {(paymentForm.paymentMethod === 'bank' || paymentForm.paymentMethod === 'card') && (
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <Building2 size={12} /> Select Bank
                    </label>
                    <select
                      value={paymentForm.bankId}
                      onChange={e => setPaymentForm(p => ({ ...p, bankId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                    >
                      <option value="">Select Bank Account</option>
                      {banks.map(b => (
                        <option key={b.id} value={b.id}>{b.bankName} — {b.accountTitle}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Amount Paid *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentForm.amountPaid}
                    onChange={e => setPaymentForm(p => ({ ...p, amountPaid: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                    placeholder="0.00"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Reference No</label>
                  <input
                    type="text"
                    value={paymentForm.referenceNo}
                    onChange={e => setPaymentForm(p => ({ ...p, referenceNo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                    placeholder="e.g. TXN12345"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Remarks</label>
                  <textarea
                    rows={2}
                    value={paymentForm.remarks}
                    onChange={e => setPaymentForm(p => ({ ...p, remarks: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] resize-none"
                    placeholder="Optional note..."
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setPaymentModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentSubmit}
                disabled={paymentLoading}
                className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {paymentLoading ? <RefreshCw size={16} className="animate-spin" /> : <Wallet size={16} />}
                {paymentLoading ? 'Saving...' : 'Save Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Modal ─────────────────────────────────────────────────── */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mx-auto mb-4">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-center text-gray-900 mb-1">Delete Bill</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to delete this bill? This action <strong>cannot be undone</strong>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deleting ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
