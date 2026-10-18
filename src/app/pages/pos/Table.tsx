//@ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import {
  Armchair,
  CheckCircle2,
  Clock,
  Edit,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  kitchenTableService,
  type KitchenTable,
} from "../../services/kitchenTableService";
import { usePermissions } from "../../hooks/usePermissions";

const STATUS_CONFIG = {
  available: {
    label: "Available",
    cardTop: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: "bg-emerald-50 text-emerald-600",
    dot: "bg-emerald-500",
    action:
      "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  },
  occupied: {
    label: "Occupied",
    cardTop: "bg-red-500",
    badge: "bg-red-50 text-red-700 border-red-200",
    icon: "bg-red-50 text-red-600",
    dot: "bg-red-500",
    action:
      "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  },
  reserved: {
    label: "Reserved",
    cardTop: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    icon: "bg-amber-50 text-amber-600",
    dot: "bg-amber-500",
    action:
      "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  },
};

const getStatusConfig = (status) => {
  return STATUS_CONFIG[status] || STATUS_CONFIG.available;
};

const TableManagement = () => {
  const [tables, setTables] = useState<KitchenTable[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState<KitchenTable | null>(null);

  const [formData, setFormData] = useState({
    tableNumber: "",
    capacity: 2,
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
    const { canEdit, canDelete, canEditOrDelete } = usePermissions();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchTables = async () => {
    try {
      setLoading(true);
      const result = await kitchenTableService.getTables();
      setTables(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      console.error("Fetch tables error:", error);
      toast.error("Failed to load tables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const stats = useMemo(() => {
    return {
      total: tables.length,
      available: tables.filter((table) => table.status === "available").length,
      occupied: tables.filter((table) => table.status === "occupied").length,
      reserved: tables.filter((table) => table.status === "reserved").length,
    };
  }, [tables]);

  const filteredTables = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tables.filter((table) => {
      const tableNumber = String(table.tableNumber || "").toLowerCase();
      const capacity = String(table.capacity || "").toLowerCase();
      const status = String(table.status || "").toLowerCase();

      const matchesSearch =
        !query ||
        tableNumber.includes(query) ||
        capacity.includes(query) ||
        status.includes(query);

      const matchesStatus =
        statusFilter === "all" || String(table.status) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tables, search, statusFilter]);

  const resetForm = () => {
    setEditingTable(null);
    setFormData({
      tableNumber: "",
      capacity: 2,
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (table) => {
    setEditingTable(table);
    setFormData({
      tableNumber: table.tableNumber || "",
      capacity: table.capacity || 2,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) return;

    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!String(formData.tableNumber).trim()) {
      toast.error("Table number is required");
      return;
    }

    if (!formData.capacity || Number(formData.capacity) <= 0) {
      toast.error("Capacity must be greater than 0");
      return;
    }

    try {
      setSubmitting(true);

      if (editingTable) {
        await kitchenTableService.updateTable(editingTable.id, {
          tableNumber: formData.tableNumber,
          capacity: Number(formData.capacity),
          ...(editingTable.status ? { status: editingTable.status } : {}),
        });
        toast.success("Table updated successfully");
      } else {
        await kitchenTableService.createTable({
          tableNumber: formData.tableNumber,
          capacity: Number(formData.capacity),
        });
        toast.success("Table created successfully");
      }

      setShowModal(false);
      resetForm();
      fetchTables();
    } catch (error: any) {
      console.error("Save table error:", error);
      toast.error(error?.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Delete this table?");
    if (!confirmed) return;

    try {
      await kitchenTableService.deleteTable(id);
      toast.success("Table deleted");
      fetchTables();
    } catch (error: any) {
      console.error("Delete table error:", error);
      toast.error(error?.response?.data?.message || "Delete failed");
    }
  };

  const handleToggleStatus = async (table: KitchenTable) => {
    const oldStatus = table.status;
    const newStatus = oldStatus === "occupied" ? "available" : "occupied";

    // Optimistic UI update
    setTables((currentTables) =>
      currentTables.map((item) =>
        item.id === table.id ? { ...item, status: newStatus } : item
      )
    );

    try {
      await kitchenTableService.toggleTableStatus(table);
      toast.success(`Table ${table.tableNumber} marked as ${newStatus}`);
    } catch (error: any) {
      console.error("Toggle table status error:", error);

      // Revert optimistic update on failure
      setTables((currentTables) =>
        currentTables.map((item) =>
          item.id === table.id ? { ...item, status: oldStatus } : item
        )
      );

      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">
            Table Management
          </h1>
          <p className="mt-1 text-gray-600">
            Manage restaurant tables, seating capacity, and live table status
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={fetchTables}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E40AF]"
          >
            <Plus size={17} />
            Add Table
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            label: "Total Tables",
            value: stats.total,
            bg: "bg-blue-50",
            color: "text-blue-600",
            icon: <Armchair size={22} />,
          },
          {
            label: "Available",
            value: stats.available,
            bg: "bg-emerald-50",
            color: "text-emerald-600",
            icon: <CheckCircle2 size={22} />,
          },
          {
            label: "Occupied",
            value: stats.occupied,
            bg: "bg-red-50",
            color: "text-red-600",
            icon: <Users size={22} />,
          },
          {
            label: "Reserved",
            value: stats.reserved,
            bg: "bg-amber-50",
            color: "text-amber-600",
            icon: <Clock size={22} />,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center justify-between rounded-xl border bg-white p-5 shadow-sm"
          >
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <h3 className="mt-1 text-2xl font-bold text-[#0F172A]">
                {stat.value}
              </h3>
            </div>

            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}
            >
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-[#0F172A]">
          <Filter size={18} className="text-[#1D4ED8]" />
          Filters
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative md:col-span-3">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search table number, capacity, or status..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="reserved">Reserved</option>
          </select>
        </div>

        {(search || statusFilter !== "all") && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
          Loading tables...
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <Armchair size={28} />
          </div>

          <h3 className="text-lg font-bold text-[#0F172A]">No Tables Found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add your first table or clear filters to see all tables.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTables.map((table) => {
            const status = getStatusConfig(table.status);
            const isOccupied = table.status === "occupied";

            return (
              <div
                key={table.id}
                className="overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md"
              >
                <div className={`h-1.5 ${status.cardTop}`} />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold ${status.icon}`}
                      >
                        T{table.tableNumber}
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-[#0F172A]">
                          Table {table.tableNumber}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {table.capacity} seats
                        </p>
                      </div>
                    </div>

                    <span
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${status.badge}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Capacity</p>
                      <p className="text-sm font-bold text-[#0F172A]">
                        {table.capacity} Seats
                      </p>
                    </div>

                    <div className="rounded-lg border bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Current Status</p>
                      <p className="text-sm font-bold text-[#0F172A]">
                        {status.label}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(table)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm font-bold transition ${status.action}`}
                    >
                      {isOccupied ? "Mark Available" : "Mark Occupied"}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                     {canEdit && (
                      <button
                        type="button"
                        onClick={() => openEditModal(table)}
                        className="flex items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100"
                      >
                        <Edit size={15} />
                        Edit
                      </button>
                     )}

                     {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(table.id)}
                        className="flex items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                     )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingTable ? "Edit Table" : "Add New Table"}
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  {editingTable
                    ? "Update table number and seating capacity"
                    : "Create a new restaurant table"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 p-6">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Table Number
                  </label>

                  <input
                    type="text"
                    value={formData.tableNumber}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        tableNumber: event.target.value,
                      }))
                    }
                    placeholder="e.g. 12"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Seating Capacity
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        capacity: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#1D4ED8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E40AF] disabled:opacity-50"
                >
                  {submitting
                    ? "Saving..."
                    : editingTable
                      ? "Save Changes"
                      : "Add Table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagement;