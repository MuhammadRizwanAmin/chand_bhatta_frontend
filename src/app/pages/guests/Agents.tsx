import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit, Trash2, X, Save, Loader2, User, Phone, Mail, DollarSign, Calendar, Percent, Wallet, Eye, Badge } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';
import { useConfirm } from '../../components/ConfirmProvider';
import { useNavigate } from 'react-router';

interface Agent {
  id: number;
  fullName: string;
  cnic?: string;
  phone: string;
  email?: string;
  commission_type: 'fixed' | 'percentage';
  commission_value: number;
  payout_date: string;
  profile_image?: string;
  letter?: string;
  AgentWallets?: AgentWallet[];
}

interface AgentWallet {
  id: number;
  reservationId: number;
  amount: number;
  status: 'paid' | 'unpaid';
  paid_at?: string;
}

const EMPTY_FORM = { fullName: '', cnic: '', phone: '', email: '', commission_type: 'percentage' as const, commission_value: '', payout_date: '' };
const cls = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]';

const PAYOUT_DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

export function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Agent | null>(null);
  const [viewTarget, setViewTarget] = useState<Agent | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [letterFile, setLetterFile] = useState<File | null>(null);
  const [previewImg, setPreviewImg] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);
  const letterRef = useRef<HTMLInputElement>(null);
  const { confirm } = useConfirm();
  const navigate = useNavigate();

  const fetchAgents = async () => {
    setLoading(true);
    try { const r = await api.get('/agent'); setAgents(r.data?.agents || r.data || []); }
    catch { toast.error('Failed to load agents'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAgents(); }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setProfileFile(null);
    setLetterFile(null);
    setPreviewImg('');
    setShowForm(true);
  };

  const openEdit = (a: Agent) => {
    setEditTarget(a);
    setForm({ fullName: a.fullName, cnic: a.cnic||'', phone: a.phone, email: a.email||'', commission_type: a.commission_type, commission_value: String(a.commission_value), payout_date: a.payout_date||'' });
    setPreviewImg(a.profile_image || '');
    setProfileFile(null);
    setLetterFile(null);
    setShowForm(true);
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setProfileFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreviewImg(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim()) return toast.error('Full name and phone are required');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (profileFile) fd.append('profile_image', profileFile);
      if (letterFile) fd.append('letter', letterFile);

      if (editTarget) {
        await api.put(`/agent/${editTarget.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Agent updated');
      } else {
        await api.post('/agent', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Agent created');
      }
      setShowForm(false);
      fetchAgents();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to save agent');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Delete Agent', message: 'Are you sure? This action cannot be undone.' });
    if (!ok) return;
    try { await api.delete(`/agent/${id}`); toast.success('Agent deleted'); fetchAgents(); }
    catch { toast.error('Failed to delete agent'); }
  };

  const filtered = agents.filter(a =>
    a.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (a.phone || '').includes(search) ||
    (a.cnic || '').includes(search)
  );

  const getWalletTotals = (a: Agent) => {
    const wallets = a.AgentWallets || [];
    const unpaid = wallets.filter(w => w.status === 'unpaid').reduce((s, w) => s + w.amount, 0);
    const paid = wallets.filter(w => w.status === 'paid').reduce((s, w) => s + w.amount, 0);
    return { unpaid, paid, total: unpaid + paid };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Agents</h1>
          <p className="text-gray-600 mt-1">Manage booking agents and their commission structures</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#1D4ED8] text-white px-5 py-2.5 rounded-lg hover:bg-[#1E40AF] transition-colors font-medium">
          <Plus size={18}/> Add Agent
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Agents', value: agents.length, icon: <User size={20}/>, color: 'text-blue-600 bg-blue-50' },
          { label: 'Fixed Commission', value: agents.filter(a=>a.commission_type==='fixed').length, icon: <DollarSign size={20}/>, color: 'text-green-600 bg-green-50' },
          { label: 'Percentage Based', value: agents.filter(a=>a.commission_type==='percentage').length, icon: <Percent size={20}/>, color: 'text-purple-600 bg-purple-50' },
          { label: 'Total Pending', value: agents.reduce((s,a)=>s+getWalletTotals(a).unpaid,0), icon: <Wallet size={20}/>, color: 'text-amber-600 bg-amber-50', isCurrency: true },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${s.color}`}>{s.icon}</div>
            <div>
              <div className="text-2xl font-bold text-[#0F172A]">{(s as any).isCurrency ? `PKR ${Number(s.value).toLocaleString()}` : s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input type="text" placeholder="Search agents..." value={search} onChange={e=>setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"/>
        </div>
      </div>

      {/* Agent Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-[#1D4ED8]"/></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-20">
          <User size={40} className="mx-auto text-gray-200 mb-3"/>
          <p className="text-gray-500 font-medium">No agents found</p>
          <p className="text-gray-400 text-sm mt-1">Click "Add Agent" to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(a => {
            const w = getWalletTotals(a);
            return (
              <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Card top */}
                <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] px-5 py-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0 bg-gradient-to-br from-[#1D4ED8] to-[#D4A017] flex items-center justify-center">
                    {a.profile_image ? <img src={a.profile_image} alt="" className="w-full h-full object-cover"/> : <span className="text-white font-bold text-lg">{a.fullName.slice(0,2).toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{a.fullName}</h3>
                    {a.cnic && <p className="text-gray-400 text-xs mt-0.5">{a.cnic}</p>}
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${a.commission_type === 'percentage' ? 'bg-purple-500/20 text-purple-300' : 'bg-green-500/20 text-green-300'}`}>
                      {a.commission_type === 'percentage' ? `${a.commission_value}%` : `PKR ${a.commission_value}`} commission
                    </span>
                  </div>
                </div>

                {/* Info rows */}
                <div className="px-5 py-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={13} className="text-gray-400 flex-shrink-0"/>{a.phone}
                  </div>
                  {a.email && <div className="flex items-center gap-2 text-sm text-gray-600"><Mail size={13} className="text-gray-400 flex-shrink-0"/>{a.email}</div>}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={13} className="text-gray-400 flex-shrink-0"/>Payout: day {a.payout_date} of each month
                  </div>
                </div>

                {/* Wallet summary */}
                <div className="mx-5 mb-4 bg-gray-50 rounded-xl p-3 grid grid-cols-3 gap-2">
                  {[
                    { label: 'Unpaid', value: w.unpaid, color: 'text-amber-600' },
                    { label: 'Paid', value: w.paid, color: 'text-green-600' },
                    { label: 'Total', value: w.total, color: 'text-blue-600' },
                  ].map(stat => (
                    <div key={stat.label} className="text-center">
                      <div className={`text-xs font-bold ${stat.color}`}>PKR {Number(stat.value).toLocaleString()}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="px-5 pb-4 flex items-center gap-2">
                  <button onClick={() => navigate(`/agents/${a.id}`)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    <Eye size={13}/> Details
                  </button>
                  <button onClick={()=>openEdit(a)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-[#1D4ED8] rounded-lg text-xs font-medium text-[#1D4ED8] hover:bg-blue-50 transition-colors">
                    <Edit size={13}/> Edit
                  </button>
                  <button onClick={()=>handleDelete(a.id)} className="p-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A]">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2"><User size={18}/> {editTarget ? 'Edit Agent' : 'Add New Agent'}</h2>
              <button onClick={()=>setShowForm(false)} className="p-2 text-gray-400 hover:text-white rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Profile Photo */}
              <div className="flex flex-col items-center gap-3">
                <div onClick={()=>fileRef.current?.click()} className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#D4A017] flex items-center justify-center cursor-pointer border-4 border-gray-100 hover:border-[#1D4ED8] transition-colors overflow-hidden">
                  {previewImg ? <img src={previewImg} alt="" className="w-full h-full object-cover"/> : <User size={28} className="text-white"/>}
                </div>
                <button type="button" onClick={()=>fileRef.current?.click()} className="text-xs text-[#1D4ED8] font-medium hover:underline">Upload Photo</button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleProfileChange}/>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input required value={form.fullName} onChange={e=>setForm(p=>({...p,fullName:e.target.value}))} placeholder="Agent's full name" className={cls}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNIC</label>
                  <input value={form.cnic} onChange={e=>setForm(p=>({...p,cnic:e.target.value}))} placeholder="XXXXX-XXXXXXX-X" className={cls}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                  <input required type="tel" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="03XX-XXXXXXX" className={cls}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="agent@example.com" className={cls}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission Type <span className="text-red-500">*</span></label>
                  <select required value={form.commission_type} onChange={e=>setForm(p=>({...p,commission_type:e.target.value as any}))} className={cls}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (PKR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission Value <span className="text-red-500">*</span></label>
                  <input required type="number" min="0" value={form.commission_value} onChange={e=>setForm(p=>({...p,commission_value:e.target.value}))}
                    placeholder={form.commission_type==='percentage' ? 'e.g. 5 for 5%' : 'e.g. 500 PKR'} className={cls}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payout Day of Month <span className="text-red-500">*</span></label>
                  <select required value={form.payout_date} onChange={e=>setForm(p=>({...p,payout_date:e.target.value}))} className={cls}>
                    <option value="">Select day...</option>
                    {PAYOUT_DAYS.map(d=><option key={d} value={d}>Day {d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Offer / Appointment Letter</label>
                  <input ref={letterRef} type="file" accept="application/pdf,image/*" onChange={e=>setLetterFile(e.target.files?.[0]||null)} className={cls}/>
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-[#1D4ED8] text-white py-2.5 rounded-lg hover:bg-[#1E40AF] transition-colors disabled:opacity-60 font-medium">
                  {saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                  {saving ? 'Saving...' : editTarget ? 'Update Agent' : 'Create Agent'}
                </button>
                <button type="button" onClick={()=>setShowForm(false)} className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] px-6 py-5 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 bg-gradient-to-br from-[#1D4ED8] to-[#D4A017] flex items-center justify-center flex-shrink-0">
                {viewTarget.profile_image ? <img src={viewTarget.profile_image} alt="" className="w-full h-full object-cover"/> : <span className="text-white font-bold text-xl">{viewTarget.fullName.slice(0,2).toUpperCase()}</span>}
              </div>
              <div className="flex-1">
                <h3 className="text-white text-xl font-bold">{viewTarget.fullName}</h3>
                {viewTarget.cnic && <p className="text-gray-400 text-sm">{viewTarget.cnic}</p>}
              </div>
              <button onClick={()=>setViewTarget(null)} className="p-2 text-gray-400 hover:text-white rounded-lg"><X size={18}/></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Commission */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Commission Structure</div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-[#1D4ED8]">
                    {viewTarget.commission_type === 'percentage' ? `${viewTarget.commission_value}%` : `PKR ${viewTarget.commission_value}`}
                  </div>
                  <span className="px-2 py-0.5 bg-white text-gray-600 text-xs font-semibold rounded-full border border-gray-200">
                    {viewTarget.commission_type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Payout on day {viewTarget.payout_date} of each month</div>
              </div>

              {/* Wallet */}
              {(() => {
                const w = getWalletTotals(viewTarget);
                return (
                  <div className="grid grid-cols-3 gap-3">
                    {[{l:'Unpaid', v:w.unpaid, c:'text-amber-600 bg-amber-50'},{l:'Paid', v:w.paid, c:'text-green-600 bg-green-50'},{l:'Total', v:w.total, c:'text-blue-600 bg-blue-50'}].map(s=>(
                      <div key={s.l} className={`rounded-xl p-3 ${s.c} border border-opacity-30 text-center`}>
                        <div className="text-sm font-bold">{Number(s.v).toLocaleString()}</div>
                        <div className="text-xs mt-0.5 opacity-70">{s.l}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {icon:<Phone size={14}/>, l:'Phone', v:viewTarget.phone},
                  {icon:<Mail size={14}/>, l:'Email', v:viewTarget.email},
                ].filter(f=>f.v).map(f=>(
                  <div key={f.l} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-gray-400 mb-1">{f.icon}<span className="text-xs font-medium">{f.l}</span></div>
                    <div className="text-gray-900 font-medium text-sm">{f.v}</div>
                  </div>
                ))}
                {viewTarget.letter && (
                  <div className="col-span-2 bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-medium text-gray-400 mb-1">Offer Letter</div>
                    <a href={viewTarget.letter} target="_blank" rel="noreferrer" className="text-[#1D4ED8] text-sm font-medium hover:underline">View Document →</a>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={()=>{openEdit(viewTarget);setViewTarget(null);}} className="flex-1 flex items-center justify-center gap-2 bg-[#1D4ED8] text-white py-2 rounded-lg hover:bg-[#1E40AF] text-sm font-medium">
                  <Edit size={15}/> Edit Agent
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
