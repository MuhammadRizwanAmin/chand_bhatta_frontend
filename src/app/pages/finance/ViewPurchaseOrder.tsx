import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ChevronLeft, Printer, CheckCircle2, FileText,
  RefreshCw, Building2, Package, Receipt, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

import { purchaseOrderService } from '../../services/purchaseOrderService';
import api from '../../services/api';

// ─── Status Config ─────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT:     { label: 'Draft',     className: 'bg-amber-100 text-amber-700 border border-amber-200' },
  APPROVED:  { label: 'Approved',  className: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  BILLED:    { label: 'Billed',    className: 'bg-blue-100 text-blue-700 border border-blue-200' },
  COMPLETED: { label: 'Completed', className: 'bg-blue-100 text-blue-700 border border-blue-200' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-700 border border-red-200' },
};

export function ViewPurchaseOrder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [po, setPO] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [locationInfo, setLocationInfo] = useState<any>(null);

  const fetchPO = async () => {
    setLoading(true);
    try {
      const res = await purchaseOrderService.getPurchaseOrderById(id!);
      setPO(res.data || res);
    } catch {
      toast.error('Failed to fetch Purchase Order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchPO();
      try {
        const settingsRes = await api.get('/setting');
        setSettings(settingsRes.data?.settings);
        const locId = localStorage.getItem('locationId');
        if (locId) {
          const locRes = await api.get(`/locations/${locId}`);
          setLocationInfo(locRes.data);
        }
      } catch { /* silently fail */ }
    };
    init();
  }, [id]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await purchaseOrderService.approvePurchaseOrder(id!);
      toast.success('Purchase Order approved!');
      fetchPO();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve PO');
    } finally {
      setApproving(false);
    }
  };

  const handleConvertToBill = async () => {
    setConverting(true);
    try {
      const res = await purchaseOrderService.convertToBill(id!);
      toast.success('Purchase Bill created successfully!');
      setTimeout(() => navigate(`/finance/bills/view/${res.bill?.id}`), 1000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to convert to Bill');
    } finally {
      setConverting(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML || '';
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(`
      <html><head><title>Purchase Order #${po?.id}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px; font-size: 13px; }
        th { background: #1D4ED8; color: #fff; }
        .header { text-align: center; border-bottom: 2px solid #1D4ED8; padding-bottom: 12px; margin-bottom: 20px; }
        .summary { margin-left: auto; width: 40%; margin-top: 16px; }
        .footer { text-align: center; font-size: 11px; color: #888; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 10px; }
      </style></head><body>
      <div class="header">
        <h2 style="color:#1D4ED8">${settings?.organization_name || 'Organization'}</h2>
        <div>${locationInfo?.name || ''}</div>
        <div style="font-size:12px;color:#777">${locationInfo?.address || ''}</div>
        <h3 style="margin-top:8px">Purchase Order #${po?.id}</h3>
        <div>Date: ${po?.orderDate ? new Date(po.orderDate).toLocaleDateString() : ''}</div>
      </div>
      ${printContent}
      <div class="footer">
        <p>Thank you — ${settings?.organization_name || 'Organization'}</p>
        <p>This is a system-generated document.</p>
      </div>
      <script>window.onload=()=>window.print();window.onafterprint=()=>window.close();</script>
      </body></html>
    `);
    win.document.close();
    win.focus();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <RefreshCw size={36} className="animate-spin mb-4 text-[#1D4ED8]" />
        <p>Loading purchase order...</p>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <AlertCircle size={48} className="mb-4 text-red-400" />
        <p className="font-semibold text-gray-700">Purchase Order not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-[#1D4ED8] hover:underline text-sm">
          Go Back
        </button>
      </div>
    );
  }

  const supplier = po.supplier || {};
  const items = po.items || po.POItems || [];
  const expenses = po.poExpenses || po.expenses || [];

  const itemTotal = items.reduce((sum: number, i: any) => {
    const qty = parseFloat(i.qty ?? i.quantity) || 0;
    const price = parseFloat(i.unitPrice ?? i.costPrice) || 0;
    return sum + qty * price;
  }, 0);

  const expenseTotal = expenses.reduce((sum: number, e: any) =>
    sum + (parseFloat(e.expense_amount) || 0), 0
  );
  const grandTotal = itemTotal + expenseTotal;

  const cfg = statusConfig[po.status] || { label: po.status, className: 'bg-gray-100 text-gray-600 border border-gray-200' };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[#0F172A]">
              Purchase Order <span className="text-gray-400 font-normal">#{po.id}</span>
            </h1>
            <p className="text-sm text-gray-500">
              Created {new Date(po.createdAt || po.orderDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Printer size={16} /> Print
          </button>

          {po.status === 'DRAFT' && (
            <button onClick={handleApprove} disabled={approving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
              {approving ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {approving ? 'Approving...' : 'Approve PO'}
            </button>
          )}

          {po.status === 'APPROVED' && (
            <button onClick={handleConvertToBill} disabled={converting}
              className="flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
              {converting ? <RefreshCw size={16} className="animate-spin" /> : <FileText size={16} />}
              {converting ? 'Converting...' : 'Convert to Bill'}
            </button>
          )}
        </div>
      </div>

      {/* Printable Content */}
      <div ref={printRef}>
        {/* Org Header (print only visible) */}
        <div className="bg-gradient-to-r from-[#0F172A] to-[#1E3A5F] rounded-xl p-6 text-white text-center mb-6">
          <h2 className="text-2xl font-black tracking-tight">
            {settings?.organization_name || 'Organization'}
          </h2>
          {locationInfo?.name && <p className="text-blue-200 mt-1">{locationInfo.name}</p>}
          {locationInfo?.address && <p className="text-blue-300 text-sm">{locationInfo.address}</p>}
          <div className="mt-3 inline-block">
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${cfg.className}`}>
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Supplier & Order Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-gray-100 px-5 py-3 font-semibold text-[#0F172A] text-sm flex items-center gap-2">
              <Building2 size={16} className="text-[#1D4ED8]" /> Supplier Information
            </div>
            <div className="p-5 space-y-2 text-sm">
              <div><span className="text-gray-500 w-20 inline-block">Name</span> <span className="font-semibold text-gray-900">{supplier.name || '—'}</span></div>
              <div><span className="text-gray-500 w-20 inline-block">Phone</span> <span className="text-gray-700">{supplier.phone || '—'}</span></div>
              <div><span className="text-gray-500 w-20 inline-block">Email</span> <span className="text-gray-700">{supplier.email || '—'}</span></div>
              <div><span className="text-gray-500 w-20 inline-block">Address</span> <span className="text-gray-700">{supplier.address || '—'}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-gray-100 px-5 py-3 font-semibold text-[#0F172A] text-sm flex items-center gap-2">
              <Receipt size={16} className="text-[#1D4ED8]" /> Order Details
            </div>
            <div className="p-5 space-y-2 text-sm">
              <div><span className="text-gray-500 w-28 inline-block">Order Date</span> <span className="font-semibold">{po.orderDate ? new Date(po.orderDate).toLocaleDateString() : '—'}</span></div>
              <div><span className="text-gray-500 w-28 inline-block">Expected Date</span> <span className="font-semibold">{po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '—'}</span></div>
              <div><span className="text-gray-500 w-28 inline-block">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.className}`}>{cfg.label}</span>
              </div>
              {po.remarks && <div><span className="text-gray-500 w-28 inline-block">Remarks</span> <span className="text-gray-700 italic">{po.remarks}</span></div>}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div className="bg-slate-50 border-b border-gray-100 px-6 py-4 font-semibold text-[#0F172A] flex items-center gap-2">
            <Package size={18} className="text-[#1D4ED8]" /> Ordered Items
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0F172A] text-white">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">#</th>
                  <th className="px-6 py-3 text-left font-semibold">Item</th>
                  <th className="px-6 py-3 text-left font-semibold">Unit</th>
                  <th className="px-6 py-3 text-right font-semibold">Qty</th>
                  <th className="px-6 py-3 text-right font-semibold">Unit Price</th>
                  <th className="px-6 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length > 0 ? items.map((item: any, idx: number) => {
                  const qty = parseFloat(item.qty ?? item.quantity) || 0;
                  const price = parseFloat(item.unitPrice ?? item.costPrice) || 0;
                  const itemName = item.item?.title || item.inventory?.title || '—';
                  const unit = item.item?.unit || item.inventory?.unit || '—';
                  return (
                    <tr key={item.id || idx} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-6 py-3 font-medium text-gray-900">{itemName}</td>
                      <td className="px-6 py-3 text-gray-500">{unit}</td>
                      <td className="px-6 py-3 text-right font-semibold">{qty}</td>
                      <td className="px-6 py-3 text-right text-gray-700">₨ {price.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right font-bold text-emerald-600">₨ {(qty * price).toLocaleString()}</td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400 italic">No items found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses Table */}
        {expenses.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
            <div className="bg-slate-50 border-b border-gray-100 px-6 py-4 font-semibold text-[#0F172A]">
              Additional Expenses
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-700 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left">#</th>
                    <th className="px-6 py-3 text-left">Expense Name</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.map((exp: any, idx: number) => (
                    <tr key={exp.id || idx}>
                      <td className="px-6 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-6 py-3 text-gray-800">{exp.expense_name}</td>
                      <td className="px-6 py-3 text-right font-semibold text-gray-900">₨ {Number(exp.expense_amount).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grand Total Summary */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-end">
            <div className="space-y-2 text-sm min-w-64">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal</span>
                <span className="font-semibold">₨ {itemTotal.toLocaleString()}</span>
              </div>
              {expenseTotal > 0 && (
                <div className="flex justify-between text-gray-600 pb-2 border-b border-gray-200">
                  <span>Additional Expenses</span>
                  <span className="font-semibold">₨ {expenseTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-black text-[#0F172A] pt-1">
                <span>Grand Total</span>
                <span className="text-[#1D4ED8]">₨ {grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
