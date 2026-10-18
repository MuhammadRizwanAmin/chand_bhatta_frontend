import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { billService } from '../../services/billService';

interface AddPaymentJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddPaymentJournalModal({ isOpen, onClose, onSuccess }: AddPaymentJournalModalProps) {
  const [loading, setLoading] = useState(false);
  const [banksList, setBanksList] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: 'Other Income',
    description: '',
    method: 'cash',
    bankId: '',
  });

  useEffect(() => {
    if (isOpen) {
      billService.getBanks().then((res: any) => {
        setBanksList(res?.data || res || []);
      }).catch(() => {});
      
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        category: 'Other Income',
        description: '',
        method: 'cash',
        bankId: '',
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if ((formData.method === 'bank' || formData.method === 'card') && !formData.bankId) {
      toast.error('Please select a bank');
      return;
    }

    setLoading(true);
    try {
      await api.post('/income/journal', {
        date: formData.date,
        amount: Number(formData.amount),
        type: 'income',
        category: formData.category,
        description: formData.description,
        method: formData.method,
        bankId: formData.bankId || null,
      });
      toast.success('Payment added successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to add payment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Add Payment (Income)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Date *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full rounded-lg border p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Amount (PKR) *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full rounded-lg border p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Category *</label>
            <input
              type="text"
              required
              placeholder="e.g., Other Income"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-lg border p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={2}
              placeholder="Payment details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Payment Method *</label>
            <select
              required
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value, bankId: '' })}
              className="w-full rounded-lg border p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank">Bank</option>
            </select>
          </div>

          {(formData.method === 'bank' || formData.method === 'card') && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Select Bank *</label>
              <select
                required
                value={formData.bankId}
                onChange={(e) => setFormData({ ...formData, bankId: e.target.value })}
                className="w-full rounded-lg border p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Choose Bank --</option>
                {banksList.map((bank: any) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.bankName} - {bank.accountNumber}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
