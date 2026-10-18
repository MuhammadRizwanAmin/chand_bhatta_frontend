import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  ArrowLeft, Phone, Mail, MapPin, Building2, Receipt,
  FileText, ShoppingCart, Clock, FileWarning, Calendar,
  Download, FileSpreadsheet, X, BookOpen,
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DateRangeFilter, DateRange } from '../../components/DateRangeFilter';

export default function ViewSupplier() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'bills' | 'items' | 'ledger'>('overview');

  // Global date filter state
  const [globalDateRange, setGlobalDateRange] = useState<DateRange>({ startDate: '', endDate: '' });

  // Opening Balance Payment state
  const [showOpeningBalanceModal, setShowOpeningBalanceModal] = useState(false);
  const [banksList, setBanksList] = useState<any[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [obPaymentForm, setObPaymentForm] = useState({
    amount: '',
    paymentMethod: 'cash',
    bankId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    remarks: '',
  });
  const [submittingOB, setSubmittingOB] = useState(false);

  useEffect(() => {
    if (showOpeningBalanceModal) {
      setBanksLoading(true);
      api.get('/banks')
        .then(res => setBanksList(res.data || []))
        .catch(() => setBanksList([]))
        .finally(() => setBanksLoading(false));
    }
  }, [showOpeningBalanceModal]);



  useEffect(() => {
    if (id) fetchSupplier();
  }, [id]);

  const fetchSupplier = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/suppliers/${id}`);
      setSupplier(response.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load supplier details');
    } finally {
      setLoading(false);
    }
  };

  const handleOpeningBalancePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obPaymentForm.amount || Number(obPaymentForm.amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    const openingBalanceRemaining = Number(supplier.openingBalance || 0) - Number(supplier.paidOpeningBalance || 0);
    if (Number(obPaymentForm.amount) > openingBalanceRemaining) {
      toast.error(`Amount cannot exceed remaining balance (PKR ${openingBalanceRemaining})`);
      return;
    }

    setSubmittingOB(true);
    try {
      await api.post('/purchasepayment', {
        supplierId: supplier.id,
        amountPaid: Number(obPaymentForm.amount),
        paymentMethod: obPaymentForm.paymentMethod,
        paymentDate: obPaymentForm.paymentDate,
        remarks: obPaymentForm.remarks,
        isOpeningBalance: true,
        bankId: obPaymentForm.bankId || undefined
      });
      toast.success('Opening balance paid successfully');
      setShowOpeningBalanceModal(false);
      setObPaymentForm({
        amount: '',
        paymentMethod: 'cash',
        bankId: '',
        paymentDate: new Date().toISOString().split('T')[0],
        remarks: '',
      });
      fetchSupplier();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmittingOB(false);
    }
  };

  // Filtered bills based on date range
  const filteredBills = useMemo(() => {
    if (!supplier?.purchaseBills) return [];
    return supplier.purchaseBills
      .filter((b: any) => {
        const billDate = new Date(b.billDate);
        if (globalDateRange.startDate && billDate < new Date(globalDateRange.startDate)) return false;
        if (globalDateRange.endDate && billDate > new Date(globalDateRange.endDate + 'T23:59:59')) return false;
        return true;
      });
  }, [supplier, globalDateRange]);

  const filteredPurchaseOrders = useMemo(() => {
    if (!supplier?.purchaseOrders) return [];
    return supplier.purchaseOrders.filter((po: any) => {
      const poDate = new Date(po.orderDate);
      if (globalDateRange.startDate && poDate < new Date(globalDateRange.startDate)) return false;
      if (globalDateRange.endDate && poDate > new Date(globalDateRange.endDate + 'T23:59:59')) return false;
      return true;
    });
  }, [supplier, globalDateRange]);

  // Filtered summary stats for visible bills
  const filteredBillTotal = useMemo(
    () => filteredBills.reduce((s: number, b: any) => s + Number(b.grandTotal || 0), 0),
    [filteredBills]
  );
  const filteredBillPaid = useMemo(
    () => filteredBills.reduce((s: number, b: any) => s + Number(b.paidAmount || 0), 0),
    [filteredBills]
  );
  const filteredBillBalance = filteredBillTotal - filteredBillPaid;

  // ─── Ledger computation ──────────────────────────────────────────────────
  const ledgerEntries = useMemo(() => {
    if (!supplier) return [];
    
    let entries: any[] = [];
    
    // 1. Opening Balance
    const ob = Number(supplier.openingBalance || 0);
    if (ob > 0) {
      entries.push({
        id: 'ob',
        date: supplier.createdAt,
        particulars: 'Opening Balance',
        debit: 0,
        credit: ob,
        balance: 0,
        isOpening: true
      });
    }

    // 2. Bills and Payments
    if (supplier.purchaseBills) {
      supplier.purchaseBills.forEach((b: any) => {
        const grandTotal = Number(b.grandTotal || 0);
        const paidAmount = Number(b.paidAmount || 0);
        const date = b.billDate;
        const poText = b.purchaseOrderId ? `PO#${b.purchaseOrderId}` : `Bill#${b.id}`;

        // Add bill (purchase increases what we owe -> credit)
        if (grandTotal > 0) {
           entries.push({
              id: `bill-${b.id}`,
              date: date,
              particulars: `Purchase Bill for ${poText}`,
              debit: 0,
              credit: grandTotal,
              balance: 0
           });
        }

        // Add payment (payment decreases what we owe -> debit)
        if (paidAmount > 0) {
           entries.push({
              id: `pay-${b.id}`,
              date: date, // Using billDate since actual payment date isn't directly available here
              particulars: `Payment for Bill (${poText})`,
              debit: paidAmount,
              credit: 0,
              balance: 0
           });
        }
      });
    }

    // 3. Opening Balance Payments
    if (supplier.payments) {
      supplier.payments.forEach((payment: any) => {
        if (payment.isOpeningBalance && Number(payment.amountPaid) > 0) {
          entries.push({
            id: `pay-ob-${payment.id}`,
            date: payment.paymentDate,
            particulars: `Opening Balance Payment`,
            debit: Number(payment.amountPaid),
            credit: 0,
            balance: 0
          });
        }
      });
    }

    // Sort entries by date
    entries.sort((a, b) => {
       if (a.isOpening) return -1;
       if (b.isOpening) return 1;
       return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // Recalculate running balance
    let currentBalance = 0;
    entries = entries.map(entry => {
       currentBalance += (entry.credit - entry.debit);
       return { ...entry, balance: currentBalance };
    });

    return entries;
  }, [supplier]);

  const filteredLedgerEntries = useMemo(() => {
    return ledgerEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      if (globalDateRange.startDate && entryDate < new Date(globalDateRange.startDate)) return false;
      if (globalDateRange.endDate && entryDate > new Date(globalDateRange.endDate + 'T23:59:59')) return false;
      return true;
    });
  }, [ledgerEntries, globalDateRange]);

  const ledgerTotalDebit = filteredLedgerEntries.reduce((s, e) => s + e.debit, 0);
  const ledgerTotalCredit = filteredLedgerEntries.reduce((s, e) => s + e.credit, 0);
  const ledgerClosingBalance = filteredLedgerEntries.length > 0 ? filteredLedgerEntries[filteredLedgerEntries.length - 1].balance : 0;


  // ─── Export helpers ───────────────────────────────────────────────────────
  const exportExcel = () => {
    if (!filteredBills.length) { toast.error('No bills to export'); return; }
    const rows = filteredBills.map((b: any, i: number) => {
      return {
        '#': i + 1,
        'Bill Date': new Date(b.billDate).toLocaleDateString(),
        'Order ID': b.purchaseOrderId ? `PO#${b.purchaseOrderId}` : `Bill#${b.id}`,
        'Total (PKR)': Number(b.grandTotal || 0),
        'Paid (PKR)': Number(b.paidAmount || 0),
        'Balance (PKR)': Number(b.grandTotal || 0) - Number(b.paidAmount || 0),
        'Status': b.status,
      };
    });

    // Summary footer
    rows.push({ '#': '', 'Bill Date': '', 'Order ID': 'TOTAL', 'Total (PKR)': filteredBillTotal, 'Paid (PKR)': filteredBillPaid, 'Balance (PKR)': filteredBillBalance, 'Status': '' } as any);

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bills');
    const dateLabel = globalDateRange.startDate || globalDateRange.endDate
      ? `_${globalDateRange.startDate || 'start'}_to_${globalDateRange.endDate || 'end'}`
      : '';
    XLSX.writeFile(wb, `${supplier?.name ?? 'Supplier'}_Bills${dateLabel}.xlsx`);
    toast.success('Excel exported');
  };

  const exportPDF = () => {
    if (!filteredBills.length) { toast.error('No bills to export'); return; }
    const doc = new jsPDF({ orientation: 'landscape' });

    // Header block
    doc.setFontSize(16);
    doc.setTextColor(29, 78, 216);
    doc.text(`Supplier Bills — ${supplier?.name ?? ''}`, 14, 16);

    doc.setFontSize(9);
    doc.setTextColor(100);
    const dateRange = (globalDateRange.startDate || globalDateRange.endDate)
      ? `Period: ${globalDateRange.startDate || '—'} to ${globalDateRange.endDate || '—'}`
      : 'Period: All time';
    doc.text(dateRange, 14, 23);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 29);

    const body = filteredBills.map((b: any, i: number) => {
      const bal = Number(b.grandTotal || 0) - Number(b.paidAmount || 0);
      return [
        i + 1,
        new Date(b.billDate).toLocaleDateString(),
        b.purchaseOrderId ? `PO#${b.purchaseOrderId}` : `Bill#${b.id}`,
        `PKR ${Number(b.grandTotal || 0).toLocaleString()}`,
        `PKR ${Number(b.paidAmount || 0).toLocaleString()}`,
        `PKR ${bal.toLocaleString()}`,
        b.status,
      ];
    });

    autoTable(doc, {
      startY: 35,
      head: [['#', 'Bill Date', 'Order ID', 'Total', 'Paid', 'Balance', 'Status']],
      body,
      foot: [['', '', 'TOTAL',
        `PKR ${filteredBillTotal.toLocaleString()}`,
        `PKR ${filteredBillPaid.toLocaleString()}`,
        `PKR ${filteredBillBalance.toLocaleString()}`,
        '',
      ]],
      headStyles: { fillColor: [29, 78, 216], textColor: 255, fontStyle: 'bold' },
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
      },
      didParseCell(data) {
        // Colour balance column red/green
        if (data.section === 'body' && data.column.index === 5) {
          const b = filteredBills[data.row.index];
          if (b) {
            const bal = Number(b.grandTotal || 0) - Number(b.paidAmount || 0);
            data.cell.styles.textColor = bal > 0 ? [220, 38, 38] : [22, 163, 74];
          }
        }
        // Colour status
        if (data.section === 'body' && data.column.index === 6) {
          const b = filteredBills[data.row.index];
          if (b) {
            if (b.status === 'PAID') data.cell.styles.textColor = [22, 163, 74];
            else if (b.status === 'PENDING') data.cell.styles.textColor = [202, 138, 4];
            else data.cell.styles.textColor = [100, 100, 100];
          }
        }
      },
    });

    const dateLabel = globalDateRange.startDate || globalDateRange.endDate
      ? `_${globalDateRange.startDate || 'start'}_to_${globalDateRange.endDate || 'end'}`
      : '';
    doc.save(`${supplier?.name ?? 'Supplier'}_Bills${dateLabel}.pdf`);
    toast.success('PDF exported');
  };

  const exportLedgerExcel = () => {
    if (!filteredLedgerEntries.length) { toast.error('No ledger entries to export'); return; }
    const rows = filteredLedgerEntries.map((e: any) => {
      return {
        'Date': new Date(e.date).toLocaleDateString(),
        'Particulars': e.particulars,
        'Debit (PKR)': e.debit || 0,
        'Credit (PKR)': e.credit || 0,
        'Balance (PKR)': e.balance,
      };
    });

    // Summary footer
    rows.push({ 'Date': '', 'Particulars': 'TOTAL', 'Debit (PKR)': ledgerTotalDebit, 'Credit (PKR)': ledgerTotalCredit, 'Balance (PKR)': ledgerClosingBalance } as any);

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ledger');
    const dateLabel = globalDateRange.startDate || globalDateRange.endDate
      ? `_${globalDateRange.startDate || 'start'}_to_${globalDateRange.endDate || 'end'}`
      : '';
    XLSX.writeFile(wb, `${supplier?.name ?? 'Supplier'}_Ledger${dateLabel}.xlsx`);
    toast.success('Excel exported');
  };

  const exportLedgerPDF = () => {
    if (!filteredLedgerEntries.length) { toast.error('No ledger entries to export'); return; }
    const doc = new jsPDF({ orientation: 'portrait' });

    // Header block
    doc.setFontSize(16);
    doc.setTextColor(29, 78, 216);
    doc.text(`Supplier Ledger — ${supplier?.name ?? ''}`, 14, 16);

    doc.setFontSize(9);
    doc.setTextColor(100);
    const dateRange = (globalDateRange.startDate || globalDateRange.endDate)
      ? `Period: ${globalDateRange.startDate || '—'} to ${globalDateRange.endDate || '—'}`
      : 'Period: All time';
    doc.text(dateRange, 14, 23);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 29);

    const body = filteredLedgerEntries.map((e: any) => {
      return [
        new Date(e.date).toLocaleDateString(),
        e.particulars,
        e.debit ? `PKR ${e.debit.toLocaleString()}` : '-',
        e.credit ? `PKR ${e.credit.toLocaleString()}` : '-',
        `PKR ${e.balance.toLocaleString()}`,
      ];
    });

    autoTable(doc, {
      startY: 35,
      head: [['Date', 'Particulars', 'Debit', 'Credit', 'Balance']],
      body,
      foot: [['', 'TOTAL',
        `PKR ${ledgerTotalDebit.toLocaleString()}`,
        `PKR ${ledgerTotalCredit.toLocaleString()}`,
        `PKR ${ledgerClosingBalance.toLocaleString()}`,
      ]],
      headStyles: { fillColor: [29, 78, 216], textColor: 255, fontStyle: 'bold' },
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
    });

    const dateLabel = globalDateRange.startDate || globalDateRange.endDate
      ? `_${globalDateRange.startDate || 'start'}_to_${globalDateRange.endDate || 'end'}`
      : '';
    doc.save(`${supplier?.name ?? 'Supplier'}_Ledger${dateLabel}.pdf`);
    toast.success('PDF exported');
  };

  // ─── Early returns ────────────────────────────────────────────────────────
  if (loading) return <div className="p-8 text-center text-gray-500">Loading supplier details...</div>;
  if (!supplier) return <div className="p-8 text-center text-red-500">Supplier not found.</div>;

  const totalOrders = supplier.purchaseOrders?.length || 0;
  const totalBilled = (supplier.purchaseBills?.reduce(
    (sum: number, b: any) => sum + Number(b.grandTotal || 0), 0) ?? 0
  ).toFixed(2);
  const totalOutstandingBills = (supplier.purchaseBills?.reduce((sum: number, b: any) => {
    return sum + (Number(b.grandTotal || 0) - Number(b.paidAmount || 0));
  }, 0) ?? 0);
  
  const openingBalanceRemaining = Number(supplier.openingBalance || 0) - Number(supplier.paidOpeningBalance || 0);
  const totalOutstanding = (totalOutstandingBills + openingBalanceRemaining).toFixed(2);

  const hasDateFilter = globalDateRange.startDate || globalDateRange.endDate;

  return (
    <div className="space-y-6">
      {/* Back + Title */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-[#0F172A]">{supplier.name}</h1>
        </div>
        <div className="w-60">
          <DateRangeFilter onChange={setGlobalDateRange} defaultLabel="Filter Dates" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-8">
        {/* Supplier Info */}
        <h5 className="text-lg font-semibold text-[#1D4ED8] mb-3 border-b pb-2">Supplier Information</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Contact Name</p>
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-gray-400" />
                <p className="font-medium text-gray-900">{supplier.contactName || '-'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-gray-400" />
                <p className="font-medium text-gray-900">{supplier.phone || '-'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-gray-400" />
                <p className="font-medium text-gray-900">{supplier.email || '-'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                <p className="font-medium text-gray-900">{supplier.address || '-'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tax Number</p>
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-gray-400" />
                <p className="font-medium text-gray-900">{supplier.taxNumber || '-'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Terms</p>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                <p className="font-medium text-gray-900">{supplier.paymentTerms || '-'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="mt-1">
                {supplier.isActive ? (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active</span>
                ) : (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Inactive</span>
                )}
              </p>
            </div>
            <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
              <span className="text-sm text-gray-600">Total Purchases:</span>
              <span className="font-semibold text-gray-900">{filteredPurchaseOrders.length}</span>
            </div>
            <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
              <span className="text-sm text-gray-600">Purchase Amount:</span>
              <span className="font-semibold text-gray-900">PKR {Number(filteredBillTotal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
              <span className="text-sm text-gray-600">Paid Amount:</span>
              <span className="font-semibold text-gray-900">PKR {Number(filteredBillPaid).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
              <span className="text-sm text-gray-600">Balance:</span>
              <span className={`font-bold ${Number(filteredBillBalance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                PKR {Number(filteredBillBalance).toLocaleString()}
              </span>
            </div>
            {openingBalanceRemaining > 0 && (
              <button
                onClick={() => setShowOpeningBalanceModal(true)}
                className="w-full mt-2 px-3 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Pay Opening Balance (PKR {openingBalanceRemaining.toLocaleString()})
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mt-8">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-[#1D4ED8] text-[#1D4ED8]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ShoppingCart size={18} />
              Recent Purchase Orders
            </button>

            <button
              onClick={() => setActiveTab('bills')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'bills'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Receipt size={18} />
              Bills & Payments
              {hasDateFilter && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-green-100 text-green-700 rounded-full font-bold">
                  {filteredBills.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('items')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'items'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText size={18} />
              Items Summary
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'ledger'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpen size={18} />
              Ledger Account
            </button>
          </div>
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div>
            <h5 className="text-lg font-bold text-[#0F172A] mb-4">Recent Purchase Orders</h5>
            {supplier.purchaseOrders?.length ? (
              <div className="bg-white border rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 border-b">
                    <tr>
                      {['#', 'Order Date', 'Expected Date', 'Status', 'Total', 'Bill Status', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPurchaseOrders.map((po: any, idx: number) => (
                      <tr key={po.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/finance/purchase-orders/view/' + po.id)}>
                        <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3">{new Date(po.orderDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            po.status === 'APPROVED' ? 'bg-green-100 text-green-800'
                              : po.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>{po.status}</span>
                        </td>
                        <td className="px-4 py-3 font-medium">PKR {Number(po.total || 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          {po.bill ? (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              po.bill.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>{po.bill.status}</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">Unbilled</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center flex gap-2 items-center justify-center">
                          {!po.bill && (
                            <Link to={`/finance/purchase-orders/view/${po.id}`}
                              className="text-[#1D4ED8] hover:text-blue-800 font-medium text-sm border border-blue-200 bg-blue-50 px-3 py-1 rounded">
                              View PO
                            </Link>
                          )}
                          {po.bill && (
                            <Link to={`/finance/bills/view/${po.bill.id}`}
                              className="text-green-700 hover:text-green-900 font-medium text-sm border border-green-200 bg-green-50 px-3 py-1 rounded">
                              View Bill
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState text="No purchase orders found for this supplier." />
            )}
          </div>
        )}

        {/* ── Bills Tab ── */}
        {activeTab === 'bills' && (
          <div>
            {/* Filter + Export toolbar */}
            <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
              <div>
                <h5 className="text-lg font-bold text-[#0F172A]">Bills & Payments</h5>
                {hasDateFilter && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Showing <span className="font-semibold text-gray-700">{filteredBills.length}</span> bill(s) in selected period
                  </p>
                )}
              </div>

              {/* Export buttons */}
              <div className="flex flex-wrap items-center gap-2">

                {/* Export Excel */}
                <button
                  onClick={exportExcel}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                >
                  <FileSpreadsheet size={14} />
                  Excel
                </button>

                {/* Export PDF */}
                <button
                  onClick={exportPDF}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                >
                  <Download size={14} />
                  PDF
                </button>
              </div>
            </div>

            {/* Summary cards for filtered period */}
            {filteredBills.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-500 font-medium">Total Billed</p>
                  <p className="text-lg font-bold text-blue-700">PKR {filteredBillTotal.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-500 font-medium">Total Paid</p>
                  <p className="text-lg font-bold text-green-700">PKR {filteredBillPaid.toLocaleString()}</p>
                </div>
                <div className={`border rounded-lg p-3 text-center ${filteredBillBalance > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                  <p className={`text-xs font-medium ${filteredBillBalance > 0 ? 'text-red-500' : 'text-gray-500'}`}>Outstanding</p>
                  <p className={`text-lg font-bold ${filteredBillBalance > 0 ? 'text-red-700' : 'text-gray-700'}`}>
                    PKR {filteredBillBalance.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {filteredBills.length ? (
              <div className="bg-white border rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 border-b">
                    <tr>
                      {['#', 'Bill Date', 'Order ID', 'Total', 'Paid', 'Balance', 'Status', 'Actions'].map(h => (
                        <th key={h} className={`px-4 py-3 font-medium ${['Total', 'Paid', 'Balance'].includes(h) ? 'text-right' : h === 'Actions' ? 'text-center' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredBills.map((b: any, idx: number) => {
                      const balance = Number(b.grandTotal) - Number(b.paidAmount);
                      return (
                        <tr key={b.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/finance/bills/view/' + b.id)}>
                          <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                          <td className="px-4 py-3">{new Date(b.billDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <Link to={`/finance/bills/view/${b.id}`} className="text-[#1D4ED8] font-medium hover:underline">
                              {b.purchaseOrderId ? `PO#${b.purchaseOrderId}` : `Bill#${b.id}`}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-right">PKR {Number(b.grandTotal || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">PKR {Number(b.paidAmount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-semibold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              PKR {balance.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              b.status === 'PAID' ? 'bg-green-100 text-green-800'
                                : b.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>{b.status}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link to={`/finance/bills/view/${b.id}`}
                              className="text-indigo-700 hover:text-indigo-900 font-medium text-sm border border-indigo-200 bg-indigo-50 px-3 py-1 rounded">
                              View Bill
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Totals footer */}
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200 font-semibold text-sm">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-gray-600">Totals ({filteredBills.length} bill{filteredBills.length !== 1 ? 's' : ''})</td>
                      <td className="px-4 py-3 text-right">PKR {filteredBillTotal.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">PKR {filteredBillPaid.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right font-bold ${filteredBillBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        PKR {filteredBillBalance.toLocaleString()}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <EmptyState text={hasDateFilter ? 'No bills found in the selected date range.' : 'No bills found for this supplier.'} />
            )}
          </div>
        )}

        {/* ── Items Summary Tab ── */}
        {activeTab === 'items' && (
          <div>
            <h5 className="text-lg font-bold text-[#0F172A] mb-4">Items Purchased</h5>
            {supplier.purchaseOrders?.some((po: any) => po.items?.length) ? (
              <div className="bg-white border rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 border-b">
                    <tr>
                      {['#', 'PO ID', 'Item Name', 'Quantity', 'Unit Price', 'Total'].map(h => (
                        <th key={h} className="px-4 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {supplier.purchaseOrders.flatMap((po: any, i: number) =>
                      po.items?.map((item: any, idx: number) => (
                        <tr key={`${po.id}-${item.id || idx}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                          <td className="px-4 py-3 text-[#1D4ED8] font-medium">PO#{po.id}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{item?.item?.title || item?.title || 'Unknown Item'}</td>
                          <td className="px-4 py-3">{item.qty}</td>
                          <td className="px-4 py-3">PKR {Number(item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="px-4 py-3 font-medium">PKR {(Number(item.qty) * Number(item.unitPrice)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState text="No item details available." />
            )}
          </div>
        )}
        {/* ── Ledger Tab ── */}
        {activeTab === 'ledger' && (
          <div>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
              <div>
                <h5 className="text-lg font-bold text-[#0F172A]">Supplier Ledger</h5>
                {(globalDateRange.startDate || globalDateRange.endDate) && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Filtered Period: {globalDateRange.startDate || 'Start'} to {globalDateRange.endDate || 'End'}
                  </p>
                )}
              </div>

              {/* Export buttons */}
              <div className="flex flex-wrap items-center gap-2">

                {/* Export Excel */}
                <button
                  onClick={exportLedgerExcel}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                >
                  <FileSpreadsheet size={14} />
                  Excel
                </button>

                {/* Export PDF */}
                <button
                  onClick={exportLedgerPDF}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                >
                  <Download size={14} />
                  PDF
                </button>
              </div>
            </div>

            {filteredLedgerEntries.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-center">
                  <p className="text-xs text-red-500 font-medium">Total Debit (Payments)</p>
                  <p className="text-lg font-bold text-red-700">PKR {ledgerTotalDebit.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-500 font-medium">Total Credit (Bills)</p>
                  <p className="text-lg font-bold text-green-700">PKR {ledgerTotalCredit.toLocaleString()}</p>
                </div>
                <div className={`border rounded-lg p-3 text-center ${ledgerClosingBalance > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                  <p className={`text-xs font-medium ${ledgerClosingBalance > 0 ? 'text-orange-600' : 'text-gray-600'}`}>Closing Balance (Payable)</p>
                  <p className={`text-lg font-bold ${ledgerClosingBalance > 0 ? 'text-orange-700' : 'text-gray-900'}`}>
                    PKR {ledgerClosingBalance.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {filteredLedgerEntries.length ? (
              <div className="bg-white border rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Particulars</th>
                      <th className="px-4 py-3 font-medium text-right">Debit (PKR)</th>
                      <th className="px-4 py-3 font-medium text-right">Credit (PKR)</th>
                      <th className="px-4 py-3 font-medium text-right">Balance (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredLedgerEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">{new Date(entry.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{entry.particulars}</td>
                        <td className="px-4 py-3 text-right text-red-600">{entry.debit > 0 ? entry.debit.toLocaleString() : '-'}</td>
                        <td className="px-4 py-3 text-right text-green-600">{entry.credit > 0 ? entry.credit.toLocaleString() : '-'}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{entry.balance.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState text="No ledger entries found for this period." />
            )}
          </div>
        )}
      </div>

      {showOpeningBalanceModal && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Pay Opening Balance</h2>
              <button 
                onClick={() => setShowOpeningBalanceModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleOpeningBalancePayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  required
                  min="1"
                  max={openingBalanceRemaining}
                  value={obPaymentForm.amount}
                  onChange={(e) => setObPaymentForm({ ...obPaymentForm, amount: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] outline-none"
                  placeholder={`Max: ${openingBalanceRemaining.toLocaleString()}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={obPaymentForm.paymentMethod}
                    onChange={(e) => setObPaymentForm({ ...obPaymentForm, paymentMethod: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1D4ED8] outline-none bg-white"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                    <option value="card">Card</option>
                    <option value="cheque">Cheque</option>
                    <option value="online">Online</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {(obPaymentForm.paymentMethod === 'bank' || obPaymentForm.paymentMethod === 'card') && (
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank</label>
                    <select
                      value={obPaymentForm.bankId}
                      onChange={(e) => setObPaymentForm({ ...obPaymentForm, bankId: e.target.value })}
                      disabled={banksLoading}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1D4ED8] outline-none bg-white disabled:opacity-60"
                    >
                      <option value="">{banksLoading ? 'Loading banks...' : '-- Select Bank --'}</option>
                      {banksList.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} – {b.accountTitle}{b.accountNumber ? ` (${b.accountNumber})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className={obPaymentForm.paymentMethod === 'bank' || obPaymentForm.paymentMethod === 'card' ? "col-span-2 sm:col-span-1" : "col-span-2 sm:col-span-1"}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={obPaymentForm.paymentDate}
                    onChange={(e) => setObPaymentForm({ ...obPaymentForm, paymentDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1D4ED8] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label>
                <textarea
                  value={obPaymentForm.remarks}
                  onChange={(e) => setObPaymentForm({ ...obPaymentForm, remarks: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1D4ED8] outline-none min-h-[80px]"
                  placeholder="Any notes..."
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowOpeningBalanceModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOB}
                  className="px-6 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {submittingOB ? 'Processing...' : 'Pay Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
      <FileWarning size={48} className="text-gray-300 mb-3" />
      <p className="text-gray-500">{text}</p>
    </div>
  );
}
