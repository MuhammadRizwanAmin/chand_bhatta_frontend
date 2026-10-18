import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { Plus, Search, Building, Mail, Phone, Edit, Eye, Trash2, X } from 'lucide-react';
import { groupService } from '../../services/groupService';
import { roomTypeService } from '../../services/roomTypeService';
import { roomRateService } from '../../services/roomRateService';
import { useConfirm } from '../../components/ConfirmProvider';
import { usePermissions } from '../../hooks/usePermissions';

export function Companies() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
      const { canEdit, canDelete, canEditOrDelete } = usePermissions ();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);

  const { confirm } = useConfirm();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await groupService.getAll();
      setCompanies(res.groups || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  const handleAdd = () => {
    setEditingCompany(null);
    setIsModalOpen(true);
  };

  const handleEdit = (company: any) => {
    setEditingCompany(company);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: number) => {
    const isConfirmed = await confirm({
      title: "Delete Company",
      message: "Are you sure you want to delete this company? All associated data will be removed. This action cannot be undone."
    });

    if (isConfirmed) {
      try {
        await groupService.delete(id);
        fetchCompanies();
      } catch (err) {
        console.error(err);
        alert("Failed to delete company");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Companies</h1>
          <p className="text-gray-600 mt-1">Manage corporate clients and group rates</p>
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 bg-[#1D4ED8] text-white px-6 py-3 rounded-lg hover:bg-[#1E40AF] transition-colors">
          <Plus size={20} />
          Add Company
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0F172A] text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Company ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Contact Person</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Contact Info</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Billing</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading companies...</td>
                </tr>
              ) : filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No companies found.</td>
                </tr>
              ) : (
                filteredCompanies.map(company => (
                  <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">
                      <Link to={`/companies/${company.id}`} className="text-[#1D4ED8] hover:underline">
                        CMP-{company.id}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Building className="text-[#1D4ED8]" size={18} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{company.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{company.contactPerson || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <Mail size={14} className="text-gray-400" /> {company.email || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <Phone size={14} className="text-gray-400" /> {company.phone || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 capitalize">{company.billingCycle}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${company.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {company.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/companies/${company.id}`)} className="p-2 text-gray-600 hover:text-[#1D4ED8] hover:bg-blue-50 rounded-lg transition-colors" title="View">
                          <Eye size={16} />
                        </button>
                         {canEdit && (
                        <button onClick={() => handleEdit(company)} className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Edit">
                          <Edit size={16} />
                        </button>
                         )}
                         {canDelete && (
                        <button onClick={() => handleDeleteClick(company.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                         )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <CompanyModal 
          initialData={editingCompany}
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchCompanies();
          }} 
        />
      )}
    </div>
  );
}

export function CompanyModal({ onClose, onSuccess, initialData }: { onClose: () => void, onSuccess: () => void, initialData?: any }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    billingCycle: initialData?.billingCycle || 'monthly',
    contactPerson: initialData?.contactPerson || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    status: initialData?.status || 'active',
    openingBalance: initialData?.openingBalance || 0
  });
  
  const [roomRates, setRoomRates] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchDefaults = async () => {
      try {
        const [typesRes, ratesRes] = await Promise.all([
          roomTypeService.getAll(),
          roomRateService.getAll()
        ]);
        
        const defaults = typesRes.map(type => {
          // Check if editing and has an existing rate for this room type
          const existingRate = initialData?.rates?.find((r: any) => r.roomTypeId === type.id);
          if (existingRate) {
            return {
              roomTypeId: type.id,
              roomTypeName: type.name,
              rate: Number(existingRate.rate)
            };
          }

          // Otherwise use the default
          const defaultRateObj = ratesRes.find(r => r.roomTypeId === type.id);
          return {
            roomTypeId: type.id,
            roomTypeName: type.name,
            rate: defaultRateObj ? Number(defaultRateObj.rate) : 0
          };
        });
        setRoomRates(defaults);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDefaults();
  }, [initialData]);

  const handleRateChange = (roomTypeId: number, newRate: number) => {
    setRoomRates(prev => prev.map(r => r.roomTypeId === roomTypeId ? { ...r, rate: newRate } : r));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (initialData?.id) {
        // Update
        await groupService.update(initialData.id, formData);
        // Update each rate individually
        await Promise.all(roomRates.map(r => 
          groupService.updateRate({ groupId: initialData.id, roomTypeId: r.roomTypeId, rate: r.rate })
        ));
      } else {
        // Create
        const payload = {
          ...formData,
          roomTypeRates: roomRates.map(r => ({ roomTypeId: r.roomTypeId, rate: r.rate }))
        };
        await groupService.create(payload);
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      alert(`Failed to ${initialData ? 'update' : 'create'} company`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 overflow-y-auto py-10">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col relative">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-[#0F172A]">{initialData ? 'Edit Company' : 'Add New Company'}</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none" />
            </div>
            {!initialData && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance (PKR)</label>
                <input type="number" value={formData.openingBalance} onChange={e => setFormData({...formData, openingBalance: Number(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input type="text" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
              <select value={formData.billingCycle} onChange={e => setFormData({...formData, billingCycle: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none">
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-bold text-[#0F172A] mb-4">Special Room Type Rates</h3>
            <p className="text-sm text-gray-500 mb-4">Default rates are pre-filled. You can modify them for this company. These will be automatically applied when creating a reservation for this company.</p>
            
            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-3">Room Type</th>
                    <th className="px-4 py-3">Company Rate (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {roomRates.map(r => (
                    <tr key={r.roomTypeId}>
                      <td className="px-4 py-3 font-medium text-gray-900">{r.roomTypeName}</td>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          value={r.rate} 
                          onChange={(e) => handleRateChange(r.roomTypeId, Number(e.target.value))}
                          className="w-32 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                  {roomRates.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-center text-gray-500">No room types found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-[#1D4ED8] text-white rounded-lg hover:bg-[#1E40AF] transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : (initialData ? 'Update Company' : 'Save Company')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
