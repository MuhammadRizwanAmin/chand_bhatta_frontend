
import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  DollarSign,
} from 'lucide-react';

import { salesService } from '../../services/sales/salesService';
import { Sale, Bank } from './types';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale;
  onSuccess?: () => void;
}

export function AddPaymentModal({
  isOpen,
  onClose,
  sale,
  onSuccess,
}: AddPaymentModalProps) {
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] =
    useState<string>(
      new Date().toLocaleDateString('en-CA')
    );

  const [method, setMethod] =
    useState<string>('');

  const [bankId, setBankId] =
    useState<string>('');

  const [transactionId, setTransactionId] =
    useState<string>('');

  const [note, setNote] =
    useState<string>('');

  const [proofImage, setProofImage] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  const [banks, setBanks] = useState<Bank[]>(
    []
  );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const rawTotalAmount =
    Number(sale?.totalAmount || 0);

  const rawPaidAmount =
    Number(sale?.advancePaid || 0);

  const balance =
    sale?.balanceAmount !== undefined
      ? Number(sale.balanceAmount)
      : Math.max(
          0,
          rawTotalAmount - rawPaidAmount
        );

  useEffect(() => {
    if (!isOpen) return;

    setAmount('');
    setMethod('');
    setBankId('');
    setTransactionId('');
    setNote('');
    setProofImage(null);
    setPreviewUrl(null);
    setError(null);

    loadBanks();
  }, [isOpen]);

  const loadBanks = async () => {
    try {
      const data =
        await salesService.getBanks();

      setBanks(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (
      e.target.files &&
      e.target.files[0]
    ) {
      const file = e.target.files[0];

      setProofImage(file);

      setPreviewUrl(
        URL.createObjectURL(file)
      );
    }
  };

  const handleAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const entered = Number(
      e.target.value
    );

    if (entered > balance) {
      setAmount(balance);

      setError(
        'Payment cannot exceed current balance!'
      );
    } else {
      setAmount(entered || '');

      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      setError(
        'Please enter a valid payment amount'
      );

      return;
    }

    if (!method) {
      setError(
        'Please select a payment method'
      );

      return;
    }

    if (
      (method === 'card' ||
        method === 'bank') &&
      !transactionId
    ) {
      setError(
        'Please provide a transaction ID'
      );

      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { default: api } =
        await import(
          '../../services/api'
        );

      const formData = new FormData();

      formData.append(
        'amount',
        String(amount)
      );

      formData.append(
        'method',
        method
      );

      formData.append(
        'date',
        paymentDate
      );

      if (bankId) {
        formData.append(
          'bankId',
          bankId
        );
      }

      if (transactionId) {
        formData.append(
          'transactionId',
          transactionId
        );
      }

      if (note) {
        formData.append(
          'note',
          note
        );
      }

      if (proofImage) {
        formData.append(
          'proofImage',
          proofImage
        );
      }

      await api.post(
        `/sales/${sale.id}/payment`,
        formData,
        {
          headers: {
            'Content-Type':
              'multipart/form-data',
          },
        }
      );

      onSuccess?.();

      onClose();
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          'Failed to process payment'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      style={{ zIndex: 99999 }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <DollarSign size={20} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Add Payment
              </h2>

              <p className="text-xs text-gray-500">
                Sale #
                {sale?.prefix ||
                  sale?.id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Total
                </p>

                <p className="font-bold">
                  PKR{' '}
                  {rawTotalAmount.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Paid
                </p>

                <p className="font-bold text-green-600">
                  PKR{' '}
                  {rawPaidAmount.toLocaleString()}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Balance
                </p>

                <p className="text-xl font-black text-red-600">
                  PKR{' '}
                  {balance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-sm font-semibold">
                Payment Amount
              </label>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  PKR
                </span>

                <input
                  type="number"
                  value={amount}
                  onChange={
                    handleAmountChange
                  }
                  className="w-full pl-12 pr-3 py-2.5 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-sm font-semibold">
                Date
              </label>

              <input
                type="date"
                value={paymentDate}
                onChange={(e) =>
                  setPaymentDate(
                    e.target.value
                  )
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold">
              Payment Method
            </label>

            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: 'cash',
                  label: 'Cash',
                },
                {
                  id: 'card',
                  label: 'Card',
                },
                {
                  id: 'bank',
                  label: 'Bank Transfer',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() =>
                    setMethod(opt.id)
                  }
                  className={`py-2 px-2 text-sm font-medium rounded-lg border transition-all ${
                    method === opt.id
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {(method === 'card' ||
            method === 'bank') && (
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex-1">
                <label className="text-sm font-semibold">
                  Bank
                </label>

                <select
                  value={bankId}
                  onChange={(e) =>
                    setBankId(
                      e.target.value
                    )
                  }
                  className="w-full mt-1 px-3 py-2.5 border border-gray-300 rounded-lg"
                >
                  <option value="">
                    Select Bank
                  </option>

                  {banks.map((b) => (
                    <option
                      key={b.id}
                      value={b.id}
                    >
                      {b.bankName} (
                      {b.accountTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="text-sm font-semibold">
                  Transaction ID
                </label>

                <input
                  type="text"
                  value={
                    transactionId
                  }
                  onChange={(e) =>
                    setTransactionId(
                      e.target.value
                    )
                  }
                  className="w-full mt-1 px-3 py-2.5 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}

          <textarea
            rows={3}
            value={note}
            onChange={(e) =>
              setNote(
                e.target.value
              )
            }
            placeholder="Payment notes..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none min-h-[80px]"
          />

          <div>
            <label className="text-sm font-semibold">
              Payment Proof
            </label>

            <label className="mt-2 flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50">
              <Upload className="w-6 h-6 text-gray-400 mb-2" />

              <span className="text-xs text-gray-500">
                Click to upload
              </span>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={
                  handleImageChange
                }
              />
            </label>

            {previewUrl && (
              <div className="mt-3 relative rounded-lg overflow-hidden border">
                <img
                  src={previewUrl}
                  alt="Proof"
                  className="w-full h-32 object-contain bg-gray-50"
                />

                <button
                  onClick={() => {
                    setProofImage(
                      null
                    );

                    setPreviewUrl(
                      null
                    );
                  }}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60"
          >
            {loading
              ? 'Processing...'
              : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}
