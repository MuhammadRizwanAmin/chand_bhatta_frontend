import React, { useState, useEffect } from 'react';
import { bhattaService, SalesInvoice } from '../../services/bhattaService';
import {
  TrendingUp,
  Coins,
  Package,
  ArrowUpRight,
  PlusCircle,
  FileText,
  Receipt,
  AlertCircle,
  Layers,
  Scale,
  Building2,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Link } from 'react-router';
import { BhattaInvoiceModal } from '../../components/BhattaInvoiceModal';
import { useLanguage } from '../../context/LanguageContext';
import chandLogo from '../../../assets/chand_bricks_logo.jpg';

export function BhattaDashboard() {
  const { isUrdu, t } = useLanguage();
  const [stats, setStats] = useState(bhattaService.getExecutiveDashboardStats());
  const [invoices, setInvoices] = useState(bhattaService.getInvoices().slice(0, 5));
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);

  useEffect(() => {
    setStats(bhattaService.getExecutiveDashboardStats());
    setInvoices(bhattaService.getInvoices().slice(0, 5));
  }, []);

  // Cash Inflow vs Outflow chart data (last 7 days simulated or actual)
  const cashFlowData = [
    { day: isUrdu ? 'پیر' : 'Mon', Inflow: 220000, Outflow: 110000 },
    { day: isUrdu ? 'منگل' : 'Tue', Inflow: 180000, Outflow: 95000 },
    { day: isUrdu ? 'بدھ' : 'Wed', Inflow: 260000, Outflow: 140000 },
    { day: isUrdu ? 'جمعرات' : 'Thu', Inflow: 190000, Outflow: 88000 },
    { day: isUrdu ? 'جمعہ' : 'Fri', Inflow: 310000, Outflow: 165000 },
    { day: isUrdu ? 'ہفتہ' : 'Sat', Inflow: 240000, Outflow: 130000 },
    { day: isUrdu ? 'اتوار' : 'Sun', Inflow: 175000, Outflow: 72000 },
  ];

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
      
      {/* Page Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">
            {isUrdu ? 'ڈیش بورڈ خلاصہ' : 'Dashboard Overview'}
          </h1>
          <p className="text-xs text-[#64748B]">
            {isUrdu ? 'بھٹہ کی مجموعی پیداوار، اسٹاک اور مالیاتی جائزہ' : 'Real-time production, stock & financial overview'}
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to="/bhatta/billing"
            className="flex items-center gap-2 px-3.5 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle size={15} />
            <span>{t('quickBillingBtn')}</span>
          </Link>
          <Link
            to="/bhatta/kacchi"
            className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-[#334155] rounded-lg text-xs font-semibold border border-[#CBD5E1] shadow-xs transition-colors cursor-pointer"
          >
            <Layers size={14} className="text-[#1D4ED8]" />
            <span>{t('quickPathaiBtn')}</span>
          </Link>
          <Link
            to="/bhatta/advances"
            className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-[#334155] rounded-lg text-xs font-semibold border border-[#CBD5E1] shadow-xs transition-colors cursor-pointer"
          >
            <Coins size={14} className="text-[#D4A017]" />
            <span>{t('menuAdvances')}</span>
          </Link>
          <Link
            to="/bhatta/expenses"
            className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-[#334155] rounded-lg text-xs font-semibold border border-[#CBD5E1] shadow-xs transition-colors cursor-pointer"
          >
            <Receipt size={14} className="text-emerald-600" />
            <span>{t('quickExpenseBtn')}</span>
          </Link>
        </div>
      </div>

      {/* 7 EXECUTIVE KPI CARDS (Total Production, Total Sales Amount, Total Received Amount, Total Pending Amount, Worker Advance, Total Expense, Net Profit) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
        
        {/* Card 1: Total Production */}
        <div className="bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-blue-100/40 border border-blue-300/80 border-t-4 border-t-blue-600 rounded-xl p-4 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between text-blue-900 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
              {isUrdu ? 'کل پیداوار' : 'Total Production'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Layers size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-950 font-mono leading-tight">
            {stats.todayProduction.totalOverall.toLocaleString()} <span className="text-[10px] font-semibold text-blue-700">{isUrdu ? 'اینٹ' : 'units'}</span>
          </div>
          <div className="mt-2 text-[10px] text-blue-900/90 flex items-center justify-between border-t border-blue-200/70 pt-1.5 font-medium">
            <span>کچی: <strong className="text-blue-700 font-bold">{stats.todayProduction.totalKacchiAll?.toLocaleString()}</strong></span>
            <span>پکی: <strong className="text-indigo-700 font-bold">{stats.todayProduction.totalNikasiAll?.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Card 2: Total Sales Amount */}
        <div className="bg-gradient-to-br from-emerald-50 via-green-50/50 to-emerald-100/50 border border-emerald-300/80 border-t-4 border-t-emerald-600 rounded-xl p-4 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
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
          <div className="mt-2 text-[10px] text-emerald-900 font-medium border-t border-emerald-200/70 pt-1.5 truncate">
            {isUrdu ? 'تمام کسٹمر انوائسز آمدن' : 'Billed sales total'}
          </div>
        </div>

        {/* Card 3: Total Recieved Amount */}
        <div className="bg-gradient-to-br from-cyan-50 via-teal-50/50 to-cyan-100/50 border border-cyan-300/80 border-t-4 border-t-cyan-600 rounded-xl p-4 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-900">
              {isUrdu ? 'کل وصول شدہ رقم' : 'Total Recieved Amount'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-cyan-600 text-white flex items-center justify-center shadow-xs">
              <Coins size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-cyan-900 font-mono leading-tight">
            Rs. {stats.financials.totalPaymentsReceived.toLocaleString()}
          </div>
          <div className="mt-2 text-[10px] text-cyan-800 font-medium border-t border-cyan-200/70 pt-1.5 truncate">
            {isUrdu ? 'نقد و آن لائن وصولی' : 'Cash recovered'}
          </div>
        </div>

        {/* Card 4: Total Pending Amount */}
        <div className="bg-gradient-to-br from-rose-50 via-red-50/50 to-rose-100/50 border border-rose-300/80 border-t-4 border-t-rose-600 rounded-xl p-4 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
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
          <div className="mt-2 text-[10px] text-rose-800 font-bold border-t border-rose-200/70 pt-1.5 truncate">
            {isUrdu ? 'مارکیٹ وصولی باقی (ادھار)' : 'Customer udhar'}
          </div>
        </div>

        {/* Card 5: Worker Advance */}
        <div className="bg-gradient-to-br from-amber-50 via-yellow-50/50 to-amber-100/50 border border-amber-300/80 border-t-4 border-t-amber-500 rounded-xl p-4 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
              {isUrdu ? 'مزدور ایڈوانس' : 'Worker Advance'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Coins size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono leading-tight">
            Rs. {stats.financials.totalWorkerAdvancesGiven.toLocaleString()}
          </div>
          <div className="mt-2 text-[10px] text-amber-900 font-medium flex items-center justify-between border-t border-amber-200/70 pt-1.5">
            <span>{isUrdu ? 'لیبر ایڈوانس کھاتہ' : 'Active loans'}</span>
            <Link to="/bhatta/advances" className="text-blue-700 hover:underline font-bold">
              {isUrdu ? 'حساب &rarr;' : 'Settle &rarr;'}
            </Link>
          </div>
        </div>

        {/* Card 6: Total Expence (Vibrant Colored Card as requested) */}
        <div className="bg-gradient-to-br from-amber-500 via-rose-600 to-red-600 text-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all relative overflow-hidden group border-0">
          <div className="flex items-center justify-between text-white/90 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-100">
              {isUrdu ? 'کل اخراجات' : 'Total Expence'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center backdrop-blur-xs">
              <Receipt size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono leading-tight">
            Rs. {stats.financials.totalAllExpenses.toLocaleString()}
          </div>
          <div className="mt-2 text-[10px] text-amber-100/90 flex items-center justify-between border-t border-white/20 pt-1.5 font-medium">
            <span>مٹی، کوئلہ، مزدور، روزمرہ</span>
            <Link to="/bhatta/expenses" className="text-white hover:underline font-bold">
              کھاتہ &rarr;
            </Link>
          </div>
        </div>

        {/* Card 7: Net Profit (Rich Emerald Gradient Card) */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all relative overflow-hidden group border-0">
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
          <div className="mt-2 text-[10px] text-emerald-100/90 font-bold border-t border-white/20 pt-1.5 truncate">
            {stats.financials.netProfitOrLoss >= 0 ? (isUrdu ? '✓ خالص منافع میں ہے' : '✓ Profitable Net') : (isUrdu ? 'خسارہ' : 'Loss')}
          </div>
        </div>

      </div>

      {/* QUICK STOCK INDICATORS (Aval, Doem, Soyem, Tiles, Kacchi) */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <Package size={18} className="text-[#1D4ED8]" />
              <span>{isUrdu ? 'بھٹہ تیار مال و اسٹاک پوزیشن' : 'Bhatta Ready Stock & Inventory Indicators'}</span>
            </h3>
            <p className="text-xs text-[#64748B]">
              {isUrdu ? 'کچی اینٹ زمین، پکی اینٹ بھٹی اور گودام میں تیار اینٹ کا لائیو ریکارڈ' : 'Live inventory counts across ground production, burning kiln, and finished stacks'}
            </p>
          </div>
          <Link
            to="/bhatta/stock"
            className="text-xs text-[#1D4ED8] hover:underline font-semibold inline-flex items-center gap-1"
          >
            {isUrdu ? 'مکمل اسٹاک مینجمنٹ &rarr;' : 'Manage Stock Details &rarr;'}
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {stockItems.map(item => (
            <div
              key={item.key}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                item.key === 'Aval' ? 'bg-amber-50/40 border-amber-200 hover:border-amber-400' :
                item.key === 'Doem' ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-400' :
                item.key === 'Soyem' ? 'bg-blue-50/40 border-blue-200 hover:border-blue-400' :
                item.key === 'Tiles' ? 'bg-purple-50/40 border-purple-200 hover:border-purple-400' :
                'bg-rose-50/40 border-rose-200 hover:border-rose-400'
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

      {/* DAILY CASH INFLOW VS OUTFLOW & RECENT INVOICES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Cash Inflow vs Outflow Graph */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <Coins size={18} className="text-[#D4A017]" />
                <span>{isUrdu ? 'روزمرہ آمدن بنام خرچ (ہفتہ وار گراف)' : 'Daily Cash Inflow vs Outflow'}</span>
              </h3>
              <p className="text-xs text-[#64748B]">
                {isUrdu ? 'آمدنی (سیلز و وصولی) اور اخراجات (ڈیزل، کوئلہ، مزدوری) کا بہاؤ' : 'Weekly financial liquidity and expenses flow'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                {isUrdu ? 'آمدن (وصولی)' : 'Inflow'}
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 font-semibold">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                {isUrdu ? 'خرچ (ادائیگی)' : 'Outflow'}
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="day" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(val) => `Rs.${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`Rs. ${Number(value).toLocaleString()}`, '']}
                />
                <Bar dataKey="Inflow" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="Outflow" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Recent Sales Invoices with Instant PDF/Print */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
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

            <div className="space-y-3">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#1D4ED8] hover:bg-white transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#1D4ED8]">{inv.invoice_number}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 font-medium">
                        {inv.item_type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#0F172A] truncate mt-1">{inv.customer_name}</p>
                    <p className="text-[11px] text-[#64748B] truncate font-mono">
                      {inv.quantity.toLocaleString()} {isUrdu ? 'اینٹ' : 'units'} • {inv.invoice_date}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono font-bold text-emerald-600">
                      Rs. {inv.net_total_amount.toLocaleString()}
                    </p>
                    <span className="text-[10px] text-slate-500 group-hover:text-[#1D4ED8] transition-colors font-medium">
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
