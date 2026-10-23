import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  bhattaService,
  MattiTrolleyRecord,
  FuelMasalaExpense,
} from '../../services/bhattaService';
import {
  Truck,
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
  Printer,
  Download,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function MattiFuelKhata() {
  const [activeTab, setActiveTab] = useState<'matti' | 'fuel'>('matti');
  const [mattiRecords, setMattiRecords] = useState<MattiTrolleyRecord[]>(bhattaService.getMattiRecords());
  const [fuelRecords, setFuelRecords] = useState<FuelMasalaExpense[]>(bhattaService.getFuelRecords());

  // Matti Modal & Edit State
  const [isMattiModalOpen, setIsMattiModalOpen] = useState(false);
  const [editingMattiId, setEditingMattiId] = useState<number | null>(null);
  const [mattiForm, setMattiForm] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    trolley_count: 5,
    rate_per_trolley: 2200,
    paid_amount: 11000,
    supplier_name: 'Akram Matti Supply',
    remarks: 'High quality chikni matti',
  });

  // Fuel Modal & Edit State
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [editingFuelId, setEditingFuelId] = useState<number | null>(null);
  const [fuelForm, setFuelForm] = useState({
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
    setMattiRecords(bhattaService.getMattiRecords());
    setFuelRecords(bhattaService.getFuelRecords());
  };

  const handleOpenAddMatti = () => {
    setEditingMattiId(null);
    setMattiForm({
      entry_date: new Date().toISOString().split('T')[0],
      trolley_count: 5,
      rate_per_trolley: 2200,
      paid_amount: 11000,
      supplier_name: 'Akram Matti Supply',
      remarks: 'High quality chikni matti',
    });
    setIsMattiModalOpen(true);
  };

  const handleOpenEditMatti = (rec: MattiTrolleyRecord) => {
    setEditingMattiId(rec.id);
    setMattiForm({
      entry_date: rec.entry_date,
      trolley_count: rec.trolley_count,
      rate_per_trolley: rec.rate_per_trolley,
      paid_amount: rec.paid_amount,
      supplier_name: rec.supplier_name,
      remarks: rec.remarks || '',
    });
    setIsMattiModalOpen(true);
  };

  const handleSaveMatti = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMattiId) {
      bhattaService.updateMattiRecord(editingMattiId, {
        entry_date: mattiForm.entry_date,
        trolley_count: Number(mattiForm.trolley_count),
        rate_per_trolley: Number(mattiForm.rate_per_trolley),
        paid_amount: Number(mattiForm.paid_amount),
        supplier_name: mattiForm.supplier_name,
        remarks: mattiForm.remarks,
      });
    } else {
      bhattaService.addMattiRecord({
        entry_date: mattiForm.entry_date,
        trolley_count: Number(mattiForm.trolley_count),
        rate_per_trolley: Number(mattiForm.rate_per_trolley),
        paid_amount: Number(mattiForm.paid_amount),
        supplier_name: mattiForm.supplier_name,
        remarks: mattiForm.remarks,
      });
    }
    setIsMattiModalOpen(false);
    refreshData();
  };

  const handleOpenAddFuel = () => {
    setEditingFuelId(null);
    setFuelForm({
      entry_date: new Date().toISOString().split('T')[0],
      item_type: 'Kuila',
      quantity: 100,
      unit_rate: 650,
      paid_amount: 65000,
      supplier_name: 'Balochistan Coal Traders',
      remarks: 'Burning coal bags / mounds',
    });
    setIsFuelModalOpen(true);
  };

  const handleOpenEditFuel = (rec: FuelMasalaExpense) => {
    setEditingFuelId(rec.id);
    setFuelForm({
      entry_date: rec.entry_date,
      item_type: rec.item_type,
      quantity: rec.quantity,
      unit_rate: rec.unit_rate,
      paid_amount: rec.paid_amount ?? rec.total_amount,
      supplier_name: rec.supplier_name,
      remarks: rec.remarks || '',
    });
    setIsFuelModalOpen(true);
  };

  const handleSaveFuel = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFuelId) {
      bhattaService.updateFuelRecord(editingFuelId, {
        entry_date: fuelForm.entry_date,
        item_type: fuelForm.item_type,
        quantity: Number(fuelForm.quantity),
        unit_rate: Number(fuelForm.unit_rate),
        paid_amount: Number(fuelForm.paid_amount),
        supplier_name: fuelForm.supplier_name,
        remarks: fuelForm.remarks,
      });
    } else {
      bhattaService.addFuelRecord({
        entry_date: fuelForm.entry_date,
        item_type: fuelForm.item_type,
        quantity: Number(fuelForm.quantity),
        unit_rate: Number(fuelForm.unit_rate),
        paid_amount: Number(fuelForm.paid_amount),
        supplier_name: fuelForm.supplier_name,
        remarks: fuelForm.remarks,
      });
    }
    setIsFuelModalOpen(false);
    refreshData();
  };

  const handleDeleteMatti = (id: number) => {
    if (window.confirm('Delete this matti record?')) {
      bhattaService.deleteMattiRecord(id);
      refreshData();
    }
  };

  const handleDeleteFuel = (id: number) => {
    if (window.confirm('Delete this fuel record?')) {
      bhattaService.deleteFuelRecord(id);
      refreshData();
    }
  };

  // Matti Totals
  const totalTrolleys = mattiRecords.reduce((sum, m) => sum + m.trolley_count, 0);
  const totalMattiAmount = mattiRecords.reduce((sum, m) => sum + m.total_amount, 0);
  const totalMattiPaid = mattiRecords.reduce((sum, m) => sum + m.paid_amount, 0);
  const totalMattiBalance = Math.max(0, totalMattiAmount - totalMattiPaid);

  // Fuel Totals
  const totalFuelQty = fuelRecords.reduce((sum, f) => sum + f.quantity, 0);
  const totalFuelAmount = fuelRecords.reduce((sum, f) => sum + f.total_amount, 0);
  const totalFuelPaid = fuelRecords.reduce((sum, f) => sum + (f.paid_amount ?? f.total_amount), 0);
  const totalFuelBalance = Math.max(0, totalFuelAmount - totalFuelPaid);

  // Download Matti PDF
  const handleDownloadMattiPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
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

      doc.setFillColor(241, 245, 249);
      doc.rect(10, 32, 277, 8, 'F');
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(29, 78, 216);
      doc.text('MATTI TROLLEY DELIVERIES & SUPPLIER LEDGER (مٹی ٹرالی کھاتہ)', 148.5, 37.5, { align: 'center' });

      const tableRows = mattiRecords.map(m => [
        m.entry_date,
        m.supplier_name || 'Direct Field',
        m.trolley_count.toLocaleString(),
        `Rs. ${m.rate_per_trolley.toLocaleString()}`,
        `Rs. ${m.total_amount.toLocaleString()}`,
        `Rs. ${m.paid_amount.toLocaleString()}`,
        `Rs. ${Math.max(0, m.total_amount - m.paid_amount).toLocaleString()}`,
        m.remarks || '-',
      ]);

      autoTable(doc, {
        startY: 44,
        head: [['Date', 'Supplier Name', 'Trolley Count', 'Rate / Trolley', 'Total Amount', 'Paid Amount', 'Balance (PKR)', 'Remarks']],
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
      doc.text(`Total Trolleys: ${totalTrolleys.toLocaleString()} | Total Matti Bill: Rs. ${totalMattiAmount.toLocaleString()} | Balance Payable: Rs. ${Math.max(0, totalMattiAmount - totalMattiPaid).toLocaleString()}`, 280, finalY + 10.5, { align: 'right' });

      doc.save(`Matti_Trolley_Khata_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error('PDF error', e);
      window.print();
    }
  };

  // Download Fuel PDF
  const handleDownloadFuelPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
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

      doc.setFillColor(241, 245, 249);
      doc.rect(10, 32, 277, 8, 'F');
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(29, 78, 216);
      doc.text('FUEL & BURNING MASALA EXPENSES LEDGER (کوئلہ، لکڑی، مصالحہ خریداری کھاتہ)', 148.5, 37.5, { align: 'center' });

      const tableRows = fuelRecords.map(f => [
        f.purchase_date,
        f.fuel_type.replace(/_/g, ' '),
        f.supplier_name || 'Vendor',
        `${f.quantity} ${f.unit}`,
        `Rs. ${f.rate_per_unit.toLocaleString()}`,
        `Rs. ${f.total_amount.toLocaleString()}`,
        f.payment_status,
        f.remarks || '-',
      ]);

      autoTable(doc, {
        startY: 44,
        head: [['Date', 'Fuel Item', 'Supplier Name', 'Quantity', 'Rate / Unit', 'Total Amount (PKR)', 'Status', 'Remarks']],
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
      doc.text(`Total Fuel & Burning Cost: Rs. ${totalFuelCost.toLocaleString()}`, 280, finalY + 10.5, { align: 'right' });

      doc.save(`Fuel_Masala_Khata_${new Date().toISOString().split('T')[0]}.pdf`);
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
            {activeTab === 'matti' ? (
              <>
                <Truck className="text-[#1D4ED8]" />
                Matti Trolley Khata (مٹی ٹرالی کھاتہ)
              </>
            ) : (
              <>
                <Flame className="text-[#D4A017]" />
                Fuel & Masala Khata (ایندھن و مصالحہ کھاتہ)
              </>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#F1F5F9] p-1 rounded-xl border border-[#CBD5E1] flex items-center">
            <button
              onClick={() => setActiveTab('matti')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'matti' ? 'bg-[#1D4ED8] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Truck size={14} />
              Matti Trolley Khata
            </button>
            <button
              onClick={() => setActiveTab('fuel')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'fuel' ? 'bg-[#1D4ED8] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Flame size={14} />
              Fuel & Masala Khata
            </button>
          </div>

          {activeTab === 'matti' ? (
            <button
              onClick={handleOpenAddMatti}
              className="flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle size={16} />
              Add Matti Trolley
            </button>
          ) : (
            <button
              onClick={handleOpenAddFuel}
              className="flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle size={16} />
              Add Fuel Purchase
            </button>
          )}
        </div>
      </div>

      {/* METRIC CARDS (SEPARATE FOR EACH TAB) */}
      {activeTab === 'matti' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Clay Trolleys */}
          <div className="bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-100/40 border border-amber-300/80 border-t-4 border-t-amber-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-amber-900 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Clay Trolleys (تعداد)</span>
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <Truck size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-950 font-mono">
              {totalTrolleys.toLocaleString()} <span className="text-xs font-semibold text-amber-700">trolleys</span>
            </div>
            <p className="text-[11px] text-amber-900 font-medium mt-1">Total Deliveries Recorded</p>
          </div>

          {/* Card 2: Total Amount */}
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50/40 to-blue-100/40 border border-blue-300/80 border-t-4 border-t-blue-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-blue-900 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Bill Amount (کل رقم)</span>
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Coins size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-blue-950 font-mono">
              Rs. {totalMattiAmount.toLocaleString()}
            </div>
            <p className="text-[11px] text-blue-900 font-medium mt-1">Total Matti Bill</p>
          </div>

          {/* Card 3: Paid Amount */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/40 to-emerald-100/40 border border-emerald-300/80 border-t-4 border-t-emerald-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-emerald-900 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Paid Amount (ادا شدہ رقم)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-950 font-mono">
              Rs. {totalMattiPaid.toLocaleString()}
            </div>
            <p className="text-[11px] text-emerald-900 font-medium mt-1">Paid to Suppliers</p>
          </div>

          {/* Card 4: Remaining Balance */}
          <div className="bg-gradient-to-br from-rose-50 via-red-50/50 to-rose-100/50 border border-rose-300/80 border-t-4 border-t-rose-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-rose-900 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Remaining Balance (باقی رقم / ادھار)</span>
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
                <AlertCircle size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-600 font-mono">
              Rs. {totalMattiBalance.toLocaleString()}
            </div>
            <p className="text-[11px] text-rose-800 font-bold mt-1">Payable Balance</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Fuel Card 1: Total Quantity */}
          <div className="bg-gradient-to-br from-orange-50 via-amber-50/40 to-orange-100/40 border border-orange-300/80 border-t-4 border-t-orange-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-orange-900 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Fuel Quantity (مقدار / بیگز)</span>
              <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center shadow-xs">
                <Flame size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-orange-950 font-mono">
              {totalFuelQty.toLocaleString()} <span className="text-xs font-semibold text-orange-700">units/bags</span>
            </div>
            <p className="text-[11px] text-orange-900 font-medium mt-1">Coal, Firewood & Husk</p>
          </div>

          {/* Fuel Card 2: Total Amount */}
          <div className="bg-gradient-to-br from-amber-50 via-yellow-50/40 to-amber-100/40 border border-amber-300/80 border-t-4 border-t-amber-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-amber-900 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Fuel Cost (کل رقم)</span>
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <Coins size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-950 font-mono">
              Rs. {totalFuelAmount.toLocaleString()}
            </div>
            <p className="text-[11px] text-amber-900 font-medium mt-1">Total Burning Expense</p>
          </div>

          {/* Fuel Card 3: Paid Amount */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/40 to-emerald-100/40 border border-emerald-300/80 border-t-4 border-t-emerald-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-emerald-900 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Paid Amount (ادا شدہ رقم)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-950 font-mono">
              Rs. {totalFuelPaid.toLocaleString()}
            </div>
            <p className="text-[11px] text-emerald-900 font-medium mt-1">Paid to Fuel Vendors</p>
          </div>

          {/* Fuel Card 4: Remaining Balance */}
          <div className="bg-gradient-to-br from-rose-50 via-red-50/50 to-rose-100/50 border border-rose-300/80 border-t-4 border-t-rose-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-rose-900 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Remaining Balance (باقی رقم / ادھار)</span>
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
                <AlertCircle size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-600 font-mono">
              Rs. {totalFuelBalance.toLocaleString()}
            </div>
            <p className="text-[11px] text-rose-800 font-bold mt-1">Payable to Fuel Vendors</p>
          </div>
        </div>
      )}

      {/* TAB 1: MATTI TROLLEY TABLE */}
      {activeTab === 'matti' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Truck size={16} className="text-[#1D4ED8]" />
              Matti Trolley Deliveries (مٹی ٹرالی کھاتہ اندراج)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4 text-right">Trolley Count (تعداد)</th>
                  <th className="py-3 px-4 text-right">Rate / Trolley (ریٹ)</th>
                  <th className="py-3 px-4 text-right">Total Amount (رقم)</th>
                  <th className="py-3 px-4 text-right">Paid Amount (ادا شدہ)</th>
                  <th className="py-3 px-4 text-right text-rose-600">Balance (بقایا)</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
                {mattiRecords.map((m) => (
                  <tr key={m.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 font-mono text-[#64748B]">{m.entry_date}</td>
                    <td className="py-3 px-4 font-semibold text-[#0F172A]">{m.supplier_name || 'Direct Field'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#0F172A]">{m.trolley_count}</td>
                    <td className="py-3 px-4 text-right font-mono text-[#64748B]">Rs. {m.rate_per_trolley.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#0F172A]">Rs. {m.total_amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono text-[#10B981]">Rs. {m.paid_amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                      Rs. {(m.total_amount - m.paid_amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-[#64748B]">{m.remarks || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditMatti(m)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-[#1D4ED8] transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteMatti(m.id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: FUEL & MASALA KHATA TABLE */}
      {activeTab === 'fuel' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Flame size={16} className="text-[#D4A017]" />
              Fuel & Masala Expenses (کوئلہ، لکڑی، مصالحہ خریداری)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Fuel Item Type (جنس)</th>
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4 text-right">Quantity (وزن / تعداد)</th>
                  <th className="py-3 px-4 text-right">Unit Rate (ریٹ)</th>
                  <th className="py-3 px-4 text-right text-[#D4A017] font-bold">Total Cost (کل رقم)</th>
                  <th className="py-3 px-4 text-right text-emerald-600 font-bold">Paid Amount (ادا شدہ)</th>
                  <th className="py-3 px-4 text-right text-rose-600 font-bold">Balance (بقایا)</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
                {fuelRecords.map((f) => {
                  const paid = f.paid_amount ?? f.total_amount;
                  const balance = Math.max(0, f.total_amount - paid);
                  return (
                    <tr key={f.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-4 font-mono text-[#64748B]">{f.entry_date}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          f.item_type === 'Kuila'
                            ? 'bg-slate-100 text-[#0F172A] border-slate-300'
                            : f.item_type === 'Lakri'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {f.item_type === 'Kuila' ? 'Kuila (کوئلہ)' : f.item_type === 'Lakri' ? 'Lakri (لکڑی)' : 'Masala/Bhura (مصالحہ/بھورہ)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">{f.supplier_name || 'Burewala Trader'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#0F172A]">{f.quantity.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono text-[#64748B]">Rs. {f.unit_rate.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#0F172A]">
                        Rs. {f.total_amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#10B981] font-semibold">
                        Rs. {paid.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                        Rs. {balance.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-[#64748B]">{f.remarks || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditFuel(f)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 text-[#D4A017] transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteFuel(f.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MATTI MODAL (PORTAL) */}
      {isMattiModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <Truck size={18} className="text-[#1D4ED8]" />
                {editingMattiId ? 'Edit Matti Trolley Entry (تبدیلی مٹی اندراج)' : 'Add Matti Trolley Entry (مٹی ٹرالی اندراج)'}
              </h3>
              <button onClick={() => setIsMattiModalOpen(false)} className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMatti} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#334155] block mb-1">Supplier / Tractor Owner (سپلائر نام) *</label>
                <input
                  type="text"
                  required
                  value={mattiForm.supplier_name}
                  onChange={(e) => setMattiForm({ ...mattiForm, supplier_name: e.target.value })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Date (تاریخ) *</label>
                  <input
                    type="date"
                    required
                    value={mattiForm.entry_date}
                    onChange={(e) => setMattiForm({ ...mattiForm, entry_date: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Trolley Count (تعداد ٹرالی) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="e.g. 5"
                    value={mattiForm.trolley_count}
                    onChange={(e) => setMattiForm({ ...mattiForm, trolley_count: e.target.value.replace(/[^0-9]/g, '') as any })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Rate / Trolley (ریٹ فی ٹرالی - Rs.) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="e.g. 2500"
                    value={mattiForm.rate_per_trolley}
                    onChange={(e) => setMattiForm({ ...mattiForm, rate_per_trolley: e.target.value.replace(/[^0-9.]/g, '') as any })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Paid Amount (ادا شدہ رقم) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="e.g. 12500"
                    value={mattiForm.paid_amount}
                    onChange={(e) => setMattiForm({ ...mattiForm, paid_amount: e.target.value.replace(/[^0-9.]/g, '') as any })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
              </div>

              {/* Live Calculation */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                <div className="flex justify-between items-center text-[#475569]">
                  <span>Total Amount ({mattiForm.trolley_count} &times; Rs.{mattiForm.rate_per_trolley}):</span>
                  <span className="font-mono font-bold text-[#0F172A]">Rs. {(mattiForm.trolley_count * mattiForm.rate_per_trolley).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-rose-600 font-bold mt-1.5 pt-1.5 border-t border-blue-200">
                  <span>Remaining Supplier Balance:</span>
                  <span className="font-mono">Rs. {Math.max(0, (mattiForm.trolley_count * mattiForm.rate_per_trolley) - mattiForm.paid_amount).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#334155] block mb-1">Remarks (نوٹ)</label>
                <input
                  type="text"
                  placeholder="e.g. Good chikni matti from canal bed"
                  value={mattiForm.remarks}
                  onChange={(e) => setMattiForm({ ...mattiForm, remarks: e.target.value })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsMattiModalOpen(false)}
                  className="px-4 py-2 bg-[#F1F5F9] text-[#475569] rounded-xl text-xs font-medium hover:bg-[#E2E8F0] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  {editingMattiId ? 'Update Matti Record' : 'Save Matti Record'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* FUEL MODAL (PORTAL) */}
      {isFuelModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <Flame size={18} className="text-[#D4A017]" />
                {editingFuelId ? 'Edit Fuel & Masala Purchase (تبدیلی ایندھن خریداری)' : 'Add Fuel & Masala Purchase (ایندھن خریداری)'}
              </h3>
              <button onClick={() => setIsFuelModalOpen(false)} className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFuel} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#334155] block mb-1">Fuel Item Type (جنس ایندھن) *</label>
                <select
                  value={fuelForm.item_type}
                  onChange={(e) => setFuelForm({ ...fuelForm, item_type: e.target.value as any })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                >
                  <option value="Kuila">Kuila / Coal (کوئلہ)</option>
                  <option value="Lakri">Lakri / Firewood (لکڑی)</option>
                  <option value="Masala_Bhura">Masala / Bhura / Husk (مصالحہ/بھورہ)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#334155] block mb-1">Supplier / Dealer Name (ڈیلر نام) *</label>
                <input
                  type="text"
                  required
                  value={fuelForm.supplier_name}
                  onChange={(e) => setFuelForm({ ...fuelForm, supplier_name: e.target.value })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Date (تاریخ) *</label>
                  <input
                    type="date"
                    required
                    value={fuelForm.entry_date}
                    onChange={(e) => setFuelForm({ ...fuelForm, entry_date: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Quantity (وزن / بیگز) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="e.g. 50"
                    value={fuelForm.quantity}
                    onChange={(e) => setFuelForm({ ...fuelForm, quantity: e.target.value.replace(/[^0-9.]/g, '') as any })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Unit Rate (ریٹ فی من / بیگ - Rs.) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="e.g. 1500"
                    value={fuelForm.unit_rate}
                    onChange={(e) => setFuelForm({ ...fuelForm, unit_rate: e.target.value.replace(/[^0-9.]/g, '') as any })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">Paid Amount (ادا شدہ رقم) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="e.g. 75000"
                    value={fuelForm.paid_amount}
                    onChange={(e) => setFuelForm({ ...fuelForm, paid_amount: e.target.value.replace(/[^0-9.]/g, '') as any })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1.5">
                <div className="flex justify-between items-center text-[#0F172A] font-bold">
                  <span>Total Purchase Cost ({fuelForm.quantity} &times; Rs.{fuelForm.unit_rate}):</span>
                  <span className="font-mono text-base text-[#D4A017]">Rs. {(fuelForm.quantity * fuelForm.unit_rate).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-rose-600 font-bold text-[11px] pt-1.5 border-t border-amber-200">
                  <span>Remaining Vendor Balance (بقایا ادھار):</span>
                  <span className="font-mono">Rs. {Math.max(0, (fuelForm.quantity * fuelForm.unit_rate) - fuelForm.paid_amount).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsFuelModalOpen(false)}
                  className="px-4 py-2 bg-[#F1F5F9] text-[#475569] rounded-xl text-xs font-medium hover:bg-[#E2E8F0] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  {editingFuelId ? 'Update Fuel Purchase' : 'Save Fuel Purchase'}
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
