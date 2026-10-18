import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, Download, Receipt, RefreshCw } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { PayslipPDF } from './PayslipPDF';
import { toast } from 'sonner';
import api from '@/app/services/api';

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  payroll: any;
}

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const fmtMoney = (val: number | string | undefined) =>
  Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function PayslipModal({ isOpen, onClose, payroll }: PayslipModalProps) {
  const [loading, setLoading] = useState(true);
  const [tenantName, setTenantName] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api.get('/setting')
      .then((res) => {
        const s = res?.data?.settings;
        if (s?.organization_name) setTenantName(s.organization_name);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen || !payroll) return null;

  const basicSalary = Number(payroll.basicSalary || 0);
  const bonuses = Number(payroll.bonuses || 0);
  const deductions = Number(payroll.deductions || 0);
  const netPay = Number(payroll.netPay || 0);
  const grossPay = basicSalary + bonuses;
  const isPaid = (payroll.status || '').toLowerCase() === 'paid';
  const monthName = monthNames[(Number(payroll.month) || 1) - 1] || '';
  const year = payroll.year || new Date().getFullYear();
  const currentYear = new Date().getFullYear();
  const employeeName = payroll.user?.fullName || 'Employee';
  const employeeEmail = payroll.user?.email || '';
  const slipId = String(payroll.id || '').slice(0, 8).toUpperCase();

  const handleDownloadPDF = async () => {
    try {
      const doc = <PayslipPDF payroll={payroll} tenantName={tenantName} />;
      const asPdf = pdf();
      asPdf.updateContainer(doc);
      const blob = await asPdf.toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Payslip_${employeeName.replace(/\s+/g, '_')}_${monthName}_${year}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
      toast.success('Payslip PDF downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    }
  };

  const handleBrowserPrint = () => {
    const printContent = printRef.current?.innerHTML || '';
    const printWindow = window.open('', '', 'width=900,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Payslip - ${employeeName} - ${monthName} ${year}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #fff; }
              @media print {
                @page { margin: 10mm; size: A4; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = () => { setTimeout(() => { window.print(); }, 300); };
              window.onafterprint = () => window.close();
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0F172A] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#D4A017] p-2 rounded-lg text-white">
              <Receipt size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Payslip Preview</h2>
              <p className="text-xs text-gray-400">{employeeName} — {monthName} {year}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <Download size={15} /> Download PDF
          </button>
          <button
            onClick={handleBrowserPrint}
            className="flex items-center gap-2 bg-[#D4A017] hover:bg-[#B8860B] text-white px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            <Printer size={15} /> Print
          </button>
        </div>

        {/* Scrollable Body - HTML Payslip Preview */}
        <div className="flex-1 bg-gray-100 overflow-y-auto p-8 flex justify-center items-start">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw className="animate-spin text-[#1D4ED8] mb-3" size={28} />
              <p className="text-sm text-gray-500">Loading payslip...</p>
            </div>
          ) : (
            <div ref={printRef} className="bg-white shadow-xl rounded-lg border border-gray-200 overflow-hidden w-full max-w-[840px]">
              {/* ──── HTML Payslip Replica ──── */}
              <div style={{ border: '1px solid #14171A', fontFamily: "'Courier New', Courier, monospace", color: '#14171A', background: '#fff' }}>

                {/* Head */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '12px 24px', borderBottom: '3px solid #14171A' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 'bold', fontFamily: "'Segoe UI', sans-serif" }}>
                      {(tenantName || 'HOTEL MANAGEMENT SYSTEM').toUpperCase()}
                    </div>
                    <div style={{ fontSize: 9, color: '#666B6F', marginTop: 3, textTransform: 'uppercase', fontFamily: "'Segoe UI', sans-serif" }}>
                      Payroll Register — Human Resources Division
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 'bold', letterSpacing: 4, fontFamily: "'Segoe UI', sans-serif" }}>PAYSLIP</div>
                    <div style={{ fontSize: 11, color: '#666B6F', marginTop: 6 }}>{monthName.toUpperCase()} {year}</div>
                  </div>
                </div>

                {/* Employee Info Strip */}
                <div style={{ display: 'flex', borderBottom: '1px solid #14171A' }}>
                  {[
                    { label: 'Employee', value: employeeName },
                    { label: 'Email', value: employeeEmail || '—' },
                    { label: 'Slip ID', value: slipId || '—' },
                    { label: 'Status', value: isPaid ? '[PAID]' : `[${(payroll.status || 'UNPAID').toUpperCase()}]`, color: isPaid ? '#2C4A66' : undefined, isLast: true },
                  ].map((c, i) => (
                    <div key={i} style={{ flex: 1, padding: '8px 14px', borderRight: c.isLast ? 'none' : '1px solid #D6D6D2' }}>
                      <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 1, color: '#666B6F', fontWeight: 'bold', fontFamily: "'Segoe UI', sans-serif" }}>{c.label}</div>
                      <div style={{ fontSize: 12, marginTop: 4, fontWeight: 'bold', color: c.color || '#14171A' }}>{c.value}</div>
                    </div>
                  ))}
                </div>

                {/* Section Title */}
                <div style={{ padding: '12px 24px 8px', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase', borderBottom: '1px solid #D6D6D2', fontFamily: "'Segoe UI', sans-serif" }}>
                  Earnings & Deductions
                </div>

                {/* Two-column Earnings / Deductions */}
                <div style={{ display: 'flex' }}>
                  {/* Earnings */}
                  <div style={{ flex: 1, borderRight: '1px solid #14171A' }}>
                    <div style={{ padding: '6px 24px', fontSize: 9, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', borderBottom: '1px solid #14171A', color: '#2C4A66', backgroundColor: '#EAF0F5', fontFamily: "'Segoe UI', sans-serif" }}>
                      Earnings
                    </div>
                    {[
                      { label: 'Basic Salary', value: fmtMoney(basicSalary) },
                      { label: 'Bonuses', value: fmtMoney(bonuses) },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 24px', borderBottom: '1px solid #D6D6D2', fontSize: 11 }}>
                        <span>{item.label}</span>
                        <span style={{ fontWeight: 'bold' }}>{item.value}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 24px', borderTop: '2px solid #14171A', fontSize: 11, fontWeight: 'bold' }}>
                      <span>Total Earnings</span>
                      <span>{fmtMoney(grossPay)}</span>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div style={{ flex: 1 }}>
                    <div style={{ padding: '6px 24px', fontSize: 9, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', borderBottom: '1px solid #14171A', color: '#7A1F2B', backgroundColor: '#F6EAEB', fontFamily: "'Segoe UI', sans-serif" }}>
                      Deductions
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 24px', borderBottom: '1px solid #D6D6D2', fontSize: 11 }}>
                      <span>Absence Deductions</span>
                      <span style={{ fontWeight: 'bold' }}>{fmtMoney(deductions)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 24px', borderTop: '2px solid #14171A', fontSize: 11, fontWeight: 'bold' }}>
                      <span>Total Deductions</span>
                      <span>{fmtMoney(deductions)}</span>
                    </div>
                  </div>
                </div>

                {/* Totals Summary */}
                <div style={{ borderTop: '3px solid #14171A' }}>
                  <div style={{ padding: '12px 24px', display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ width: 300 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11, color: '#666B6F' }}>
                        <span>Total Earnings</span>
                        <span style={{ color: '#2C4A66' }}>{fmtMoney(grossPay)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11, color: '#666B6F' }}>
                        <span>Total Deductions</span>
                        <span style={{ color: '#7A1F2B' }}>-{fmtMoney(deductions)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 10, paddingBottom: 10, borderTop: '2px solid #14171A' }}>
                        <span style={{ fontSize: 11, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', fontFamily: "'Segoe UI', sans-serif" }}>Net Payable</span>
                        <span style={{ fontSize: 16, fontWeight: 'bold' }}>Rs. {fmtMoney(netPay)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 24px 14px', fontSize: 8, color: '#666B6F' }}>
                  <span>HMS/PAYROLL/{currentYear}</span>
                  <span>Not valid without payroll office stamp</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Close Preview
          </button>
        </div>

      </div>
    </div>
  );
}
