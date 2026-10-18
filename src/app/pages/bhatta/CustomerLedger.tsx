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
  CreditCard,
  Phone,
  MapPin,
  Calendar,
  X,
  Printer,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import chandLogo from '../../../assets/chand_bricks_logo.jpg';

export function CustomerLedger() {
  const { settings } = useBhattaSettings();
  const statementPrintRef = useRef<HTMLDivElement>(null);
  const [customers, setCustomers] = useState<Customer[]>(bhattaService.getCustomers());
  const [searchTerm, setSearchTerm] = useState('');

  // Customer Add/Edit Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);

  // Payment Recovery Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    customer_id: customers[0]?.id || 1,
    payment_date: new Date().toISOString().split('T')[0],
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
    setCustomers(bhattaService.getCustomers());
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
      payment_date: new Date().toISOString().split('T')[0],
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

      // Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 32, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('CHAND BRICKS SUPPLIERZ', 105, 11, { align: 'center' });

      doc.setFontSize(8);
      doc.setTextColor(226, 232, 240);
      doc.text('Chak No. 431/E.B Chichawatni Road Near Go Pump Burewala', 105, 17, { align: 'center' });

      doc.setFontSize(8);
      doc.setTextColor(212, 160, 23);
      doc.text('Seth Haji Nasir: 0302-6780883 | Munshi Sarwar: 0304-6557345', 105, 24, { align: 'center' });

      // Sub header
      doc.setFillColor(241, 245, 249);
      doc.rect(10, 36, 190, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(29, 78, 216);
      doc.text('CUSTOMER DETAILED LEDGER STATEMENT (GAHAK KHATA)', 105, 41.5, { align: 'center' });

      // Info
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Customer Name: ${statement.customer?.customer_name || 'Valued Customer'}`, 14, 51);
      doc.text(`Phone: ${statement.customer?.phone || '-'}`, 14, 57);
      doc.text(`Site / Address: ${statement.customer?.address || '-'}`, 120, 51);
      doc.text(`Current Balance: Rs. ${statement.currentBalance.toLocaleString()}`, 120, 57);

      const tableRows: any[] = [
        ['-', 'Opening Balance', 'Initial ledger balance', `Rs. ${statement.openingBalance.toLocaleString()}`, '-', `Rs. ${statement.openingBalance.toLocaleString()}`]
      ];
      statement.ledger.forEach((row: any) => {
        tableRows.push([
          row.date,
          `${row.type} ${row.ref}`,
          row.description,
          row.debit > 0 ? `Rs. ${row.debit.toLocaleString()}` : '-',
          row.credit > 0 ? `Rs. ${row.credit.toLocaleString()}` : '-',
          `Rs. ${row.runningBalance.toLocaleString()}`
        ]);
      });

      autoTable(doc, {
        startY: 63,
        head: [['Date', 'Type & Ref', 'Description', 'Debit / Billed (+)', 'Credit / Paid (-)', 'Balance']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [29, 78, 216], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 28 },
          2: { cellWidth: 50 },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' },
          5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
        }
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 150;
      doc.setFillColor(241, 245, 249);
      doc.rect(10, finalY + 4, 190, 10, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(225, 29, 72);
      doc.text(`Net Outstanding Balance: Rs. ${statement.currentBalance.toLocaleString()}`, 195, finalY + 11, { align: 'right' });

      doc.save(`Statement_${(statement.customer?.customer_name || 'Customer').replace(/\\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error('PDF error', e);
      window.print();
    }
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

      const totalBalance = filteredCustomers.reduce((sum, c) => sum + (c.current_balance || 0), 0);

      const tableRows = filteredCustomers.map(c => [
        c.customer_name,
        c.phone || '-',
        c.address || '-',
        `Rs. ${(c.opening_balance || 0).toLocaleString()}`,
        `Rs. ${(c.current_balance || 0).toLocaleString()}`,
      ]);

      autoTable(doc, {
        startY: 46,
        head: [['Customer Name', 'Phone', 'Address / Site', 'Opening', 'Current Balance (PKR)']],
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

  const filteredCustomers = customers.filter(c =>
    c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMarketUdhar = customers.reduce((sum, c) => {
    const stmt = bhattaService.getCustomerStatement(c.id);
    return sum + (stmt.currentBalance || 0);
  }, 0);
  const totalRecovered = bhattaService.getPayments().reduce((sum, p) => sum + (p.amount_received || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <Users className="text-[#1D4ED8]" />
            Customer Accounts & Credit Ledger (گاہک کھاتہ و وصولی)
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Customer profiles, outstanding debt balance tracking, recovery collections, and statements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenPayment()}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Coins size={16} />
            Record Payment Recovery (وصولی اندراج)
          </button>
          <button
            onClick={handleOpenAddCustomer}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <UserPlus size={16} />
            Add Customer (نیا گاہک)
          </button>
        </div>
      </div>

      {/* 3 Amount-Relevant KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Market Udhar */}
        <div className="bg-gradient-to-br from-rose-50 via-red-50/50 to-rose-100/50 border border-rose-300/80 border-t-4 border-t-rose-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-rose-900 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Market Udhar (کل بقایا ادھار)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">
            Rs. {totalMarketUdhar.toLocaleString()}
          </div>
          <p className="text-[11px] text-rose-800 font-bold mt-1">Outstanding market credit across all buyers</p>
        </div>

        {/* Card 2: Total Recoveries Collected */}
        <div className="bg-gradient-to-br from-emerald-50 via-green-50/50 to-emerald-100/50 border border-emerald-300/80 border-t-4 border-t-emerald-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-emerald-900 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Recoveries (کل وصول شدہ رقم)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Coins size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            Rs. {totalRecovered.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-900 font-medium mt-1">Total cash & bank payments received</p>
        </div>

        {/* Card 3: Total Registered Customers */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50/40 to-blue-100/40 border border-blue-300/80 border-t-4 border-t-blue-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-blue-900 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Customers (کل رجسٹرڈ پارٹیاں)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-950 font-mono">
            {customers.length} <span className="text-xs font-semibold text-blue-700">گاہک</span>
          </div>
          <p className="text-[11px] text-blue-900 font-medium mt-1">Active customer accounts ledger</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by customer name, phone number or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-10 pr-4 py-2 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1D4ED8] focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-[#64748B]">
            Total: <strong className="text-[#0F172A] font-mono">{filteredCustomers.length}</strong>
          </div>
          <button
            onClick={handleDownloadCustomersListPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Download PDF"
          >
            <Download size={14} />
            PDF
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Print"
          >
            <Printer size={14} />
            Print
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Customer Name (گاہک نام)</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Site / Address</th>
                <th className="py-3 px-4 text-right">Opening Balance</th>
                <th className="py-3 px-4 text-right bg-blue-50/50 text-[#1D4ED8] font-bold">Current Balance (موجودہ بقایا)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-[#0F172A]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No customers found matching search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const stmt = bhattaService.getCustomerStatement(cust.id);

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#1E40AF] flex items-center justify-center font-bold text-white text-xs shadow-sm">
                            {cust.customer_name[0]}
                          </div>
                          <div>
                            <span className="text-[#0F172A]">{cust.customer_name}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">Cust ID: #{cust.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {cust.phone || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {cust.address || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        Rs. {cust.opening_balance.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm bg-blue-50/30">
                        <span className={stmt.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          Rs. {stmt.currentBalance.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenPayment(cust.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] transition-colors cursor-pointer border border-emerald-200"
                          >
                            + Receive Cash
                          </button>
                          <button
                            onClick={() => handleViewStatement(cust.id)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] font-semibold text-[11px] transition-colors cursor-pointer border border-blue-200"
                          >
                            Statement &rarr;
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] bg-[#0F172A] text-white">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus size={18} className="text-[#1D4ED8]" />
                Add New Customer Profile (نیا گاہک)
              </h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4 text-[#0F172A]">
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
                  placeholder="e.g. Grain Market, Burewala"
                  value={editingCustomer?.address || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Opening Credit Balance (سابقہ بقایا - Rs.)</label>
                <input
                  type="number"
                  value={editingCustomer?.opening_balance || 0}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, opening_balance: Number(e.target.value) })}
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
                  className="px-5 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] bg-[#0F172A] text-white">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Coins size={18} className="text-emerald-400" />
                Record Customer Recovery / Payment (وصولی اندراج)
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-6 space-y-4 text-[#0F172A]">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Customer (گاہک منتخب کریں) *</label>
                <select
                  required
                  value={paymentForm.customer_id}
                  onChange={(e) => setPaymentForm({ ...paymentForm, customer_id: Number(e.target.value) })}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
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
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Amount Received (رقم وصولی - Rs.) *</label>
                  <input
                    type="number"
                    step="500"
                    required
                    value={paymentForm.amount_received}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount_received: Number(e.target.value) })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
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
                  placeholder="e.g. Paid in full for trolley deliver, or partial cash"
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
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
                  onClick={() => {
                    handlePrintStatement();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  title="Save as PDF (پی ڈی ایف محفوظ کریں)"
                >
                  <Download size={15} />
                  <span>پی ڈی ایف محفوظ کریں (Save PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handlePrintStatement();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1D4ED8] hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  title="Print Statement (پرنٹ کھاتہ)"
                >
                  <Printer size={15} />
                  <span>پرنٹ کھاتہ (Print)</span>
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
                      Rs. {statementData.currentBalance.toLocaleString()}
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
                    <tbody className="divide-y divide-slate-100 text-slate-900">
                      <tr className="bg-slate-50/70 font-semibold">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">-</td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500">-</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">ابتدائی کھاتہ</span>
                        </td>
                        <td className="py-2.5 px-3 font-urdu text-slate-600">سابقہ ابتدائی بقایا جات (Opening Balance)</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-800">Rs. {statementData.openingBalance.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">-</td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">Rs. {statementData.openingBalance.toLocaleString()}</td>
                      </tr>
                      {statementData.ledger.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{i + 1}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-600">{row.date}</td>
                          <td className="py-2.5 px-3 text-center font-bold">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.type === 'Invoice' ? 'bg-blue-100 text-[#1D4ED8]' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {row.type === 'Invoice' ? 'سیلز بل' : 'وصولی رقم'} {row.ref}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 font-medium">{row.description}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-950">
                            {row.debit > 0 ? `Rs. ${row.debit.toLocaleString()}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                            {row.credit > 0 ? `Rs. ${row.credit.toLocaleString()}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 bg-blue-50/20">
                            Rs. {row.runningBalance.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 font-urdu">
                      <tr>
                        <td colSpan={4} className="py-3 px-4 text-left font-black text-slate-800 text-sm">
                          خلاصہ کھاتہ و کل واجب الادا رقم (Summary):
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-blue-900">
                          Rs. {statementData.totalBilled.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                          Rs. {statementData.totalPaid.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-base text-rose-600 bg-rose-50/50">
                          Rs. {statementData.currentBalance.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Terms and Instructions */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1 mb-8">
                  <p className="font-bold text-slate-800 font-urdu">ضروری ہدایات برائے کھاتہ:</p>
                  <p className="font-urdu text-[11px]">1. اپنے کھاتہ کی تمام انٹریز اور بقایا رقم تسلی بخش چیک کر لیں۔ کسی بھی سوال کی صورت میں منشی صاحب سے فوری رابطہ کریں۔</p>
                  <p className="font-urdu text-[11px]">2. تمام ادائیگیاں منشی صاحب کے پاس جمع کروا کر باقاعدہ کمپیوٹرائزڈ رسید حاصل کریں۔</p>
                </div>

                {/* Signatures Stamps */}
                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-dashed border-slate-300 text-xs">
                  <div className="text-center">
                    <div className="h-10 border-b border-slate-400 mx-auto w-48"></div>
                    <p className="mt-2 font-bold text-slate-900 font-urdu text-sm">دستخط منشی / مینیجر</p>
                    <p className="text-[10px] text-slate-500 font-mono">{settings.managerName} • {settings.businessNameEnglish}</p>
                  </div>
                  <div className="text-center">
                    <div className="h-10 border-b border-slate-400 mx-auto w-48"></div>
                    <p className="mt-2 font-bold text-slate-900 font-urdu text-sm">دستخط گاہک / خریدار</p>
                    <p className="text-[10px] text-slate-500">Customer Signature & Stamp</p>
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
