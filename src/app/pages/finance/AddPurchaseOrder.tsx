import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ShoppingCart, Calendar, Plus, Trash2, Building2, Package, Save, CheckCircle2, RefreshCw, Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';

import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../components/ui/command';
import { cn } from '../../components/ui/utils';

import { purchaseOrderService } from '../../services/purchaseOrderService';

interface Item {
  label: string;
  value: number;
  unit: string;
  costPrice: number;
}

interface SelectedItem {
  item: Item | null;
  quantity: string;
  price: string;
  total: number;
}

interface Expense {
  expense_name: string;
  expense_amount: string;
}

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  error
}: {
  options: { label: string; value: string | number }[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder: string;
  error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  
  const selectedOption = options.find((opt) => opt.value.toString() === value?.toString());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex w-full items-center justify-between px-3 py-1.5 text-sm bg-white border rounded-lg outline-none focus:ring-2 focus:ring-[#1D4ED8]",
            error ? "border-red-500" : "border-gray-300",
            !selectedOption && "text-gray-500"
          )}
        >
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command>
          <CommandInput placeholder={`Search...`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.toString() === option.value.toString() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function AddPurchaseOrder() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;

  const [suppliers, setSuppliers] = useState<{ label: string; value: number }[]>([]);
  const [inventoryItems, setInventoryItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formValues, setFormValues] = useState({
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDate: '',
    remarks: '',
  });

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [supRes, invRes] = await Promise.all([
          purchaseOrderService.getSuppliers(),
          purchaseOrderService.getInventoryItems()
        ]);

        let itemList: Item[] = [];

        if (Array.isArray(supRes)) {
          setSuppliers(supRes.map((s: any) => ({ label: s.name, value: s.id })));
        }
        
        if (invRes?.data && Array.isArray(invRes.data)) {
          itemList = invRes.data
            .filter((i: any) => i.managestock === true)
            .map((i: any) => ({
              label: i.title,
              value: i.id,
              unit: i.unit,
              costPrice: i.costPrice || 0,
            }));
          setInventoryItems(itemList);
        }

        // If edit mode, fetch existing PO and pre-fill the form
        if (isEditMode && id) {
          const poRes = await purchaseOrderService.getPurchaseOrderById(id);
          const po = poRes.data || poRes;

          setFormValues({
            supplierId: po.supplierId?.toString() || '',
            orderDate: po.orderDate ? po.orderDate.split('T')[0] : new Date().toISOString().split('T')[0],
            expectedDate: po.expectedDate ? po.expectedDate.split('T')[0] : '',
            remarks: po.remarks || '',
          });

          if (po.items && Array.isArray(po.items)) {
            setSelectedItems(po.items.map((pi: any) => {
              const matchedItem = itemList.find(i => i.value === (pi.inventoryId || pi.inventory?.id));
              return {
                item: matchedItem || (pi.inventory ? { label: pi.inventory.title, value: pi.inventory.id, unit: pi.inventory.unit, costPrice: pi.costPrice } : null),
                quantity: pi.quantity?.toString() || '',
                price: pi.costPrice?.toString() || '',
                total: pi.total || 0,
              };
            }));
          }

          if (po.expenses && Array.isArray(po.expenses)) {
            setExpenses(po.expenses.map((e: any) => ({
              expense_name: e.expense_name || '',
              expense_amount: e.expense_amount?.toString() || '',
            })));
          }
        }

      } catch (error) {
        toast.error('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleAddItem = () => {
    setSelectedItems([...selectedItems, { item: null, quantity: '', price: '', total: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...selectedItems];
    updated.splice(index, 1);
    setSelectedItems(updated);
  };

  const handleItemSelect = (index: number, itemId: string) => {
    const selected = inventoryItems.find(i => i.value === Number(itemId)) || null;
    const updated = [...selectedItems];
    updated[index].item = selected;
    if (selected) {
      updated[index].price = selected.costPrice.toString();
    }
    recalculateItemTotal(updated, index);
  };

  const handleItemChange = (index: number, field: 'quantity' | 'price', value: string) => {
    const updated = [...selectedItems];
    updated[index][field] = value;
    recalculateItemTotal(updated, index);
  };

  const recalculateItemTotal = (items: SelectedItem[], index: number) => {
    const qty = parseFloat(items[index].quantity) || 0;
    const price = parseFloat(items[index].price) || 0;
    items[index].total = qty * price;
    setSelectedItems([...items]);
  };

  const handleAddExpense = () => {
    setExpenses([...expenses, { expense_name: '', expense_amount: '' }]);
  };

  const handleRemoveExpense = (index: number) => {
    const updated = [...expenses];
    updated.splice(index, 1);
    setExpenses(updated);
  };

  const handleExpenseChange = (index: number, field: keyof Expense, value: string) => {
    const updated = [...expenses];
    updated[index][field] = value;
    setExpenses(updated);
  };

  // ─── Totals ──────────────────────────────────────────────────────────────
  const itemTotal = selectedItems.reduce((acc, i) => acc + i.total, 0);
  const expenseTotal = expenses.reduce((acc, e) => acc + (parseFloat(e.expense_amount) || 0), 0);
  const grandTotal = itemTotal + expenseTotal;

  // ─── Validation & Submit ─────────────────────────────────────────────────
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formValues.supplierId) newErrors.supplier = 'Supplier is required';
    if (!formValues.expectedDate) newErrors.expectedDate = 'Expected date is required';
    if (selectedItems.length === 0) newErrors.items = 'At least one item is required';
    
    selectedItems.forEach((item, i) => {
      if (!item.item) newErrors[`item-${i}`] = 'Select an item';
      if (!item.quantity || parseFloat(item.quantity) <= 0) newErrors[`quantity-${i}`] = 'Invalid quantity';
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);
    const payload = {
      supplierId: formValues.supplierId,
      orderDate: formValues.orderDate,
      expectedDate: formValues.expectedDate,
      remarks: formValues.remarks,
      items: selectedItems.map((i) => ({
        inventoryId: i.item!.value,
        quantity: parseFloat(i.quantity),
        costPrice: parseFloat(i.price),
        total: i.total,
      })),
      expenses: expenses.map(e => ({
        expense_name: e.expense_name,
        expense_amount: parseFloat(e.expense_amount) || 0
      })),
      totalAmount: grandTotal,
    };

    try {
      if (isEditMode && id) {
        await purchaseOrderService.updatePurchaseOrder(id, payload);
        toast.success('Purchase Order updated successfully!');
      } else {
        await purchaseOrderService.createPurchaseOrder(payload);
        toast.success('Purchase Order created successfully!');
      }
      navigate('/finance/purchase-orders');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save Purchase Order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <RefreshCw size={32} className="animate-spin mb-4 text-[#1D4ED8]" />
        <p>Loading suppliers and inventory...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">
            {isEditMode ? 'Edit Purchase Order' : 'Create Purchase Order'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditMode ? 'Update the details of this purchase order' : 'Generate a new PO for your suppliers'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Basic Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-slate-50 border-b border-gray-100 px-6 py-4 font-semibold text-[#0F172A] flex items-center gap-2">
            <Building2 size={18} className="text-[#1D4ED8]" /> Basic Information
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Supplier <span className="text-red-500">*</span></label>
                <SearchableSelect
                  options={suppliers}
                  value={formValues.supplierId}
                  onChange={(val) => setFormValues(prev => ({ ...prev, supplierId: val.toString() }))}
                  placeholder="Select Supplier"
                  error={!!errors.supplier}
                />
                {errors.supplier && <p className="text-red-500 text-xs mt-1">{errors.supplier}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Order Date</label>
                <input 
                  type="date" 
                  value={formValues.orderDate} 
                  onChange={e => setFormValues(prev => ({ ...prev, orderDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expected Delivery <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  value={formValues.expectedDate} 
                  onChange={e => setFormValues(prev => ({ ...prev, expectedDate: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1D4ED8] ${errors.expectedDate ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.expectedDate && <p className="text-red-500 text-xs mt-1">{errors.expectedDate}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Items Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-slate-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <div className="font-semibold text-[#0F172A] flex items-center gap-2">
              <Package size={18} className="text-[#1D4ED8]" /> Order Items
            </div>
            <button 
              type="button" 
              onClick={handleAddItem}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg hover:bg-[#1E40AF] transition-colors"
            >
              <Plus size={14} /> Add Item
            </button>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Item</th>
                  <th className="px-6 py-3 w-24">Unit</th>
                  <th className="px-6 py-3 w-32">Cost Price (₨)</th>
                  <th className="px-6 py-3 w-32">Quantity</th>
                  <th className="px-6 py-3 w-32 text-right">Total (₨)</th>
                  <th className="px-6 py-3 w-20 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedItems.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3">
                      <SearchableSelect
                        options={inventoryItems}
                        value={row.item?.value || ''}
                        onChange={(val) => handleItemSelect(index, val.toString())}
                        placeholder="Select an item"
                        error={!!errors[`item-${index}`]}
                      />
                      {errors[`item-${index}`] && <p className="text-red-500 text-[10px] mt-0.5">{errors[`item-${index}`]}</p>}
                    </td>
                    <td className="px-6 py-3 text-gray-500">{row.item?.unit || '—'}</td>
                    <td className="px-6 py-3">
                      <input 
                        type="number" 
                        min="0" step="0.01"
                        value={row.price} 
                        onChange={e => handleItemChange(index, 'price', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input 
                        type="number" 
                        min="0" step="0.01"
                        value={row.quantity} 
                        onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                        className={`w-full px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1D4ED8] ${errors[`quantity-${index}`] ? 'border-red-500' : 'border-gray-300'}`}
                      />
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-emerald-600">
                      {row.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button 
                        type="button" 
                        onClick={() => handleRemoveItem(index)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {selectedItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400 italic">
                      No items added yet. Click "Add Item" to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {/* Item Totals Strip */}
            <div className="bg-slate-50 px-6 py-3 border-t border-gray-100 flex justify-end">
              <div className="text-sm">
                <span className="text-gray-500 mr-4">Items Total:</span>
                <span className="font-bold text-[#0F172A] text-lg">₨ {itemTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses & Remarks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="bg-slate-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="font-semibold text-[#0F172A]">Additional Expenses</div>
              <button 
                type="button" 
                onClick={handleAddExpense}
                className="text-xs font-semibold text-[#1D4ED8] hover:underline"
              >
                + Add Expense
              </button>
            </div>
            <div className="p-6 flex-grow">
              <div className="space-y-3">
                {expenses.map((exp, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input 
                      type="text" 
                      placeholder="Expense Name (e.g. Freight)" 
                      value={exp.expense_name}
                      onChange={e => handleExpenseChange(index, 'expense_name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                    />
                    <input 
                      type="number" 
                      placeholder="Amount" 
                      value={exp.expense_amount}
                      onChange={e => handleExpenseChange(index, 'expense_amount', e.target.value)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                    />
                    <button 
                      type="button" 
                      onClick={() => handleRemoveExpense(index)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {expenses.length === 0 && (
                  <p className="text-sm text-gray-400 italic text-center py-4">No additional expenses.</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="bg-slate-50 border-b border-gray-100 px-6 py-4 font-semibold text-[#0F172A]">
              Remarks & Summary
            </div>
            <div className="p-6 flex flex-col flex-grow justify-between">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Remarks / Notes</label>
                <textarea 
                  rows={3} 
                  value={formValues.remarks} 
                  onChange={e => setFormValues(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1D4ED8] resize-none"
                  placeholder="Any special instructions for the supplier..."
                />
              </div>

              <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2 text-gray-600">
                  <span>Subtotal (Items)</span>
                  <span className="font-semibold">₨ {itemTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-3 text-gray-600 border-b border-blue-200 pb-3">
                  <span>Total Expenses</span>
                  <span className="font-semibold">₨ {expenseTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="font-bold text-[#0F172A]">Grand Total</span>
                  <span className="font-black text-[#1D4ED8]">₨ {grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Strip */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button 
            type="button" 
            onClick={() => navigate('/finance/purchase-orders')} 
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={submitting} 
            className="px-8 py-2.5 bg-[#1D4ED8] text-white rounded-lg text-sm font-medium hover:bg-[#1E40AF] disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {submitting ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            {submitting ? 'Saving...' : isEditMode ? 'Update Purchase Order' : 'Save Purchase Order'}
          </button>
        </div>

      </form>
    </div>
  );
}
