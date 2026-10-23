import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  bhattaService,
  MattiTrolleyRecord,
} from '../../services/bhattaService';
import {
  Truck,
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
import { DateRangeFilter, DateRange, getInitialTodayRange, isWithinDateRange } from '../../components/DateRangeFilter';

export function MattiKhata() {
  const [records, setRecords] = useState<MattiTrolleyRecord[]>(bhattaService.getMattiRecords());
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>(getInitialTodayRange());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    trolley_count: 5 as number | string,
    rate_per_trolley: 2500 as number | string,
    paid_amount: 12500 as number | string,
    supplier_name: 'Akram Matti Supply',
    remarks: 'Good quality chikni matti',
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setRecords(bhattaService.getMattiRecords());
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      entry_date: new Date().toISOString().split('T')[0],
      trolley_count: 5,
      rate_per_trolley: 2500,
      paid_amount: 12500,
      supplier_name: 'Akram Matti Supply',
      remarks: 'Good quality chikni matti',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: MattiTrolleyRecord) => {
    setEditingId(rec.id);
    setForm({
      entry_date: rec.entry_date,
      trolley_count: rec.trolley_count,
      rate_per_trolley: rec.rate_per_trolley,
      paid_amount: rec.paid_amount,
      supplier_name: rec.supplier_name,
      remarks: rec.remarks || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      bhattaService.updateMattiRecord(editingId, {
        entry_date: form.entry_date,
        trolley_count: Number(form.trolley_count) || 0,
        rate_per_trolley: Number(form.rate_per_trolley) || 0,
        paid_amount: Number(form.paid_amount) || 0,
        supplier_name: form.supplier_name,
        remarks: form.remarks,
      });
    } else {
      bhattaService.addMattiRecord({
        entry_date: form.entry_date,
        trolley_count: Number(form.trolley_count) || 0,
        rate_per_trolley: Number(form.rate_per_trolley) || 0,
        paid_amount: Number(form.paid_amount) || 0,
        supplier_name: form.supplier_name,
        remarks: form.remarks,
      });
    }
    setIsModalOpen(false);
    refreshData();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Delete this matti trolley record?')) {
      bhattaService.deleteMattiRecord(id);
      refreshData();
    }
  };

  // Filtered records
  const filteredRecords = records.filter(rec => {
    const matchesSearch = !searchTerm || rec.supplier_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = isWithinDateRange(rec.entry_date, dateRange);
    return matchesSearch && matchesDate;
  });

  const totalTrolleys = filteredRecords.reduce((sum, r) => sum + r.trolley_count, 0);
  const totalAmount = filteredRecords.reduce((sum, r) => sum + r.total_amount, 0);
  const totalPaid = filteredRecords.reduce((sum, r) => sum + (r.paid_amount ?? r.total_amount), 0);
  const remainingBalance = Math.max(0, totalAmount - totalPaid);

  return (
    <div className="space-y-6">
      
      {/* Top Header with DateRangeFilter on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <Truck className="text-[#1D4ED8]" />
            Matti Trolley Khata (مٹی ٹرالی کھاتہ)
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Clay deliveries, trolley count, supplier payments & pending balance ledger
          </p>
        </div>

        {/* Global Date Filter Only */}
        <div className="shrink-0 max-w-full">
          <DateRangeFilter defaultOption="this_month" onChange={setDateRange} />
        </div>
      </div>

      {/* 4 Amount-Relevant KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Trolleys */}
        <div className="bg-gradient-to-br from-amber-50 via-yellow-50/50 to-amber-100/50 border border-amber-300/80 border-t-4 border-t-amber-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-amber-900 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Clay Trolleys (تعداد)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Truck size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono">
            {totalTrolleys.toLocaleString()} <span className="text-xs font-semibold text-amber-700">trolleys</span>
          </div>
          <p className="text-[11px] text-amber-800 font-medium mt-1">Total Deliveries Recorded</p>
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
          <p className="text-[11px] text-blue-900 font-medium mt-1">Total Matti Bill</p>
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
            <span className="text-xs font-bold uppercase tracking-wider">Remaining Balance (بقایا رقم / ادھار)</span>
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

      {/* Search Row with Add Matti Trolley Button on Right */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        {/* Search box */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl pl-9 pr-3 py-2 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1D4ED8]"
          />
        </div>

        {/* Add Matti Trolley Button */}
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer whitespace-nowrap self-stretch sm:self-auto justify-center"
        >
          <PlusCircle size={16} />
          <span>Add Matti Trolley (نئی ٹرالی درج کریں)</span>
        </button>
      </div>

      {/* Matti Deliveries Table (Remarks Column Removed) */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck size={18} className="text-[#1D4ED8]" />
            <h3 className="text-sm font-bold text-[#0F172A]">Matti Trolley Deliveries (مٹی ٹرالی کھاتہ اندراج)</h3>
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
                <th className="py-3 px-4 text-center">Trolley Count (تعداد)</th>
                <th className="py-3 px-4 text-right">Rate / Trolley (ریٹ)</th>
                <th className="py-3 px-4 text-right">Total Amount (رقم)</th>
                <th className="py-3 px-4 text-right font-bold text-emerald-700">Paid Amount (ادا)</th>
                <th className="py-3 px-4 text-right font-bold text-rose-600">Balance (بقایا)</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#64748B]">
                    No matti trolley deliveries found for this selection.
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
                      <td className="py-3 px-4 text-center font-mono font-bold text-[#0F172A]">
                        {rec.trolley_count}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#64748B]">
                        Rs. {rec.rate_per_trolley.toLocaleString()}
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

      {/* Add / Edit Matti Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <Truck size={18} className="text-[#1D4ED8]" />
                {editingId ? 'Edit Matti Trolley (ٹرالی ترمیم)' : 'Add Matti Trolley (مٹی ٹرالی اندراج)'}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                    Trolley Count (تعداد ٹرالی) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="e.g. 5"
                    value={form.trolley_count}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      const count = Number(val) || 0;
                      const rate = Number(form.rate_per_trolley) || 0;
                      setForm({ ...form, trolley_count: val, paid_amount: count * rate });
                    }}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                    Rate / Trolley (ریٹ فی ٹرالی) *
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="e.g. 2500"
                    value={form.rate_per_trolley}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      const rate = Number(val) || 0;
                      const count = Number(form.trolley_count) || 0;
                      setForm({ ...form, rate_per_trolley: val, paid_amount: count * rate });
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
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="e.g. 12500"
                  value={form.paid_amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setForm({ ...form, paid_amount: val });
                  }}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Bill (کل رقم):</span>
                  <span className="font-mono font-bold text-slate-800">
                    Rs. {(Number(form.trolley_count) * Number(form.rate_per_trolley)).toLocaleString()}
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
                    Rs. {Math.max(0, (Number(form.trolley_count) * Number(form.rate_per_trolley)) - Number(form.paid_amount || 0)).toLocaleString()}
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
                  {editingId ? 'Update Trolley' : 'Save Trolley'}
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
