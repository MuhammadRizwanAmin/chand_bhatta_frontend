import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  bhattaService,
  BhattiLaborRecord,
  Employee,
} from '../../services/bhattaService';
import {
  Flame,
  PlusCircle,
  Trash2,
  Coins,
  X,
  Save,
  ArrowDownToLine,
  ArrowUpFromLine,
  Search,
  Edit2,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DateRangeFilter, DateRange, getInitialTodayRange, getInitialMonthRange, isWithinDateRange } from '../../components/DateRangeFilter';
import { useLanguage } from '../../context/LanguageContext';

export function PakkiBhattiLaborKhata() {
  const { isUrdu } = useLanguage();
  const [activeTab, setActiveTab] = useState<'Bhari' | 'Nikasi' | 'All'>('All');
  const [records, setRecords] = useState<BhattiLaborRecord[]>(() => bhattaService.getBhattiRecords());
  const [employees, setEmployees] = useState<Employee[]>(() => bhattaService.getEmployees());
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>(getInitialMonthRange());
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Pakki_Aent' | 'Tile'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Unpaid'>('All');

  // Add / Edit Record Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    employee_id: 1,
    work_type: 'Bhari' as 'Bhari' | 'Nikasi',
    item_type: 'Pakki_Aent' as 'Pakki_Aent' | 'Tile',
    entry_date: getInitialTodayRange().startDate,
    quantity: 10000,
    rate_per_thousand: 450,
    chamber_no: 'Chamber # 1',
    notes: '',
    aval_qty: 8500,
    doem_qty: 1000,
    soyem_qty: 500,
    tile_qty: 0,
    khangar_qty: 0,
    status: 'Paid' as 'Paid' | 'Unpaid',
  });

  const refreshData = () => {
    setRecords(bhattaService.getBhattiRecords());
    const emps = bhattaService.getEmployees();
    setEmployees(emps);
    if (emps.length > 0 && !formData.employee_id) {
      setFormData(prev => ({ ...prev, employee_id: emps[0].id }));
    }
  };

  useEffect(() => {
    refreshData();
    const handleUpdate = () => refreshData();
    window.addEventListener('bhatta_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('bhatta_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleDateFilterChange = React.useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  const handleOpenAdd = (type: 'Bhari' | 'Nikasi' = 'Bhari') => {
    setEditingId(null);
    const defaultRate = type === 'Bhari' ? 450 : 520;
    const defaultEmp = employees.find(e => 
      type === 'Bhari' ? e.role === 'Bhari_Worker' : e.role === 'Nikasi_Worker'
    ) || employees[0];

    setFormData({
      employee_id: defaultEmp ? defaultEmp.id : 1,
      work_type: type,
      item_type: 'Pakki_Aent',
      entry_date: dateRange.startDate || getInitialTodayRange().startDate,
      quantity: 10000,
      rate_per_thousand: defaultRate,
      chamber_no: 'Chamber # 1',
      notes: '',
      aval_qty: 8500,
      doem_qty: 1000,
      soyem_qty: 500,
      tile_qty: 0,
      khangar_qty: 0,
      status: 'Paid',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: BhattiLaborRecord) => {
    setEditingId(rec.id);
    setFormData({
      employee_id: rec.employee_id,
      work_type: rec.work_type,
      item_type: rec.item_type || 'Pakki_Aent',
      entry_date: rec.entry_date,
      quantity: rec.quantity,
      rate_per_thousand: rec.rate_per_thousand,
      chamber_no: rec.chamber_no || '',
      notes: rec.notes || '',
      aval_qty: rec.aval_qty !== undefined ? rec.aval_qty : (rec.quantity * 0.85),
      doem_qty: rec.doem_qty !== undefined ? rec.doem_qty : (rec.quantity * 0.10),
      soyem_qty: rec.soyem_qty !== undefined ? rec.soyem_qty : (rec.quantity * 0.05),
      tile_qty: rec.tile_qty || 0,
      khangar_qty: rec.khangar_qty || 0,
      status: rec.status || 'Paid',
    });
    setIsModalOpen(true);
  };

  const handleSubmitRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      bhattaService.updateBhattiRecord(editingId, {
        employee_id: Number(formData.employee_id),
        work_type: formData.work_type,
        item_type: formData.item_type,
        entry_date: formData.entry_date,
        quantity: Number(formData.quantity),
        rate_per_thousand: Number(formData.rate_per_thousand),
        chamber_no: formData.chamber_no,
        notes: formData.notes,
        aval_qty: formData.work_type === 'Nikasi' ? Number(formData.aval_qty) : undefined,
        doem_qty: formData.work_type === 'Nikasi' ? Number(formData.doem_qty) : undefined,
        soyem_qty: formData.work_type === 'Nikasi' ? Number(formData.soyem_qty) : undefined,
        tile_qty: formData.work_type === 'Nikasi' && formData.item_type === 'Tile' ? Number(formData.tile_qty || formData.quantity) : undefined,
        khangar_qty: formData.work_type === 'Nikasi' ? Number(formData.khangar_qty) : undefined,
        status: formData.status,
      });
    } else {
      bhattaService.addBhattiRecord({
        employee_id: Number(formData.employee_id),
        work_type: formData.work_type,
        item_type: formData.item_type,
        entry_date: formData.entry_date,
        quantity: Number(formData.quantity),
        rate_per_thousand: Number(formData.rate_per_thousand),
        chamber_no: formData.chamber_no,
        notes: formData.notes,
        aval_qty: formData.work_type === 'Nikasi' ? Number(formData.aval_qty) : undefined,
        doem_qty: formData.work_type === 'Nikasi' ? Number(formData.doem_qty) : undefined,
        soyem_qty: formData.work_type === 'Nikasi' ? Number(formData.soyem_qty) : undefined,
        tile_qty: formData.work_type === 'Nikasi' && formData.item_type === 'Tile' ? Number(formData.tile_qty || formData.quantity) : undefined,
        khangar_qty: formData.work_type === 'Nikasi' ? Number(formData.khangar_qty) : undefined,
        status: formData.status,
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

  const handleToggleStatus = (id: number) => {
    bhattaService.toggleBhattiStatus(id);
    refreshData();
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
    const matchesDate = isWithinDateRange(rec.entry_date, dateRange);
    const workerName = getWorkerName(rec.employee_id).toLowerCase();
    const matchesSearch = !searchTerm || 
      workerName.includes(searchTerm.toLowerCase()) || 
      (rec.chamber_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const itemType = rec.item_type || 'Pakki_Aent';
    const matchesCategory = categoryFilter === 'All' || itemType === categoryFilter;
    const itemStatus = rec.status || 'Paid';
    const matchesStatus = statusFilter === 'All' || itemStatus === statusFilter;

    return matchesDate && matchesSearch && matchesCategory && matchesStatus;
  });

  // Aggregated totals for standard 4-metric cards (Identical to Kacchi format)
  const totalProductionCount = filteredRecords.reduce((sum, r) => sum + r.quantity, 0);
  const totalBricksCount = filteredRecords
    .filter(r => (r.item_type || 'Pakki_Aent') === 'Pakki_Aent')
    .reduce((sum, r) => sum + r.quantity, 0);
  const totalTilesCount = filteredRecords
    .filter(r => r.item_type === 'Tile')
    .reduce((sum, r) => sum + r.quantity, 0);
  const totalWagesPayable = filteredRecords.reduce((sum, r) => sum + r.total_amount, 0);

  // Download PDF
  const handleDownloadPDF = () => {
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
      doc.text('PAKKI AENT & TILE BHATTI PRODUCTION AUDIT (پکی اینٹ و ٹائل کھاتہ)', 148.5, 37.5, { align: 'center' });

      const tableRows = filteredRecords.map(rec => [
        rec.entry_date,
        getWorkerName(rec.employee_id),
        rec.work_type === 'Bhari' ? 'Bhari (بھرائی)' : 'Nikasi (نکلوائی)',
        (rec.item_type || 'Pakki_Aent') === 'Tile' ? 'Tile (ٹائل)' : 'Pakki Aent (پکی اینٹ)',
        rec.quantity.toLocaleString(),
        `Rs. ${rec.rate_per_thousand.toLocaleString()}`,
        `Rs. ${rec.total_amount.toLocaleString()}`,
        rec.status || 'Paid',
      ]);

      autoTable(doc, {
        startY: 44,
        head: [['Date', 'Worker Name', 'Work Type', 'Category', 'Quantity', 'Rate / 1000', 'Total Wages', 'Status']],
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
      doc.text(`Total Count: ${totalProductionCount.toLocaleString()} units   |   Total Wages: Rs. ${totalWagesPayable.toLocaleString()}`, 280, finalY + 10.5, { align: 'right' });

      doc.save(`Pakki_Bhatti_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error('PDF error', e);
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Global Date Filter (Top-Bar Positioned) */}
      <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <Flame className="text-[#1D4ED8] shrink-0" size={24} />
            <span>{isUrdu ? 'پکی اینٹ و ٹائل بھٹی کھاتہ' : 'Pakki Aent & Tile Bhatti Khata'}</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            {isUrdu ? 'بھرائی، نکلوائی، کوالٹی تقسیم (اول، دوئم، سوئم، ٹائل) اور مزدور اجرت' : 'Kiln loading (Bhari), unloading (Nikasi), tile & brick grades and wages'}
          </p>
        </div>

        {/* Global Date Filter */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="shrink-0 max-w-full">
            <DateRangeFilter defaultOption="this_month" onChange={handleDateFilterChange} />
          </div>
        </div>
      </div>

      {/* 4 STANDARDIZED STOCK & PRODUCTION METRIC CARDS (IDENTICAL FORMAT TO KACCHI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Production Count */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50/40 to-blue-100/40 border border-blue-300/80 border-t-4 border-t-blue-600 rounded-xl p-4 shadow-xs notranslate" translate="no">
          <div className="flex items-center justify-between text-blue-900 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
              {isUrdu ? 'کل پکی پیداوار' : 'Total Pakki Stock'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Layers size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-950 font-mono leading-tight notranslate" translate="no">
            <span key={`pakki-tot-${totalProductionCount}`}>{Number(totalProductionCount).toLocaleString()}</span>{' '}
            <span className="text-xs font-semibold text-blue-700">{isUrdu ? 'یونٹس' : 'units'}</span>
          </div>
          <div className="mt-2 text-[10px] text-blue-900/90 font-medium border-t border-blue-200/70 pt-1.5">
            {isUrdu ? 'بھٹی میں پراسیس شدہ مال' : 'Processed kiln output'}
          </div>
        </div>

        {/* Card 2: Bricks Count */}
        <div className="bg-gradient-to-br from-amber-50 via-yellow-50/40 to-amber-100/40 border border-amber-300/80 border-t-4 border-t-amber-600 rounded-xl p-4 shadow-xs notranslate" translate="no">
          <div className="flex items-center justify-between text-amber-900 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
              {isUrdu ? 'پکی اینٹ تعداد' : 'Pakki Bricks'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <Flame size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-950 font-mono leading-tight notranslate" translate="no">
            <span key={`pakki-brk-${totalBricksCount}`}>{Number(totalBricksCount).toLocaleString()}</span>{' '}
            <span className="text-xs font-semibold text-amber-700">{isUrdu ? 'اینٹ' : 'bricks'}</span>
          </div>
          <div className="mt-2 text-[10px] text-amber-900/90 font-medium border-t border-amber-200/70 pt-1.5">
            {isUrdu ? 'اول، دوئم، اور سوئم اینٹ' : 'Baked brick grades'}
          </div>
        </div>

        {/* Card 3: Tiles Count */}
        <div className="bg-gradient-to-br from-purple-50 via-indigo-50/40 to-purple-100/40 border border-purple-300/80 border-t-4 border-t-purple-600 rounded-xl p-4 shadow-xs notranslate" translate="no">
          <div className="flex items-center justify-between text-purple-900 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900">
              {isUrdu ? 'پکی ٹائل تعداد' : 'Pakki Tiles'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-950 font-mono leading-tight notranslate" translate="no">
            <span key={`pakki-til-${totalTilesCount}`}>{Number(totalTilesCount).toLocaleString()}</span>{' '}
            <span className="text-xs font-semibold text-purple-700">{isUrdu ? 'ٹائل' : 'tiles'}</span>
          </div>
          <div className="mt-2 text-[10px] text-purple-900/90 font-medium border-t border-purple-200/70 pt-1.5">
            {isUrdu ? 'پکی تیار چھت و فرش ٹائل' : 'Finished roof & floor tiles'}
          </div>
        </div>

        {/* Card 4: Total Wages Payable */}
        <div className="bg-gradient-to-br from-emerald-50 via-green-50/50 to-emerald-100/50 border border-emerald-300/80 border-t-4 border-t-emerald-600 rounded-xl p-4 shadow-xs notranslate" translate="no">
          <div className="flex items-center justify-between text-emerald-900 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
              {isUrdu ? 'کل بھٹی مزدور اجرت' : 'Total Bhatti Wages'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Coins size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono leading-tight notranslate" translate="no">
            <span key={`pakki-wages-${totalWagesPayable}`}>Rs. {Number(totalWagesPayable).toLocaleString()}</span>
          </div>
          <div className="mt-2 text-[10px] text-emerald-900 font-medium border-t border-emerald-200/70 pt-1.5">
            {isUrdu ? 'بھرائی و نکاسی مزدور رقم' : 'Bhari & Nikasi labor cost'}
          </div>
        </div>

      </div>

      {/* FILTER & ACTIONS ROW */}
      <div className="bg-white rounded-xl shadow-xs p-3.5 sm:p-4 border border-[#E2E8F0] flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Left: Work Type Tabs & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Work Type Tabs (Bhari / Nikasi / All) */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs shrink-0">
            <button
              onClick={() => setActiveTab('All')}
              className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'All' ? 'bg-white text-[#1D4ED8] shadow-xs' : 'text-slate-600'
              }`}
            >
              {isUrdu ? 'تمام کھاتہ' : 'All Pakki'}
            </button>
            <button
              onClick={() => setActiveTab('Bhari')}
              className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'Bhari' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              {isUrdu ? 'بھرائی (لوڈنگ)' : 'Bhari (Loading)'}
            </button>
            <button
              onClick={() => setActiveTab('Nikasi')}
              className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'Nikasi' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              {isUrdu ? 'نکلوائی (برآمد)' : 'Nikasi (Unloading)'}
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs shrink-0">
            <button
              onClick={() => setCategoryFilter('All')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                categoryFilter === 'All' ? 'bg-white text-[#1D4ED8] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isUrdu ? 'تمام' : 'All'}
            </button>
            <button
              onClick={() => setCategoryFilter('Pakki_Aent')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                categoryFilter === 'Pakki_Aent' ? 'bg-white text-[#1D4ED8] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isUrdu ? 'اینٹ' : 'Bricks'}
            </button>
            <button
              onClick={() => setCategoryFilter('Tile')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                categoryFilter === 'Tile' ? 'bg-white text-[#1D4ED8] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isUrdu ? 'ٹائل' : 'Tiles'}
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs shrink-0">
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'All' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              {isUrdu ? 'تمام' : 'Status: All'}
            </button>
            <button
              onClick={() => setStatusFilter('Paid')}
              className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'Paid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              {isUrdu ? 'ادا' : 'Paid'}
            </button>
            <button
              onClick={() => setStatusFilter('Unpaid')}
              className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'Unpaid' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              {isUrdu ? 'بقایا' : 'Unpaid'}
            </button>
          </div>
        </div>

        {/* Right: Search & Add Entries */}
        <div className="flex flex-wrap items-center gap-2 justify-between xl:justify-end">
          <div className="relative flex-1 sm:flex-initial">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={isUrdu ? 'تلاش کریں...' : 'Search...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#0F172A] w-full sm:w-36 sm:focus:w-48 transition-all focus:outline-none focus:border-[#1D4ED8]"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => handleOpenAdd('Bhari')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
            >
              <ArrowDownToLine size={14} className="shrink-0" />
              <span>+ {isUrdu ? 'بھرائی اندراج' : 'Add Bhari'}</span>
            </button>

            <button
              onClick={() => handleOpenAdd('Nikasi')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
            >
              <ArrowUpFromLine size={14} className="shrink-0" />
              <span>+ {isUrdu ? 'نکلوائی اندراج' : 'Add Nikasi'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* STANDARDIZED DATA TABLE */}
      <div className="bg-white rounded-xl shadow-xs border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-bold text-[#475569] uppercase tracking-wider">
                <th className="py-3 px-4">{isUrdu ? 'تاریخ' : 'Date'}</th>
                <th className="py-3 px-4">{isUrdu ? 'مزدور پارٹی' : 'Worker / Gang'}</th>
                <th className="py-3 px-4">{isUrdu ? 'کھاتہ قسم' : 'Work Type'}</th>
                <th className="py-3 px-4">{isUrdu ? 'قسم' : 'Category'}</th>
                <th className="py-3 px-4 text-right">{isUrdu ? 'تعداد' : 'Quantity'}</th>
                <th className="py-3 px-4 text-right">{isUrdu ? 'ریٹ فی ہزار' : 'Rate / 1000'}</th>
                <th className="py-3 px-4 text-right">{isUrdu ? 'کل اجرت' : 'Total Wages'}</th>
                <th className="py-3 px-4 text-center">{isUrdu ? 'حالت' : 'Status'}</th>
                <th className="py-3 px-4 text-center">{isUrdu ? 'کارروائی' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                    {isUrdu ? 'اس فلٹر میں کوئی ریکارڈ موجود نہیں ہے' : 'No records found for the selected filter.'}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const isTile = rec.item_type === 'Tile';
                  const isPaid = (rec.status || 'Paid') === 'Paid';
                  const isBhari = rec.work_type === 'Bhari';

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {rec.entry_date}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">
                        {getWorkerName(rec.employee_id)}
                        {rec.chamber_no && (
                          <span className="block text-[10px] text-slate-500 font-mono">
                            {rec.chamber_no}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isBhari 
                            ? 'bg-amber-50 text-amber-800 border-amber-200' 
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {isBhari ? <ArrowDownToLine size={10} /> : <ArrowUpFromLine size={10} />}
                          <span>{isBhari ? (isUrdu ? 'بھرائی' : 'Bhari') : (isUrdu ? 'نکلوائی' : 'Nikasi')}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isTile 
                            ? 'bg-purple-50 text-purple-700 border-purple-200' 
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {isTile ? (isUrdu ? 'ٹائل' : 'Tile') : (isUrdu ? 'پکی اینٹ' : 'Pakki Aent')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#0F172A]">
                        {rec.quantity.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        Rs. {rec.rate_per_thousand.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        Rs. {rec.total_amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(rec.id)}
                          title="Click to toggle status"
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                        >
                          {isPaid ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                          <span>{isPaid ? 'Paid' : 'Unpaid'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(rec)}
                            className="p-1 text-slate-500 hover:text-[#1D4ED8] transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(rec.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredRecords.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-slate-800">
                    {isUrdu ? 'مجموعی ٹوٹل:' : 'Total Filtered:'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#1D4ED8]">
                    {totalProductionCount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-600">
                    Rs. {totalWagesPayable.toLocaleString()}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* FIXED PAKKI PRODUCTION POP-UP MODAL (Z-INDEX 99999, CREATE PORTAL, SCROLLABLE, ZERO CLIPPING) */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 px-5 border-b border-[#E2E8F0] bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-[#1D4ED8]" />
                <h3 className="text-base font-bold text-[#0F172A]">
                  {editingId ? 'Edit Pakki Entry' : 'Add Pakki Entry'} ({formData.work_type === 'Bhari' ? 'بھرائی' : 'نکلوائی'} کھاتہ)
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body - Scrollable Container */}
            <form onSubmit={handleSubmitRecord} className="flex-1 overflow-y-auto p-5 space-y-4">
              
              {/* Work Type Selection */}
              <div>
                <label className="text-xs font-semibold text-[#334155] block mb-1.5">Work Type / کھاتہ قسم *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, work_type: 'Bhari', rate_per_thousand: 450 })}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formData.work_type === 'Bhari'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <ArrowDownToLine size={14} />
                    <span>بھرائی (Bhari - لوڈنگ)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, work_type: 'Nikasi', rate_per_thousand: 520 })}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formData.work_type === 'Nikasi'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <ArrowUpFromLine size={14} />
                    <span>نکلوائی (Nikasi - برآمد)</span>
                  </button>
                </div>
              </div>

              {/* Category Selection (Bricks vs Tiles) */}
              <div>
                <label className="text-xs font-semibold text-[#334155] block mb-1.5">Category / مال کی قسم *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, item_type: 'Pakki_Aent' })}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formData.item_type === 'Pakki_Aent'
                        ? 'bg-[#1D4ED8] text-white border-[#1D4ED8] shadow-xs'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <Layers size={14} />
                    <span>پکی اینٹ (Pakki Aent)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, item_type: 'Tile' })}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formData.item_type === 'Tile'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <Sparkles size={14} />
                    <span>پکی ٹائل (Tile)</span>
                  </button>
                </div>
              </div>

              {/* Worker & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Worker / Gang Leader (مزدور پارٹی) *</label>
                  <select
                    required
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: Number(e.target.value) })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
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
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
              </div>

              {/* Chamber, Quantity & Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Chamber / کھوہ نمبر</label>
                  <input
                    type="text"
                    placeholder="مثلاً چیمبر 4"
                    value={formData.chamber_no}
                    onChange={(e) => setFormData({ ...formData, chamber_no: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Quantity (تعداد) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="مثلاً 10000"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value.replace(/[^0-9]/g, '') as any })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Rate / 1000 (ریٹ) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="مثلاً 450"
                    value={formData.rate_per_thousand}
                    onChange={(e) => setFormData({ ...formData, rate_per_thousand: e.target.value.replace(/[^0-9.]/g, '') as any })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
              </div>

              {/* Quality Sorting inputs when Nikalwai is active */}
              {formData.work_type === 'Nikasi' && (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                  <label className="text-[11px] font-bold text-emerald-900 block mb-2">
                    نکلوائی پکی اینٹ کی کوالٹی تقسیم (Brick Quality Sorting Breakdown):
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-600 block">اول (Aval)</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={formData.aval_qty}
                        onChange={(e) => setFormData({ ...formData, aval_qty: e.target.value.replace(/[^0-9]/g, '') as any })}
                        className="w-full bg-white border border-[#CBD5E1] rounded-lg px-2 py-1 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-600 block">دوم (Doem)</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={formData.doem_qty}
                        onChange={(e) => setFormData({ ...formData, doem_qty: e.target.value.replace(/[^0-9]/g, '') as any })}
                        className="w-full bg-white border border-[#CBD5E1] rounded-lg px-2 py-1 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-600 block">سوم (Soyem)</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={formData.soyem_qty}
                        onChange={(e) => setFormData({ ...formData, soyem_qty: e.target.value.replace(/[^0-9]/g, '') as any })}
                        className="w-full bg-white border border-[#CBD5E1] rounded-lg px-2 py-1 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-600 block">کھنگر (Khangar)</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={formData.khangar_qty}
                        onChange={(e) => setFormData({ ...formData, khangar_qty: e.target.value.replace(/[^0-9]/g, '') as any })}
                        className="w-full bg-white border border-[#CBD5E1] rounded-lg px-2 py-1 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="text-xs font-semibold text-[#334155] block mb-1">Payment Status (ادائیگی حالت) *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'Paid' })}
                    className={`py-1.5 px-3 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                      formData.status === 'Paid'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    Paid (ادا شدہ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'Unpaid' })}
                    className={`py-1.5 px-3 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                      formData.status === 'Unpaid'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    Unpaid (بقایا)
                  </button>
                </div>
              </div>

              {/* Wage Calculation Display */}
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between">
                <span className="text-xs text-blue-900 font-semibold">{isUrdu ? 'کل اجرت رقم:' : 'Total Wages:'}</span>
                <span className="text-sm font-mono font-bold text-[#1D4ED8]">
                  Rs. {((Number(formData.quantity) / 1000.0) * Number(formData.rate_per_thousand)).toLocaleString()}
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Save size={14} />
                  <span>{editingId ? 'Update Record' : 'Save Record'}</span>
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
