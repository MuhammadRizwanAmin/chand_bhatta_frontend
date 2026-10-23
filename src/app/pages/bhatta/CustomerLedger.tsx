import React, { useState, useEffect, useRef } from 'react';
import {
  bhattaService,
  Customer,
  CustomerPayment,
} from '../../services/bhattaService';
import { useBhattaSettings } from '../../context/BhattaSettingsContext';
import {
  Users,
  UserPlus,
  Search,
  Coins,
  Receipt,
  PlusCircle,
  FileText,
  Phone,
  MapPin,
  Calendar,
  X,
  Printer,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Download,
  Edit2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import chandLogo from '../../../assets/chand_bricks_logo.jpg';
import { DateRangeFilter, DateRange, getInitialTodayRange, isWithinDateRange } from '../../components/DateRangeFilter';
import { useLanguage } from '../../context/LanguageContext';

export function CustomerLedger() {
  const { settings } = useBhattaSettings();
  const { isUrdu } = useLanguage();
  const statementPrintRef = useRef<HTMLDivElement>(null);
  const [customers, setCustomers] = useState<Customer[]>(() => bhattaService.getCustomers());
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>(getInitialTodayRange());

  // Customer Add/Edit Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);

  // Payment Recovery Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    customer_id: 1,
    payment_date: getInitialTodayRange().startDate,
    amount_received: 20000,
    payment_mode: 'Cash' as 'Cash' | 'Bank_Transfer' | 'Cheque',
    reference_no: '',
    notes: 'Payment received against outstanding ledger',
  });

  // Customer Statement Modal
  const [statementData, setStatementData] = useState<any | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const custs = bhattaService.getCustomers();
    setCustomers(custs);
    if (custs.length > 0 && !paymentForm.customer_id) {
      setPaymentForm(prev => ({ ...prev, customer_id: custs[0].id }));
    }
  };

  const handleDateFilterChange = (range: DateRange) => {
    setDateRange(range);
  };

  const handleOpenAddCustomer = () => {
    setEditingCustomer({
      customer_name: '',
      phone: '',
      address: '',
      opening_balance: 0,
    });
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (cust: Customer) => {
    setEditingCustomer({
      id: cust.id,
      customer_name: cust.customer_name,
      phone: cust.phone,
      address: cust.address,
      opening_balance: cust.opening_balance,
    });
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer?.customer_name) return;
    bhattaService.saveCustomer(editingCustomer);
    setIsCustomerModalOpen(false);
    setEditingCustomer(null);
    refreshData();
  };

  const handleOpenPayment = (customerId?: number) => {
    setPaymentForm({
      customer_id: customerId || customers[0]?.id || 1,
      payment_date: dateRange.startDate || getInitialTodayRange().startDate,
      amount_received: 25000,
      payment_mode: 'Cash',
      reference_no: `RCP-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: 'Customer cash payment',
    });
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    bhattaService.addCustomerPayment({
      customer_id: Number(paymentForm.customer_id),
      payment_date: paymentForm.payment_date,
      amount_received: Number(paymentForm.amount_received),
      payment_mode: paymentForm.payment_mode,
      reference_no: paymentForm.reference_no,
      notes: paymentForm.notes,
    });
    setIsPaymentModalOpen(false);
    refreshData();
  };

  const handleViewStatement = (customerId: number) => {
    const data = bhattaService.getCustomerStatement(customerId);
    setStatementData(data);
  };

  const handleDownloadStatementPDF = (statement: any) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Header background
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 32, 'F');

      // Title & Address
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('CHAND BRICKS SUPPLIERZ', 105, 11, { align: 'center' });

      doc.setFontSize(8);
      doc.setTextColor(226, 232, 240);
      doc.text('Chak No. 431/E.B Chichawatni Road Near Go Pump Burewala', 105, 17, { align: 'center' });

      doc.setFontSize(8.5);
      doc.setTextColor(212, 160, 23); // Gold
      doc.text('Seth Haji Nasir: 0302-6780883 | Munshi Sarwar: 0304-6557345', 105, 24, { align: 'center' });

      // Statement bar
      doc.setFillColor(241, 245, 249);
      doc.rect(10, 36, 190, 8, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(29, 78, 216);
      doc.text('CUSTOMER ACCOUNT STATEMENT & LEDGER (گاہک کھاتہ و بقایا ریکارڈ)', 105, 41.5, { align: 'center' });

      // Customer Info Box
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(`Customer Name: ${statement.customer.customer_name}`, 14, 50);
      doc.text(`Phone: ${statement.customer.phone || '-'}`, 14, 55);
      doc.text(`Site / Address: ${statement.customer.address || '-'}`, 14, 60);

      doc.setFont('helvetica', 'bold');
      doc.text(`Opening Balance: Rs. ${Number(statement.openingBalance || 0).toLocaleString()}`, 130, 50);
      doc.text(`Total Billed: Rs. ${Number(statement.totalBilled || 0).toLocaleString()}`, 130, 55);
      doc.setTextColor(16, 185, 129);
      doc.text(`Total Received: Rs. ${Number(statement.totalPaid || 0).toLocaleString()}`, 130, 60);
      doc.setTextColor(225, 29, 72);
      doc.text(`Remaining Balance: Rs. ${Number(statement.currentBalance || 0).toLocaleString()}`, 130, 65);

      const tableRows = (statement.ledger || []).map((row: any) => [
        row.date,
        row.type === 'BILL' || row.type === 'Invoice' ? 'Sale Invoice' : 'Payment Received',
        row.description,
        Number(row.debit) > 0 ? `Rs. ${Number(row.debit).toLocaleString()}` : '-',
        Number(row.credit) > 0 ? `Rs. ${Number(row.credit).toLocaleString()}` : '-',
        `Rs. ${Number(row.balance ?? row.runningBalance ?? 0).toLocaleString()}`,
      ]);

      autoTable(doc, {
        startY: 70,
        head: [['Date', 'Type', 'Description', 'Billed (+)', 'Received (-)', 'Balance']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [29, 78, 216], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 160;
      doc.setFillColor(241, 245, 249);
      doc.rect(10, finalY + 4, 190, 10, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(225, 29, 72);
      doc.text(`Net Outstanding Balance Due: Rs. ${Number(statement.currentBalance || 0).toLocaleString()}`, 195, finalY + 10.5, { align: 'right' });

      doc.save(`Statement_${statement.customer.customer_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error('PDF error', e);
      window.print();
    }
  };

  const handlePrintStatement = () => {
    const printContent = statementPrintRef.current;
    if (!printContent) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="ur" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <title>CustomerStatement</title>
          ${styles}
          <style>
            @page { size: A4 portrait; margin: 8mm 10mm; }
            *, *::before, *::after, html, body {
              font-family: 'Jameel Noori Nastaliq', 'Jameel Noori Nastaleeq', 'JameelNooriNastaliq', 'Noto Nastaliq Urdu', serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body { background: white !important; color: #0F172A !important; margin: 0; padding: 0; }
            #stmt-root { width: 100%; max-width: 100%; margin: 0 auto; background: white; padding: 4mm 6mm; }
          </style>
        </head>
        <body><div id="stmt-root">${printContent.innerHTML}</div></body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        try { document.body.removeChild(iframe); } catch {}
      }, 3000);
    }, 400);
  };

  const handleDownloadCustomersListPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 30, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('CHAND BRICKS SUPPLIERZ', 105, 10, { align: 'center' });

      doc.setFontSize(8);
      doc.setTextColor(226, 232, 240);
      doc.text('Chak No. 431/E.B Chichawatni Road Near Go Pump Burewala', 105, 16, { align: 'center' });

      doc.setFontSize(8);
      doc.setTextColor(212, 160, 23);
      doc.text('Seth Haji Nasir: 0302-6780883 | Munshi Sarwar: 0304-6557345', 105, 22, { align: 'center' });

      // Title
      doc.setFillColor(241, 245, 249);
      doc.rect(10, 34, 190, 8, 'F');
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(29, 78, 216);
      doc.text('CUSTOMER OUTSTANDING BALANCES & CREDIT AUDIT (گاہک ادھار کھاتہ)', 105, 39.5, { align: 'center' });

      const totalBalance = filteredCustomers.reduce((sum, c) => {
        const stmt = bhattaService.getCustomerStatement(c.id);
        return sum + (stmt.currentBalance || 0);
      }, 0);

      const tableRows = filteredCustomers.map(c => {
        const stmt = bhattaService.getCustomerStatement(c.id);
        const payments = bhattaService.getPayments().filter(p => p.customer_id === c.id);
        const lastPayment = payments[payments.length - 1];
        const lastPaid = lastPayment ? lastPayment.amount_received : 0;
        const lastDate = lastPayment ? lastPayment.payment_date : (stmt.ledger[stmt.ledger.length - 1]?.date || '-');

        return [
          c.customer_name,
          lastDate,
          `Rs. ${lastPaid.toLocaleString()}`,
          `Rs. ${stmt.currentBalance.toLocaleString()}`,
          `Rs. ${stmt.totalPaid.toLocaleString()}`,
        ];
      });

      autoTable(doc, {
        startY: 46,
        head: [['Customer Name', 'Date', 'Last Paid Amount', 'Remaining Balance', 'Received Amount']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [29, 78, 216], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 150;
      doc.setFillColor(241, 245, 249);
      doc.rect(10, finalY + 4, 190, 10, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(225, 29, 72);
      doc.text(`Total Outstanding Market Credit: Rs. ${totalBalance.toLocaleString()}`, 195, finalY + 10.5, { align: 'right' });

      doc.save(`Customer_Balances_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error('PDF error', e);
      window.print();
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch =
      c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    
    // Filter by date range against ledger activities
    const stmt = bhattaService.getCustomerStatement(c.id);
    if (!stmt.ledger || stmt.ledger.length === 0) return true;
    return stmt.ledger.some((row: any) => isWithinDateRange(row.date, dateRange));
  });

  const totalMarketUdhar = customers.reduce((sum, c) => {
    const stmt = bhattaService.getCustomerStatement(c.id);
    return sum + (stmt.currentBalance || 0);
  }, 0);
  const totalRecovered = bhattaService.getPayments().reduce((sum, p) => sum + (p.amount_received || 0), 0);
  const totalAmount = customers.reduce((sum, c) => {
    const stmt = bhattaService.getCustomerStatement(c.id);
    return sum + (stmt.totalBilled || 0) + (stmt.openingBalance || 0);
  }, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Header & Global Date Filter (Top-Bar Positioned) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <Users className="text-[#1D4ED8]" size={24} />
            <span>{isUrdu ? 'گاہک کھاتہ (Customer Ledger)' : 'Customer Ledger'}</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            {isUrdu ? 'گاہکوں کے کھاتہ جات، ادھار بقایا اور فوری کیش وصولی اندراج' : 'Customer profiles, outstanding debt balance tracking, recovery collections, and statements'}
          </p>
        </div>

        {/* Global Date Filter */}
        <div className="flex items-center gap-2.5 flex-wrap xl:flex-nowrap">
          <div className="shrink-0 max-w-full">
            <DateRangeFilter onChange={handleDateFilterChange} />
          </div>


        </div>
      </div>

      {/* 3 AMOUNT-RELEVANT KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Amount (کل رقم) */}
        <div className="bg-gradient-to-br from-blue-50 via-sky-50/50 to-blue-100/50 border border-blue-200/90 border-t-4 border-t-[#1D4ED8] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-blue-900 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">TOTAL AMOUNT (کل رقم)</span>
            <div className="w-7 h-7 rounded-lg bg-[#1D4ED8] text-white flex items-center justify-center shadow-xs">
              <FileText size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1D4ED8] font-mono leading-tight">
            Rs. {totalAmount.toLocaleString()}
          </div>
          <p className="text-[10px] text-blue-900 font-semibold mt-1">Total sales & billing (کل مال فروخت)</p>
        </div>

        {/* Card 2: Total Received / Recoveries (کل وصول شدہ رقم) */}
        <div className="bg-gradient-to-br from-emerald-50 via-green-50/50 to-emerald-100/50 border border-emerald-300/80 border-t-4 border-t-emerald-600 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-900 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">TOTAL RECEIVED (کل وصول شدہ رقم)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Coins size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono leading-tight">
            Rs. {totalRecovered.toLocaleString()}
          </div>
          <p className="text-[10px] text-emerald-900 font-semibold mt-1">Total recoveries received</p>
        </div>

        {/* Card 3: Total Pending / Market Udhar (کل بقایا ادھار) */}
        <div className="bg-gradient-to-br from-rose-50 via-red-50/50 to-rose-100/50 border border-rose-300/80 border-t-4 border-t-rose-600 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-rose-900 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">TOTAL PENDING (کل بقایا ادھار)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <AlertCircle size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono leading-tight">
            Rs. {totalMarketUdhar.toLocaleString()}
          </div>
          <p className="text-[10px] text-rose-800 font-bold mt-1">Remaining market credit across all buyers</p>
        </div>
      </div>

      {/* SEARCH AND CUSTOMER ACTIONS */}
      <div className="bg-white rounded-xl shadow-xs p-4 border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={isUrdu ? 'گاہک کا نام، فون نمبر یا پتہ تلاش کریں...' : 'Search by customer name, phone, or site address...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadCustomersListPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-300 text-slate-700 bg-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Download size={14} className="text-[#1D4ED8]" />
            <span>PDF</span>
          </button>
            <button
              onClick={() => handleOpenPayment()}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Coins size={15} />
              <span>{isUrdu ? 'وصولی اندراج' : 'Receive Cash'}</span>
            </button>
            <button
              onClick={handleOpenAddCustomer}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <UserPlus size={15} />
              <span>{isUrdu ? 'نیا گاہک' : 'Add Customer'}</span>
            </button>
        </div>
      </div>

      {/* STANDARDIZED CUSTOMER LEDGER & HISTORY TABLE */}
      {/* REQUIRED COLUMNS: Customer Name, Date, Last Paid Amount, Remaining Balance, Received Amount (emphasized), Actions (Edit Customer) */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-[#E2E8F0] uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">{isUrdu ? 'گاہک کا نام' : 'Customer Name'}</th>
                <th className="py-3 px-4">{isUrdu ? 'تاریخ' : 'Date'}</th>
                <th className="py-3 px-4 text-right">{isUrdu ? 'آخری ادا رقم' : 'Last Paid Amount'}</th>
                <th className="py-3 px-4 text-right">{isUrdu ? 'باقی بقایا' : 'Remaining Balance'}</th>
                <th className="py-3 px-4 text-center bg-emerald-50/70 border-x border-emerald-200 text-emerald-900 font-black">
                  {isUrdu ? 'وصول شدہ رقم' : 'Received Amount'}
                </th>
                <th className="py-3 px-4 text-center">{isUrdu ? 'کارروائی' : 'Actions (Edit Customer)'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-[#0F172A]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    {isUrdu ? 'کوئی گاہک ریکارڈ نہیں ملا' : 'No customers found matching search.'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const stmt = bhattaService.getCustomerStatement(cust.id);
                  const payments = bhattaService.getPayments().filter(p => p.customer_id === cust.id);
                  const lastPayment = payments[payments.length - 1];
                  const lastPaidAmount = lastPayment ? lastPayment.amount_received : 0;
                  const latestDate = lastPayment 
                    ? lastPayment.payment_date 
                    : (stmt.ledger[stmt.ledger.length - 1]?.date || '-');

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                      {/* 1. Customer Name */}
                      <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#1E40AF] flex items-center justify-center font-bold text-white text-xs shadow-xs shrink-0">
                            {cust.customer_name[0]}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[#0F172A] font-bold block truncate">{cust.customer_name}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">{cust.phone || cust.address || `ID: #${cust.id}`}</span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {latestDate}
                      </td>

                      {/* 3. Last Paid Amount */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700 whitespace-nowrap font-medium">
                        {lastPaidAmount > 0 ? `Rs. ${lastPaidAmount.toLocaleString()}` : 'Rs. 0'}
                      </td>

                      {/* 4. Remaining Balance */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm whitespace-nowrap">
                        <span className={stmt.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          Rs. {stmt.currentBalance.toLocaleString()}
                        </span>
                      </td>

                      {/* 5. Received Amount (CLEAR VISUAL EMPHASIS) */}
                      <td className="py-3.5 px-4 text-center bg-emerald-50/50 border-x border-emerald-200/80 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-black text-xs shadow-xs">
                          <CheckCircle2 size={12} className="text-emerald-700" />
                          <span>Rs. {stmt.totalPaid.toLocaleString()}</span>
                        </span>
                      </td>

                      {/* 6. Actions (Edit Customer) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditCustomer(cust)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#1D4ED8] font-bold text-[11px] transition-colors cursor-pointer border border-slate-200"
                            title="Edit Customer (گاہک میں ترمیم کریں)"
                          >
                            <Edit2 size={12} />
                            <span>Edit Customer</span>
                          </button>
                          <button
                            onClick={() => handleOpenPayment(cust.id)}
                            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] transition-colors cursor-pointer border border-emerald-200"
                            title="Record Cash Recovery"
                          >
                            + Cash
                          </button>
                          <button
                            onClick={() => handleViewStatement(cust.id)}
                            className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] font-semibold text-[11px] transition-colors cursor-pointer border border-blue-200"
                            title="View Statement Ledger"
                          >
                            Statement
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT CUSTOMER MODAL */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 px-5 border-b border-[#E2E8F0] bg-[#0F172A] text-white">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus size={18} className="text-[#1D4ED8]" />
                <span>{editingCustomer?.id ? 'Edit Customer (گاہک کی تفصیلات بدلیں)' : 'Add New Customer Profile (نیا گاہک)'}</span>
              </h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-5 space-y-4 text-[#0F172A]">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Customer / Contractor Name (گاہک نام) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Malik Arshad Builder"
                  value={editingCustomer?.customer_name || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, customer_name: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number (فون نمبر)</label>
                <input
                  type="text"
                  placeholder="0300-1234567"
                  value={editingCustomer?.phone || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Site / Delivery Address (پتہ و سائٹ)</label>
                <input
                  type="text"
                  placeholder="Burewala site, bypass road"
                  value={editingCustomer?.address || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Opening Balance / سابقہ بقایا (PKR)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={editingCustomer?.opening_balance ?? ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, opening_balance: e.target.value.replace(/[^0-9.-]/g, '') as any })}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  {editingCustomer?.id ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT RECOVERY MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 px-5 border-b border-[#E2E8F0] bg-[#0F172A] text-white">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Coins size={18} className="text-emerald-500" />
                <span>Record Payment Recovery (گاہک سے رقم وصولی)</span>
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-5 space-y-4 text-[#0F172A]">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Customer (گاہک کا انتخاب) *</label>
                <select
                  required
                  value={paymentForm.customer_id}
                  onChange={(e) => setPaymentForm({ ...paymentForm, customer_id: Number(e.target.value) })}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.customer_name} ({c.phone || c.address})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Date (تاریخ) *</label>
                  <input
                    type="date"
                    required
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Amount Received (وصول رقم) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="مثلاً 50000"
                    value={paymentForm.amount_received}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount_received: e.target.value.replace(/[^0-9.]/g, '') as any })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] font-mono font-bold text-emerald-600 focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Mode (طریقہ)</label>
                  <select
                    value={paymentForm.payment_mode}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value as any })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                  >
                    <option value="Cash">Cash (نقد)</option>
                    <option value="Bank_Transfer">Bank Transfer (بینک)</option>
                    <option value="Cheque">Cheque (چیک)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Receipt / Ref #</label>
                  <input
                    type="text"
                    value={paymentForm.reference_no}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference_no: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Notes / Description (تفصیل)</label>
                <input
                  type="text"
                  placeholder="e.g. Paid in full for trolley delivery, or partial cash"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  Save Recovery Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER STATEMENT / LEDGER MODAL */}
      {statementData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden my-auto border border-slate-300 flex flex-col max-h-[96vh]">
            
            {/* Top Control Bar */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-[#0F172A] text-white border-b border-slate-800 print:hidden shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={settings.logoUrl || chandLogo}
                  alt="Logo"
                  className="w-8 h-8 rounded-lg object-cover bg-white p-0.5 shadow-sm"
                />
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base leading-tight font-urdu">
                    {settings.businessNameUrdu || 'چاند برکس سپلائرز (اے ایم ڈی)'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Customer: {statementData.customer?.customer_name} (#{statementData.customer?.id})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadStatementPDF(statementData)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  lang="en" title="Save PDF"
                >
                  <Download size={15} />
                  <span className="font-sans">Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintStatement}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1D4ED8] hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  lang="en" title="Print"
                >
                  <Printer size={15} />
                  <span className="font-sans">Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatementData(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-1"
                  title="Close (بند کریں)"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable Printable Statement Body */}
            <div className="flex-1 overflow-y-auto">
              <div
                ref={statementPrintRef}
                className="p-6 sm:p-10 bg-white text-slate-900"
              >
                {/* Top Official Bhatta Header Branding - Exactly Matches Sales Receipt */}
                <div className="border-b-2 border-[#1D4ED8] pb-5">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    
                    {/* Logo and Titles */}
                    <div className="flex items-center gap-4 text-right">
                      <img
                        src={settings.logoUrl || chandLogo}
                        alt="Official Logo"
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover bg-white p-1.5 shadow-md shrink-0 border-2 border-slate-200 ring-2 ring-blue-100"
                      />
                      <div className="text-right space-y-0.5">
                        <h2 className="text-2xl sm:text-3xl font-black text-[#1D4ED8] font-urdu leading-tight">
                          {settings.businessNameUrdu || 'چاند برکس سپلائرز (اے ایم ڈی)'}
                        </h2>
                        <p className="text-xs sm:text-sm font-urdu font-bold text-amber-700">
                          {(settings.taglineUrdu || 'چاند برکس بوریوالا (سپیشل اول اینٹ)').replace('• بوریوالا', 'بوریوالا')}
                        </p>
                        <p className="text-xs text-slate-700 font-urdu flex items-center justify-start gap-1">
                          <MapPin size={13} className="text-[#1D4ED8] shrink-0" />
                          <span>{settings.addressUrdu}</span>
                        </p>
                        <p className="text-xs text-slate-600 font-urdu pr-4">
                          چیچہ وطنی روڈ بائی پاس، بوریوالا (ضلع وہاڑی)
                        </p>
                      </div>
                    </div>

                    {/* Statement Tag and Date */}
                    <div className="text-center sm:text-right bg-slate-50 p-4 rounded-xl border border-slate-200 shrink-0 min-w-[200px]">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                        <CheckCircle2 size={13} />
                        <span>گاہک کھاتہ اسٹیٹمنٹ</span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Customer ID:</div>
                      <div className="font-mono font-black text-base text-[#1D4ED8]">#{statementData.customer?.id}</div>
                      <div className="text-xs text-slate-500 mt-1.5 font-medium">Statement Date:</div>
                      <div className="font-mono font-bold text-xs text-slate-800">{new Date().toLocaleDateString('en-CA')}</div>
                    </div>
                  </div>

                  {/* Contact Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 bg-blue-50/60 px-3 py-1.5 rounded-lg border border-blue-100">
                      <Phone size={14} className="text-[#1D4ED8] shrink-0" />
                      <span className="font-bold text-slate-800 font-urdu text-xs">سیٹھ حاجی ناصر:</span>
                      <span className="font-mono text-blue-950 font-bold text-xs">{settings.hajiPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50/60 px-3 py-1.5 rounded-lg border border-blue-100">
                      <Phone size={14} className="text-[#1D4ED8] shrink-0" />
                      <span className="font-bold text-slate-800 font-urdu text-xs">منشی سرور:</span>
                      <span className="font-mono text-blue-950 font-bold text-xs">{settings.munshiPhone}</span>
                    </div>
                  </div>

                  {/* Proprietors Strip */}
                  <div className="mt-2.5 py-1.5 px-3 bg-slate-100 rounded-lg text-center text-[11px] text-slate-700 font-urdu border border-slate-200/80">
                    ملکیت و شراکت داران: {settings.proprietors || 'سیٹھ حاجی محمد بوٹا (مرحوم) • سیٹھ بشیر احمد (مرحوم) • حاجی سیٹھ مجید'}
                  </div>
                </div>

                {/* Customer Details Box */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-500 block mb-0.5 font-urdu">گاہک کا نام (Customer):</span>
                    <p className="font-bold text-slate-900 text-sm">{statementData.customer?.customer_name}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5 font-urdu">فون نمبر (Phone):</span>
                    <p className="font-mono font-bold text-slate-800">{statementData.customer?.phone || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5 font-urdu">سائٹ / پتہ (Site):</span>
                    <p className="text-slate-800">{statementData.customer?.address || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5 font-urdu">موجودہ خالص بقایا (Net Balance):</span>
                    <p className="font-mono font-black text-sm text-rose-600">
                      Rs. {Number(statementData.currentBalance || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Ledger Table with Royal Blue Header matching Sales Invoice */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl mb-6 shadow-xs">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#1D4ED8] text-white font-bold font-urdu">
                      <tr>
                        <th className="py-3 px-3 text-center">#</th>
                        <th className="py-3 px-3 text-center">تاریخ (Date)</th>
                        <th className="py-3 px-3 text-center">قسم و رسید (Type & Ref)</th>
                        <th className="py-3 px-3 text-right">تفصیل مال و وصولی (Description)</th>
                        <th className="py-3 px-3 text-right">بنام / مال رقم (Debit +)</th>
                        <th className="py-3 px-3 text-right">جمع / وصولی رقم (Credit -)</th>
                        <th className="py-3 px-3 text-right font-black">بقایا میزان (Balance)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-900">
                      {(statementData.ledger || []).map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3 text-center font-mono whitespace-nowrap">{row.date}</td>
                          <td className="py-3 px-3 text-center font-mono whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.type === 'BILL' || row.type === 'Invoice' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {row.type === 'BILL' || row.type === 'Invoice' ? 'سیلز بل' : 'نقد وصولی'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-urdu text-slate-700">{row.description}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            {Number(row.debit) > 0 ? `Rs. ${Number(row.debit).toLocaleString()}` : '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 bg-emerald-50/30">
                            {Number(row.credit) > 0 ? `Rs. ${Number(row.credit).toLocaleString()}` : '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-rose-600 bg-rose-50/20">
                            Rs. {Number(row.balance ?? row.runningBalance ?? 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total Net Payable Stamp */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-xl bg-gradient-to-r from-rose-50 via-red-50/40 to-slate-50 border border-rose-200 mb-6">
                  <div>
                    <p className="text-xs font-bold text-slate-700 font-urdu">کل بقایا واجب الادا رقم (Total Outstanding):</p>
                    <p className="text-xs text-rose-700 font-semibold font-urdu mt-0.5">
                      یہ کھاتہ برائے تصدیق و ریکارڈ جاری کیا گیا ہے۔
                    </p>
                  </div>
                  <div className="sm:text-right w-full sm:w-auto">
                    <div className="text-2xl sm:text-3xl font-black text-rose-600 font-mono">
                      Rs. {Number(statementData.currentBalance || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-dashed border-slate-300 text-xs">
                  <div className="text-center">
                    <div className="h-10 border-b border-slate-400 mx-auto w-44"></div>
                    <p className="mt-2 font-bold text-slate-900 font-urdu text-sm">دستخط منشی / اکاؤنٹنٹ</p>
                    <p className="text-[10px] text-slate-500 font-mono">{settings.managerName}</p>
                  </div>
                  <div className="text-center">
                    <div className="h-10 border-b border-slate-400 mx-auto w-44"></div>
                    <p className="mt-2 font-bold text-slate-900 font-urdu text-sm">دستخط خریدار / گاہک</p>
                    <p className="text-[10px] text-slate-500">Customer Verified Signature</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
