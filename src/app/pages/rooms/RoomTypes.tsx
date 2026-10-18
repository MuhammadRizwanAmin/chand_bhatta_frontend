import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, BedDouble, X, Tag } from 'lucide-react';
import { roomTypeService, RoomType } from '../../services/roomTypeService';
import { usePermissions } from '../../hooks/usePermissions';

const cardColors = [
  'from-gray-500 to-gray-600',
  'from-[#1D4ED8] to-[#3B82F6]',
  'from-[#D4A017] to-[#F59E0B]',
  'from-[#8B5CF6] to-[#A78BFA]',
  'from-emerald-500 to-emerald-600',
  'from-rose-500 to-rose-600',
];

export function RoomTypes() {
    const { canEdit, canDelete } = usePermissions();

  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<RoomType | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchRoomTypes = async () => {
    try {
      const data = await roomTypeService.getAll();
      setRoomTypes(data || []);
    } catch (err) {
      console.error('Failed to fetch room types', err);
    }
  };

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setLoading(true);
    try {
      await roomTypeService.create(formName.trim());
      setFormName('');
      setShowAddModal(false);
      fetchRoomTypes();
    } catch (err) {
      console.error(err);
      alert('Failed to create room type.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem || !formName.trim()) return;
    setLoading(true);
    try {
      await roomTypeService.update(editItem.id, formName.trim());
      setEditItem(null);
      setFormName('');
      fetchRoomTypes();
    } catch (err) {
      console.error(err);
      alert('Failed to update room type.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await roomTypeService.delete(deleteId);
      setDeleteId(null);
      fetchRoomTypes();
    } catch (err) {
      console.error(err);
      alert('Failed to delete room type.');
    }
  };

  const openEditModal = (rt: RoomType) => {
    setEditItem(rt);
    setFormName(rt.name);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditItem(null);
    setFormName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Room Types</h1>
          <p className="text-gray-600 mt-1">Configure and manage room categories</p>
        </div>
        <button
          onClick={() => { setShowAddModal(true); setFormName(''); }}
          className="flex items-center gap-2 bg-[#1D4ED8] text-white px-6 py-3 rounded-lg hover:bg-[#1E40AF] transition-colors"
        >
          <Plus size={20} /> Add Room Type
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#1D4ED8]">
          <div className="text-gray-500 text-sm">Total Types</div>
          <div className="text-2xl font-bold text-[#1D4ED8] mt-1">{roomTypes.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
          <div className="text-gray-500 text-sm">Active</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{roomTypes.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-purple-500">
          <div className="text-gray-500 text-sm">Last Added</div>
          <div className="text-lg font-bold text-purple-600 mt-1 truncate">
            {roomTypes.length > 0 ? roomTypes[0].name : '—'}
          </div>
        </div>
      </div>

      {/* Room Type Cards */}
      {roomTypes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-16 text-center">
          <BedDouble size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No room types yet</p>
          <p className="text-gray-400 text-sm mt-1">Click "Add Room Type" to create your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {roomTypes.map((rt, idx) => (
            <div key={rt.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className={`bg-gradient-to-r ${cardColors[idx % cardColors.length]} p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{rt.name}</h3>
                    <p className="text-white/70 text-xs mt-1">Room Type #{rt.id}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <BedDouble size={24} />
                  </div>
                </div>
              </div>
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Tag size={14} />
                  <span>{rt.name}</span>
                </div>
                <div className="flex gap-2">
                 {canEdit && (
                  <button
                    onClick={() => openEditModal(rt)}
                    className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Edit size={14} /> Edit
                  </button>
                 )}
                 {canDelete && (
                  <button
                    onClick={() => setDeleteId(rt.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                 )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {(showAddModal || editItem) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-[#0F172A]">
                {editItem ? 'Edit Room Type' : 'Add Room Type'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={editItem ? handleEdit : handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Deluxe, Suite, Standard"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#1D4ED8] text-white rounded-lg hover:bg-[#1E40AF] transition-colors disabled:opacity-60"
                >
                  {loading ? 'Saving...' : editItem ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-[#0F172A] mb-2">Delete Room Type</h2>
            <p className="text-gray-600 mb-6">Are you sure? This may affect rooms assigned to this type.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
