import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Star,
  Edit,
  Trash2,
  Award,
  CheckCircle,
  XCircle,
  X,
} from 'lucide-react';
import apiURl from 'url';
import { membershipService } from '../../services/membershipPlanService';
import { useConfirm } from '../../components/ConfirmProvider';

type MembershipStatus = boolean | 'active' | 'inactive' | string;

interface MembershipPlan {
  id: string | number;
  name: string;
  price?: number | string;
  duration?: number | string;
  discountPercent?: number | string;
  benefits?: string | string[];
  status?: MembershipStatus;
  createdAt?: string;
  updatedAt?: string;
}

interface MembershipFormValues {
  name: string;
  price: string;
  duration: string;
  discountPercent: string;
  benefits: string;
  status: boolean;
}

const emptyForm: MembershipFormValues = {
  name: '',
  price: '',
  duration: '',
  discountPercent: '',
  benefits: '',
  status: true,
};

const formatDuration = (duration?: number | string) => {
  const days = Number(duration || 0);

  if (!days) return 'No expiry';
  if (days === 1) return '1 Day';
  if (days < 7) return `${days} Days`;
  if (days === 7) return '1 Week';
  if (days < 30) return `${Math.round(days / 7)} Weeks`;
  if (days === 30) return '1 Month';
  if (days < 365) return `${Math.round(days / 30)} Months`;
  if (days === 365) return '1 Year';

  return `${Math.round(days / 365)} Years`;
};

const formatPrice = (price?: number | string) => {
  return `Rs. ${Number(price || 0).toLocaleString('en-PK')}`;
};

const isPlanActive = (status?: MembershipStatus) => {
  return status === true || status === 'active' || status === 'Active' || status === 'true';
};

const getBenefitsList = (benefits?: string | string[]) => {
  if (!benefits) return [];

  if (Array.isArray(benefits)) {
    return benefits.map((b) => String(b).trim()).filter(Boolean);
  }

  return benefits
    .split(/[\n,]+/)
    .map((b) => b.trim())
    .filter(Boolean);
};

export function Membership() {
  const [memberships, setMemberships] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [formValues, setFormValues] = useState<MembershipFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | number | null>(null);

const fetchMemberships = async () => {
  setLoading(true);
  setError('');

  try {
    const result = await membershipService.getAll();

    const list = Array.isArray(result)
      ? result
      : Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result?.plans)
          ? result.plans
          : Array.isArray(result?.memberships)
            ? result.memberships
            : [];

    setMemberships(list);
  } catch (err) {
    console.error(err);
    setError('Unable to load memberships. Please check the API route.');
    setMemberships([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchMemberships();
  }, []);

  const filtered = useMemo(() => {
    return memberships.filter((plan) => {
      const search = searchTerm.toLowerCase();

      const matchSearch =
        String(plan.id).toLowerCase().includes(search) ||
        String(plan.name || '').toLowerCase().includes(search);

      const active = isPlanActive(plan.status);

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && active) ||
        (statusFilter === 'inactive' && !active);

      return matchSearch && matchStatus;
    });
  }, [memberships, searchTerm, statusFilter]);
  const { confirm } = useConfirm();

  const totalPlans = memberships.length;
  const activePlans = memberships.filter((p) => isPlanActive(p.status)).length;
  const inactivePlans = totalPlans - activePlans;

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedPlan(null);
    setFormValues(emptyForm);
    setShowFormModal(true);
  };

  const handleOpenEdit = (plan: MembershipPlan) => {
    setIsEditing(true);
    setSelectedPlan(plan);

    setFormValues({
      name: plan.name || '',
      price: String(plan.price || ''),
      duration: String(plan.duration || ''),
      discountPercent: String(plan.discountPercent || ''),
      benefits: Array.isArray(plan.benefits)
        ? plan.benefits.join(', ')
        : plan.benefits || '',
      status: isPlanActive(plan.status),
    });

    setShowFormModal(true);
  };

  const handleCloseModal = () => {
    if (saving) return;

    setShowFormModal(false);
    setIsEditing(false);
    setSelectedPlan(null);
    setFormValues(emptyForm);
  };

  const handleFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormValues((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

const handleFormSubmit = async () => {
  if (!formValues.name.trim()) {
    alert('Plan name is required.');
    return;
  }

  setSaving(true);

  try {
    const payload = {
      name: formValues.name.trim(),
      price: Number(formValues.price || 0),
      duration: Number(formValues.duration || 0),
      discountPercent: Number(formValues.discountPercent || 0),
      benefits: formValues.benefits,
      status: formValues.status,
    };

    if (isEditing && selectedPlan) {
      await membershipService.update(selectedPlan.id, payload);
    } else {
      await membershipService.create(payload);
    }

    await fetchMemberships();

    setShowFormModal(false);
    setIsEditing(false);
    setSelectedPlan(null);
    setFormValues(emptyForm);

    alert(
      isEditing
        ? 'Membership updated successfully.'
        : 'Membership created successfully.'
    );
  } catch (err) {
    console.error(err);

    alert(
      isEditing
        ? 'Unable to update membership. Please check the API.'
        : 'Unable to create membership. Please check the API.'
    );
  } finally {
    setSaving(false);
  }
};

 const handleDelete = async (plan: MembershipPlan) => {
   const isConfirmed = await confirm({
      title: "Delete Booking",
      message: "Are you sure you want to delete this booking? This action cannot be undone."
    });

    if (isConfirmed) {

  setDeletingId(plan.id);

  try {
    await membershipService.delete(plan.id);

    await fetchMemberships();
    alert('Membership deleted successfully.');
  } catch (err) {
    console.error(err);
    alert('Unable to delete membership. Please check the API route.');
  } finally {
    setDeletingId(null);
  }
};}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Membership Plans</h1>
          <p className="text-gray-600 mt-1">Manage all membership plans dynamically</p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-[#1D4ED8] text-white px-6 py-3 rounded-lg hover:bg-[#1E40AF] transition-colors"
        >
          <Plus size={20} />
          Add Membership
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl p-5 shadow-sm bg-blue-100 text-blue-800 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Award size={18} />
            <span className="font-semibold">Total Memberships</span>
          </div>
          <div className="text-2xl font-bold">{totalPlans}</div>
          <div className="text-xs opacity-70 mt-0.5">plans</div>
        </div>

        <div className="rounded-xl p-5 shadow-sm bg-green-100 text-green-800 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={18} />
            <span className="font-semibold">Active</span>
          </div>
          <div className="text-2xl font-bold">{activePlans}</div>
          <div className="text-xs opacity-70 mt-0.5">active plans</div>
        </div>

        <div className="rounded-xl p-5 shadow-sm bg-red-100 text-red-800 border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <XCircle size={18} />
            <span className="font-semibold">Inactive</span>
          </div>
          <div className="text-2xl font-bold">{inactivePlans}</div>
          <div className="text-xs opacity-70 mt-0.5">inactive plans</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />

            <input
              type="text"
              placeholder="Search membership..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-500">
          Loading memberships...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center">
          <div className="text-4xl mb-3">🪪</div>
          <h3 className="text-lg font-semibold text-gray-800">No Memberships Found</h3>
<p className="text-gray-500 mt-1">
  No membership plans are available yet.
</p>        </div>
      )}

      {/* Table */}
      {!loading && !error && filtered.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0F172A] text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Membership</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Duration</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Discount</th>
                  {/* <th className="px-6 py-4 text-left text-sm font-semibold">Benefits</th> */}
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.map((plan) => {
                  const benefits = getBenefitsList(plan.benefits);
                  const active = isPlanActive(plan.status);

                  return (
                    <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-[#1D4ED8]">
                        #{plan.id}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1D4ED8] flex items-center justify-center">
                            <Award size={16} className="text-white" />
                          </div>

                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {plan.name || 'Unnamed Plan'}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                              <Star size={10} />
                              Membership Plan
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {formatPrice(plan.price)}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatDuration(plan.duration)}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          {Number(plan.discountPercent || 0)}% OFF
                        </span>
                      </td>

                      {/* <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                        {benefits.length > 0 ? (
                          <div className="space-y-1">
                            {benefits.slice(0, 2).map((benefit, index) => (
                              <div key={index} className="truncate">
                                • {benefit}
                              </div>
                            ))}

                            {benefits.length > 2 && (
                              <div className="text-xs text-gray-400">
                                +{benefits.length - 2} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No benefits</span>
                        )}
                      </td> */}

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          {active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(plan)}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(plan)}
                            disabled={deletingId === plan.id}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showFormModal && (
        <div className=" fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">            <div className="flex items-center justify-between px-6 py-4 border-b ">
              <h2 className="text-xl font-bold text-[#0F172A]">
                {isEditing ? 'Edit Membership Plan' : 'Add New Membership Plan'}
              </h2>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={22} />
              </button>
            </div>

           <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formValues.name}
                  onChange={handleFormChange}
                  placeholder="Gold Plan"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formValues.price}
                    onChange={handleFormChange}
                    placeholder="5000"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration Days
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formValues.duration}
                    onChange={handleFormChange}
                    placeholder="30"
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />

                  {formValues.duration && (
                    <p className="text-xs text-gray-400 mt-1">
                      = {formatDuration(formValues.duration)}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount %
                  </label>
                  <input
                    type="number"
                    name="discountPercent"
                    value={formValues.discountPercent}
                    onChange={handleFormChange}
                    placeholder="10"
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={String(formValues.status)}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        status: e.target.value === 'true',
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Benefits
                </label>
                <textarea
                  name="benefits"
                  value={formValues.benefits}
                  onChange={handleFormChange}
                  placeholder="Free breakfast, Room discount, Priority booking"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
                <p className="text-xs text-gray-400 mt-1">
You can enter benefits separated by commas or new lines.                </p>
              </div>

              {(formValues.name || formValues.price || formValues.duration) && (
                <div className="bg-[#0F172A] rounded-xl p-4 text-white">
                  <div className="text-xs uppercase tracking-widest text-white/50 mb-1">
                    Preview
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-lg">
                        {formValues.name || 'Plan Name'}
                      </div>
                      <div className="text-sm text-white/60">
                        {formatDuration(formValues.duration)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-extrabold text-xl">
                        {formatPrice(formValues.price)}
                      </div>

                      {Number(formValues.discountPercent || 0) > 0 && (
                        <div className="text-xs text-yellow-300">
                          {Number(formValues.discountPercent || 0)}% OFF
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleFormSubmit}
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] disabled:opacity-50"
              >
                {saving
                  ? 'Saving...'
                  : isEditing
                    ? 'Save Changes'
                    : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}