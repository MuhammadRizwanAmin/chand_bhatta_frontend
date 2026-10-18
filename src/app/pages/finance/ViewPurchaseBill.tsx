import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ChevronLeft, Printer, RefreshCw, Building2, Package,
  Receipt, AlertCircle, CheckCircle2, Clock, AlertTriangle, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

import { billService } from '../../services/billService';
import api from '../../services/api';
import { ReturnPurchaseBillModal } from './ReturnPurchaseBillModal';

export function ViewPurchaseBill() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [locationInfo, setLocationInfo] = useState<any>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const fetchBill = async () => {
    setLoading(true);
    try {
      const res = await billService.getBillById(id!);
      setBill(res.data || res);
    } catch {
      toast.error('Failed to fetch bill details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchBill();
      try {
        const settingsRes = await api.get('/setting');
        setSettings(settingsRes.data?.settings);
        const locId = localStorage.getItem('locationId');
        if (locId) {
          const locRes = await api.get(`/locations/${locId}`);
          setLocationInfo(locRes.data);
        }
      } catch { /* silently ignore */ }
    };
    init();
  }, [id]);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML || '';
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(`
      <html><head><title>Purchase Bill #${bill?.id}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px; font-size: 13px; }
        th { background: #1D4ED8; color: white; }
        .header { text-align: center; border-bottom: 2px solid #1D4ED8; padding-bottom: 12px; margin-bottom: 20px; }
        .footer { text-align: center; font-size: 11px; color: #888; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 10px; }
      </style></head><body>
      <div class="header">
        <h2 style="color:#1D4ED8">${settings?.organization_name || 'Organization'}</h2>
        <div>${locationInfo?.name || ''}</div>
        <div style="font-size:12px;color:#777">${locationInfo?.address || ''}</div>
        <h3 style="margin-top:8px">Purchase Bill #${bill?.id}</h3>
        <div>Date: ${bill?.billDate ? new Date(bill.billDate).toLocaleDateString() : ''}</div>
      </div>
      ${content}
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
        <p>Loading bill details...</p>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <AlertCircle size={48} className="mb-4 text-red-400" />
        <p className="font-semibold text-gray-700">Bill not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-[#1D4ED8] hover:underline text-sm">Go Back</button>
      </div>
    );
  }

  const paid       = Number(bill.paidAmount  || 0);
  const subTotal   = Number(bill.subTotal    || 0);
  const tax        = Number(bill.taxAmount   || 0);
  const expenseTotal = (bill.billExpenses || []).reduce(
    (s: number, e: any) => s + (parseFloat(e.expense_amount) || 0), 0
  );
  const grandTotal = subTotal + tax + expenseTotal || Number(bill.grandTotal || 0);
  const balance    = grandTotal - paid;

  const statusCfg =
    paid <= 0            ? { label: 'Unpaid',  className: 'bg-gray-100 text-gray-700 border border-gray-200',     icon: <Clock size={14} /> }
    : paid < grandTotal  ? { label: 'Partial', className: 'bg-amber-100 text-amber-700 border border-amber-200',  icon: <AlertTriangle size={14} /> }
    :                      { label: 'Paid',    className: 'bg-emerald-100 text-emerald-700 border border-emerald-200', icon: <CheckCircle2 size={14} /> };

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[#0F172A]">
              Purchase Bill <span className="text-gray-400 font-normal">#{bill.id}</span>
            </h1>
            <p className="text-sm text-gray-500">
              {bill.purchaseOrderId ? `Converted from PO #${bill.purchaseOrderId}` : 'Direct Bill'}
              {' · '}
              {new Date(bill.billDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${statusCfg.className}`}>
            {statusCfg.icon} {statusCfg.label}
          </span>
          <button
            onClick={() => setShowReturnModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-orange-300 text-orange-700 bg-orange-50 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors"
          >
            <RotateCcw size={16} /> Return Items
          </button>
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {/* Printable Section */}
      <div ref={printRef}>

        {/* Org Header Banner */}
        <div className="bg-gradient-to-r from-[#0F172A] to-[#1E3A5F] rounded-xl p-6 text-white text-center mb-4">
          <h2 className="text-2xl font-black">{settings?.organization_name || 'Organization'}</h2>
          {locationInfo?.name    && <p className="text-blue-200 mt-1">{locationInfo.name}</p>}
          {locationInfo?.address && <p className="text-blue-300 text-sm">{locationInfo.address}</p>}
          <p className="mt-2 text-blue-100 font-semibold">Purchase Bill #{bill.id}</p>
        </div>

        {/* Supplier & Bill Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-gray-100 px-5 py-3 font-semibold text-[#0F172A] text-sm flex items-center gap-2">
              <Building2 size={16} className="text-[#1D4ED8]" /> Supplier Information
            </div>
            <div className="p-5 space-y-2 text-sm">
              <div><span className="text-gray-500 w-20 inline-block">Name</span>    <span className="font-semibold text-gray-900">{bill.supplier?.name    || '—'}</span></div>
              <div><span className="text-gray-500 w-20 inline-block">Phone</span>   <span className="text-gray-700">{bill.supplier?.phone   || '—'}</span></div>
              <div><span className="text-gray-500 w-20 inline-block">Email</span>   <span className="text-gray-700">{bill.supplier?.email   || '—'}</span></div>
              <div><span className="text-gray-500 w-20 inline-block">Address</span> <span className="text-gray-700">{bill.supplier?.address || '—'}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-gray-100 px-5 py-3 font-semibold text-[#0F172A] text-sm flex items-center gap-2">
              <Receipt size={16} className="text-[#1D4ED8]" /> Bill Information
            </div>
            <div className="p-5 space-y-2 text-sm">
              <div><span className="text-gray-500 w-32 inline-block">Bill Date</span>     <span className="font-semibold">{new Date(bill.billDate).toLocaleDateString()}</span></div>
              <div><span className="text-gray-500 w-32 inline-block">PO Reference</span>  <span className="font-semibold">{bill.purchaseOrderId ? `#${bill.purchaseOrderId}` : '—'}</span></div>
              <div><span className="text-gray-500 w-32 inline-block">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusCfg.className}`}>{statusCfg.label}</span>
              </div>
              {bill.returnStatus && bill.returnStatus !== 'None' && (
                <div><span className="text-gray-500 w-32 inline-block">Return Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    bill.returnStatus === 'Full'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-orange-100 text-orange-700 border border-orange-200'
                  }`}>
                    <RotateCcw size={10} className="inline mr-1" />{bill.returnStatus} Return
                  </span>
                </div>
              )}
              <div><span className="text-gray-500 w-32 inline-block">Last Updated</span>  <span className="text-gray-600 text-xs">{new Date(bill.updatedAt).toLocaleString()}</span></div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div className="bg-slate-50 border-b border-gray-100 px-6 py-4 font-semibold text-[#0F172A] flex items-center gap-2">
            <Package size={18} className="text-[#1D4ED8]" /> Bill Items
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0F172A] text-white">
                <tr>
                  <th className="px-6 py-3 text-left">#</th>
                  <th className="px-6 py-3 text-left">Item</th>
                  <th className="px-6 py-3 text-right">Qty</th>
                  <th className="px-6 py-3 text-right">Returned</th>
                  <th className="px-6 py-3 text-right">Unit Price</th>
                  <th className="px-6 py-3 text-right">Tax (%)</th>
                  <th className="px-6 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(bill.items || bill.billItems || []).length > 0
                  ? (bill.items || bill.billItems).map((item: any, idx: number) => (
                    <tr key={idx} className={`hover:bg-gray-50/50 ${Number(item.returnedQty || 0) > 0 ? 'bg-orange-50/30' : ''}`}>
                      <td className="px-6 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-6 py-3 font-medium text-gray-900">{item.item?.title || item.inventory?.title || '—'}</td>
                      <td className="px-6 py-3 text-right">{parseFloat(item.qty ?? item.quantity) || 0}</td>
                      <td className="px-6 py-3 text-right">
                        {Number(item.returnedQty || 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                            <RotateCcw size={10} /> {Number(item.returnedQty)}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-700">₨ {Number((item.unitPrice ?? item.costPrice) || 0).toLocaleString()}</td>
                      <td className="px-6 py-3 text-right text-gray-500">{item.taxRate ?? 0}%</td>
                      <td className="px-6 py-3 text-right font-bold text-emerald-600">₨ {Number(item.total || 0).toLocaleString()}</td>
                    </tr>
                  ))
                  : <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400 italic">No items found</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses Table */}
        {(bill.billExpenses || []).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
            <div className="bg-slate-50 border-b border-gray-100 px-6 py-4 font-semibold text-[#0F172A]">Additional Expenses</div>
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
                  {bill.billExpenses.map((exp: any, idx: number) => (
                    <tr key={exp.id || idx}>
                      <td className="px-6 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-6 py-3 text-gray-800">{exp.expense_name}</td>
                      <td className="px-6 py-3 text-right font-semibold">₨ {Number(exp.expense_amount).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-end">
            <div className="space-y-2 text-sm min-w-72">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold">₨ {subTotal.toLocaleString()}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span className="font-semibold">₨ {tax.toLocaleString()}</span>
                </div>
              )}
              {expenseTotal > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Expenses</span>
                  <span className="font-semibold">₨ {expenseTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-black text-[#0F172A] border-t border-gray-200 pt-2">
                <span>Grand Total</span>
                <span className="text-[#1D4ED8]">₨ {grandTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Amount Paid</span>
                <span className="font-semibold text-emerald-600">₨ {paid.toLocaleString()}</span>
              </div>
              {Number(bill.refundAmount || 0) > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span className="flex items-center gap-1"><RotateCcw size={13} /> Refunded to Us</span>
                  <span className="font-semibold">₨ {Number(bill.refundAmount).toLocaleString()}</span>
                </div>
              )}
              <div className={`flex justify-between text-base font-bold pt-1 border-t border-gray-200 ${balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                <span>Remaining Balance</span>
                <span>₨ {balance.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <ReturnPurchaseBillModal
      isOpen={showReturnModal}
      onClose={() => setShowReturnModal(false)}
      bill={bill}
      onSuccess={fetchBill}
    />
    </>
  );
}
