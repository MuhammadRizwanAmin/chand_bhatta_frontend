import React, { useState, useEffect } from 'react';
import {
  Calendar, Printer, Download, FileSpreadsheet, Loader2,
  Building2, DollarSign, BedDouble, Utensils, ShoppingBag
} from 'lucide-react';
import api from '../../services/api';
import { getCurrency } from '../../utils/currency';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface PeriodMetrics {
  totalAvailableRooms: number;
  availableRoomNights: number;
  occupiedRooms: number;
  reservedRooms: number;
  maintenanceRooms: number;
  dirtyRooms: number;
  paxCount: number;
  occupancyPct: number;
  adr: number;
  revPar: number;
  roomRevenue: number;
  roomDiscounts: number;
  restaurantRevenue: number;
  roomServiceRevenue: number;
  posFbRevenue: number;
  totalFbRevenue: number;
  otherSalesRevenue: number;
  totalGrossRevenue: number;
  totalPaymentsReceived: number;
}

interface EarlyBirdData {
  today: PeriodMetrics;
  mtd: PeriodMetrics;
  ytd: PeriodMetrics;
  lyToday: PeriodMetrics;
  lyMtd: PeriodMetrics;
  lyYtd: PeriodMetrics;
  ytdVariance: PeriodMetrics;
}

export const EarlyBirdReport: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<EarlyBirdData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async (dateStr: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/reports/early-bird/report?date=${dateStr}`);
      if (res.data && res.data.success) {
        setData(res.data.data);
      } else {
        setError(res.data?.message || 'Failed to load report data');
      }
    } catch (err: any) {
      console.error('Error fetching Early Bird Report:', err);
      setError(err.response?.data?.message || 'Failed to fetch Early Bird Report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedDate);
  }, [selectedDate]);

  const currency = getCurrency();

  const fmtCurrency = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return `${currency} 0.00`;
    return `${currency} ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fmtNumber = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return '0';
    return val.toLocaleString();
  };

  const fmtPercent = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return '0.00%';
    return `${val.toFixed(2)}%`;
  };

  // Helper to render metric row
  const renderRow = (
    label: string,
    key: keyof PeriodMetrics,
    formatType: 'currency' | 'number' | 'percent' = 'currency',
    isBold: boolean = false
  ) => {
    if (!data) return null;

    const getValue = (p: PeriodMetrics) => p[key] ?? 0;

    const formatVal = (v: number) => {
      if (formatType === 'currency') return fmtCurrency(v);
      if (formatType === 'percent') return fmtPercent(v);
      return fmtNumber(v);
    };

    return (
      <tr className={`border-b border-gray-100 hover:bg-slate-50 transition-colors ${isBold ? 'font-semibold bg-slate-50/60' : ''}`}>
        <td className={`py-2.5 px-4 text-sm text-gray-800 ${isBold ? 'font-bold' : ''}`}>{label}</td>
        <td className="py-2.5 px-3 text-right text-sm text-gray-700">{formatVal(getValue(data.today))}</td>
        <td className="py-2.5 px-3 text-right text-sm text-gray-700">{formatVal(getValue(data.mtd))}</td>
        <td className="py-2.5 px-3 text-right text-sm text-gray-700 font-medium">{formatVal(getValue(data.ytd))}</td>
        <td className="py-2.5 px-3 text-right text-sm text-gray-500">{formatVal(getValue(data.lyToday))}</td>
        <td className="py-2.5 px-3 text-right text-sm text-gray-500">{formatVal(getValue(data.lyMtd))}</td>
        <td className="py-2.5 px-3 text-right text-sm text-gray-500">{formatVal(getValue(data.lyYtd))}</td>
        <td className={`py-2.5 px-3 text-right text-sm font-semibold ${getValue(data.ytdVariance) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {getValue(data.ytdVariance) > 0 && formatType !== 'percent' ? '+' : ''}
          {formatVal(getValue(data.ytdVariance))}
        </td>
      </tr>
    );
  };

  // Export to Excel
  const exportExcel = () => {
    if (!data) return;
    const tableEl = document.getElementById('early-bird-table');
    if (!tableEl) return;
    const wb = XLSX.utils.table_to_book(tableEl, { sheet: 'Early Bird Report' });
    XLSX.writeFile(wb, `Early_Bird_Report_${selectedDate}.xlsx`);
  };

  // Export to PDF
  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(16);
    doc.text('EARLY BIRD REPORT', 40, 40);
    doc.setFontSize(10);
    doc.text(`Report Date: ${selectedDate}`, 40, 56);

    autoTable(doc, {
      html: '#early-bird-table',
      startY: 70,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
      theme: 'grid',
    });

    doc.save(`Early_Bird_Report_${selectedDate}.pdf`);
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BedDouble className="w-7 h-7 text-indigo-600" />
            Early Bird Report
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Executive daily performance overview & historical comparison
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-800 focus:outline-none"
            />
          </div>

          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>

          <button
            onClick={exportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-sm">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-600 text-sm font-medium">Generating Early Bird Report for {selectedDate}...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Main Report Document */}
      {!loading && !error && data && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none print:p-0">
          {/* Printable Header */}
          <div className="p-6 border-b border-slate-200 bg-slate-50/50 print:bg-transparent">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wide">Early Bird Report</h2>
                <p className="text-xs text-slate-500 mt-1 uppercase font-semibold">Report Date: {selectedDate}</p>
              </div>
              <div className="text-right text-xs text-slate-400">
                Generated from Hotel Management System
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table id="early-bird-table" className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 w-1/4">PARTICULARS</th>
                  <th className="py-3 px-3 text-right">TODAY</th>
                  <th className="py-3 px-3 text-right">MTD</th>
                  <th className="py-3 px-3 text-right">YTD</th>
                  <th className="py-3 px-3 text-right text-slate-300">LY TODAY</th>
                  <th className="py-3 px-3 text-right text-slate-300">LY MTD</th>
                  <th className="py-3 px-3 text-right text-slate-300">LY YTD</th>
                  <th className="py-3 px-3 text-right text-amber-400">YTD VARIANCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* 1. ROOMS SECTION */}
                <tr className="bg-slate-100/80">
                  <td colSpan={8} className="py-2.5 px-4 text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <BedDouble className="w-4 h-4 text-indigo-600 inline" /> ROOMS
                  </td>
                </tr>
                {renderRow('Total Available Rooms', 'totalAvailableRooms', 'number')}
                {renderRow('Occupied Rooms', 'occupiedRooms', 'number')}
                {renderRow('Reserved / Arriving Rooms', 'reservedRooms', 'number')}
                {renderRow('Maintenance / Out-of-Order Rooms', 'maintenanceRooms', 'number')}
                {renderRow('Dirty / Out-of-Service Rooms', 'dirtyRooms', 'number')}
                {renderRow('Number of Guests (Pax)', 'paxCount', 'number')}
                {renderRow('Occupancy %', 'occupancyPct', 'percent', true)}
                {renderRow('Average Daily Rate (ADR / ARR)', 'adr', 'currency', true)}
                {renderRow('RevPAR', 'revPar', 'currency', true)}
                {renderRow('Room Revenue', 'roomRevenue', 'currency', true)}
                {renderRow('Discounts / Rebates on Room Revenue', 'roomDiscounts', 'currency')}

                {/* 2. FOOD & BEVERAGE SECTION */}
                <tr className="bg-slate-100/80">
                  <td colSpan={8} className="py-2.5 px-4 text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-amber-600 inline" /> FOOD & BEVERAGE
                  </td>
                </tr>
                {renderRow('Restaurant Revenue', 'restaurantRevenue', 'currency')}
                {renderRow('Room Service Revenue', 'roomServiceRevenue', 'currency')}
                {renderRow('POS / Walk-in F&B Revenue', 'posFbRevenue', 'currency')}
                {renderRow('Total F&B Revenue', 'totalFbRevenue', 'currency', true)}

                {/* 3. OTHER REVENUE SECTION */}
                <tr className="bg-slate-100/80">
                  <td colSpan={8} className="py-2.5 px-4 text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-purple-600 inline" /> OTHER REVENUE
                  </td>
                </tr>
                {renderRow('POS / Other Sales Revenue', 'otherSalesRevenue', 'currency', true)}

                {/* 4. TOTALS SECTION */}
                <tr className="bg-slate-900 text-white font-bold">
                  <td colSpan={8} className="py-2.5 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-400">
                    <DollarSign className="w-4 h-4 inline" /> SUMMARY TOTALS
                  </td>
                </tr>
                {renderRow('Total Hotel Gross Revenue', 'totalGrossRevenue', 'currency', true)}
                {renderRow('Total Payments Received (Cash Flow)', 'totalPaymentsReceived', 'currency', true)}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center print:hidden">
            <span>* YTD Variance = Current YTD - Last Year YTD</span>
            <span>All monetary values formatted in {currency}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarlyBirdReport;
