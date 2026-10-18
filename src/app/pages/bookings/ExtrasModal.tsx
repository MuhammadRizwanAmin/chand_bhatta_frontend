import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { X, ShoppingCart, Plus, Trash2, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Item {
  id: number | string;
  title?: string;
  name?: string;
  category?: string;
  sellPrice?: number | string;
  price?: number | string;
}

const getItemName = (item: any) => item?.title || item?.name || 'Unnamed Item';
const getItemPrice = (item: any) => {
  const raw = item?.sellPrice ?? item?.price ?? 0;
  const p = Number(raw);
  return Number.isFinite(p) ? p : 0;
};

interface CartItem {
  id: number | string;
  extraId?: number; // mapped for backend
  name: string;
  price: number;
  quantity: number;
  total: number;
  isCustom?: boolean;
}

interface ExtrasModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationId: string | number;
  onSuccess?: () => void;
  onSelection?: (cartItems: CartItem[]) => void;
  initialItems?: CartItem[];
}

export function ExtrasModal({ isOpen, onClose, reservationId, onSuccess, onSelection, initialItems = [] }: ExtrasModalProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Custom Item state
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState('1');

  // Tax State
  const [taxPercent, setTaxPercent] = useState<number | ''>(0);
  const [isTaxFixed, setIsTaxFixed] = useState(false);

  // Kitchen State
  const [sendToKitchen, setSendToKitchen] = useState(false);
  const [kitchenNotes, setKitchenNotes] = useState('');

  // Fetch items & settings
  useEffect(() => {
    if (isOpen) {
      setCart(initialItems && initialItems.length > 0 ? [...initialItems] : []);
      setSendToKitchen(false);
      setKitchenNotes('');
      setShowCustom(false);
      setCustomName('');
      setCustomPrice('');
      setCustomQty('1');
      setSearchQuery('');
      setSelectedCategory('all');

      setLoadingItems(true);
      Promise.all([
        api.get('/items/filtered?ispos=1').catch(() => api.get('/items?ispos=1')),
        api.get('/setting').catch(() => ({ data: { settings: {} } }))
      ])
        .then(([itemsRes, settingsRes]) => {
          const list = Array.isArray(itemsRes.data?.data)
            ? itemsRes.data.data
            : Array.isArray(itemsRes.data)
            ? itemsRes.data
            : [];
          setItems(list);
          const settings = settingsRes.data?.settings;
          if (settings?.tax_percentage_enabled) {
            setIsTaxFixed(true);
            setTaxPercent(Number(settings.tax_percentage) || 0);
          } else {
            setIsTaxFixed(false);
            setTaxPercent(0);
          }
        })
        .catch(err => console.error("Failed to fetch initial data", err))
        .finally(() => setLoadingItems(false));
    }
  }, [isOpen]);

  const categories = useMemo(() => {
    const set = new Set(items.map(i => i.category || 'Uncategorized'));
    return ['all', ...Array.from(set)];
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter(item => {
      const name = getItemName(item).toLowerCase();
      const cat = (item.category || 'Uncategorized').toLowerCase();
      const priceStr = String(getItemPrice(item));
      const matchesCat = selectedCategory === 'all' || (item.category || 'Uncategorized') === selectedCategory;
      const matchesSearch = !query ||
        name.includes(query) ||
        cat.includes(query) ||
        priceStr.includes(query);
      return matchesCat && matchesSearch;
    });
  }, [items, searchQuery, selectedCategory]);

  // Cart Handlers
  const addToCart = (item: Item) => {
    const itemName = getItemName(item);
    const price = getItemPrice(item);
    const exist = cart.find(x => String(x.id) === String(item.id));

    if (exist) {
      setCart(cart.map(x => String(x.id) === String(item.id)
        ? { ...x, quantity: x.quantity + 1, total: (x.quantity + 1) * price }
        : x
      ));
    } else {
      setCart([...cart, {
        id: item.id,
        extraId: Number(item.id) || undefined,
        name: itemName,
        price,
        quantity: 1,
        total: price
      }]);
    }
  };

  const addCustomItem = () => {
    if (!customName.trim()) return toast.error('Custom item name is required');
    const price = Number(customPrice);
    if (isNaN(price) || price < 0) return toast.error('Valid price is required');
    const qty = Number(customQty);
    if (isNaN(qty) || qty <= 0) return toast.error('Valid quantity is required');

    setCart([...cart, {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      price,
      quantity: qty,
      total: price * qty,
      isCustom: true
    }]);

    setShowCustom(false);
    setCustomName('');
    setCustomPrice('');
    setCustomQty('1');
  };

  const updateQuantity = (id: number | string, qtyStr: string) => {
    const qty = parseInt(qtyStr, 10);
    if (isNaN(qty) || qty <= 0) return;
    setCart(cart.map(item =>
      item.id === id ? { ...item, quantity: qty, total: qty * item.price } : item
    ));
  };

  const removeFromCart = (id: number | string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Calculations
  const cartSubtotal = useMemo(() => cart.reduce((sum, item) => sum + item.total, 0), [cart]);
  const calculatedTax = useMemo(() => {
    const t = Number(taxPercent);
    return Number.isFinite(t) && t > 0 ? (cartSubtotal * t) / 100 : 0;
  }, [cartSubtotal, taxPercent]);
  const grandTotal = cartSubtotal + calculatedTax;

  // Submit
  const handleConfirmOrder = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");

    if (onSelection) {
      onSelection(cart);
      toast.success("Extras selected for reservation!");
      onClose();
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        reservationId,
        extras: cart.map(c => ({
          extraId: c.extraId || null,
          name: c.name,
          price: c.price,
          quantity: c.quantity
        })),
        taxAmount: calculatedTax,
        taxPercentage: Number(taxPercent) || 0,
        sendToKitchen,
        orderType: "room-service",
        kitchenNotes: kitchenNotes.trim()
      };

      await api.post('/reservation/add-extras', payload);
      toast.success("Items added successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Submit error:", err);
      toast.error(err.response?.data?.message || "Failed to add items");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm z-[99999]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Add POS Items to Reservation</h2>
              <p className="text-xs text-gray-500">Reservation #{reservationId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

          {/* Left Side - Items */}
          <div className="flex-1 border-r border-gray-100 flex flex-col overflow-hidden bg-gray-50/30">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
              <h3 className="font-semibold text-gray-800">Inventory Items</h3>
              <button
                onClick={() => setShowCustom(!showCustom)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200"
              >
                <Plus size={14} /> Custom Item
              </button>
            </div>

            {/* Item Search Bar & Categories */}
            <div className="p-3 border-b border-gray-100 bg-white space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items by name, category..."
                  className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {categories.length > 2 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {showCustom && (
                <div className="mb-4 bg-white p-4 rounded-xl border border-indigo-100 shadow-sm relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-xl"></div>
                  <h4 className="text-sm font-bold text-gray-800 mb-3">Add Custom Item</h4>
                  <div className="grid grid-cols-12 gap-3 mb-3">
                    <div className="col-span-6">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                      <input
                        type="text" value={customName} onChange={e => setCustomName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="E.g. Extra Towel"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Price (PKR)</label>
                      <input
                        type="number" value={customPrice} onChange={e => setCustomPrice(e.target.value)} min={0}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Qty</label>
                      <input
                        type="number" value={customQty} onChange={e => setCustomQty(e.target.value)} min={1}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowCustom(false)} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button onClick={addCustomItem} className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm">Add to Cart</button>
                  </div>
                </div>
              )}

              {loadingItems ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                  <Loader2 className="animate-spin mb-2" size={24} />
                  <span className="text-sm">Loading items...</span>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                  {searchQuery || selectedCategory !== 'all' ? 'No items match your search.' : 'No items available.'}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredItems.map(item => (
                    <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-3 hover:border-blue-300 hover:shadow-md transition-all group flex flex-col justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight">{getItemName(item)}</h4>
                        <span className="text-xs text-gray-500 inline-block mt-1 px-2 py-0.5 bg-gray-100 rounded-full">{item.category || 'Uncategorized'}</span>
                      </div>
                      <div className="mt-3">
                        <div className="font-bold text-blue-700 text-sm mb-2">PKR {getItemPrice(item).toLocaleString()}</div>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-full py-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Cart */}
          <div className="w-full md:w-[380px] lg:w-[420px] bg-white flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-800">Current Cart</h3>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                  <ShoppingCart size={32} className="mb-2 opacity-50" />
                  <span className="text-sm">Cart is empty</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between gap-3 relative overflow-hidden">
                      {item.isCustom && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-400"></div>}
                      <div className="flex-1 min-w-0 pl-1">
                        <h5 className="text-sm font-bold text-gray-900 truncate">{item.name}</h5>
                        <div className="text-xs text-gray-500 mt-0.5">PKR {Number(item.price).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number" value={item.quantity} onChange={e => updateQuantity(item.id, e.target.value)} min={1}
                          className="w-14 px-2 py-1 text-center text-sm font-semibold border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                        />
                        <div className="w-20 text-right font-bold text-sm text-gray-900">
                          PKR {Number(item.total).toLocaleString()}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Summary & Settings */}
            <div className="border-t border-gray-200 bg-white">
              {cart.length > 0 && (
                <div className="p-4 border-b border-gray-100 bg-blue-50/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-600">Subtotal</span>
                    <span className="text-sm font-bold text-gray-900">PKR {cartSubtotal.toLocaleString()}</span>
                  </div>

                  {/* <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-600 flex items-center gap-1">
                      Tax 
                      <input 
                        type="number" 
                        value={taxPercent} 
                        onChange={e => setTaxPercent(e.target.value)} 
                        disabled={isTaxFixed}
                        className={`w-12 px-1 py-0.5 ml-1 text-center border rounded text-xs ${isTaxFixed ? 'bg-gray-100 text-gray-500 border-transparent' : 'border-gray-300'}`}
                        placeholder="%"
                      />%
                    </span>
                    <span className="text-sm font-bold text-gray-900">PKR {calculatedTax.toLocaleString()}</span>
                  </div> */}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-base font-extrabold text-gray-900">Grand Total</span>
                    <span className="text-lg font-extrabold text-blue-700">PKR {grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Kitchen Settings */}
              {cart.length > 0 && (
                <div className="p-4 border-b border-gray-100 bg-orange-50/30">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={sendToKitchen}
                      onChange={e => setSendToKitchen(e.target.checked)}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm font-bold text-orange-900">Send to Kitchen (Room Service)</span>
                  </label>
                  {sendToKitchen && (
                    <textarea
                      placeholder="Special notes for kitchen (e.g. less spicy, extra ketchup)"
                      value={kitchenNotes}
                      onChange={e => setKitchenNotes(e.target.value)}
                      className="w-full mt-2 px-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white"
                      rows={2}
                    />
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="p-4 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmOrder}
                  disabled={cart.length === 0 || submitting}
                  className="flex-[2] py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={18} className="animate-spin" />}
                  {submitting ? 'Processing...' : 'Confirm Order'}
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
