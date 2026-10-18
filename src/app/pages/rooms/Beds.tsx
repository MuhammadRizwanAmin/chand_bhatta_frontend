import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, BedDouble, X } from 'lucide-react';
import { bedService, Bed } from '../../services/bedService';
import { usePermissions } from '../../hooks/usePermissions';

export function Beds() {
    const { canEdit, canDelete } = usePermissions();

  const [beds, setBeds] = useState<Bed[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Bed | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchBeds = async () => {
    try {
      const data = await bedService.getAll();
      setBeds(data || []);
    } catch (err) {
      console.error('Failed to fetch beds', err);
    }
  };

  useEffect(() => { fetchBeds(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setLoading(true);
    try {
      if (editItem) {
        await bedService.update(editItem.id, formName.trim());
      } else {
        await bedService.create(formName.trim());
      }
      closeModal();
      fetchBeds();
    } catch (err) {
      console.error(err);
      alert('Failed to save bed type.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await bedService.delete(deleteId);
      setDeleteId(null);
      fetchBeds();
    } catch (err) {
      console.error(err);
      alert('Failed to delete bed type.');
    }
  };

  const openEditModal = (bed: Bed) => {
    setEditItem(bed);
    setFormName(bed.name);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
    setFormName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Bed Types</h1>
          <p className="text-gray-600 mt-1">Manage bed configurations for your rooms</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setFormName(''); setEditItem(null); }}
          className="flex items-center gap-2 bg-[#1D4ED8] text-white px-6 py-3 rounded-lg hover:bg-[#1E40AF] transition-colors"
        >
          <Plus size={20} /> Add Bed Type
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 max-w-xs">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#1D4ED8]">
          <div className="text-gray-500 text-sm">Total Types</div>
          <div className="text-2xl font-bold text-[#1D4ED8] mt-1">{beds.length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#0F172A]">All Bed Types</h2>
        </div>

        {beds.length === 0 ? (
          <div className="p-16 text-center">
            <BedDouble size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No bed types yet. Add your first one!</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bed Type Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {beds.map((bed, idx) => (
                <tr key={bed.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BedDouble size={16} className="text-[#1D4ED8]" />
                      </div>
                      <span className="font-medium text-[#0F172A]">{bed.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {bed.createdAt ? new Date(bed.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                     {canEdit && (
                      <button
                        onClick={() => openEditModal(bed)}
                        className="p-2 text-gray-500 hover:text-[#1D4ED8] hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                     )}
                     {canDelete && (
                      <button
                        onClick={() => setDeleteId(bed.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                     )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-[#0F172A]">
                {editItem ? 'Edit Bed Type' : 'Add Bed Type'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bed Type Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Single, Double, Queen, King"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-[#1D4ED8] text-white rounded-lg hover:bg-[#1E40AF] transition-colors disabled:opacity-60">
                  {loading ? 'Saving...' : editItem ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-[#0F172A] mb-2">Delete Bed Type</h2>
            <p className="text-gray-600 mb-6">Are you sure? This may affect rooms using this bed type.</p>
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
