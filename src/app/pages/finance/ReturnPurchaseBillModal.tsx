import { useState, useEffect } from 'react';
import { X, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { billService } from '../../services/billService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bill: any;
  onSuccess?: () => void;
}

export function ReturnPurchaseBillModal({ isOpen, onClose, bill, onSuccess }: Props) {
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
      billService.getBanks().then(setBanks).catch(() => {});
    }
  }, [isOpen, bill]);

  if (!isOpen || !bill) return null;

  const billItems: any[] = bill.items || bill.billItems || [];

  const handleReturnQtyChange = (itemId: number, qty: string, maxQty: number) => {
    const val = parseFloat(qty);
    if (isNaN(val) || val < 0) {
      const newItems = { ...returnItems };
      delete newItems[itemId];
      setReturnItems(newItems);
      return;
    }
    setReturnItems(prev => ({ ...prev, [itemId]: Math.min(val, maxQty) }));
  };

  const handleReturn = async () => {
    const itemsToReturn = Object.entries(returnItems)
      .map(([id, qty]) => ({ billItemId: Number(id), returnQty: qty }))
      .filter(item => item.returnQty > 0);

    if (itemsToReturn.length === 0) {
      toast.error('Please enter at least one item to return');
      return;
    }

    if (['bank', 'card'].includes(refundMethod) && !bankId) {
      toast.error('Please select a bank account for the refund');
      return;
    }

    setSaving(true);
    try {
      await billService.returnItems({
        billId: bill.id,
        returnItems: itemsToReturn,
        refundMethod,
        bankId: bankId ? Number(bankId) : undefined,
      });
      toast.success('Purchase items returned successfully');
      onSuccess?.();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to return items');
    } finally {
      setSaving(false);
    }
  };

  // Calculate expected refund value
  let expectedRefund = 0;
  billItems.forEach((item: any) => {
    const qty = returnItems[item.id] || 0;
    if (qty > 0) {
      const unitPrice = Number(item.unitPrice || item.costPrice || 0);
      const taxRate = Number(item.taxRate || 0) / 100;
      expectedRefund += unitPrice * qty * (1 + taxRate);
    }
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A]">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <RotateCcw size={18} /> Return Purchase Items
            </h2>
            <p className="text-white/60 text-xs mt-0.5">
              Bill #{bill.id} · {bill.supplier?.name || 'Supplier'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="max-h-64 overflow-y-auto mb-4 border border-gray-200 rounded-lg">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold text-right">Unit Price</th>
                  <th className="px-4 py-3 font-semibold text-center">Qty Bought</th>
                  <th className="px-4 py-3 font-semibold text-center">Returned</th>
                  <th className="px-4 py-3 font-semibold text-center">Return Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {billItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">
                      No items found on this bill.
                    </td>
                  </tr>
                ) : (
                  billItems.map((item: any) => {
                    const maxReturnable = Number(item.qty || item.quantity || 0) - Number(item.returnedQty || 0);
                    const isReturnable = maxReturnable > 0;
                    const itemName = item.item?.title || item.inventory?.title || item.name || '—';
                    return (
                      <tr key={item.id} className={!isReturnable ? 'bg-gray-50 opacity-60' : ''}>
                        <td className="px-4 py-3 font-medium text-gray-900">{itemName}</td>
                        <td className="px-4 py-3 text-right">
                          ₨ {Number(item.unitPrice || item.costPrice || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">{Number(item.qty || item.quantity || 0)}</td>
                        <td className="px-4 py-3 text-center text-red-500 font-semibold">
                          {Number(item.returnedQty || 0)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={maxReturnable}
                            step="1"
                            value={returnItems[item.id] === undefined ? '' : returnItems[item.id]}
                            onChange={e => handleReturnQtyChange(item.id, e.target.value, maxReturnable)}
                            disabled={!isReturnable}
                            className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-[#1D4ED8] focus:border-[#1D4ED8] disabled:bg-gray-100"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Refund summary */}
          <div className="bg-orange-50 text-orange-800 p-4 rounded-xl flex justify-between items-center mb-6">
            <span className="font-semibold text-sm">Estimated Refund (incl. tax):</span>
            <span className="text-xl font-bold">₨ {expectedRefund.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>

          {/* Refund method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Refund Method (from Supplier)
              </label>
              <select
                value={refundMethod}
                onChange={e => {
                  setRefundMethod(e.target.value);
                  if (!['bank', 'card'].includes(e.target.value)) setBankId('');
                }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
                <option value="card">Card</option>
              </select>
            </div>
            {['bank', 'card'].includes(refundMethod) && (
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

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button
            onClick={handleReturn}
            disabled={saving || expectedRefund === 0}
            className="flex items-center gap-2 px-5 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
            {saving ? 'Processing...' : 'Process Return'}
          </button>
        </div>
      </div>
    </div>
  );
}
