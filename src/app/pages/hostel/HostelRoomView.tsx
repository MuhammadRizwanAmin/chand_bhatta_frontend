import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Info, User } from "lucide-react";
import api from "../../services/api";

export function HostelRoomView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/hostel-rooms/${id}`);
        if (res.data && res.data.data) {
          setRoom(res.data.data);
        } else if (res.data) {
          // Fallback if backend doesn't wrap in data.data
          setRoom(res.data.room || res.data);
        }
      } catch (err) {
        console.error("Error fetching room details:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRoomData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!room) {
    return <div className="text-center mt-10 text-slate-500">Room not found.</div>;
  }

  const activeTenants = room.tenants?.filter((t: any) => t.status !== "Inactive") || [];
  const occupiedCount = activeTenants.length;
  const availableSlots = room.capacity - occupiedCount;

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Room {room.roomNumber}</h1>
          <div className="flex items-center text-sm text-slate-500 mt-2 gap-2">
            <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => navigate('/')}>Home</span>
            <span>/</span>
            <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => navigate('/pms/rooms')}>Hostel Rooms</span>
            <span>/</span>
            <span className="text-slate-900 font-medium">View Details</span>
          </div>
        </div>
        <button
          onClick={() => navigate("/pms/rooms")}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-medium"
        >
          <ArrowLeft size={18} />
          <span>Back to List</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Stats */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-900">Room Summary</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Floor Number</div>
                <div className="text-2xl font-bold text-slate-900">{room.floorNumber || "N/A"}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Capacity</div>
                <div className="text-2xl font-bold text-slate-900">{room.capacity || 0} Persons</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Currently Occupied</div>
                <div className="text-2xl font-bold text-blue-600">{occupiedCount} Persons</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Available Slots</div>
                <div className={`text-2xl font-bold ${availableSlots > 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {availableSlots} {availableSlots === 1 ? "Slot" : "Slots"}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg shrink-0 mt-0.5">
                <Info size={16} />
              </div>
              <div>
                <div className="font-semibold text-blue-900 mb-1">Note</div>
                <div className="text-sm text-blue-800 leading-relaxed">
                  Only tenants with <strong className="font-bold">Active</strong> or <strong className="font-bold">Reserved</strong> status are shown here and counted towards the room's occupancy. Inactive tenants are excluded from these statistics.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Tenants */}
        <div className="xl:col-span-2">
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900">Active Tenants ({occupiedCount})</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant Name</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">CNIC</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Rent</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeTenants.length > 0 ? (
                    activeTenants.map((t: any) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {t.profileImage ? (
                              <img src={t.profileImage} alt={t.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                <User size={20} />
                              </div>
                            )}
                            <div className="font-semibold text-slate-900">{t.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">{t.contact || "N/A"}</td>
                        <td className="px-6 py-4 text-slate-600 text-sm">{t.cnic || "N/A"}</td>
                        <td className="px-6 py-4 font-medium text-slate-700 text-sm">Rs. {t.rent || 0}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            t.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => navigate(`/pms/tenants/view/${t.id}`)}
                            className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-200 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
                          >
                            View Profile
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No active tenants currently assigned to this room.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
