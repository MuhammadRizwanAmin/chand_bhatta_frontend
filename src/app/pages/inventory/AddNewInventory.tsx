import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router';
import api from '../../services/api';
import {
  ArrowLeft,
  ImagePlus,
  X,
  Package,
  DollarSign,
  Boxes,
  Save,
  RotateCcw,
  UploadCloud,
} from 'lucide-react';
import { InventoryService } from '../../services/inventory/inventoryService';
import { toast } from 'sonner';

type Option = {
  label: string;
  value: string | number;
};

type ItemFormValues = {
  name: string;
  sku: string;
  category: Option | null;
  unit: Option | null;
  costPrice: string;
  sellPrice: string;
  managestock: boolean;
  ispos:boolean;
  stockAlertQuantity: string;
  description: string;
  tax: string;
  discountType: 'fixed' | 'percentage';
  discountValue: string;
};

type FormErrors = Partial<Record<keyof ItemFormValues, string>>;

const unitOptions: Option[] = [
  { label: 'Pieces', value: 'pcs' },
  { label: 'Kilograms', value: 'kg' },
  { label: 'Liters', value: 'ltr' },
  { label: 'Meters', value: 'm' },
  { label: 'Packets', value: 'pkt' },
  { label: 'Box', value: 'box' },
];

export default function AddNewItem() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formValues, setFormValues] = useState<ItemFormValues>({
    name: '',
    sku: '',
    category: null,
    unit: null,
    costPrice: '',
    sellPrice: '',
    managestock: false,
    stockAlertQuantity: '',
    description: '',
    ispos : true,
    tax: '0',
    discountType: 'fixed',
    discountValue: '0',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState<Option[]>([]);

  const normalizeCategories = (data: any): Option[] => {
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.categories)
          ? data.categories
          : Array.isArray(data?.items)
            ? data.items
            : [];

    return list.map((cat: any) => ({
      label: cat.name || cat.title || '',
      value: cat.id,
    }));
  };

  const fetchCategories = async () => {
    setCategoryLoading(true);

    try {
      const res = await api.get('/categories');
      const data = res.data?.data || res.data?.categories || res.data || [];
      setDynamicCategories(normalizeCategories(data));
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Failed to load categories');
    } finally {
      setCategoryLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isEditing) {
      const fetchItem = async () => {
        try {
          const res = await api.get(`/items/${id}`);
          const item = res.data.items;
          if (item) {
            setFormValues({
              name: item.title || '',
              sku: item.sku || '',
              category: { label: item.categoryObj?.name || item.category || '', value: item.categoryId || '' },
              unit: { label: item.unit || '', value: item.unit || '' },
              costPrice: item.costPrice || '',
              sellPrice: item.sellPrice || '',
              ispos: item.ispos === true || item.ispos === 1 || item.ispos === '1' || item.ispos === 'true',
              managestock: item.managestock,
              stockAlertQuantity: item.alertquantity || '',
              description: item.description || '',
              tax: item.tax || '0',
              discountType: item.discountType || 'fixed',
              discountValue: item.discountValue || '0',
            });
            if (item.image) {
              setImagePreview(item.image);
            }
          }
        } catch (error) {
          console.error("Error fetching item", error);
        }
      };
      fetchItem();
    }
  }, [id]);

  useEffect(() => {
    const costNum = parseFloat(formValues.costPrice) || 0;
    const taxNum = parseFloat(formValues.tax) || 0;
    const discountNum = parseFloat(formValues.discountValue) || 0;

    const taxAmount = (costNum * taxNum) / 100;
    const priceAfterTax = costNum + taxAmount;

    let finalPrice = priceAfterTax;

    if (formValues.discountType === 'percentage') {
      finalPrice = priceAfterTax - (priceAfterTax * discountNum) / 100;
    } else {
      finalPrice = priceAfterTax - discountNum;
    }

    if (finalPrice < 0) finalPrice = 0;

    setFormValues((prev) => ({
      ...prev,
      sellPrice: finalPrice ? finalPrice.toFixed(2) : '',
    }));
  }, [
    formValues.costPrice,
    formValues.tax,
    formValues.discountType,
    formValues.discountValue,
  ]);

  const clearError = (name: keyof ItemFormValues) => {
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    clearError(name as keyof ItemFormValues);
  };

  const handleNumericInput = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (/^\d*\.?\d*$/.test(value)) {
      setFormValues((prev) => ({
        ...prev,
        [name]: value,
      }));

      clearError(name as keyof ItemFormValues);
    }
  };

  const handleCategoryChange = (value: string) => {
    const selected =
      dynamicCategories.find((cat) => String(cat.value) === value) || null;

    setFormValues((prev) => ({
      ...prev,
      category: selected,
    }));

    clearError('category');
  };

  const handleUnitChange = (value: string) => {
    const selected =
      unitOptions.find((unit) => String(unit.value) === value) || null;

    setFormValues((prev) => ({
      ...prev,
      unit: selected,
    }));

    clearError('unit');
  };

  const toggleManageStock = () => {
    setFormValues((prev) => ({
      ...prev,
      managestock: !prev.managestock,
      stockAlertQuantity: !prev.managestock ? prev.stockAlertQuantity : '',
    }));

    clearError('stockAlertQuantity');
  };
  const toggleIsPos = () => {
    setFormValues((prev) => ({
      ...prev,
      ispos: !prev.ispos,
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(null);
    setImagePreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formValues.name.trim()) {
      newErrors.name = 'Item name is required';
    }

    if (!formValues.category) {
      newErrors.category = 'Category is required';
    }

    if (!formValues.unit) {
      newErrors.unit = 'Unit is required';
    }

    if (!formValues.costPrice) {
      newErrors.costPrice = 'Cost price is required';
    }

    if (!formValues.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formValues.managestock && !formValues.stockAlertQuantity) {
      newErrors.stockAlertQuantity = 'Stock alert quantity is required';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormValues({
      name: '',
      sku: '',
      category: null,
      unit: null,
      costPrice: '',
      sellPrice: '',
      managestock: false,
      ispos:true,
      stockAlertQuantity: '',
      description: '',
      tax: '0',
      discountType: 'fixed',
      discountValue: '0',
    });

    removeImage();
    setErrors({});
  };

  const buildItemFormData = () => {
    const formData = new FormData();

    formData.append('title', formValues.name.trim());
    formData.append('sku', formValues.sku.trim());
    formData.append('category', formValues.category?.label || '');
    formData.append('categoryId', String(formValues.category?.value || ''));
    formData.append('unit', String(formValues.unit?.value || ''));
    formData.append('costPrice', formValues.costPrice);
    formData.append('sellPrice', formValues.sellPrice || '');
    formData.append('ispos', String(formValues.ispos));
    formData.append('description', formValues.description.trim());
    formData.append('managestock', String(formValues.managestock));
    formData.append(
      'stockAlertQuantity',
      formValues.managestock ? formValues.stockAlertQuantity : '0'
    );
    formData.append('tax', formValues.tax || '0');
    formData.append('discountType', formValues.discountType);
    formData.append('discountValue', formValues.discountValue || '0');

    if (imageFile) {
      formData.append('image', imageFile);
    }

    return formData;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);

    try {
      const formData = buildItemFormData();

      if (isEditing) {
        await api.put(`/items/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Inventory item updated successfully!');
      } else {
        await api.post('/items', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Inventory item added successfully!');
      }
      
      navigate('/inventory');
    } catch (error: any) {
      console.error('Error:', error);
      alert(
        error?.response?.data?.message ||
          error?.message ||
          'Something went wrong!'
      );
    } finally {
      setSaving(false);
    }
  };

  const summaryRows = [
    { label: 'Item Name', value: formValues.name || '—' },
    { label: 'Category', value: formValues.category?.label || '—' },
    { label: 'Unit', value: formValues.unit?.label || '—' },
    {
      label: 'Cost Price',
      value: formValues.costPrice ? `PKR ${formValues.costPrice}` : '—',
    },
    { label: 'Tax', value: `${formValues.tax || 0}%` },
    {
      label: 'Discount',
      value:
        formValues.discountType === 'fixed'
          ? `PKR ${formValues.discountValue || 0}`
          : `${formValues.discountValue || 0}%`,
    },
    {
      label: 'Sell Price',
      value: formValues.sellPrice ? `PKR ${formValues.sellPrice}` : '—',
    },
    { label: 'Manage Stock', value: formValues.managestock ? 'Yes' : 'No' },
    ...(formValues.managestock
      ? [{ label: 'Alert Qty', value: formValues.stockAlertQuantity || '—' }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-3xl font-bold text-[#0F172A]">
              {isEditing ? 'Edit Consumable Item' : 'Add New Consumable Item'}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span>Home</span>
              <span>/</span>
              <span>Inventory</span>
              <span>/</span>
              <span className="text-[#1D4ED8] font-medium">{isEditing ? 'Edit Item' : 'Add New Item'}</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <section className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center gap-2 pb-4 mb-5 border-b border-gray-100">
                <Package size={18} className="text-[#1D4ED8]" />
                <p className="text-xs font-bold tracking-widest uppercase text-gray-500">
                  Basic Information
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Item Name <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formValues.name}
                    onChange={handleInputChange}
                    placeholder="Enter item name"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm ${
                      errors.name ? 'border-red-400' : 'border-gray-200'
                    }`}
                  />

                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    SKU{' '}
                    <span className="text-gray-400 font-normal">
                      (Optional)
                    </span>
                  </label>

                  <input
                    type="text"
                    name="sku"
                    value={formValues.sku}
                    onChange={handleInputChange}
                    placeholder="Enter SKU"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Select Category <span className="text-red-500">*</span>
                  </label>

                  <select
                    value={
                      formValues.category ? String(formValues.category.value) : ''
                    }
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm bg-white ${
                      errors.category ? 'border-red-400' : 'border-gray-200'
                    }`}
                  >
                    <option value="">
                      {categoryLoading
                        ? 'Loading categories...'
                        : 'Select category'}
                    </option>

                    {dynamicCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>

                  {errors.category && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.category}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Select Unit <span className="text-red-500">*</span>
                  </label>

                  <select
                    value={formValues.unit ? String(formValues.unit.value) : ''}
                    onChange={(e) => handleUnitChange(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm bg-white ${
                      errors.unit ? 'border-red-400' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Select unit</option>

                    {unitOptions.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>

                  {errors.unit && (
                    <p className="text-xs text-red-500 mt-1">{errors.unit}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>

                  <textarea
                    name="description"
                    value={formValues.description}
                    onChange={handleInputChange}
                    placeholder="Enter item description"
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm resize-none ${
                      errors.description ? 'border-red-400' : 'border-gray-200'
                    }`}
                  />

                  {errors.description && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.description}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center gap-2 pb-4 mb-5 border-b border-gray-100">
                <DollarSign size={18} className="text-[#1D4ED8]" />
                <p className="text-xs font-bold tracking-widest uppercase text-gray-500">
                  Pricing
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Cost Price <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="costPrice"
                    value={formValues.costPrice}
                    onChange={handleNumericInput}
                    placeholder="0.00"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm ${
                      errors.costPrice ? 'border-red-400' : 'border-gray-200'
                    }`}
                  />

                  {errors.costPrice && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.costPrice}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Sell Price{' '}
                    <span className="text-gray-400 font-normal">(Auto)</span>
                  </label>

                  <input
                    type="text"
                    name="sellPrice"
                    value={formValues.sellPrice}
                    onChange={handleNumericInput}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Tax %
                  </label>

                  <input
                    type="text"
                    name="tax"
                    value={formValues.tax}
                    onChange={handleNumericInput}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Discount Type
                  </label>

                  <select
                    name="discountType"
                    value={formValues.discountType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm bg-white"
                  >
                    <option value="fixed">Fixed</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Discount Value
                  </label>

                  <input
                    type="text"
                    name="discountValue"
                    value={formValues.discountValue}
                    onChange={handleNumericInput}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={toggleIsPos}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
                    formValues.ispos
                      ? 'border-[#1D4ED8] bg-blue-50'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <span
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
                      formValues.ispos ? 'bg-[#1D4ED8]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                        formValues.ispos ? 'left-6' : 'left-1'
                      }`}
                    />
                  </span>

                  <span>
                    <span
                      className={`block text-sm font-semibold ${
                        formValues.managestock
                          ? 'text-[#1D4ED8]'
                          : 'text-gray-700'
                      }`}
                    >
                      Is POS Item
                    </span>

                  
                  </span>
                </button>
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center gap-2 pb-4 mb-5 border-b border-gray-100">
                <Boxes size={18} className="text-[#1D4ED8]" />
                <p className="text-xs font-bold tracking-widest uppercase text-gray-500">
                  Stock Settings
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={toggleManageStock}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
                    formValues.managestock
                      ? 'border-[#1D4ED8] bg-blue-50'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <span
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
                      formValues.managestock ? 'bg-[#1D4ED8]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                        formValues.managestock ? 'left-6' : 'left-1'
                      }`}
                    />
                  </span>

                  <span>
                    <span
                      className={`block text-sm font-semibold ${
                        formValues.managestock
                          ? 'text-[#1D4ED8]'
                          : 'text-gray-700'
                      }`}
                    >
                      Manage Stock
                    </span>

                    <span className="block text-xs text-gray-400 mt-0.5">
                      Track quantity & alerts
                    </span>
                  </span>
                </button>

                {formValues.managestock && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Stock Alert Quantity{' '}
                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      name="stockAlertQuantity"
                      value={formValues.stockAlertQuantity}
                      onChange={handleNumericInput}
                      placeholder="Enter alert quantity"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm ${
                        errors.stockAlertQuantity
                          ? 'border-red-400'
                          : 'border-gray-200'
                      }`}
                    />

                    {errors.stockAlertQuantity && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.stockAlertQuantity}
                      </p>
                    )}

                    <p className="text-xs text-gray-400 mt-2">
                      Alert will trigger when stock falls below this number.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center gap-2 pb-4 mb-5 border-b border-gray-100">
                <ImagePlus size={18} className="text-[#1D4ED8]" />
                <p className="text-xs font-bold tracking-widest uppercase text-gray-500">
                  Product Image
                </p>
              </div>

              {!imagePreview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl px-4 py-10 text-center hover:border-[#1D4ED8] hover:bg-blue-50/40 transition-colors"
                >
                  <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#1D4ED8]">
                    <UploadCloud size={26} />
                  </span>

                  <span className="block text-sm font-semibold text-gray-700">
                    Click to upload image
                  </span>

                  <span className="block text-xs text-gray-400 mt-1">
                    PNG, JPG, WEBP — max 5MB
                  </span>
                </button>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Item preview"
                    className="w-full h-48 object-cover rounded-xl border border-gray-200"
                  />

                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-3 right-3 inline-flex items-center justify-center h-8 w-8 rounded-lg bg-black/60 text-white hover:bg-black/70"
                  >
                    <X size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Change Image
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </section>

            <section className="bg-gray-50 rounded-xl shadow-sm p-5 border border-gray-100">
              <p className="text-xs font-bold tracking-widest uppercase text-gray-500 pb-4 mb-4 border-b border-gray-200">
                Summary
              </p>

              <div className="space-y-3">
                {summaryRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <span className="text-gray-500">{row.label}</span>

                    <span className="font-medium text-gray-900 text-right max-w-[60%] truncate">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-5 border-t border-gray-100">
          <button
            type="button"
            onClick={resetForm}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            <RotateCcw size={17} />
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] transition-colors disabled:opacity-60"
          >
            <Save size={17} />
            {saving ? 'Saving...' : 'Save Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
