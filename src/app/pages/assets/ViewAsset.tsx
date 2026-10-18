import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Edit, Archive, TrendingDown, Clock, Activity, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrency } from '../../utils/currency';
import api from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';

export function ViewAsset() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canEdit, canDelete, canEditOrDelete } = usePermissions();

  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/inventory/single/${id}`);
        setAsset(res.data);
      } catch (err) {
        console.error('Error fetching asset:', err);
        toast.error('Failed to load asset details');
        navigate('/assets');
      } finally {
        setLoading(false);
      }
    };
    fetchAsset();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <Activity size={36} className="animate-spin mb-4 text-[#1D4ED8]" />
        <p>Loading asset details...</p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <Archive size={48} className="mb-4 text-red-400" />
        <p className="font-semibold text-gray-700">Asset not found.</p>
        <button onClick={() => navigate('/assets')} className="mt-4 text-[#1D4ED8] hover:underline text-sm">Back to Assets</button>
      </div>
    );
  }

  return (
    <div className=" mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/assets')}
            className="p-2 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">{asset.title}</h1>
            <p className="text-gray-500 text-sm mt-1">Asset Details</p>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={() => navigate(`/assets/edit/${asset.id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] text-white rounded-lg hover:bg-[#1E40AF] transition-colors font-medium text-sm"
          >
            <Edit size={16} />
            Edit Asset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Archive className="text-[#1D4ED8]" size={20} />
              General Information
            </h2>
            
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Asset Name</p>
                <p className="text-gray-900 font-medium">{asset.title}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Quantity</p>
                <p className="text-gray-900 font-medium">{asset.quantity}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cost Price</p>
                <p className="text-gray-900 font-medium">{getCurrency()} {Number(asset.costPrice || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Sell Price</p>
                <p className="text-gray-900 font-medium">
                  {asset.sellPrice ? `${getCurrency()} ${Number(asset.sellPrice).toLocaleString()}` : '—'}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</p>
                <p className="text-gray-700 whitespace-pre-wrap">{asset.description || 'No description provided.'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {/* Value Widget */}
          <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-xl shadow-sm p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-white/80 text-sm font-medium mb-1">Current Value</h3>
              <div className="text-3xl font-bold">
                {getCurrency()} {Number(asset.currentValue !== null ? asset.currentValue : asset.costPrice || 0).toLocaleString()}
              </div>
            </div>
            <TrendingDown className="absolute -right-4 -bottom-4 text-white/5" size={100} />
          </div>

          {/* Depreciation Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="text-gray-400" size={18} />
              Depreciation Settings
            </h3>
            
            {asset.isDepreciable ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Interval</span>
                  <span className="text-sm font-semibold text-gray-900">{asset.depreciationType || '—'}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Method</span>
                  <span className="text-sm font-semibold text-gray-900">{asset.depreciationMethod || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Value</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {asset.depreciationMethod === 'Percentage' ? `${asset.depreciationValue}%` : `${getCurrency()} ${Number(asset.depreciationValue || 0).toLocaleString()}`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-lg text-center">
                This asset is not marked as depreciable.
              </div>
            )}
          </div>

          {/* Meta Data */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="text-gray-400" size={18} />
              Record History
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Created At</p>
                <p className="text-sm text-gray-900">{new Date(asset.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Last Updated</p>
                <p className="text-sm text-gray-900">{new Date(asset.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
