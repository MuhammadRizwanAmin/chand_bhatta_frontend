import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  bhattaService,
  FuelMasalaExpense,
} from '../../services/bhattaService';
import {
  Flame,
  PlusCircle,
  Calendar,
  Trash2,
  Edit2,
  Coins,
  AlertCircle,
  CheckCircle2,
  X,
  Save,
  Search,
} from 'lucide-react';

export function FuelKhata() {
  const [records, setRecords] = useState<FuelMasalaExpense[]>(bhattaService.getFuelRecords());
  const [searchTerm, setSearchTerm] = useState('');
  const [itemTypeFilter, setItemTypeFilter] = useState<'All' | 'Lakri' | 'Kuila' | 'Masala_Bhura'>('All');
  const [dateFilterMode, setDateFilterMode] = useState<'All' | 'Today' | 'ThisWeek' | 'ThisMonth' | 'Custom'>('All');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    item_type: 'Kuila' as 'Lakri' | 'Kuila' | 'Masala_Bhura',
    quantity: 100,
    unit_rate: 650,
    paid_amount: 65000,
    supplier_name: 'Balochistan Coal Traders',
    remarks: 'Burning coal bags / mounds',
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setRecords(bhattaService.getFuelRecords());
  };

  const isWithinDateFilter = (dateStr: string) => {
    if (dateFilterMode === 'All') return true;
    if (!dateStr) return false;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (dateFilterMode === 'Today') {
      return dateStr === todayStr;
    }

    if (dateFilterMode === 'ThisWeek') {
      const day = today.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(today);
      monday.setDate(today.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const mondayStr = monday.toISOString().split('T')[0];
      const sundayStr = sunday.toISOString().split('T')[0];
      return dateStr >= mondayStr && dateStr <= sundayStr;
    }

    if (dateFilterMode === 'ThisMonth') {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      return dateStr.startsWith(`${year}-${month}`);
    }

    if (dateFilterMode === 'Custom') {
      if (customStartDate && dateStr < customStartDate) return false;
      if (customEndDate && dateStr > customEndDate) return false;
      return true;
    }

    return true;
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      entry_date: new Date().toISOString().split('T')[0],
      item_type: 'Kuila',
      quantity: 100,
      unit_rate: 650,
      paid_amount: 65000,
      supplier_name: 'Balochistan Coal Traders',
      remarks: 'Burning coal bags / mounds',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: FuelMasalaExpense) => {
    setEditingId(rec.id);
    const total = rec.total_amount;
    const paid = rec.paid_amount !== undefined ? rec.paid_amount : total;
    setForm({
      entry_date: rec.entry_date,
      item_type: rec.item_type,
      quantity: rec.quantity,
      unit_rate: rec.unit_rate,
      paid_amount: paid,
      supplier_name: rec.supplier_name,
      remarks: rec.remarks || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      bhattaService.updateFuelRecord(editingId, {
        entry_date: form.entry_date,
        item_type: form.item_type,
        quantity: Number(form.quantity),
        unit_rate: Number(form.unit_rate),
        paid_amount: Number(form.paid_amount),
        supplier_name: form.supplier_name,
        remarks: form.remarks,
      });
    } else {
      bhattaService.addFuelRecord({
        entry_date: form.entry_date,
        item_type: form.item_type,
        quantity: Number(form.quantity),
        unit_rate: Number(form.unit_rate),
        paid_amount: Number(form.paid_amount),
        supplier_name: form.supplier_name,
        remarks: form.remarks,
      });
    }
    setIsModalOpen(false);
    refreshData();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Delete this fuel record?')) {
      bhattaService.deleteFuelRecord(id);
      refreshData();
    }
  };

  // Filtered records
  const filteredRecords = records.filter(rec => {
    const matchesSearch = !searchTerm ||
      rec.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.remarks || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesItem = itemTypeFilter === 'All' || rec.item_type === itemTypeFilter;
    const matchesDate = isWithinDateFilter(rec.entry_date);
    return matchesSearch && matchesItem && matchesDate;
  });

  const totalQuantity = filteredRecords.reduce((sum, r) => sum + r.quantity, 0);
  const totalAmount = filteredRecords.reduce((sum, r) => sum + r.total_amount, 0);
  const totalPaid = filteredRecords.reduce((sum, r) => sum + (r.paid_amount ?? r.total_amount), 0);
  const remainingBalance = Math.max(0, totalAmount - totalPaid);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <Flame className="text-[#1D4ED8]" />
            Fuel, Coal & Masala Khata (ایندھن، لکڑی و کوئلہ کھاتہ)
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Coal, firewood, husk/masala purchase expenses & supplier payment settlements
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle size={16} />
          Add Fuel Record (کوئلہ / ایندھن درج کریں)
        </button>
      </div>

      {/* 4 Amount-Relevant KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Quantity */}
        <div className="bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-100/50 border border-amber-300/80 border-t-4 border-t-amber-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-amber-900 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Quantity (تعداد / وزن)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Flame size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono">
            {totalQuantity.toLocaleString()} <span className="text-xs font-semibold text-amber-700">units/mounds</span>
          </div>
          <p className="text-[11px] text-amber-800 font-medium mt-1">Total Fuel Stock Purchased</p>
        </div>

        {/* Card 2: Total Bill Amount */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50/40 to-blue-100/40 border border-blue-300/80 border-t-4 border-t-blue-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-blue-900 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Bill Amount (کل رقم)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Coins size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-950 font-mono">
            Rs. {totalAmount.toLocaleString()}
          </div>
          <p className="text-[11px] text-blue-900 font-medium mt-1">Total Fuel Expense Value</p>
        </div>

        {/* Card 3: Paid Amount */}
        <div className="bg-gradient-to-br from-emerald-50 via-green-50/50 to-emerald-100/50 border border-emerald-300/80 border-t-4 border-t-emerald-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-emerald-900 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Paid Amount (ادا شدہ رقم)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            Rs. {totalPaid.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-800 font-medium mt-1">Paid to Suppliers</p>
        </div>

        {/* Card 4: Remaining Balance */}
        <div className="bg-gradient-to-br from-rose-50 via-red-50/50 to-rose-100/50 border border-rose-300/80 border-t-4 border-t-rose-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-rose-900 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Remaining Balance (بقایا ادھار)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">
            Rs. {remainingBalance.toLocaleString()}
          </div>
          <p className="text-[11px] text-rose-800 font-medium mt-1">Payable Balance</p>
        </div>
      </div>

      {/* Filter Bar with Search & Period Filter Dropdown */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full">
          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search supplier or remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1D4ED8]"
            />
          </div>

          {/* Item Type filter */}
          <select
            value={itemTypeFilter}
            onChange={(e) => setItemTypeFilter(e.target.value as any)}
            className="bg-white border border-[#CBD5E1] rounded-xl px-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
          >
            <option value="All">تمام اقسام (All Fuels)</option>
            <option value="Kuila">کوئلہ (Coal)</option>
            <option value="Lakri">لکڑی (Firewood)</option>
            <option value="Masala_Bhura">بھورا / مصالحہ (Husk / Rice Dust)</option>
          </select>

          {/* Period Filter Dropdown (Today, This Week, This Month, Custom Range) */}
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#64748B]" />
            <select
              value={dateFilterMode}
              onChange={(e) => setDateFilterMode(e.target.value as any)}
              className="bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
            >
              <option value="All">All Time (تمام ریکارڈز)</option>
              <option value="Today">Today (آج کا کھاتہ)</option>
              <option value="ThisWeek">This Week (اس ہفتے کا کھاتہ)</option>
              <option value="ThisMonth">This Month (اس مہینے کا کھاتہ)</option>
              <option value="Custom">Custom Range (مخصوص تاریخ منتخب کریں)</option>
            </select>
          </div>

          {/* Custom Date Range Inputs */}
          {dateFilterMode === 'Custom' && (
            <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-1 text-xs">
              <span className="text-slate-500 text-[11px]">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-transparent text-[#0F172A] font-mono text-xs focus:outline-none"
              />
              <span className="text-slate-500 text-[11px]">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-transparent text-[#0F172A] font-mono text-xs focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Fuel Expenses Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-[#1D4ED8]" />
            <h3 className="text-sm font-bold text-[#0F172A]">Fuel & Masala Expenses (کوئلہ و لکڑی خریداری کھاتہ)</h3>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Records: <strong>{filteredRecords.length}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Supplier Name</th>
                <th className="py-3 px-4">Item Type (قسم)</th>
                <th className="py-3 px-4 text-center">Quantity (تعداد / من)</th>
                <th className="py-3 px-4 text-right">Unit Rate (فی من ریٹ)</th>
                <th className="py-3 px-4 text-right">Total Amount (رقم)</th>
                <th className="py-3 px-4 text-right font-bold text-emerald-700">Paid Amount (ادا)</th>
                <th className="py-3 px-4 text-right font-bold text-rose-600">Balance (بقایا)</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#64748B]">
                    No fuel / coal expense entries found for this selection.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const paid = rec.paid_amount ?? rec.total_amount;
                  const balance = Math.max(0, rec.total_amount - paid);
                  return (
                    <tr key={rec.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-4 font-mono text-[#64748B] whitespace-nowrap">
                        {rec.entry_date}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">
                        {rec.supplier_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {rec.item_type === 'Kuila' ? 'کوئلہ (Coal)' : rec.item_type === 'Lakri' ? 'لکڑی (Wood)' : 'مصالحہ / بھورا'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-[#0F172A]">
                        {rec.quantity.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#64748B]">
                        Rs. {rec.unit_rate.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#0F172A]">
                        Rs. {rec.total_amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        Rs. {paid.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-rose-600">
                        Rs. {balance.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-[#475569] max-w-xs truncate">
                        {rec.remarks || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(rec)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(rec.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={13} />
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

      {/* Add / Edit Fuel Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <Flame size={18} className="text-[#1D4ED8]" />
                {editingId ? 'Edit Fuel Record (ایندھن ترمیم)' : 'Add Fuel / Coal Record (ایندھن اندراج)'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                    Entry Date (تاریخ) *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.entry_date}
                    onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                    Supplier Name (سپلائر) *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.supplier_name}
                    onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                  Item Type (ایندھن قسم) *
                </label>
                <select
                  value={form.item_type}
                  onChange={(e) => setForm({ ...form, item_type: e.target.value as any })}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                >
                  <option value="Kuila">کوئلہ (Coal - Best Burning)</option>
                  <option value="Lakri">لکڑی (Firewood)</option>
                  <option value="Masala_Bhura">بھورا / مصالحہ (Husk Dust)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                    Quantity (تعداد / من) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.quantity}
                    onChange={(e) => {
                      const qty = Number(e.target.value);
                      const total = qty * form.unit_rate;
                      setForm({ ...form, quantity: qty, paid_amount: total });
                    }}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                    Rate / Unit (ریٹ فی من) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.unit_rate}
                    onChange={(e) => {
                      const rate = Number(e.target.value);
                      const total = form.quantity * rate;
                      setForm({ ...form, unit_rate: rate, paid_amount: total });
                    }}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                  Paid Amount (ادا شدہ رقم - Rs.) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={form.paid_amount}
                  onChange={(e) => setForm({ ...form, paid_amount: Number(e.target.value) })}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Bill (کل رقم):</span>
                  <span className="font-mono font-bold text-slate-800">
                    Rs. {(Number(form.quantity) * Number(form.unit_rate)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Paid Amount (ادا شدہ):</span>
                  <span className="font-mono font-bold">
                    Rs. {Number(form.paid_amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-rose-600 font-bold border-t border-slate-200 pt-1">
                  <span>Remaining Balance (بقایا ادھار):</span>
                  <span className="font-mono">
                    Rs. {Math.max(0, (Number(form.quantity) * Number(form.unit_rate)) - Number(form.paid_amount || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                  Remarks / Notes (تفصیل)
                </label>
                <input
                  type="text"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
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
                  {editingId ? 'Update Record' : 'Save Fuel Record'}
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
