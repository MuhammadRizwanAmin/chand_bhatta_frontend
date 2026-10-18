import { useState } from 'react';
import { X, Receipt } from 'lucide-react';
import { Sale } from './types';
import { InvoiceModal } from '../../components/InvoiceModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

export function ViewSaleModal({ isOpen, onClose, sale }: Props) {
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  if (!isOpen || !sale) return null;

  // Adapt sale → booking shape for InvoiceModal
  const saleAsBooking = {
    id: sale.id,
    refno: sale.prefix,
    channel: 'POS Sale',
    createdAt: sale.createdAt,
    updatedAt: sale.createdAt,
    totalAmount: sale.totalAmount,
    advancePaid: sale.advancePaid,
    balanceAmount: sale.balanceAmount,
    discount: (sale as any).discount || 0,
    discountType: (sale as any).discountType || 'percentage',
    taxAmount: (sale as any).taxPercentage || 0,
    saleTaxValue: (sale as any).taxAmount || 0,
    customer: {
      name: sale.customerName || 'Walk-in Customer',
      phone: sale.customerPhone || '',
      email: (sale as any).customerEmail || '',
      cnic: (sale as any).customerCnic || '',
      address: (sale as any).customerAddress || '',
    },
    rooms: [],
    trips: [],
    extras: [],
    customExtras: (sale.items || []).map((item: any) => ({
      name: item.name || item.extra?.name || 'Item',
      price: item.price,
      quantity: item.quantity,
      returnedQuantity: item.returnedQuantity,
      totalPrice: item.totalPrice,
      createdAt: sale.createdAt,
    })),
    payments: sale.payments || [],
  };

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A]">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Sale Details
                <span className="text-sm font-mono text-white/50 ml-1">#{sale.prefix}</span>
              </h2>
              <p className="text-sm text-white/50 mt-0.5">
                {new Date(sale.createdAt).toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setInvoiceOpen(true)}
                className="flex items-center gap-2 bg-[#D4A017] hover:bg-[#B8860B] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                <Receipt size={16} /> Invoice
              </button>
              <button
                onClick={onClose}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Info Grid */}
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Customer</p>
                  <p className="font-semibold text-gray-900">{sale.customerName || 'Walk-in'}</p>
                  {sale.customerPhone && <p className="text-gray-500 text-xs mt-0.5">{sale.customerPhone}</p>}
                </div>

                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Payment Method</p>
                  <p className="font-semibold text-gray-900 capitalize">{sale.paymentMethod}</p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Payment Status</p>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                    sale.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                    sale.paymentStatus === 'Partial' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {sale.paymentStatus}
                  </span>
                </div>

                {(sale as any).returnStatus && (sale as any).returnStatus !== 'None' && (
                  <div>
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Return Status</p>
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                      {(sale as any).returnStatus === 'Full' ? 'Fully Returned' : 'Partial Return'}
                    </span>
                  </div>
                )}

                {sale.reservationId && (
                  <div>
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Linked Reservation</p>
                    <p className="font-semibold text-indigo-600">#{sale.Reservation?.refno || sale.reservationId}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#0F172A] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Unit Price</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Qty</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Returned</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {sale.items?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {item.name || item.extra?.name || 'Custom Item'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        PKR {Number(item.price).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-center text-red-500 font-semibold">
                        {item.returnedQuantity || 0}
                      </td>
                      <td className="px-4 py-3 font-semibold text-right text-gray-900">
                        PKR {Number(item.totalPrice).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  {Number((sale as any).taxAmount) > 0 && (
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td colSpan={4} className="px-4 py-3 text-right font-semibold text-gray-700">Tax</td>
                      <td className="px-4 py-3 font-bold text-right text-gray-900">
                        PKR {Number((sale as any).taxAmount).toLocaleString()}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td colSpan={4} className="px-4 py-3 text-right font-semibold text-gray-700">Grand Total</td>
                    <td className="px-4 py-3 font-bold text-right text-[#1D4ED8] text-base">
                      PKR {Number(sale.totalAmount).toLocaleString()}
                    </td>
                  </tr>
                  {Number(sale.advancePaid) > 0 && (
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="px-4 py-2 text-right text-sm text-gray-500">Total Paid</td>
                      <td className="px-4 py-2 text-right text-sm font-semibold text-emerald-600">
                        PKR {Number(sale.advancePaid).toLocaleString()}
                      </td>
                    </tr>
                  )}
                  {Number((sale as any).refundAmount) > 0 && (
                    <tr className="bg-red-50">
                      <td colSpan={4} className="px-4 py-2 text-right text-sm text-red-600 font-semibold">Total Refunded</td>
                      <td className="px-4 py-2 text-right text-sm font-bold text-red-600">
                        PKR {Number((sale as any).refundAmount).toLocaleString()}
                      </td>
                    </tr>
                  )}
                  {Number(sale.balanceAmount) > 0 && !sale.reservationId && (
                    <tr className="bg-red-50">
                      <td colSpan={4} className="px-4 py-2 text-right text-sm text-red-600 font-semibold">Balance Due</td>
                      <td className="px-4 py-2 text-right text-sm font-bold text-red-600">
                        PKR {Number(sale.balanceAmount).toLocaleString()}
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={() => setInvoiceOpen(true)}
              className="flex items-center gap-2 text-[#D4A017] hover:text-[#B8860B] font-semibold text-sm transition-colors"
            >
              <Receipt size={16} /> Print Invoice
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-gray-200 hover:bg-white text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        booking={saleAsBooking}
      />
    </>
  );
}