import React, { useState, useEffect } from 'react';
import {
  bhattaService,
  SalesInvoice,
  Customer,
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
  Edit2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BhattaInvoiceModal } from '../../components/BhattaInvoiceModal';

export function SalesInvoiceBilling() {
  const [invoices, setInvoices] = useState<SalesInvoice[]>(bhattaService.getInvoices());
  const [customers, setCustomers] = useState<Customer[]>(bhattaService.getCustomers());
  const [searchTerm, setSearchTerm] = useState('');
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

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const invs = bhattaService.getInvoices();
    const custs = bhattaService.getCustomers();
    setInvoices(invs);
    setCustomers(custs);
    if (custs.length > 0 && !formData.customer_id) {
      setFormData(prev => ({ ...prev, customer_id: custs[0].id }));
    }
  };

  const handleCustomerSelect = (id: number) => {
    const cust = customers.find(c => c.id === id);
    setFormData(prev => ({
      ...prev,
      customer_id: id,
      destination_address: cust?.address || prev.destination_address,
    }));
  };

  const handleOpenCreate = () => {
    setEditingInvoiceId(null);
    setFormData({
      customer_id: customers[0]?.id || 1,
      invoice_date: new Date().toISOString().split('T')[0],
      item_type: 'Aent_Aval',
      quantity: 10000,
      rate_per_thousand: 14000,
      kiraya_freight: 5000,
      destination_address: customers[0]?.address || 'Burewala Construction Site',
      driver_name: 'Iqbal Hussain (Trolley # 4821)',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inv: SalesInvoice) => {
    setEditingInvoiceId(inv.id);
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
    if (editingInvoiceId) {
      const updatedInv = bhattaService.updateInvoice(editingInvoiceId, {
        customer_id: Number(formData.customer_id),
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
        customer_id: Number(formData.customer_id),
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

  const filteredInvoices = invoices.filter(inv =>
    inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.destination_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <FileText className="text-[#1D4ED8]" />
            Sales Billing & Branded Invoicing (سیلز بل و انوائس)
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Generate official Chand Bricks Supplierz (AMD) invoices with automatic stock deduction and PDF export
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle size={17} />
          Create Sales Invoice (نیا بل بنائیں)
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 via-green-50/50 to-emerald-100/50 border border-emerald-300/80 border-t-4 border-t-emerald-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-emerald-900 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Sales Invoiced (کل سیلز رقم)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            Rs. {totalBilledRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-900 font-medium mt-1">Total revenue generated from bills</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 via-indigo-50/40 to-blue-100/40 border border-blue-300/80 border-t-4 border-t-blue-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-blue-900 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Bricks Dispatched (سپلائی تعداد)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Layers size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-950 font-mono">
            {totalQuantitySold.toLocaleString()} <span className="text-xs font-semibold text-blue-700">bricks</span>
          </div>
          <p className="text-[11px] text-blue-900 font-medium mt-1">Delivered to construction sites</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 via-yellow-50/40 to-amber-100/40 border border-amber-300/80 border-t-4 border-t-amber-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-amber-900 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Bills Issued (جاری کردہ انوائس)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <FileText size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono">
            {filteredInvoices.length} <span className="text-xs font-semibold text-amber-700">بلز</span>
          </div>
          <p className="text-[11px] text-amber-900 font-medium mt-1">Recorded with full audit trail</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by invoice number, customer name or site..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-10 pr-4 py-2 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1D4ED8] focus:bg-white transition-all"
          />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] bg-[#0F172A] text-white">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#1D4ED8] flex items-center justify-center font-bold text-white text-xs">
                  AMD
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingInvoiceId ? 'Edit Sales Invoice (بل میں ترمیم کریں)' : 'Create Sales Invoice (چاند برکس نیا بل)'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitInvoice} className="p-6 space-y-4 text-[#0F172A]">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Select Customer (گاہک) *</label>
                  <select
                    required
                    value={formData.customer_id}
                    onChange={(e) => handleCustomerSelect(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.customer_name} ({c.phone || c.address})</option>
                    ))}
                  </select>
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
                    type="number"
                    step="500"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Rate / 1000 (ریٹ فی ہزار) *</label>
                  <input
                    type="number"
                    step="100"
                    required
                    value={formData.rate_per_thousand}
                    onChange={(e) => setFormData({ ...formData, rate_per_thousand: Number(e.target.value) })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Kiraya / Freight Charge (کرایہ - Rs.)</label>
                  <input
                    type="number"
                    value={formData.kiraya_freight}
                    onChange={(e) => setFormData({ ...formData, kiraya_freight: Number(e.target.value) })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Driver & Vehicle No (ڈرائیور / گاڑی)</label>
                  <input
                    type="text"
                    value={formData.driver_name}
                    onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                  />
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

    </div>
  );
}
