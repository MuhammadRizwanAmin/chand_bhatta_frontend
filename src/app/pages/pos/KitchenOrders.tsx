import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Clock, CheckCircle2, RefreshCw, Flame, ChefHat, Utensils, DoorOpen, Printer, X } from "lucide-react";
import { kitchenService } from "../../services/kitchenService";

// ─── KOT Modal Component ───────────────────────────────────────────────────
const KotModal = ({ order, isCancelKot = false, onClose }: any) => {
  const isDuplicate = !isCancelKot && order.kotPrinted;
  const printedBy = JSON.parse(localStorage.getItem("@authUser") || "{}")?.name || "System";

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("en-PK", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).replace(",", "");
  };

  const punchedTime = formatTime(order.createdAt);
  const cancelTime = formatTime(order.cancelledAt);

  const roomNo = order.reservation?.rooms?.[0]?.roomNo || 
                 order.sale?.reservation?.rooms?.[0]?.roomNo || 
                 order.reservation?.assignedRoom?.roomNo || 
                 order.sale?.reservation?.assignedRoom?.roomNo;
  const tableLabel = roomNo ? `Room Service` : order.table ? `Table ${order.table.tableNumber}` : "Takeaway";
  const guestName = order.customer?.name || "";

  const handlePrint = () => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>KOT — ${order.orderNumber}</title>
          <style>
            @page { size: 80mm auto; margin: 5mm; }
            body { font-family: 'Courier New', monospace; font-size: 13px; color: #000; margin: 0; padding: 0; }
            .header-title { font-weight: bold; font-size: 15px; margin: 0 0 10px 0; }
            .meta-row { margin: 2px 0; line-height: 1.3; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #000; padding: 4px 6px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .center { text-align: center; }
            .cancel-banner { background: #000; color: #fff; text-align: center; padding: 6px; font-weight: bold; font-size: 14px; margin-bottom: 8px; }
            .duplicate-banner { text-align: center; font-weight: bold; font-size: 16px; letter-spacing: 2px; margin-bottom: 8px; color: #000; }
          </style>
        </head>
        <body>
          ${isCancelKot ? '<div class="cancel-banner">⚠ ORDER CANCELLED ⚠</div>' : ''}
          ${isDuplicate ? '<div class="duplicate-banner">— DUPLICATE —</div>' : ''}
          
          <div class="header-title">Kitchen Order Ticket (KOT)</div>
          
          <div class="meta-row"><strong>KOT No:</strong> ${order.orderNumber}</div>
          ${guestName ? `<div class="meta-row"><strong>Guest:</strong> ${guestName}</div>` : ''}
          <div class="meta-row"><strong>Type:</strong> ${tableLabel}</div>
          ${roomNo ? `<div class="meta-row"><strong>Room Number:</strong> ${roomNo}</div>` : ''}
          ${order.notes ? `<div class="meta-row"><strong>Notes:</strong> ${order.notes}</div>` : ''}
          <div class="meta-row">&nbsp;</div>
          <div class="meta-row"><strong>Printed by:</strong> ${printedBy}</div>
          <div class="meta-row"><strong>Printed on:</strong> ${isCancelKot ? cancelTime : punchedTime}</div>
          
          <div class="divider"></div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 70%;">Description</th>
                <th style="width: 30%; text-align: center;">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || []).map((item: any) => `
                  <tr>
                    <td style="${isCancelKot ? 'text-decoration: line-through;' : ''}">${item.name}</td>
                    <td class="center">${item.quantity}</td>
                  </tr>
                `).join("")}
            </tbody>
          </table>
          
          ${isCancelKot ? '<p style="margin-top: 10px; font-weight: bold; text-align: center; font-size: 13px;">— Void Order / Do Not Prepare —</p>' : ''}
        </body>
      </html>
    `);
    doc.close();
    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-bold text-lg text-gray-800">{isCancelKot ? "Cancel KOT Preview" : "KOT Preview"}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto bg-gray-100 flex justify-center flex-1">
          <div className="bg-white w-[300px] p-4 shadow-sm border border-gray-200" style={{ fontFamily: "'Courier New', monospace", fontSize: "13px", color: "#000" }}>
            {isCancelKot && (
              <div className="bg-black text-white text-center p-1.5 font-bold text-sm mb-2">
                ⚠ ORDER CANCELLED ⚠
              </div>
            )}
            {isDuplicate && (
              <div className="text-center text-red-500 font-bold text-base tracking-widest mb-2">
                — DUPLICATE —
              </div>
            )}

            <div className="font-bold text-[15px] mb-2.5">Kitchen Order Ticket (KOT)</div>

            <div className="my-0.5"><strong>Number:</strong> {order.orderNumber}</div>
            {guestName && <div className="my-0.5"><strong>Guest:</strong> {guestName}</div>}
            <div className="my-0.5"><strong>Type:</strong> {tableLabel}</div>
            {roomNo && <div className="my-0.5"><strong>Room Number:</strong> {roomNo}</div>}
            {order.notes && <div className="my-0.5"><strong>Notes:</strong> {order.notes}</div>}
            <div className="my-0.5">&nbsp;</div>
            <div className="my-0.5"><strong>Printed by:</strong> {printedBy}</div>
            <div className="my-0.5"><strong>Printed on:</strong> {isCancelKot ? cancelTime : punchedTime}</div>

            <div className="border-t border-dashed border-black my-2" />

            <table className="w-full border-collapse text-xs mt-2">
              <thead>
                <tr>
                  <th className="border border-black p-1 text-left">Description</th>
                  <th className="border border-black p-1 text-center w-10">Qty</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item: any, i: number) => (
                  <tr key={i}>
                    <td className="border border-black p-1" style={{ textDecoration: isCancelKot ? "line-through" : "none" }}>{item.name}</td>
                    <td className="border border-black p-1 text-center">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {isCancelKot && (
              <p className="mt-2.5 font-bold text-center text-[13px] text-red-500">
                — Void Order / Do Not Prepare —
              </p>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-3 justify-end bg-white">
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl font-bold text-gray-600 transition-colors">
            Close
          </button>
          <button onClick={handlePrint} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors shadow-emerald-500/20">
            <Printer size={18} /> {isDuplicate ? "Reprint KOT" : "Print KOT"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Status Config ─────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { bg: string; color: string; border: string; label: string; headerBg: string }> = {
  pending: {
    bg: "bg-amber-100", color: "text-amber-700", border: "border-amber-200", label: "PENDING", headerBg: "bg-amber-50"
  },
  preparing: {
    bg: "bg-blue-100", color: "text-blue-700", border: "border-blue-200", label: "PREPARING", headerBg: "bg-blue-50"
  },
  ready: {
    bg: "bg-emerald-100", color: "text-emerald-700", border: "border-emerald-200", label: "READY", headerBg: "bg-emerald-50"
  },
  served: {
    bg: "bg-indigo-100", color: "text-indigo-700", border: "border-indigo-200", label: "SERVED", headerBg: "bg-indigo-50"
  },
  cancelled: {
    bg: "bg-red-100", color: "text-red-700", border: "border-red-200", label: "CANCELLED", headerBg: "bg-red-50"
  },
};

const ACTION_CONFIG: Record<string, { label: string; next: string; style: string }> = {
  pending: {
    label: "Start Preparing", next: "preparing", style: "bg-blue-600 hover:bg-blue-700 text-white"
  },
  preparing: {
    label: "Mark Ready", next: "ready", style: "bg-emerald-500 hover:bg-emerald-600 text-white"
  },
  ready: {
    label: "Serve Order", next: "served", style: "bg-indigo-500 hover:bg-indigo-600 text-white"
  },
};

// ─── Timer Hook ────────────────────────────────────────────────────────────
const useElapsed = (createdAt: string) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const tick = () => {
      if (!createdAt) return;
      setElapsed(Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [createdAt]);
  return elapsed;
};

// ─── Single Order Card ─────────────────────────────────────────────────────
const OrderCard = ({ order, onUpdateOrder, onUpdateItem, onShowKot }: any) => {
  const elapsed = useElapsed(order.createdAt);
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const action = ACTION_CONFIG[order.status];

  const isLate = elapsed >= 20;
  const isWarning = elapsed >= 10 && elapsed < 20;
  const timerClass = isLate ? "bg-red-100 text-red-700 border-red-200" : isWarning ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-emerald-100 text-emerald-700 border-emerald-200";

  const roomNo = order.reservation?.assignedRoom?.roomNo || order.sale?.reservation?.assignedRoom?.roomNo;
  const tableLabel = roomNo ? `Room ${roomNo}` : order.table ? `Table ${order.table.tableNumber}` : "Takeaway";

  return (
    <div className={`bg-white rounded-xl border-2 transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col h-full ${cfg.border}`}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between border-b ${cfg.border} ${cfg.headerBg} rounded-t-xl`}>
        <div>
          <div className="text-xl font-black text-gray-900 leading-none">#{order.orderNumber}</div>
          <div className="text-[10px] font-bold text-gray-500 tracking-wider uppercase mt-1">{order.type?.replace("-", " ")}</div>
        </div>
        <div className="flex items-center gap-2">
          {order.createdAt && (
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${timerClass}`}>
              <Clock size={10} /> {elapsed}m
            </span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-grow overflow-y-auto max-h-64 scrollbar-thin scrollbar-thumb-gray-200">
        <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-lg mb-3">
          {roomNo ? <DoorOpen size={14} /> : <Utensils size={14} />} {tableLabel}
        </div>

        <div className="space-y-2">
          {order.items?.map((item: any) => {
            const isDone = item.status === "ready" || item.status === "served";
            return (
              <div 
                key={item.id} 
                onClick={() => {
                  if (order.status === "pending" || order.status === "served") return;
                  const newStatus = isDone ? "preparing" : "ready";
                  onUpdateItem(item.id, newStatus);
                }}
                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${isDone ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200 hover:bg-gray-100"}`}
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="text-amber-500 font-bold text-sm mr-2">{item.quantity}×</span>
                    <span className={`text-sm font-bold ${isDone ? "text-emerald-600 line-through opacity-75" : "text-gray-900"}`}>{item.name}</span>
                  </div>
                  {item.notes && <div className="text-[10px] text-gray-500 italic mt-0.5">{item.notes}</div>}
                </div>
                {isDone && <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />}
              </div>
            );
          })}
        </div>

        {order.notes && (
          <div className="mt-3 p-2 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg text-xs text-amber-900">
            <span className="font-bold mr-1">📝 Note:</span>{order.notes}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl flex flex-col gap-2">
        {action && (
          <div className="flex gap-2">
            <button
              onClick={() => onUpdateOrder(order.id, action.next)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors ${action.style}`}
            >
              {action.label}
            </button>
          </div>
        )}
        {order.status !== "cancelled" && (
          <button
            onClick={() => onShowKot(order)}
            className="w-full py-2 rounded-lg text-sm font-bold shadow-sm border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
          >
            <Printer size={16} /> {order.kotPrinted ? "Reprint KOT" : "Print KOT"}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main Display Component ────────────────────────────────────────────────
export function KitchenOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [kotModal, setKotModal] = useState<{order: any, isCancelKot: boolean} | null>(null);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);

  const handleShowKot = async (order: any, isCancelKot = false) => {
    setKotModal({ order, isCancelKot });

    if (!isCancelKot && !order.kotPrinted) {
      try {
        await kitchenService.markKotPrinted(order.id);
        fetchOrders();
      } catch (err) {
        console.error("Failed to mark KOT as printed", err);
      }
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await kitchenService.getOrders(filterDate);
      setOrders(data.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [filterDate]);

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      await kitchenService.updateOrderStatus(orderId, status);
      toast.success(`Order marked as ${status.toUpperCase()}`);
      fetchOrders();
    } catch {
      toast.error("Failed to update order status");
    }
  };

  const updateItemStatus = async (itemId: number, status: string) => {
    try {
      await kitchenService.updateItemStatus(itemId, status);
      // Optimistically update the item status locally for instant feedback
      setOrders(prev => prev.map(order => ({
        ...order,
        items: order.items?.map((item: any) => item.id === itemId ? { ...item, status } : item)
      })));
    } catch {
      toast.error("Failed to update item status");
    }
  };

  // Summary Counts
  const counts = orders.reduce((acc: any, o: any) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const activeOrders = orders.filter((o) => o.status !== "cancelled");
  const cancelledOrders = orders.filter((o) => o.status === "cancelled");

  return (
    <div className="space-y-6 pb-10 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#1D4ED8] to-[#1e3a8a] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
            <Flame size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Kitchen Display System</h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">Live Order Tracking</p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <input
            type="date"
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          {Object.entries(STATUS_CONFIG)
            .filter(([k]) => counts[k])
            .map(([k, cfg]) => (
              <span key={k} className={`px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                {counts[k]} {cfg.label}
              </span>
            ))}
            
          <div className="flex items-center gap-2 bg-[#0F172A] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md ml-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            LIVE
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading && activeOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-gray-400">
          <RefreshCw size={40} className="animate-spin mb-4 text-[#1D4ED8]" />
          <p className="font-medium">Syncing kitchen orders...</p>
        </div>
      ) : activeOrders.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {activeOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onUpdateOrder={updateOrderStatus}
              onUpdateItem={updateItemStatus}
              onShowKot={handleShowKot}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 border-dashed py-32 flex flex-col items-center justify-center text-center">
          <ChefHat size={64} className="text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-1">No Active Orders</h3>
          <p className="text-gray-500 text-sm">New orders from POS will appear here automatically.</p>
        </div>
      )}

      {/* Cancelled Orders Section */}
      {cancelledOrders.length > 0 && (
        <>
          <div className="flex items-center gap-4 mt-12 mb-6">
            <span className="text-sm font-bold text-red-500 tracking-wider">
              🚫 CANCELLED TODAY ({cancelledOrders.length})
            </span>
            <div className="flex-1 h-px bg-red-200" />
            <span className="text-xs text-gray-400 font-medium">Day-end audit trail</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {cancelledOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onUpdateOrder={updateOrderStatus}
                onUpdateItem={updateItemStatus}
                onShowKot={handleShowKot}
              />
            ))}
          </div>
        </>
      )}

      {/* Footer */}
      {lastUpdated && (
        <div className="text-center mt-8">
          <p className="text-xs font-medium text-gray-400">
            Last refreshed: {lastUpdated.toLocaleTimeString()} • Auto-refreshing every 10 seconds
          </p>
        </div>
      )}

      {/* KOT Modal */}
      {kotModal && (
        <KotModal
          order={kotModal.order}
          isCancelKot={kotModal.isCancelKot}
          onClose={() => setKotModal(null)}
        />
      )}
    </div>
  );
}

export default KitchenOrders;
