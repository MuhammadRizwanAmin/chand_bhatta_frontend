import { useState, useEffect } from 'react';
import { Package, Search, Plus, AlertTriangle, TrendingDown, TrendingUp, Edit, Trash2, Box, Minus, Eye, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useNavigate } from 'react-router';
import { getCurrency } from '../../utils/currency';
import { DataTable, Column } from '../../components/DataTable';
import api from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';

export function Inventory() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { canEdit, canDelete, user } = usePermissions();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterIsPos, setFilterIsPos] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>(['all']);

  // Modals state
  const [showStockModal, setShowStockModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [stockForm, setStockForm] = useState({ qty: '', cost: '', notes: '', date: new Date().toISOString().split('T')[0] });
  const [issueForm, setIssueForm] = useState({ issuedToName: '', quantity: '', remarks: '' });

  const fetchData = async () => {
    try {
      let url = '/items/filtered';
      if (filterIsPos === 'pos') url += '?ispos=1';
      else if (filterIsPos === 'operations') url += '?ispos=0';

      const res = await api.get(url);
      const data = res.data.data || [];
      setInventory(data);
      
      const cats = new Set(data.map((item: any) => item.category || 'Uncategorized'));
      setCategories(['all', ...Array.from(cats)] as string[]);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterIsPos]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/items/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleStockSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await api.post('/items/stock', {
        itemId: selectedItem.id,
        qty: stockForm.qty,
        cost: stockForm.cost,
        notes: stockForm.notes,
        date: stockForm.date,
      });
      setShowStockModal(false);
      fetchData();
    } catch (error) {
      console.error('Error adding stock:', error);
    }
  };

  const handleIssueSubmit = async (e: any) => {
    e.preventDefault();
    if (!issueForm.quantity || Number(issueForm.quantity) <= 0) {
      toast.error('Enter a valid quantity to issue.');
      return;
    }
    if (!issueForm.issuedToName.trim()) {
      toast.error('Please specify where this item is going.');
      return;
    }

    try {
      const res = await api.post('/items/issue', {
        issuedToType: 'ManualIssue',
        issuedToName: issueForm.issuedToName.trim(),
        createdBy: user?.id || 1,
        items: [{ itemId: selectedItem.id, quantityIssued: Number(issueForm.quantity) }],
        remarks: issueForm.remarks || 'Issued manually by admin',
      });
      
      if (res.data?.success || res.status === 201) {
        toast.success('Item issued successfully!');
        setShowIssueModal(false);
        fetchData();
      } else {
        toast.error(res.data?.message || 'Failed to issue item.');
      }
    } catch (error: any) {
      console.error('Error issuing stock:', error);
      toast.error(error.response?.data?.message || 'Error issuing item.');
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
    const itemCat = item.category || 'Uncategorized';
    const matchesCategory = filterCategory === 'all' || itemCat === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = inventory.filter((item) => {
    if (!item.managestock) return false;
    const qty = item.stocks?.[0]?.qty ?? 0;
    return qty < (item.alertquantity || 0);
  });
  
  const totalValue = inventory.reduce((sum, item) => {
    const qty = item.stocks?.[0]?.qty ?? 0;
    return sum + (Number(item.costPrice || 0) * qty);
  }, 0);

  const columns: Column<any>[] = [
    {
      header: 'Item',
      accessorKey: 'title',
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-3">
          {item.image ? (
            <img src={item.image} alt={item.title} className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
              <Package size={20} />
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900">{item.title}</div>
            {item.sku && <div className="text-xs text-gray-500">SKU: {item.sku}</div>}
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (item) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          {item.category || 'Uncategorized'}
        </span>
      )
    },
    {
      header: 'Price',
      accessorKey: 'costPrice',
      sortable: true,
      cell: (item) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{getCurrency()} {Number(item.sellPrice || 0).toLocaleString()}</div>
          <div className="text-xs text-gray-500">Cost: {getCurrency()} {Number(item.costPrice || 0).toLocaleString()}</div>
        </div>
      )
    },
    {
      header: 'Stock',
      accessorKey: 'stocks',
      cell: (item) => {
        if (!item.managestock) return <span className="text-gray-400 text-sm">Not managed</span>;
        const qty = item.stocks?.[0]?.qty ?? 0;
        const isLowStock = qty < (item.alertquantity || 0);
        return (
          <div className="text-sm">
            <div className={`font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
              {qty} {item.unit}
            </div>
            {item.alertquantity > 0 && <div className="text-gray-500 text-xs">Alert at: {item.alertquantity}</div>}
          </div>
        );
      }
    },
    {
      header: 'Status',
      cell: (item) => {
        if (!item.managestock) return <span className="inline-flex px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">Untracked</span>;
        const qty = item.stocks?.[0]?.qty ?? 0;
        if (qty <= 0) return <span className="inline-flex px-2 py-1 rounded text-xs bg-red-100 text-red-700">Out of Stock</span>;
        if (qty <= item.alertquantity) return <span className="inline-flex px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">Low Stock</span>;
        return <span className="inline-flex px-2 py-1 rounded text-xs bg-green-100 text-green-700">In Stock</span>;
      }
    },
    {
      header: 'Actions',
      cell: (item) => (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none" title="Actions">
              <MoreVertical size={20} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content 
              align="end" 
              sideOffset={4}
              className="bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-[9999] min-w-[160px]" 
            >
              <DropdownMenu.Item className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer outline-none" onSelect={() => navigate(`/inventory/view/${item.id}`)}>
                <Eye size={16} /> View
              </DropdownMenu.Item>
               {canEdit && (<>
              <DropdownMenu.Item className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer outline-none" onSelect={() => navigate(`/inventory/edit/${item.id}`)}>
                <Edit size={16} /> Edit
              </DropdownMenu.Item>
              </>)}
              <DropdownMenu.Item className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer outline-none" onSelect={() => {
                setSelectedItem(item);
                setStockForm({ qty: item.stocks?.[0]?.qty ?? '', cost: item.stocks?.[0]?.costPrice ?? item.costPrice ?? '', notes: '', date: new Date().toISOString().split('T')[0] });
                setShowStockModal(true);
              }}>
                <Box size={16} /> Add/Edit Stock
              </DropdownMenu.Item>
              {item.managestock && (
                <DropdownMenu.Item className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer outline-none" onSelect={() => {
                  setSelectedItem(item);
                  setIssueForm({ issuedToName: '', quantity: '', remarks: '' });
                  setShowIssueModal(true);
                }}>
                  <Minus size={16} /> Issue Item
                </DropdownMenu.Item>
              )}
              <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />
                             {canDelete && (

              <DropdownMenu.Item className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer outline-none" onSelect={() => handleDelete(item.id)}>
                <Trash2 size={16} /> Delete
              </DropdownMenu.Item>
                             )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )
    }
  ];

  if (loading) return <div className="p-6 text-center text-gray-500">Loading inventory...</div>;

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Track and manage stock levels</p>
        </div>
        <button onClick={() => navigate('/inventory/addnew')} className="flex items-center gap-2 bg-[#1D4ED8] text-white px-6 py-2.5 rounded-lg hover:bg-[#1E40AF] transition-colors">
          <Plus size={18} />
          Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-[#1D4ED8]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-500 text-sm">Total Items</div>
              <div className="text-2xl font-bold text-[#0F172A] mt-1">{inventory.length}</div>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center"><Package className="text-[#1D4ED8]" size={24} /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-500 text-sm">Low Stock Items</div>
              <div className="text-2xl font-bold text-red-600 mt-1">{lowStockItems.length}</div>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center"><AlertTriangle className="text-red-500" size={24} /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-[#D4A017]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-500 text-sm">Total Value</div>
              <div className="text-2xl font-bold text-[#D4A017] mt-1">{getCurrency()} {totalValue.toLocaleString()}</div>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center"><TrendingUp className="text-[#D4A017]" size={24} /></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by item name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
          <select
            value={filterIsPos}
            onChange={(e) => setFilterIsPos(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
          >
            <option value="all">All Types</option>
            <option value="pos">POS Items</option>
            <option value="operations">Operations Items</option>
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={filteredInventory} />

      {/* Stock Modal */}
      {showStockModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-[#0F172A] mb-4">Add/Edit Stock for {selectedItem?.title}</h2>
            <form onSubmit={handleStockSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" required value={stockForm.qty} onChange={e => setStockForm({...stockForm, qty: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (Per unit)</label>
                <input type="number" step="0.01" required value={stockForm.cost} onChange={e => setStockForm({...stockForm, cost: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" required value={stockForm.date} onChange={e => setStockForm({...stockForm, date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea rows={2} value={stockForm.notes} onChange={e => setStockForm({...stockForm, notes: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none"></textarea>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowStockModal(false)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="bg-[#1D4ED8] text-white px-5 py-2 rounded-lg hover:bg-[#1E40AF]">Save Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-[#0F172A] mb-4">Issue {selectedItem?.title}</h2>
            <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm flex justify-between">
              <span className="text-gray-600">Current Stock:</span>
              <span className="font-bold text-[#0F172A]">{selectedItem?.stocks?.[0]?.qty ?? 0} {selectedItem?.unit}</span>
            </div>
            <form onSubmit={handleIssueSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue To (Room/Dept)</label>
                <input type="text" required placeholder="e.g. Kitchen, Room 101" value={issueForm.issuedToName} onChange={e => setIssueForm({...issueForm, issuedToName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" required min="1" max={selectedItem?.stocks?.[0]?.qty ?? 0} value={issueForm.quantity} onChange={e => setIssueForm({...issueForm, quantity: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label>
                <textarea rows={2} value={issueForm.remarks} onChange={e => setIssueForm({...issueForm, remarks: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:outline-none"></textarea>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowIssueModal(false)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="bg-yellow-600 text-white px-5 py-2 rounded-lg hover:bg-yellow-700">Issue Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
