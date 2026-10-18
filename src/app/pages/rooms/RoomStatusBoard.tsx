import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { 
  DoorClosed, CheckCircle, UserCheck, Bookmark, HelpCircle, 
  Droplets, PenTool, Calendar, Search, X, Grid, LayoutDashboard,
  Filter, RotateCw
} from "lucide-react";
import api from "../../services/api";
import { toast } from "sonner";
import { format, addDays } from "date-fns";

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
const toYMD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export function RoomStatusBoard() {
  const navigate = useNavigate();

  // ── Data ──
  const [floors, setFloors] = useState<any[]>([]);
  const [assignedRooms, setAssignedRooms] = useState<any[]>([]);
  const [roomCategories, setRoomCategories] = useState<any[]>([]);
  const [housekeepingRooms, setHousekeepingRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Filters ──
  const today = toYMD(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [statusFilter, setStatusFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const isToday = selectedDate === today;

  // ── UI ──
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  /* ── API ── */
  const fetchFloors = async () => {
    try {
      const res = await api.get('/floors');
      setFloors([...res.data].reverse());
    } catch (err: any) {
      toast.error(err.message || "Failed to load floors");
    }
  };

  const fetchAssignedRooms = async (date: string) => {
    try {
      const res = await api.get(`/assignRoom/assigned-rooms-with-type?date=${date}`);
      const rooms = res.data?.data || [];
      setAssignedRooms(rooms);
      
      const cats: any[] = [];
      const seen = new Set();
      rooms.forEach((r: any) => {
        if (r.RoomType && !seen.has(r.RoomType.id)) {
          seen.add(r.RoomType.id);
          cats.push(r.RoomType);
        }
      });
      setRoomCategories(cats);
    } catch (err: any) {
      toast.error(err.message || "Failed to load assigned rooms");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHousekeepingRooms = async () => {
    try {
      const res = await api.get('/housekeeping/dirty-rooms');
      setHousekeepingRooms(res.data || []);
    } catch (err) {
      console.error("Housekeeping fetch error:", err);
    }
  };

  const refreshData = () => {
    setIsLoading(true);
    fetchFloors();
    fetchAssignedRooms(selectedDate);
    if (selectedDate === today) fetchHousekeepingRooms();
  };

  useEffect(() => {
    fetchFloors();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchAssignedRooms(selectedDate);
    if (selectedDate === today) {
      fetchHousekeepingRooms();
    } else {
      setHousekeepingRooms([]);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(refreshData, 30000);
    toast.info("Auto-refresh enabled (30s)");
    return () => clearInterval(id);
  }, [autoRefresh, selectedDate]);

  /* ── Client-side filter logic ── */
  const filteredFloors = useMemo(() => {
    let result = floors;

    if (floorFilter !== "all") {
      result = result.filter((f) => String(f.id) === String(floorFilter));
    }

    return result.map((floor) => {
      const parsedRooms = typeof floor.roomNames === 'string'
        ? floor.roomNames.split(',').map((r: string) => r.trim()).filter(Boolean)
        : [];
      const allRoomNos = parsedRooms.length > 0 
        ? parsedRooms 
        : Array.from({ length: floor.numberOfRooms || 0 }, (_, i) => (floor.startRoomNo || 1) + i);

      const filtered = allRoomNos.filter((roomNo) => {
        const assigned = assignedRooms.find(
          (r) => String(r.roomNo) === String(roomNo) && r.floorId === floor.id
        );

        const hkRoom = isToday
          ? housekeepingRooms.find(
              (r) =>
                String(r.roomNo) === String(roomNo) &&
                (r.floorId === floor.id || r.Floor?.id === floor.id)
            )
          : null;
        const hkStatus = hkRoom?.status; 

        if (statusFilter === "unassigned" && (assigned || hkStatus)) return false;
        if (statusFilter === "available" && (!assigned || assigned.status !== "available" || hkStatus)) return false;
        if (statusFilter === "booked" && (!assigned || (assigned.status !== "checked_in" && assigned.status !== "confirmed"))) return false;
        if (statusFilter === "reserved" && (!assigned || assigned.status !== "reserved")) return false;
        if (statusFilter === "dirty" && hkStatus !== "dirty") return false;
        if (statusFilter === "maintenance" && hkStatus !== "maintenance") return false;

        if (categoryFilter !== "all" && (!assigned || String(assigned.roomTypeId) !== String(categoryFilter))) return false;

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (
            !String(roomNo).toLowerCase().includes(q) &&
            !assigned?.RoomType?.name?.toLowerCase().includes(q) &&
            !assigned?.guestName?.toLowerCase().includes(q)
          )
            return false;
        }

        return true;
      });

      return { ...floor, filteredRoomNumbers: filtered, allRoomNos };
    });
  }, [floors, assignedRooms, housekeepingRooms, statusFilter, floorFilter, categoryFilter, searchQuery, isToday]);

  /* ── Color logic ── */
  const getRoomColor = (room: any, hkStatus: string | null) => {
    if (isToday && hkStatus === "dirty") return "bg-orange-500 shadow-orange-500/40";
    if (isToday && hkStatus === "maintenance") return "bg-purple-500 shadow-purple-500/40";
    if (!room) return "bg-gray-400 shadow-gray-400/40";
    if (room.status === "available") return "bg-emerald-500 shadow-emerald-500/40";
    if (room.status === "checked_in" || room.status === "confirmed") return "bg-red-500 shadow-red-500/40";
    if (room.status === "reserved") return "bg-amber-400 shadow-amber-400/40";
    return "bg-gray-400 shadow-gray-400/40";
  };

  const getStatusText = (s: string) => 
    ({ available: "Available", confirmed: "Booked", checked_in: "Booked", reserved: "Reserved" }[s] || "Unassigned");
  
  const getHkStatusText = (s: string) => 
    ({ dirty: "Dirty", maintenance: "Maintenance" }[s] || "");

  const handleRoomClick = (roomNo: number, floor: any, assigned: any, hkStatus: string | null) => {
    setSelectedRoom({
      roomNo,
      floor: floor.floorName,
      type: assigned?.RoomType?.name || "Unassigned",
      status: assigned?.status || "unassigned",
      hkStatus: hkStatus || null,
      details: assigned || null,
    });
    setShowRoomDetails(true);
  };

  const getTotalRooms = () => floors.reduce((acc, f) => {
    const parsed = typeof f.roomNames === 'string' ? f.roomNames.split(',').filter(Boolean) : [];
    return acc + (parsed.length > 0 ? parsed.length : (f.numberOfRooms || 0));
  }, 0);

  const roomCounts = {
    total: getTotalRooms(),
    available: assignedRooms.filter((r) => r.status === "available").length,
    booked: assignedRooms.filter((r) => r.status === "checked_in" || r.status === "confirmed").length,
    reserved: assignedRooms.filter((r) => r.status === "reserved").length,
    unassigned: Math.max(0, getTotalRooms() - assignedRooms.length),
    dirty: isToday ? housekeepingRooms.filter((r) => r.status === "dirty").length : 0,
    maintenance: isToday ? housekeepingRooms.filter((r) => r.status === "maintenance").length : 0,
  };

  const activeFilters = [statusFilter !== "all", floorFilter !== "all", categoryFilter !== "all", !!searchQuery].filter(Boolean).length;
  const clearAllFilters = () => { setStatusFilter("all"); setFloorFilter("all"); setCategoryFilter("all"); setSearchQuery(""); };

  return (
    <div className="min-h-screen bg-slate-50 pb-8 space-y-6">
      
      {/* Modal */}
      {showRoomDetails && selectedRoom && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
              <h2 className="text-white font-semibold text-lg">Room {selectedRoom.roomNo} Details</h2>
              <button onClick={() => setShowRoomDetails(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedRoom.hkStatus && (
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    selectedRoom.hkStatus === 'dirty' ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {selectedRoom.hkStatus === 'dirty' ? '🧹 Dirty' : '🔧 Maintenance'}
                  </span>
                )}
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">
                  {getStatusText(selectedRoom.status)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-500 font-medium">Room Number</div>
                  <div className="font-semibold text-gray-900">{selectedRoom.roomNo}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Floor</div>
                  <div className="font-semibold text-gray-900">{selectedRoom.floor}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Category</div>
                  <div className="font-semibold text-gray-900">{selectedRoom.type}</div>
                </div>
              </div>

              {selectedRoom.details?.guestName && (
                <>
                  <hr className="my-4 border-gray-100" />
                  <h6 className="font-semibold text-sm mb-3">Reservation Details</h6>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 font-medium">Guest Name</div>
                      <div className="font-semibold text-gray-900">{selectedRoom.details.guestName}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 font-medium">Check-in</div>
                        <div className="font-semibold text-gray-900">
                          {selectedRoom.details.checkIn ? format(new Date(selectedRoom.details.checkIn), 'dd MMM yyyy') : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium">Check-out</div>
                        <div className="font-semibold text-gray-900">
                          {selectedRoom.details.checkOut ? format(new Date(selectedRoom.details.checkOut), 'dd MMM yyyy') : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowRoomDetails(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Room Status Dashboard</h1>
          <div className="text-slate-400 text-sm flex items-center gap-2">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span>Room Status</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
              autoRefresh ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-white/5 text-white border-white/20 hover:bg-white/10'
            }`}
          >
            <RotateCw size={16} className={autoRefresh ? 'animate-spin' : ''} />
            {autoRefresh ? 'Auto ON' : 'Auto OFF'}
          </button>
          <button 
            onClick={refreshData} disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-white/5 text-white border border-white/20 hover:bg-white/10 transition-colors"
          >
            <RotateCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Date Selector */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quick Select</div>
            <div className="flex gap-2">
              {[0, 1, 2].map((n) => {
                const d = toYMD(addDays(new Date(), n));
                const labels = ["Today", "Tomorrow", "Day After"];
                const active = selectedDate === d;
                return (
                  <button
                    key={n}
                    onClick={() => setSelectedDate(d)}
                    className={`flex flex-col items-center px-4 py-2 rounded-xl border-2 transition-all min-w-[100px] ${
                      active ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-sm font-bold">{labels[n]}</span>
                    <span className={`text-xs ${active ? 'text-slate-300' : 'text-slate-500'}`}>
                      {format(addDays(new Date(), n), 'dd MMM')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="hidden md:block w-px h-12 bg-slate-200"></div>

          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Custom Date</div>
            <div className="relative">
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-3 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="ml-auto bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 flex items-center gap-4">
            <Calendar size={24} className="text-blue-600" />
            <div>
              <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Showing rooms for</div>
              <div className="text-sm font-bold text-slate-900">
                {format(new Date(selectedDate), 'EEEE, dd MMM yyyy')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
        {[
          { label: "Total", count: roomCounts.total, icon: <DoorClosed size={20}/>, bg: "bg-slate-900" },
          { label: "Available", count: roomCounts.available, icon: <CheckCircle size={20}/>, bg: "bg-emerald-500" },
          { label: "Booked", count: roomCounts.booked, icon: <UserCheck size={20}/>, bg: "bg-red-500" },
          { label: "Reserved", count: roomCounts.reserved, icon: <Bookmark size={20}/>, bg: "bg-amber-400" },
          { label: "Unassigned", count: roomCounts.unassigned, icon: <HelpCircle size={20}/>, bg: "bg-gray-400" },
          ...(isToday ? [
            { label: "Dirty", count: roomCounts.dirty, icon: <Droplets size={20}/>, bg: "bg-orange-500" },
            { label: "Maintenance", count: roomCounts.maintenance, icon: <PenTool size={20}/>, bg: "bg-purple-500" },
          ] : [])
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:-translate-y-1 transition-transform">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${stat.bg}`}>
                {stat.icon}
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 leading-none">{stat.count}</div>
                <div className="text-xs text-slate-500 font-medium mt-1">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-500" />
            <h3 className="font-semibold text-slate-900">Filters</h3>
            {activeFilters > 0 && <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{activeFilters}</span>}
          </div>
          {activeFilters > 0 && (
            <button onClick={clearAllFilters} className="text-sm text-red-600 font-medium hover:text-red-700">
              Clear All
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="reserved">Reserved</option>
              <option value="unassigned">Unassigned</option>
              {isToday && (
                <>
                  <option value="dirty">Dirty</option>
                  <option value="maintenance">Maintenance</option>
                </>
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Floor</label>
            <select value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Floors</option>
              {floors.map(f => <option key={f.id} value={f.id}>{f.floorName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Category</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Categories</option>
              {roomCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Search</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Room no, guest..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Floors & Rooms */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredFloors.map(floor => {
            const displayRooms = floor.filteredRoomNumbers ?? floor.allRoomNos;
            
            const fAvail  = displayRooms.filter((n:any) => assignedRooms.find(r => String(r.roomNo) === String(n) && r.floorId===floor.id && r.status==="available")).length;
            const fBooked = displayRooms.filter((n:any) => assignedRooms.find(r => String(r.roomNo) === String(n) && r.floorId===floor.id && (r.status==="checked_in"||r.status==="confirmed"))).length;
            const fRsvd   = displayRooms.filter((n:any) => assignedRooms.find(r => String(r.roomNo) === String(n) && r.floorId===floor.id && r.status==="reserved")).length;
            const fDirty  = isToday ? displayRooms.filter((n:any) => housekeepingRooms.find(r => String(r.roomNo) === String(n) && (r.floorId===floor.id||r.Floor?.id===floor.id) && r.status==="dirty")).length : 0;
            const fMaint  = isToday ? displayRooms.filter((n:any) => housekeepingRooms.find(r => String(r.roomNo) === String(n) && (r.floorId===floor.id||r.Floor?.id===floor.id) && r.status==="maintenance")).length : 0;

            return (
              <div key={floor.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-900 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-sm">
                      {floor.floorName}
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                      {displayRooms.length} rooms shown
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {fAvail > 0 && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-semibold">{fAvail} Available</span>}
                    {fBooked > 0 && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold">{fBooked} Booked</span>}
                    {fRsvd > 0 && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-semibold">{fRsvd} Reserved</span>}
                    {fDirty > 0 && <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-semibold">🧹 {fDirty} Dirty</span>}
                    {fMaint > 0 && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold">🔧 {fMaint} Maint</span>}
                  </div>
                </div>

                <div className="p-5">
                  {displayRooms.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <DoorClosed size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No rooms match the current filters</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                      {displayRooms.map((roomNo: any) => {
                        const assigned = assignedRooms.find(r => String(r.roomNo) === String(roomNo) && r.floorId === floor.id);
                        const hkRoom = isToday ? housekeepingRooms.find(r => String(r.roomNo) === String(roomNo) && (r.floorId === floor.id || r.Floor?.id === floor.id)) : null;
                        const hkStatus = hkRoom?.status;
                        const colorClass = getRoomColor(assigned, hkStatus);

                        return (
                          <div 
                            key={roomNo}
                            onClick={() => handleRoomClick(roomNo, floor, assigned, hkStatus)}
                            className={`p-3 rounded-xl text-white cursor-pointer transition-all hover:-translate-y-1 hover:brightness-110 shadow-sm min-h-[90px] flex flex-col justify-between ${colorClass}`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-lg leading-none">{roomNo}</span>
                              {hkStatus === "dirty" && <span className="text-sm">🧹</span>}
                              {hkStatus === "maintenance" && <span className="text-sm">🔧</span>}
                              {!hkStatus && assigned?.guestName && <UserCheck size={14} className="opacity-90" />}
                            </div>
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-wider opacity-90 mt-2 mb-0.5">
                                {hkStatus ? getHkStatusText(hkStatus) : (assigned ? getStatusText(assigned.status) : "Unassigned")}
                              </div>
                              <div className="text-[10px] opacity-75 truncate">
                                {assigned?.RoomType?.name || "—"}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
