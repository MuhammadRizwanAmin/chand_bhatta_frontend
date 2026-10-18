import React, { useState, useEffect } from 'react';
import {
  bhattaService,
  StockInventory as StockItem,
} from '../../services/bhattaService';
import {
  Package,
  PlusCircle,
  MinusCircle,
  Layers,
  AlertTriangle,
  X,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export function StockInventory() {
  const [stocks, setStocks] = useState<StockItem[]>(bhattaService.getStocks());

  // Stock Adjustment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adjustData, setAdjustData] = useState({
    item_name: 'Aent_Aval' as StockItem['item_name'],
    adjustment_type: 'add' as 'add' | 'deduct',
    quantity: 5000,
    reason: 'New kiln chamber sorted batch',
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setStocks(bhattaService.getStocks());
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = adjustData.adjustment_type === 'add' ? Number(adjustData.quantity) : -Number(adjustData.quantity);
    bhattaService.adjustStock(adjustData.item_name, qty);
    setIsModalOpen(false);
    refreshData();
  };

  const itemDisplayMeta: Record<string, { label: string; urdu: string; desc: string; color: string; badge: string }> = {
    Aent_Aval: {
      label: 'Aent Aval (First Grade)',
      urdu: 'اول اینٹ (نمبر 1)',
      desc: 'Uniform sharp edges, rich metallic ring sound, top structural grade',
      color: 'from-emerald-500 to-teal-600',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    Aent_Doem: {
      label: 'Aent Doem (Second Grade)',
      urdu: 'دوئم اینٹ (نمبر 2)',
      desc: 'Slightly irregular shape, standard residential construction',
      color: 'from-blue-500 to-indigo-600',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    Aent_Soyem: {
      label: 'Aent Soyem (Third Grade)',
      urdu: 'سوئم اینٹ (نمبر 3)',
      desc: 'Over-burnt or under-burnt, foundation ballast and non-load walls',
      color: 'from-amber-500 to-yellow-600',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    Tile: {
      label: 'Tiles (Roof / Floor Tile)',
      urdu: 'ٹائل (چھت و فرش)',
      desc: 'High compaction mud tiles for waterproof roofing and paving',
      color: 'from-purple-500 to-violet-600',
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    Kacchi_Aent: {
      label: 'Kacchi Aent (Raw Ground Stock)',
      urdu: 'کچی اینٹ (زمین پر تیار مال)',
      desc: 'Sun-dried raw bricks molded by pathairs, ready for bhatti burning',
      color: 'from-rose-500 to-red-600',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  };

  const totalFinishedStock = stocks
    .filter(s => s.item_name !== 'Kacchi_Aent')
    .reduce((sum, s) => sum + s.current_stock, 0);

  const kacchiStock = stocks.find(s => s.item_name === 'Kacchi_Aent')?.current_stock || 0;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] flex items-center gap-2">
            <Package className="text-[#1D4ED8]" />
            Stock & Inventory Management (اسٹاک و مال گودام)
          </h2>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={15} />
          Adjust Stock / Toot-Phoot (اسٹاک ایڈجسٹمنٹ)
        </button>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 via-green-50/50 to-emerald-100/50 border border-emerald-300/80 border-t-4 border-t-emerald-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              Total Finished Goods Ready (تیار پکی اینٹ و ٹائل)
            </span>
            <div className="text-3xl font-black text-emerald-700 font-mono mt-1">
              {totalFinishedStock.toLocaleString()} <span className="text-xs font-semibold text-emerald-800">units</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 via-yellow-50/40 to-amber-100/40 border border-amber-300/80 border-t-4 border-t-amber-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Raw Ground Stock (کچی اینٹ زمین پر اسٹاک)
            </span>
            <div className="text-3xl font-black text-amber-900 font-mono mt-1">
              {kacchiStock.toLocaleString()} <span className="text-xs font-semibold text-amber-800">bricks</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
            <Layers size={24} />
          </div>
        </div>
      </div>

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {stocks.map((item) => {
          const meta = itemDisplayMeta[item.item_name] || {
            label: item.item_name,
            urdu: '',
            desc: '',
            color: 'from-blue-500 to-indigo-600',
            badge: 'bg-blue-50 text-blue-700 border-blue-200',
          };

          const cardTheme = 
            item.item_name === 'Pakki_Aval' ? 'border-t-4 border-t-amber-500 bg-amber-50/30 border-amber-200' :
            item.item_name === 'Pakki_Doem' ? 'border-t-4 border-t-emerald-600 bg-emerald-50/30 border-emerald-200' :
            item.item_name === 'Pakki_Soyem' ? 'border-t-4 border-t-blue-600 bg-blue-50/30 border-blue-200' :
            item.item_name === 'Pakki_Tile' ? 'border-t-4 border-t-purple-600 bg-purple-50/30 border-purple-200' :
            'border-t-4 border-t-rose-600 bg-rose-50/30 border-rose-200';

          return (
            <div
              key={item.id}
              className={`rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group border ${cardTheme}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${meta.badge}`}>
                    {meta.urdu}
                  </span>
                  <span className="text-[11px] font-mono text-[#64748B]">
                    ID: #{item.id}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#0F172A] mb-3">{meta.label}</h3>

                <div className="my-2">
                  <div className="text-3xl font-black text-[#0F172A] font-mono">
                    {item.current_stock.toLocaleString()}
                  </div>
                  <span className="text-xs text-[#64748B]">Units in storage yard</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AUTOMATED INVENTORY RULES NOTICE */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 flex items-start gap-3.5 text-xs text-[#334155]">
        <AlertTriangle className="text-[#1D4ED8] shrink-0 mt-0.5" size={18} />
        <div>
          <h4 className="font-bold text-[#0F172A] text-xs mb-1">خودکار اسٹاک اپڈیٹ کے اصول (Automated Inventory Logic):</h4>
          <ul className="list-disc list-inside space-y-1 text-[#475569]">
            <li>جب بھی <strong>سیلز انوائس (Sales Invoice)</strong> بنائی جائے گی، سسٹم خودکار طور پر فروخت شدہ اینٹ اسٹاک سے منفی کر دے گا۔</li>
            <li><strong>کچی اینٹ پتھائی (Kacchi Pathai)</strong> کے اندراج سے کچی زمین کا اسٹاک بڑھ جائے گا۔</li>
            <li><strong>بھٹی بھری (Bhari)</strong> کے اندراج سے کچی زمین کا مال بھٹی کے اندر ٹرانسفر ہو جائے گا۔</li>
            <li><strong>بھٹی نکاسی (Nikasi)</strong> کے اندراج سے پکی اینٹ اول، دوئم، سوئم میں تیار مال کا اضافہ ہوگا۔</li>
          </ul>
        </div>
      </div>

      {/* ADJUST STOCK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <RefreshCw size={18} className="text-[#1D4ED8]" />
                Adjust Stock / Toot-Phoot (اسٹاک رد و بدل)
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#334155] block mb-1">Select Item (آئٹم منتخب کریں) *</label>
                <select
                  value={adjustData.item_name}
                  onChange={(e) => setAdjustData({ ...adjustData, item_name: e.target.value as any })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                >
                  <option value="Aent_Aval">Aent Aval (اول اینٹ)</option>
                  <option value="Aent_Doem">Aent Doem (دوئم اینٹ)</option>
                  <option value="Aent_Soyem">Aent Soyem (سوئم اینٹ)</option>
                  <option value="Tile">Tile (ٹائل)</option>
                  <option value="Kacchi_Aent">Kacchi Aent (کچی اینٹ)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#334155] block mb-1">Adjustment Action *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustData({ ...adjustData, adjustment_type: 'add' })}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      adjustData.adjustment_type === 'add'
                        ? 'bg-[#10B981] text-white border-[#10B981] shadow-xs'
                        : 'bg-white text-[#64748B] border-[#CBD5E1] hover:text-[#0F172A]'
                    }`}
                  >
                    <PlusCircle size={15} />
                    Add Stock (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustData({ ...adjustData, adjustment_type: 'deduct' })}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      adjustData.adjustment_type === 'deduct'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-[#64748B] border-[#CBD5E1] hover:text-[#0F172A]'
                    }`}
                  >
                    <MinusCircle size={15} />
                    Deduct / Toot-Phoot (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#334155] block mb-1">Quantity of Bricks / Tiles (تعداد) *</label>
                <input
                  type="number"
                  step="500"
                  required
                  value={adjustData.quantity}
                  onChange={(e) => setAdjustData({ ...adjustData, quantity: Number(e.target.value) })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#334155] block mb-1">Reason / Note (وجہ)</label>
                <input
                  type="text"
                  placeholder="e.g. Broken in transport, rain damage, stock physical verification"
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#F1F5F9] text-[#475569] rounded-xl text-xs font-medium hover:bg-[#E2E8F0] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
