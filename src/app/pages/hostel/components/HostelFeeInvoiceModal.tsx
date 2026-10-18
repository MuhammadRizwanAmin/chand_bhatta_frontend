import React from 'react';
import { X, Printer } from 'lucide-react';

export function HostelFeeInvoiceModal({ show, onClose, fee, settings, location }: {
  show: boolean;
  onClose: () => void;
  fee: any;
  settings?: any;
  location?: any;
}) {
  if (!show || !fee) return null;

  const orgName = settings?.organization_name || 'Hostel Management';
  const orgAddress = location?.address || settings?.organization_location || '';
  const orgPhone = location?.contactPhone || settings?.organization_phone || '';
  const orgEmail = location?.contactEmail || '';

  // Parse extraDetails JSON string safely
  let extraItems: { name: string; amount: number }[] = [];
  try {
    if (fee.extraDetails) {
      extraItems = typeof fee.extraDetails === 'string'
        ? JSON.parse(fee.extraDetails)
        : fee.extraDetails;
    }
  } catch { extraItems = []; }

  const grandTotal = Number(fee.amount);
  const paidAmount = Number(fee.paidAmount || 0);
  const balanceDue = grandTotal - paidAmount;

  const printInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const extraRows = extraItems.map(item => `
      <tr>
        <td>${item.name}</td>
        <td style="text-align:right;">Rs. ${Number(item.amount).toLocaleString()}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Fee Invoice - ${fee.slipNo}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; margin: 0; }
            .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
            .header h1 { margin: 0 0 4px 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 2px 0; color: #64748b; font-size: 13px; }
            .slip-badge { display: inline-block; background: #EFF6FF; color: #1D4ED8; font-weight: 700; font-size: 16px; padding: 6px 18px; border-radius: 6px; margin: 12px 0 4px; }
            .slip-no { font-size: 12px; color: #64748b; }
            .meta { display: flex; justify-content: space-between; margin: 18px 0; font-size: 13px; }
            .meta div { line-height: 2; }
            .meta .label { color: #64748b; }
            .meta .value { font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
            thead tr { background: #f8fafc; }
            th { padding: 10px 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e2e8f0; color: #475569; }
            th:last-child { text-align: right; }
            td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
            td:last-child { text-align: right; }
            tr.first-row td { background: #F0FDF4; font-weight: 600; }
            .summary { margin-top: 8px; border-top: 2px solid #e2e8f0; padding-top: 12px; font-size: 13px; }
            .summary-row { display: flex; justify-content: space-between; padding: 5px 12px; }
            .summary-row.paid { color: #16a34a; font-weight: 500; }
            .summary-row.grand { font-size: 15px; font-weight: 700; border-top: 2px solid #e2e8f0; margin-top: 6px; padding-top: 10px; }
            .summary-row.due .val { color: ${balanceDue > 0 ? '#dc2626' : '#16a34a'}; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 12px; }
            @media print { body { padding: 0; } @page { margin: 1.5cm; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${orgName}</h1>
            ${orgAddress ? `<p>${orgAddress}</p>` : ''}
            ${(orgPhone || orgEmail) ? `<p>${orgPhone ? `Phone: ${orgPhone}` : ''}${orgPhone && orgEmail ? ' | ' : ''}${orgEmail ? `Email: ${orgEmail}` : ''}</p>` : ''}
            <div class="slip-badge">Hostel Fee Receipt</div><br>
            <span class="slip-no">Slip No: <strong>${fee.slipNo}</strong></span>
          </div>

          <div class="meta">
            <div>
              <div class="label">Tenant Name</div>
              <div class="value">${fee.tenant?.name || 'N/A'}</div>
              <div class="label" style="margin-top:8px;">CNIC</div>
              <div class="value">${fee.tenant?.cnic || 'N/A'}</div>
            </div>
            <div style="text-align:right;">
              <div class="label">Room No</div>
              <div class="value">${fee.tenant?.room?.roomNumber || 'N/A'}</div>
              <div class="label" style="margin-top:8px;">Period</div>
              <div class="value">${fee.month} ${fee.year}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align:right;">Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              ${extraRows || `<tr><td>Hostel Fee for ${fee.month} ${fee.year}</td><td style="text-align:right;">Rs. ${grandTotal.toLocaleString()}</td></tr>`}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row grand">
              <span>Grand Total</span>
              <span>Rs. ${grandTotal.toLocaleString()}</span>
            </div>
            <div class="summary-row paid">
              <span>Paid Amount</span>
              <span class="val">Rs. ${paidAmount.toLocaleString()}</span>
            </div>
            <div class="summary-row due grand">
              <span>Balance Due</span>
              <span class="val" style="color:${balanceDue > 0 ? '#dc2626' : '#16a34a'}">Rs. ${balanceDue.toLocaleString()}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you! &nbsp;|&nbsp; Status: <strong>${fee.status}</strong></p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onafterprint = () => printWindow.close();
    setTimeout(() => printWindow.print(), 250);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-slate-900">Fee Invoice</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="p-6">
            {/* Org Header */}
            <div className="text-center mb-5 pb-5 border-b border-slate-100">
              <h1 className="text-xl font-bold text-slate-900 uppercase tracking-wide">{orgName}</h1>
              {orgAddress && <p className="text-xs text-slate-500 mt-1">{orgAddress}</p>}
              {(orgPhone || orgEmail) && (
                <p className="text-xs text-slate-500">
                  {orgPhone && `Phone: ${orgPhone}`}
                  {orgPhone && orgEmail && ' | '}
                  {orgEmail && `Email: ${orgEmail}`}
                </p>
              )}
              <div className="inline-block mt-3 bg-blue-50 text-blue-700 font-bold text-base px-4 py-1.5 rounded-lg">
                Hostel Fee Receipt
              </div>
              <p className="text-xs text-slate-400 mt-1">Slip No: <span className="font-semibold text-slate-600">{fee.slipNo}</span></p>
            </div>

            {/* Tenant meta */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-5">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide">Tenant</p>
                <p className="font-semibold text-slate-900">{fee.tenant?.name || 'N/A'}</p>
                {fee.tenant?.cnic && <p className="text-slate-500 text-xs mt-0.5">{fee.tenant.cnic}</p>}
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-xs uppercase tracking-wide">Room</p>
                <p className="font-semibold text-slate-900">{fee.tenant?.room?.roomNumber || 'N/A'}</p>
                <p className="text-slate-500 text-xs mt-0.5">{fee.month} {fee.year}</p>
              </div>
            </div>

            {/* Itemized charges table */}
            <div className="rounded-xl border border-slate-100 overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {extraItems.length > 0 ? (
                    extraItems.map((item, idx) => (
                      <tr key={idx} className={`border-t border-slate-100 ${idx === 0 ? 'bg-emerald-50' : ''}`}>
                        <td className={`px-4 py-3 ${idx === 0 ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                          {item.name}
                          {idx === 0 && (
                            <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">Room Rent</span>
                          )}
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${idx === 0 ? 'text-slate-900' : 'text-slate-700'}`}>
                          Rs. {Number(item.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-600">Hostel Fee for {fee.month} {fee.year}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">Rs. {grandTotal.toLocaleString()}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Grand total + paid/balance summary */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between items-center font-bold text-base border-t-2 border-slate-200 pt-3 pb-1">
                <span className="text-slate-800">Grand Total</span>
                <span className="text-slate-900">Rs. {grandTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-600 font-medium">
                <span>Paid Amount</span>
                <span>Rs. {paidAmount.toLocaleString()}</span>
              </div>
              <div className={`flex justify-between items-center font-bold text-base border-t border-slate-100 pt-2 ${balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                <span>Balance Due</span>
                <span>Rs. {balanceDue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${fee.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : fee.status === 'Partial' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
            {fee.status}
          </span>
          <div className="flex gap-3">
            <button
              onClick={printInvoice}
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl transition-colors font-medium text-sm"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#1D4ED8] text-white hover:bg-blue-700 rounded-xl transition-colors font-medium text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
