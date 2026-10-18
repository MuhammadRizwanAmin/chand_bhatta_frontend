import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  ChevronLeft, Package, Trash2, Edit, Activity, 
  AlertTriangle, CheckCircle2, TrendingDown, Box 
} from 'lucide-react';
import { toast } from 'sonner';

import { InventoryService } from '../../services/inventory/inventoryService';
import { DataTable } from '../../components/DataTable';
import { DateRangeFilter } from '../../components/DateRangeFilter';
import { usePermissions } from '../../hooks/usePermissions';

export function ViewInventoryItem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canEdit, canDelete, canEditOrDelete } = usePermissions();

  const [item, setItem] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const itemRes = await InventoryService.getById(Number(id));
        setItem(itemRes.items || itemRes.item || itemRes);
        
        const transRes = await InventoryService.getTransactions(id!);
        if (transRes.data) {
          setTransactions(Array.isArray(transRes.data) ? transRes.data : [transRes.data]);
        }
      } catch (err) {
        toast.error('Failed to load item details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await InventoryService.delete(Number(id));
      toast.success('Item deleted successfully');
      navigate('/inventory');
    } catch (err) {
      toast.error('Error deleting item');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <Activity size={36} className="animate-spin mb-4 text-[#1D4ED8]" />
        <p>Loading item details...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <Package size={48} className="mb-4 text-red-400" />
        <p className="font-semibold text-gray-700">Item not found.</p>
        <button onClick={() => navigate('/inventory')} className="mt-4 text-[#1D4ED8] hover:underline text-sm">Back to Inventory</button>
      </div>
    );
  }

  // Helpers
  const stock = Number(item.currentStock ?? item.stocks?.[0]?.qty ?? 0);
  const alertQty = Number(item.alertquantity ?? 0);
  const isLow = item.managestock && alertQty > 0 && stock <= alertQty;
  const isOut = item.managestock && stock <= 0;

  const stockCfg = !item.managestock 
    ? { color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-300', label: 'Untracked' }
    : isOut ? { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-500', label: 'Out of Stock' }
    : isLow ? { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-500', label: 'Low Stock' }
    : { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-500', label: 'In Stock' };

  const imgSrc = item.image ? item.image : null;
  const totalIssued = transactions
    .filter(t => t.referenceType === 'Issue')
    .reduce((sum, t) => sum + Math.abs(t.quantityChanged || 0), 0);

  const columns = [
    { header: 'ID', cell: (row: any) => <span className="text-gray-500 font-medium">#{row.id || 'N/A'}</span> },
    {
      header: 'Type',
      cell: (row: any) => {
        const type = row.referenceType || 'Sale';
        const typeColors: Record<string, string> = {
          Issue: 'bg-amber-100 text-amber-800',
          Purchase: 'bg-emerald-100 text-emerald-800',
          Sale: 'bg-sky-100 text-sky-800'
        };
        const color = typeColors[type] || 'bg-gray-100 text-gray-700';
        return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>{type}</span>;
      }
    },
    {
      header: 'Change',
      cell: (row: any) => (
        <span className={`font-bold ${row.quantityChanged < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
          {row.quantityChanged > 0 ? '+' : ''}{row.quantityChanged}
        </span>
      )
    },
    { header: 'Balance After', accessorKey: 'balanceAfter' },
    { header: 'Notes', cell: (row: any) => <span className="text-gray-600 truncate max-w-[200px] block" title={row.notes}>{row.notes || '—'}</span> },
    { header: 'Date', cell: (row: any) => <span className="text-sm text-gray-500">{new Date(row.createdAt).toLocaleString()}</span> }
  ];

  const filteredTransactions = transactions.filter(t => {
    if (!dateRange.startDate && !dateRange.endDate) return true;
    
    const tDate = new Date(t.createdAt);
    tDate.setHours(0, 0, 0, 0);
    
    if (dateRange.startDate) {
      const start = new Date(dateRange.startDate);
      start.setHours(0, 0, 0, 0);
      if (tDate < start) return false;
    }
    if (dateRange.endDate) {
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999);
      if (tDate > end) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/inventory')} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[#0F172A] flex items-center gap-2">
              {item.title}
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${item.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {item.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">Item Details & Inventory Logs</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
              {canEdit && (
              <button onClick={() => navigate(`/inventory/edit/${id}`)} className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 bg-blue-50 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                <Edit size={16} /> Edit
              </button>
              )}
              {canDelete && (
              <button onClick={() => setDeleteModal(true)} className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-700 bg-red-50 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                <Trash2 size={16} /> Delete
              </button>
              )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Image & Details */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-8">
            {/* Image */}
            <div className="flex-shrink-0 w-48 h-48 rounded-xl border border-gray-100 bg-slate-50 flex items-center justify-center overflow-hidden">
              {imgSrc ? (
                <img src={imgSrc} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-gray-400">
                  <Box size={48} className="mx-auto mb-2 opacity-50" />
                  <span className="text-sm">No image</span>
                </div>
              )}
            </div>

            {/* Details Grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Item Name</p>
                <p className="font-semibold text-gray-900">{item.title}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">SKU</p>
                <p className="font-semibold text-gray-900">{item.sku ? <span className="bg-gray-100 px-2 py-0.5 rounded font-mono text-sm">{item.sku}</span> : '—'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Category</p>
                <p className="font-medium text-gray-700">{item.categoryObj?.name || item.category || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Unit</p>
                <p className="font-medium text-gray-700">{item.unit || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Cost Price</p>
                <p className="font-bold text-[#1D4ED8]">₨ {Number(item.costPrice || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Sell Price</p>
                <p className="font-bold text-emerald-600">{item.sellPrice ? `₨ ${Number(item.sellPrice).toLocaleString()}` : '—'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tax / Discount</p>
                <p className="font-medium text-gray-700">
                  {item.tax !== null ? `${item.tax}% Tax` : '0% Tax'}
                  <span className="mx-2 text-gray-300">|</span>
                  {item.discountValue > 0 ? (
                    <span className="text-red-500 font-semibold">{item.discountType === 'percentage' ? `${item.discountValue}% Off` : `₨ ${item.discountValue} Off`}</span>
                  ) : 'No Discount'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">{item.description || 'No description provided.'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stats */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Current Stock */}
          <div className={`bg-white rounded-xl shadow-sm border-l-4 ${stockCfg.border} p-5`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Current Stock</p>
                <p className={`text-3xl font-black ${stockCfg.color}`}>
                  {item.managestock ? stock : '—'}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${stockCfg.bg} ${stockCfg.color}`}>
                {stockCfg.label}
              </span>
            </div>
            {item.managestock && alertQty > 0 && (
              <p className="text-sm text-gray-500 mt-2">Alert below {alertQty} {item.unit || 'units'}</p>
            )}
          </div>

          {/* Manage Stock Toggle */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Stock Tracking</p>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-5 rounded-full relative transition-colors ${item.managestock ? 'bg-[#1D4ED8]' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${item.managestock ? 'left-[22px]' : 'left-0.5'}`} />
              </div>
              <span className={`font-semibold ${item.managestock ? 'text-[#1D4ED8]' : 'text-gray-500'}`}>
                {item.managestock ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {/* Alert Qty */}
          <div className="bg-white rounded-xl shadow-sm border-l-4 border-amber-500 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Stock Alert Quantity</p>
            <p className="text-2xl font-black text-amber-600">
              {item.managestock && alertQty > 0 ? alertQty : <span className="text-gray-400 text-lg font-medium">Not set</span>}
            </p>
          </div>

          {/* Total Issued */}
          <div className="bg-white rounded-xl shadow-sm border-l-4 border-purple-500 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Issued</p>
            <p className="text-2xl font-black text-purple-600">{totalIssued}</p>
          </div>

        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-slate-50 border-b border-gray-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-[#0F172A] flex items-center gap-2">
              <Activity size={18} className="text-[#1D4ED8]" /> Inventory Logs
            </h2>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {filteredTransactions.length} entries
            </span>
          </div>
          <div className="w-full sm:w-auto relative z-40">
            <DateRangeFilter
              onChange={setDateRange}
              defaultLabel="Filter by Date"
              darkMode={false}
            />
          </div>
        </div>
        
        {filteredTransactions.length > 0 ? (
          <DataTable columns={columns} data={filteredTransactions} pageSize={10} searchable={false} />
        ) : (
          <div className="text-center py-16">
            <Activity size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No transaction logs found for this item.</p>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mx-auto mb-4">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-center text-gray-900 mb-1">Delete Item</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              This will permanently delete <strong>{item.title}</strong>. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(false)} disabled={deleting} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                {deleting ? <Activity size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
