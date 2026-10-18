import { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, TrendingDown, ArrowDownRight, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { getCurrency } from '../../utils/currency';
import { DataTable, Column } from '../../components/DataTable';
import api from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';
import { useConfirm } from '../../components/ConfirmProvider';

export function AssetsList() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { canEdit, canDelete, canEditOrDelete } = usePermissions();
  const { confirm } = useConfirm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory');
      setAssets(res.data.data || []);
    } catch (err) {
      console.error('Error fetching assets:', err);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Asset',
      message: 'Are you sure you want to delete this asset? This action cannot be undone.',
    });
    
    if (isConfirmed) {
      try {
        await api.delete(`/inventory/${id}`);
        toast.success('Asset deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting asset:', error);
        toast.error('Failed to delete asset');
      }
    }
  };

  const handleApplyDepreciation = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Apply Depreciation',
      message: 'Are you sure you want to apply depreciation for this asset? This will record an expense.',
    });

    if (isConfirmed) {
      try {
        const res = await api.post(`/inventory/depreciate/${id}`);
        if (res.status === 200 || res.data?.success) {
          toast.success('Depreciation applied successfully');
          fetchData();
        } else {
          toast.error(res.data?.message || 'Failed to apply depreciation');
        }
      } catch (error: any) {
        console.error('Error applying depreciation:', error);
        toast.error(error.response?.data?.message || 'Error applying depreciation');
      }
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Title',
      accessorKey: 'title',
      sortable: true,
      cell: (item) => (
        <div className="font-medium text-gray-900">{item.title}</div>
      )
    },
    {
      header: 'Current Value',
      accessorKey: 'currentValue',
      sortable: true,
      cell: (item) => {
        const val = item.currentValue !== null ? item.currentValue : item.costPrice;
        return <div className="font-semibold text-gray-900">{getCurrency()} {Number(val || 0).toLocaleString()}</div>;
      }
    },
    {
      header: 'Depreciable?',
      accessorKey: 'isDepreciable',
      sortable: true,
      cell: (item) => {
        if (!item.isDepreciable) {
          return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">No</span>;
        }
        return (
          <div>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">Yes</span>
            <div className="text-xs text-gray-500 mt-1">
              {item.depreciationType} ({item.depreciationMethod === 'Percentage' ? `${item.depreciationValue}%` : `${getCurrency()} ${item.depreciationValue}`})
            </div>
          </div>
        );
      }
    },
    {
      header: 'Purchased For',
      accessorKey: 'costPrice',
      sortable: true,
      cell: (item) => (
        <div className="text-sm text-gray-700">{getCurrency()} {Number(item.costPrice || 0).toLocaleString()}</div>
      )
    },
    {
      header: 'Quantity',
      accessorKey: 'quantity',
      sortable: true,
      cell: (item) => (
        <div className="text-sm text-gray-700">{item.quantity}</div>
      )
    },
    {
      header: 'Actions',
      cell: (item) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/assets/view/${item.id}`)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          {item.isDepreciable && (
            <button
              onClick={() => handleApplyDepreciation(item.id)}
              className="px-2.5 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-1"
              title="Apply Depreciation"
            >
              <TrendingDown size={14} />
              Depreciate
            </button>
          )}
          {canEdit && (
              <button
                onClick={() => navigate(`/assets/edit/${item.id}`)}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit Asset"
              >
                <Edit size={16} />
              </button>
          )}
          {canDelete && (
              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Asset"
              >
                <Trash2 size={16} />
              </button>
          )}
        </div>
      )
    }
  ];

  if (loading) return <div className="p-6 text-center text-gray-500">Loading assets...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Assets List</h1>
          <p className="text-gray-600 mt-1">Manage depreciable and non-depreciable items</p>
        </div>
        <button 
          onClick={() => navigate('/assets/add')} 
          className="flex items-center gap-2 bg-[#1D4ED8] text-white px-6 py-2.5 rounded-lg hover:bg-[#1E40AF] transition-colors"
        >
          <Plus size={18} />
          Add Asset
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <DataTable
          columns={columns}
          data={assets}
          searchable
          searchPlaceholder="Search assets..."
        />
      </div>
    </div>
  );
}
