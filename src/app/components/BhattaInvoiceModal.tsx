import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { SalesInvoice } from '../services/bhattaService';
import { useBhattaSettings } from '../context/BhattaSettingsContext';
import { useLanguage } from '../context/LanguageContext';
import { Printer, Download, X, Phone, MapPin, CheckCircle2, ShieldCheck } from 'lucide-react';
import defaultLogo from '../../assets/chand_bricks_logo.jpg';

interface BhattaInvoiceModalProps {
  invoice: SalesInvoice | null;
  onClose: () => void;
}

export function BhattaInvoiceModal({ invoice, onClose }: BhattaInvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { settings } = useBhattaSettings();
  const { isUrdu } = useLanguage();

  if (!invoice) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    // Create an isolated hidden iframe so ONLY the receipt prints (zero dashboard/sidebar in background)
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Clone all stylesheets & fonts for 100% fidelity
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="ur" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <title>Invoice_${invoice.invoice_number}</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            *, *::before, *::after, html, body {
              font-family: 'Jameel Noori Nastaliq', 'Jameel Noori Nastaleeq', 'JameelNooriNastaliq', 'Noto Nastaliq Urdu', serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              background: #ffffff !important;
              color: #0F172A !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            #print-root {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              background: #ffffff !important;
              padding: 4mm 6mm !important;
            }
          </style>
        </head>
        <body>
          <div id="print-root">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Trigger print once iframe is ready
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {}
      }, 3000);
    }, 400);
  };

  const handleDownloadPDF = () => {
    // Native vector PDF print engine: renders ONLY the receipt with exact Urdu Nastaliq & colors
    handlePrint();
  };

  const modalContent = (
    <div className="invoice-modal-portal fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto print:p-0 print:m-0 print:bg-transparent">
      {/* Modal Dialog */}
      <div className="invoice-modal-card relative w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden my-auto border border-slate-300 flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        
        {/* Top Control Bar (Never Hidden, Always Visible) */}
        <div className="invoice-modal-controls flex items-center justify-between px-6 py-3.5 bg-[#0F172A] text-white border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={settings.logoUrl || defaultLogo}
              alt="Logo"
              className="w-8 h-8 rounded-lg object-cover bg-white p-0.5 shadow-sm"
            />
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base leading-tight font-urdu">
                {settings.businessNameUrdu || 'چاند برکس سپلائرز (اے ایم ڈی)'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">Bill #: {invoice.invoice_number}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              title="Save as PDF"
            >
              <Download size={15} />
              <span>{isUrdu ? 'پی ڈی ایف محفوظ کریں (Save PDF)' : 'Save PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1D4ED8] hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              title="Print Receipt"
            >
              <Printer size={15} />
              <span>{isUrdu ? 'پرنٹ رسید (Print)' : 'Print'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-1"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Bill Container */}
        <div className="flex-1 overflow-y-auto print:overflow-visible">
          <div
            id="invoice-print-container"
            ref={printRef}
            className="p-6 sm:p-10 bg-white text-slate-900 print:p-0"
          >
            {/* Top Official Bhatta Header Branding */}
            <div className="border-b-2 border-[#1D4ED8] pb-5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Logo and Titles */}
                <div className="flex items-center gap-4 text-right">
                  <img
                    src={settings.logoUrl || defaultLogo}
                    alt="Official Logo"
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover bg-white p-1.5 shadow-md shrink-0 border-2 border-slate-200 ring-2 ring-blue-100"
                  />
                  <div className="text-right space-y-0.5">
                    <h2 className="text-2xl sm:text-3xl font-black text-[#1D4ED8] font-urdu leading-tight">
                      {settings.businessNameUrdu || 'چاند برکس سپلائرز (اے ایم ڈی)'}
                    </h2>
                    <p className="text-xs sm:text-sm font-urdu font-bold text-amber-700">
                      {(settings.taglineUrdu || 'چاند برکس بوریوالا (سپیشل اول اینٹ)').replace('• بوریوالا', 'بوریوالا')}
                    </p>
                    <p className="text-xs text-slate-700 font-urdu flex items-center justify-start gap-1">
                      <MapPin size={13} className="text-[#1D4ED8] shrink-0" />
                      <span>{settings.addressUrdu}</span>
                    </p>
                    <p className="text-xs text-slate-600 font-urdu pr-4">
                      چیچہ وطنی روڈ بائی پاس، بوریوالا (ضلع وہاڑی)
                    </p>
                  </div>
                </div>

                {/* Invoice Tag and Date */}
                <div className="text-center sm:text-right bg-slate-50 p-4 rounded-xl border border-slate-200 shrink-0 min-w-[200px]">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                    <CheckCircle2 size={13} />
                    <span>سیلز بل و رسید</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Invoice Number:</div>
                  <div className="font-mono font-black text-base text-[#1D4ED8]">{invoice.invoice_number}</div>
                  <div className="text-xs text-slate-500 mt-1.5 font-medium">Invoice Date:</div>
                  <div className="font-mono font-bold text-xs text-slate-800">{invoice.invoice_date}</div>
                </div>
              </div>

              {/* Contact Bar */}
              <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 bg-blue-50/60 px-3 py-1.5 rounded-lg border border-blue-100">
                  <Phone size={14} className="text-[#1D4ED8] shrink-0" />
                  <span className="font-bold text-slate-800 font-urdu text-xs">سیٹھ حاجی ناصر:</span>
                  <span className="font-mono text-blue-950 font-bold text-xs">{settings.hajiPhone}</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-50/60 px-3 py-1.5 rounded-lg border border-blue-100">
                  <Phone size={14} className="text-[#1D4ED8] shrink-0" />
                  <span className="font-bold text-slate-800 font-urdu text-xs">منشی سرور:</span>
                  <span className="font-mono text-blue-950 font-bold text-xs">{settings.munshiPhone}</span>
                </div>
              </div>

              {/* Proprietor Footer Line */}
              {settings.proprietors && (
                <div className="mt-2 py-1 px-3 bg-slate-100/70 border border-slate-200 rounded-md text-[11px] text-slate-700 text-center font-urdu">
                  <span><strong>ملکیت و شراکت داران:</strong> {settings.proprietors}</span>
                </div>
              )}
            </div>

            {/* Customer & Delivery Site Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <p className="text-slate-500 font-bold font-urdu text-xs">خریدار کا نام (Customer):</p>
                <p className="font-black text-slate-900 text-sm mt-0.5">{invoice.customer_name || 'Direct Customer'}</p>
              </div>
              <div>
                <p className="text-slate-500 font-bold font-urdu text-xs">ڈرائیور و گاڑی نمبر (Vehicle / Driver):</p>
                <p className="font-bold text-slate-900 text-xs mt-0.5">{invoice.driver_name || 'Bhatta Transport'}</p>
              </div>
              <div>
                <p className="text-slate-500 font-bold font-urdu text-xs">ترسیل کا پتہ / سائٹ (Site):</p>
                <p className="font-semibold text-slate-800 text-xs mt-0.5">{invoice.destination_address || 'Burewala & surrounding sites'}</p>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-300 shadow-xs mb-6">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead className="bg-[#1D4ED8] text-white font-bold">
                  <tr>
                    <th className="py-3 px-3 text-center border-r border-blue-600 w-12">#</th>
                    <th className="py-3 px-4 border-r border-blue-600 font-urdu">تفصیل مال (Item Description)</th>
                    <th className="py-3 px-4 border-r border-blue-600 text-right font-urdu">تعداد (Quantity)</th>
                    <th className="py-3 px-4 border-r border-blue-600 text-right font-urdu">ریٹ فی ہزار (Rate)</th>
                    <th className="py-3 px-4 border-r border-blue-600 text-right font-urdu">مال رقم (Amount)</th>
                    <th className="py-3 px-4 border-r border-blue-600 text-right font-urdu">کرایہ (Freight)</th>
                    <th className="py-3 px-4 text-right bg-blue-900 font-urdu">کل بل میزان (Net Total)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-900">
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-4 px-3 text-center text-slate-400 font-bold border-r border-slate-200">1</td>
                    <td className="py-4 px-4 font-bold border-r border-slate-200">
                      <span className="capitalize text-slate-900 text-sm font-urdu">
                        {invoice.item_type === 'Aent_Aval' && 'اول اینٹ (A-Grade Aent Aval)'}
                        {invoice.item_type === 'Aent_Doem' && 'دوئم اینٹ (B-Grade Aent Doem)'}
                        {invoice.item_type === 'Aent_Soyem' && 'سوئم اینٹ (C-Grade Aent Soyem)'}
                        {invoice.item_type === 'Tile' && 'ٹائل اینٹ (Special Bhatta Tile)'}
                        {invoice.item_type === 'Kacchi_Aent' && 'کچی اینٹ (Raw Kacchi Brick)'}
                      </span>
                      <span className="text-[11px] text-slate-500 block font-normal mt-0.5">
                        High strength kiln burnt brick
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-black text-slate-900 text-base border-r border-slate-200">
                      {invoice.quantity.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-slate-700 border-r border-slate-200">
                      Rs. {invoice.rate_per_thousand.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-slate-800 border-r border-slate-200">
                      Rs. {invoice.base_amount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-semibold text-slate-600 border-r border-slate-200">
                      Rs. {invoice.kiraya_freight.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-black text-[#1D4ED8] text-lg bg-blue-50/60">
                      Rs. {invoice.net_total_amount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Net Card */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50/40 to-slate-50 border border-blue-200 mb-6">
              <div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Amount in Words (رقم الفاظ میں):</p>
                <p className="text-xs text-blue-900 font-bold font-mono italic mt-0.5">
                  Rupees {invoice.net_total_amount.toLocaleString()} Only
                </p>
              </div>
              <div className="sm:text-right w-full sm:w-auto">
                <div className="text-xs font-bold text-slate-600 font-urdu">کل واجب الادا میزان (Total Net Payable):</div>
                <div className="text-2xl sm:text-3xl font-black text-[#1D4ED8] font-mono mt-0.5">
                  Rs. {invoice.net_total_amount.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Terms and conditions */}
            <div className="border-t border-slate-200 pt-4 text-slate-600 text-xs leading-relaxed">
              <h4 className="font-bold text-slate-900 text-xs mb-1 font-urdu">ضروری ہدایات و شرائط بل:</h4>
              <ol className="list-decimal list-inside space-y-1 font-urdu text-xs text-slate-700">
                <li>مال گاڑی سے اتارتے وقت موقع پر گنتی اور کوالٹی تسلی بخش چیک کر کے وصول کریں۔ بعد میں کوئی کلیم قابلِ قبول نہ ہوگا۔</li>
                <li>بغیر دستخط و مہر منشی صاحب رسید غیر معتبر تصور ہوگی۔</li>
                <li>کرایہ اور بقایا رقم بروقت منشی صاحب کو ادا کر کے کمپیوٹرائزڈ رسید حاصل کریں۔</li>
              </ol>
            </div>

            {/* Signatures Stamps */}
            <div className="grid grid-cols-2 gap-8 mt-10 pt-6 border-t border-dashed border-slate-300 text-xs">
              <div className="text-center">
                <div className="h-10 border-b border-slate-400 mx-auto w-48"></div>
                <p className="mt-2 font-bold text-slate-900 font-urdu text-sm">دستخط منشی / مینیجر</p>
                <p className="text-[10px] text-slate-500 font-mono">{settings.managerName} • {settings.businessNameEnglish}</p>
              </div>
              <div className="text-center">
                <div className="h-10 border-b border-slate-400 mx-auto w-48"></div>
                <p className="mt-2 font-bold text-slate-900 font-urdu text-sm">دستخط خریدار / ڈرائیور</p>
                <p className="text-[10px] text-slate-500">Customer / Driver Signature</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
