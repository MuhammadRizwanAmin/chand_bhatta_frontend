import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreVertical, Eye, DollarSign, RotateCcw,Trash2, Receipt, Edit, CreditCard } from 'lucide-react';
import { AddPaymentModal } from './AddPaymentModal';
import { InvoiceModal } from '../../components/InvoiceModal';
import { ReturnSaleItemsModal } from './ReturnSaleItemsModal';
import { usePermissions } from '../../hooks/usePermissions';

interface Payment { id: number; method: string; amount: number; bankId?: number; transactionId?: string; note?: string; date?: string; }

interface Props {
  sale: any;
  onView: (sale: any) => void;
  onDelete?: (id: number) => void;
  onPaymentSuccess?: () => void;
  onReturnSuccess?: () => void;
  onEditPayment?: (payment: Payment) => void;
  onDeletePayment?: (payment: Payment) => void;
}

export function SalesActionMenu({ sale, onView, onDelete, onPaymentSuccess, onReturnSuccess, onEditPayment, onDeletePayment }: Props) {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentsListOpen, setPaymentsListOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const { canEdit, canDelete } = usePermissions();


  // Adapt sale → booking shape that InvoiceModal / templates understand
  const saleAsBooking = {
    id: sale.id,
    refno: sale.prefix,
    channel: 'POS Sale',
    reservationId: sale.reservationId,
    createdAt: sale.createdAt,
    updatedAt: sale.createdAt,
    totalAmount: sale.totalAmount,
    advancePaid: sale.advancePaid,
    balanceAmount: sale.balanceAmount,
    discount: sale.discount || 0,
    discountType: sale.discountType || 'percentage',
    taxAmount: sale.taxPercentage || 0,
    saleTaxValue: sale.taxAmount || 0,
    customer: {
      name: sale.customerName || sale.Reservation?.customer?.name || 'Walk-in Customer',
      phone: sale.customerPhone || sale.Reservation?.customer?.phone || '',
      email: sale.customerEmail || sale.Reservation?.customer?.email || '',
      cnic: sale.customerCnic || sale.Reservation?.customer?.cnic || '',
      address: sale.customerAddress || sale.Reservation?.customer?.address || '',
    },
    rooms: [],          // POS sales have no rooms
    trips: [],          // POS sales have no trips
    extras: [],         // no reservation extras
    customExtras: (sale.items || []).map((item: any) => ({
      name: item.name || item.extra?.name || 'Item',
      price: item.price,
      quantity: item.quantity,
      totalPrice: item.totalPrice,
      createdAt: sale.createdAt,
    })),
    payments: sale.payments || [],
  };

  const btnClass = 'w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer outline-none';
  const payments: Payment[] = sale.payments || [];

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
            <MoreVertical size={18} />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={5} className="bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-[9999] min-w-[180px]">
            <DropdownMenu.Item className={btnClass} onSelect={() => onView(sale)}>
              <Eye size={16} /> View Details
            </DropdownMenu.Item>
    {Number(sale.balanceAmount) > 0 && (
      <DropdownMenu.Item
        className={btnClass}
        onSelect={() => setPaymentOpen(true)}
      >
        <DollarSign size={16} />
        Add Payment
      </DropdownMenu.Item>
    )}
            {/* {payments.length > 0 && (
              <DropdownMenu.Item className={btnClass} onSelect={() => setPaymentsListOpen(true)}>
                <CreditCard size={16} /> View Payments
              </DropdownMenu.Item>
            )} */}

            <DropdownMenu.Item className={btnClass} onSelect={() => setInvoiceOpen(true)}>
              <Receipt size={16} /> Invoice / Receipt
            </DropdownMenu.Item>

            {sale.returnStatus !== 'Full' && (
              <DropdownMenu.Item className={btnClass} onSelect={() => setReturnOpen(true)}>
                <RotateCcw size={16} className="text-red-600" /> <span className="text-red-600">Return Items</span>
              </DropdownMenu.Item>
            )}

            <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />
 {canDelete && (
            <DropdownMenu.Item
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer outline-none"
              onSelect={() => onDelete?.(sale.id)}
            >
              <Trash2 size={16} /> Delete Sale
            </DropdownMenu.Item>

 )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <AddPaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        sale={sale}
        onSuccess={onPaymentSuccess}
      />

      <InvoiceModal
        isOpen={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        booking={saleAsBooking}
      />

      <ReturnSaleItemsModal
        isOpen={returnOpen}
        onClose={() => setReturnOpen(false)}
        sale={sale}
        onSuccess={onReturnSuccess}
      />

      {/* Payments List Mini-Modal */}
      {paymentsListOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPaymentsListOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 bg-[#0F172A]">
              <div>
                <h3 className="font-semibold text-white">Payment History</h3>
                <p className="text-white/60 text-xs mt-0.5">{sale.prefix} · {payments.length} payment{payments.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setPaymentsListOpen(false)} className="p-1.5 text-gray-400 hover:text-white rounded-lg">✕</button>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">PKR {Number(p.amount).toLocaleString()}</div>
                    <div className="text-xs text-gray-500 capitalize mt-0.5">{p.method}{p.date ? ` · ${new Date(p.date).toLocaleDateString('en-PK', { day:'2-digit', month:'short' })}` : ''}</div>
                    {p.transactionId && <div className="text-xs text-gray-400 font-mono">{p.transactionId}</div>}
                  </div>
                  <div className="flex items-center gap-1">
                    {onEditPayment && canEdit && (
                      <button onClick={() => { setPaymentsListOpen(false); onEditPayment(p); }}
                        className="p-1.5 text-gray-400 hover:text-[#1D4ED8] hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Edit size={14} />
                      </button>
                    )}
                    {onDeletePayment && canDelete && (
                      <button onClick={() => { setPaymentsListOpen(false); onDeletePayment(p); }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t bg-gray-50 flex justify-between items-center">
              <span className="text-xs text-gray-500">Total Paid: <strong className="text-gray-900">PKR {payments.reduce((s, p) => s + Number(p.amount), 0).toLocaleString()}</strong></span>
              <button onClick={() => setPaymentsListOpen(false)} className="px-4 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-white">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}