import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, Edit, Trash2, X, Save, Loader2, Building2, Phone, Mail, DollarSign, CheckCircle, XCircle, Eye } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';
import { useConfirm } from '../../components/ConfirmProvider';
import { usePermissions } from '../../hooks/usePermissions';

interface Supplier {
  id: number;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  balance?: number;
  openingBalance?: number;
  paymentTerms?: string;
  isActive?: boolean;
}

const EMPTY: Omit<Supplier, 'id'> = { name: '', contactName: '', phone: '', email: '', address: '', taxNumber: '', balance: 0, openingBalance: 0, paymentTerms: 'Cash', isActive: true };
const TERMS = ['Cash', 'Net 7', 'Net 15', 'Net 30', 'Net 60', 'Advance'];
const cls = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]';

export function Suppliers() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Supplier | null>(null);
  const [viewTarget, setViewTarget] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Omit<Supplier, 'id'>>(EMPTY);
  const { confirm } = useConfirm();
  const { canEdit, canDelete, canEditOrDelete } = usePermissions();


  const fetch = async () => {
    setLoading(true);
    try { const r = await api.get('/suppliers'); setItems(r.data || []); }
    catch { toast.error('Failed to load suppliers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setEditTarget(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (s: Supplier) => {
    setEditTarget(s);
    setForm({ name: s.name, contactName: s.contactName||'', phone: s.phone||'', email: s.email||'', address: s.address||'', taxNumber: s.taxNumber||'', balance: s.balance||0, openingBalance: s.openingBalance||0, paymentTerms: s.paymentTerms||'Cash', isActive: s.isActive??true });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editTarget) { await api.put(`/suppliers/${editTarget.id}`, form); toast.success('Supplier updated'); }
      else { await api.post('/suppliers', form); toast.success('Supplier created'); }
      setShowForm(false); fetch();
    } catch { toast.error('Failed to save supplier'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Delete Supplier', message: 'Are you sure? This cannot be undone.' });
    if (!ok) return;
    try { await api.delete(`/suppliers/${id}`); toast.success('Deleted'); fetch(); }
    catch { toast.error('Failed to delete'); }
  };

  const filtered = items.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contactName || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || '').includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Suppliers</h1>
          <p className="text-gray-600 mt-1">Manage your vendor and supplier directory</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#1D4ED8] text-white px-5 py-2.5 rounded-lg hover:bg-[#1E40AF] transition-colors font-medium">
          <Plus size={18} /> Add Supplier
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: items.length, icon: <Building2 size={20}/>, color: 'text-blue-600 bg-blue-50' },
          { label: 'Active', value: items.filter(s=>s.isActive).length, icon: <CheckCircle size={20}/>, color: 'text-green-600 bg-green-50' },
          { label: 'Inactive', value: items.filter(s=>!s.isActive).length, icon: <XCircle size={20}/>, color: 'text-red-600 bg-red-50' },
          // { label: 'Cash Terms', value: items.filter(s=>s.paymentTerms==='Cash').length, icon: <DollarSign size={20}/>, color: 'text-amber-600 bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${s.color}`}>{s.icon}</div>
            <div><div className="text-2xl font-bold text-[#0F172A]">{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search suppliers..." value={search} onChange={e=>setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-[#1D4ED8]" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Building2 size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No suppliers found</p>
            <p className="text-gray-400 text-sm mt-1">Click "Add Supplier" to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Supplier','Name','Phone/Email','Payment Terms','Balance','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#7C3AED] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{s.name.slice(0,2).toUpperCase()}</span>
                      </div>
                      <div>
                        <div 
                          className="font-semibold text-sm text-[#1D4ED8] cursor-pointer hover:underline"
                          onClick={() => navigate(`/suppliers/${s.id}`)}
                        >
                          {s.name}
                        </div>
                        {s.taxNumber && <div className="text-xs text-gray-400">NTN: {s.taxNumber}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-700">{s.contactName||'—'}</td>
                  <td className="px-4 py-3.5">
                    {s.phone && <div className="text-sm text-gray-700">{s.phone}</div>}
                    {s.email && <div className="text-xs text-gray-400">{s.email}</div>}
                    {!s.phone && !s.email && <span className="text-gray-400 text-sm">—</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">{s.paymentTerms||'Cash'}</span>
                  </td>
                  <td className="px-4 py-3.5 text-sm font-medium text-gray-900">PKR {Number(s.balance||0).toLocaleString()}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-green-500' : 'bg-gray-400'}`}/>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={()=>navigate(`/suppliers/${s.id}`)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details"><Eye size={15}/></button>
                      {canEdit && (
                      <button onClick={()=>openEdit(s)} className="p-1.5 text-gray-400 hover:text-[#1D4ED8] hover:bg-blue-50 rounded-lg transition-colors"><Edit size={15}/></button>
                      )}
                      {canDelete && (
                      <button onClick={()=>handleDelete(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-[#0F172A]">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Building2 size={18}/> {editTarget ? 'Edit Supplier' : 'Add New Supplier'}
              </h2>
              <button onClick={()=>setShowForm(false)} className="p-2 text-gray-400 hover:text-white rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name <span className="text-red-500">*</span></label>
                  <input required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Al-Madina Traders" className={cls}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <input value={form.contactName} onChange={e=>setForm(p=>({...p,contactName:e.target.value}))} placeholder="Full name" className={cls}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="+92 300 0000000" className={cls}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="supplier@example.com" className={cls}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NTN / Tax Number</label>
                  <input value={form.taxNumber} onChange={e=>setForm(p=>({...p,taxNumber:e.target.value}))} placeholder="1234567-8" className={cls}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                  <select value={form.paymentTerms} onChange={e=>setForm(p=>({...p,paymentTerms:e.target.value}))} className={cls}>
                    {TERMS.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance (PKR)</label>
                  <input type="number" value={form.openingBalance} onChange={e=>setForm(p=>({...p,openingBalance:Number(e.target.value)}))} disabled={!!editTarget} className={`${cls} disabled:bg-gray-100 disabled:text-gray-500`} title={editTarget ? "Opening balance cannot be edited" : ""}/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea rows={2} value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))} placeholder="Full address" className={cls}/>
                </div>
                <div className="md:col-span-2 flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={e=>setForm(p=>({...p,isActive:e.target.checked}))} className="sr-only peer"/>
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1D4ED8]"/>
                    <span className="ml-2 text-sm font-medium text-gray-700">Active Supplier</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-[#1D4ED8] text-white py-2.5 rounded-lg hover:bg-[#1E40AF] transition-colors disabled:opacity-60 font-medium">
                  {saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                  {saving ? 'Saving...' : editTarget ? 'Update Supplier' : 'Create Supplier'}
                </button>
                <button type="button" onClick={()=>setShowForm(false)} className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A]">
              <h2 className="text-lg font-semibold text-white">Supplier Details</h2>
              <button onClick={()=>setViewTarget(null)} className="p-2 text-gray-400 hover:text-white rounded-lg"><X size={18}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1D4ED8] to-[#7C3AED] flex items-center justify-center">
                  <span className="text-white text-xl font-bold">{viewTarget.name.slice(0,2).toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{viewTarget.name}</h3>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mt-1 ${viewTarget.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {viewTarget.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { icon: <Building2 size={14}/>, label: 'Contact', value: viewTarget.contactName },
                  { icon: <Phone size={14}/>, label: 'Phone', value: viewTarget.phone },
                  { icon: <Mail size={14}/>, label: 'Email', value: viewTarget.email },
                  { icon: <DollarSign size={14}/>, label: 'Balance', value: `PKR ${Number(viewTarget.balance||0).toLocaleString()}` },
                  { icon: <Building2 size={14}/>, label: 'NTN', value: viewTarget.taxNumber },
                  { icon: <Building2 size={14}/>, label: 'Terms', value: viewTarget.paymentTerms },
                ].map(f => f.value ? (
                  <div key={f.label} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-gray-400 mb-1">{f.icon}<span className="text-xs font-medium">{f.label}</span></div>
                    <div className="text-gray-900 font-medium text-sm">{f.value}</div>
                  </div>
                ) : null)}
                {viewTarget.address && (
                  <div className="col-span-2 bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-medium text-gray-400 mb-1">Address</div>
                    <div className="text-gray-900 text-sm">{viewTarget.address}</div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={()=>{openEdit(viewTarget);setViewTarget(null);}} className="flex-1 flex items-center justify-center gap-2 bg-[#1D4ED8] text-white py-2 rounded-lg hover:bg-[#1E40AF] text-sm font-medium">
                  <Edit size={15}/> Edit
                </button>
                <button onClick={()=>setViewTarget(null)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
