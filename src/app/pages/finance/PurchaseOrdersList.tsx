import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

import { purchaseOrderService } from '../../services/purchaseOrderService';
import { DataTable } from '../../components/DataTable';

interface PurchaseOrder {
  id: number;
  orderDate: string;
  expectedDate: string | null;
  total: number;
  status: string;
  remarks: string;
  supplier?: { name: string };
}

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-amber-100 text-amber-700 border border-amber-200',
    icon: <Clock size={12} />,
  },
  APPROVED: {
    label: 'Approved',
    className: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    icon: <CheckCircle2 size={12} />,
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-700 border border-red-200',
    icon: <XCircle size={12} />,
  },
};

export function PurchaseOrdersList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await purchaseOrderService.getPurchaseOrders();
      const data = res.data || res;
      setOrders(Array.isArray(data) ? [...data].reverse() : []);
    } catch (err) {
      toast.error('Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const confirmDelete = (id: number) => {
    setSelectedId(id);
    setDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteModal(false);
    setSelectedId(null);
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    setDeleting(true);
    try {
      await purchaseOrderService.deletePurchaseOrder(selectedId);
      toast.success('Purchase Order deleted successfully');
      setOrders(prev => prev.filter(o => o.id !== selectedId));
      setDeleteModal(false);
      setSelectedId(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete Purchase Order');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return orders.filter(o => {
      const matchSearch =
        !q ||
        (o.supplier?.name || '').toLowerCase().includes(q) ||
        String(o.id).includes(q);

      const matchStatus = filterStatus === 'all' || o.status === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [orders, searchTerm, filterStatus]);

  const stats = useMemo(
    () => ({
      total: orders.length,
      draft: orders.filter(o => o.status === 'DRAFT').length,
      approved: orders.filter(o => o.status === 'APPROVED').length,
      cancelled: orders.filter(o => o.status === 'CANCELLED').length,
    }),
    [orders]
  );

  const getSerialNo = (row: PurchaseOrder) => {
    const index = filtered.findIndex(order => order.id === row.id);
    return index >= 0 ? index + 1 : '-';
  };

  const columns = [
    {
      header: '#',
      cell: (row: PurchaseOrder) => (
        <span onClick={() => navigate(`/finance/purchase-orders/view/${row.id}`)} className="cursor-pointer font-semibold text-[#1D4ED8]">PO-{row.id}</span>
      ),
    },
    {
      header: 'Supplier',
      cell: (row: PurchaseOrder) => (
        <div>
          <div className="font-semibold text-slate-900">{row.supplier?.name || '—'}</div>
          {/* <div className="text-xs font-medium text-slate-400">PO #{row.id}</div> */}
        </div>
      ),
    },
    {
      header: 'Order Date',
      cell: (row: PurchaseOrder) => (
        <span className="text-sm font-medium text-slate-600">
          {row.orderDate ? new Date(row.orderDate).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Expected Date',
      cell: (row: PurchaseOrder) => (
        <span className="text-sm font-medium text-slate-600">
          {row.expectedDate ? new Date(row.expectedDate).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Total Amount',
      cell: (row: PurchaseOrder) => (
        <span className="font-bold text-emerald-600">
          ₨ {Number(row.total || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (row: PurchaseOrder) => {
        const cfg =
          statusConfig[row.status] ||
          {
            label: row.status || 'Unknown',
            className: 'bg-slate-100 text-slate-600 border border-slate-200',
            icon: <AlertTriangle size={12} />,
          };

        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${cfg.className}`}>
            {cfg.icon}
            {cfg.label}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      cell: (row: PurchaseOrder) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate(`/finance/purchase-orders/view/${row.id}`)}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-blue-50 hover:text-[#1D4ED8]"
            title="View"
          >
            <Eye size={16} />
          </button>

          {(row.status === 'DRAFT' || row.status === 'CANCELLED') && (
            <button
              type="button"
              onClick={() => navigate(`/finance/purchase-orders/edit/${row.id}`)}
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
              title="Edit"
            >
              <Edit size={16} />
            </button>
          )}

          <button
            type="button"
            onClick={() => confirmDelete(row.id)}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">Purchase Orders</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage supplier purchase orders and bills</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => navigate('/finance/purchase-orders/add')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#1E40AF]"
          >
            <Plus size={20} />
            Create PO
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-500">Total Orders</div>
          <div className="mt-2 text-3xl font-extrabold text-[#0F172A]">{loading ? '...' : stats.total}</div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-500">Draft</div>
          <div className="mt-2 text-3xl font-extrabold text-amber-600">{loading ? '...' : stats.draft}</div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-500">Approved</div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-600">{loading ? '...' : stats.approved}</div>
        </div>

        <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-500">Cancelled</div>
          <div className="mt-2 text-3xl font-extrabold text-red-600">{loading ? '...' : stats.cancelled}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by supplier or PO number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-[#1D4ED8] focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="min-w-[180px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 outline-none transition-all focus:border-[#1D4ED8] focus:ring-4 focus:ring-blue-100"
          >
            <option value="all">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="APPROVED">Approved</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <DataTable columns={columns} data={filtered} loading={loading} />
      </div>

      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Trash2 size={22} />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-950">Delete Purchase Order?</h3>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                  This action will move this purchase order out of your active list. This cannot be undone from here.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
