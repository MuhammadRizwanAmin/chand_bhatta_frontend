import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { DataTable, Column } from '../../components/DataTable';
import api from '../../services/api';

export function ExpenseCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/expense-types');
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSave = async (e: any) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/expense-types/${editingId}`, formData);
      } else {
        await api.post('/expense-types', formData);
      }
      setShowForm(false);
      setFormData({ name: '', description: '' });
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    }
  };

  const handleEdit = (cat: any) => {
    setFormData({ name: cat.name, description: cat.description || '' });
    setEditingId(cat.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/expense-types/${id}`);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const columns: Column<any>[] = [
    { header: 'ID', accessorKey: 'id', sortable: true },
    { header: 'Name', accessorKey: 'name', sortable: true, cell: (cat) => <span className="font-medium text-gray-900">{cat.name}</span> },
    { header: 'Description', accessorKey: 'description', sortable: true, cell: (cat) => <span className="text-gray-500">{cat.description || '-'}</span> },
    {
      header: 'Actions',
      cell: (cat) => (
        <div className="flex gap-1">
          <button onClick={() => handleEdit(cat)} className="p-2 text-gray-500 hover:text-[#1D4ED8] hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
          <button onClick={() => handleDelete(cat.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
        </div>
      )
    }
  ];

  if (loading) return <div className="p-6 text-center text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Expense Categories</h1>
          <p className="text-gray-600 mt-1">Manage types of expenses</p>
        </div>
        <button onClick={() => {
            setFormData({ name: '', description: '' });
            setEditingId(null);
            setShowForm(!showForm);
          }} className="flex items-center gap-2 bg-[#1D4ED8] text-white px-5 py-2.5 rounded-lg hover:bg-[#1E40AF] transition-colors">
          <Plus size={18} />Add Category
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-[#1D4ED8]/30">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">{editingId ? 'Edit Category' : 'Add New Category'}</h2>
          <form onSubmit={handleSave} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"></textarea>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="bg-[#1D4ED8] text-white px-6 py-2 rounded-lg hover:bg-[#1E40AF] transition-colors">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <DataTable columns={columns} data={categories} searchKeys={['name']} />
    </div>
  );
}
