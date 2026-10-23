import React, { useState, useEffect, useRef } from 'react';
import {
  bhattaService,
  WorkerAdvance,
  Employee,
} from '../../services/bhattaService';
import { useBhattaSettings } from '../../context/BhattaSettingsContext';
import { DateRangeFilter, DateRange, getInitialTodayRange, isWithinDateRange } from '../../components/DateRangeFilter';
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
  CheckCircle2,
  Banknote,
  Search
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import chandLogo from '../../../assets/chand_bricks_logo.jpg';

export function WorkerAdvanceSettlement() {
  const { settings } = useBhattaSettings();
  const slipPrintRef = useRef<HTMLDivElement>(null);
  const [dateRange, setDateRange] = useState<DateRange>(getInitialTodayRange());
  const [searchTerm, setSearchTerm] = useState('');
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
    status: 'Paid' as 'Paid' | 'Unpaid',
  });

  // Pay Salary / Settle Wages Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payFormData, setPayFormData] = useState({
    employee_id: employees[0]?.id || 1,
    payment_date: new Date().toISOString().split('T')[0],
    payment_type: 'Salary' as 'Salary' | 'Wages' | 'Advance',
    amount: 5000,
    payment_mode: 'Cash' as 'Cash' | 'Bank_Transfer' | 'Cheque',
    paid_by: 'Munshi Sarwar',
    status: 'Paid' as 'Paid' | 'Unpaid' | 'Partial Paid',
    remarks: 'Salary payment',
  });

  // Individual Khata Modal
  const [selectedWorkerDetail, setSelectedWorkerDetail] = useState<any | null>(null);

  // Status overrides for settlements (Paid, Unpaid, Partial Paid)
  const [statusOverrides, setStatusOverrides] = useState<Record<number, 'Paid' | 'Unpaid' | 'Partial Paid'>>(() => {
    try {
      const saved = localStorage.getItem('worker_settlement_status_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const getSettlementStatus = (s: any): 'Paid' | 'Unpaid' | 'Partial Paid' => {
    if (statusOverrides[s.employee.id]) {
      return statusOverrides[s.employee.id];
    }
    if (s.totalEarned <= 0 && s.totalAdvance <= 0) return 'Paid';
    if (s.netPayable <= 0) return 'Paid';
    if (s.totalAdvance > 0 && s.netPayable > 0) return 'Partial Paid';
    return 'Unpaid';
  };

  const handleToggleStatus = (empId: number) => {
    const s = settlements.find(item => item.employee.id === empId);
    if (!s) return;
    const current = getSettlementStatus(s);
    const nextStatus: 'Paid' | 'Unpaid' | 'Partial Paid' =
      current === 'Paid' ? 'Unpaid' : current === 'Unpaid' ? 'Partial Paid' : 'Paid';
    const updated = { ...statusOverrides, [empId]: nextStatus };
    setStatusOverrides(updated);
    localStorage.setItem('worker_settlement_status_overrides', JSON.stringify(updated));
  };

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
      status: formData.status,
    });
    setIsModalOpen(false);
    refreshData();
    toast.success('Advance added successfully!');
  };

  const handleDeleteAdvance = (id: number) => {
    if (window.confirm('Delete this advance entry?')) {
      bhattaService.deleteAdvance(id);
      refreshData();
    }
  };

  const handleOpenPayModal = (settlementItem?: any) => {
    const emp = settlementItem ? settlementItem.employee : employees[0];
    const net = settlementItem ? settlementItem.netPayable : 0;
    const isMonthly = emp && emp.salary_type === 'Monthly_Salary';
    const defaultAmount = net > 0 ? net : (settlementItem?.fixedSalary || emp?.monthly_salary_amount || 5000);

    setPayFormData({
      employee_id: emp ? emp.id : 1,
      payment_date: new Date().toISOString().split('T')[0],
      payment_type: isMonthly ? 'Salary' : 'Wages',
      amount: defaultAmount,
      payment_mode: 'Cash',
      paid_by: 'Munshi Sarwar',
      status: 'Paid',
      remarks: `${emp?.full_name || 'Worker'} ${isMonthly ? 'Monthly Salary' : 'Wages Settlement'} Paid`,
    });
    setIsPayModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(payFormData.amount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    // 1. Record advance/payment entry
    bhattaService.addAdvance({
      employee_id: Number(payFormData.employee_id),
      advance_date: payFormData.payment_date,
      amount_paid: amount,
      remarks: `${payFormData.payment_type} Payment: ${payFormData.remarks || 'Paid full'} (${payFormData.payment_mode})`,
      status: 'Paid',
    });

    // 2. Also record in daily expenses under Labor/Salary category (Category 6)
    bhattaService.addExpense({
      title: `${getWorkerName(payFormData.employee_id)} - ${payFormData.payment_type} Payment`,
      category_id: 6,
      expense_date: payFormData.payment_date,
      amount: amount,
      payment_mode: payFormData.payment_mode,
      paid_by: payFormData.paid_by,
      description: `${payFormData.payment_type} payment via ${payFormData.payment_mode}. ${payFormData.remarks || ''}`,
    });

    // 3. Update status override for this worker
    const updatedStatus = { ...statusOverrides, [payFormData.employee_id]: payFormData.status };
    setStatusOverrides(updatedStatus);
    localStorage.setItem('worker_settlement_status_overrides', JSON.stringify(updatedStatus));

    setIsPayModalOpen(false);
    refreshData();
    toast.success(payFormData.status === 'Paid' ? 'Payment paid successfully!' : 'Payment added successfully!');
  };

  const currentMonthPeriod = `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`;
  const filteredAdvances = advances.filter(a => isWithinDateRange(a.advance_date, dateRange));
  const totalAdvancesAll = filteredAdvances.reduce((sum, a) => sum + a.amount_paid, 0);
  // Summary cards show activity in the selected dates, rather than lifetime balances.
  const periodWages = [
    ...bhattaService.getKacchiRecords(),
    ...bhattaService.getBhattiRecords(),
  ].filter(record => isWithinDateRange(record.entry_date, dateRange));
  const periodWorkerBalances = new Map<number, number>();
  const totalWagesEarnedAll = periodWages.reduce((sum, record) => {
    const amount = Number(record.total_amount) || 0;
    periodWorkerBalances.set(record.employee_id, (periodWorkerBalances.get(record.employee_id) || 0) + amount);
    return sum + amount;
  }, 0);
  filteredAdvances.forEach(advance => {
    periodWorkerBalances.set(advance.employee_id, (periodWorkerBalances.get(advance.employee_id) || 0) - (Number(advance.amount_paid) || 0));
  });
  // A worker's excess advance must not reduce another worker's payable wages.
  const totalNetPayableAll = Array.from(periodWorkerBalances.values()).reduce((sum, balance) => sum + Math.max(0, balance), 0);

  const getWorkerName = (empId: number) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.full_name : `Worker #${empId}`;
  };

  const searchQuery = searchTerm.trim().toLowerCase();
  const matchesWorkerSearch = (employee?: Employee) => !searchQuery || !!employee && [
    employee.full_name,
    employee.phone,
    employee.role?.replace(/_/g, ' '),
  ].some(value => String(value || '').toLowerCase().includes(searchQuery));
  const visibleSettlements = settlements.filter(item => matchesWorkerSearch(item.employee));
  const visibleAdvances = filteredAdvances.filter(advance =>
    matchesWorkerSearch(employees.find(employee => employee.id === advance.employee_id))
  );

  const handleOpenWorkerKhata = (settlement: (typeof settlements)[number]) => {
    const employeeId = settlement.employee.id;
    const kacchiEntries = bhattaService.getKacchiRecords().filter(record => record.employee_id === employeeId);
    const pakkiEntries = bhattaService.getBhattiRecords().filter(record => record.employee_id === employeeId);
    const advanceEntries = bhattaService.getAdvances().filter(record => record.employee_id === employeeId)
      .sort((a, b) => a.advance_date.localeCompare(b.advance_date) || a.id - b.id);
    const earningEntries = [
      ...kacchiEntries.map(record => ({ ...record, entryKey: 'kacchi-' + record.id, workLabel: 'Kacchi Pathai / کچی پتھائی' })),
      ...pakkiEntries.map(record => ({ ...record, entryKey: 'pakki-' + record.id, workLabel: record.work_type === 'Bhari' ? 'Pakki Bhari / پکی بھرائی' : 'Pakki Nikasi / پکی نکاسی' })),
    ].sort((a, b) => a.entry_date.localeCompare(b.entry_date) || a.id - b.id);
    const empKacchi = kacchiEntries.reduce((sum, record) => sum + (Number(record.total_amount) || 0), 0);
    const empBhari = pakkiEntries.filter(record => record.work_type === 'Bhari').reduce((sum, record) => sum + (Number(record.total_amount) || 0), 0);
    const empNikasi = pakkiEntries.filter(record => record.work_type === 'Nikasi').reduce((sum, record) => sum + (Number(record.total_amount) || 0), 0);
    const fixedSalary = Number(settlement.fixedSalary) || 0;
    const totalEarned = empKacchi + empBhari + empNikasi + fixedSalary;
    const totalAdvance = advanceEntries.reduce((sum, record) => sum + (Number(record.amount_paid) || 0), 0);
    setSelectedWorkerDetail({
      ...settlement, earningEntries, advanceEntries, empKacchi, empBhari, empNikasi,
      fixedSalary, totalEarned, totalAdvance, netPayable: totalEarned - totalAdvance,
    });
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
      doc.text(`WORK SLIP FOR ${currentMonthPeriod.toUpperCase()}`, 74, 41.5, { align: 'center' });

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
      tableData.push(['Advance Deducted (منفی کٹوتی ایڈوانس)', `- Rs. ${detail.totalAdvance.toLocaleString()}`]);
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

      doc.save(`Work_Slip_${currentMonthPeriod.replace(/\s+/g, '_')}_${detail.employee.full_name.replace(/\s+/g, '_')}.pdf`);
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

      const tableRows = settlements.map(s => {
        const status = getSettlementStatus(s);
        const salary = s.fixedSalary || (s.employee.salary_type === 'Monthly_Salary' ? s.employee.monthly_salary_amount : 0);
        return [
          `${s.employee.full_name} (${s.employee.role})`,
          salary > 0 ? `Rs. ${salary.toLocaleString()}` : 'Rs. 0',
          `Rs. ${s.totalEarned.toLocaleString()}`,
          `Rs. ${s.totalAdvance.toLocaleString()}`,
          `Rs. ${s.netPayable.toLocaleString()}`,
          status,
        ];
      });

      autoTable(doc, {
        startY: 44,
        head: [['Name & Role', 'Salary', 'Total', 'Advance', 'Net Payable', 'Status']],
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
    <div className="space-y-6 max-w-full overflow-x-hidden">
      
      {/* Top Header & Global Date Filter (Top-Bar Positioned - Filter Only) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] flex items-center gap-2">
            <Coins className="text-[#1D4ED8]" />
            Worker Settlement (مزدور نیٹ حساب)
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Formula: Total Earned - Advance Taken = Net Balance Payable
          </p>
        </div>

        {/* Global Date Filter Only */}
        <div className="shrink-0 max-w-full">
          <DateRangeFilter defaultOption="this_month" onChange={setDateRange} />
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
          <p className="text-[11px] text-amber-900 font-medium mt-1">Advances disbursed in selected dates</p>
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
          <p className="text-[11px] text-emerald-900 font-medium mt-1">Pathai + bhari + nikasi earnings in selected dates</p>
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
          <p className="text-[11px] text-blue-900 font-medium mt-1">Selected-period wages after deducting advances</p>
        </div>
      </div>

      {/* UNIFIED TABLE CONTAINER */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        {/* Unified Table Header Bar: Tabs on Left, Actions on Right (Replacing old Export PDF spot) */}
        <div className="p-3.5 sm:p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs: Worker Settlement (نیٹ حساب) & Advance History (ایڈوانس اندراج) */}
          <div className="bg-[#E2E8F0] p-1 rounded-xl border border-[#CBD5E1] flex items-center shrink-0 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('settlement')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'settlement'
                  ? 'bg-[#1D4ED8] text-white shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              Worker Settlement (نیٹ حساب)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('advances')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'advances'
                  ? 'bg-[#1D4ED8] text-white shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              Advance History (ایڈوانس اندراج)
            </button>
          </div>

          {/* Action Buttons: Pay Salary/Wages, Add Advance, Export PDF */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleOpenPayModal()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
              title="Record Salary or Wages payment to worker"
            >
              <Banknote size={15} />
              <span>Pay Salary / Wages (ادائیگی)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
            >
              <PlusCircle size={15} />
              <span>Add Advance (نیا ایڈوانس)</span>
            </button>
          </div>
        </div>

        <div className="px-3.5 sm:px-4 py-3 border-b border-[#E2E8F0]">
          <div className="relative w-full max-w-md">
            <Search size={15} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              aria-label="Search workers by name, phone or role"
              placeholder="Search worker name, phone or role..."
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
            />
          </div>
        </div>

        {/* TAB 1: MASTER SETTLEMENT TABLE */}
        {activeTab === 'settlement' && (
          <div className="w-full overflow-hidden">
            <table className="w-full text-left text-xs table-auto">
              <thead className="bg-[#F8FAFC] text-[#475569] font-bold border-b border-[#E2E8F0] uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Name & Role</th>
                  <th className="py-3 px-3 text-right">Salary</th>
                  <th className="py-3 px-3 text-right text-emerald-600">Total</th>
                  <th className="py-3 px-3 text-right text-amber-600">Advance</th>
                  <th className="py-3 px-3 text-right text-[#1D4ED8]">Net Payable</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
                {visibleSettlements.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 px-4 text-center text-slate-500">No workers found.</td>
                  </tr>
                )}
                {visibleSettlements.map((s) => {
                  const status = getSettlementStatus(s);
                  const salaryVal = s.fixedSalary || (s.employee.salary_type === 'Monthly_Salary' ? s.employee.monthly_salary_amount : 0);

                  return (
                    <tr key={s.employee.id} className="hover:bg-[#F8FAFC] transition-colors">
                      {/* 1. Name & Role */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#0F172A] text-xs">{s.employee.full_name}</div>
                        <span className="text-[10px] text-[#64748B] font-medium">{s.employee.role.replace(/_/g, ' ')}</span>
                      </td>

                      {/* 2. Salary */}
                      <td className="py-3 px-3 text-right font-mono text-[#475569] whitespace-nowrap">
                        {salaryVal > 0 ? `Rs. ${salaryVal.toLocaleString()}` : 'Rs. 0'}
                      </td>

                      {/* 3. Total */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                        Rs. {s.totalEarned.toLocaleString()}
                      </td>

                      {/* 4. Advance */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-600 whitespace-nowrap">
                        Rs. {s.totalAdvance.toLocaleString()}
                      </td>

                      {/* 5. Net Payable */}
                      <td className="py-3 px-3 text-right font-mono font-black text-xs whitespace-nowrap bg-blue-50/40">
                        <span className={s.netPayable >= 0 ? 'text-[#1D4ED8]' : 'text-rose-600'}>
                          Rs. {s.netPayable.toLocaleString()}
                        </span>
                      </td>

                      {/* 6. Status: Paid, Unpaid, Partial Paid */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(s.employee.id)}
                          title="Click to toggle status: Paid / Unpaid / Partial Paid"
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                            status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                              : status === 'Partial Paid'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            status === 'Paid' ? 'bg-emerald-600' : status === 'Partial Paid' ? 'bg-blue-600' : 'bg-amber-600'
                          }`}></span>
                          <span>{status}</span>
                        </button>
                      </td>

                      {/* 7. Action */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenPayModal(s)}
                            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Pay Salary/Wages"
                          >
                            <Banknote size={12} />
                            <span>Pay</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenWorkerKhata(s)}
                            className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] border border-blue-200 text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="View Khata Slip"
                          >
                            <span>Khata</span>
                            <span>&rarr;</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs text-slate-800">
                <tr>
                  <td className="py-3 px-4">Total / کل میزان</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-600">
                    Rs. {visibleSettlements.reduce((sum, s) => sum + (s.fixedSalary || (s.employee.salary_type === 'Monthly_Salary' ? s.employee.monthly_salary_amount : 0)), 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-600 font-bold">
                    Rs. {visibleSettlements.reduce((sum, item) => sum + item.totalEarned, 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-amber-600 font-bold">
                    Rs. {visibleSettlements.reduce((sum, s) => sum + s.totalAdvance, 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[#1D4ED8] font-black bg-blue-50/50">
                    Rs. {visibleSettlements.reduce((sum, item) => sum + item.netPayable, 0).toLocaleString()}
                  </td>
                  <td colSpan={2} className="py-3 px-3 text-center text-[11px] text-slate-500">
                    {visibleSettlements.length} Workers
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* TAB 2: ADVANCE ENTRIES LIST */}
        {activeTab === 'advances' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Worker Name</th>
                  <th className="py-3 px-4 text-right">Advance Amount (رقم)</th>
                  <th className="py-3 px-4">Remarks / Purpose</th>
                  <th className="py-3 px-4 text-center">Status (حیثیت)</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
                {visibleAdvances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No advances found for the selected period.
                    </td>
                  </tr>
                ) : (
                  visibleAdvances.map((adv) => (
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
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            bhattaService.toggleWorkerAdvanceStatus(adv.id);
                            refreshData();
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                            (adv.status || 'Paid') === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                          }`}
                          title="Click to toggle status"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${(adv.status || 'Paid') === 'Paid' ? 'bg-emerald-600' : 'bg-amber-600'}`}></span>
                          <span>{adv.status || 'Paid'}</span>
                        </button>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="مثلاً 5000"
                  value={formData.amount_paid}
                  onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value.replace(/[^0-9.]/g, '') as any })}
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

              <div>
                <label className="text-xs font-semibold text-[#334155] block mb-1">Payment Status (ادائیگی حیثیت)</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Paid' | 'Unpaid' })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                >
                  <option value="Paid">Paid (ادا شدہ)</option>
                  <option value="Unpaid">Unpaid (غیر ادا شدہ)</option>
                </select>
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

      {/* PAY SALARY / WAGES MODAL */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] bg-emerald-50/50">
              <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <Banknote size={20} className="text-emerald-600" />
                <span>Worker Payment / Salary Disbursement (مزدور ادائیگی / تنخواہ)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Select Worker (مزدور) *</label>
                  <select
                    required
                    value={payFormData.employee_id}
                    onChange={(e) => {
                      const empId = Number(e.target.value);
                      const emp = employees.find(x => x.id === empId);
                      const st = settlements.find(x => x.employee.id === empId);
                      const isMonthly = emp?.salary_type === 'Monthly_Salary';
                      const defAmt = isMonthly ? (emp?.monthly_salary_amount || 0) : Math.max(0, st?.netPayable || 0);
                      setPayFormData({
                        ...payFormData,
                        employee_id: empId,
                        payment_type: isMonthly ? 'Salary' : 'Wages',
                        amount: defAmt,
                      });
                    }}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Payment Type (قسم ادائیگی) *</label>
                  <select
                    value={payFormData.payment_type}
                    onChange={(e) => setPayFormData({ ...payFormData, payment_type: e.target.value as any })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                  >
                    <option value="Salary">Monthly Salary (ماہانہ تنخواہ)</option>
                    <option value="Wages">Production Wages (پیداواری اجرت)</option>
                    <option value="Advance">Special Advance (خصوصی پیشگی)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Payment Date (تاریخ ادائیگی) *</label>
                  <input
                    type="date"
                    required
                    value={payFormData.payment_date}
                    onChange={(e) => setPayFormData({ ...payFormData, payment_date: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Amount Paid (رقم ادائیگی - Rs.) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="مثلاً 10000"
                    value={payFormData.amount}
                    onChange={(e) => setPayFormData({ ...payFormData, amount: e.target.value.replace(/[^0-9.]/g, '') as any })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] font-mono font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Payment Mode (طریقہ)</label>
                  <select
                    value={payFormData.payment_mode}
                    onChange={(e) => setPayFormData({ ...payFormData, payment_mode: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                  >
                    <option value="Cash">Cash (نقد)</option>
                    <option value="Bank">Bank Transfer (بینک)</option>
                    <option value="Cheque">Cheque (چیک)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Paid By (ادائیگی کنندہ)</label>
                  <input
                    type="text"
                    value={payFormData.paid_by}
                    onChange={(e) => setPayFormData({ ...payFormData, paid_by: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Status (حیثیت)</label>
                  <select
                    value={payFormData.status}
                    onChange={(e) => setPayFormData({ ...payFormData, status: e.target.value as any })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#0F172A] font-bold focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Paid">Paid (ادا شدہ)</option>
                    <option value="Partial Paid">Partial Paid (جزوی ادا شدہ)</option>
                    <option value="Unpaid">Unpaid (غیر ادا شدہ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#334155] block mb-1">Remarks / Note (تفصیل)</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared monthly balance, cash handed over"
                  value={payFormData.remarks}
                  onChange={(e) => setPayFormData({ ...payFormData, remarks: e.target.value })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 bg-[#F1F5F9] text-[#475569] rounded-xl text-xs font-medium hover:bg-[#E2E8F0] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Save size={15} />
                  Record Payment (محفوظ کریں)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INDIVIDUAL KHATA SLIP MODAL */}
      {selectedWorkerDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white text-[#0F172A] rounded-2xl shadow-2xl overflow-hidden my-auto border border-slate-300 flex flex-col max-h-[96vh]">
            
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
                  lang="en" title="Save PDF"
                >
                  <Download size={15} />
                  <span className="font-sans">Save PDF</span>
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
                  lang="en" title="Print"
                >
                  <Printer size={15} />
                  <span className="font-sans">Print</span>
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
                    <div className="text-center sm:text-right bg-slate-50 p-3.5 rounded-xl border border-slate-200 shrink-0 min-w-[200px]">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-1">
                        <CheckCircle2 size={13} />
                        <span>مزدور کھاتہ و تنخواہ پرچی</span>
                      </div>
                      <div className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 mb-2 font-mono">
                        Complete Khata / مکمل کھاتہ
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

                {/* Complete account: earnings less all recorded advances/payments. */}
                <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 space-y-3 text-sm" dir="ltr">
                  <h3 className="font-bold text-slate-900">Worker Account Summary / مزدور کا مکمل حساب</h3>
                  <p className="text-xs text-slate-500">All recorded dates / تمام درج شدہ تاریخوں کا حساب</p>
                  <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                    <span>Kacchi Aent / Tile Earnings <span className="font-urdu">(کچی پتھائی کی کمائی)</span></span>
                    <strong className="whitespace-nowrap">Rs. {selectedWorkerDetail.empKacchi.toLocaleString()}</strong>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 space-y-2">
                    <div className="flex justify-between gap-3 font-semibold">
                      <span>Pakki Aent / Tile Earnings <span className="font-urdu">(پکی اینٹ کی کمائی)</span></span>
                      <span className="whitespace-nowrap">Rs. {(selectedWorkerDetail.empBhari + selectedWorkerDetail.empNikasi).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-xs text-slate-600"><span>Bhari / بھرائی</span><span>Rs. {selectedWorkerDetail.empBhari.toLocaleString()}</span></div>
                    <div className="flex justify-between gap-3 text-xs text-slate-600"><span>Nikasi / نکاسی</span><span>Rs. {selectedWorkerDetail.empNikasi.toLocaleString()}</span></div>
                  </div>
                  {selectedWorkerDetail.fixedSalary > 0 && (
                    <div className="flex justify-between gap-3"><span>Fixed Salary / مقررہ تنخواہ</span><strong>Rs. {selectedWorkerDetail.fixedSalary.toLocaleString()}</strong></div>
                  )}
                  <div className="flex justify-between gap-3 rounded-lg bg-emerald-50 p-3 font-bold text-emerald-800"><span>Total Earned / کل کمائی</span><span>Rs. {selectedWorkerDetail.totalEarned.toLocaleString()}</span></div>
                  <div className="flex justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 font-semibold text-amber-900"><span>Received Payment<br /><span className="font-urdu">وصول شدہ ادائیگی</span></span><span className="whitespace-nowrap">− Rs. {selectedWorkerDetail.totalAdvance.toLocaleString()}</span></div>
                  <div className="flex justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 font-bold text-[#1D4ED8]"><span>{selectedWorkerDetail.netPayable < 0 ? 'Excess Advance / زائد ایڈوانس' : 'Remaining Balance Payable / مزدور کا بقایا'}</span><span className="whitespace-nowrap">Rs. {Math.abs(selectedWorkerDetail.netPayable).toLocaleString()}</span></div>
                  <p className="text-xs text-slate-600">Rs. {selectedWorkerDetail.totalEarned.toLocaleString()} − Rs. {selectedWorkerDetail.totalAdvance.toLocaleString()} = Rs. {selectedWorkerDetail.netPayable.toLocaleString()}</p>
                </div>

                <section className="mb-5" dir="ltr">
                  <h3 className="mb-2 font-bold text-sm text-slate-900">Earnings Details / تاریخ وار کمائی</h3>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 print:overflow-visible">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-blue-50 text-blue-900"><tr><th className="p-2">Date / تاریخ</th><th className="p-2">Work / کام</th><th className="p-2 text-right">Quantity / تعداد</th><th className="p-2 text-right">Rate / 1000</th><th className="p-2 text-right">Earned / کمائی</th></tr></thead>
                      <tbody className="divide-y divide-slate-200">
                        {selectedWorkerDetail.earningEntries.length === 0 && <tr><td colSpan={5} className="p-3 text-center text-slate-500">No production earnings recorded / کمائی کا اندراج موجود نہیں</td></tr>}
                        {selectedWorkerDetail.earningEntries.map((entry: any) => (
                          <tr key={entry.entryKey} className="break-inside-avoid">
                            <td className="p-2 whitespace-nowrap">{entry.entry_date.slice(0, 10)}</td>
                            <td className="p-2">{entry.workLabel}<span className="block text-slate-500">{entry.item_type === 'Tile' ? 'Tile / ٹائل' : 'Bricks / اینٹ'}</span></td>
                            <td className="p-2 text-right">{Number(entry.quantity).toLocaleString()}</td>
                            <td className="p-2 text-right">Rs. {Number(entry.rate_per_thousand).toLocaleString()}</td>
                            <td className="p-2 text-right whitespace-nowrap font-semibold">Rs. {Number(entry.total_amount).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 font-semibold"><tr><td colSpan={4} className="p-2">Total Production Earnings / کل پیداواری کمائی</td><td className="p-2 text-right whitespace-nowrap">Rs. {(selectedWorkerDetail.empKacchi + selectedWorkerDetail.empBhari + selectedWorkerDetail.empNikasi).toLocaleString()}</td></tr></tfoot>
                    </table>
                  </div>
                </section>

                <section className="mb-6" dir="ltr">
                  <h3 className="mb-2 font-bold text-sm text-slate-900">Advances & Payments Received / وصول شدہ رقوم</h3>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 print:overflow-visible">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-amber-50 text-amber-900"><tr><th className="p-2">Date / تاریخ</th><th className="p-2">Details / تفصیل</th><th className="p-2 text-right">Received / وصولی</th></tr></thead>
                      <tbody className="divide-y divide-slate-200">
                        {selectedWorkerDetail.advanceEntries.length === 0 && <tr><td colSpan={3} className="p-3 text-center text-slate-500">No advance or payment recorded / وصولی کا اندراج موجود نہیں</td></tr>}
                        {selectedWorkerDetail.advanceEntries.map((entry: any) => (
                          <tr key={entry.id} className="break-inside-avoid"><td className="p-2 whitespace-nowrap">{entry.advance_date.slice(0, 10)}</td><td className="p-2 break-words">{entry.remarks || 'Advance / ایڈوانس'}</td><td className="p-2 text-right whitespace-nowrap">Rs. {Number(entry.amount_paid).toLocaleString()}</td></tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-amber-50 font-semibold text-amber-900"><tr><td colSpan={2} className="p-2">Total Deducted / کل منفی رقم</td><td className="p-2 text-right whitespace-nowrap">Rs. {selectedWorkerDetail.totalAdvance.toLocaleString()}</td></tr></tfoot>
                    </table>
                  </div>
                </section>

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
