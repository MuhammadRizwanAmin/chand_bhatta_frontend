import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin, Building2, Phone, Mail, ToggleLeft, ToggleRight, X, Save, Loader2 } from 'lucide-react';
import { locationService, Location } from '../../services/locationService';
import { authService } from '../../services/authService';

const emptyForm = { name: '', address: '', contactPhone: '', contactEmail: '', prefix: '' };

export function SettingsLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Location | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchLocations = async () => {
    setLoading(true);
    try {
      const data = await locationService.getAll();
      const currentUser = authService.getUser();
      let allowedList: string[] = [];
      if (currentUser?.allowedLocations) {
        if (typeof currentUser.allowedLocations === 'string') {
          try { allowedList = JSON.parse(currentUser.allowedLocations).map(String); } catch { allowedList = []; }
        } else if (Array.isArray(currentUser.allowedLocations)) {
          allowedList = currentUser.allowedLocations.map(String);
        }
      } else if (currentUser?.locationId && String(currentUser.locationId) !== 'all') {
        allowedList = [String(currentUser.locationId)];
      }

      const hasSpecificLocation = allowedList.length > 0;
      const filteredLocs = hasSpecificLocation
        ? data.filter(l => allowedList.includes(String(l.id)))
        : data;

      setLocations(filteredLocs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLocations(); }, []);

  // ── Open Add / Edit ────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setLogoFile(null);
    setLogoPreview(null);
    setShowForm(true);
  };

  const openEdit = (loc: Location) => {
    setEditTarget(loc);
    setForm({
      name: loc.name || '',
      address: loc.address || '',
      contactPhone: loc.contactPhone || '',
      contactEmail: loc.contactEmail || '',
      prefix: loc.prefix || '',
    });
    setLogoFile(null);
    setLogoPreview(loc.logo || null);
    setShowForm(true);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      let savedLoc: Location;
      if (editTarget) {
        savedLoc = await locationService.update(editTarget.id, form);
      } else {
        savedLoc = await locationService.create(form);
      }

      if (logoFile) {
         await locationService.uploadLogo(savedLoc.id, logoFile);
      }

      setShowForm(false);
      fetchLocations();
    } catch (err) {
      console.error(err);
      alert('Failed to save location.');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle Status ──────────────────────────────────────────────────────────
  const toggleStatus = async (loc: Location) => {
    try {
      await locationService.update(loc.id, { status: !loc.status });
      fetchLocations();
    } catch (err) {
      console.error(err);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await locationService.delete(deleteId);
      setDeleteId(null);
      fetchLocations();
    } catch (err) {
      console.error(err);
      alert('Failed to delete location.');
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Locations</h1>
          <p className="text-gray-600 mt-1">Manage hotel branches and properties</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-[#1D4ED8] text-white px-5 py-2.5 rounded-lg hover:bg-[#1E40AF] transition-colors">
          <Plus size={18} /> Add Location
        </button>
      </div>

      {/* ── Add / Edit Modal ───────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-[#0F172A]">
                {editTarget ? 'Edit Location' : 'Add New Location'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Logo</label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Preview" className="w-16 h-16 object-contain border rounded-lg bg-gray-50" />
                  ) : (
                    <div className="w-16 h-16 flex items-center justify-center border rounded-lg bg-gray-50 text-gray-400">
                      <Building2 size={24} />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setLogoFile(file);
                        setLogoPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Name <span className="text-red-500">*</span></label>
                <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Lahore Branch" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prefix / Code</label>
                  <input value={form.prefix} onChange={e => setForm(p => ({ ...p, prefix: e.target.value }))}
                    placeholder="e.g. LHR" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input value={form.contactPhone} onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))}
                    placeholder="+92 42 xxxxxxx" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))}
                  placeholder="branch@hotel.com" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Full address" className={inputCls} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1D4ED8] text-white py-2.5 rounded-lg hover:bg-[#1E40AF] transition-colors disabled:opacity-60">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Saving…' : 'Save Location'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ─────────────────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Delete Location</h3>
            <p className="text-gray-600 text-sm mb-6">Are you sure you want to delete this location? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                Yes, Delete
              </button>
              <button onClick={() => setDeleteId(null)}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Location Cards ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[#1D4ED8]" />
        </div>
      ) : locations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No locations found</p>
          <p className="text-gray-400 text-sm mt-1">Click "Add Location" to create your first branch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((loc) => (
            <div key={loc.id}
              className={`bg-white rounded-xl shadow-sm overflow-hidden border-2 transition-all hover:shadow-md ${loc.status ? 'border-[#1D4ED8]' : 'border-gray-200'}`}>
              {/* Top accent */}
              <div className={`px-4 py-1.5 text-white text-xs font-semibold flex items-center gap-1.5 ${loc.status ? 'bg-[#1D4ED8]' : 'bg-gray-400'}`}>
                <Building2 size={12} />
                {loc.prefix ? `[${loc.prefix}] ` : ''}{loc.status ? 'Active' : 'Inactive'}
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {loc.logo ? (
                      <img src={loc.logo} alt={loc.name} className="w-10 h-10 rounded-lg object-contain bg-gray-50 border p-1" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Building2 size={20} />
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{loc.name}</h3>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button onClick={() => openEdit(loc)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => setDeleteId(loc.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm text-gray-600">
                  {loc.address && (
                    <div className="flex items-start gap-2">
                      <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-xs leading-snug">{loc.address}</span>
                    </div>
                  )}
                  {loc.contactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-gray-400 shrink-0" />
                      <span className="text-xs">{loc.contactPhone}</span>
                    </div>
                  )}
                  {loc.contactEmail && (
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-gray-400 shrink-0" />
                      <span className="text-xs truncate">{loc.contactEmail}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${loc.status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {loc.status ? 'Active' : 'Inactive'}
                  </span>
                  <button onClick={() => toggleStatus(loc)} className="text-gray-400 hover:text-[#1D4ED8] transition-colors">
                    {loc.status
                      ? <ToggleRight size={24} className="text-[#1D4ED8]" />
                      : <ToggleLeft size={24} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
