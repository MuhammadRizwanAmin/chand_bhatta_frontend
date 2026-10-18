import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import { DataTable, Column } from "../../components/DataTable";
import api from "../../services/api";
import { DeleteConfirmationModal } from "../../components/DeleteConfirmationModal";
import { usePermissions } from "../../hooks/usePermissions";

export function HostelRoomList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteID, setDeleteID] = useState<number | null>(null);
  const [editRoom, setEditRoom] = useState<any>(null);
    const { canEdit, canDelete, canEditOrDelete } = usePermissions();


  const [formData, setFormData] = useState({
    roomNumber: "",
    floorNumber: "",
    capacity: "",
  });

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await api.get("/hostel-rooms/all");
      if (res.data && res.data.data) {
        setData(res.data.data);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roomNumber || !formData.floorNumber || !formData.capacity) {
      alert("All fields are required");
      return;
    }

    try {
      setIsSaving(true);
      if (editRoom) {
        await api.put(`/hostel-rooms/update/${editRoom.id}`, formData);
      } else {
        await api.post(`/hostel-rooms/add`, formData);
      }
      fetchRooms();
      setIsModalOpen(false);
      setEditRoom(null);
      setFormData({ roomNumber: "", floorNumber: "", capacity: "" });
    } catch (err) {
      console.error("Save Error:", err);
      alert("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteID) return;
    try {
      await api.delete(`/hostel-rooms/delete/${deleteID}`);
      setDeleteModal(false);
      fetchRooms();
    } catch (err) {
      console.error(err);
    }
  };

  const columns: Column<any>[] = [
    {
      header: "Room Number",
      accessorKey: "roomNumber",
      sortable: true,
      cell: (item) => <div className="font-medium text-slate-900">{item.roomNumber}</div>,
    },
    {
      header: "Floor",
      accessorKey: "floorNumber",
      sortable: true,
      cell: (item) => <div className="text-slate-500">{item.floorNumber}</div>,
    },
    {
      header: "Capacity",
      accessorKey: "capacity",
      sortable: true,
      cell: (item) => <div className="text-slate-500">{item.capacity}</div>,
    },
    {
      header: "Occupied",
      cell: (item) => {
        const occupied = item.tenants ? item.tenants.filter((t: any) => t.status === "Active" || t.status === "Reserved").length : 0;
        return (
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${occupied >= item.capacity ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {occupied} / {item.capacity}
            </span>
          </div>
        );
      },
    },
    {
      header: "Actions",
      cell: (item) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/pms/room/view/${item.id}`)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye size={18} />
          </button>
 {canEdit && (
          <button
            onClick={() => {
              setEditRoom(item);
              setFormData({
                roomNumber: item.roomNumber,
                floorNumber: item.floorNumber,
                capacity: item.capacity,
              });
              setIsModalOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Edit Room"
          >
            <Edit size={18} />
          </button>
 )}
 {canDelete && (
          <button
            onClick={() => {
              setDeleteID(item.id);
              setDeleteModal(true);
            }}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Room"
          >
            <Trash2 size={18} />
          </button>
 )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hostel Rooms</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage hostel rooms, capacity and floor numbers.
          </p>
        </div>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setEditRoom(null);
            setFormData({ roomNumber: "", floorNumber: "", capacity: "" });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={18} />
          <span>Add New Room</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        searchKeys={["roomNumber", "floorNumber"]}
      />

      {/* Delete Modal */}
      {deleteModal && (
        <DeleteConfirmationModal
          isOpen={deleteModal}
          onClose={() => setDeleteModal(false)}
          onConfirm={handleDelete}
          title="Delete Room"
          message="Are you sure you want to delete this hostel room? This action cannot be undone."
        />
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editRoom ? "Edit Room" : "Add New Room"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Room Number
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 101, A-1"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Floor Number
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 1, 2, Ground"
                  value={formData.floorNumber}
                  onChange={(e) => setFormData({ ...formData, floorNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Maximum tenants allowed"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#1D4ED8] text-white hover:bg-blue-700 rounded-xl transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : editRoom ? "Update Room" : "Save Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
