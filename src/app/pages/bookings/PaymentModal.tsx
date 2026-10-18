import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { X, Upload, DollarSign, Image as ImageIcon } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onSuccess?: () => void;
}

export function PaymentModal({ isOpen, onClose, booking, onSuccess }: PaymentModalProps) {
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toLocaleDateString("en-CA"));
  const [method, setMethod] = useState<string>('');
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
  const isHalfDay = booking?.status === 'half_day';
  const [markCheckedOut, setMarkCheckedOut] = useState<boolean>(false);

  // Parse amounts safely
  const rawTotalAmount = booking?.totalAmount || 0;
  const rawAdvance = booking?.advancePaid || 0;
  // If balanceAmount is missing, fallback to total - advance
  const balance = booking?.balanceAmount1 !== undefined ? booking.balanceAmount1 : Math.max(0, rawTotalAmount - rawAdvance);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setMethod('');
      setBankId('');
      setTransactionId('');
      setNote('');
      setProofImage(null);
      setPreviewUrl(null);
      setError(null);
      setMarkCheckedOut(booking?.status === 'half_day');
      // Fetch banks dynamically
      setBanksLoading(true);
      api.get('/banks')
        .then(res => setBanksList(res.data || []))
        .catch(() => setBanksList([]))
        .finally(() => setBanksLoading(false));
    }
  }, [isOpen, booking]);

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
    if (entered > balance) {
      setAmount(balance);
      setError("Payment cannot exceed current balance!");
    } else {
      setAmount(entered || '');
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!amount || amount <= 0) {
      setError("Please enter a valid payment amount");
      return;
    }
    if (!method) {
      setError("Please select a payment method");
      return;
    }
    if ((method === "card" || method === "bank") && !transactionId) {
      setError("Please provide a transaction ID for card/bank payments");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // api already imported at top
      
      const formData = new FormData();
      formData.append("amount", String(amount));
      formData.append("method", method);
      formData.append("date", paymentDate);
      if (bankId) formData.append("bankId", bankId);
      if (transactionId) formData.append("transactionId", transactionId);
      if (note) formData.append("note", note);
      if (markCheckedOut) formData.append("markCheckedOut", "true");
      
      // We don't have currentUser.id in this simple component, so we omit or mock it
      // formData.append("paidByUserId", currentUser?.id);
      
      if (proofImage) {
        formData.append("proofImage", proofImage);
      }

      const bookingId = booking.dbId || booking.id;
      // Using put/post based on standard - the user code had POST /api/reservation/:id/payment
      await api.post(`/reservation/${bookingId}/payment`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Payment failed", err);
      setError(err.response?.data?.message || "Failed to process payment. Please try again.");
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
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Add Payment</h2>
              <p className="text-xs text-gray-500">Booking #{booking?.refno || booking?.id}</p>
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
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Amount</p>
              <p className="text-base font-bold text-gray-900">PKR {Number(rawTotalAmount).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Balance</p>
              <p className="text-xl font-black text-red-600">PKR {Number(balance).toLocaleString()}</p>
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
                  className="w-full pl-12 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="0.00"
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
                { id: 'bank', label: 'Bank Transfer' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setMethod(opt.id)}
                  className={`py-2 px-2 text-sm font-medium rounded-lg border transition-all text-center ${method === opt.id ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {(method === "card" || method === "bank") && (
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              rows={2}
              placeholder="Add any payment remarks here..."
            />
          </div>

          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-sm font-semibold text-gray-700">Payment Proof</label>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-6 h-6 mb-2 text-gray-400" />
                <p className="text-xs text-gray-500"><span className="font-semibold text-blue-600">Click to upload</span> image or document (PDF, DOC)</p>
              </div>
              <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleImageChange} />
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

          {/* Mark Checked Out Option */}
          <div className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
            isHalfDay 
              ? 'bg-amber-50/90 border-amber-300 text-amber-900' 
              : 'bg-gray-50 border-gray-200 text-gray-800'
          }`}>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={markCheckedOut}
                onChange={(e) => setMarkCheckedOut(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
              />
              <span className="text-xs font-semibold">
                {isHalfDay 
                  ? "Mark as Checked Out upon payment (Half Day departure)"
                  : "Mark reservation as Checked Out upon payment"}
              </span>
            </label>
            {isHalfDay && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                Half Day
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
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
              'Confirm Payment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
