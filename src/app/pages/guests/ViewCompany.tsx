import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Calendar, FileText, Edit, Trash2, Eye, Download, FileSpreadsheet, FileDown, BookOpen, Building } from 'lucide-react';
import { groupService } from '../../services/groupService';
import { CompanyModal } from './Companies';
import { useConfirm } from '../../components/ConfirmProvider';
import { DateRangeFilter, DateRange } from '../../components/DateRangeFilter';
import api from '../../services/api';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const statusColors: Record<string, string> = {
  reserved:    'bg-blue-100 text-blue-700',
  checked_in:  'bg-green-100 text-green-700',
  checked_out: 'bg-gray-100 text-gray-700',
  cancelled:   'bg-red-100 text-red-700',
  draft:       'bg-yellow-100 text-yellow-700',
  overdue:     'bg-orange-100 text-orange-700',
};

export default function ViewCompany() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  
  // Filters
  const [resDateRange, setResDateRange] = useState<DateRange>({ startDate: '', endDate: '' });
  const [ledgerDateRange, setLedgerDateRange] = useState<DateRange>({ startDate: '', endDate: '' });
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Tabs: 'company' | 'reservations' | 'ledger'
  const [activeTab, setActiveTab] = useState<'company' | 'reservations' | 'ledger'>('company');
  const { confirm } = useConfirm();

  useEffect(() => {
    if (id) {
      fetchCompanyAndReservations();
    }
  }, [id]);

  const fetchCompanyAndReservations = async () => {
    setLoading(true);
    try {
      const [compRes, resList] = await Promise.all([
        groupService.getById(id as string),
        groupService.getLedger(id as string)
      ]);
      setCompany(compRes.group);
      setReservations(resList || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!company) return;
    const isConfirmed = await confirm({
      title: "Delete Company",
      message: `Are you sure you want to delete ${company.name}? All associated data will be removed. This action cannot be undone.`
    });

    if (isConfirmed) {
      try {
        await groupService.delete(company.id);
        navigate('/guests/companies');
      } catch (err) {
        console.error(err);
        alert("Failed to delete company");
      }
    }
  };

  // ── Filtered reservations by date range and status ──
  const filteredReservations = reservations.filter(res => {
    // Status Filter
    if (statusFilter !== 'All' && res.status !== statusFilter) return false;

    // Date Range Filter
    if (!resDateRange.startDate && !resDateRange.endDate) return true;
    const checkIn = new Date(res.startDate);
    const checkOut = new Date(res.endDate);
    const filterStart = resDateRange.startDate ? new Date(resDateRange.startDate) : null;
    const filterEnd = resDateRange.endDate ? new Date(resDateRange.endDate) : null;
    if (filterStart && filterEnd) {
      return checkIn <= filterEnd && checkOut >= filterStart;
    }
    if (filterStart) return checkOut >= filterStart;
    if (filterEnd) return checkIn <= filterEnd;
    return true;
  });

  // ── Aggregate calculations ──
  const totalAmount  = filteredReservations.reduce((sum, r) => sum + (Number(r.totalAmount || 0) - Number(r.waivedAmount || 0)), 0);
  const totalPaid    = filteredReservations.reduce((sum, r) => sum + Number(r.advancePaid || 0), 0);
  
  // Calculate true total due taking opening balance into account
  const totalReservationsDue = reservations.reduce((sum, r) => sum + Number(r.balanceAmount || 0), 0);
  const remainingOpeningBalance = Number(company?.openingBalance || 0) - Number(company?.paidOpeningBalance || 0);
  const receivableBalance = remainingOpeningBalance + totalReservationsDue;
  
  const totalBookings = reservations.length;

  // ── Ledger Entries Calculation ──
  let allLedgerEntries: any[] = [];
  if (company) {
    allLedgerEntries.push({
      date: company.createdAt,
      desc: 'Opening Balance',
      debit: Number(company.openingBalance || 0),
      credit: 0,
      ref: '---'
    });

    if (company.payments && company.payments.length > 0) {
      company.payments.forEach((p: any) => {
        if (p.isOpeningBalance) {
          allLedgerEntries.push({
            date: p.date || p.createdAt,
            desc: `Payment - Opening Balance (${p.method || 'Unknown'})`,
            debit: 0,
            credit: Number(p.amount || 0),
            ref: `PAY-OB-${p.id}`,
            isObPayment: true,
            paymentId: p.id
          });
        }
      });
    }

    reservations.forEach(res => {
      allLedgerEntries.push({
        date: res.createdAt,
        desc: `Reservation Invoice`,
        debit: Number(res.totalAmount || 0) - Number(res.waivedAmount || 0),
        credit: 0,
        ref: res.refno || `#${res.id}`
      });

      if (res.payments && res.payments.length > 0) {
        res.payments.forEach((p: any) => {
          allLedgerEntries.push({
            date: p.paymentDate || p.createdAt,
            desc: `Payment - ${p.method || 'Unknown'}`,
            debit: 0,
            credit: Number(p.amount || 0),
            ref: res.refno || `#${res.id}`
          });
        });
      }
    });

    // Sort chronologically
    allLedgerEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let runningBalance = 0;
    allLedgerEntries.forEach(entry => {
      runningBalance += (entry.debit - entry.credit);
      entry.balance = runningBalance;
    });
  }

  // Filter ledger for display
  const displayLedgerEntries = allLedgerEntries.filter(entry => {
    if (!ledgerDateRange.startDate && !ledgerDateRange.endDate) return true;
    const entryDate = new Date(entry.date);
    const filterStart = ledgerDateRange.startDate ? new Date(ledgerDateRange.startDate) : null;
    const filterEnd = ledgerDateRange.endDate ? new Date(ledgerDateRange.endDate) : null;
    
    // adjust filterEnd to end of day to include the full day
    if (filterEnd) filterEnd.setHours(23, 59, 59, 999);

    if (filterStart && filterEnd) return entryDate >= filterStart && entryDate <= filterEnd;
    if (filterStart) return entryDate >= filterStart;
    if (filterEnd) return entryDate <= filterEnd;
    return true;
  });

  // ── Excel (CSV) export ──
  const downloadExcel = () => {
    const headers = ['Ref No', 'Guest', 'Check-In', 'Check-Out', 'Status', 'Total (PKR)', 'Paid (PKR)', 'Due (PKR)'];
    const rows = filteredReservations.map(res => [
      res.refno || res.id,
      res.customer?.name || 'Unknown',
      res.startDate,
      res.endDate,
      res.status,
      Number(res.totalAmount || 0) - Number(res.waivedAmount || 0),
      Number(res.advancePaid || 0),
      Number(res.balanceAmount || 0),
    ]);
    const allRows = [headers, ...rows, [], ['', '', '', '', 'TOTALS', totalAmount, totalPaid, receivableBalance]];
    const csvContent = allRows.map(row => row.map((cell: any) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${company?.name || 'company'}_reservations.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── PDF export ──
  const downloadPDF = () => {
    if (!filteredReservations.length) { toast.error('No reservations to export'); return; }
    const doc = new jsPDF({ orientation: 'landscape' });

    // Header block
    doc.setFontSize(16);
    doc.setTextColor(29, 78, 216);
    doc.text(`Company Reservations — ${company?.name ?? ''}`, 14, 16);

    doc.setFontSize(9);
    doc.setTextColor(100);
    const dateRange = resDateRange.startDate && resDateRange.endDate
      ? `Period: ${resDateRange.startDate} to ${resDateRange.endDate}`
      : 'Period: All time';
    doc.text(dateRange, 14, 23);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 29);

    const body = filteredReservations.map(res => {
      return [
        res.refno || res.id,
        res.customer?.name || 'Unknown',
        res.startDate,
        res.endDate,
        res.status?.replace('_', ' '),
        `PKR ${(Number(res.totalAmount || 0) - Number(res.waivedAmount || 0)).toLocaleString()}`,
        `PKR ${Number(res.advancePaid || 0).toLocaleString()}`,
        `PKR ${Number(res.balanceAmount || 0).toLocaleString()}`,
      ];
    });

    autoTable(doc, {
      startY: 35,
      head: [['Ref No', 'Guest', 'Check-In', 'Check-Out', 'Status', 'Total', 'Paid', 'Due']],
      body,
      foot: [['TOTALS', '', '', '', '',
        `PKR ${totalAmount.toLocaleString()}`,
        `PKR ${totalPaid.toLocaleString()}`,
        `PKR ${receivableBalance.toLocaleString()}`,
      ]],
      headStyles: { fillColor: [29, 78, 216], textColor: 255, fontStyle: 'bold' },
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        5: { halign: 'right' },
        6: { halign: 'right', textColor: [5, 150, 105] },
        7: { halign: 'right', textColor: [220, 38, 38] },
      },
    });

    const dateLabel = resDateRange.startDate || resDateRange.endDate
      ? `_${resDateRange.startDate || 'start'}_to_${resDateRange.endDate || 'end'}`
      : '';
    doc.save(`${company?.name ?? 'Company'}_Reservations${dateLabel}.pdf`);
    toast.success('PDF exported');
  };

  // ── Ledger CSV Export ──
  const downloadLedgerExcel = () => {
    if (!displayLedgerEntries.length) return;
    const headers = ['Date', 'Reference', 'Description', 'Debit (Invoice) (PKR)', 'Credit (Payment) (PKR)', 'Balance (PKR)'];
    const totalDebit = displayLedgerEntries.reduce((s, e) => s + e.debit, 0);
    const totalCredit = displayLedgerEntries.reduce((s, e) => s + e.credit, 0);
    const closingBalance = displayLedgerEntries[displayLedgerEntries.length - 1]?.balance || 0;

    const rows = displayLedgerEntries.map(e => [
      e.date ? new Date(e.date).toLocaleDateString() : '---',
      e.ref,
      e.desc,
      e.debit || 0,
      e.credit || 0,
      e.balance || 0,
    ]);
    const allRows = [headers, ...rows, [], ['', '', 'TOTALS', totalDebit, totalCredit, closingBalance]];
    const csvContent = allRows.map(row => row.map((cell: any) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${company?.name || 'company'}_ledger.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Ledger PDF Export ──
  const downloadLedgerPDF = () => {
    if (!displayLedgerEntries.length) { toast.error('No ledger entries to export'); return; }
    const doc = new jsPDF({ orientation: 'portrait' });

    // Header block
    doc.setFontSize(16);
    doc.setTextColor(29, 78, 216);
    doc.text(`Company Ledger — ${company?.name ?? ''}`, 14, 16);

    doc.setFontSize(9);
    doc.setTextColor(100);
    const dateRangeText = ledgerDateRange.startDate && ledgerDateRange.endDate
      ? `Period: ${ledgerDateRange.startDate} to ${ledgerDateRange.endDate}`
      : 'Period: All time';
    doc.text(dateRangeText, 14, 23);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 29);

    const totalDebit = displayLedgerEntries.reduce((s, e) => s + e.debit, 0);
    const totalCredit = displayLedgerEntries.reduce((s, e) => s + e.credit, 0);
    const closingBalance = displayLedgerEntries[displayLedgerEntries.length - 1]?.balance || 0;

    const body = displayLedgerEntries.map(e => {
      return [
        e.date ? new Date(e.date).toLocaleDateString() : '---',
        e.ref,
        e.desc,
        e.debit > 0 ? `PKR ${e.debit.toLocaleString()}` : '---',
        e.credit > 0 ? `PKR ${e.credit.toLocaleString()}` : '---',
        `PKR ${e.balance.toLocaleString()}`,
      ];
    });

    autoTable(doc, {
      startY: 35,
      head: [['Date', 'Reference', 'Description', 'Debit', 'Credit', 'Balance']],
      body,
      foot: [['TOTALS', '', '',
        `PKR ${totalDebit.toLocaleString()}`,
        `PKR ${totalCredit.toLocaleString()}`,
        `PKR ${closingBalance.toLocaleString()}`,
      ]],
      headStyles: { fillColor: [29, 78, 216], textColor: 255, fontStyle: 'bold' },
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        3: { halign: 'right', textColor: [220, 38, 38] },
        4: { halign: 'right', textColor: [5, 150, 105] },
        5: { halign: 'right' },
      },
    });

    const dateLabel = ledgerDateRange.startDate || ledgerDateRange.endDate
      ? `_${ledgerDateRange.startDate || 'start'}_to_${ledgerDateRange.endDate || 'end'}`
      : '';
    doc.save(`${company?.name ?? 'Company'}_Ledger${dateLabel}.pdf`);
    toast.success('PDF exported');
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading company details...</div>;
  }

  if (!company) {
    return <div className="p-8 text-center text-red-500">Company not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-[#0F172A]">{company.name}</h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${company.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {company.status}
              </span>
            </div>
            <p className="text-gray-600 mt-1">Corporate Client Overview</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Edit size={18} /> Edit
          </button>
          <button onClick={handleDeleteClick} className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">
            <Trash2 size={18} /> Delete
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('company')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'company'
                ? 'border-[#1D4ED8] text-[#1D4ED8]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building size={18} />
            Company Details
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'reservations'
                ? 'border-[#1D4ED8] text-[#1D4ED8]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText size={18} />
            Reservations
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
              {totalBookings}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'ledger'
                ? 'border-[#1D4ED8] text-[#1D4ED8]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookOpen size={18} />
            Company Ledger
          </button>
        </div>
      </div>

      {/* Tab Content Rendering */}
      <div className="mt-4">
        {/* Company Details Tab */}
        {activeTab === 'company' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {/* Info Card */}
            <div className="md:col-span-2 bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#0F172A] mb-4">Company Information</h2>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Contact Person</p>
                  <p className="font-medium text-gray-900">{company.contactPerson || '---'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="font-medium text-gray-900">{company.email || '---'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone</p>
                  <p className="font-medium text-gray-900">{company.phone || '---'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Billing Cycle</p>
                  <p className="font-medium text-gray-900 capitalize">{company.billingCycle || '---'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Address</p>
                  <p className="font-medium text-gray-900">{company.address || '---'}</p>
                </div>
              </div>
              
              {remainingOpeningBalance > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Remaining Opening Balance</p>
                    <p className="text-xl font-bold text-red-600">PKR {remainingOpeningBalance.toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => setIsPayModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Pay Opening Balance
                  </button>
                </div>
              )}
            </div>

            {/* Rates Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#0F172A] mb-4">Room Type Rates</h2>
              {company.rates && company.rates.length > 0 ? (
                <div className="space-y-3">
                  {company.rates.map((r: any) => (
                    <div key={r.roomTypeId} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">{r.roomType?.name || `Type ID: ${r.roomTypeId}`}</span>
                      <span className="text-sm font-bold text-[#1D4ED8]">PKR {Number(r.rate).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No special rates assigned.</p>
              )}
            </div>
          </div>
        )}

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <div className="bg-white rounded-xl shadow-sm min-h-[400px] animate-in fade-in duration-300">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
                  <span className="ml-1 text-gray-600 text-sm font-semibold py-0.5">
                    Showing {filteredReservations.length} Reservations
                  </span>
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-48 shrink-0">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                    >
                      <option value="All">All Statuses</option>
                      <option value="reserved">Reserved</option>
                      <option value="checked_in">Checked In</option>
                      <option value="checked_out">Checked Out</option>
                      <option value="overdue">Overdue</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="w-60 shrink-0">
                    <DateRangeFilter onChange={setResDateRange} defaultLabel="Filter by Date" />
                  </div>
                  <button
                    onClick={downloadExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
                  >
                    <FileSpreadsheet size={16} /> Excel
                  </button>
                  <button
                    onClick={downloadPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    <FileDown size={16} /> PDF
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
                {[
                  { label: 'Total Bookings',      value: totalBookings,                          valueClass: 'text-[#1D4ED8]',    border: 'border-[#1D4ED8]' },
                  { label: 'Filtered Amount',     value: `PKR ${totalAmount.toLocaleString()}`,  valueClass: 'text-gray-900',     border: 'border-gray-300' },
                  { label: 'Filtered Paid',       value: `PKR ${totalPaid.toLocaleString()}`,    valueClass: 'text-emerald-600',  border: 'border-emerald-400' },
                  { label: 'Total Receivable',    value: `PKR ${receivableBalance.toLocaleString()}`, valueClass: 'text-red-600', border: 'border-red-400' },
                ].map(card => (
                  <div key={card.label} className={`bg-gray-50 rounded-xl p-4 border-l-4 ${card.border}`}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.label}</p>
                    <p className={`text-lg font-bold mt-1 ${card.valueClass}`}>{card.value}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Ref No</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Guest</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Check-In</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">In Time</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Check-Out</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Out Time</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Paid</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Due</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredReservations.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-12 text-center text-gray-400">
                        <FileText size={40} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium">
                          No reservations found{resDateRange.startDate || resDateRange.endDate || statusFilter !== 'All' ? ' matching your filters' : ' for this company'}.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredReservations.map(res => {
                      const paid = Number(res.advancePaid || 0);
                      const due  = Number(res.balanceAmount || 0);
                      return (
                        <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-[#1D4ED8] text-sm">{res.refno || `#${res.id}`}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{res.customer?.name || '---'}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{res.startDate ? new Date(res.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {res.startTime ? (() => {
                              const [h, m] = res.startTime.split(':');
                              const hour = parseInt(h, 10);
                              return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
                            })() : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{res.endDate ? new Date(res.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {res.endTime ? (() => {
                              const [h, m] = res.endTime.split(':');
                              const hour = parseInt(h, 10);
                              return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
                            })() : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[res.status] || 'bg-gray-100 text-gray-600'}`}>
                              {res.status?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            <div>PKR {(Number(res.totalAmount || 0) - Number(res.waivedAmount || 0)).toLocaleString()}</div>
                            {Boolean(res.refundedAmount && Number(res.refundedAmount) > 0) && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded mt-0.5">
                                Refund: PKR {Number(res.refundedAmount).toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-emerald-600">PKR {paid.toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm font-bold text-red-600">PKR {due.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => navigate(`/booking/${res.id}`)}
                              className="p-1.5 text-gray-400 hover:text-[#1D4ED8] hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Reservation"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ledger Tab */}
        {activeTab === 'ledger' && (
          <div className="bg-white rounded-xl shadow-sm min-h-[400px] animate-in fade-in duration-300">
            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#0F172A]">Ledger Statement</h2>
                <p className="text-sm text-gray-500 mt-1">Chronological history of reservations and payments</p>
              </div>
              <div className="w-60 shrink-0">
                <DateRangeFilter onChange={setLedgerDateRange} defaultLabel="Filter Ledger by Date" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={downloadLedgerExcel}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
                >
                  <FileSpreadsheet size={16} /> Excel
                </button>
                <button
                  onClick={downloadLedgerPDF}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  <FileDown size={16} /> PDF
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0F172A] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Reference</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Description</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-red-300">Debit (Invoice)</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-emerald-300">Credit (Payment)</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayLedgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No ledger entries found{ledgerDateRange.startDate || ledgerDateRange.endDate ? ' for the selected date range' : ''}.
                      </td>
                    </tr>
                  ) : (
                    displayLedgerEntries.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {entry.date ? new Date(entry.date).toLocaleDateString() : '---'}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-[#1D4ED8]">{entry.ref}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {entry.desc}
                          {entry.isObPayment && (
                            <button
                              onClick={async () => {
                                if (window.confirm("Delete this opening balance payment?")) {
                                  try {
                                    await groupService.deleteGroupPayment(entry.paymentId);
                                    fetchCompanyAndReservations();
                                  } catch (e) {
                                    console.error(e);
                                    alert("Failed to delete payment");
                                  }
                                }
                              }}
                              className="ml-2 text-xs text-red-500 hover:underline"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-red-600 text-right">
                          {entry.debit > 0 ? `PKR ${entry.debit.toLocaleString()}` : '---'}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-emerald-600 text-right">
                          {entry.credit > 0 ? `PKR ${entry.credit.toLocaleString()}` : '---'}
                        </td>
                        <td className={`px-6 py-4 text-sm font-bold text-right ${entry.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          PKR {entry.balance.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <CompanyModal 
          initialData={company}
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchCompanyAndReservations();
          }} 
        />
      )}

      {isPayModalOpen && (
        <PayOpeningBalanceModal
          company={company}
          onClose={() => setIsPayModalOpen(false)}
          onSuccess={() => {
            setIsPayModalOpen(false);
            fetchCompanyAndReservations();
          }}
        />
      )}
    </div>
  );
}

function PayOpeningBalanceModal({ company, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [banksList, setBanksList] = useState<any[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    method: 'cash',
    bankId: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  useEffect(() => {
    setBanksLoading(true);
    api.get('/banks')
      .then(res => setBanksList(res.data || []))
      .catch(() => setBanksList([]))
      .finally(() => setBanksLoading(false));
  }, []);

  const remainingBalance = Number(company.openingBalance || 0) - Number(company.paidOpeningBalance || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(formData.amount) <= 0 || Number(formData.amount) > remainingBalance) {
      alert('Invalid payment amount');
      return;
    }
    setLoading(true);
    try {
      await groupService.payOpeningBalance(company.id, formData);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Pay Opening Balance</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg">
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-sm text-blue-700">Remaining Balance: <strong>PKR {remainingBalance.toLocaleString()}</strong></p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR)</label>
            <input type="number" required max={remainingBalance} value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select value={formData.method} onChange={e => setFormData({ ...formData, method: e.target.value })} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="cash">Cash</option>
              <option value="bank">Bank Transfer</option>
              <option value="card">Credit/Debit Card</option>
              <option value="other">Other</option>
            </select>
          </div>
          {(formData.method === 'bank' || formData.method === 'card') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank</label>
              <select
                value={formData.bankId}
                onChange={e => setFormData({ ...formData, bankId: e.target.value })}
                disabled={banksLoading}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-60 bg-white"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={2}></textarea>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Processing...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
