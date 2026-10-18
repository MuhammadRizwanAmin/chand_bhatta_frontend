import React, { useState, useEffect } from "react";
import { Eye, CreditCard, Trash2, FilePlus, RefreshCw, X, Printer } from "lucide-react";
import { DataTable, Column } from "../../components/DataTable";
import api from "../../services/api";
import { DeleteConfirmationModal } from "../../components/DeleteConfirmationModal";
import { HostelFeeInvoiceModal } from "./components/HostelFeeInvoiceModal";
import { usePermissions } from "../../hooks/usePermissions";

export function HostelFeeList() {
  const [data, setData] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { canEdit, canDelete, canEditOrDelete } = usePermissions();

  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [selectedFee, setSelectedFee] = useState<any>(null);

  // Organization settings (fetched from API like InvoiceModal)
  const [orgSettings, setOrgSettings] = useState<any>(null);
  const [orgLocation, setOrgLocation] = useState<any>({
    name: 'Main Branch',
    address: '',
    contactPhone: '',
    contactEmail: ''
  });
  
  const [filterMonth, setFilterMonth] = useState(new Date().toLocaleDateString('en-US', { month: 'long' }));
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const [paymentProofImage, setPaymentProofImage] = useState<File | null>(null);
  const [paymentData, setPaymentData] = useState({ 
    bankId: "", 
    amount: "", 
    paymentMethod: "cash", 
    transactionId: "", 
    note: "", 
    paymentDate: new Date().toISOString().split('T')[0] 
  });

  const [genData, setGenData] = useState({
    month: new Date().toLocaleDateString('en-US', { month: 'long' }),
    year: new Date().getFullYear().toString()
  });

  const monthOptions = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const yearOptions = [
    (new Date().getFullYear() - 1).toString(),
    new Date().getFullYear().toString(),
    (new Date().getFullYear() + 1).toString()
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterMonth !== "All") params.append("month", filterMonth);
      if (filterYear !== "All") params.append("year", filterYear);

      const [feesRes, banksRes] = await Promise.all([
        api.get(`/hostel-fees/all?${params.toString()}`),
        api.get('/banks')
      ]);

      if (feesRes.data && feesRes.data.data) {
        setData(feesRes.data.data);
      }
      if (banksRes.data) {
        setBanks(banksRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterMonth, filterYear]);

  // Fetch org settings on mount — same pattern as InvoiceModal
  useEffect(() => {
    Promise.all([
      api.get('/setting').catch(() => null),
      api.get('/locations').catch(() => null)
    ]).then(([settingRes, locationRes]) => {
      const s = settingRes?.data?.settings;
      if (s) setOrgSettings(s);

      const locs = locationRes?.data || [];
      const currentLocId = localStorage.getItem('locationId');
      const currentLoc = locs.find((l: any) => String(l.id) === currentLocId) || locs[0];

      if (currentLoc) {
        setOrgLocation({
          name: currentLoc.name || s?.organization_name || 'Main Branch',
          address: currentLoc.address || s?.organization_location || '',
          contactPhone: currentLoc.contactPhone || s?.organization_phone || '',
          contactEmail: currentLoc.contactEmail || ''
        });
      } else if (s) {
        setOrgLocation((prev: any) => ({
          ...prev,
          name: s.organization_name || prev.name,
          address: s.organization_location || prev.address,
          contactPhone: s.organization_phone || prev.contactPhone,
        }));
      }
    });
  }, []);

  const handleGenerateFees = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsGenerating(true);
      const res = await api.post("/hostel-fees/bulk-generate", {
        month: genData.month,
        year: genData.year
      });
      alert(res.data?.message || "Generated successfully");
      fetchData();
      setIsGenModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to generate fees");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCollectFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentData.paymentMethod !== "cash" && !paymentData.bankId) {
      alert("Please select a bank account");
      return;
    }
    if (!paymentData.amount || Number(paymentData.amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append("amount", paymentData.amount);
      if (paymentData.bankId) formData.append("bankId", paymentData.bankId);
      formData.append("paymentMethod", paymentData.paymentMethod);
      formData.append("transactionId", paymentData.transactionId);
      formData.append("note", paymentData.note);
      formData.append("paymentDate", paymentData.paymentDate);
      
      if (paymentProofImage) {
        formData.append("proofImage", paymentProofImage);
      }

      await api.put(`/hostel-fees/collect/${selectedFee.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      fetchData();
      setIsCollectModalOpen(false);
      setSelectedFee(null);
      setPaymentProofImage(null);
      setPaymentData({ 
        bankId: "", 
        amount: "", 
        paymentMethod: "cash", 
        transactionId: "", 
        note: "", 
        paymentDate: new Date().toISOString().split('T')[0] 
      });
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to record payment");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFee = async () => {
    if (!selectedFee) return;
    try {
      await api.delete(`/hostel-fees/delete/${selectedFee.id}`);
      fetchData();
      setIsDeleteModalOpen(false);
      setSelectedFee(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete fee record");
    }
  };

  const handlePrintFeeSlip = (fee: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const settings = orgSettings || {};
    const location = orgLocation || {};

    // Parse extraDetails
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

    const extraRows = extraItems.map((item, idx) => `
      <tr class="${idx === 0 ? 'first-row' : ''}">
        <td>${item.name}${idx === 0 ? ' <span class="badge">Room Rent</span>' : ''}</td>
        <td style="text-align:right;">Rs. ${Number(item.amount).toLocaleString()}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Fee Slip - ${fee.slipNo}</title>
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
            .meta .label { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
            .meta .value { font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
            thead tr { background: #f8fafc; }
            th { padding: 10px 14px; text-align: left; font-weight: 600; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
            th:last-child { text-align: right; }
            td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; }
            td:last-child { text-align: right; }
            tr.first-row td { background: #F0FDF4; font-weight: 600; color: #166534; }
            .badge { display: inline-block; background: #dcfce7; color: #16a34a; font-size: 10px; padding: 1px 6px; border-radius: 4px; font-weight: 600; margin-left: 6px; }
            .summary { margin-top: 6px; border-top: 2px solid #e2e8f0; padding-top: 12px; font-size: 13px; }
            .summary-row { display: flex; justify-content: space-between; padding: 6px 4px; }
            .summary-row.paid { color: #16a34a; font-weight: 500; }
            .summary-row.grand { font-size: 15px; font-weight: 700; background: #f8fafc; padding: 10px 14px; border-radius: 8px; margin-top: 4px; }
            .summary-row.due { font-size: 15px; font-weight: 700; padding: 10px 14px; border-radius: 8px; margin-top: 4px; color: ${balanceDue > 0 ? '#dc2626' : '#16a34a'}; background: ${balanceDue > 0 ? '#FEF2F2' : '#F0FDF4'}; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 12px; }
            @media print { body { padding: 0; } @page { margin: 1.5cm; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${settings.organization_name || 'Hostel Management'}</h1>
            ${location.address ? `<p>${location.address}</p>` : ''}
            ${(location.contactPhone || location.contactEmail) ? `<p>${location.contactPhone ? `Phone: ${location.contactPhone}` : ''}${location.contactPhone && location.contactEmail ? ' | ' : ''}${location.contactEmail ? `Email: ${location.contactEmail}` : ''}</p>` : ''}
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
            <div class="summary-row paid" style="padding: 6px 4px;">
              <span>Paid Amount</span>
              <span>Rs. ${paidAmount.toLocaleString()}</span>
            </div>
            <div class="summary-row due">
              <span>Balance Due</span>
              <span>Rs. ${balanceDue.toLocaleString()}</span>
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

    printWindow.onafterprint = () => {
      printWindow.close();
    };

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };




  const columns: Column<any>[] = [
    {
      header: "Slip No",
      accessorKey: "slipNo",
      sortable: true,
      cell: (item) => <div className="font-medium text-slate-900">{item.slipNo}</div>,
    },
    {
      header: "Tenant",
      sortable: true,
      accessorKey: "tenant.name" as any, // Simple path matching if DataTable supports it, otherwise generic accessor
      cell: (item) => <div className="text-slate-700">{item.tenant?.name || "N/A"}</div>,
    },
    {
      header: "Room",
      cell: (item) => <div className="text-slate-500">{item.tenant?.room?.roomNumber || "N/A"}</div>,
    },
    {
      header: "Total",
      accessorKey: "amount",
      sortable: true,
      cell: (item) => <div className="text-slate-700 font-medium">Rs. {item.amount}</div>,
    },
    {
      header: "Paid",
      accessorKey: "paidAmount",
      sortable: true,
      cell: (item) => <div className="text-emerald-600 font-medium">Rs. {item.paidAmount || 0}</div>,
    },
    {
      header: "Balance",
      cell: (item) => {
        const bal = item.amount - (item.paidAmount || 0);
        return <div className={`font-medium ${bal > 0 ? 'text-red-600' : 'text-slate-500'}`}>Rs. {bal}</div>;
      },
    },
    {
      header: "Month",
      cell: (item) => <div className="text-slate-500">{item.month} {item.year}</div>,
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (item) => {
        let color = "bg-amber-50 text-amber-600";
        if (item.status === "Paid") color = "bg-emerald-50 text-emerald-600";
        if (item.status === "Partial") color = "bg-blue-50 text-blue-600";
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
            {item.status}
          </span>
        );
      },
    },
    {
      header: "Actions",
      cell: (item) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePrintFeeSlip(item)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Print Fee Slip"
          >
            <Printer size={18} />
          </button>
          <button
            onClick={() => {
              setSelectedFee(item);
              setIsInvoiceModalOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Invoice"
          >
            <Eye size={18} />
          </button>
          {item.status !== "Paid" && (
            <button
              onClick={() => {
                setSelectedFee(item);
                setPaymentData(prev => ({ ...prev, amount: String(item.amount - (item.paidAmount || 0)) }));
                setIsCollectModalOpen(true);
              }}
              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Collect Payment"
            >
              <CreditCard size={18} />
            </button>
          )}
           {canDelete && (
          <button
            onClick={() => {
              setSelectedFee(item);
              setIsDeleteModalOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Record"
          >
            <Trash2 size={18} />
          </button>
           )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hostel Fee Management</h1>
          <p className="text-sm text-slate-500 mt-1">Track and collect fees from hostel tenants.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl transition-colors shadow-sm font-medium"
          >
            <RefreshCw size={18} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setIsGenModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium"
          >
            <FilePlus size={18} />
            <span>Generate Fees</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-2">
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-sm"
        >
          <option value="All">All Months</option>
          {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-sm"
        >
          <option value="All">All Years</option>
          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        searchKeys={["slipNo"]}
      />

      {isGenModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Generate Monthly Fees</h2>
              <button onClick={() => setIsGenModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleGenerateFees} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={genData.month}
                    onChange={(e) => setGenData({ ...genData, month: e.target.value })}
                  >
                    {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={genData.year}
                    onChange={(e) => setGenData({ ...genData, year: e.target.value })}
                  >
                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100">
                This will generate fee records for all active tenants who don't already have a fee for the selected month.
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsGenModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-4 py-2 bg-[#1D4ED8] text-white hover:bg-blue-700 rounded-xl transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {isGenerating ? "Generating..." : "Generate Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCollectModalOpen && selectedFee && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-slate-900">Add Payment</h2>
              <button onClick={() => setIsCollectModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCollectFee} className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">Tenant:</span>
                  <span className="font-medium text-slate-900">{selectedFee.tenant?.name}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">Slip No:</span>
                  <span className="font-medium text-slate-900">{selectedFee.slipNo}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">Total:</span>
                  <span className="font-medium text-slate-900">Rs. {selectedFee.amount}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">Paid:</span>
                  <span className="font-medium text-emerald-600">Rs. {selectedFee.paidAmount || 0}</span>
                </div>
                <div className="flex justify-between font-medium border-t border-slate-200 pt-1 mt-1">
                  <span className="text-slate-700">Balance:</span>
                  <span className="text-red-600">Rs. {selectedFee.amount - (selectedFee.paidAmount || 0)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (PKR)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={paymentData.paymentDate}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              {paymentData.paymentMethod !== "cash" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Bank</label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={paymentData.bankId}
                      onChange={(e) => setPaymentData({ ...paymentData, bankId: e.target.value })}
                    >
                      <option value="">Select destination bank...</option>
                      {banks.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.bankName} ({bank.accountNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Transaction ID</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={paymentData.transactionId}
                      onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  value={paymentData.note}
                  onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Proof (Screenshot)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setPaymentProofImage(e.target.files[0]);
                    }
                  }}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {isSaving ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteFee}
          title="Delete Fee Record"
          message="Are you sure you want to delete this fee record? This action cannot be undone."
        />
      )}

      <HostelFeeInvoiceModal
        show={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        fee={selectedFee}
        settings={orgSettings}
        location={orgLocation}
      />
    </div>
  );
}
