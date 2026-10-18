import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

export function AddEditAsset() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  const [formValues, setFormValues] = useState({
    title: "",
    costPrice: "",
    sellPrice: "",
    quantity: 1,
    description: "",
    isDepreciable: false,
    depreciationType: "Monthly",
    depreciationMethod: "Fixed",
    depreciationValue: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit) {
      fetchAsset();
    }
  }, [id]);

  const fetchAsset = async () => {
    try {
      const res = await api.get(`/inventory/single/${id}`);
      const data = res.data;
      if (data) {
        setFormValues({
          title: data.title || "",
          costPrice: data.costPrice?.toString() || "",
          sellPrice: data.sellPrice?.toString() || "",
          quantity: data.quantity || 1,
          description: data.description || "",
          isDepreciable: data.isDepreciable || false,
          depreciationType: data.depreciationType || "Monthly",
          depreciationMethod: data.depreciationMethod || "Fixed",
          depreciationValue: data.depreciationValue?.toString() || "",
        });
      }
    } catch (error) {
      console.error('Error fetching asset:', error);
      toast.error('Failed to fetch asset details');
      navigate('/assets');
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    setFormValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (/^\d*\.?\d*$/.test(value)) {
      setFormValues((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formValues.title) newErrors.title = "Asset name is required";
    if (!formValues.costPrice) newErrors.costPrice = "Cost price is required";
    if (!formValues.quantity) newErrors.quantity = "Quantity is required";
    if (formValues.isDepreciable && !formValues.depreciationValue) {
      newErrors.depreciationValue = "Depreciation value is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formValues.title,
        costPrice: Number(formValues.costPrice) || 0,
        sellPrice: Number(formValues.sellPrice) || 0,
        quantity: Number(formValues.quantity) || 1,
        description: formValues.description,
        isDepreciable: formValues.isDepreciable,
        depreciationType: formValues.isDepreciable ? formValues.depreciationType : null,
        depreciationMethod: formValues.isDepreciable ? formValues.depreciationMethod : "Fixed",
        depreciationValue: formValues.isDepreciable ? Number(formValues.depreciationValue) : 0,
      };

      if (isEdit) {
        await api.put(`/inventory/update/${id}`, payload);
        toast.success("Asset updated successfully!");
      } else {
        await api.post(`/inventory`, payload);
        toast.success("Asset added successfully!");
      }
      navigate('/assets');
    } catch (error: any) {
      console.error("Error saving asset:", error);
      toast.error(error?.response?.data?.message || "Failed to save asset");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-6 text-center text-gray-500">Loading asset...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/assets')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">{isEdit ? 'Edit Asset' : 'Add New Asset'}</h1>
          <p className="text-gray-600 text-sm mt-1">Fill in the asset details below</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Asset Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
            Asset Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Asset Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formValues.title}
                onChange={handleInputChange}
                placeholder="e.g. Dell XPS 15"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none ${errors.title ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-[#1D4ED8]'}`}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Cost Price <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="costPrice"
                value={formValues.costPrice}
                onChange={handleNumericInput}
                placeholder="0.00"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none ${errors.costPrice ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-[#1D4ED8]'}`}
              />
              {errors.costPrice && <p className="text-red-500 text-xs mt-1">{errors.costPrice}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Sell Price
              </label>
              <input
                type="text"
                name="sellPrice"
                value={formValues.sellPrice}
                onChange={handleNumericInput}
                placeholder="0.00"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="quantity"
                value={formValues.quantity}
                onChange={handleNumericInput}
                placeholder="1"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none ${errors.quantity ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-[#1D4ED8]'}`}
              />
              {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                name="description"
                value={formValues.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Asset description or notes..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Depreciation Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
            Depreciation Settings
          </h2>
          
          <label className="flex items-center gap-3 cursor-pointer mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="relative inline-block w-10 h-6 shrink-0">
              <input
                type="checkbox"
                name="isDepreciable"
                checked={formValues.isDepreciable}
                onChange={handleInputChange}
                className="peer sr-only"
              />
              <div className="w-10 h-6 bg-gray-300 rounded-full peer-checked:bg-[#1D4ED8] transition-colors"></div>
              <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4"></div>
            </div>
            <span className="text-sm font-semibold text-gray-900">Is this asset depreciable?</span>
          </label>

          {formValues.isDepreciable && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 fade-in duration-200">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Depreciation Interval
                </label>
                <select
                  name="depreciationType"
                  value={formValues.depreciationType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] outline-none bg-white"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Depreciation Method
                </label>
                <select
                  name="depreciationMethod"
                  value={formValues.depreciationMethod}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] outline-none bg-white"
                >
                  <option value="Fixed">Fixed Amount</option>
                  <option value="Percentage">Percentage (%)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {formValues.depreciationMethod === "Percentage" ? "Percentage (%)" : "Fixed Amount"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="depreciationValue"
                  value={formValues.depreciationValue}
                  onChange={handleNumericInput}
                  placeholder={formValues.depreciationMethod === "Percentage" ? "e.g. 5" : "e.g. 100"}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none ${errors.depreciationValue ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-[#1D4ED8]'}`}
                />
                {errors.depreciationValue && <p className="text-red-500 text-xs mt-1">{errors.depreciationValue}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/assets')}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-[#1D4ED8] text-white rounded-lg font-medium hover:bg-[#1E40AF] transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            {isEdit ? 'Update Asset' : 'Save Asset'}
          </button>
        </div>
      </form>
    </div>
  );
}
