import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, DollarSign, BedDouble } from 'lucide-react';
import { roomRateService, RoomRate, RoomRatePayload } from '../../services/roomRateService';
import { roomTypeService, RoomType } from '../../services/roomTypeService';
import { bedService, Bed } from '../../services/bedService';
import { usePermissions } from '../../hooks/usePermissions';

const defaultForm: RoomRatePayload = {
  roomTypeId: 0,
  bedTypeId: 0,
  capacity: '2',
  extraCapability: 'Yes',
  rate: '',
  webRate: '',
  discount: 0,
  bedCharge: '0',
  personCharge: '0',
  roomSize: '0',
  roomSizeOption: 'sqft',
  bedNo: '1',
  description: '',
};

export function RoomTypeRates() {
  const [rates, setRates] = useState<RoomRate[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<RoomRate | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<RoomRatePayload>(defaultForm);
  const [loading, setLoading] = useState(false);
  const { canEdit, canDelete } = usePermissions();

  const fetchAll = async () => {
    try {
      const [r, rt, b] = await Promise.all([
        roomRateService.getAll(),
        roomTypeService.getAll(),
        bedService.getAll(),
      ]);
      setRates(r || []);
      setRoomTypes(rt || []);
      setBeds(b || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => {
    setEditItem(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (rate: RoomRate) => {
    setEditItem(rate);
    setForm({
      roomTypeId: rate.roomTypeId,
      bedTypeId: rate.bedTypeId,
      capacity: rate.capacity,
      extraCapability: rate.extraCapability,
      rate: rate.rate,
      webRate: rate.webRate,
      discount: rate.discount,
      bedCharge: rate.bedCharge,
      personCharge: rate.personCharge,
      roomSize: rate.roomSize,
      roomSizeOption: rate.roomSizeOption,
      bedNo: rate.bedNo,
      description: rate.description || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
    setForm(defaultForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.roomTypeId || !form.bedTypeId) {
      alert('Please select Room Type and Bed Type.');
      return;
    }
    setLoading(true);
    try {
      if (editItem) {
        await roomRateService.update(editItem.id, form);
      } else {
        await roomRateService.create(form);
      }
      closeModal();
      fetchAll();
    } catch (err) {
      console.error(err);
      alert('Failed to save room rate.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await roomRateService.delete(deleteId);
      setDeleteId(null);
      fetchAll();
    } catch (err) {
      console.error(err);
      alert('Failed to delete.');
    }
  };

  const set = (key: keyof RoomRatePayload, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const getRoomTypeName = (id: number) => roomTypes.find((r) => r.id === id)?.name || '—';
  const getBedName = (id: number) => beds.find((b) => b.id === id)?.name || '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Room Type Rates</h1>
          <p className="text-gray-600 mt-1">Configure pricing and capacity per room type</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#1D4ED8] text-white px-6 py-3 rounded-lg hover:bg-[#1E40AF] transition-colors">
          <Plus size={20} /> Add Rate
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#0F172A]">Rate Configuration</h2>
        </div>

        {rates.length === 0 ? (
          <div className="p-16 text-center">
            <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No rates configured yet.</p>
            <p className="text-gray-400 text-sm mt-1">Add rates to define pricing per room type.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Room Type', 'Bed Type', 'Capacity', 'Rate/Night', 'Web Rate', 'Discount', 'Bed Charge', 'Person Charge', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rates.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <span className="font-medium text-[#0F172A] text-sm">{r.RoomType?.name || getRoomTypeName(r.roomTypeId)}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{r.bedType?.name || getBedName(r.bedTypeId)}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{r.capacity}</td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-green-700">PKR {r.rate}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">PKR {r.webRate}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{r.discount}%</td>
                    <td className="px-4 py-4 text-sm text-gray-600">PKR {r.bedCharge}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">PKR {r.personCharge}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                       {canEdit && (
                        <button onClick={() => openEdit(r)} className="p-1.5 text-gray-500 hover:text-[#1D4ED8] hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit size={15} />
                        </button>
                       )}
                       {canDelete && (
                        <button onClick={() => setDeleteId(r.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={15} />
                        </button>
                       )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#0F172A]">{editItem ? 'Edit Rate' : 'Add Room Rate'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Row 1 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Type <span className="text-red-500">*</span></label>
                  <select required value={form.roomTypeId} onChange={(e) => set('roomTypeId', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
                    <option value={0}>Select room type</option>
                    {roomTypes.map((rt) => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bed Type <span className="text-red-500">*</span></label>
                  <select required value={form.bedTypeId} onChange={(e) => set('bedTypeId', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
                    <option value={0}>Select bed type</option>
                    {beds.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate / Night (PKR)</label>
                  <input type="number" required value={form.rate} onChange={(e) => set('rate', e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Web Rate (PKR)</label>
                  <input type="number" value={form.webRate} onChange={(e) => set('webRate', e.target.value)}
                    placeholder="e.g. 4500"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                  <input type="number" min={0} max={100} value={form.discount} onChange={(e) => set('discount', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Guests)</label>
                  <input type="number" min={1} value={form.capacity} onChange={(e) => set('capacity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bed Charge (PKR)</label>
                  <input type="number" value={form.bedCharge} onChange={(e) => set('bedCharge', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Person Charge (PKR)</label>
                  <input type="number" value={form.personCharge} onChange={(e) => set('personCharge', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. of Beds</label>
                  <input type="number" min={1} value={form.bedNo} onChange={(e) => set('bedNo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Extra Capability</label>
                  <select value={form.extraCapability} onChange={(e) => set('extraCapability', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Size</label>
                  <div className="flex gap-2">
                    <input type="number" value={form.roomSize} onChange={(e) => set('roomSize', e.target.value)}
                      placeholder="e.g. 25"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
                    <select value={form.roomSizeOption} onChange={(e) => set('roomSizeOption', e.target.value)}
                      className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
                      <option value="sqft">sqft</option>
                      <option value="sqm">sqm</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)}
                  placeholder="Optional description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] resize-none" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-[#1D4ED8] text-white rounded-lg hover:bg-[#1E40AF] transition-colors disabled:opacity-60">
                  {loading ? 'Saving...' : editItem ? 'Save Changes' : 'Add Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-[#0F172A] mb-2">Delete Rate</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to remove this rate configuration?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
