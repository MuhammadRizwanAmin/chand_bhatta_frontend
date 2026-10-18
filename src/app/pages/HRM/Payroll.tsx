import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { hrmService } from '@/app/services/hrmService';
import { staffService } from '@/app/services/staffService';
import { DataTable } from '@/app/components/DataTable';
import { toast } from 'sonner';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Download, FileText, Eye, Filter, MoreHorizontal, CreditCard, Edit, Trash2 } from 'lucide-react';
import api from '@/app/services/api';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { PayslipModal } from './PayslipModal';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function Payroll() {
  const [payrolls, setPayrolls] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [banks, setBanks] = useState([]);
  const [paymentModal, setPaymentModal] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({ payment_type: 'cash', bankId: '', date_for: new Date().toISOString().split('T')[0] });

  // ─── Filters ───────────────────────────────────────────────────────────
  const getPrevMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return (d.getMonth() + 1).toString();
  };
  const getPrevYear = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.getFullYear().toString();
  };

  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({ userId: '', month: getPrevMonth(), year: getPrevYear(), bonuses: 0 });
  const [editData, setEditData] = useState<{id: number, bonuses: number, status: string} | null>(null);

  // ─── Payslip Modal ─────────────────────────────────────────────────────
  const [viewPayslip, setViewPayslip] = useState<any>(null);

  useEffect(() => {
    fetchPayrolls();
    fetchStaff();
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const res = await api.get('/banks');
      setBanks(res.data?.data || res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPayrolls = async () => {
    try {
      const res = await hrmService.getPayrolls();
      if (res.success) setPayrolls(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await staffService.getStaffList();
      if (res && res.users) setStaffList(res.users);
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await hrmService.updatePayrollStatus(id, status);
      fetchPayrolls();
    } catch (err) {
      console.error(err);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await hrmService.generatePayroll(formData);
      if (res.success) {
        toast.success("Payroll generated successfully");
        setShowForm(false);
        fetchPayrolls();
        setFormData({ userId: '', month: '', year: '', bonuses: 0 });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to generate payroll");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payroll?')) return;
    try {
      const res = await hrmService.deletePayroll(id);
      if (res.success) {
        toast.success("Payroll deleted successfully");
        fetchPayrolls();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete payroll");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData) return;
    try {
      await hrmService.updatePayroll(editData.id, { bonuses: editData.bonuses });
      await hrmService.updatePayrollStatus(editData.id, editData.status);
      toast.success("Payroll updated successfully");
      setEditData(null);
      fetchPayrolls();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to update payroll");
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModal) return;
    try {
      const payload = {
        title: `Payroll Payment for ${paymentModal.user?.fullName}`,
        price: paymentModal.netPay,
        date_for: paymentForm.date_for,
        payment_type: paymentForm.payment_type,
        bankId: paymentForm.bankId || undefined,
        expense_made_by: paymentModal.userId || 1,
        payrollId: paymentModal.id
      };
      await api.post('/expenses', payload);
      toast.success("Payment added successfully");
      setPaymentModal(null);
      fetchPayrolls();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to add payment");
    }
  };

  // ─── Filtered Data ─────────────────────────────────────────────────────
  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((p: any) => {
      if (filterMonth !== 'all' && String(p.month) !== filterMonth) return false;
      if (filterYear !== 'all' && String(p.year) !== filterYear) return false;
      if (filterStatus !== 'all' && (p.status || '').toLowerCase() !== filterStatus.toLowerCase()) return false;
      return true;
    });
  }, [payrolls, filterMonth, filterYear, filterStatus]);

  // ─── Export Helpers ────────────────────────────────────────────────────
  const getExportData = () => {
    return filteredPayrolls.map((p: any) => ({
      Employee: p.user?.fullName || '—',
      Month: monthNames[(Number(p.month) || 1) - 1] || p.month,
      Year: p.year,
      'Basic Salary': Number(p.basicSalary || 0),
      Deductions: Number(p.deductions || 0),
      Bonuses: Number(p.bonuses || 0),
      'Net Pay': Number(p.netPay || 0),
      Status: p.status || 'Unpaid',
    }));
  };

  const exportToExcel = () => {
    const data = getExportData();
    if (data.length === 0) { toast.error('No data to export'); return; }
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll');
    const monthLabel = filterMonth === 'all' ? 'All' : monthNames[Number(filterMonth) - 1];
    const yearLabel = filterYear === 'all' ? 'All' : filterYear;
    XLSX.writeFile(workbook, `Payroll_${monthLabel}_${yearLabel}.xlsx`);
    toast.success('Excel exported successfully');
  };

  const exportToPDF = () => {
    const data = getExportData();
    if (data.length === 0) { toast.error('No data to export'); return; }
    const doc = new jsPDF();
    const monthLabel = filterMonth === 'all' ? 'All Months' : monthNames[Number(filterMonth) - 1];
    const yearLabel = filterYear === 'all' ? 'All Years' : filterYear;

    doc.setFontSize(16);
    doc.text(`Payroll Report — ${monthLabel} ${yearLabel}`, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 28);

    const columns = [
      { header: 'Employee', dataKey: 'Employee' },
      { header: 'Month', dataKey: 'Month' },
      { header: 'Year', dataKey: 'Year' },
      { header: 'Basic Salary', dataKey: 'Basic Salary' },
      { header: 'Deductions', dataKey: 'Deductions' },
      { header: 'Bonuses', dataKey: 'Bonuses' },
      { header: 'Net Pay', dataKey: 'Net Pay' },
      { header: 'Status', dataKey: 'Status' },
    ];

    (doc as any).autoTable({
      startY: 34,
      head: [columns.map(c => c.header)],
      body: data.map(row => columns.map(c => row[c.dataKey as keyof typeof row])),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
      },
    });

    doc.save(`Payroll_${monthLabel.replace(/\s/g, '_')}_${yearLabel}.pdf`);
    toast.success('PDF exported successfully');
  };

  // ─── Available years from data ─────────────────────────────────────────
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear + 1; i++) years.add(String(i));
    payrolls.forEach((p: any) => { if (p.year) years.add(String(p.year)); });
    return Array.from(years).sort();
  }, [payrolls]);

  // ─── Table ─────────────────────────────────────────────────────────────
  const btnClass = 'w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer outline-none';

  const renderActions = (item: any) => {
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors outline-none cursor-pointer">
            <MoreHorizontal size={18} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={5} className="bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-[9999] min-w-[180px]">
            <DropdownMenu.Item 
              className={btnClass} 
              onSelect={() => setPaymentModal(item)} 
              disabled={item.status === 'Paid'}
            >
              <CreditCard size={16} /> Add Payment
            </DropdownMenu.Item>
            <DropdownMenu.Item 
              className={btnClass} 
              onSelect={() => setViewPayslip(item)}
            >
              <Eye size={16} /> View Slip
            </DropdownMenu.Item>
            <DropdownMenu.Item 
              className={btnClass} 
              onSelect={() => setEditData({ id: item.id, bonuses: item.bonuses, status: item.status })}
            >
              <Edit size={16} /> Edit
            </DropdownMenu.Item>
            <DropdownMenu.Item 
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer outline-none"
              onSelect={() => handleDelete(item.id)}
            >
              <Trash2 size={16} /> Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  };

  const renderStatus = (item: any) => {
    const isPaid = (item.status || '').toLowerCase() === 'paid';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        isPaid
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-amber-100 text-amber-700'
      }`}>
        {item.status || 'Unpaid'}
      </span>
    );
  };

  const renderMoney = (key: string) => (item: any) => {
    const val = Number(item[key] || 0);
    return <span className="font-mono text-sm">{val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>;
  };

  const columns = [
    { header: 'Employee', cell: (item: any) => <span className="font-medium text-gray-900">{item.user?.fullName}</span> },
    { header: 'Month', cell: (item: any) => monthNames[(Number(item.month) || 1) - 1] || item.month },
    { accessorKey: 'year' as any, header: 'Year' },
    { header: 'Basic Salary', cell: renderMoney('basicSalary') },
    { header: 'Deductions', cell: renderMoney('deductions') },
    { header: 'Bonuses', cell: renderMoney('bonuses') },
    { header: 'Net Pay', cell: (item: any) => <span className="font-mono text-sm font-bold text-emerald-700">{Number(item.netPay || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span> },
    { header: 'Status', cell: renderStatus },
    { header: 'Actions', cell: renderActions },
  ];

  return (
    <>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel} title="Export to Excel">
            <Download size={14} className="mr-1" /> Excel
          </Button>
          <Button variant="outline" onClick={exportToPDF} title="Export to PDF">
            <FileText size={14} className="mr-1" /> PDF
          </Button>
          <Button variant="outline" onClick={fetchPayrolls}>Refresh</Button>
          <Button onClick={() => setShowForm(true)}>Generate Payroll</Button>
        </div>
      </div>

      {/* ─── Filter Bar ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
          <Filter size={14} /> Filters:
        </div>

        {/* Month Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500">Month</label>
          <select
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          >
            <option value="all">All Months</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{monthNames[m - 1]}</option>
            ))}
          </select>
        </div>

        {/* Year Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500">Year</label>
          <select
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
          >
            <option value="all">All Years</option>
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500">Status</label>
          <div className="bg-gray-100 p-0.5 rounded-lg flex">
            {['all', 'Paid', 'Unpaid'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  filterStatus === s
                    ? 'bg-white text-[#1D4ED8] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Result Count */}
        <div className="ml-auto text-xs text-gray-400">
          {filteredPayrolls.length} of {payrolls.length} records
        </div>
      </div>

      {/* ─── Generate Payroll Dialog ──────────────────────────────────── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Generate Payroll</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Employee</label>
              <Select
                options={[
                  { value: 'all', label: 'All Employees' },
                  ...staffList.map((s: any) => ({ value: String(s.id), label: s.fullName }))
                ]}
                value={
                  formData.userId === 'all' 
                    ? { value: 'all', label: 'All Employees' }
                    : staffList.filter((s: any) => String(s.id) === String(formData.userId)).map((s: any) => ({ value: String(s.id), label: s.fullName }))[0] || null
                }
                onChange={(opt: any) => setFormData({...formData, userId: opt ? opt.value : ''})}
                placeholder="Search Employee..."
                isClearable
                menuPortalTarget={document.body}
                styles={{ menuPortal: base => ({ ...base, zIndex: 10000, pointerEvents: 'auto' }) }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Month</label>
              <select 
                className="w-full border p-2 rounded-md" 
                required 
                value={formData.month}
                onChange={(e) => setFormData({...formData, month: e.target.value})}
              >
                <option value="">Select Month...</option>
                {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <select 
                className="w-full border p-2 rounded-md" 
                required 
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: e.target.value})}
              >
                <option value="">Select Year...</option>
                {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bonuses</label>
              <Input type="number" value={formData.bonuses} onChange={(e) => setFormData({...formData, bonuses: Number(e.target.value)})} />
            </div>
              <div className="flex justify-end pt-4 gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Generate</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ─── Edit Payroll Dialog ──────────────────────────────────────── */}
        <Dialog open={!!editData} onOpenChange={(open) => !open && setEditData(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Payroll</DialogTitle>
            </DialogHeader>
            {editData && (
              <form onSubmit={handleEditSubmit} className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bonuses</label>
                  <Input type="number" value={editData.bonuses} onChange={(e) => setEditData({...editData, bonuses: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select className="w-full border p-2 rounded-md" value={editData.status} onChange={(e) => setEditData({...editData, status: e.target.value})}>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
                <div className="flex justify-end pt-4 gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditData(null)}>Cancel</Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* ─── Add Payment Dialog ──────────────────────────────────────── */}
        <Dialog open={!!paymentModal} onOpenChange={(open) => !open && setPaymentModal(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Payment</DialogTitle>
            </DialogHeader>
            {paymentModal && (
              <form onSubmit={handlePaymentSubmit} className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <Input type="date" value={paymentForm.date_for} onChange={(e) => setPaymentForm({...paymentForm, date_for: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Type</label>
                  <select className="w-full border p-2 rounded-md" value={paymentForm.payment_type} onChange={(e) => setPaymentForm({...paymentForm, payment_type: e.target.value})} required>
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                    <option value="credit">Credit</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {(paymentForm.payment_type === 'bank' || paymentForm.payment_type === 'bank_transfer') && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Bank</label>
                    <select className="w-full border p-2 rounded-md" value={paymentForm.bankId} onChange={(e) => setPaymentForm({...paymentForm, bankId: e.target.value})} required>
                      <option value="">Select Bank...</option>
                      {banks.map((b: any) => (
                        <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex justify-end pt-4 gap-2">
                  <Button type="button" variant="outline" onClick={() => setPaymentModal(null)}>Cancel</Button>
                  <Button type="submit">Submit Payment</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

      {/* ─── Data Table ───────────────────────────────────────────────── */}
      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-0">
          <DataTable
            data={filteredPayrolls}
            columns={columns}
            keyExtractor={(item: any) => item.id.toString()}
          />
        </CardContent>
      </Card>

      {/* ─── Payslip Preview Modal ────────────────────────────────────── */}
      <PayslipModal
        isOpen={!!viewPayslip}
        onClose={() => setViewPayslip(null)}
        payroll={viewPayslip}
      />
    </div>
    </>
  );
}
