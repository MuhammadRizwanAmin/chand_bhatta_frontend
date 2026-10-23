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
  Trash2,
  Edit2,
  Coins,
  X,
  Save,
  Search,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DateRangeFilter, DateRange, getInitialTodayRange, getInitialMonthRange, isWithinDateRange } from '../../components/DateRangeFilter';
import { useLanguage } from '../../context/LanguageContext';

export function KacchiProductionKhata() {
  const { isUrdu } = useLanguage();
  const [records, setRecords] = useState<KacchiAentRecord[]>(() => bhattaService.getKacchiRecords());
  const [employees, setEmployees] = useState<Employee[]>(() => bhattaService.getEmployees());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>(getInitialMonthRange());
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Kacchi_Aent' | 'Tile'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Unpaid'>('All');

  // Add / Edit Record Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    employee_id: 1,
    entry_date: getInitialTodayRange().startDate,
    item_type: 'Kacchi_Aent' as 'Kacchi_Aent' | 'Tile',
    quantity: 5000,
    rate_per_thousand: 1450,
    status: 'Paid' as 'Paid' | 'Unpaid',
  });

  const refreshData = () => {
    setRecords(bhattaService.getKacchiRecords());
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

  const handleOpenAdd = () => {
    setEditingId(null);
    const defaultEmp = employees.find(e => e.role === 'Kacchi_Worker') || employees[0];
    setFormData({
      employee_id: defaultEmp ? defaultEmp.id : 1,
      entry_date: dateRange.startDate || getInitialTodayRange().startDate,
      item_type: 'Kacchi_Aent',
      quantity: 5000,
      rate_per_thousand: 1450,
      status: 'Paid',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: KacchiAentRecord) => {
    setEditingId(rec.id);
    setFormData({
      employee_id: rec.employee_id,
      entry_date: rec.entry_date,
      item_type: rec.item_type || 'Kacchi_Aent',
      quantity: rec.quantity,
      rate_per_thousand: rec.rate_per_thousand,
      status: rec.status || 'Paid',
    });
    setIsModalOpen(true);
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      bhattaService.updateKacchiRecord(editingId, {
        employee_id: Number(formData.employee_id),
        entry_date: formData.entry_date,
        item_type: formData.item_type,
        quantity: Number(formData.quantity),
        rate_per_thousand: Number(formData.rate_per_thousand),
        status: formData.status,
      });
    } else {
      bhattaService.addKacchiRecord({
        employee_id: Number(formData.employee_id),
        entry_date: formData.entry_date,
        item_type: formData.item_type,
        quantity: Number(formData.quantity),
        rate_per_thousand: Number(formData.rate_per_thousand),
        status: formData.status,
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

  const handleToggleStatus = (id: number) => {
    bhattaService.toggleKacchiStatus(id);
    refreshData();
  };

  const getWorkerName = (empId: number) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.full_name : `Worker #${empId}`;
  };

  // Filtered records
  const filteredRecords = records.filter(rec => {
    const workerName = getWorkerName(rec.employee_id).toLowerCase();
    const matchesSearch = !searchTerm || 
      workerName.includes(searchTerm.toLowerCase()) || 
      String(rec.employee_id).includes(searchTerm);
    const matchesDate = isWithinDateRange(rec.entry_date, dateRange);
    const itemType = rec.item_type || 'Kacchi_Aent';
    const matchesCategory = categoryFilter === 'All' || itemType === categoryFilter;
    const itemStatus = rec.status || 'Paid';
    const matchesStatus = statusFilter === 'All' || itemStatus === statusFilter;

    return matchesSearch && matchesDate && matchesCategory && matchesStatus;
  });

  // Aggregated totals for standard metrics
  const totalProductionCount = filteredRecords.reduce((sum, r) => sum + r.quantity, 0);
  const totalBricksCount = filteredRecords
    .filter(r => (r.item_type || 'Kacchi_Aent') === 'Kacchi_Aent')
    .reduce((sum, r) => sum + r.quantity, 0);
  const totalTilesCount = filteredRecords
    .filter(r => r.item_type === 'Tile')
    .reduce((sum, r) => sum + r.quantity, 0);
  const totalWagesPayable = filteredRecords.reduce((sum, r) => sum + r.total_amount, 0);

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

      // Title
      doc.setFillColor(241, 245, 249);
      doc.rect(10, 32, 277, 8, 'F');
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(29, 78, 216);
      doc.text('KACCHI AENT & TILE PRODUCTION AUDIT (کچی اینٹ و ٹائل پتھائی کھاتہ)', 148.5, 37.5, { align: 'center' });

      const tableRows = filteredRecords.map(rec => [
        rec.entry_date,
        getWorkerName(rec.employee_id),
        (rec.item_type || 'Kacchi_Aent') === 'Tile' ? 'Tile (ٹائل)' : 'Kacchi Aent (کچی اینٹ)',
        rec.quantity.toLocaleString(),
        `Rs. ${rec.rate_per_thousand.toLocaleString()}`,
        `Rs. ${rec.total_amount.toLocaleString()}`,
        rec.status || 'Paid',
      ]);

      autoTable(doc, {
        startY: 44,
        head: [['Date', 'Worker / Pathair Name', 'Category', 'Quantity', 'Rate / 1000', 'Total Wages', 'Status']],
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

      doc.save(`Kacchi_Production_Report_${new Date().toISOString().split('T')[0]}.pdf`);
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
            <Layers className="text-[#1D4ED8] shrink-0" size={24} />
            <span>{isUrdu ? 'کچی اینٹ و ٹائل پتھائی کھاتہ' : 'Kacchi Aent & Tile Production Khata'}</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            {isUrdu ? 'کچی اینٹ، ٹائل پتھائی، روزمرہ مزدور اجرت و اسٹاک ریکارڈ' : 'Raw bricks & tile pathai logs, wages & ground stock'}
          </p>
        </div>

        {/* Global Date Filter */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="shrink-0 max-w-full">
            <DateRangeFilter defaultOption="this_month" onChange={handleDateFilterChange} />
          </div>
        </div>
      </div>

      {/* 4 STANDARDIZED STOCK & PRODUCTION METRIC CARDS (IDENTICAL FORMAT TO PAKKI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Production Count */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50/40 to-blue-100/40 border border-blue-300/80 border-t-4 border-t-blue-600 rounded-xl p-4 shadow-xs notranslate" translate="no">
          <div className="flex items-center justify-between text-blue-900 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
              {isUrdu ? 'کل کچی پیداوار' : 'Total Kacchi Stock'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Layers size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-950 font-mono leading-tight notranslate" translate="no">
            <span key={`kacchi-tot-${totalProductionCount}`}>{Number(totalProductionCount).toLocaleString()}</span>{' '}
            <span className="text-xs font-semibold text-blue-700">{isUrdu ? 'یونٹس' : 'units'}</span>
          </div>
          <div className="mt-2 text-[10px] text-blue-900/90 font-medium border-t border-blue-200/70 pt-1.5">
            {isUrdu ? 'زمین پر موجود اینٹ و ٹائل' : 'Ground stock summary'}
          </div>
        </div>

        {/* Card 2: Bricks Count */}
        <div className="bg-gradient-to-br from-amber-50 via-yellow-50/40 to-amber-100/40 border border-amber-300/80 border-t-4 border-t-amber-600 rounded-xl p-4 shadow-xs notranslate" translate="no">
          <div className="flex items-center justify-between text-amber-900 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
              {isUrdu ? 'کچی اینٹ تعداد' : 'Kacchi Bricks'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <Layers size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-950 font-mono leading-tight notranslate" translate="no">
            <span key={`kacchi-brk-${totalBricksCount}`}>{Number(totalBricksCount).toLocaleString()}</span>{' '}
            <span className="text-xs font-semibold text-amber-700">{isUrdu ? 'اینٹ' : 'bricks'}</span>
          </div>
          <div className="mt-2 text-[10px] text-amber-900/90 font-medium border-t border-amber-200/70 pt-1.5">
            {isUrdu ? 'معیاری سائز کچی اینٹ' : 'Standard clay bricks'}
          </div>
        </div>

        {/* Card 3: Tiles Count */}
        <div className="bg-gradient-to-br from-purple-50 via-indigo-50/40 to-purple-100/40 border border-purple-300/80 border-t-4 border-t-purple-600 rounded-xl p-4 shadow-xs notranslate" translate="no">
          <div className="flex items-center justify-between text-purple-900 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900">
              {isUrdu ? 'کچی ٹائل تعداد' : 'Kacchi Tiles'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-950 font-mono leading-tight notranslate" translate="no">
            <span key={`kacchi-til-${totalTilesCount}`}>{Number(totalTilesCount).toLocaleString()}</span>{' '}
            <span className="text-xs font-semibold text-purple-700">{isUrdu ? 'ٹائل' : 'tiles'}</span>
          </div>
          <div className="mt-2 text-[10px] text-purple-900/90 font-medium border-t border-purple-200/70 pt-1.5">
            {isUrdu ? 'چھت و فرش والی کچی ٹائل' : 'Roof & flooring tiles'}
          </div>
        </div>

        {/* Card 4: Total Wages Payable */}
        <div className="bg-gradient-to-br from-emerald-50 via-green-50/50 to-emerald-100/50 border border-emerald-300/80 border-t-4 border-t-emerald-600 rounded-xl p-4 shadow-xs notranslate" translate="no">
          <div className="flex items-center justify-between text-emerald-900 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
              {isUrdu ? 'کل پتھائی اجرت' : 'Total Pathai Wages'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Coins size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono leading-tight notranslate" translate="no">
            <span key={`kacchi-wages-${totalWagesPayable}`}>Rs. {Number(totalWagesPayable).toLocaleString()}</span>
          </div>
          <div className="mt-2 text-[10px] text-emerald-900 font-medium border-t border-emerald-200/70 pt-1.5">
            {isUrdu ? 'مزدوروں کی واجب الادا اجرت' : 'Wages payable'}
          </div>
        </div>

      </div>

      {/* FILTER & ACTIONS ROW */}
      <div className="bg-white rounded-xl shadow-xs p-3.5 sm:p-4 border border-[#E2E8F0] flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Left: Search & Category/Status Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search input */}
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={isUrdu ? 'پتھیر یا مزدور کا نام تلاش کریں...' : 'Search worker name...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
            />
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
              onClick={() => setCategoryFilter('Kacchi_Aent')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                categoryFilter === 'Kacchi_Aent' ? 'bg-white text-[#1D4ED8] shadow-xs' : 'text-slate-600 hover:text-slate-900'
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
              {isUrdu ? 'ادائیگی تمام' : 'Status: All'}
            </button>
            <button
              onClick={() => setStatusFilter('Paid')}
              className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'Paid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              {isUrdu ? 'ادا شدہ' : 'Paid'}
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

        {/* Right: Add Pathai Entry */}
        <div className="flex items-center gap-2 shrink-0 self-end xl:self-auto">
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
          >
            <PlusCircle size={15} className="shrink-0" />
            <span>{isUrdu ? '+ نیا اندراج (پتھائی)' : '+ Add Pathai Entry'}</span>
          </button>
        </div>
      </div>

      {/* STANDARDIZED DATA TABLE */}
      <div className="bg-white rounded-xl shadow-xs border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-bold text-[#475569] uppercase tracking-wider">
                <th className="py-3 px-4">{isUrdu ? 'تاریخ' : 'Date'}</th>
                <th className="py-3 px-4">{isUrdu ? 'پتھیر / مزدور' : 'Pathair / Worker'}</th>
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
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    {isUrdu ? 'اس فلٹر میں کوئی ریکارڈ موجود نہیں ہے' : 'No records found for the selected filter.'}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const isTile = rec.item_type === 'Tile';
                  const isPaid = (rec.status || 'Paid') === 'Paid';

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {rec.entry_date}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">
                        {getWorkerName(rec.employee_id)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isTile 
                            ? 'bg-purple-50 text-purple-700 border-purple-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {isTile ? (isUrdu ? 'ٹائل' : 'Tile') : (isUrdu ? 'کچی اینٹ' : 'Kacchi Aent')}
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
                  <td colSpan={3} className="py-3 px-4 text-slate-800">
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

      {/* ADD / EDIT MODAL USING CREATE PORTAL TO PREVENT CLIPPING */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 px-5 border-b border-[#E2E8F0] bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-[#1D4ED8]" />
                <h3 className="text-base font-bold text-[#0F172A]">
                  {editingId ? 'Edit Production Entry' : 'Add Production Entry'} (پتھائی اندراج)
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <form onSubmit={handleSaveRecord} className="flex-1 overflow-y-auto p-5 space-y-4">
              
              {/* Category Selector (Bricks vs Tiles) */}
              <div>
                <label className="text-xs font-semibold text-[#334155] block mb-1.5">
                  Category / مال کی قسم *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, item_type: 'Kacchi_Aent' })}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formData.item_type === 'Kacchi_Aent'
                        ? 'bg-[#1D4ED8] text-white border-[#1D4ED8] shadow-xs'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <Layers size={14} />
                    <span>کچی اینٹ (Kacchi Aent)</span>
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
                    <span>کچی ٹائل (Tile)</span>
                  </button>
                </div>
              </div>

              {/* Worker & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Worker / Pathair (پتھیر) *</label>
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

              {/* Quantity & Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Rate / 1000 (ریٹ فی ہزار) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="مثلاً 950"
                    value={formData.rate_per_thousand}
                    onChange={(e) => setFormData({ ...formData, rate_per_thousand: e.target.value.replace(/[^0-9.]/g, '') as any })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
              </div>

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

              {/* Total Wages Calculation display */}
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between">
                <span className="text-xs text-blue-900 font-semibold">{isUrdu ? 'کل اجرت رقم:' : 'Total Wages:'}</span>
                <span className="text-sm font-mono font-bold text-[#1D4ED8]">
                  Rs. {((Number(formData.quantity) / 1000.0) * Number(formData.rate_per_thousand)).toLocaleString()}
                </span>
              </div>

              {/* Modal Footer */}
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
                  <span>{editingId ? 'Update Entry' : 'Save Entry'}</span>
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
