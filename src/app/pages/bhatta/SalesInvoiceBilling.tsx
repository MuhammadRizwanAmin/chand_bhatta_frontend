import React, { useState, useEffect, useRef } from 'react';
import {
  bhattaService,
  SalesInvoice,
  Customer,
  DriverVehicle,
} from '../../services/bhattaService';
import {
  FileText,
  PlusCircle,
  Search,
  Calendar,
  Printer,
  Trash2,
  Receipt,
  Coins,
  TrendingUp,
  MapPin,
  CheckCircle2,
  X,
  Eye,
  Save,
  Layers,
  Download,
  Edit2,
  User,
  ChevronDown,
  Plus,
  Truck,
  Filter
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../services/api';
import { BhattaInvoiceModal } from '../../components/BhattaInvoiceModal';
import { DateRangeFilter, DateRange, getInitialTodayRange, isWithinDateRange } from '../../components/DateRangeFilter';
import { useLanguage } from '../../context/LanguageContext';

export function SalesInvoiceBilling() {
  const { isUrdu } = useLanguage();
  const [invoices, setInvoices] = useState<SalesInvoice[]>(() => bhattaService.getInvoices());
  const [customers, setCustomers] = useState<Customer[]>(() => bhattaService.getCustomers());
  const [driversVehicles, setDriversVehicles] = useState<DriverVehicle[]>(() => bhattaService.getDriversVehicles());
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>(getInitialTodayRange());

  const handleDateFilterChange = (range: DateRange) => {
    setDateRange(range);
  };
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<SalesInvoice | null>(null);

  // Invoice Modal Form (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    customer_id: customers[0]?.id || 1,
    invoice_date: new Date().toISOString().split('T')[0],
    item_type: 'Aent_Aval' as SalesInvoice['item_type'],
    quantity: 10000,
    rate_per_thousand: 14000,
    kiraya_freight: 5000,
    destination_address: 'Burewala Construction Site',
    driver_name: 'Iqbal Hussain (Trolley # 4821)',
  });

  // Customer Autocomplete / Searchable Input State
  const [customerInput, setCustomerInput] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Driver & Vehicle Autocomplete / Dropdown State
  const [showDriverDropdown, setShowDriverDropdown] = useState(false);
  const driverDropdownRef = useRef<HTMLDivElement>(null);

  // Quick Add Driver & Vehicle Modal State
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [newVehicleForm, setNewVehicleForm] = useState({
    driver_name: '',
    vehicle_no: '',
    vehicle_type: 'Tractor Trolley',
    phone: '',
  });

  // Inline Customer Creation Modal State
  const [showInlineCustomerModal, setShowInlineCustomerModal] = useState(false);
  const [inlineCustomerForm, setInlineCustomerForm] = useState({
    customer_name: '',
    phone: '',
    address: '',
    opening_balance: 0,
  });

  const handleSaveInlineCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineCustomerForm.customer_name.trim()) return;
    const newCust = bhattaService.saveCustomer({
      customer_name: inlineCustomerForm.customer_name.trim(),
      phone: inlineCustomerForm.phone.trim(),
      address: inlineCustomerForm.address.trim(),
      opening_balance: Number(inlineCustomerForm.opening_balance) || 0,
    });
    const updated = bhattaService.getCustomers();
    setCustomers(updated);
    setSelectedCustomerId(newCust.id);
    setCustomerInput(newCust.customer_name);
    if (newCust.address) {
      setFormData(prev => ({ ...prev, destination_address: newCust.address || prev.destination_address }));
    }
    setShowInlineCustomerModal(false);
    setInlineCustomerForm({ customer_name: '', phone: '', address: '', opening_balance: 0 });
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Close suggestion dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
      if (driverDropdownRef.current && !driverDropdownRef.current.contains(event.target as Node)) {
        setShowDriverDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const refreshData = () => {
    const invs = bhattaService.getInvoices();
    const custs = bhattaService.getCustomers();
    const dvList = bhattaService.getDriversVehicles();
    setInvoices(invs);
    setCustomers(custs);
    setDriversVehicles(dvList);

    // Also fetch API vehicles if available and merge
    api.get('/vehicles').then(res => {
      const apiVehicles = res.data?.data || res.data || [];
      if (Array.isArray(apiVehicles) && apiVehicles.length > 0) {
        apiVehicles.forEach((v: any) => {
          const vNo = v.plateNumber ? `${v.name || 'Vehicle'} #${v.plateNumber}` : (v.name || 'Vehicle');
          const dName = v.driver || 'Driver';
          if (!dvList.some(item => item.vehicle_no.toLowerCase() === vNo.toLowerCase())) {
            bhattaService.saveDriverVehicle({
              driver_name: dName,
              vehicle_no: vNo,
              vehicle_type: v.type || 'Tractor Trolley',
              phone: '',
            });
          }
        });
        setDriversVehicles(bhattaService.getDriversVehicles());
      }
    }).catch(() => {
      // offline/local mode fallback
    });

    if (custs.length > 0 && !formData.customer_id) {
      setFormData(prev => ({ ...prev, customer_id: custs[0].id }));
    }
  };

  const handleSelectDriverVehicle = (item: DriverVehicle) => {
    const formatted = `${item.driver_name} (${item.vehicle_no})`;
    setFormData(prev => ({ ...prev, driver_name: formatted }));
    setShowDriverDropdown(false);
  };

  const handleSaveNewVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicleForm.driver_name.trim() || !newVehicleForm.vehicle_no.trim()) {
      alert('براہ کرم ڈرائیور کا نام اور گاڑی نمبر درج کریں (Driver name and vehicle number are required)');
      return;
    }
    const created = bhattaService.saveDriverVehicle({
      driver_name: newVehicleForm.driver_name.trim(),
      vehicle_no: newVehicleForm.vehicle_no.trim(),
      vehicle_type: newVehicleForm.vehicle_type,
      phone: newVehicleForm.phone.trim(),
    });
    const updated = bhattaService.getDriversVehicles();
    setDriversVehicles(updated);
    const formatted = `${created.driver_name} (${created.vehicle_no})`;
    setFormData(prev => ({ ...prev, driver_name: formatted }));
    setShowAddVehicleModal(false);
    setShowDriverDropdown(false);
    setNewVehicleForm({ driver_name: '', vehicle_no: '', vehicle_type: 'Tractor Trolley', phone: '' });
  };

  const handleSelectCustomer = (cust: Customer) => {
    setCustomerInput(cust.customer_name);
    setSelectedCustomerId(cust.id);
    setFormData(prev => ({
      ...prev,
      customer_id: cust.id,
      destination_address: cust.address || prev.destination_address,
    }));
    setShowCustomerDropdown(false);
  };

  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerInput(value);
    setShowCustomerDropdown(true);

    const match = customers.find(c => c.customer_name.trim().toLowerCase() === value.trim().toLowerCase());
    if (match) {
      setSelectedCustomerId(match.id);
      setFormData(prev => ({
        ...prev,
        customer_id: match.id,
        destination_address: match.address || prev.destination_address,
      }));
    } else {
      setSelectedCustomerId(null);
    }
  };

  const handleOpenCreate = () => {
    setEditingInvoiceId(null);
    const defaultCust = customers[0];
    setCustomerInput(defaultCust ? defaultCust.customer_name : '');
    setSelectedCustomerId(defaultCust ? defaultCust.id : null);
    setShowCustomerDropdown(false);
    setFormData({
      customer_id: defaultCust?.id || 1,
      invoice_date: new Date().toISOString().split('T')[0],
      item_type: 'Aent_Aval',
      quantity: 10000,
      rate_per_thousand: 14000,
      kiraya_freight: 5000,
      destination_address: defaultCust?.address || 'Burewala Construction Site',
      driver_name: 'Iqbal Hussain (Trolley # 4821)',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inv: SalesInvoice) => {
    setEditingInvoiceId(inv.id);
    const cust = customers.find(c => c.id === inv.customer_id);
    const name = inv.customer_name || cust?.customer_name || '';
    setCustomerInput(name);
    setSelectedCustomerId(inv.customer_id);
    setShowCustomerDropdown(false);
    setFormData({
      customer_id: inv.customer_id,
      invoice_date: inv.invoice_date,
      item_type: inv.item_type,
      quantity: inv.quantity,
      rate_per_thousand: inv.rate_per_thousand,
      kiraya_freight: inv.kiraya_freight,
      destination_address: inv.destination_address,
      driver_name: inv.driver_name || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    const enteredName = customerInput.trim();
    if (!enteredName) {
      alert('براہ کرم گاہک کا نام درج کریں (Please enter customer name)');
      return;
    }

    // Determine final customer: match existing or create new customer in ledger
    let finalCustId = selectedCustomerId;
    let finalCustName = enteredName;

    const foundExisting = customers.find(c =>
      (finalCustId && c.id === finalCustId) ||
      c.customer_name.trim().toLowerCase() === enteredName.toLowerCase()
    );

    if (foundExisting) {
      finalCustId = foundExisting.id;
      finalCustName = foundExisting.customer_name;
    } else {
      // Create new customer automatically so they appear in Customer Ledger
      const newCust = bhattaService.saveCustomer({
        customer_name: enteredName,
        address: formData.destination_address || '',
        phone: '',
        opening_balance: 0,
      });
      finalCustId = newCust.id;
      finalCustName = newCust.customer_name;
    }

    if (editingInvoiceId) {
      const updatedInv = bhattaService.updateInvoice(editingInvoiceId, {
        customer_id: Number(finalCustId),
        customer_name: finalCustName,
        invoice_date: formData.invoice_date,
        item_type: formData.item_type,
        quantity: Number(formData.quantity),
        rate_per_thousand: Number(formData.rate_per_thousand),
        kiraya_freight: Number(formData.kiraya_freight),
        destination_address: formData.destination_address,
        driver_name: formData.driver_name,
      });
      setIsModalOpen(false);
      setEditingInvoiceId(null);
      refreshData();
      if (updatedInv) {
        setSelectedInvoiceForModal(updatedInv);
      }
    } else {
      const newInv = bhattaService.createSalesInvoice({
        customer_id: Number(finalCustId),
        customer_name: finalCustName,
        invoice_date: formData.invoice_date,
        item_type: formData.item_type,
        quantity: Number(formData.quantity),
        rate_per_thousand: Number(formData.rate_per_thousand),
        kiraya_freight: Number(formData.kiraya_freight),
        destination_address: formData.destination_address,
        driver_name: formData.driver_name,
      });
      setIsModalOpen(false);
      refreshData();
      setSelectedInvoiceForModal(newInv);
    }
  };

  const handleDeleteInvoice = (id: number) => {
    if (window.confirm('Delete this sales invoice? Stock deduction will remain.')) {
      bhattaService.deleteInvoice(id);
      refreshData();
    }
  };

  const isWithinDateFilter = (dateStr: string) => {
    if (!startDate && !endDate) return true;
    if (!dateStr) return false;
    if (startDate && dateStr < startDate) return false;
    if (endDate && dateStr > endDate) return false;
    return true;
  };

  const filteredCustomers = customers.filter(c => {
    const q = customerInput.trim().toLowerCase();
    if (!q) return true;
    return (
      c.customer_name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  const filteredDriversVehicles = driversVehicles.filter(dv => {
    const q = (formData.driver_name || '').trim().toLowerCase();
    if (!q) return true;
    return (
      dv.driver_name.toLowerCase().includes(q) ||
      dv.vehicle_no.toLowerCase().includes(q) ||
      (dv.vehicle_type && dv.vehicle_type.toLowerCase().includes(q)) ||
      (dv.phone && dv.phone.includes(q))
    );
  });

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.destination_address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = isWithinDateRange(inv.invoice_date, dateRange);
    return matchesSearch && matchesDate;
  });

  const totalBilledRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.net_total_amount, 0);
  const totalQuantitySold = filteredInvoices.reduce((sum, inv) => sum + inv.quantity, 0);

  const baseCalculated = (formData.quantity / 1000.0) * formData.rate_per_thousand;
  const netCalculated = baseCalculated + Number(formData.kiraya_freight || 0);

  const handleDownloadSalesInvoicesPDF = () => {
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
      doc.text('SALES INVOICES & DISPATCH AUDIT REPORT (سیلز لیجر کھاتہ)', 148.5, 37.5, { align: 'center' });

      const totalQty = filteredInvoices.reduce((sum, inv) => sum + inv.quantity, 0);
      const totalAmt = filteredInvoices.reduce((sum, inv) => sum + inv.net_total_amount, 0);

      const tableRows = filteredInvoices.map(inv => [
        inv.invoice_number,
        inv.invoice_date,
        inv.customer_name || 'Customer',
        inv.item_type.replace(/_/g, ' '),
        inv.quantity.toLocaleString(),
        `Rs. ${inv.rate_per_thousand.toLocaleString()}`,
        `Rs. ${inv.kiraya_freight.toLocaleString()}`,
        `Rs. ${inv.net_total_amount.toLocaleString()}`,
      ]);

      autoTable(doc, {
        startY: 44,
        head: [['Invoice #', 'Date', 'Customer Name', 'Item Type', 'Quantity', 'Rate / 1k', 'Kiraya (+/-)', 'Net Total (PKR)']],
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
      doc.text(`Total Bricks: ${totalQty.toLocaleString()} units  |  Total Sales Value: Rs. ${totalAmt.toLocaleString()}`, 280, finalY + 10.5, { align: 'right' });

      doc.save(`Sales_Invoices_Report_${new Date().toISOString().split('T')[0]}.pdf`);
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
            <FileText className="text-[#1D4ED8] shrink-0" size={24} />
            <span>{isUrdu ? 'سیلز بلنگ (Sales & Billing)' : 'Sales & Billing (سیلز بلنگ)'}</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            {isUrdu ? 'خودکار اسٹاک کٹوتی اور پی ڈی ایف کے ساتھ سیلز انوائس بنائیں' : 'Generate official Chand Bricks Supplierz invoices with automatic stock deduction and PDF export'}
          </p>
        </div>

        {/* Global Date Filter & Create Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="shrink-0 max-w-full">
            <DateRangeFilter onChange={handleDateFilterChange} />
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
          >
            <PlusCircle size={15} className="shrink-0" />
            <span>{isUrdu ? '+ نیا بل بنائیں' : '+ Create Sales Invoice'}</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 via-green-50/50 to-emerald-100/50 border border-emerald-300/80 border-t-4 border-t-emerald-600 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-900 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Sales Invoiced (کل سیلز رقم)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <TrendingUp size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono leading-tight">
            Rs. {totalBilledRevenue.toLocaleString()}
          </div>
          <p className="text-[10px] text-emerald-900 font-medium mt-1">Total revenue generated from bills</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 via-indigo-50/40 to-blue-100/40 border border-blue-300/80 border-t-4 border-t-blue-600 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-blue-900 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Bricks Dispatched (سپلائی تعداد)</span>
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Layers size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-950 font-mono leading-tight">
            {totalQuantitySold.toLocaleString()} <span className="text-xs font-semibold text-blue-700">bricks</span>
          </div>
          <p className="text-[10px] text-blue-900 font-medium mt-1">Delivered to construction sites</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 via-yellow-50/40 to-amber-100/40 border border-amber-300/80 border-t-4 border-t-amber-500 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-900 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Bills Issued (جاری کردہ انوائس)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <FileText size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono leading-tight">
            {filteredInvoices.length} <span className="text-xs font-semibold text-amber-700">بلز</span>
          </div>
          <p className="text-[10px] text-amber-900 font-medium mt-1">Recorded with full audit trail</p>
        </div>
      </div>

      {/* Search Input & Action Bar */}
      <div className="bg-white rounded-xl shadow-xs p-4 border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search by invoice number, customer name or site..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs text-[#0F172A] bg-slate-50 focus:bg-white focus:outline-none focus:border-[#1D4ED8]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSalesInvoicesPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-300 text-slate-700 bg-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Download size={14} className="text-[#1D4ED8]" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-300 text-slate-700 bg-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Printer size={14} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Item Type</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4 text-right">Rate / 1000</th>
                <th className="py-3 px-4 text-right">Kiraya (+/-)</th>
                <th className="py-3 px-4 text-right bg-blue-50/50 text-[#1D4ED8] font-bold">Net Total</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-[#0F172A]">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No sales invoices found matching your search.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1D4ED8]">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {inv.invoice_date}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                      <div>{inv.customer_name}</div>
                      <span className="text-[10px] text-slate-400 truncate block max-w-xs">{inv.destination_address}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {inv.item_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0F172A]">
                      {inv.quantity.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      Rs. {inv.rate_per_thousand.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-amber-700">
                      Rs. {inv.kiraya_freight.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 text-sm bg-blue-50/30">
                      Rs. {inv.net_total_amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedInvoiceForModal(inv)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] font-semibold text-[11px] transition-colors cursor-pointer border border-blue-200/60"
                          title="View & Download Branded PDF Bill"
                        >
                          <Eye size={13} />
                          Bill
                        </button>
                        <button
                          onClick={() => handleOpenEdit(inv)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-[11px] transition-colors cursor-pointer border border-amber-200/60"
                          title="Edit Invoice (بل میں ترمیم کریں)"
                        >
                          <Edit2 size={13} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="p-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Invoice"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT SALES INVOICE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-xl shadow-2xl my-auto flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E2E8F0] bg-[#0F172A] text-white shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#1D4ED8] flex items-center justify-center font-bold text-white text-xs">
                  AMD
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingInvoiceId ? 'Edit Sales Invoice (بل میں ترمیم کریں)' : 'Create Sales Invoice (چاند برکس نیا بل)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitInvoice} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-5 sm:p-6 space-y-4 text-[#0F172A] overflow-y-auto flex-1">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Searchable / Free text customer input with suggestions */}
                  <div className="relative" ref={customerDropdownRef}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Customer Name (گاہک کا نام) *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setInlineCustomerForm({
                            customer_name: customerInput.trim(),
                            phone: '',
                            address: '',
                            opening_balance: 0,
                          });
                          setShowInlineCustomerModal(true);
                        }}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors"
                      >
                        <Plus size={12} />
                        <span>+ نیا گاہک بنائیں (New)</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={customerInput}
                        onChange={handleCustomerInputChange}
                        onFocus={() => setShowCustomerDropdown(true)}
                        placeholder="گاہک کا نام لکھیں یا تلاش کریں..."
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-3 pr-8 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:bg-white placeholder:text-slate-400 font-medium"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCustomerDropdown(prev => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer transition-colors"
                        title="گاہکوں کی فہرست دیکھیں"
                      >
                        <ChevronDown
                          size={15}
                          className={`transition-transform duration-200 ${showCustomerDropdown ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>

                    {/* Customer Suggestion Dropdown */}
                    {showCustomerDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto z-50 divide-y divide-slate-100">
                        <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                          <span>موجودہ گاہکوں کی تجاویز (Suggestions)</span>
                          <span className="text-slate-400 font-mono">{filteredCustomers.length} گاہک</span>
                        </div>

                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map(c => {
                            const isSelected = c.id === selectedCustomerId;
                            return (
                              <div
                                key={c.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSelectCustomer(c);
                                }}
                                className={`p-2.5 hover:bg-blue-50/80 transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                                  isSelected ? 'bg-blue-50/90 text-blue-900 font-medium' : 'text-slate-800'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                                    <User size={13} className="text-blue-600 shrink-0" />
                                    <span className="truncate">{c.customer_name}</span>
                                  </div>
                                  {(c.phone || c.address) && (
                                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 truncate">
                                      {c.phone && <span className="font-mono">{c.phone}</span>}
                                      {c.phone && c.address && <span>•</span>}
                                      {c.address && <span className="truncate">{c.address}</span>}
                                    </div>
                                  )}
                                </div>
                                {isSelected && (
                                  <span className="shrink-0 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 bg-blue-100/70 rounded">
                                    منتخب شدہ
                                  </span>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-3 text-center text-xs text-slate-500">
                            کوئی موجودہ گاہک نہیں ملا
                          </div>
                        )}

                        {/* Quick create as new customer option */}
                        {customerInput.trim() && !customers.some(c => c.customer_name.trim().toLowerCase() === customerInput.trim().toLowerCase()) && (
                          <div
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSelectedCustomerId(null);
                              setShowCustomerDropdown(false);
                            }}
                            className="p-2.5 bg-blue-50/60 hover:bg-blue-100/80 border-t border-blue-200 transition-colors cursor-pointer flex items-center gap-2 text-xs font-semibold text-blue-900"
                          >
                            <Plus size={14} className="text-blue-600 shrink-0" />
                            <div className="min-w-0">
                              <div>نیا گاہک درج کریں: <strong>"{customerInput.trim()}"</strong></div>
                              <div className="text-[10px] text-blue-700 font-normal">خودکار طریقے سے کسٹمر کھاتہ میں شامل ہو جائے گا</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Invoice Date (تاریخ) *</label>
                    <input
                      type="date"
                      required
                      value={formData.invoice_date}
                      onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Item Type (جنس) *</label>
                    <select
                      value={formData.item_type}
                      onChange={(e) => setFormData({ ...formData, item_type: e.target.value as any })}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                    >
                      <option value="Aent_Aval">Aent Aval (اول اینٹ)</option>
                      <option value="Aent_Doem">Aent Doem (دوئم اینٹ)</option>
                      <option value="Aent_Soyem">Aent Soyem (سوئم اینٹ)</option>
                      <option value="Tile">Tile (ٹائل)</option>
                      <option value="Kacchi_Aent">Kacchi Aent (کچی اینٹ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Quantity (تعداد) *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="مثلاً 5000"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value.replace(/[^0-9]/g, '') as any })}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Rate / 1000 (ریٹ فی ہزار) *</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      placeholder="مثلاً 12000"
                      value={formData.rate_per_thousand}
                      onChange={(e) => setFormData({ ...formData, rate_per_thousand: e.target.value.replace(/[^0-9.]/g, '') as any })}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Kiraya / Freight Charge (کرایہ - Rs.)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={formData.kiraya_freight}
                      onChange={(e) => setFormData({ ...formData, kiraya_freight: e.target.value.replace(/[^0-9.]/g, '') as any })}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                    />
                  </div>
                  <div className="relative" ref={driverDropdownRef}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Driver & Vehicle No (ڈرائیور / گاڑی)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAddVehicleModal(true)}
                        className="text-[10px] text-blue-700 font-semibold hover:text-blue-900 hover:underline flex items-center gap-0.5 cursor-pointer"
                        title="نیا ڈرائیور یا گاڑی لسٹ میں شامل کریں"
                      >
                        <Plus size={11} />
                        <span>نیا شامل کریں</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={formData.driver_name}
                        onChange={(e) => {
                          setFormData({ ...formData, driver_name: e.target.value });
                          setShowDriverDropdown(true);
                        }}
                        onFocus={() => setShowDriverDropdown(true)}
                        placeholder="ڈرائیور یا گاڑی منتخب کریں یا لکھیں..."
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-3 pr-8 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:bg-white placeholder:text-slate-400 font-medium"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDriverDropdown(prev => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer transition-colors"
                        title="گاڑیوں و ڈرائیوروں کی لسٹ دیکھیں"
                      >
                        <ChevronDown
                          size={15}
                          className={`transition-transform duration-200 ${showDriverDropdown ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>

                    {/* Driver & Vehicle Suggestions Dropdown */}
                    {showDriverDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-52 overflow-y-auto z-50 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                          <span>ڈرائیور و گاڑیوں کی فہرست ({filteredDriversVehicles.length})</span>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setShowDriverDropdown(false);
                              setShowAddVehicleModal(true);
                            }}
                            className="text-blue-600 font-semibold hover:underline cursor-pointer"
                          >
                            + نیا شامل کریں
                          </button>
                        </div>

                        {filteredDriversVehicles.length > 0 ? (
                          filteredDriversVehicles.map(dv => {
                            const formatted = `${dv.driver_name} (${dv.vehicle_no})`;
                            const isSelected = formData.driver_name === formatted;
                            return (
                              <div
                                key={dv.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSelectDriverVehicle(dv);
                                }}
                                className={`p-2.5 hover:bg-blue-50/80 transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                                  isSelected ? 'bg-blue-50/90 text-blue-900 font-medium' : 'text-slate-800'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                                    <Truck size={13} className="text-blue-600 shrink-0" />
                                    <span className="truncate">{dv.driver_name}</span>
                                    <span className="text-slate-500 font-normal font-mono text-[11px] truncate">({dv.vehicle_no})</span>
                                  </div>
                                  {(dv.vehicle_type || dv.phone) && (
                                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 truncate">
                                      {dv.vehicle_type && <span className="bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">{dv.vehicle_type}</span>}
                                      {dv.phone && <span className="font-mono">{dv.phone}</span>}
                                    </div>
                                  )}
                                </div>
                                {isSelected && (
                                  <span className="shrink-0 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 bg-blue-100/70 rounded">
                                    منتخب شدہ
                                  </span>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-3 text-center text-xs text-slate-500">
                            کوئی ڈرائیور یا گاڑی نہیں ملی
                          </div>
                        )}

                        {/* Quick option to use typed custom driver/vehicle */}
                        {formData.driver_name?.trim() && !driversVehicles.some(dv => `${dv.driver_name} (${dv.vehicle_no})`.toLowerCase() === formData.driver_name.trim().toLowerCase()) && (
                          <div
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setShowDriverDropdown(false);
                            }}
                            className="p-2.5 bg-blue-50/60 hover:bg-blue-100/80 border-t border-blue-200 transition-colors cursor-pointer flex items-center gap-2 text-xs font-semibold text-blue-900"
                          >
                            <Plus size={14} className="text-blue-600 shrink-0" />
                            <div className="min-w-0">
                              <div>استعمال کریں: <strong>"{formData.driver_name.trim()}"</strong></div>
                              <div className="text-[10px] text-blue-700 font-normal">یہ ڈرائیور و گاڑی خودکار طریقے سے لسٹ میں شامل ہو جائے گی</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Delivery Destination Site (پتہ برائے ترسیل)</label>
                  <input
                    type="text"
                    value={formData.destination_address}
                    onChange={(e) => setFormData({ ...formData, destination_address: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                  />
                </div>

                {/* Real-time Net Total Box */}
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs space-y-1.5 text-blue-950">
                  <div className="flex justify-between text-slate-700">
                    <span>Base Brick Amount ({formData.quantity.toLocaleString()} @ Rs.{formData.rate_per_thousand.toLocaleString()}/1000):</span>
                    <span className="font-mono font-medium">Rs. {baseCalculated.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Kiraya / Freight (کرایہ):</span>
                    <span className="font-mono text-amber-800 font-medium">+ Rs. {Number(formData.kiraya_freight || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#0F172A] font-bold text-sm pt-2 border-t border-blue-200">
                    <span>Net Total Amount (کل رقم):</span>
                    <span className="font-mono text-[#1D4ED8] text-base">Rs. {netCalculated.toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 flex items-center gap-1 mt-1 font-medium">
                    <CheckCircle2 size={12} />
                    <span>Automatic stock deduction of {formData.quantity.toLocaleString()} units upon saving.</span>
                  </div>
                </div>

              </div>

              {/* Fixed Footer Buttons */}
              <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-[#E2E8F0] bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <Save size={15} />
                  {editingInvoiceId ? 'Update Invoice & View Bill (انوائس اپڈیٹ کریں)' : 'Generate Invoice & View Bill'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Branded Official PDF / Print Invoice Modal */}
      <BhattaInvoiceModal
        invoice={selectedInvoiceForModal}
        onClose={() => setSelectedInvoiceForModal(null)}
      />

      {/* QUICK ADD DRIVER & VEHICLE MODAL */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-4 py-3 bg-[#0F172A] text-white">
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-blue-400" />
                <h4 className="text-sm font-bold text-white">نیا ڈرائیور / گاڑی شامل کریں</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddVehicleModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveNewVehicle} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Driver Name (ڈرائیور کا نام) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: Iqbal Hussain"
                  value={newVehicleForm.driver_name}
                  onChange={(e) => setNewVehicleForm({ ...newVehicleForm, driver_name: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Vehicle / Trolley No (گاڑی / ٹرالی نمبر) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: Trolley # 4821 یا Truck LE-1234"
                  value={newVehicleForm.vehicle_no}
                  onChange={(e) => setNewVehicleForm({ ...newVehicleForm, vehicle_no: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Vehicle Type (قسم)</label>
                  <select
                    value={newVehicleForm.vehicle_type}
                    onChange={(e) => setNewVehicleForm({ ...newVehicleForm, vehicle_type: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-2.5 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="Tractor Trolley">Tractor Trolley (ٹریکٹر ٹرالی)</option>
                    <option value="Truck">Truck (ٹرک)</option>
                    <option value="Mazda">Mazda (مزدا)</option>
                    <option value="Shahzore">Shahzore (شہزور)</option>
                    <option value="Other">Other (دیگر)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone (موبائل نمبر)</label>
                  <input
                    type="text"
                    placeholder="0300-1234567"
                    value={newVehicleForm.phone}
                    onChange={(e) => setNewVehicleForm({ ...newVehicleForm, phone: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer transition-colors"
                >
                  منسوخ کریں
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer transition-colors shadow-sm"
                >
                  محفوظ کریں (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK INLINE CREATE CUSTOMER MODAL */}
      {showInlineCustomerModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 px-5 border-b border-slate-200 bg-[#0F172A] text-white">
              <div className="flex items-center gap-2">
                <User size={18} className="text-[#1D4ED8]" />
                <h3 className="font-bold text-sm text-white">
                  Add New Customer Profile (نیا گاہک بنائیں)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInlineCustomerModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveInlineCustomer} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Customer / Contractor Name (گاہک یا ٹھیکیدار کا نام) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: ملک ارشد بلڈر، حاجی اسلم وغیرہ"
                  value={inlineCustomerForm.customer_name}
                  onChange={(e) => setInlineCustomerForm({ ...inlineCustomerForm, customer_name: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Phone Number (موبائل نمبر)
                </label>
                <input
                  type="text"
                  placeholder="0300-1234567"
                  value={inlineCustomerForm.phone}
                  onChange={(e) => setInlineCustomerForm({ ...inlineCustomerForm, phone: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Site / Delivery Address (تعمیراتی سائٹ یا پتہ)
                </label>
                <input
                  type="text"
                  placeholder="مثلاً: چیچہ وطنی بائی پاس، بوریوالا"
                  value={inlineCustomerForm.address}
                  onChange={(e) => setInlineCustomerForm({ ...inlineCustomerForm, address: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Opening Balance / سابقہ بقایا ادھار (PKR)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={inlineCustomerForm.opening_balance}
                  onChange={(e) => setInlineCustomerForm({ ...inlineCustomerForm, opening_balance: Number(e.target.value) })}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInlineCustomerModal(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer transition-colors"
                >
                  منسوخ کریں
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer transition-colors shadow-sm"
                >
                  محفوظ کریں اور منتخب کریں (Save & Select)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
