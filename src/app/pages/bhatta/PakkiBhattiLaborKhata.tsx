import React, { useState, useEffect } from 'react';
import {
  bhattaService,
  BhattiLaborRecord,
  Employee,
} from '../../services/bhattaService';
import {
  Flame,
  PlusCircle,
  Calendar,
  Trash2,
  Receipt,
  Coins,
  TrendingUp,
  Users,
  X,
  Save,
  Printer,
  ArrowDownToLine,
  ArrowUpFromLine,
  Download,
  Search,
  Edit2,
  Layers,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function PakkiBhattiLaborKhata() {
  const [activeTab, setActiveTab] = useState<'Bhari' | 'Nikasi' | 'All'>('Bhari');
  const [records, setRecords] = useState<BhattiLaborRecord[]>(bhattaService.getBhattiRecords());
  const [employees, setEmployees] = useState<Employee[]>(bhattaService.getEmployees());
  const [selectedWorker, setSelectedWorker] = useState<string>('All');
  const [filterDate, setFilterDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Add / Edit Record Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    employee_id: employees[0]?.id || 1,
    work_type: 'Bhari' as 'Bhari' | 'Nikasi',
    entry_date: new Date().toISOString().split('T')[0],
    quantity: 10000,
    rate_per_thousand: 450,
    chamber_no: '',
    notes: '',
    aval_qty: 8500,
    doem_qty: 1000,
    soyem_qty: 500,
    khangar_qty: 0,
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setRecords(bhattaService.getBhattiRecords());
    setEmployees(bhattaService.getEmployees());
  };

  const handleOpenAdd = (type: 'Bhari' | 'Nikasi') => {
    setEditingId(null);
    const defaultRate = type === 'Bhari' ? 450 : 520;
    const defaultEmp = employees.find(e => 
      type === 'Bhari' ? e.role === 'Bhari_Worker' : e.role === 'Nikasi_Worker'
    ) || employees[0];

    setFormData({
      employee_id: defaultEmp?.id || 1,
      work_type: type,
      entry_date: new Date().toISOString().split('T')[0],
      quantity: 10000,
      rate_per_thousand: defaultRate,
      chamber_no: 'Chamber # 1',
      notes: '',
      aval_qty: 8500,
      doem_qty: 1000,
      soyem_qty: 500,
      khangar_qty: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: BhattiLaborRecord) => {
    setEditingId(rec.id);
    setFormData({
      employee_id: rec.employee_id,
      work_type: rec.work_type,
      entry_date: rec.entry_date,
      quantity: rec.quantity,
      rate_per_thousand: rec.rate_per_thousand,
      chamber_no: rec.chamber_no || '',
      notes: rec.notes || '',
      aval_qty: rec.aval_qty || (rec.quantity * 0.85),
      doem_qty: rec.doem_qty || (rec.quantity * 0.10),
      soyem_qty: rec.soyem_qty || (rec.quantity * 0.05),
      khangar_qty: rec.khangar_qty || 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmitRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      bhattaService.updateBhattiRecord(editingId, {
        employee_id: Number(formData.employee_id),
        work_type: formData.work_type,
        entry_date: formData.entry_date,
        quantity: Number(formData.quantity),
        rate_per_thousand: Number(formData.rate_per_thousand),
        chamber_no: formData.chamber_no,
        notes: formData.notes,
        aval_qty: formData.work_type === 'Nikasi' ? Number(formData.aval_qty) : undefined,
        doem_qty: formData.work_type === 'Nikasi' ? Number(formData.doem_qty) : undefined,
        soyem_qty: formData.work_type === 'Nikasi' ? Number(formData.soyem_qty) : undefined,
        khangar_qty: formData.work_type === 'Nikasi' ? Number(formData.khangar_qty) : undefined,
      });
    } else {
      bhattaService.addBhattiRecord({
        employee_id: Number(formData.employee_id),
        work_type: formData.work_type,
        entry_date: formData.entry_date,
        quantity: Number(formData.quantity),
        rate_per_thousand: Number(formData.rate_per_thousand),
        chamber_no: formData.chamber_no,
        notes: formData.notes,
        aval_qty: formData.work_type === 'Nikasi' ? Number(formData.aval_qty) : undefined,
        doem_qty: formData.work_type === 'Nikasi' ? Number(formData.doem_qty) : undefined,
        soyem_qty: formData.work_type === 'Nikasi' ? Number(formData.soyem_qty) : undefined,
        khangar_qty: formData.work_type === 'Nikasi' ? Number(formData.khangar_qty) : undefined,
      });
    }
    setIsModalOpen(false);
    setEditingId(null);
    refreshData();
  };

  const handleDeleteRecord = (id: number) => {
    if (window.confirm('Delete this pakki bhatti entry?')) {
      bhattaService.deleteBhattiRecord(id);
      refreshData();
    }
  };

  const getWorkerName = (empId: number) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.full_name : `Worker #${empId}`;
  };

  // Filter records
  const currentTabRecords = activeTab === 'All' 
    ? records 
    : records.filter(r => r.work_type === activeTab);

  const filteredRecords = currentTabRecords.filter(rec => {
    const matchesWorker = selectedWorker === 'All' || String(rec.employee_id) === selectedWorker;
    const matchesDate = !filterDate || rec.entry_date === filterDate;
    const workerName = getWorkerName(rec.employee_id).toLowerCase();
    const matchesSearch = !searchTerm || 
      workerName.includes(searchTerm.toLowerCase()) || 
      (rec.chamber_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesWorker && matchesDate && matchesSearch;
  });

  const totalQuantity = filteredRecords.reduce((sum, r) => sum + r.quantity, 0);
  const totalAmount = filteredRecords.reduce((sum, r) => sum + r.total_amount, 0);

  // Overall statistics for Pakki Bhatti
  const totalBhariQty = records.filter(r => r.work_type === 'Bhari').reduce((s, r) => s + r.quantity, 0);
  const totalNikasiQty = records.filter(r => r.work_type === 'Nikasi').reduce((s, r) => s + r.quantity, 0);
  const totalBhariWages = records.filter(r => r.work_type === 'Bhari').reduce((s, r) => s + r.total_amount, 0);
  const totalNikasiWages = records.filter(r => r.work_type === 'Nikasi').reduce((s, r) => s + r.total_amount, 0);

  // Download PDF
  const handleDownloadPakkiPDF = () => {
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

      // Title bar
      doc.setFillColor(241, 245, 249);
      doc.rect(10, 32, 277, 8, 'F');
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(29, 78, 216);
      const titleName = activeTab === 'Bhari' 
        ? 'PAKKI AENT BHATTI BHARI KHATA (پکی اینٹ بھٹی بھرائی کھاتہ)'
        : activeTab === 'Nikasi'
        ? 'PAKKI AENT BHATTI NIKALWAI KHATA (پکی اینٹ بھٹی نکلوائی / نکاسی کھاتہ)'
        : 'PAKKI AENT COMPLETE BHATTI LEDGER (پکی اینٹ بھٹی مکمل کھاتہ)';
      doc.text(titleName, 148.5, 37.5, { align: 'center' });

      // Filter summary
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Khata Type: ${activeTab === 'Bhari' ? 'Bhari (بھرائی)' : activeTab === 'Nikasi' ? 'Nikalwai (نکلوائی)' : 'All Pakki Records'}`, 14, 45);
      doc.text(`Filter Date: ${filterDate || 'All Dates'}`, 100, 45);
      doc.text(`Worker / Gang: ${selectedWorker === 'All' ? 'All Workers' : getWorkerName(Number(selectedWorker))}`, 170, 45);
      doc.text(`Total Records: ${filteredRecords.length}`, 245, 45);

      const tableRows = filteredRecords.map(rec => [
        rec.entry_date,
        rec.work_type === 'Bhari' ? 'Bhari (بھٹی لوڈنگ)' : 'Nikalwai (پکی نکلوائی)',
        getWorkerName(rec.employee_id),
        rec.chamber_no || '-',
        rec.quantity.toLocaleString(),
        `Rs. ${rec.rate_per_thousand.toLocaleString()}`,
        `Rs. ${rec.total_amount.toLocaleString()}`,
        rec.notes || '-',
      ]);

      autoTable(doc, {
        startY: 49,
        head: [['Date', 'Work Type', 'Worker / Gang Leader', 'Chamber #', 'Quantity', 'Rate / 1k', 'Total Wages (PKR)', 'Remarks']],
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
      doc.text(`Total Quantity: ${totalQuantity.toLocaleString()} bricks   |   Total Labor Wages: Rs. ${totalAmount.toLocaleString()}`, 280, finalY + 10.5, { align: 'right' });

      doc.save(`Pakki_Aent_${activeTab}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error('PDF error', e);
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] flex items-center gap-2">
            <Flame className="text-[#1D4ED8]" />
            Pakki Aent Khata (پکی اینٹ کھاتہ - بھٹی بھری و نکلوائی)
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Separately manage raw brick kiln loading (بھرائی) and baked brick kiln extraction (نکلوائی) with wages audit
          </p>
        </div>

        {/* Khata Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Main 2 Tabs: Bhari vs Nikalwai */}
          <div className="bg-[#F1F5F9] p-1 rounded-xl border border-[#CBD5E1] flex items-center shadow-xs">
            <button
              onClick={() => setActiveTab('Bhari')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'Bhari'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <ArrowDownToLine size={14} />
              بھرائی کھاتہ (Bhari)
            </button>
            <button
              onClick={() => setActiveTab('Nikasi')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'Nikasi'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <ArrowUpFromLine size={14} />
              نکلوائی کھاتہ (Nikalwai)
            </button>
            <button
              onClick={() => setActiveTab('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'All'
                  ? 'bg-[#1D4ED8] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              مکمل جائزہ (All)
            </button>
          </div>

          <button
            onClick={() => handleOpenAdd(activeTab === 'Nikasi' ? 'Nikasi' : 'Bhari')}
            className="flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle size={16} />
            اندراج نیا ریکارڈ (Add Entry)
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Selected View Quantity */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50/40 to-blue-100/40 border border-blue-300/80 border-t-4 border-t-blue-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-blue-900 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {activeTab === 'Bhari' ? 'کل بھرائی تعداد (Bhari)' : activeTab === 'Nikasi' ? 'کل نکلوائی تعداد (Nikalwai)' : 'کل پکی اینٹ ہینڈلنگ'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Layers size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-950 font-mono">
            {totalQuantity.toLocaleString()} <span className="text-xs font-semibold text-blue-700">اینٹ</span>
          </div>
          <p className="text-[11px] text-blue-900 font-medium mt-1">
            {activeTab === 'Bhari' ? 'بھٹہ کی آگ میں لوڈ کردہ کچی اینٹ' : activeTab === 'Nikasi' ? 'بھٹہ سے نکالی گئی تیار پکی اینٹ' : 'بھرائی اور نکلوائی کا مشترکہ شمار'}
          </p>
        </div>

        {/* Card 2: Total Labor Wages in Rs. */}
        <div className="bg-gradient-to-br from-emerald-50 via-green-50/50 to-emerald-100/50 border border-emerald-300/80 border-t-4 border-t-emerald-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-emerald-900 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {activeTab === 'Bhari' ? 'بھرائی مزدور اجرت' : activeTab === 'Nikasi' ? 'نکلوائی مزدور اجرت' : 'کل پکی لیبر اجرت'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Coins size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            Rs. {totalAmount.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-900 font-medium mt-1">
            لیبر پارٹی کو واجب الادا رقم (پاکستانی روپیہ)
          </p>
        </div>

        {/* Card 3: Bhari vs Nikasi Overview */}
        <div className="bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-100/40 border border-amber-300/80 border-t-4 border-t-amber-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-amber-900 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">بھٹی بھرائی بمقابلہ نکلوائی</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Flame size={16} />
            </div>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-amber-950 font-medium">بھرائی (Bhari):</span>
              <strong className="font-mono text-amber-900 font-bold">{totalBhariQty.toLocaleString()} اینٹ</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-emerald-950 font-medium">نکلوائی (Nikalwai):</span>
              <strong className="font-mono text-emerald-800 font-bold">{totalNikasiQty.toLocaleString()} اینٹ</strong>
            </div>
          </div>
          <p className="text-[11px] text-amber-900/90 font-medium mt-1 border-t border-amber-200/70 pt-1">
            بھٹہ چیمبر میں بیکنگ عمل جاری
          </p>
        </div>

        {/* Card 4: Standard Rates */}
        <div className="bg-gradient-to-br from-purple-50 via-indigo-50/40 to-purple-100/40 border border-purple-300/80 border-t-4 border-t-purple-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-purple-900 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">مقررہ اجرت ریٹ فی ہزار</span>
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-purple-950 font-medium">بھرائی ریٹ:</span>
              <strong className="font-mono text-purple-950 font-bold">Rs. 450 / 1000</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-purple-950 font-medium">نکلوائی ریٹ:</span>
              <strong className="font-mono text-purple-950 font-bold">Rs. 520 / 1000</strong>
            </div>
          </div>
          <p className="text-[11px] text-purple-900 font-medium mt-1 border-t border-purple-200/70 pt-1">
            خودکار ملٹی پلائر برائے لیبر کھاتہ
          </p>
        </div>
      </div>

      {/* Filter Bar with Search, Date, and Colored PDF & Print Buttons */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search worker, chamber #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1D4ED8]"
            />
          </div>

          {/* Worker Select */}
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#64748B]" />
            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              className="bg-white border border-[#CBD5E1] rounded-xl px-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
            >
              <option value="All">تمام مزدور / پارٹیاں (All Workers)</option>
              {employees.map(emp => (
                <option key={emp.id} value={String(emp.id)}>{emp.full_name} ({emp.role.replace(/_/g, ' ')})</option>
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

        {/* Report Action Buttons: PDF in Red, Print in Blue */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={handleDownloadPakkiPDF}
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

      {/* Main Records Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date (تاریخ)</th>
                <th className="py-3 px-4">Work Type (کھاتہ قسم)</th>
                <th className="py-3 px-4">Worker / Gang Leader (مزدور)</th>
                <th className="py-3 px-4">Chamber / Khoh (کھوہ نمبر)</th>
                <th className="py-3 px-4 text-right">Quantity (تعداد اینٹ)</th>
                <th className="py-3 px-4 text-right">Rate / 1000 (ریٹ)</th>
                <th className="py-3 px-4 text-right bg-blue-50/50 text-[#1D4ED8] font-bold">Total Wages (کل اجرت)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#64748B]">
                    کوئی ریکارڈ نہیں ملا • No {activeTab} entries found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 font-mono text-[#475569]">
                      {rec.entry_date}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        rec.work_type === 'Bhari'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {rec.work_type === 'Bhari' ? <ArrowDownToLine size={11} /> : <ArrowUpFromLine size={11} />}
                        {rec.work_type === 'Bhari' ? 'بھٹی بھرائی (Bhari)' : 'بھٹی نکلوائی (Nikalwai)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#0F172A]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-[#1D4ED8] flex items-center justify-center font-bold text-[10px]">
                          {getWorkerName(rec.employee_id)[0]}
                        </div>
                        <span>{getWorkerName(rec.employee_id)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#475569] font-medium">
                      {rec.chamber_no || <span className="text-slate-300">-</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#0F172A]">
                      {rec.quantity.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#64748B]">
                      Rs. {rec.rate_per_thousand.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#10B981] bg-emerald-50/40">
                      Rs. {rec.total_amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(rec)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-blue-600 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={13} />
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
                  <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider text-[#64748B]">
                    مجموعی ٹوٹل (Total Filtered):
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#1D4ED8] text-sm">
                    {totalQuantity.toLocaleString()} اینٹ
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

      {/* ADD / EDIT ENTRY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] bg-slate-50">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-[#1D4ED8]" />
                <h3 className="text-base font-bold text-[#0F172A]">
                  {editingId ? 'Edit Pakki Entry' : 'Add New Pakki Entry'} (پکی اینٹ کھاتہ اندراج)
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitRecord} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#334155] block mb-1.5">Work Type (کھاتہ قسم) *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, work_type: 'Bhari', rate_per_thousand: 450 })}
                    className={`py-2.5 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formData.work_type === 'Bhari'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-[#64748B] border-[#CBD5E1] hover:text-[#0F172A]'
                    }`}
                  >
                    <ArrowDownToLine size={14} />
                    بھرائی (Bhari - لوڈنگ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, work_type: 'Nikasi', rate_per_thousand: 520 })}
                    className={`py-2.5 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formData.work_type === 'Nikasi'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-[#64748B] border-[#CBD5E1] hover:text-[#0F172A]'
                    }`}
                  >
                    <ArrowUpFromLine size={14} />
                    نکلوائی (Nikalwai - برآمد)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Worker / Gang Leader (مزدور پارٹی) *</label>
                  <select
                    required
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: Number(e.target.value) })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.role.replace(/_/g, ' ')})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Entry Date (تاریخ) *</label>
                  <input
                    type="date"
                    required
                    value={formData.entry_date}
                    onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Chamber / Khoh (کھوہ نمبر)</label>
                  <input
                    type="text"
                    placeholder="مثلاً چیمبر 4"
                    value={formData.chamber_no}
                    onChange={(e) => setFormData({ ...formData, chamber_no: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Quantity of Bricks (اینٹ تعداد) *</label>
                  <input
                    type="number"
                    step="1000"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Rate / 1000 (ریٹ فی ہزار) *</label>
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

              {/* Quality Sorting inputs when Nikalwai is active */}
              {formData.work_type === 'Nikasi' && (
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                  <label className="text-[11px] font-bold text-emerald-800 block mb-2">
                    نکلوائی پکی اینٹ کی کوالٹی تقسیم (Brick Quality Sorting Breakdown - اختیاری):
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-600 block">اول (Aval)</span>
                      <input
                        type="number"
                        value={formData.aval_qty}
                        onChange={(e) => setFormData({ ...formData, aval_qty: Number(e.target.value) })}
                        className="w-full bg-white border border-[#CBD5E1] rounded-lg px-2 py-1 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-600 block">دوم (Doem)</span>
                      <input
                        type="number"
                        value={formData.doem_qty}
                        onChange={(e) => setFormData({ ...formData, doem_qty: Number(e.target.value) })}
                        className="w-full bg-white border border-[#CBD5E1] rounded-lg px-2 py-1 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-600 block">سوم (Soyem)</span>
                      <input
                        type="number"
                        value={formData.soyem_qty}
                        onChange={(e) => setFormData({ ...formData, soyem_qty: Number(e.target.value) })}
                        className="w-full bg-white border border-[#CBD5E1] rounded-lg px-2 py-1 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-600 block">کھنگر (Khangar)</span>
                      <input
                        type="number"
                        value={formData.khangar_qty}
                        onChange={(e) => setFormData({ ...formData, khangar_qty: Number(e.target.value) })}
                        className="w-full bg-white border border-[#CBD5E1] rounded-lg px-2 py-1 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-[#334155] block mb-1">Remarks / تفاصیل</label>
                <input
                  type="text"
                  placeholder="کوئی خاص نوٹ یا تفصیل..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              {/* Wage Calculation Display */}
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                <div className="flex justify-between items-center text-[#475569]">
                  <span>حساب کتاب (Calculation):</span>
                  <span className="font-mono text-[#64748B]">({formData.quantity} / 1000) &times; Rs. {formData.rate_per_thousand}</span>
                </div>
                <div className="flex justify-between items-center text-[#0F172A] font-bold mt-2 pt-2 border-t border-blue-200">
                  <span>کل مزدور اجرت (Total Wages):</span>
                  <span className="text-base font-mono text-[#1D4ED8]">
                    Rs. {((formData.quantity / 1000) * formData.rate_per_thousand).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
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
                  {editingId ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
