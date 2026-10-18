import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  RotateCcw,
  FolderPlus,
  RefreshCcw,
  ArrowLeft,
} from 'lucide-react';
import api from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';

type CategoryStatus = 'active' | 'inactive';

interface Category {
  id: number;
  name: string;
  description?: string;
  status?: CategoryStatus;
  createdAt?: string;
  updatedAt?: string;
  itemsCount?: number;
}

interface CategoryFormValues {
  name: string;
  description: string;
  status: CategoryStatus;
}

export default function Categories() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
    const { canEdit, canDelete, canEditOrDelete } = usePermissions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  const [formValues, setFormValues] = useState<CategoryFormValues>({
    name: '',
    description: '',
    status: 'active',
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof CategoryFormValues, string>>
  >({});

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      const data = res.data?.data || res.data?.categories || res.data || [];
      const list = Array.isArray(data) ? data : [];
      setCategories(list.map((cat: any) => ({
        id: cat.id,
        name: cat.name || cat.title || '',
        description: cat.description || '',
        status: cat.status || 'active',
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
        itemsCount: cat.itemsCount || cat.items?.length || 0,
      })));
    } catch (error) {
      console.error(error);
      alert('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return categories;

    return categories.filter((category) => {
      return (
        category.name?.toLowerCase().includes(term) ||
        category.description?.toLowerCase().includes(term) ||
        category.status?.toLowerCase().includes(term)
      );
    });
  }, [categories, searchTerm]);

  const resetForm = () => {
    setFormValues({
      name: '',
      description: '',
      status: 'active',
    });
    setErrors({});
    setEditingCategory(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormValues({
      name: category.name || '',
      description: category.description || '',
      status: category.status || 'active',
    });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof CategoryFormValues]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof CategoryFormValues, string>> = {};

    if (!formValues.name.trim()) {
      newErrors.name = 'Category name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);

    try {
      const payload = {
        name: formValues.name.trim(),
        description: formValues.description.trim(),
        status: formValues.status,
      };

      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, payload);
      } else {
        await api.post('/categories', payload);
      }

      alert(
        editingCategory
          ? 'Category updated successfully'
          : 'Category added successfully'
      );

      closeModal();
      fetchCategories();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || error?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`
    );

    if (!isConfirmed) return;

    try {
      await api.delete(`/categories/${category.id}`);
      alert('Category deleted successfully');
      fetchCategories();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || error?.message || 'Failed to delete category');
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const statusColors: Record<CategoryStatus, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-3xl font-bold text-[#0F172A]">Categories</h1>
            <p className="text-gray-600 mt-1">
              Manage inventory item categories
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-2 bg-[#1D4ED8] text-white px-6 py-3 rounded-lg hover:bg-[#1E40AF] transition-colors"
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />

            <input
              type="text"
              placeholder="Search by category name, description, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent text-sm bg-gray-50/50"
            />
          </div>

          <button
            type="button"
            onClick={fetchCategories}
            className="flex items-center justify-center gap-2 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          >
            <RefreshCcw size={17} />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0F172A] text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Category ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Items
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Created At
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    Loading categories...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    No categories found
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-[#1D4ED8]">
                      CAT-{category.id}
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {category.name}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                      <span className="line-clamp-2">
                        {category.description || '—'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {category.itemsCount || 0}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          statusColors[category.status || 'active']
                        }`}
                      >
                        {(category.status || 'active').charAt(0).toUpperCase() +
                          (category.status || 'active').slice(1)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(category.createdAt)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                       {canEdit && (
                        <button
                          type="button"
                          onClick={() => openEditModal(category)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-[#1D4ED8] hover:border-blue-200 transition-colors"
                          title="Edit"
                        >
                          <Edit size={15} />
                        </button>
                       )}

                       {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(category)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center">
                  <FolderPlus size={20} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#0F172A]">
                    {editingCategory ? 'Edit Category' : 'Add Category'}
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    {editingCategory
                      ? 'Update category details'
                      : 'Create a new item category'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Category Name <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formValues.name}
                    onChange={handleInputChange}
                    placeholder="Enter category name"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm ${
                      errors.name ? 'border-red-400' : 'border-gray-200'
                    }`}
                    autoFocus
                  />

                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={formValues.description}
                    onChange={handleInputChange}
                    placeholder="Enter category description"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Status
                  </label>

                  <select
                    name="status"
                    value={formValues.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-white transition-colors disabled:opacity-60"
                >
                  <RotateCcw size={16} />
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] transition-colors disabled:opacity-60"
                >
                  <Save size={16} />
                  {saving
                    ? 'Saving...'
                    : editingCategory
                      ? 'Update Category'
                      : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
