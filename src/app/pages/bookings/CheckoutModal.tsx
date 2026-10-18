import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, LogOut, Check, RefreshCw } from 'lucide-react';
import { staffService } from '../../services/staffService';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onSuccess?: () => void;
}

export function CheckoutModal({ isOpen, onClose, booking, onSuccess }: CheckoutModalProps) {
  const [markDirty, setMarkDirty] = useState(false);
  const [selectedHkStaffId, setSelectedHkStaffId] = useState('');
  const [hkEndJob, setHkEndJob] = useState('');
  const [hkNotes, setHkNotes] = useState('');
  const [checkoutTime, setCheckoutTime] = useState('');
  const [checkoutPerson, setCheckoutPerson] = useState('');

  const [waivedAmount, setWaivedAmount] = useState('');
  const [isWaiveEnabled, setIsWaiveEnabled] = useState(false);

  const [refundDetails, setRefundDetails] = useState({
    amount: '',
    method: 'cash',
    bankId: '',
    note: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hkStaffList, setHkStaffList] = useState<any[]>([]);
  
  const banksList = [
    { id: 1, bankName: "HBL", accountTitle: "Hotel Account" },
    { id: 2, bankName: "Meezan Bank", accountTitle: "Hotel Account" },
  ];

  useEffect(() => {
    if (isOpen) {
      setMarkDirty(false);
      setSelectedHkStaffId('');
      setHkEndJob('');
      setHkNotes('');
      setCheckoutTime('');
      setCheckoutPerson('');
      setWaivedAmount('');
      setIsWaiveEnabled(false);
      setRefundDetails({ amount: '', method: 'cash', bankId: '', note: '' });
      setError(null);
      
      const fetchStaff = async () => {
        try {
          const res = await staffService.getStaffList();
          const housekeepingStaff = (res.users || []).filter(
            (s: any) => {
              const role = s.role?.toLowerCase();
              return role === 'housekeeping' || role === 'housekeeper';
            }
          );
          setHkStaffList(housekeepingStaff);
        } catch (err) {
          console.error("Failed to fetch staff list", err);
        }
      };
      fetchStaff();
      
      // Auto-set checkout time to now
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCheckoutTime(`${hours}:${minutes}`);

      // Auto-set refund amount if balance is negative
      if (booking?.balanceAmount < 0) {
        setRefundDetails(prev => ({ ...prev, amount: String(Math.abs(booking.balanceAmount)) }));
      }
    }
  }, [isOpen, booking]);

  const handleSubmit = async (skipName: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const { default: api } = await import('../../services/api');
      
      const isNegativeBalance = Number(booking?.balanceAmount) < 0;
      const needsRefund = isNegativeBalance || booking?.status === 'cancelled';
      
      const payload = {
        status: "checked_out",
        checkoutPerson: skipName ? null : (checkoutPerson.trim() || null),
        endDate: null,
        endTime: checkoutTime || null,
        markDirty: markDirty,
        hkStaffId: selectedHkStaffId || null,
        hkEndJob: hkEndJob || null,
        hkNotes: hkNotes || null,
        refundDetails: needsRefund ? refundDetails : null,
        waivedAmount: waivedAmount ? Number(waivedAmount) : 0,
      };

      const bookingId = booking?.dbId || booking?.id;
      
      // According to reference code, checkout uses POST /api/reservation/checkout/:id
      await api.post(`/reservation/checkout/${bookingId}`, payload);
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Checkout failed", err);
      setError(err.response?.data?.message || "Failed to process checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isNegativeBalance = Number(booking?.balanceAmount) < 0;
  const isPositiveBalance = Number(booking?.balanceAmount) > 0;
  const isCancelled = booking?.status === 'cancelled';
  const showRefundSection = isNegativeBalance || isCancelled;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ zIndex: 99999 }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <LogOut size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Checkout</h2>
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

          {/* Checkout Time */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Checkout Time</label>
            <input 
              type="time" 
              value={checkoutTime}
              onChange={(e) => setCheckoutTime(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
            />
          </div>

          {/* Checkout Person */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Who is checking out? (Optional)</label>
            <input 
              type="text" 
              value={checkoutPerson}
              onChange={(e) => setCheckoutPerson(e.target.value)}
              placeholder="e.g. Ali / Ahmed / Guest Name"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty if you don't want to store this.</p>
          </div>

          {/* Housekeeping Checkbox */}
          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
            <input 
              type="checkbox" 
              checked={markDirty}
              onChange={(e) => setMarkDirty(e.target.checked)}
              className="w-5 h-5 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
            />
            <span className="text-sm font-medium text-gray-800">Mark room as dirty</span>
          </label>

          {/* Housekeeping Details */}
          {markDirty && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col gap-4">
              <h4 className="text-sm font-bold text-amber-700 uppercase tracking-wider">Housekeeping Task Details</h4>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">Assign Staff</label>
                <select 
                  value={selectedHkStaffId}
                  onChange={(e) => setSelectedHkStaffId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
                >
                  <option value="">-- Auto-Assign or Select Staff --</option>
                  {hkStaffList.map(staff => (
                    <option key={staff.id} value={staff.id}>{staff.fullName} ({staff.role})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">End Job Date/Time</label>
                <input 
                  type="datetime-local" 
                  value={hkEndJob}
                  onChange={(e) => setHkEndJob(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">Notes</label>
                <input 
                  type="text" 
                  value={hkNotes}
                  onChange={(e) => setHkNotes(e.target.value)}
                  placeholder="e.g. Deep clean needed"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Waive Pending Balance Section */}
          {isPositiveBalance && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col gap-4">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-bold text-blue-700">
                  Waive Pending Balance
                </h4>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={isWaiveEnabled}
                      onChange={(e) => {
                        setIsWaiveEnabled(e.target.checked);
                        if (!e.target.checked) setWaivedAmount('');
                      }} 
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${isWaiveEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isWaiveEnabled ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                </label>
              </div>
              
              {isWaiveEnabled && (
                <>
                  <div className="flex justify-between items-center pb-3 border-b border-blue-200/50">
                    <span className="text-sm text-blue-800">Pending Balance:</span>
                    <span className="text-lg font-black text-blue-700">
                      PKR {Number(booking?.balanceAmount || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-blue-800">Waive Amount</label>
                    <input 
                      type="number" 
                      value={waivedAmount}
                      onChange={(e) => setWaivedAmount(e.target.value)}
                      placeholder="Enter amount to waive"
                      className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Refund Section */}
          {showRefundSection && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw size={16} className="text-green-600" />
                <h4 className="text-sm font-bold text-green-700">
                  {isCancelled ? "Cancellation Refund" : "Refund Settlement"}
                </h4>
              </div>
              
              <div className="flex justify-between items-center pb-3 border-b border-green-200/50">
                <span className="text-sm text-green-800">Refundable Amount:</span>
                <span className="text-lg font-black text-green-700">
                  PKR {Number(isCancelled ? booking?.advancePaid : Math.abs(booking?.balanceAmount || 0)).toLocaleString()}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-green-800">Refund Amount</label>
                <input 
                  type="number" 
                  value={refundDetails.amount}
                  onChange={(e) => setRefundDetails({...refundDetails, amount: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-green-800">Refund Method</label>
                <select 
                  value={refundDetails.method}
                  onChange={(e) => setRefundDetails({...refundDetails, method: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {refundDetails.method === 'bank' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-green-800">Select Bank Account</label>
                  <select 
                    value={refundDetails.bankId}
                    onChange={(e) => setRefundDetails({...refundDetails, bankId: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
                  >
                    <option value="">-- Select Bank --</option>
                    {banksList.map(bank => (
                      <option key={bank.id} value={bank.id}>
                        {bank.bankName} - {bank.accountTitle}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-green-800">Note (optional)</label>
                <input 
                  type="text" 
                  value={refundDetails.note}
                  onChange={(e) => setRefundDetails({...refundDetails, note: e.target.value})}
                  placeholder="e.g. Returned security deposit"
                  className="w-full px-3 py-2 text-sm border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            </div>
          )}
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
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            Skip Name & Checkout
          </button>
          
          <button 
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="px-6 py-2 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check size={16} />
            )}
            Confirm Checkout
          </button>
        </div>
      </div>
    </div>
  , document.body);
}
