import React, { useState, useEffect, useRef, useCallback } from 'react';
import { bhattaService, SalesInvoice } from '../../services/bhattaService';
import {
  TrendingUp,
  Coins,
  Package,
  PlusCircle,
  FileText,
  Receipt,
  AlertCircle,
  Layers,
  Scale,
  Users,
  Building2,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  X,
  Filter,
  Truck,
  Flame,
} from 'lucide-react';
import { Link } from 'react-router';
import { BhattaInvoiceModal } from '../../components/BhattaInvoiceModal';
import { DateRangeFilter, DateRange, getInitialTodayRange } from '../../components/DateRangeFilter';
import { useLanguage } from '../../context/LanguageContext';

export function BhattaDashboard() {
  const { isUrdu, t } = useLanguage();
  const [dateRange, setDateRange] = useState<DateRange>(getInitialTodayRange());
  const [stats, setStats] = useState(() => bhattaService.getExecutiveDashboardStats(getInitialTodayRange()));
  const [invoices, setInvoices] = useState<SalesInvoice[]>(() => bhattaService.getInvoices().slice(0, 6));
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);

  const loadRealtimeData = useCallback((rangeToUse: DateRange) => {
    setStats(bhattaService.getExecutiveDashboardStats(rangeToUse));
    setInvoices(bhattaService.getInvoices().slice(0, 6));
  }, []);

  const handleDateFilterChange = (range: DateRange) => {
    setDateRange(range);
    loadRealtimeData(range);
  };

  // Real-time synchronization across storage, focus, and custom update events
  useEffect(() => {
    loadRealtimeData(dateRange);

    const handleDataChange = () => {
      loadRealtimeData(dateRange);
    };

    window.addEventListener('bhatta_data_updated', handleDataChange);
    window.addEventListener('storage', handleDataChange);
    window.addEventListener('focus', handleDataChange);

    return () => {
      window.removeEventListener('bhatta_data_updated', handleDataChange);
      window.removeEventListener('storage', handleDataChange);
      window.removeEventListener('focus', handleDataChange);
    };
  }, [dateRange, loadRealtimeData]);

  // Stock overview
  const stockItems = [
    { 
      label: isUrdu ? 'اول اینٹ (نمبر 1)' : 'Aent Aval (First)', 
      key: 'aval', 
      count: stats.stocks.aval, 
      color: 'from-blue-600 to-indigo-600', 
      badge: 'bg-blue-50 text-blue-700 border-blue-200' 
    },
    { 
      label: isUrdu ? 'دوئم اینٹ (نمبر 2)' : 'Aent Doem (Second)', 
      key: 'doem', 
      count: stats.stocks.doem, 
      color: 'from-emerald-500 to-teal-600', 
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' 
    },
    { 
      label: isUrdu ? 'سوئم اینٹ (نمبر 3)' : 'Aent Soyem (Third)', 
      key: 'soyem', 
      count: stats.stocks.soyem, 
      color: 'from-amber-500 to-yellow-600', 
      badge: 'bg-amber-50 text-amber-700 border-amber-200' 
    },
    { 
      label: isUrdu ? 'ٹائل (چھت و فرش)' : 'Tiles (Roof/Floor)', 
      key: 'tile', 
      count: stats.stocks.tile, 
      color: 'from-purple-500 to-indigo-600', 
      badge: 'bg-purple-50 text-purple-700 border-purple-200' 
    },
    { 
      label: isUrdu ? 'کچی اینٹ (زمین پر)' : 'Kacchi Ground Stock', 
      key: 'kacchi', 
      count: stats.stocks.kacchi, 
      color: 'from-slate-500 to-gray-600', 
      badge: 'bg-slate-100 text-slate-700 border-slate-300' 
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header & Filter Controls (Top-Bar Positioned) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <Building2 className="text-[#1D4ED8]" size={24} />
            <span>{isUrdu ? 'ڈیش بورڈ خلاصہ' : 'Dashboard Overview'}</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            {isUrdu ? 'بھٹہ کی مجموعی پیداوار، اسٹاک، تنخواہیں اور مالیاتی جائزہ' : 'Real-time production, stock, salaries & financial overview'}
          </p>
        </div>

        {/* Global Filter Buttons Row (Strictly single horizontal row with inline custom inputs) */}
        <div className="shrink-0 max-w-full">
          <DateRangeFilter onChange={handleDateFilterChange} />
        </div>
      </div>

      {/* 6 STANDARDIZED EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        
        {/* Card 1: Total Production */}
        <Link to="/bhatta/kacchi" className="block bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-blue-100/40 border border-blue-300/80 border-t-4 border-t-blue-600 rounded-xl p-4 shadow-xs hover:shadow-md transition-all relative overflow-hidden group cursor-pointer flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-blue-900 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                {isUrdu ? 'کل پیداوار' : 'Total Production'}
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Layers size={15} />
              </div>
            </div>
            <div className="text-2xl font-black text-blue-950 font-mono leading-tight">
              {((Number(stats.todayProduction.totalKacchiAll) || 0) + (Number(stats.todayProduction.totalNikasiAll) || 0) || Number(stats.todayProduction.totalOverall) || 0).toLocaleString()} <span className="text-[10px] font-semibold text-blue-700">{isUrdu ? 'اینٹ' : 'units'}</span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-blue-200/80 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-blue-950 bg-white/75 px-2.5 py-1.5 rounded-lg border border-blue-100 shadow-2xs">
                <span>{isUrdu ? 'کچی اینٹ پیداوار:' : 'Raw Bricks (Kacchi):'}</span>
                <strong className="text-blue-700 font-bold font-mono">{(Number(stats.todayProduction.totalKacchiAll) || 0).toLocaleString()}</strong>
              </div>
              <div className="flex items-center justify-between text-indigo-950 bg-white/75 px-2.5 py-1.5 rounded-lg border border-indigo-100 shadow-2xs">
                <span>{isUrdu ? 'پکی اینٹ نکاسی:' : 'Baked Bricks (Pakki):'}</span>
                <strong className="text-indigo-700 font-bold font-mono">{(Number(stats.todayProduction.totalNikasiAll) || 0).toLocaleString()}</strong>
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-blue-200/70 flex items-center justify-between text-[10px] text-blue-900/90 font-medium">
            <span>{isUrdu ? 'کچی و پکی تفاصیل' : 'Production details'}</span>
            <span className="text-blue-700 hover:underline font-bold">{isUrdu ? 'پیداوار دیکھیں &rarr;' : 'View &rarr;'}</span>
          </div>
        </Link>

        {/* Card 2: Total Sales Amount */}
        <Link to="/bhatta/sales" className="block bg-gradient-to-br from-emerald-50 via-green-50/50 to-emerald-100/50 border border-emerald-300/80 border-t-4 border-t-emerald-600 rounded-xl p-4 shadow-xs hover:shadow-md transition-all relative overflow-hidden group cursor-pointer flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                {isUrdu ? 'کل سیلز رقم' : 'Total Sales Amount'}
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <TrendingUp size={15} />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono leading-tight">
              Rs. {stats.financials.totalSalesRevenue.toLocaleString()}
            </div>
            <div className="mt-2.5 pt-2 border-t border-emerald-200/80 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-emerald-950 bg-white/75 px-2.5 py-1.5 rounded-lg border border-emerald-100 shadow-2xs">
                <span>{isUrdu ? 'سیلز بلنگ آمدن:' : 'Billed Sales Revenue:'}</span>
                <span className="font-bold font-mono text-emerald-700">Rs. {stats.financials.totalSalesRevenue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-950 bg-white/75 px-2.5 py-1.5 rounded-lg border border-emerald-100 shadow-2xs">
                <span>{isUrdu ? 'نقد وصول شدہ:' : 'Cash Collected:'}</span>
                <span className="font-bold font-mono text-teal-700">Rs. {stats.financials.totalPaymentsReceived.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-emerald-200/70 flex items-center justify-between text-[10px] text-emerald-900 font-medium">
            <span>{isUrdu ? 'کسٹمر انوائسز ریکارڈ' : 'All customer invoices'}</span>
            <span className="text-emerald-700 hover:underline font-bold">{isUrdu ? 'سیلز کھاتہ &rarr;' : 'Sales &rarr;'}</span>
          </div>
        </Link>

        {/* Card 3: Total Received Amount */}
        <Link to="/bhatta/customer-ledger" className="block bg-gradient-to-br from-cyan-50 via-teal-50/50 to-cyan-100/50 border border-cyan-300/80 border-t-4 border-t-cyan-600 rounded-xl p-4 shadow-xs hover:shadow-md transition-all relative overflow-hidden group cursor-pointer flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-900">
                {isUrdu ? 'کل وصول شدہ رقم' : 'Total Received Amount'}
              </span>
              <div className="w-7 h-7 rounded-lg bg-cyan-600 text-white flex items-center justify-center shadow-xs">
                <Coins size={15} />
              </div>
            </div>
            <div className="text-2xl font-black text-cyan-900 font-mono leading-tight">
              Rs. {stats.financials.totalPaymentsReceived.toLocaleString()}
            </div>
            <div className="mt-2.5 pt-2 border-t border-cyan-200/80 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-cyan-950 bg-white/75 px-2.5 py-1.5 rounded-lg border border-cyan-100 shadow-2xs">
                <span>{isUrdu ? 'نقد / بینک ریکوری:' : 'Cash & Bank Recovery:'}</span>
                <span className="font-bold font-mono text-cyan-800">Rs. {stats.financials.totalPaymentsReceived.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-slate-800 bg-white/75 px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-2xs">
                <span>{isUrdu ? 'مارکیٹ ادھار باقی:' : 'Pending Market Credit:'}</span>
                <span className="font-bold font-mono text-rose-600">Rs. {stats.financials.totalOutstandingCustomerBalances.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-cyan-200/70 flex items-center justify-between text-[10px] text-cyan-800 font-medium">
            <span>{isUrdu ? 'نقد و آن لائن وصولی' : 'Cash recovered'}</span>
            <span className="text-cyan-800 hover:underline font-bold">{isUrdu ? 'وصولی لیجر &rarr;' : 'Ledger &rarr;'}</span>
          </div>
        </Link>

        {/* Card 4: Total Pending Amount */}
        <Link to="/bhatta/customer-ledger" className="block bg-gradient-to-br from-rose-50 via-red-50/50 to-rose-100/50 border border-rose-300/80 border-t-4 border-t-rose-600 rounded-xl p-4 shadow-xs hover:shadow-md transition-all relative overflow-hidden group cursor-pointer flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-900">
                {isUrdu ? 'کل بقایا ادھار' : 'Total Pending Amount'}
              </span>
              <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
                <AlertCircle size={15} />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-600 font-mono leading-tight">
              Rs. {stats.financials.totalOutstandingCustomerBalances.toLocaleString()}
            </div>
            <div className="mt-2.5 pt-2 border-t border-rose-200/80 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-slate-800 bg-white/75 px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-2xs">
                <span className="text-[11px] text-slate-600">{isUrdu ? 'کل انوائسز رقم:' : 'Total Billed:'}</span>
                <span className="font-bold font-mono text-slate-800">Rs. {stats.financials.totalSalesRevenue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-800 bg-white/75 px-2.5 py-1.5 rounded-lg border border-emerald-100 shadow-2xs">
                <span className="text-[11px] text-emerald-700">{isUrdu ? 'کل وصول شدہ:' : 'Recovered:'}</span>
                <span className="font-bold font-mono text-emerald-700">Rs. {stats.financials.totalPaymentsReceived.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-rose-200/70 flex items-center justify-between text-[10px] text-rose-800 font-medium">
            <span>{isUrdu ? 'مارکیٹ وصولی باقی (کسٹمر ادھار)' : 'Customer udhar'}</span>
            <span className="text-rose-700 hover:underline font-bold">{isUrdu ? 'کسٹمر لیجر &rarr;' : 'Ledger &rarr;'}</span>
          </div>
        </Link>

        {/* Card 5: Total Expenses (Integrated with Salaries, Matti Trolley, and Fuel & Coal) */}
        <Link to="/bhatta/expenses" className="block bg-gradient-to-br from-amber-50 via-orange-50/50 to-red-100/50 border border-amber-300/80 border-t-4 border-t-amber-600 rounded-xl p-4 shadow-xs hover:shadow-md transition-all relative overflow-hidden group cursor-pointer flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                {isUrdu ? 'کل اخراجات' : 'Total Expense'}
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <Receipt size={15} />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-950 font-mono leading-tight">
              Rs. {stats.financials.totalAllExpenses.toLocaleString()}
            </div>
            
            {/* 3 EXPENSE BREAKDOWN DETAILS UNDER EXPENSE CARD */}
            <div className="mt-2.5 pt-2 border-t border-amber-200/80 space-y-1.5 text-[11px]">
              {/* Item 1: Salaries & Labor */}
              <div className="flex items-center justify-between text-indigo-950 font-medium bg-white/75 px-2.5 py-1.5 rounded-lg border border-indigo-100 shadow-2xs">
                <span className="flex items-center gap-1.5 truncate">
                  <Users size={12} className="text-indigo-600 shrink-0" />
                  <span>{isUrdu ? 'تنخواہیں و اجرت:' : 'Salaries & Wages:'}</span>
                </span>
                <span className="font-bold font-mono text-indigo-800">
                  Rs. {((stats as any).expenseBreakdown?.salaries ?? stats.financials.totalSalariesPaid ?? 0).toLocaleString()}
                </span>
              </div>

              {/* Item 2: Matti Trolley Khata */}
              <div className="flex items-center justify-between text-amber-950 font-medium bg-white/75 px-2.5 py-1.5 rounded-lg border border-amber-100 shadow-2xs">
                <span className="flex items-center gap-1.5 truncate">
                  <Truck size={12} className="text-amber-600 shrink-0" />
                  <span>{isUrdu ? 'مٹی ٹرالی کھاتہ:' : 'Matti Trolley:'}</span>
                  <span className="text-[10px] text-amber-700 font-normal">({stats.matti?.trolleyCount || 0} {isUrdu ? 'ٹرالی' : 'trolleys'})</span>
                </span>
                <span className="font-bold font-mono text-amber-900">
                  Rs. {((stats as any).expenseBreakdown?.matti ?? stats.matti?.totalBill ?? 0).toLocaleString()}
                </span>
              </div>

              {/* Item 3: Fuel & Coal Khata */}
              <div className="flex items-center justify-between text-orange-950 font-medium bg-white/75 px-2.5 py-1.5 rounded-lg border border-orange-100 shadow-2xs">
                <span className="flex items-center gap-1.5 truncate">
                  <Flame size={12} className="text-orange-600 shrink-0" />
                  <span>{isUrdu ? 'کوئلہ و ایندھن کھاتہ:' : 'Fuel & Coal:'}</span>
                </span>
                <span className="font-bold font-mono text-orange-900">
                  Rs. {((stats as any).expenseBreakdown?.fuel ?? stats.fuel?.totalBill ?? 0).toLocaleString()}
                </span>
              </div>

              {/* Item 4: General Expenses if any */}
              {((stats as any).expenseBreakdown?.generalExpenses || 0) > 0 && (
                <div className="flex items-center justify-between text-slate-800 font-medium bg-white/75 px-2.5 py-1 rounded-lg border border-slate-100 shadow-2xs">
                  <span className="flex items-center gap-1.5 truncate">
                    <Receipt size={11} className="text-slate-500 shrink-0" />
                    <span>{isUrdu ? 'متفرق اخراجات:' : 'Other Expenses:'}</span>
                  </span>
                  <span className="font-bold font-mono text-slate-700">
                    Rs. {((stats as any).expenseBreakdown?.generalExpenses || 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-amber-200/70 flex items-center justify-between text-[10px] text-amber-900 font-medium">
            <span>{isUrdu ? 'مکمل اخراجات لیجر' : 'Detailed Expense Ledger'}</span>
            <span className="text-blue-700 hover:underline font-bold flex items-center gap-0.5">
              {isUrdu ? 'کھاتہ تفصیلات دیکھیں &rarr;' : 'View Ledger &rarr;'}
            </span>
          </div>
        </Link>

        {/* Card 6: Net Profit (Rich Emerald Gradient Card) */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all relative overflow-hidden group border-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-white/90 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">
                {isUrdu ? 'خالص منافع' : 'Net Profit'}
              </span>
              <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center backdrop-blur-xs">
                <Scale size={15} />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-mono leading-tight">
              Rs. {stats.financials.netProfitOrLoss.toLocaleString()}
            </div>
            <div className="mt-2.5 pt-2 border-t border-white/20 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-emerald-100 bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10">
                <span>{isUrdu ? 'کل سیلز آمدن:' : 'Total Revenue:'}</span>
                <span className="font-bold font-mono text-white">Rs. {stats.financials.totalSalesRevenue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-100 bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10">
                <span>{isUrdu ? 'منہا کل اخراجات:' : 'Total Expenses:'}</span>
                <span className="font-bold font-mono text-rose-200">- Rs. {stats.financials.totalAllExpenses.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-white/20 flex items-center justify-between text-[10px] text-emerald-100/90 font-bold">
            <span>{stats.financials.netProfitOrLoss >= 0 ? (isUrdu ? '✓ خالص منافع میں ہے' : '✓ Profitable Net') : (isUrdu ? 'خسارہ' : 'Loss')}</span>
            <span className="text-emerald-200">{stats.financials.netProfitOrLoss >= 0 ? 'Surplus' : 'Deficit'}</span>
          </div>
        </div>

      </div>

      {/* QUICK STOCK INDICATORS (Aval, Doem, Soyem, Tiles, Kacchi) */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <Package size={18} className="text-[#1D4ED8]" />
              <span>{isUrdu ? 'بھٹہ تیار مال و اسٹاک پوزیشن' : 'Bhatta Ready Stock & Inventory Indicators'}</span>
            </h3>
            <p className="text-xs text-[#64748B]">
              {isUrdu ? 'کچی اینٹ، پکی اینٹ (اول، دوئم، سوئم) اور ٹائل کا لائیو اسٹاک ریکارڈ' : 'Live stock across raw bricks, baked grades (Aval, Doem, Soyem), and Tiles'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/bhatta/kacchi"
              className="text-xs text-[#1D4ED8] hover:underline font-semibold inline-flex items-center gap-1"
            >
              {isUrdu ? 'کچی اینٹ کھاتہ &rarr;' : 'Kacchi Stock &rarr;'}
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              to="/bhatta/nikasi"
              className="text-xs text-[#1D4ED8] hover:underline font-semibold inline-flex items-center gap-1"
            >
              {isUrdu ? 'پکی اینٹ کھاتہ &rarr;' : 'Pakki Stock &rarr;'}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {stockItems.map(item => (
            <div
              key={item.key}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                item.key === 'aval' ? 'bg-amber-50/40 border-amber-200 hover:border-amber-400' :
                item.key === 'doem' ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-400' :
                item.key === 'soyem' ? 'bg-blue-50/40 border-blue-200 hover:border-blue-400' :
                item.key === 'tile' ? 'bg-purple-50/40 border-purple-200 hover:border-purple-400' :
                'bg-slate-50/70 border-slate-300 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${item.badge} leading-normal`}>
                  {item.label}
                </span>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-[#0F172A] font-mono">
                  {item.count.toLocaleString()}
                </div>
                <div className="text-[11px] text-[#64748B] mt-1">{isUrdu ? 'اینٹ / یونٹس تیار' : 'Units Ready'}</div>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className={`h-full bg-gradient-to-r ${item.color}`}
                  style={{ width: `${Math.min(100, (item.count / 100000) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DASHBOARD DETAILS & RECENT INVOICES (CLEAN LAYOUT WITHOUT CHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Quick Financial & Salary Distribution Summary */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <Receipt size={18} className="text-[#1D4ED8]" />
                  <span>{isUrdu ? 'مالیاتی و اخراجاتی خلاصہ' : 'Financial & Expense Overview'}</span>
                </h3>
                <p className="text-xs text-[#64748B]">
                  {isUrdu ? 'تنخواہیں، مزدور ایڈوانس، اور آپریشنل اخراجات' : 'Salaries, worker loans & operating expenditure'}
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700">{isUrdu ? 'سٹاف تنخواہیں (ادا شدہ)' : 'Staff Salaries Paid'}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{isUrdu ? 'منیجر، منشی، ڈرائیور وغیرہ' : 'Staff monthly payout'}</p>
                </div>
                <p className="text-sm font-bold font-mono text-emerald-600">
                  Rs. {stats.financials.totalStaffSalaryPaid.toLocaleString()}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700">{isUrdu ? 'سٹاف تنخواہیں (بقایا)' : 'Staff Salaries Pending'}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{isUrdu ? 'اس مہینے کی واجب الادا رقم' : 'Due this month'}</p>
                </div>
                <p className="text-sm font-bold font-mono text-rose-600">
                  Rs. {stats.financials.totalStaffSalaryRemaining.toLocaleString()}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700">{isUrdu ? 'مزدور لیبر ایڈوانس' : 'Worker Advances'}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{isUrdu ? 'پتھیر، بھروائی، نکاسی مزدور' : 'Unsettled labor advances'}</p>
                </div>
                <p className="text-sm font-bold font-mono text-amber-600">
                  Rs. {stats.financials.totalWorkerAdvancesGiven.toLocaleString()}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-900">{isUrdu ? 'کل اخراجات بمع تنخواہیں' : 'Total Expenses Inc. Salaries'}</p>
                  <p className="text-[11px] text-emerald-700">{isUrdu ? 'تمام آپریشنل اخراجات و لیبر مٹی' : 'Total ledger expenses'}</p>
                </div>
                <p className="text-base font-extrabold font-mono text-emerald-800">
                  Rs. {stats.financials.totalAllExpenses.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <Link
              to="/bhatta/staff"
              className="text-xs font-semibold text-[#1D4ED8] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{isUrdu ? 'سٹاف تنخواہ کھاتہ' : 'Staff Salaries'}</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/bhatta/expenses"
              className="text-xs font-semibold text-[#1D4ED8] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{isUrdu ? 'روزمرہ اخراجات' : 'Daily Expenses'}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Right: Recent Sales Invoices with Instant PDF/Print */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <FileText size={18} className="text-[#1D4ED8]" />
                  <span>{isUrdu ? 'حالیہ سیلز انوائسز (بل پرچیاں)' : 'Recent Sales Invoices'}</span>
                </h3>
                <p className="text-xs text-[#64748B]">
                  {isUrdu ? 'تیار شدہ بل پرچیاں اور نقد و ادھار حساب' : 'Branded printable invoices generated'}
                </p>
              </div>
              <Link to="/bhatta/billing" className="text-xs text-[#1D4ED8] font-semibold hover:underline">
                {isUrdu ? 'تمام دیکھیں &rarr;' : 'View All &rarr;'}
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#1D4ED8] hover:bg-white transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#1D4ED8]">{inv.invoice_number}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-medium capitalize">
                          {inv.item_type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#0F172A] truncate mt-1">{inv.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-emerald-600">
                        Rs. {inv.net_total_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-[#64748B]">
                    <span className="font-mono">
                      {inv.quantity.toLocaleString()} {isUrdu ? 'اینٹ' : 'units'} • {inv.invoice_date}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 group-hover:text-[#1D4ED8] transition-colors">
                      {isUrdu ? 'پرنٹ بل &rarr;' : 'Print &rarr;'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2E8F0] text-center">
            <Link
              to="/bhatta/billing"
              className="text-xs font-semibold text-[#1D4ED8] hover:underline flex items-center justify-center gap-1 cursor-pointer"
            >
              + {isUrdu ? 'نیا پرنٹ ایبل سیلز بل بنائیں' : 'Create New Branded Sales Invoice'}
            </Link>
          </div>
        </div>

      </div>

      {/* Invoice Modal for View / Print / PDF */}
      <BhattaInvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />

    </div>
  );
}
