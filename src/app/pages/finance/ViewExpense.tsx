import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ChevronLeft, Printer, RefreshCw, AlertCircle,
  Receipt, Calendar, User, FileText, CreditCard, Link, Building
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { getCurrency } from '../../utils/currency';

export function ViewExpense() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [expense, setExpense] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [locationInfo, setLocationInfo] = useState<any>(null);

  const fetchExpense = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/expenses/${id}`);
      setExpense(res.data?.data || res.data);
    } catch {
      toast.error('Failed to fetch expense details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchExpense();
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
      <html><head><title>Expense #${expense?.id}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #1D4ED8; padding-bottom: 12px; margin-bottom: 20px; }
        .footer { text-align: center; font-size: 11px; color: #888; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 10px; }
      </style></head><body>
      <div class="header">
        <h2 style="color:#1D4ED8">${settings?.organization_name || 'Organization'}</h2>
        <div>${locationInfo?.name || ''}</div>
        <div style="font-size:12px;color:#777">${locationInfo?.address || ''}</div>
        <h3 style="margin-top:8px">Expense Report #${expense?.id}</h3>
        <div>Date: ${expense?.date_for ? new Date(expense.date_for).toLocaleDateString() : ''}</div>
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
        <p>Loading expense details...</p>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <AlertCircle size={48} className="mb-4 text-red-400" />
        <p className="font-semibold text-gray-700">Expense not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-[#1D4ED8] hover:underline text-sm">Go Back</button>
      </div>
    );
  }

  const catName = expense.category?.name || expense.expense_type || expense.if_other_expense_type || 'General';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[#0F172A]">
              Expense <span className="text-gray-400 font-normal">#{expense.id}</span>
            </h1>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Calendar size={14} /> {new Date(expense.date_for).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      <div ref={printRef} className="space-y-6">
        {/* Main Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Overview */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-gray-100 px-5 py-3 font-semibold text-[#0F172A] text-sm flex items-center gap-2">
              <Receipt size={16} className="text-[#1D4ED8]" /> Overview
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Title</div>
                <div className="font-bold text-lg text-gray-900">{expense.title}</div>
              </div>
              
              <div className="flex justify-between items-center bg-red-50 p-4 rounded-lg border border-red-100">
                <div className="text-red-700 font-medium">Total Amount</div>
                <div className="text-2xl font-black text-red-700">{getCurrency()} {Number(expense.price).toLocaleString()}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Category</div>
                  <div className="text-sm font-medium inline-block px-2.5 py-1 bg-gray-100 rounded-md text-gray-700">{catName}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Date</div>
                  <div className="text-sm font-medium text-gray-800">{new Date(expense.date_for).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment & User Info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-gray-100 px-5 py-3 font-semibold text-[#0F172A] text-sm flex items-center gap-2">
              <CreditCard size={16} className="text-[#1D4ED8]" /> Payment Details
            </div>
            <div className="p-6 space-y-5">
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <CreditCard size={18} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Method</div>
                  <div className="font-medium text-gray-900 capitalize">{expense.payment_type?.replace('_', ' ')}</div>
                </div>
              </div>

              {expense.bank && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Building size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Bank Account</div>
                    <div className="font-medium text-gray-900">{expense.bank.bankName}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{expense.bank.accountNumber}</div>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-100 pt-5 mt-2 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <User size={18} className="text-amber-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Created By</div>
                  <div className="font-medium text-gray-900">{expense.user?.fullName || 'N/A'}</div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Description */}
        {expense.description && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-gray-100 px-5 py-3 font-semibold text-[#0F172A] text-sm flex items-center gap-2">
              <FileText size={16} className="text-[#1D4ED8]" /> Description
            </div>
            <div className="p-5 text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
              {expense.description}
            </div>
          </div>
        )}

        {/* Attachments */}
        {expense.attachments && expense.attachments.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-gray-100 px-5 py-3 font-semibold text-[#0F172A] text-sm flex items-center gap-2">
              <Link size={16} className="text-[#1D4ED8]" /> Attachments
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {expense.attachments.map((att: any) => {
                  const isImage = att.file_url?.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                  return (
                    <a key={att.id} href={att.file_url} target="_blank" rel="noreferrer"
                      className="group block rounded-lg border border-gray-200 overflow-hidden hover:border-blue-400 transition-colors">
                      {isImage ? (
                        <div className="aspect-video bg-gray-100 overflow-hidden">
                          <img src={att.file_url} alt="Attachment" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gray-50 flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                          <FileText size={32} />
                          <span className="text-xs mt-2 font-medium">Document</span>
                        </div>
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
