import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  bhattaService,
  DailyExpense,
  ExpenseCategory,
} from '../../services/bhattaService';
import { DateRangeFilter, DateRange, getInitialTodayRange, isWithinDateRange } from '../../components/DateRangeFilter';
import {
  Receipt,
  PlusCircle,
  Search,
  Trash2,
  X,
  Save,
  Printer,
  Edit2,
  Download,
  Lock,
  BadgeDollarSign
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function DailyExpensesKhata() {
  const [expenses, setExpenses] = useState<DailyExpense[]>(bhattaService.getAllExpensesWithSalaries());
  const [categories, setCategories] = useState<ExpenseCategory[]>(bhattaService.getCategories());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dateRange, setDateRange] = useState<DateRange>(getInitialTodayRange());
  const [searchTerm, setSearchTerm] = useState('');

  // Add / Edit Expense Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category_id: categories[0]?.id || 1,
    expense_date: new Date().toISOString().split('T')[0],
    amount: 1500 as number | string,
    payment_mode: 'Cash' as 'Cash' | 'Bank_Transfer' | 'Cheque',
    paid_by: 'Munshi Sarwar',
    description: '',
  });

  useEffect(() => {
    refreshData();
    const handleUpdate = () => refreshData();
    window.addEventListener('bhatta_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    return () => {
      window.removeEventListener('bhatta_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);

  const refreshData = () => {
    setExpenses(bhattaService.getAllExpensesWithSalaries());
    setCategories(bhattaService.getCategories());
  };

  const handleOpenAdd = () => {
    setEditingExpenseId(null);
    setFormData({
      title: '',
      category_id: categories[0]?.id || 1,
      expense_date: new Date().toISOString().split('T')[0],
      amount: 1500,
      payment_mode: 'Cash',
      paid_by: 'Munshi Sarwar',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp: DailyExpense) => {
    if (exp.is_salary_mapped) {
      alert('یہ خرچہ تنخواہوں، مٹی ٹرالی یا کوئلہ/ایندھن کھاتہ سے منسلک ہے۔ اسے تبدیل کرنے کے لیے متعلقہ کھاتہ صفحہ استعمال کریں۔\n(This expense is auto-linked from Salaries, Matti Trolley, or Fuel Ledger. Please update it from its dedicated ledger.)');
      return;
    }
    setEditingExpenseId(exp.id);
    setFormData({
      title: exp.title || '',
      category_id: exp.category_id,
      expense_date: exp.expense_date,
      amount: exp.amount,
      payment_mode: exp.payment_mode,
      paid_by: exp.paid_by,
      description: exp.description,
    });
    setIsModalOpen(true);
  };

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = Number(formData.amount) || 0;
    if (cleanAmount <= 0) {
      alert('Please enter a valid amount (براہ کرم درست رقم درج کریں)');
      return;
    }
    if (editingExpenseId) {
      bhattaService.updateExpense(editingExpenseId, {
        title: formData.title.trim() || undefined,
        category_id: Number(formData.category_id),
        expense_date: formData.expense_date,
        amount: cleanAmount,
        payment_mode: formData.payment_mode,
        paid_by: formData.paid_by,
        description: formData.description,
      });
    } else {
      bhattaService.addExpense({
        title: formData.title.trim() || undefined,
        category_id: Number(formData.category_id),
        expense_date: formData.expense_date,
        amount: cleanAmount,
        payment_mode: formData.payment_mode,
        paid_by: formData.paid_by,
        description: formData.description,
      });
    }
    setIsModalOpen(false);
    setEditingExpenseId(null);
    refreshData();
  };

  const handleDeleteExpense = (exp: DailyExpense) => {
    if (exp.is_salary_mapped) {
      alert('یہ خرچہ تنخواہوں، مٹی ٹرالی یا کوئلہ/ایندھن کھاتہ سے منسلک ہے۔ اسے حذف کرنے کے لیے متعلقہ کھاتہ صفحہ استعمال کریں۔\n(This expense is auto-linked from Salaries, Matti Trolley, or Fuel Ledger. Please delete/manage it from its dedicated ledger.)');
      return;
    }
    if (window.confirm('Delete this expense record?')) {
      bhattaService.deleteExpense(exp.id);
      refreshData();
    }
  };

  // Filter logic
  const filteredExpenses = expenses.filter(exp => {
    const matchesCategory = selectedCategory === 'All' || String(exp.category_id) === selectedCategory;
    const matchesSearch =
      (exp.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.paid_by || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.category_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = isWithinDateRange(exp.expense_date, dateRange);
    return matchesCategory && matchesSearch && matchesDate;
  });

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const salaryMappedCount = filteredExpenses.filter(e => e.is_salary_mapped).length;
  const directExpenseCount = filteredExpenses.length - salaryMappedCount;

  const handleDownloadFilteredExpensesPDF = () => {
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
      doc.text('DAILY EXPENSES & SALARIES AUDIT REPORT', 105, 41.5, { align: 'center' });

      // Filter summary
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Category: ${selectedCategory === 'All' ? 'All Categories (Inc. Matti & Salaries)' : categories.find(c => String(c.id) === selectedCategory)?.category_name || selectedCategory}`, 14, 50);
      doc.text(`Date Range: ${dateRange.startDate || 'Start'} to ${dateRange.endDate || 'End'}`, 100, 50);
      doc.text(`Total Records: ${filteredExpenses.length}`, 165, 50);

      const tableRows = filteredExpenses.map(exp => [
        exp.expense_date,
        exp.title || exp.category_name || 'General',
        exp.category_name || 'General',
        exp.description || '-',
        exp.paid_by || '-',
        exp.payment_mode,
        `Rs. ${exp.amount.toLocaleString()}`,
      ]);

      autoTable(doc, {
        startY: 55,
        head: [['Date', 'Title', 'Category', 'Description', 'Paid By', 'Mode', 'Amount (PKR)']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [29, 78, 216], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2.2 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 32 },
          2: { cellWidth: 26 },
          3: { cellWidth: 48 },
          4: { cellWidth: 24 },
          5: { cellWidth: 16 },
          6: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
        },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 150;
      doc.setFillColor(241, 245, 249);
      doc.rect(10, finalY + 4, 190, 10, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text(`Total Operational Expenses: Rs. ${totalExpenseAmount.toLocaleString()}`, 195, finalY + 11, { align: 'right' });

      doc.save(`Daily_Expenses_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error('PDF error', e);
      window.print();
    }
  };

  const handlePrintExpenses = () => {
    const printWindow = window.open('', '', 'width=950,height=750');
    if (!printWindow) {
      window.print();
      return;
    }

    const rowsHtml = filteredExpenses.map(exp => `
      <tr>
        <td style="font-family: monospace;">${exp.expense_date}</td>
        <td><strong>${exp.title || exp.category_name || 'General'}</strong></td>
        <td><span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${exp.category_name || 'General'}</span></td>
        <td>${exp.description}</td>
        <td>${exp.paid_by}</td>
        <td>${exp.payment_mode}</td>
        <td style="text-align: right; font-family: monospace; font-weight: bold;">Rs. ${exp.amount.toLocaleString()}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ur">
      <head>
        <title>Daily Expenses Report - Chand Bricks</title>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaliq', 'Segoe UI', Tahoma, sans-serif; }
          body { margin: 20px; color: #0f172a; background: #fff; }
          .header-box { text-align: center; border-bottom: 2px solid #1d4ed8; padding-bottom: 12px; margin-bottom: 15px; }
          .title { font-size: 24px; font-weight: bold; color: #1d4ed8; margin: 0; }
          .sub { font-size: 13px; color: #475569; margin: 4px 0; }
          .contact { font-size: 12px; color: #b45309; font-weight: bold; }
          .report-tag { background: #f1f5f9; padding: 6px 12px; border-radius: 6px; display: inline-block; font-weight: bold; margin-top: 8px; color: #1e3a8a; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: right; }
          th { background: #1d4ed8; color: #ffffff; font-weight: bold; }
          .total-box { margin-top: 15px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: left; font-size: 14px; font-weight: bold; color: #e11d48; }
          .signs { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 20px; border-top: 1px dashed #cbd5e1; font-size: 12px; }
          @media print {
            body { margin: 5mm; }
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <h1 class="title">چاند برکس سپلائرز (اے ایم ڈی)</h1>
          <p class="sub">چک نمبر 431/ای بی، چیچہ وطنی روڈ، نزد گو پٹرول پمپ، بوریوالا</p>
          <p class="contact">سیٹھ حاجی ناصر: 0302-6780883 | منشی سرور: 0304-6557345</p>
          <div class="report-tag">روزانہ کے بھٹہ اخراجات و تنخواہیں کی تفصیلی رپورٹ (Daily Expenses & Salaries Khata)</div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 10px; color: #334155;">
          <span>تاریخ رپورٹ: ${new Date().toLocaleDateString('en-CA')}</span>
          <span>کل انٹریز: ${filteredExpenses.length}</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>تاریخ (Date)</th>
              <th>عنوان خرچہ (Title)</th>
              <th>کیٹیگری (Category)</th>
              <th>تفصیل (Description)</th>
              <th>ادا کنندہ (Paid By)</th>
              <th>طریقہ (Payment Mode)</th>
              <th style="text-align: right;">رقم (Amount)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="7" style="text-align: center; color: #94a3b8;">کوئی اخراجات نہیں ملے</td></tr>'}
          </tbody>
        </table>

        <div class="total-box">
          مجموعی کل بھٹہ اخراجات: Rs. ${totalExpenseAmount.toLocaleString()}
        </div>

        <div class="signs">
          <div>
            <div style="border-bottom: 1px solid #94a3b8; width: 180px; height: 30px;"></div>
            <p style="margin-top: 5px; font-weight: bold;">دستخط منشی / مینیجر</p>
          </div>
          <div>
            <div style="border-bottom: 1px solid #94a3b8; width: 180px; height: 30px;"></div>
            <p style="margin-top: 5px; font-weight: bold;">دستخط مالک بھٹہ</p>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 450);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar with Standardized Date Filter placed at the very top */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <Receipt className="text-emerald-600" />
            Daily Expense (روزمرہ اخراجات)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DateRangeFilter onChange={setDateRange} />
        </div>
      </div>

      {/* Expense Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Operational Expenses */}
        <div className="bg-gradient-to-br from-amber-500 via-rose-600 to-red-600 text-white rounded-2xl p-5 shadow-md border-0 relative overflow-hidden group">
          <div className="flex items-center gap-2 text-amber-100 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total Filtered Expenses (کل بھٹہ اخراجات)
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
            Rs. {totalExpenseAmount.toLocaleString()}
          </div>
          <p className="text-[11px] text-amber-100/90 font-medium mt-1">
            مجموعی اخراجات برائے منتخب شدہ مدت (Inc. Salaries & Matti)
          </p>
        </div>

        {/* Direct Manual Expenses */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Manual Daily Expenses (روزمرہ بھٹہ اخراجات)
            </span>
            <div className="text-xl font-bold text-slate-800">
              {directExpenseCount} Entries
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Matti trolley, chai, diesel, repair, misc
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-bold">
            <Receipt size={22} />
          </div>
        </div>

        {/* Auto-Mapped Salaries */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Salary Mapped to Expense (تنخواہوں کی منتقلی)
            </span>
            <div className="text-xl font-bold text-purple-700 flex items-center gap-1.5">
              <span>{salaryMappedCount} Records</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                Auto-Synced
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Paid staff salaries & worker advances in reporting
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-bold">
            <BadgeDollarSign size={22} />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search title, description, paid by..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-10 pr-4 py-2 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1D4ED8] focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Select */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-medium text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
          >
            <option value="All">All Categories (تمام شعبہ جات بشمول مٹی ٹرالی)</option>
            {categories.map(cat => (
              <option key={cat.id} value={String(cat.id)}>{cat.category_name}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <PlusCircle size={14} />
            <span>Add Expense (نیا خرچہ)</span>
          </button>

          <button
            onClick={handleDownloadFilteredExpensesPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Download PDF"
          >
            <Download size={14} />
            PDF
          </button>

          <button
            onClick={handlePrintExpenses}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Print"
          >
            <Printer size={14} />
            Print
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Title (عنوان خرچہ)</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description (تفصیل)</th>
                <th className="py-3 px-4">Paid By (ادا کنندہ)</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4 text-right">Amount (رقم)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-[#0F172A]">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No expense records found for selected criteria.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {exp.expense_date}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {exp.title || exp.category_name || 'Expense'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {exp.category_name || '-'}
                    </td>
                    <td className="py-3 px-4 text-[#0F172A] font-medium max-w-xs truncate">
                      {exp.description || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {exp.paid_by || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-[#1D4ED8] border border-blue-100">
                        {exp.payment_mode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#0F172A] text-sm whitespace-nowrap">
                      Rs. {exp.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] transition-colors cursor-pointer"
                          title="Edit (تبدیل کریں)"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete (حذف کریں)"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredExpenses.length > 0 && (
              <tfoot className="bg-[#F8FAFC] font-bold border-t-2 border-[#E2E8F0] text-[#0F172A]">
                <tr>
                  <td colSpan={6} className="py-3 px-4 text-right uppercase tracking-wider text-[#64748B]">
                    Total Expense (کل خرچہ بشمول تنخواہیں و مٹی):
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-600 text-sm whitespace-nowrap">
                    Rs. {totalExpenseAmount.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ADD / EDIT MANUAL EXPENSE MODAL MATCHING MATTI TROLLEY STYLE */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <Receipt size={18} className="text-[#1D4ED8]" />
                {editingExpenseId ? 'Edit Expense (خرچہ ترمیم)' : 'Add Expense (نیا خرچہ اندراج)'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                  Expense Title / Name (عنوان خرچہ) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chai & Snacks, Matti Trolley, Diesel 50L"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                  Expense Category (شعبہ خرچہ) *
                </label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.category_name} {cat.id === 8 ? '(مٹی ٹرالی)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0F172A] block mb-1">Date (تاریخ) *</label>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0F172A] block mb-1">Amount (رقم - Rs.) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="e.g. 1600"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value.replace(/[^0-9.]/g, '') })}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#0F172A] font-mono font-bold focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0F172A] block mb-1">Payment Mode (طریقہ ادائیگی)</label>
                  <select
                    value={formData.payment_mode}
                    onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value as any })}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                  >
                    <option value="Cash">Cash (نقد)</option>
                    <option value="Bank_Transfer">Bank Transfer (بینک)</option>
                    <option value="Cheque">Cheque (چیک)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0F172A] block mb-1">Paid By (کس نے دیا)</label>
                  <input
                    type="text"
                    value={formData.paid_by}
                    onChange={(e) => setFormData({ ...formData, paid_by: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">Description / Remarks (تفصیل)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Chai bill for labor, diesel for generator"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <Save size={15} />
                  {editingExpenseId ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
