import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  Search,
  User,
  CreditCard,
  Utensils,
  X,
} from 'lucide-react';
import api from '../../services/api';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import Select from 'react-select';

type ApiListResponse<T> = {
  data?: T[];
};

type Item = {
  id?: number | string | null;
  title?: string;
  name?: string;
  category?: string;
  sellPrice?: number | string;
  price?: number | string;
};

type Reservation = {
  id: number | string;
  status?: string;
  groupId?: number | string | null;
  customer?: {
    name?: string;
    phone?: string;
  };
  rooms?: Array<{
    id?: number | string;
    roomNo?: string | number;
    roomNumber?: string | number;
  }>;
};

type Customer = {
  id: number | string | null;
  name: string;
  phone?: string;
};

type Table = {
  id: number | string;
  tableNumber?: string | number;
  capacity?: number;
  status?: string;
};

type Bank = {
  id: number | string;
  bankName?: string;
  name?: string;
};

type CartItem = {
  uid: string;
  id?: number | string | null;
  name: string;
  price: number;
  quantity: number;
  total: number;
  category?: string;
  isCustom?: boolean;
};

type PaymentMethod = 'cash' | 'card' | 'bank';

const WALK_IN_CUSTOMER: Customer = {
  id: null,
  name: 'Walk-in Customer',
  phone: '',
};

const formatPKR = (value: number) => {
  return `PKR ${Number(value || 0).toLocaleString()}`;
};

const getListData = <T,>(response: { data: ApiListResponse<T> | T[] }): T[] => {
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.data)) return response.data.data;
  return [];
};

const getItemName = (item: Item) => {
  return item.title || item.name || 'Unnamed Item';
};

const getItemPrice = (item: Item) => {
  const rawPrice = item.sellPrice ?? item.price ?? 0;
  const price = Number(rawPrice);
  return Number.isFinite(price) ? price : 0;
};

export function POS() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [banksList, setBanksList] = useState<Bank[]>([]);

  const [selectedReservation, setSelectedReservation] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(WALK_IN_CUSTOMER);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [sendToKitchen, setSendToKitchen] = useState(false);
  const [kitchenNotes, setKitchenNotes] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [taxPercent, setTaxPercent] = useState<number | ''>(0);
  const [isTaxFixed, setIsTaxFixed] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [globalSettings, setGlobalSettings] = useState<any>(null);

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
  });

  const [customExtra, setCustomExtra] = useState({
    name: '',
    price: '',
    quantity: 1,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showSearchCustomerModal, setShowSearchCustomerModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);

  const isStandalone = !selectedReservation;
  const selectedReservationData = useMemo(() => {
    return reservations.find(
      (reservation) => String(reservation.id) === String(selectedReservation)
    );
  }, [reservations, selectedReservation]);

  const reservationOptions = useMemo(() => {
    const list = reservations.map((reservation) => {
      const roomNos = reservation.rooms
        ?.map((r) => r.roomNo || r.roomNumber)
        .filter(Boolean)
        .join(', ');

      const labelText = `#${reservation.refno || reservation.id} · ${
        reservation.customer?.name || 'Guest'
      }${roomNos ? ` (Room ${roomNos})` : ''}${reservation.groupId ? ' · Group' : ''}`;

      return {
        value: String(reservation.id),
        label: labelText,
        refno: reservation.refno || String(reservation.id),
        guestName: reservation.customer?.name || 'Guest',
        roomNo: roomNos || '',
        groupId: reservation.groupId || null,
      };
    });

    return [
      {
        value: '',
        label: 'Standalone / Walk-in',
        refno: '',
        guestName: 'Standalone / Walk-in',
        roomNo: '',
        groupId: null,
      },
      ...list,
    ];
  }, [reservations]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  const calculatedTaxAmount = useMemo(() => {
    if (!isStandalone && globalSettings?.apply_reservation_tax_on_pos !== false) {
      const resTax = Number((selectedReservationData as any)?.taxAmount || 0);
      if (resTax > 0) {
        return 0; // Tax is handled by the reservation settings
      }
    }
    const tax = Number(taxPercent);
    return Number.isFinite(tax) && tax > 0 ? (cartTotal * tax) / 100 : 0;
  }, [cartTotal, taxPercent, selectedReservationData, isStandalone, globalSettings]);

  const finalTotal = useMemo(() => {
    return cartTotal + calculatedTaxAmount;
  }, [cartTotal, calculatedTaxAmount]);

  const paidAmount = useMemo(() => {
    const paid = Number(amountPaid);
    return Number.isFinite(paid) ? paid : 0;
  }, [amountPaid]);

  const balanceAmount = Math.max(finalTotal - paidAmount, 0);
  const changeAmount = Math.max(paidAmount - finalTotal, 0);

  const occupiedTables = useMemo(() => {
    return tables.filter((table) => table.status === 'occupied');
  }, [tables]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      items.map((item) => item.category || 'Uncategorized')
    );

    return ['all', ...Array.from(uniqueCategories)];
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchFilter.trim().toLowerCase();

    return items.filter((item) => {
      const category = (item.category || 'Uncategorized').toLowerCase();
      const itemName = getItemName(item).toLowerCase();
      const itemPrice = String(getItemPrice(item));

      const matchesCategory =
        selectedCategory === 'all' || (item.category || 'Uncategorized') === selectedCategory;

      const matchesSearch =
        !normalizedSearch ||
        itemName.includes(normalizedSearch) ||
        category.includes(normalizedSearch) ||
        itemPrice.includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [items, searchFilter, selectedCategory]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();

    if (!query) return customers;

    return customers.filter((customer) => {
      const name = customer.name?.toLowerCase() || '';
      const phone = customer.phone || '';

      return name.includes(query) || phone.includes(query);
    });
  }, [customers, customerSearch]);


  const fetchData = useCallback(async () => {
    setIsLoading(true);

    try {
      const [itemsRes, reservationsRes, customersRes, tablesRes, banksRes, settingsRes] =
        await Promise.all([
          api.get('/items/filtered?ispos=1'),
          api.get('/reservation/', { params: { status: 'checked_in', limit: 1000 } }),
          api.get('/customer'),
          api.get('/kitchen/tables').catch(() => ({ data: { data: [] } })),
          api.get('/banks'),
          api.get('/setting').catch(() => ({ data: { settings: {} } })),
        ]);

      const fetchedItems = getListData<Item>(itemsRes);
      const fetchedReservations = getListData<Reservation>(reservationsRes);
      const fetchedCustomers = getListData<Customer>(customersRes);
      const fetchedTables = getListData<Table>(tablesRes);
      const fetchedBanks = getListData<Bank>(banksRes);

      setItems(fetchedItems);

      setReservations(
        fetchedReservations.filter(
          (reservation) => reservation.status === 'checked_in'
        )
      );

      setCustomers(fetchedCustomers);
      setTables(fetchedTables);
      setBanksList(fetchedBanks);
      
      const settings = settingsRes?.data?.settings;
      setGlobalSettings(settings);
      if (settings?.tax_percentage_enabled) {
        setIsTaxFixed(true);
        setTaxPercent(Number(settings.tax_percentage) || 0);
      }
    } catch (error) {
      console.error('Error fetching POS data:', error);
      alert('Failed to load POS data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addToCart = (item: Item) => {
    const itemId = item.id ?? null;
    const itemName = getItemName(item);
    const itemPrice = getItemPrice(item);

    if (itemPrice < 0) {
      alert('This item has an invalid price');
      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (cartItem) =>
          cartItem.id !== null &&
          cartItem.id !== undefined &&
          String(cartItem.id) === String(itemId)
      );

      if (existingItem) {
        return currentCart.map((cartItem) => {
          if (cartItem.uid !== existingItem.uid) return cartItem;

          const nextQuantity = cartItem.quantity + 1;

          return {
            ...cartItem,
            quantity: nextQuantity,
            total: nextQuantity * cartItem.price,
          };
        });
      }

      return [
        ...currentCart,
        {
          uid: `${Date.now()}-${Math.random()}`,
          id: itemId,
          name: itemName,
          category: item.category || 'Uncategorized',
          price: itemPrice,
          quantity: 1,
          total: itemPrice,
        },
      ];
    });
  };

  const updateQuantity = (uid: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(uid);
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.uid === uid
          ? {
              ...item,
              quantity,
              total: quantity * item.price,
            }
          : item
      )
    );
  };

  const removeFromCart = (uid: string) => {
    setCart((currentCart) => currentCart.filter((item) => item.uid !== uid));
  };

  const resetCart = () => {
    setCart([]);
    setSelectedReservation('');
    setSelectedCustomer(WALK_IN_CUSTOMER);
    setPaymentMethod('cash');
    setAmountPaid('');
    if (!isTaxFixed) {
      setTaxPercent('');
    }
    setTransactionId('');
    setSelectedBankId('');
    setSendToKitchen(false);
    setSelectedTableId('');
    setKitchenNotes('');
    setShowBillingModal(false);
  };

  const handleAddCustomExtra = () => {
    const name = customExtra.name.trim();
    const price = Number(customExtra.price);
    const quantity = Number(customExtra.quantity);

    if (!name) {
      alert('Item name is required');
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      alert('Enter a valid item price');
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      alert('Enter a valid quantity');
      return;
    }

    setCart((currentCart) => [
      ...currentCart,
      {
        uid: `custom-${Date.now()}-${Math.random()}`,
        id: null,
        name,
        price,
        quantity,
        total: price * quantity,
        isCustom: true,
      },
    ]);

    setCustomExtra({
      name: '',
      price: '',
      quantity: 1,
    });

    setShowCustomItemModal(false);
  };

  const validateOrder = () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return false;
    }

    if (isStandalone) {
      const isWalkIn = !selectedCustomer?.id;

      if (isWalkIn && paidAmount < finalTotal) {
        alert('Walk-in customer sale requires full payment');
        return false;
      }

      if (paidAmount > 0 && (paymentMethod === 'bank' || paymentMethod === 'card') && !selectedBankId) {
        alert('Please select a bank/account');
        return false;
      }

      if (paidAmount > 0 && (paymentMethod === 'bank' || paymentMethod === 'card') && !transactionId.trim()) {
        alert('Please enter transaction ID');
        return false;
      }
    }

    return true;
  };

  const buildCartPayload = () => {
    return cart.map((item) => ({
      extraId: item.id || null,
      itemId: item.id || null,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total: item.total,
      isCustom: Boolean(item.isCustom),
    }));
  };

  const submitReservationExtras = async () => {
    if (!validateOrder()) return;

    setIsSubmitting(true);

    try {
      await api.post('/reservation/add-extras', {
        reservationId: selectedReservation,
        extras: buildCartPayload().map((item) => ({
          extraId: item.extraId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        taxAmount: calculatedTaxAmount,
        taxPercentage: Number(taxPercent) || 0,
        sendToKitchen,
        tableId: sendToKitchen ? selectedTableId : null,
        orderType: 'room-service',
        kitchenNotes: kitchenNotes.trim(),
      });
      toast.success('Extras added successfully');
      resetCart();
    } catch (error) {
      console.error('Failed to add extras:', error);
      alert('Failed to add extras');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitStandaloneSale = async () => {
    if (!validateOrder()) return;

    setIsSubmitting(true);

    try {
      const isPaidFull = paidAmount >= finalTotal;
      const status = isPaidFull ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Pending');

      await api.post('/sales', {
        totalAmount: finalTotal,
        taxAmount: calculatedTaxAmount,
        taxPercentage: Number(taxPercent) || 0,
        advancePaid: paidAmount,
        paymentStatus: status,
        paymentMethod: paidAmount > 0 ? paymentMethod : 'cash',
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer?.name || WALK_IN_CUSTOMER.name,
        customerPhone: selectedCustomer?.phone || '',
        bankId:
          paidAmount > 0 && (paymentMethod === 'bank' || paymentMethod === 'card')
            ? selectedBankId
            : null,
        transactionId:
          paidAmount > 0 && (paymentMethod === 'bank' || paymentMethod === 'card')
            ? transactionId.trim()
            : '',
        items: buildCartPayload().map((item) => ({
          itemId: item.itemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        sendToKitchen,
        tableId: sendToKitchen ? selectedTableId : null,
        orderType: 'dine-in',
        kitchenNotes: kitchenNotes.trim(),
      });
      toast.success('Sale Completed');
      resetCart();
    } catch (error) {
      console.error('Failed to process sale:', error);
      alert('Failed to process sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!validateOrder()) return;

    if (selectedReservation) {
      if (selectedReservationData?.groupId) {
        setShowBillingModal(true);
        return;
      }

      await submitReservationExtras();
      return;
    }

    await submitStandaloneSale();
  };

  const handleCreateCustomer = async () => {
    const name = newCustomer.name.trim();

    if (!name) {
      alert('Customer name is required');
      return;
    }

    try {
      const response = await api.post('/customer', {
        name,
        phone: newCustomer.phone.trim(),
      });

      const createdCustomer = response.data?.data || response.data;

      setCustomers((currentCustomers) => [...currentCustomers, createdCustomer]);
      setSelectedCustomer(createdCustomer);
      setNewCustomer({ name: '', phone: '' });
      setShowCustomerModal(false);
    } catch (error) {
      console.error('Failed to create customer:', error);
      alert('Failed to create customer');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Point of Sale</h1>
          <p className="text-gray-600 mt-1">
            Manage extras, add-ons, walk-in sales, and kitchen orders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/sales?today=1')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Daily Sales
          </button>
          <button
            type="button"
            onClick={fetchData}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />

              <input
                type="text"
                placeholder="Search items by name, category, price..."
                value={searchFilter}
                onChange={(event) => setSearchFilter(event.target.value)}
                className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-[#1D4ED8] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="bg-white border rounded-xl p-10 text-center text-gray-500">
              Loading POS items...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white border rounded-xl p-10 text-center text-gray-500">
              No items found
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <button
                  type="button"
                  key={`${item.id}-${getItemName(item)}`}
                  onClick={() => addToCart(item)}
                  className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow text-left border hover:border-[#1D4ED8]"
                >
                  <h3
                    className="font-semibold text-[#0F172A] truncate"
                    title={getItemName(item)}
                  >
                    {getItemName(item)}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    {item.category || 'Uncategorized'}
                  </p>

                  <p className="text-lg font-bold text-[#1D4ED8] mt-3">
                    {formatPKR(getItemPrice(item))}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

<div className="bg-white rounded-xl shadow-sm border p-5 flex flex-col h-auto min-h-fit self-start">          <div className="flex items-center justify-between mb-4 border-b pb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="text-[#1D4ED8]" size={24} />
              <h2 className="text-xl font-bold text-[#0F172A]">Order</h2>
            </div>

            <button
              type="button"
              onClick={() => setShowCustomItemModal(true)}
              className="text-sm bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 font-semibold"
            >
              + Custom
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
              Reservation
            </label>

            <Select
              value={
                reservationOptions.find(
                  (o) => String(o.value) === String(selectedReservation)
                ) || reservationOptions[0]
              }
              onChange={(option: any) => {
                const val = option ? option.value : '';
                setSelectedReservation(val);
                setAmountPaid('');
                if (!isTaxFixed) {
                  setTaxPercent('');
                }
                setPaymentMethod('cash');
                setSelectedBankId('');
                setTransactionId('');
              }}
              options={reservationOptions}
              isSearchable={true}
              placeholder="Search by Guest name, Room #, Ref #..."
              noOptionsMessage={() => 'No matching checked-in reservations'}
              className="text-sm"
              styles={{
                control: (base, state) => ({
                  ...base,
                  backgroundColor: '#F9FAFB',
                  borderColor: state.isFocused ? '#1D4ED8' : '#E5E7EB',
                  borderRadius: '0.5rem',
                  padding: '2px',
                  fontSize: '0.875rem',
                  boxShadow: state.isFocused
                    ? '0 0 0 2px rgba(29, 78, 216, 0.2)'
                    : 'none',
                  '&:hover': { borderColor: '#1D4ED8' },
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected
                    ? '#1D4ED8'
                    : state.isFocused
                    ? '#EFF6FF'
                    : 'transparent',
                  color: state.isSelected ? '#FFFFFF' : '#1F2937',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }),
                menu: (base) => ({
                  ...base,
                  borderRadius: '0.5rem',
                  zIndex: 9999,
                  boxShadow:
                    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                }),
              }}
            />
          </div>

          {isStandalone && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">
                  Customer
                </span>

                <div className="flex items-center gap-2">
                  {selectedCustomer?.id && (
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(WALK_IN_CUSTOMER)}
                      className="text-xs text-red-500 font-semibold"
                    >
                      Clear
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowSearchCustomerModal(true)}
                    className="text-xs text-[#1D4ED8] font-semibold"
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <div>
                  <div className="font-medium text-sm">
                    {selectedCustomer?.name || WALK_IN_CUSTOMER.name}
                  </div>

                  {selectedCustomer?.phone && (
                    <div className="text-xs text-gray-500">
                      {selectedCustomer.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}


          {cart.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-dashed">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-3">
                <Utensils size={15} />
                Kitchen Options
              </label>

              <label
                htmlFor="sendToKitchen"
                className="flex items-center gap-2 text-sm font-semibold text-gray-800 cursor-pointer mb-3"
              >
                <input
                  type="checkbox"
                  id="sendToKitchen"
                  checked={sendToKitchen}
                  onChange={(event) => {
                    setSendToKitchen(event.target.checked);

                    if (!event.target.checked) {
                      setSelectedTableId('');
                      setKitchenNotes('');
                    }
                  }}
                  className="w-4 h-4 cursor-pointer"
                />
                Send to Kitchen
              </label>

              {sendToKitchen && (
                <div className="space-y-3">
                  {occupiedTables.length === 0 ? (
                    <div className="p-3 border border-dashed rounded-lg text-xs text-gray-500 bg-white">
                      No occupied tables found (Optional).
                    </div>
                  ) : (
                    <select
                      value={selectedTableId}
                      onChange={(event) => setSelectedTableId(event.target.value)}
                      className="w-full p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none"
                    >
                      <option value="">Select occupied table (Optional)</option>

                      {occupiedTables.map((table) => (
                        <option key={table.id} value={table.id}>
                          Table {table.tableNumber} · {table.capacity || 0} seats
                        </option>
                      ))}
                    </select>
                  )}

                  <input
                    type="text"
                    placeholder="Special notes e.g. Less spicy, no onions"
                    value={kitchenNotes}
                    onChange={(event) => setKitchenNotes(event.target.value)}
                    className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 mb-4 pr-1">
            {cart.length === 0 ? (
              <div className="text-center text-gray-400 mt-10">
                <ShoppingCart size={36} className="mx-auto mb-2 opacity-50" />
                Cart is empty
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.uid}
                  className={`p-3 rounded-lg border flex flex-col gap-2 ${
                    item.isCustom
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <span className="font-medium text-sm block">
                        {item.name}
                      </span>

                      {item.isCustom && (
                        <span className="text-[11px] text-yellow-700 font-semibold">
                          Custom Item
                        </span>
                      )}
                    </div>

                    <span className="font-bold text-sm whitespace-nowrap">
                      {formatPKR(item.total)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center border rounded bg-gray-50 overflow-hidden">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.uid, item.quantity - 1)
                        }
                        className="px-2 py-1 hover:bg-gray-200"
                      >
                        <Minus size={14} />
                      </button>

                      <span className="px-3 text-xs font-bold">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.uid, item.quantity + 1)
                        }
                        className="px-2 py-1 hover:bg-gray-200"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.uid)}
                      className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 font-semibold"
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t pt-4 space-y-3 mt-auto">
            <div className="flex justify-between items-center text-gray-600 px-3">
              <span className="font-medium text-sm">Subtotal</span>
              <span className="font-semibold text-sm">{formatPKR(cartTotal)}</span>
            </div>

            <div className="flex flex-col px-3 gap-1">
              <div className="flex justify-between items-center text-gray-600">
                <span className="font-medium text-sm">Tax (%)</span>
                <div className="flex items-center gap-2">
                   <input
                     type="number"
                     step="any"
                     min="0"
                     max="100"
                     value={taxPercent}
                     onChange={(e) => setTaxPercent(e.target.value)}
                     className={`w-20 p-1.5 text-right border rounded text-sm focus:ring-1 focus:ring-[#1D4ED8] focus:outline-none`}
                     placeholder="0"
                     onWheel={(e) => (e.target as HTMLInputElement).blur()}
                   />
                   <span className="text-xs text-gray-400">%</span>
                </div>
              </div>
            </div>

            {isStandalone && cart.length > 0 && (
              <div className="space-y-3 p-3 bg-gray-50 border rounded-lg">
                <label className="block text-xs font-bold text-gray-500 uppercase">
                  Payment
                </label>

                <div className="flex gap-2">
                  {(['cash', 'card', 'bank'] as PaymentMethod[]).map((method) => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => {
                        setPaymentMethod(method);
                        if (method === 'cash') {
                          setSelectedBankId('');
                          setTransactionId('');
                        }
                      }}
                      className={`flex-1 py-1.5 text-sm rounded border font-semibold ${
                        paymentMethod === method
                          ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                          : 'bg-white text-gray-600'
                      }`}
                    >
                      {method.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <CreditCard
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="number"
                    min="0"
                    max={finalTotal}
                    placeholder="Amount Paid"
                    value={amountPaid}
                    onChange={(event) => {
                      const val = Number(event.target.value);
                      if (val > finalTotal) {
                        setAmountPaid(String(finalTotal));
                      } else {
                        setAmountPaid(event.target.value);
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  />
                </div>

                {(paymentMethod === 'bank' || paymentMethod === 'card') && (
                  <>
                    <select
                      value={selectedBankId}
                      onChange={(event) => setSelectedBankId(event.target.value)}
                      className="w-full p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none"
                    >
                      <option value="">Select Bank / Account</option>
                      {banksList.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.bankName || bank.name || `Bank #${bank.id}`}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Transaction ID"
                      value={transactionId}
                      onChange={(event) => setTransactionId(event.target.value)}
                      className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none"
                    />
                  </>
                )}

                <div className="bg-white border rounded-lg p-2 text-xs">
                  <div className="text-gray-500">Balance Due</div>
                  <div className="font-bold text-red-600">{formatPKR(balanceAmount)}</div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center bg-[#0F172A] text-white p-3 rounded-xl">
              <span className="font-medium">Total</span>
              <span className="text-xl font-bold">{formatPKR(finalTotal)}</span>
            </div>

            <button
              type="button"
              onClick={handleConfirmOrder}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full bg-[#1D4ED8] text-white py-3 rounded-xl hover:bg-[#1E40AF] disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center justify-center gap-2"
            >
              <DollarSign size={18} />
              {isSubmitting ? 'Processing...' : 'Confirm Order'}
            </button>
          </div>
        </div>
      </div>

      {showCustomItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add Custom Item</h2>

              <button
                type="button"
                onClick={() => setShowCustomItemModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Item Name"
                value={customExtra.name}
                onChange={(event) =>
                  setCustomExtra((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none"
              />

              <input
                type="number"
                min="0"
                placeholder="Price (PKR)"
                value={customExtra.price}
                onChange={(event) =>
                  setCustomExtra((current) => ({
                    ...current,
                    price: event.target.value,
                  }))
                }
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none"
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
              />

              <input
                type="number"
                min="1"
                placeholder="Quantity"
                value={customExtra.quantity}
                onChange={(event) =>
                  setCustomExtra((current) => ({
                    ...current,
                    quantity: Number(event.target.value || 1),
                  }))
                }
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none"
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
              />
            </div>

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowCustomItemModal(false)}
                className="flex-1 py-2 bg-gray-100 rounded-lg font-medium"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAddCustomExtra}
                className="flex-1 py-2 bg-[#1D4ED8] text-white rounded-lg font-medium"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {showSearchCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Select Customer</h2>

              <button
                type="button"
                onClick={() => setShowSearchCustomerModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <input
              type="text"
              autoFocus
              placeholder="Search name or phone..."
              value={customerSearch}
              onChange={(event) => setCustomerSearch(event.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none mb-3"
            />

            <div className="max-h-60 overflow-y-auto border rounded-lg divide-y mb-3">
              {filteredCustomers.length === 0 ? (
                <p className="p-3 text-sm text-gray-500 text-center">
                  No customers found
                </p>
              ) : (
                filteredCustomers.map((customer) => (
                  <button
                    type="button"
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setShowSearchCustomerModal(false);
                      setCustomerSearch('');
                    }}
                    className="w-full text-left p-3 hover:bg-gray-50 text-sm"
                  >
                    <div className="font-bold">{customer.name}</div>
                    <div className="text-gray-500 text-xs">
                      {customer.phone || 'No phone'}
                    </div>
                  </button>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowSearchCustomerModal(false);
                setShowCustomerModal(true);
              }}
              className="w-full py-2 bg-gray-100 text-[#1D4ED8] font-bold rounded-lg border border-dashed border-[#1D4ED8]"
            >
              + New Customer
            </button>
          </div>
        </div>
      )}

      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Create Customer</h2>

              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Full Name *"
                value={newCustomer.name}
                onChange={(event) =>
                  setNewCustomer((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none"
              />

              <input
                type="text"
                placeholder="Phone Number"
                value={newCustomer.phone}
                onChange={(event) =>
                  setNewCustomer((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none"
              />
            </div>

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="flex-1 py-2 bg-gray-100 rounded-lg font-medium"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreateCustomer}
                className="flex-1 py-2 bg-[#1D4ED8] text-white rounded-lg font-medium"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showBillingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5">
            <h2 className="text-lg font-bold text-[#0F172A] mb-2">
              Group Reservation Detected
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              This reservation belongs to a group. You can still add these extras
              to the selected reservation, but confirm that your backend billing
              logic should charge this reservation and not the whole group.
            </p>

            <div className="bg-gray-50 border rounded-lg p-3 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Reservation</span>
                <span className="font-bold">#{selectedReservation}</span>
              </div>

              <div className="flex justify-between mt-1">
                <span className="text-gray-500">Group ID</span>
                <span className="font-bold">
                  {selectedReservationData?.groupId || '-'}
                </span>
              </div>

              <div className="flex justify-between mt-1">
                <span className="text-gray-500">Order Subtotal</span>
                <span className="font-bold">{formatPKR(cartTotal)}</span>
              </div>

              {calculatedTaxAmount > 0 && (
                <div className="flex justify-between mt-1">
                  <span className="text-gray-500">Tax ({taxPercent}%)</span>
                  <span className="font-bold">{formatPKR(calculatedTaxAmount)}</span>
                </div>
              )}

              <div className="flex justify-between mt-1 pt-1 border-t">
                <span className="text-gray-500">Final Total</span>
                <span className="font-bold text-[#1D4ED8]">{formatPKR(finalTotal)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowBillingModal(false)}
                className="flex-1 py-2 bg-gray-100 rounded-lg font-medium"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submitReservationExtras}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-[#1D4ED8] text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Extras'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}