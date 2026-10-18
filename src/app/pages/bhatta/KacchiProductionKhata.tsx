import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  bhattaService,
  KacchiAentRecord,
  Employee,
} from '../../services/bhattaService';
import {
  Layers,
  PlusCircle,
  Calendar,
  Trash2,
  Edit2,
  Coins,
  TrendingUp,
  Users,
  X,
  Save,
  Printer,
  Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function KacchiProductionKhata() {
  const [records, setRecords] = useState<KacchiAentRecord[]>(bhattaService.getKacchiRecords());
  const [employees, setEmployees] = useState<Employee[]>(bhattaService.getEmployees());
  const [selectedWorker, setSelectedWorker] = useState<string>('All');
  const [filterDate, setFilterDate] = useState<string>('');

  // Add / Edit Record Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    employee_id: employees.find(e => e.role === 'Kacchi_Worker')?.id || employees[0]?.id || 1,
    entry_date: new Date().toISOString().split('T')[0],
    quantity: 5000,
    rate_per_thousand: 1450,
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setRecords(bhattaService.getKacchiRecords());
    setEmployees(bhattaService.getEmployees());
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      employee_id: employees.find(e => e.role === 'Kacchi_Worker')?.id || employees[0]?.id || 1,
      entry_date: new Date().toISOString().split('T')[0],
      quantity: 5000,
      rate_per_thousand: 1450,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: KacchiAentRecord) => {
    setEditingId(rec.id);
    setFormData({
      employee_id: rec.employee_id,
      entry_date: rec.entry_date,
      quantity: rec.quantity,
      rate_per_thousand: rec.rate_per_thousand,
    });
    setIsModalOpen(true);
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      bhattaService.updateKacchiRecord(editingId, {
        employee_id: Number(formData.employee_id),
        entry_date: formData.entry_date,
        quantity: Number(formData.quantity),
        rate_per_thousand: Number(formData.rate_per_thousand),
      });
    } else {
      bhattaService.addKacchiRecord({
        employee_id: Number(formData.employee_id),
        entry_date: formData.entry_date,
        quantity: Number(formData.quantity),
        rate_per_thousand: Number(formData.rate_per_thousand),
      });
    }
    setIsModalOpen(false);
    refreshData();
  };

  const handleDeleteRecord = (id: number) => {
    if (window.confirm('Delete this production entry?')) {
      bhattaService.deleteKacchiRecord(id);
      refreshData();
    }
  };

  // Filtered records
  const filteredRecords = records.filter(rec => {
    const matchesWorker = selectedWorker === 'All' || String(rec.employee_id) === selectedWorker;
    const matchesDate = !filterDate || rec.entry_date === filterDate;
    return matchesWorker && matchesDate;
  });

  // Aggregated totals
  const totalQuantity = filteredRecords.reduce((sum, r) => sum + r.quantity, 0);
  const totalAmount = filteredRecords.reduce((sum, r) => sum + r.total_amount, 0);

  const getWorkerName = (empId: number) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.full_name : `Worker #${empId}`;
  };

  const handleDownloadKacchiPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      // Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 297, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('CHAND BRICKS SUPPLIERZ', 148.5, 10, { align: 'center' });

      doc.setFontSize(8.5);
      doc.setTextColor(226, 232, 240);
      doc.text('Chak No. 431/E.B Chichawatni Road Near Go Pump Burewala', 148.5, 16, { align: 'center' });

      doc.setFontSize(8.5);
      doc.setTextColor(212, 160, 23);
      doc.text('Seth Haji Nasir: 0302-6780883 | Munshi Sarwar: 0304-6557345', 148.5, 22, { align: 'center' });

      // Title
      doc.setFillColor(241, 245, 249);
      doc.rect(10, 32, 277, 8, 'F');
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(29, 78, 216);
      doc.text('KACCHI AENT PATHAI PRODUCTION AUDIT (کچی اینٹ پتھائی کھاتہ)', 148.5, 37.5, { align: 'center' });

      const tableRows = filteredRecords.map(rec => [
        rec.entry_date,
        getWorkerName(rec.employee_id),
        rec.quantity.toLocaleString(),
        `Rs. ${rec.rate_per_thousand.toLocaleString()}`,
        `Rs. ${rec.total_amount.toLocaleString()}`,
      ]);

      autoTable(doc, {
        startY: 44,
        head: [['Date', 'Pathair / Worker Name', 'Quantity (Bricks)', 'Rate / 1000', 'Total Wages (PKR)']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [29, 78, 216], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 150;
      doc.setFillColor(241, 245, 249);
      doc.rect(10, finalY + 4, 277, 10, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(29, 78, 216);
      doc.text(`Total Quantity: ${totalQuantity.toLocaleString()} bricks   |   Total Wages Payable: Rs. ${totalAmount.toLocaleString()}`, 280, finalY + 10.5, { align: 'right' });

      doc.save(`Kacchi_Production_Report_${new Date().toISOString().split('T')[0]}.pdf`);
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
          <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] flex items-center gap-2">
            <Layers className="text-[#1D4ED8]" />
            Kacchi Aent Production Khata (کچی اینٹ پتھائی کھاتہ)
          </h2>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle size={16} />
          Add Pathai Entry (نیا اندراج)
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50/40 to-blue-100/40 border border-blue-300/80 border-t-4 border-t-blue-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-blue-900 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Kacchi Bricks (کچی اینٹ کل تعداد)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Layers size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-950 font-mono">
            {totalQuantity.toLocaleString()} <span className="text-xs font-semibold text-blue-700">bricks</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 via-green-50/50 to-emerald-100/50 border border-emerald-300/80 border-t-4 border-t-emerald-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-emerald-900 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Pathai Wages (پتھائی مزدور رقم)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Coins size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            Rs. {totalAmount.toLocaleString()}
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 via-yellow-50/40 to-amber-100/40 border border-amber-300/80 border-t-4 border-t-amber-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-amber-900 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Average Rate / 1000 (پتھائی ریٹ فی ہزار)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono">
            Rs. 1,450
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Worker Select */}
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#64748B]" />
            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              className="bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
            >
              <option value="All">All Workers (تمام مزدور)</option>
              {employees.map(emp => (
                <option key={emp.id} value={String(emp.id)}>{emp.full_name}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#64748B]" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-white border border-[#CBD5E1] rounded-xl px-3 py-1.5 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-xs text-[#64748B] hover:text-[#0F172A] underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadKacchiPDF}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Download PDF"
          >
            <Download size={14} />
            PDF
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Print"
          >
            <Printer size={14} />
            Print
          </button>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date (تاریخ)</th>
                <th className="py-3 px-4">Pathair / Worker (پتھیر)</th>
                <th className="py-3 px-4 text-right">Quantity (تعداد اینٹ)</th>
                <th className="py-3 px-4 text-right">Rate / 1000 (مزدوری ریٹ)</th>
                <th className="py-3 px-4 text-right bg-blue-50/50 text-[#1D4ED8] font-bold">Total Wages (کل اجرت)</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#64748B]">
                    No production entries recorded for this selection.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 font-mono text-[#475569]">
                      {rec.entry_date}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#0F172A]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-[#1D4ED8] flex items-center justify-center font-bold text-[10px]">
                          {getWorkerName(rec.employee_id)[0]}
                        </div>
                        <span>{getWorkerName(rec.employee_id)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#0F172A]">
                      {rec.quantity.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#64748B]">
                      Rs. {rec.rate_per_thousand.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#10B981] bg-emerald-50/50">
                      Rs. {rec.total_amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(rec)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-blue-600 transition-colors cursor-pointer"
                          title="Edit Entry (ترمیم)"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredRecords.length > 0 && (
              <tfoot className="bg-[#F8FAFC] font-bold border-t-2 border-[#E2E8F0] text-[#0F172A]">
                <tr>
                  <td colSpan={2} className="py-3 px-4 text-right uppercase tracking-wider text-[#64748B]">
                    Total:
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#1D4ED8] text-sm">
                    {totalQuantity.toLocaleString()}
                  </td>
                  <td></td>
                  <td className="py-3 px-4 text-right font-mono text-[#10B981] text-sm">
                    Rs. {totalAmount.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ADD / EDIT PRODUCTION MODAL (Rendered above everything via Portal) */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl my-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] bg-[#0F172A] text-white">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {editingId ? <Edit2 size={18} className="text-[#1D4ED8]" /> : <PlusCircle size={18} className="text-[#1D4ED8]" />}
                {editingId ? 'Edit Kacchi Production (کچی اینٹ پتھائی ترمیم)' : 'Add Kacchi Production (کچی پتھائی اندراج)'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#334155] block mb-1">Select Pathair Worker (مزدور منتخب کریں) *</label>
                <select
                  required
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: Number(e.target.value) })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#334155] block mb-1">Entry Date (تاریخ اندراج) *</label>
                <input
                  type="date"
                  required
                  value={formData.entry_date}
                  onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Quantity of Bricks (تعداد اینٹ) *</label>
                  <input
                    type="number"
                    step="500"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Rate / 1000 Bricks (ریٹ فی ہزار) *</label>
                  <input
                    type="number"
                    step="10"
                    required
                    value={formData.rate_per_thousand}
                    onChange={(e) => setFormData({ ...formData, rate_per_thousand: Number(e.target.value) })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
              </div>

              {/* Live Calculation Display */}
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                <div className="flex justify-between items-center text-[#475569]">
                  <span>Calculation Formula:</span>
                  <span className="font-mono text-[#64748B]">({formData.quantity} / 1000) &times; {formData.rate_per_thousand}</span>
                </div>
                <div className="flex justify-between items-center text-[#0F172A] font-bold mt-2 pt-2 border-t border-blue-200">
                  <span>Total Labor Payable (کل اجرت):</span>
                  <span className="text-sm font-mono text-[#1D4ED8]">
                    Rs. {((formData.quantity / 1000) * formData.rate_per_thousand).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#F1F5F9] text-[#475569] rounded-xl text-xs font-medium hover:bg-[#E2E8F0] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Save size={15} />
                  {editingId ? 'Update Record (ترمیم محفوظ کریں)' : 'Save Production Record'}
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
