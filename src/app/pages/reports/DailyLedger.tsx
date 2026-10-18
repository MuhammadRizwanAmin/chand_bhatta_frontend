import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  BarChart3, 
  CalendarDays, 
  DollarSign, 
  Plus, 
  TrendingDown, 
  TrendingUp, 
  Wallet,
  Download,
  FileText
} from 'lucide-react';
import api from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getCurrency } from '../../utils/currency';
import { AddPaymentJournalModal } from './AddPaymentJournalModal';

const formatDate = (v: any) => {
  if (!v) return '-';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '-';
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' }).toLowerCase();
  const year = d.getFullYear().toString().slice(-2);
  return `${day}-${month}-${year}`;
};

export function DailyLedger() {
  const navigate = useNavigate();

  const [ledgerRows, setLedgerRows] = useState<any[]>([]);
  const [meta, setMeta] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    totalEntries: 0,
  });
  const [totalCash, setTotalCash] = useState(0);
  const [totalOnline, setTotalOnline] = useState(0);

  const [filterType, setFilterType] = useState('today');
  const [customDate, setCustomDate] = useState({ from: '', to: '' });
  const [loading, setLoading] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);

  const getSelectedDate = () => {
    const today = new Date();
    if (filterType === 'yesterday') {
      const yest = new Date();
      yest.setDate(today.getDate() - 1);
      const yDate = yest.toISOString().split('T')[0];
      return { from: yDate, to: yDate };
    }
    if (filterType === 'week') {
      const start = new Date();
      start.setDate(today.getDate() - today.getDay());
      return {
        from: start.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
      };
    }
    if (filterType === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        from: start.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
      };
    }
    if (filterType === 'custom' && customDate.from && customDate.to) {
      return { from: customDate.from, to: customDate.to };
    }
    const formatted = today.toISOString().split('T')[0];
    return { from: formatted, to: formatted };
  };

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const { from, to } = getSelectedDate();

      const res = await api.get(
        `/report/ledger/report?startDate=${from}&endDate=${to}`
      );

      if (res.status !== 200 || !res.data.success) {
        toast.error('Failed to load ledger');
        return;
      }

      const { data, meta: apiMeta } = res.data;

      let cash = 0;
      let online = 0;
      data.forEach((row: any) => {
        if (row.type === 'income') {
          if (row.method === 'cash') cash += Number(row.amount);
          else online += Number(row.amount);
        }
      });

      const normalized = data.map((row: any) => {
        const isIncome = row.type === 'income';
        const isExpense = row.type === 'expense';

        let slipno = `PAY-${row.paymentId || row.referenceId}`;
        if (row.source === 'Reservation') slipno = `RES-${row.referenceId}`;
        else if (row.source === 'Sale') slipno = `SALE-${row.referenceId}`;
        else if (row.source === 'Trip') slipno = `TRP-${row.referenceId}`;
        else if (row.source === 'Journal') slipno = `JNL-${row.referenceId}`;
        else if (row.source === 'Expense') slipno = `EXP-${row.referenceId}`;

        let paymentMode = 'Other';
        const m = row.method?.toLowerCase();
        if (m === 'cash') paymentMode = 'Cash';
        else if (m === 'bank' || m === 'bank_transfer') paymentMode = 'Bank';
        else if (m === 'card') paymentMode = 'Card';
        else if (m === 'btc') paymentMode = 'BTC';

        const formattedDate = formatDate(row.date + 'T00:00:00');

        return {
          date: row.date,
          formattedDate,
          slipno,
          source: row.source,
          type: row.type,
          description: row.description || '-',
          debit: isExpense ? Number(row.amount) : 0,
          credit: isIncome ? Number(row.amount) : 0,
          paymentMode,
          status: row.status,
          madeBy: row.madeBy || row.paidBy || '-',
          receivedBy: isIncome ? 'Admin' : '-',
          runningBalance: Number(row.runningBalance),
          expenseType: row.expenseType || null,
          location: row.location || null,
        };
      });

      setLedgerRows(normalized);
      setMeta(apiMeta);
      setTotalCash(cash);
      setTotalOnline(online);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [filterType, customDate]);

  const selectedDate = getSelectedDate();
  const selectedDateLabel =
    selectedDate.from === selectedDate.to
      ? formatDate(selectedDate.from + 'T00:00:00')
      : `${formatDate(selectedDate.from + 'T00:00:00')} to ${formatDate(selectedDate.to + 'T00:00:00')}`;

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'Reservation': return 'bg-blue-100 text-blue-700';
      case 'Sale': return 'bg-indigo-100 text-indigo-700';
      case 'Trip': return 'bg-amber-100 text-amber-700';
      case 'Journal': return 'bg-slate-100 text-slate-700';
      case 'Expense': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getModeBadgeColor = (mode: string) => {
    switch (mode) {
      case 'Cash': return 'bg-emerald-100 text-emerald-700';
      case 'Bank': return 'bg-blue-100 text-blue-700';
      case 'Card': return 'bg-cyan-100 text-cyan-700';
      case 'BTC': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'open': return 'bg-slate-100 text-slate-700';
      default: return 'bg-red-100 text-red-700';
    }
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    doc.text(`Daily Ledger`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Period: ${selectedDateLabel}`, 14, 22);

    autoTable(doc, {
      html: '#ledger-table',
      startY: 28,
      theme: 'grid',
      showFoot: 'lastPage',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [17, 24, 39] }
    });

    doc.save(`Daily_Ledger_${selectedDate.from}_to_${selectedDate.to}.pdf`);
  };

  const downloadExcel = () => {
    const table = document.getElementById('ledger-table');
    if (!table) return;
    const wb = XLSX.utils.table_to_book(table, { sheet: "Ledger" });
    XLSX.writeFile(wb, `Daily_Ledger_${selectedDate.from}_to_${selectedDate.to}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="space-y-6 pt-4">
        {/* Header Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
                  <BarChart3 className="text-blue-600" size={24} /> Daily Ledger
                </h1>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Track income, expenses and account balances
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={downloadPdf}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-700 shadow-sm"
              >
                <FileText size={16} /> PDF
              </button>
              <button
                onClick={downloadExcel}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-700 shadow-sm"
              >
                <Download size={16} /> Excel
              </button>
              <Link
                to="/finance/expenses/add"
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-700 shadow-sm"
              >
                <Plus size={16} /> Add Expense
              </Link>
              <button
                onClick={() => setIsAddPaymentModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700 shadow-sm"
              >
                <Plus size={16} /> Add Payment
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Main Content Area */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 p-4 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <CalendarDays size={18} className="text-slate-500" />
                  Ledger Entries ({selectedDateLabel})
                </h3>
                
                <div className="mt-3 sm:mt-0 flex flex-wrap gap-2 items-center">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="custom">Custom Range</option>
                  </select>

                  {filterType === 'custom' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={customDate.from}
                        onChange={(e) => setCustomDate(prev => ({ ...prev, from: e.target.value }))}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      />
                      <span className="text-slate-400">-</span>
                      <input
                        type="date"
                        value={customDate.to}
                        onChange={(e) => setCustomDate(prev => ({ ...prev, to: e.target.value }))}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table id="ledger-table" className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-100 text-xs uppercase text-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Slip No.</th>
                      <th className="px-4 py-3 font-semibold">Source</th>
                      <th className="px-4 py-3 font-semibold">Particular</th>
                      <th className="px-4 py-3 font-semibold">Mode</th>
                      <th className="px-4 py-3 font-semibold text-right">Debit</th>
                      <th className="px-4 py-3 font-semibold text-right">Credit</th>
                      <th className="px-4 py-3 font-semibold text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          Loading ledger records...
                        </td>
                      </tr>
                    ) : ledgerRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          No ledger records found for this period.
                        </td>
                      </tr>
                    ) : (
                      ledgerRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">{row.formattedDate}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {row.source === "Expense" ? (
                              <Link to={`/finance/expenses`} className="text-blue-600 hover:underline">
                                {row.slipno}
                              </Link>
                            ) : row.source === "Reservation" ? (
                              <Link to={`/booking/${row.slipno.replace("RES-", "")}`} className="text-blue-600 hover:underline">
                                {row.slipno}
                              </Link>
                            ) : (
                              row.slipno
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getSourceBadgeColor(row.source)}`}>
                              {row.source}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="max-w-[200px] truncate" title={row.description}>
                              {row.description}
                            </div>
                            {row.expenseType && (
                              <div className="text-xs text-slate-400 mt-0.5">{row.expenseType}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getModeBadgeColor(row.paymentMode)}`}>
                              {row.paymentMode}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-red-600 font-medium">
                            {row.debit ? `Rs. ${row.debit.toLocaleString()}` : "-"}
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                            {row.credit ? `Rs. ${row.credit.toLocaleString()}` : "-"}
                          </td>
                          <td className={`px-4 py-3 text-right font-bold ${row.runningBalance >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                            Rs. {row.runningBalance.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {!loading && ledgerRows.length > 0 && (
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-200">
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-right text-slate-700">
                          Totals:
                        </td>
                        <td className="px-4 py-3 text-right text-red-600">
                          Rs. {meta.totalExpense.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-600">
                          Rs. {meta.totalIncome.toLocaleString()}
                        </td>
                        <td className={`px-4 py-3 text-right ${meta.netBalance >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                          Rs. {meta.netBalance.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>

          {/* Compact Summary at the bottom */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-500 uppercase">Cash Received</div>
              <div className="text-sm font-bold text-slate-900">Rs. {totalCash.toLocaleString()}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-500 uppercase">Bank / Online</div>
              <div className="text-sm font-bold text-slate-900">Rs. {totalOnline.toLocaleString()}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-500 uppercase">Total Entries</div>
              <div className="text-sm font-bold text-slate-900">{meta.totalEntries}</div>
            </div>
          </div>
        </div>
      </div>

      <AddPaymentJournalModal 
        isOpen={isAddPaymentModalOpen} 
        onClose={() => setIsAddPaymentModalOpen(false)} 
        onSuccess={() => {
          setIsAddPaymentModalOpen(false);
          fetchLedger();
        }} 
      />
    </div>
  );
}
