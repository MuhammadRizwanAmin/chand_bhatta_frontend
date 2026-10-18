import { useState, useEffect } from 'react';
import { X, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { salesService } from '../../services/sales/salesService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sale: any;
  onSuccess?: () => void;
}

export function ReturnSaleItemsModal({ isOpen, onClose, sale, onSuccess }: Props) {
  const [returnItems, setReturnItems] = useState<Record<number, number>>({});
  const [refundMethod, setRefundMethod] = useState('cash');
  const [bankId, setBankId] = useState('');
  const [banks, setBanks] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReturnItems({});
      setRefundMethod('cash');
      setBankId('');
      salesService.getBanks().then(setBanks).catch(() => {});
    }
  }, [isOpen, sale]);

  if (!isOpen || !sale) return null;

  const handleReturnQtyChange = (itemId: number, qty: string, maxQty: number) => {
    const val = parseInt(qty, 10);
    if (isNaN(val) || val < 0) {
      const newItems = { ...returnItems };
      delete newItems[itemId];
      setReturnItems(newItems);
      return;
    }
    if (val > maxQty) {
      setReturnItems(prev => ({ ...prev, [itemId]: maxQty }));
      return;
    }
    setReturnItems(prev => ({ ...prev, [itemId]: val }));
  };

  const handleReturn = async () => {
    const itemsToReturn = Object.entries(returnItems)
      .map(([id, qty]) => ({ saleItemId: Number(id), returnQty: qty }))
      .filter(item => item.returnQty > 0);

    if (itemsToReturn.length === 0) {
      toast.error('Please enter at least one item to return');
      return;
    }

    if (['bank', 'card', 'cheque'].includes(refundMethod) && !bankId) {
      toast.error('Please select a bank account for the refund');
      return;
    }

    setSaving(true);
    try {
      await salesService.returnItems({
        saleId: sale.id,
        returnItems: itemsToReturn,
        refundMethod,
        bankId: bankId ? Number(bankId) : undefined,
      });
      toast.success('Items returned successfully');
      onSuccess?.();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to return items');
    } finally {
      setSaving(false);
    }
  };

  // Calculate expected refund
  let expectedRefund = 0;
  sale.items?.forEach((item: any) => {
    const qty = returnItems[item.id] || 0;
    if (qty > 0) {
      const discountPerUnit = (Number(item.discount) || 0) / (item.quantity || 1);
      expectedRefund += Math.max(0, (item.price * qty) - (discountPerUnit * qty));
    }
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A]">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <RotateCcw size={18} /> Return POS Items
            </h2>
            <p className="text-white/60 text-xs mt-0.5">
              {sale.prefix} · {sale.customerName || 'Walk-in'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <div className="max-h-60 overflow-y-auto mb-4 border border-gray-200 rounded-lg">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold text-right">Price</th>
                  <th className="px-4 py-3 font-semibold text-center">Purchased</th>
                  <th className="px-4 py-3 font-semibold text-center">Returned</th>
                  <th className="px-4 py-3 font-semibold text-center">Return Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sale.items?.map((item: any) => {
                  const maxReturnable = (item.quantity || 0) - (item.returnedQuantity || 0);
                  const isReturnable = maxReturnable > 0;
                  return (
                    <tr key={item.id} className={!isReturnable ? 'bg-gray-50 opacity-60' : ''}>
                      <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-right">PKR {Number(item.price).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-center text-red-500 font-semibold">{item.returnedQuantity || 0}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max={maxReturnable}
                          value={returnItems[item.id] === undefined ? '' : returnItems[item.id]}
                          onChange={e => handleReturnQtyChange(item.id, e.target.value, maxReturnable)}
                          disabled={!isReturnable}
                          className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:ring-[#1D4ED8] focus:border-[#1D4ED8]"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex justify-between items-center mb-6">
            <span className="font-semibold text-sm">Calculated Refund Value:</span>
            <span className="text-xl font-bold">PKR {expectedRefund.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Refund Method</label>
              <select
                value={refundMethod}
                onChange={e => {
                  setRefundMethod(e.target.value);
                  if (!['bank', 'card', 'cheque'].includes(e.target.value)) setBankId('');
                }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
                <option value="card">Card Refund</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            {['bank', 'card', 'cheque'].includes(refundMethod) && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bank Account</label>
                <select
                  value={bankId}
                  onChange={e => setBankId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                >
                  <option value="">— Select Bank —</option>
                  {banks.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} {b.accountTitle ? `(${b.accountTitle})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button
            onClick={handleReturn}
            disabled={saving || expectedRefund === 0}
            className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
            {saving ? 'Processing...' : 'Process Return'}
          </button>
        </div>
      </div>
    </div>
  );
}
