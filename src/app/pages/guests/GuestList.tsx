import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Search, Plus, Mail, Phone, Eye, Edit, Trash2, X } from 'lucide-react';
import { customerService } from '../../services/customerService';
import { usePermissions } from '../../hooks/usePermissions';

export function GuestList() {
  const navigate = useNavigate();
    const { canEdit, canDelete } = usePermissions();


  const [searchTerm, setSearchTerm] = useState('');
  const [filterVIP, setFilterVIP] = useState<string>('all');

  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [editingGuestId, setEditingGuestId] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    cnic: '',
    address: '',
  });

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    setLoading(true);
    try {
      const res = await customerService.getAll();
      setGuests(res.data || []);
    } catch (err) {
      console.error('Failed to fetch guests', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    let finalValue = value;

    if (name === 'phone' || name === 'cnic') {
      finalValue = value.replace(/\D/g, '');
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      cnic: '',
      address: '',
    });
  };

  const openAddModal = () => {
    setEditingGuestId(null);
    resetForm();
    setIsGuestModalOpen(true);
  };

  const openEditModal = (guest: any) => {
    setEditingGuestId(guest.id);

    setFormData({
      name: guest.name || '',
      phone: guest.phone || '',
      email: guest.email || '',
      cnic: guest.cnic || '',
      address: guest.address || '',
    });

    setIsGuestModalOpen(true);
  };

  const closeGuestModal = () => {
    setEditingGuestId(null);
    resetForm();
    setIsGuestModalOpen(false);
  };

  const handleDelete = async (id: any) => {
    if (window.confirm('Are you sure you want to delete this guest?')) {
      try {
        await customerService.delete(id);
        fetchGuests();
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleSubmitGuest = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Guest name is required');
      return;
    }

    if (!formData.phone.trim()) {
      alert('Phone number is required');
      return;
    }

    if (!formData.cnic.trim()) {
      alert('CNIC is required');
      return;
    }

    if (!/^\d+$/.test(formData.phone)) {
      alert('Phone number must contain numbers only');
      return;
    }

    if (!/^\d+$/.test(formData.cnic)) {
      alert('CNIC must contain numbers only');
      return;
    }

    setSaving(true);

    try {
      if (editingGuestId) {
        await customerService.update(editingGuestId, formData);
      } else {
        await customerService.create(formData);
      }

      closeGuestModal();
      fetchGuests();
    } catch (err) {
      console.error('Failed to save guest', err);
      alert(editingGuestId ? 'Failed to update guest' : 'Failed to add guest');
    } finally {
      setSaving(false);
    }
  };

  const filteredGuests = guests.filter((guest) => {
    const matchesSearch =
      guest.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.phone?.includes(searchTerm) ||
      String(guest.cnic || '').toLowerCase().includes(searchTerm.toLowerCase());

    const isVIP = false;

    const matchesVIP =
      filterVIP === 'all' ||
      (filterVIP === 'vip' && isVIP) ||
      (filterVIP === 'regular' && !isVIP);

    return matchesSearch && matchesVIP;
  });

  const stats = {
    total: guests.length,
    vip: 0,
    regular: guests.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Guest Directory</h1>
          <p className="text-gray-600 mt-1">Manage guest information and history</p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-[#1D4ED8] text-white px-6 py-3 rounded-lg hover:bg-[#1E40AF] transition-colors"
        >
          <Plus size={20} />
          Add Guest
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#1D4ED8]">
          <div className="text-gray-600 text-sm">Total Guests</div>
          <div className="text-2xl font-bold text-[#0F172A] mt-1">{stats.total}</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#D4A017]">
          <div className="text-gray-600 text-sm">VIP Guests</div>
          <div className="text-2xl font-bold text-[#D4A017] mt-1">{stats.vip}</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-gray-400">
          <div className="text-gray-600 text-sm">Regular Guests</div>
          <div className="text-2xl font-bold text-gray-600 mt-1">{stats.regular}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />

            <input
              type="text"
              placeholder="Search by name, email, phone, or CNIC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>

          <select
            value={filterVIP}
            onChange={(e) => setFilterVIP(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
          >
            <option value="all">All Guests</option>
            <option value="vip">VIP Only</option>
            <option value="regular">Regular Only</option>
          </select>
        </div>
      </div>

      {/* Guests Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0F172A] text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Guest ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Contact</th>
                {/* <th className="px-6 py-4 text-left text-sm font-semibold">Nationality</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">ID Details</th> */}
                {/* <th className="px-6 py-4 text-left text-sm font-semibold">Total Stays</th> */}
                <th className="px-6 py-4 text-left text-sm font-semibold">Total Spent</th>
                {/* <th className="px-6 py-4 text-left text-sm font-semibold">Last Visit</th> */}
                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    Loading guests...
                  </td>
                </tr>
              ) : filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No guests found.
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50 transition-colors ">
                    <td className="px-6 py-4 cursor-pointer"  onClick={() => navigate(`/guests/${guest.id}`)}> 
                      <span className="text-sm font-medium text-[#1D4ED8]">
                        G{guest.id}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#1D4ED8]/10 rounded-full flex items-center justify-center">
                          <span className="text-[#1D4ED8] font-semibold">
                            {(guest.name || 'G').charAt(0).toUpperCase()}
                          </span>
                        </div>

                        <span className="text-sm font-medium text-gray-900">
                          {guest.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <Mail size={14} className="text-gray-400" />
                          {guest.email || 'N/A'}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <Phone size={14} className="text-gray-400" />
                          {guest.phone || 'N/A'}
                        </div>
                      </div>
                    </td>

                    {/* <td className="px-6 py-4 text-sm text-gray-900">PK</td> */}

                    {/* <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-gray-500">CNIC</div>
                        <div className="text-gray-900 font-medium">
                          {guest.cnic || 'N/A'}
                        </div>
                      </div>
                    </td> */}

                    {/* <td className="px-6 py-4 text-sm text-center font-medium text-gray-900">
                      {guest.reservations?.length || 0}
                    </td> */}

                    <td className="px-6 py-4 text-sm font-bold text-[#D4A017]">
                      PKR{' '}
                      {guest.reservations
                        ?.reduce(
                          (acc: any, curr: any) =>
                            acc + (Number(curr.totalAmount) || 0),
                          0
                        )
                        .toLocaleString() || 0}
                    </td>

                    {/* <td className="px-6 py-4 text-sm text-gray-900">
                      {guest.reservations?.length > 0
                        ? new Date(guest.reservations[0].startDate).toLocaleDateString()
                        : 'N/A'}
                    </td> */}

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/guests/${guest.id}`)}
                          className="p-2 text-gray-600 hover:text-[#1D4ED8] hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye size={16} />
                        </button>
 {canEdit && (
                        <button
                          onClick={() => openEditModal(guest)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
 )}
 {canDelete && (
                        <button
                          onClick={() => handleDelete(guest.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
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

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredGuests.length} of {guests.length} guests
          </div>

          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Previous
            </button>
            <button className="px-4 py-2 bg-[#1D4ED8] text-white rounded-lg">1</button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Guest Modal */}
      {isGuestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-xl font-bold text-[#0F172A]">
                  {editingGuestId ? 'Edit Guest' : 'Add New Guest'}
                </h2>
                <p className="text-sm text-gray-500">
                  {editingGuestId ? 'Update customer profile' : 'Create a new customer profile'}
                </p>
              </div>

              <button
                onClick={closeGuestModal}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitGuest} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guest Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter guest name"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CNIC *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    name="cnic"
                    value={formData.cnic}
                    onChange={handleInputChange}
                    placeholder="Enter CNIC"
                    required
                    maxLength={13}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter address"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeGuestModal}
                  className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#1D4ED8] text-white rounded-lg hover:bg-[#1E40AF] disabled:opacity-60 transition-colors"
                >
                  {saving ? 'Saving...' : editingGuestId ? 'Update Guest' : 'Save Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}