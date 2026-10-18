import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Search, CheckCircle2, XCircle, 
  MoreVertical, Eye, CalendarPlus, Trash2, History, X, Activity, DollarSign
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { toast } from 'sonner';
import { DataTable } from '../../components/DataTable';
import api from '../../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (d: any) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PK", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const daysLeft = (endDate: any) => {
  if (!endDate) return null;
  const diff = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

const Avatar = ({ name, size = 36 }: { name?: string; size?: number }) => {
  const initials = (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const colors = [
    ["#dbeafe", "#1d4ed8"], ["#dcfce7", "#15803d"],
    ["#fef9c3", "#854d0e"], ["#fce7f3", "#9d174d"],
    ["#ede9fe", "#6d28d9"], ["#ffedd5", "#9a3412"],
  ];
  const [bg, fg] = colors[(name?.charCodeAt(0) || 0) % colors.length] || colors[0];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg, color: fg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
};

const StatusBadge = ({ membership }: { membership: any }) => {
  if (!membership?.endDate)
    return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">No Plan</span>;

  const days = daysLeft(membership.endDate);
  if (days === null) return null;

  if (days < 0)
    return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Expired</span>;
  if (days <= 7)
    return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Expires in {days}d</span>;
  
  return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Active · {days}d left</span>;
};

// ── Main Component ────────────────────────────────────────────────────────────
export function MembersList() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [banks, setBanks] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", cnic: "", phone: "", email: "", address: "" });
  const [addPlanForm, setAddPlanForm] = useState({ 
    planId: "", startDate: new Date().toISOString().split("T")[0], paidAmount: "", 
    notes: "", paymentMethod: "cash", bankId: "", transactionId: "" 
  });
  const [cnicError, setCnicError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [membershipTarget, setMembershipTarget] = useState<any>(null);
  const [membershipForm, setMembershipForm] = useState({
    planId: "", startDate: new Date().toISOString().split("T")[0], paidAmount: "", 
    notes: "", paymentMethod: "cash", bankId: "", transactionId: ""
  });
  const [membershipSaving, setMembershipSaving] = useState(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyMember, setHistoryMember] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/membership/users');
      setMembers(Array.isArray(res.data?.data || res.data) ? (res.data?.data || res.data).reverse() : []);
    } catch {
      toast.error("Failed to fetch members.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlansAndBanks = async () => {
    try {
      const [plansRes, banksRes] = await Promise.all([
        api.get('/membership/plans'),
        api.get('/banks')
      ]);
      setPlans(plansRes.data?.data || plansRes.data || []);
      setBanks(banksRes.data?.data || banksRes.data || []);
    } catch (err) {
      console.error("Error fetching auxiliary data", err);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchPlansAndBanks();
  }, []);

  const formatCnic = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 13);
    if (digits.length <= 5) return digits;
    if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
  };

  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "cnic") {
      const formatted = formatCnic(value);
      setAddForm((p) => ({ ...p, cnic: formatted }));
      setCnicError(formatted.replace(/-/g, "").length === 13 ? "" : "CNIC must be 13 digits");
      return;
    }
    if (name === "phone") {
      const digits = value.replace(/\D/g, "").slice(0, 11);
      setAddForm((p) => ({ ...p, phone: digits }));
      setPhoneError(digits.length === 11 ? "" : "Phone must be 11 digits");
      return;
    }
    setAddForm((p) => ({ ...p, [name]: value }));
  };

  const addSelectedPlan = plans.find((p) => String(p.id) === String(addPlanForm.planId));
  const calcEndDate = (startDate: string, duration?: number) => {
    if (!startDate || !duration) return "";
    const d = new Date(startDate);
    d.setDate(d.getDate() + Number(duration));
    return d.toISOString().split("T")[0];
  };

  const handleAddSubmit = async () => {
    if (!addForm.name.trim()) return toast.error("Name is required.");
    if (addForm.cnic.replace(/-/g, "").length !== 13) return toast.error("Enter valid 13-digit CNIC.");
    if (addForm.phone.length !== 11) return toast.error("Enter valid 11-digit phone.");
    if (!addPlanForm.planId) return toast.error("Please select a plan.");
    if (!addPlanForm.startDate) return toast.error("Start date is required.");

    setAddSaving(true);
    try {
      await api.post('/membership/users', {
        ...addForm,
        planId: addPlanForm.planId,
        startDate: addPlanForm.startDate,
        endDate: calcEndDate(addPlanForm.startDate, addSelectedPlan?.duration),
        paidAmount: addPlanForm.paidAmount || addSelectedPlan?.price || 0,
        notes: addPlanForm.notes,
        paymentMethod: addPlanForm.paymentMethod,
        bankId: addPlanForm.bankId,
        transactionId: addPlanForm.transactionId,
      });
      toast.success("Member added successfully!");
      fetchMembers();
      setShowAddModal(false);
      setAddForm({ name: "", cnic: "", phone: "", email: "", address: "" });
      setAddPlanForm({ planId: "", startDate: new Date().toISOString().split("T")[0], paidAmount: "", notes: "", paymentMethod: "cash", bankId: "", transactionId: "" });
    } catch {
      toast.error("Failed to add member.");
    } finally {
      setAddSaving(false);
    }
  };

  const handleMembershipSubmit = async () => {
    if (!membershipForm.planId) return toast.error("Please select a plan.");
    if (!membershipForm.startDate) return toast.error("Start date is required.");

    setMembershipSaving(true);
    try {
      const selectedPlan = plans.find((p) => String(p.id) === String(membershipForm.planId));
      await api.post('/membership/users', {
        memberId: membershipTarget.user?.id || membershipTarget.id,
        planId: membershipForm.planId,
        startDate: membershipForm.startDate,
        endDate: calcEndDate(membershipForm.startDate, selectedPlan?.duration),
        paidAmount: membershipForm.paidAmount || selectedPlan?.price || 0,
        notes: membershipForm.notes,
        paymentMethod: membershipForm.paymentMethod,
        bankId: membershipForm.bankId,
        transactionId: membershipForm.transactionId,
      });
      toast.success("Membership assigned!");
      fetchMembers();
      setShowMembershipModal(false);
    } catch {
      toast.error("Failed to assign membership.");
    } finally {
      setMembershipSaving(false);
    }
  };

  const openHistory = async (member: any) => {
    setHistoryMember(member);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/members/${member.user?.id || member.id}/memberships`);
      setHistoryData(res.data?.data || res.data || []);
    } catch {
      toast.error("Failed to load history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/members/${deleteTarget.user?.id || deleteTarget.id}`);
      toast.success("Member deleted.");
      fetchMembers();
      setShowDeleteModal(false);
    } catch {
      toast.error("Error deleting member.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const name = (m.user?.name || "").toLowerCase();
    const cnic = (m.user?.cnic || "").toLowerCase();
    const phone = (m.user?.phone || "").toLowerCase();
    const s = searchTerm.toLowerCase();
    return name.includes(s) || cnic.includes(s) || phone.includes(s);
  });

  const columns = [
    {
      header: 'Member Details',
      cell: (row: any) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.user?.name} />
          <div>
            <div className="font-semibold text-gray-900">{row.user?.name || 'Unknown'}</div>
            <div className="text-xs text-gray-500">{row.user?.email || 'No email'}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Contact Info',
      cell: (row: any) => (
        <div>
          <div className="text-sm font-medium text-gray-700">{row.user?.phone || '—'}</div>
          <div className="text-xs text-gray-500 font-mono mt-0.5">{row.user?.cnic || '—'}</div>
        </div>
      )
    },
    {
      header: 'Status',
      cell: (row: any) => (
        <div>
          <div className="text-sm font-semibold text-gray-800 mb-1">
            {row.plan?.name || 'No Plan'}
          </div>
          <StatusBadge membership={row} />
        </div>
      )
    },
    {
      header: 'Joined',
      cell: (row: any) => (
        <span className="text-sm text-gray-600">{formatDate(row.createdAt)}</span>
      )
    },
    {
      header: 'Actions',
      cell: (row: any) => (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none">
              <MoreVertical size={20} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" sideOffset={4} className="bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-[9999] min-w-[160px]">
              <DropdownMenu.Item className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer outline-none" onSelect={() => openHistory(row)}>
                <History size={16} /> View History
              </DropdownMenu.Item>
              <DropdownMenu.Item className="w-full text-left px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer outline-none" onSelect={() => {
                setMembershipTarget(row);
                setMembershipForm({ planId: "", startDate: new Date().toISOString().split("T")[0], paidAmount: "", notes: "", paymentMethod: "cash", bankId: "", transactionId: "" });
                setShowMembershipModal(true);
              }}>
                <CalendarPlus size={16} /> Assign Plan
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />
              <DropdownMenu.Item className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer outline-none" onSelect={() => { setDeleteTarget(row); setShowDeleteModal(true); }}>
                <Trash2 size={16} /> Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] flex items-center gap-3">
            <Users size={32} className="text-[#1D4ED8]" />
            Members List
          </h1>
          <p className="text-gray-600 mt-1">Manage gym members and memberships</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-[#1D4ED8] text-white px-6 py-2.5 rounded-lg hover:bg-[#1E40AF] transition-colors font-medium shadow-sm">
          <UserPlus size={18} /> Add Member
        </button>
      </div>

      {!loading && members.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold border border-blue-200">
            Total Members: {members.length}
          </div>
          <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 size={16} /> Active: {members.filter(m => (daysLeft(m.endDate) || 0) >= 0).length}
          </div>
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded-full text-sm font-semibold border border-red-200 flex items-center gap-1.5">
            <XCircle size={16} /> Expired: {members.filter(m => (daysLeft(m.endDate) || 0) < 0).length}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Search by name, CNIC or phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Activity className="animate-spin mb-3 text-[#1D4ED8]" size={32} />
            <p>Loading members...</p>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredMembers} searchable={false} />
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2"><UserPlus size={20} /> Add New Member</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input type="text" name="name" value={addForm.name} onChange={handleAddChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none" placeholder="e.g. John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CNIC *</label>
                    <input type="text" name="cnic" value={addForm.cnic} onChange={handleAddChange} className={`w-full px-3 py-2 border ${cnicError ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none`} placeholder="42101-1234567-1" />
                    {cnicError && <p className="text-xs text-red-500 mt-1">{cnicError}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input type="tel" name="phone" value={addForm.phone} onChange={handleAddChange} className={`w-full px-3 py-2 border ${phoneError ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none`} placeholder="03001234567" />
                    {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" value={addForm.email} onChange={handleAddChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none" placeholder="john@example.com" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input type="text" name="address" value={addForm.address} onChange={handleAddChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none" placeholder="Full address" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Membership Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plan *</label>
                    <select value={addPlanForm.planId} onChange={(e) => {
                      const p = plans.find(x => String(x.id) === e.target.value);
                      setAddPlanForm({...addPlanForm, planId: e.target.value, paidAmount: p?.price || ''});
                    }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none">
                      <option value="">— Select Plan —</option>
                      {plans.filter(p => p.status || p.status === 'active').map(p => (
                        <option key={p.id} value={p.id}>{p.name} — ₨ {Number(p.price).toLocaleString()} / {p.duration}d</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <input type="date" value={addPlanForm.startDate} onChange={e => setAddPlanForm({...addPlanForm, startDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Auto)</label>
                    <input type="date" value={calcEndDate(addPlanForm.startDate, addSelectedPlan?.duration)} readOnly className="w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg focus:outline-none cursor-not-allowed" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Pay</label>
                    <input type="number" value={addPlanForm.paidAmount} onChange={e => setAddPlanForm({...addPlanForm, paidAmount: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none" placeholder="e.g. 5000" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select value={addPlanForm.paymentMethod} onChange={e => setAddPlanForm({...addPlanForm, paymentMethod: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none">
                      <option value="cash">Cash</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="card">Card Payment</option>
                    </select>
                  </div>
                  {(addPlanForm.paymentMethod === 'bank' || addPlanForm.paymentMethod === 'card') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
                      <select value={addPlanForm.bankId} onChange={e => setAddPlanForm({...addPlanForm, bankId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none">
                        <option value="">— Select Bank —</option>
                        {banks.map(b => <option key={b.id} value={b.id}>{b.bank_name}</option>)}
                      </select>
                    </div>
                  )}
                  {(addPlanForm.paymentMethod === 'bank' || addPlanForm.paymentMethod === 'card') && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Ref</label>
                      <input type="text" value={addPlanForm.transactionId} onChange={e => setAddPlanForm({...addPlanForm, transactionId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none" placeholder="TRX-XXXXXX" />
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea rows={2} value={addPlanForm.notes} onChange={e => setAddPlanForm({...addPlanForm, notes: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none" placeholder="Any additional notes..."></textarea>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium transition-colors">Cancel</button>
              <button onClick={handleAddSubmit} disabled={addSaving} className="px-5 py-2.5 rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] font-medium transition-colors flex items-center gap-2">
                {addSaving ? <Activity size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {addSaving ? 'Saving...' : 'Save Member & Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Membership Modal */}
      {showMembershipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2"><CalendarPlus size={20} /> Assign Plan</h2>
              <button onClick={() => setShowMembershipModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[80vh] space-y-5">
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <Avatar name={membershipTarget?.user?.name} size={48} />
                <div>
                  <div className="font-bold text-gray-900">{membershipTarget?.user?.name}</div>
                  <div className="text-sm text-gray-500">{membershipTarget?.user?.phone}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan *</label>
                <select value={membershipForm.planId} onChange={(e) => {
                  const p = plans.find(x => String(x.id) === e.target.value);
                  setMembershipForm({...membershipForm, planId: e.target.value, paidAmount: p?.price || ''});
                }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none">
                  <option value="">— Select Plan —</option>
                  {plans.filter(p => p.status || p.status === 'active').map(p => (
                    <option key={p.id} value={p.id}>{p.name} — ₨ {Number(p.price).toLocaleString()} / {p.duration}d</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input type="date" value={membershipForm.startDate} onChange={e => setMembershipForm({...membershipForm, startDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Pay</label>
                  <input type="number" value={membershipForm.paidAmount} onChange={e => setMembershipForm({...membershipForm, paidAmount: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <div className="flex gap-2">
                  {['cash', 'bank', 'card'].map(m => (
                    <button key={m} onClick={() => setMembershipForm({...membershipForm, paymentMethod: m})} className={`flex-1 py-2 px-3 border rounded-lg text-sm font-medium capitalize transition-colors ${membershipForm.paymentMethod === m ? 'bg-blue-50 border-[#1D4ED8] text-[#1D4ED8]' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {(membershipForm.paymentMethod === 'bank' || membershipForm.paymentMethod === 'card') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
                    <select value={membershipForm.bankId} onChange={e => setMembershipForm({...membershipForm, bankId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none">
                      <option value="">— Select Bank —</option>
                      {banks.map(b => <option key={b.id} value={b.id}>{b.bank_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Ref</label>
                    <input type="text" value={membershipForm.transactionId} onChange={e => setMembershipForm({...membershipForm, transactionId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none" />
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowMembershipModal(false)} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium transition-colors">Cancel</button>
              <button onClick={handleMembershipSubmit} disabled={membershipSaving} className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium transition-colors flex items-center gap-2">
                {membershipSaving ? <Activity size={18} className="animate-spin" /> : <CalendarPlus size={18} />}
                Assign Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2"><History size={20} /> Membership History</h2>
              <button onClick={() => setShowHistoryModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] bg-gray-50">
              {historyLoading ? (
                <div className="flex justify-center py-10"><Activity className="animate-spin text-[#1D4ED8]" size={32} /></div>
              ) : historyData.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <History size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="font-medium">No history found for {historyMember?.user?.name}</p>
                </div>
              ) : (
                <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[19px] before:w-0.5 before:bg-gray-200">
                  {historyData.map((h, i) => {
                    const days = daysLeft(h.endDate);
                    const isActive = days !== null && days >= 0;
                    return (
                      <div key={i} className="relative flex items-start gap-6">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 border-gray-50 z-10 ${isActive ? 'bg-emerald-500 text-white' : 'bg-gray-300 text-gray-500'}`}>
                          {isActive ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                        </div>
                        <div className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-bold text-gray-900">{h.plan?.name || 'Unknown Plan'}</h3>
                              <p className="text-sm text-gray-500">{formatDate(h.startDate)} → {formatDate(h.endDate)}</p>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-gray-900">₨ {Number(h.paidAmount || 0).toLocaleString()}</div>
                              <StatusBadge membership={h} />
                            </div>
                          </div>
                          {h.notes && <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg mt-2 border border-gray-100">{h.notes}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Member?</h2>
            <p className="text-gray-500 text-sm mb-6">Are you sure you want to delete <strong>{deleteTarget?.user?.name}</strong>? This action will remove all history and cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 flex items-center justify-center gap-2">
                {deleting ? <Activity size={18} className="animate-spin" /> : null} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
