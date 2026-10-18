import React, { useState, useEffect } from 'react';
import {
  bhattaService,
  DailyExpense,
  ExpenseCategory,
} from '../../services/bhattaService';
import {
  Receipt,
  Wallet,
  Coins,
  PlusCircle,
  Search,
  Filter,
  Calendar,
  Trash2,
  TrendingDown,
  X,
  Save,
  Printer,
  PieChart,
  Tag,
  CreditCard,
  UserCheck,
  Edit2,
  Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function DailyExpensesKhata() {
  const [expenses, setExpenses] = useState<DailyExpense[]>(bhattaService.getExpenses());
  const [categories, setCategories] = useState<ExpenseCategory[]>(bhattaService.getCategories());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Add / Edit Expense Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    category_id: categories[0]?.id || 1,
    expense_date: new Date().toISOString().split('T')[0],
    amount: 1500,
    payment_mode: 'Cash' as 'Cash' | 'Bank_Transfer' | 'Cheque',
    paid_by: 'Munshi Sarwar',
    description: '',
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setExpenses(bhattaService.getExpenses());
    setCategories(bhattaService.getCategories());
  };

  const handleOpenAdd = () => {
    setEditingExpenseId(null);
    setFormData({
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
    setEditingExpenseId(exp.id);
    setFormData({
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
    if (editingExpenseId) {
      bhattaService.updateExpense(editingExpenseId, {
        category_id: Number(formData.category_id),
        expense_date: formData.expense_date,
        amount: Number(formData.amount),
        payment_mode: formData.payment_mode,
        paid_by: formData.paid_by,
        description: formData.description,
      });
    } else {
      bhattaService.addExpense({
        category_id: Number(formData.category_id),
        expense_date: formData.expense_date,
        amount: Number(formData.amount),
        payment_mode: formData.payment_mode,
        paid_by: formData.paid_by,
        description: formData.description,
      });
    }
    setIsModalOpen(false);
    setEditingExpenseId(null);
    refreshData();
  };

  const handleDeleteExpense = (id: number) => {
    if (window.confirm('Delete this expense record?')) {
      bhattaService.deleteExpense(id);
      refreshData();
    }
  };

  // Filter logic
  const filteredExpenses = expenses.filter(exp => {
    const matchesCategory = selectedCategory === 'All' || String(exp.category_id) === selectedCategory;
    const matchesSearch =
      exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.paid_by.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate =
      (!filterStartDate || exp.expense_date >= filterStartDate) &&
      (!filterEndDate || exp.expense_date <= filterEndDate);
    return matchesCategory && matchesSearch && matchesDate;
  });

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by category for quick breakdown
  const categoryBreakdown: Record<string, number> = {};
  filteredExpenses.forEach(e => {
    const name = e.category_name || 'Miscellaneous';
    categoryBreakdown[name] = (categoryBreakdown[name] || 0) + e.amount;
  });

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
      doc.text('DAILY EXPENSES AUDIT & SEARCH REPORT', 105, 41.5, { align: 'center' });

      // Filter summary
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Category: ${selectedCategory === 'All' ? 'All Categories' : categories.find(c => String(c.id) === selectedCategory)?.category_name || selectedCategory}`, 14, 50);
      doc.text(`Date Range: ${filterStartDate || 'Start'} to ${filterEndDate || 'Current'}`, 80, 50);
      doc.text(`Total Records: ${filteredExpenses.length}`, 160, 50);

      const tableRows = filteredExpenses.map(exp => [
        exp.expense_date,
        exp.category_name || 'General',
        exp.description || '-',
        exp.paid_by || '-',
        exp.payment_mode,
        `Rs. ${exp.amount.toLocaleString()}`,
      ]);

      autoTable(doc, {
        startY: 55,
        head: [['Date', 'Category', 'Description', 'Paid By', 'Mode', 'Amount (PKR)']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [29, 78, 216], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        columnStyles: {
          0: { cellWidth: 24 },
          1: { cellWidth: 32 },
          2: { cellWidth: 55 },
          3: { cellWidth: 30 },
          4: { cellWidth: 22 },
          5: { cellWidth: 27, halign: 'right', fontStyle: 'bold' },
        },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 150;
      doc.setFillColor(241, 245, 249);
      doc.rect(10, finalY + 4, 190, 10, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text(`Total Filtered Expenses: Rs. ${totalExpenseAmount.toLocaleString()}`, 195, finalY + 11, { align: 'right' });

      doc.save(`Daily_Expenses_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error('PDF error', e);
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <Receipt className="text-emerald-600" />
            Daily Expenses Khata (روزمرہ اخراجات کھاتہ)
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Categorized general bhatta operational expenses with payment mode and paid-by audits
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle size={16} />
          Record New Expense (نیا خرچہ)
        </button>
      </div>

      {/* Single Expense Summary Card (Vibrant Amount-Relevant Color) */}
      <div className="bg-gradient-to-br from-amber-500 via-rose-600 to-red-600 text-white rounded-2xl p-6 shadow-lg border-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden group">
        <div>
          <div className="flex items-center gap-2 text-amber-100 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Filtered Expenses (کل بھٹہ اخراجات)
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white border border-white/30 backdrop-blur-xs">
              Rs. کھاتہ
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight drop-shadow-xs">
            Rs. {totalExpenseAmount.toLocaleString()}
          </div>
          <p className="text-xs text-amber-100/90 font-medium mt-1">
            منتخب مدت کے کل بھٹہ اخراجات • Overall operational expense for selected range
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/15 border border-white/20 rounded-xl p-3.5 backdrop-blur-xs shadow-inner">
          <div className="w-10 h-10 rounded-xl bg-white text-rose-600 flex items-center justify-center font-black text-sm shadow-sm">
            Rs.
          </div>
          <div>
            <div className="text-xs font-bold text-white">Pakistani Rupee (پاکستانی روپیہ)</div>
            <div className="text-[11px] text-amber-100 font-medium">تمام ادائیگیاں نقد یا بینک ٹرانسفر میں ہیں</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search description, paid by..."
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
            className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
          >
            <option value="All">All Categories (تمام کیٹیگریز)</option>
            {categories.map(cat => (
              <option key={cat.id} value={String(cat.id)}>{cat.category_name}</option>
            ))}
          </select>

          {/* Date range */}
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1 text-xs">
            <span className="text-slate-500 text-[10px]">From</span>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="bg-transparent text-[#0F172A] font-mono text-xs focus:outline-none"
            />
            <span className="text-slate-500 text-[10px]">To</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="bg-transparent text-[#0F172A] font-mono text-xs focus:outline-none"
            />
          </div>

          <button
            onClick={handleDownloadFilteredExpensesPDF}
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

      {/* Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description (تفصیل)</th>
                <th className="py-3 px-4">Paid By (ادا کنندہ)</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4 text-right">Amount (رقم)</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-[#0F172A]">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {exp.expense_date}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {exp.category_name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#0F172A] font-medium">
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
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#0F172A] text-sm">
                      Rs. {exp.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] transition-colors cursor-pointer"
                          title="Edit (خرچہ تبدیل کریں)"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
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
                  <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider text-[#64748B]">
                    Total Expense (کل خرچہ):
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-600 text-sm">
                    Rs. {totalExpenseAmount.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ADD / EDIT EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] bg-[#0F172A] text-white">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle size={18} className="text-[#1D4ED8]" />
                {editingExpenseId ? 'Edit Expense (خرچہ تبدیل کریں)' : 'Record Daily Expense (نیا خرچہ اندراج)'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="p-6 space-y-4 text-[#0F172A]">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Expense Category (شعبہ خرچہ) *</label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Date (تاریخ) *</label>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Amount (رقم - Rs.) *</label>
                  <input
                    type="number"
                    step="50"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Mode (طریقہ ادائیگی)</label>
                  <select
                    value={formData.payment_mode}
                    onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value as any })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                  >
                    <option value="Cash">Cash (نقد)</option>
                    <option value="Bank_Transfer">Bank Transfer (بینک)</option>
                    <option value="Cheque">Cheque (چیک)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Paid By (کس نے دیا)</label>
                  <input
                    type="text"
                    value={formData.paid_by}
                    onChange={(e) => setFormData({ ...formData, paid_by: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Description / Remarks (تفصیل)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Labor lunch, tractor grease, diesel 20 liters"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <Save size={15} />
                  {editingExpenseId ? 'Update Expense (تبدیل کریں)' : 'Save Expense (محفوظ کریں)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
