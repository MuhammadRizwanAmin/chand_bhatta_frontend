import React, { useState, useEffect, useRef } from 'react';
import {
  bhattaService,
  WorkerAdvance,
  Employee,
} from '../../services/bhattaService';
import { useBhattaSettings } from '../../context/BhattaSettingsContext';
import {
  Coins,
  PlusCircle,
  Calendar,
  Trash2,
  Receipt,
  Users,
  X,
  Save,
  Printer,
  Download,
  Phone,
  MapPin,
  Scale,
  CheckCircle2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import chandLogo from '../../../assets/chand_bricks_logo.jpg';

export function WorkerAdvanceSettlement() {
  const { settings } = useBhattaSettings();
  const slipPrintRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'settlement' | 'advances'>('settlement');
  const [settlements, setSettlements] = useState(bhattaService.getWorkerSettlements());
  const [advances, setAdvances] = useState<WorkerAdvance[]>(bhattaService.getAdvances());
  const [employees, setEmployees] = useState<Employee[]>(bhattaService.getEmployees());

  // Add Advance Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: employees[0]?.id || 1,
    advance_date: new Date().toISOString().split('T')[0],
    amount_paid: 3000,
    remarks: 'Family household expense',
  });

  // Individual Khata Modal
  const [selectedWorkerDetail, setSelectedWorkerDetail] = useState<any | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setSettlements(bhattaService.getWorkerSettlements());
    setAdvances(bhattaService.getAdvances());
    setEmployees(bhattaService.getEmployees());
  };

  const handleAddAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    bhattaService.addAdvance({
      employee_id: Number(formData.employee_id),
      advance_date: formData.advance_date,
      amount_paid: Number(formData.amount_paid),
      remarks: formData.remarks,
    });
    setIsModalOpen(false);
    refreshData();
  };

  const handleDeleteAdvance = (id: number) => {
    if (window.confirm('Delete this advance entry?')) {
      bhattaService.deleteAdvance(id);
      refreshData();
    }
  };

  const totalAdvancesAll = advances.reduce((sum, a) => sum + a.amount_paid, 0);
  const totalWagesEarnedAll = settlements.reduce((sum, s) => sum + s.totalEarned, 0);
  const totalNetPayableAll = settlements.reduce((sum, s) => sum + Math.max(0, s.netPayable), 0);

  const getWorkerName = (empId: number) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.full_name : `Worker #${empId}`;
  };

  const handleDownloadSlipPDF = (detail: any) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });

      // Header background
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 148, 32, 'F');

      // Title & Address
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('CHAND BRICKS SUPPLIERZ', 74, 11, { align: 'center' });

      doc.setFontSize(7.5);
      doc.setTextColor(226, 232, 240);
      doc.text('Chak No. 431/E.B Chichawatni Road Near Go Pump Burewala', 74, 17, { align: 'center' });

      doc.setFontSize(8);
      doc.setTextColor(212, 160, 23); // Gold
      doc.text('Seth Haji Nasir: 0302-6780883 | Munshi Sarwar: 0304-6557345', 74, 24, { align: 'center' });

      // Slip title bar
      doc.setFillColor(241, 245, 249);
      doc.rect(10, 36, 128, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(29, 78, 216);
      doc.text('WORKER KHATA & SETTLEMENT SLIP', 74, 41.5, { align: 'center' });

      // Worker details
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(`Worker: ${detail.employee.full_name}`, 12, 50);
      doc.text(`Role: ${detail.employee.role}`, 12, 56);
      doc.text(`Phone: ${detail.employee.phone || '-'}`, 82, 50);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 82, 56);

      // Table
      const tableData: any[] = [
        ['Kacchi Pathai Wages', `Rs. ${detail.empKacchi.toLocaleString()}`],
        ['Bhari & Nikasi Labor', `Rs. ${(detail.empBhari + detail.empNikasi).toLocaleString()}`],
      ];
      if (detail.fixedSalary > 0) {
        tableData.push(['Monthly Fixed Salary', `Rs. ${detail.fixedSalary.toLocaleString()}`]);
      }
      tableData.push(['Total Earned (Kul Kamai)', `Rs. ${detail.totalEarned.toLocaleString()}`]);
      tableData.push(['Less: Advances Taken (Advance)', `- Rs. ${detail.totalAdvance.toLocaleString()}`]);
      tableData.push(['Net Balance Payable (Baqaya)', `Rs. ${detail.netPayable.toLocaleString()}`]);

      autoTable(doc, {
        startY: 61,
        head: [['Description', 'Amount (PKR)']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [29, 78, 216],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 8.5,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 48, halign: 'right', fontStyle: 'bold' },
        },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 120;
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Munshi Sign: ____________________', 15, finalY + 18);
      doc.text('Worker Sign: ____________________', 82, finalY + 18);

      doc.save(`Khata_Slip_${detail.employee.full_name.replace(/\\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error('PDF error', e);
      window.print();
    }
  };

  const handleDownloadSettlementPDF = () => {
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
      doc.text('LABOR GANG NET BALANCE SETTLEMENT LEDGER (مزدور حساب کھاتہ)', 148.5, 37.5, { align: 'center' });

      const tableRows = settlements.map(s => [
        `${s.employee.full_name} (${s.employee.role})`,
        `Rs. ${s.empKacchi.toLocaleString()}`,
        `Rs. ${(s.empBhari + s.empNikasi).toLocaleString()}`,
        `Rs. ${(s.empFixedSalary || 0).toLocaleString()}`,
        `Rs. ${s.totalEarnedWages.toLocaleString()}`,
        `Rs. ${s.totalAdvanceTaken.toLocaleString()}`,
        `Rs. ${s.netBalancePayable.toLocaleString()}`,
        s.netBalancePayable > 0 ? 'Payable' : 'Settled',
      ]);

      autoTable(doc, {
        startY: 44,
        head: [['Worker / Gang', 'Kacchi Wages', 'Bhari / Nikasi', 'Fixed / Salary', 'Total Earned (+)', 'Advance Taken (-)', 'Net Balance (=)', 'Status']],
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
      doc.text(`Total Net Payable to All Workers: Rs. ${totalNetPayableAll.toLocaleString()}`, 280, finalY + 10.5, { align: 'right' });

      doc.save(`Worker_Settlement_Sheet_${new Date().toISOString().split('T')[0]}.pdf`);
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
            <Coins className="text-[#1D4ED8]" />
            Worker Advance & Net Settlement (مزدور ایڈوانس و نیٹ حساب)
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Formula: (Total Earned Wages from Kacchi + Bhari + Nikasi) - Total Advance Taken = Net Balance Payable
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#F1F5F9] p-1 rounded-xl border border-[#CBD5E1] flex items-center">
            <button
              onClick={() => setActiveTab('settlement')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'settlement' ? 'bg-[#1D4ED8] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Master Settlement (نیٹ حساب)
            </button>
            <button
              onClick={() => setActiveTab('advances')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'advances' ? 'bg-[#1D4ED8] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Advance History (ایڈوانس اندراج)
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle size={16} />
            Add Advance (نیا ایڈوانس)
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-50 via-yellow-50/40 to-amber-100/40 border border-amber-300/80 border-t-4 border-t-amber-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-amber-900 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Advances Disbursed (مزدور ایڈوانس)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Coins size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono">
            Rs. {totalAdvancesAll.toLocaleString()}
          </div>
          <p className="text-[11px] text-amber-900 font-medium mt-1">Total active debt taken by labor gangs</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 via-green-50/50 to-emerald-100/50 border border-emerald-300/80 border-t-4 border-t-emerald-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-emerald-900 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Earned Wages (کل مزدور اجرت)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Receipt size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            Rs. {totalWagesEarnedAll.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-900 font-medium mt-1">Accumulated pathai + bhari + nikasi earnings</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 via-indigo-50/40 to-blue-100/40 border border-blue-300/80 border-t-4 border-t-blue-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-blue-900 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Net Balance Payable (خالص قابل ادائیگی)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Scale size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-950 font-mono">
            Rs. {totalNetPayableAll.toLocaleString()}
          </div>
          <p className="text-[11px] text-blue-900 font-medium mt-1">Net cash to distribute after deducting advances</p>
        </div>
      </div>

      {/* TAB 1: MASTER SETTLEMENT TABLE */}
      {activeTab === 'settlement' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale size={18} className="text-[#1D4ED8]" />
              <h3 className="text-sm font-bold text-[#0F172A]">Labor Gang Net Balance Settlement Ledger (خالص حساب)</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Worker Name & Role</th>
                  <th className="py-3 px-4 text-right">Kacchi Wages</th>
                  <th className="py-3 px-4 text-right">Bhari/Nikasi</th>
                  <th className="py-3 px-4 text-right">Fixed/Salary</th>
                  <th className="py-3 px-4 text-right text-[#10B981] font-bold">Total Earned (+)</th>
                  <th className="py-3 px-4 text-right text-[#D4A017] font-bold">Advance Taken (-)</th>
                  <th className="py-3 px-4 text-right bg-blue-50/50 text-[#1D4ED8] font-bold">Net Balance Payable (=)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
                {settlements.map((s) => (
                  <tr key={s.employee.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#0F172A]">{s.employee.full_name}</div>
                      <span className="text-[10px] text-[#64748B]">{s.employee.role.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#475569]">
                      Rs. {s.empKacchi.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#475569]">
                      Rs. {(s.empBhari + s.empNikasi).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#64748B]">
                      Rs. {s.fixedSalary.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#10B981]">
                      Rs. {s.totalEarned.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#D4A017]">
                      Rs. {s.totalAdvance.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-sm bg-blue-50/50">
                      <span className={s.netPayable >= 0 ? 'text-[#1D4ED8]' : 'text-rose-600'}>
                        Rs. {s.netPayable.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedWorkerDetail(s)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Khata Slip &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ADVANCE ENTRIES LIST */}
      {activeTab === 'advances' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Worker Name</th>
                  <th className="py-3 px-4 text-right">Advance Amount (رقم)</th>
                  <th className="py-3 px-4">Remarks / Purpose</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
                {advances.map((adv) => (
                  <tr key={adv.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 font-mono text-[#64748B]">
                      {adv.advance_date}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#0F172A]">
                      {getWorkerName(adv.employee_id)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#D4A017]">
                      Rs. {adv.amount_paid.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-[#475569]">
                      {adv.remarks || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteAdvance(adv.id)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD ADVANCE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <Coins size={18} className="text-[#1D4ED8]" />
                Record Worker Advance (مزدور ایڈوانس ادائیگی)
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAdvance} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#334155] block mb-1">Select Worker (مزدور) *</label>
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
                <label className="text-xs font-semibold text-[#334155] block mb-1">Advance Date (تاریخ) *</label>
                <input
                  type="date"
                  required
                  value={formData.advance_date}
                  onChange={(e) => setFormData({ ...formData, advance_date: e.target.value })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#334155] block mb-1">Advance Amount (ایڈوانس رقم - Rs.) *</label>
                <input
                  type="number"
                  step="500"
                  required
                  value={formData.amount_paid}
                  onChange={(e) => setFormData({ ...formData, amount_paid: Number(e.target.value) })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#334155] block mb-1">Remarks / Reason (تفصیل / وجہ)</label>
                <input
                  type="text"
                  placeholder="e.g. Ration, Medical, Eid advance"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                />
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
                  Save Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INDIVIDUAL KHATA SLIP MODAL */}
      {selectedWorkerDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white text-[#0F172A] rounded-2xl shadow-2xl overflow-hidden my-auto border border-slate-300 flex flex-col max-h-[96vh]">
            
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
                    Worker: {selectedWorkerDetail.employee.full_name} ({selectedWorkerDetail.employee.role})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const printContent = slipPrintRef.current;
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
                      .map(el => el.outerHTML).join('\n');
                    doc.open();
                    doc.write(`
                      <!DOCTYPE html>
                      <html lang="ur" dir="rtl">
                        <head>
                          <meta charset="utf-8" />
                          <title>WorkerSlip_${selectedWorkerDetail.employee.full_name.replace(/\\s+/g, '_')}</title>
                          ${styles}
                          <style>
                            @page { size: A4 portrait; margin: 8mm 10mm; }
                            *, *::before, *::after, html, body {
                              font-family: 'Jameel Noori Nastaliq', 'Jameel Noori Nastaleeq', 'JameelNooriNastaliq', 'Noto Nastaliq Urdu', serif !important;
                              -webkit-print-color-adjust: exact !important;
                              print-color-adjust: exact !important;
                            }
                            body { background: white !important; color: #0F172A !important; margin: 0; padding: 0; }
                            #slip-root { width: 100%; max-width: 100%; margin: 0 auto; background: white; padding: 4mm 6mm; }
                          </style>
                        </head>
                        <body><div id="slip-root">${printContent.innerHTML}</div></body>
                      </html>
                    `);
                    doc.close();
                    setTimeout(() => {
                      iframe.contentWindow?.focus();
                      iframe.contentWindow?.print();
                      setTimeout(() => { try { document.body.removeChild(iframe); } catch {} }, 3000);
                    }, 400);
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
                    const printContent = slipPrintRef.current;
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
                      .map(el => el.outerHTML).join('\n');
                    doc.open();
                    doc.write(`
                      <!DOCTYPE html>
                      <html lang="ur" dir="rtl">
                        <head>
                          <meta charset="utf-8" />
                          <title>WorkerSlip_${selectedWorkerDetail.employee.full_name.replace(/\\s+/g, '_')}</title>
                          ${styles}
                          <style>
                            @page { size: A4 portrait; margin: 8mm 10mm; }
                            *, *::before, *::after, html, body {
                              font-family: 'Jameel Noori Nastaliq', 'Jameel Noori Nastaleeq', 'JameelNooriNastaliq', 'Noto Nastaliq Urdu', serif !important;
                              -webkit-print-color-adjust: exact !important;
                              print-color-adjust: exact !important;
                            }
                            body { background: white !important; color: #0F172A !important; margin: 0; padding: 0; }
                            #slip-root { width: 100%; max-width: 100%; margin: 0 auto; background: white; padding: 4mm 6mm; }
                          </style>
                        </head>
                        <body><div id="slip-root">${printContent.innerHTML}</div></body>
                      </html>
                    `);
                    doc.close();
                    setTimeout(() => {
                      iframe.contentWindow?.focus();
                      iframe.contentWindow?.print();
                      setTimeout(() => { try { document.body.removeChild(iframe); } catch {} }, 3000);
                    }, 400);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1D4ED8] hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  title="Print Slip (پرنٹ پرچی)"
                >
                  <Printer size={15} />
                  <span>پرنٹ پرچی (Print)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWorkerDetail(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-1"
                  title="Close (بند کریں)"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable Printable Slip Container */}
            <div className="flex-1 overflow-y-auto">
              <div
                ref={slipPrintRef}
                className="p-6 sm:p-8 bg-white text-slate-900"
              >
                {/* Top Official Bhatta Header Branding - Exactly Matches Sales Receipt */}
                <div className="border-b-2 border-[#1D4ED8] pb-5">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    
                    {/* Logo and Titles */}
                    <div className="flex items-center gap-4 text-right">
                      <img
                        src={settings.logoUrl || chandLogo}
                        alt="Official Logo"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover bg-white p-1.5 shadow-md shrink-0 border-2 border-slate-200 ring-2 ring-blue-100"
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

                    {/* Tag and Date */}
                    <div className="text-center sm:text-right bg-slate-50 p-3.5 rounded-xl border border-slate-200 shrink-0 min-w-[180px]">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                        <CheckCircle2 size={13} />
                        <span>مزدور کھاتہ پرچی</span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Worker ID:</div>
                      <div className="font-mono font-black text-sm text-[#1D4ED8]">#EMP-{selectedWorkerDetail.employee.id}</div>
                      <div className="text-xs text-slate-500 mt-1 font-medium">Date:</div>
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

                {/* Worker Details Box */}
                <div className="my-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-500 block mb-0.5 font-urdu">مزدور نام (Worker):</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedWorkerDetail.employee.full_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5 font-urdu">شعبہ / ذمہ داری (Role):</span>
                    <span className="font-semibold text-slate-800">{selectedWorkerDetail.employee.role}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5 font-urdu">موبائل نمبر (Phone):</span>
                    <span className="font-mono font-bold text-slate-800">{selectedWorkerDetail.employee.phone || '-'}</span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="space-y-2.5 text-xs border border-slate-200 rounded-xl p-4 bg-white mb-6">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="font-urdu text-slate-700">کچی پتھائی مزدوری (Kacchi Pathai):</span>
                    <span className="font-mono font-bold text-slate-900">Rs. {selectedWorkerDetail.empKacchi.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="font-urdu text-slate-700">بھری و نکاسی مزدوری (Bhari & Nikasi):</span>
                    <span className="font-mono font-bold text-slate-900">Rs. {(selectedWorkerDetail.empBhari + selectedWorkerDetail.empNikasi).toLocaleString()}</span>
                  </div>
                  {selectedWorkerDetail.fixedSalary > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="font-urdu text-slate-700">ماہانہ مقررہ تنخواہ (Fixed Salary):</span>
                      <span className="font-mono font-bold text-slate-900">Rs. {selectedWorkerDetail.fixedSalary.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5 font-bold text-emerald-800 bg-emerald-50/50 px-2 rounded-lg">
                    <span className="font-urdu">کل حاصل شدہ محنتانہ (Total Earned):</span>
                    <span className="font-mono text-sm">Rs. {selectedWorkerDetail.totalEarned.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold text-amber-800 bg-amber-50/50 px-2 rounded-lg">
                    <span className="font-urdu">منفی وصول شدہ پیشگی ایڈوانس (Advances Taken):</span>
                    <span className="font-mono text-sm">- Rs. {selectedWorkerDetail.totalAdvance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-[#1D4ED8] pt-3 border-t-2 border-[#1D4ED8] bg-blue-50/40 px-2 py-2 rounded-lg">
                    <span className="font-urdu text-base">خالص قابلِ ادائیگی بقایا (Net Balance Payable):</span>
                    <span className="font-mono text-base">Rs. {selectedWorkerDetail.netPayable.toLocaleString()}</span>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-dashed border-slate-300 text-xs">
                  <div className="text-center">
                    <div className="h-10 border-b border-slate-400 mx-auto w-40"></div>
                    <p className="mt-2 font-bold text-slate-900 font-urdu text-sm">دستخط منشی / مینیجر</p>
                    <p className="text-[10px] text-slate-500 font-mono">{settings.managerName}</p>
                  </div>
                  <div className="text-center">
                    <div className="h-10 border-b border-slate-400 mx-auto w-40"></div>
                    <p className="mt-2 font-bold text-slate-900 font-urdu text-sm">دستخط مزدور / نشان انگوٹھا</p>
                    <p className="text-[10px] text-slate-500">Worker Signature / Thumb</p>
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
