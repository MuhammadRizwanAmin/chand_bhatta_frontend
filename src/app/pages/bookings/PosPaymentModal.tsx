import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { X, Upload, ShoppingCart, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface PosPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  posTotal: number;
  posBalance: number;
  onSuccess?: () => void;
}

export function PosPaymentModal({
  isOpen,
  onClose,
  booking,
  posTotal,
  posBalance,
  onSuccess,
}: PosPaymentModalProps) {
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toLocaleDateString('en-CA'));
  const [method, setMethod] = useState<string>('cash');
  const [bankId, setBankId] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImageFile, setIsImageFile] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banksList, setBanksList] = useState<any[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount(posBalance > 0 ? posBalance : '');
      setMethod('cash');
      setBankId('');
      setTransactionId('');
      setNote('');
      setProofImage(null);
      setPreviewUrl(null);
      setError(null);

      setBanksLoading(true);
      api.get('/banks')
        .then(res => setBanksList(res.data || []))
        .catch(() => setBanksList([]))
        .finally(() => setBanksLoading(false));
    }
  }, [isOpen, posBalance]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofImage(file);
      const isImg = file.type.startsWith('image/');
      setIsImageFile(isImg);
      setPreviewUrl(isImg ? URL.createObjectURL(file) : file.name);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const entered = Number(e.target.value);
    if (entered > posBalance) {
      setAmount(posBalance);
      setError('Payment cannot exceed current POS balance!');
    } else {
      setAmount(entered || '');
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }
    if (!method) {
      setError('Please select a payment method');
      return;
    }
    if ((method === 'card' || method === 'bank') && !transactionId) {
      setError('Please provide a transaction ID for card/bank payments');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('amount', String(amount));
      formData.append('method', method);
      formData.append('date', paymentDate);
      if (bankId) formData.append('bankId', bankId);
      if (transactionId) formData.append('transactionId', transactionId);
      if (note) formData.append('note', note);
      if (proofImage) {
        formData.append('proofImage', proofImage);
      }

      const bookingId = booking.dbId || booking.id;
      await api.post(`/reservation/${bookingId}/pos-payment`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('POS payment added successfully');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('POS Payment failed', err);
      setError(err.response?.data?.message || 'Failed to process POS payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ zIndex: 99999 }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Add POS Payment</h2>
              <p className="text-xs text-gray-500">Booking #{booking?.refno || booking?.id} • POS Items & Services</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
              {error}
            </div>
          )}

          {/* Balance Summary */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">POS Total Amount</p>
              <p className="text-base font-bold text-gray-900">PKR {Number(posTotal).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">POS Pending Amount</p>
              <p className={`text-xl font-black ${posBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                PKR {Number(posBalance).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">Payment Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">PKR</span>
                <input
                  type="number"
                  value={amount}
                  onChange={handleAmountChange}
                  className="w-full pl-12 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                  placeholder="0.00"
                  max={posBalance}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: 'Cash' },
                { id: 'card', label: 'Card' },
                { id: 'bank', label: 'Bank Transfer' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMethod(opt.id)}
                  className={`py-2 px-2 text-sm font-medium rounded-lg border transition-all text-center ${method === opt.id ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {(method === 'card' || method === 'bank') && (
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Select Bank</label>
                <select
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                  disabled={banksLoading}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white disabled:opacity-60"
                >
                  <option value="">{banksLoading ? 'Loading banks...' : '-- Select Bank --'}</option>
                  {banksList.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} – {b.accountTitle}{b.accountNumber ? ` (${b.accountNumber})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Transaction ID</label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g. TXN-123456"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Notes (Optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm"
              rows={2}
              placeholder="e.g. Payment for room service drinks & snacks..."
            />
          </div>

          <div className="flex flex-col gap-1.5 mb-2">
            <label className="text-sm font-semibold text-gray-700">Payment Proof (Optional)</label>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-6 h-6 mb-2 text-gray-400" />
                <p className="text-xs text-gray-500"><span className="font-semibold text-blue-600">Click to upload</span> receipt or screenshot (JPG, PNG, PDF)</p>
              </div>
              <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={handleImageChange} />
            </label>

            {previewUrl && (
              <div className="mt-3 relative rounded-lg overflow-hidden border border-gray-200">
                {isImageFile ? (
                  <img src={previewUrl} alt="Proof" className="w-full h-32 object-contain bg-gray-50" />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-blue-50">
                    <span className="text-blue-600 text-2xl">📄</span>
                    <span className="text-sm text-gray-700 truncate">{previewUrl}</span>
                  </div>
                )}
                <button
                  onClick={() => { setProofImage(null); setPreviewUrl(null); }}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm POS Payment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
