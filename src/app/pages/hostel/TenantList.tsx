import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Phone,
  User,
  BadgeCheck,
} from "lucide-react";
import api from "../../services/api";
import { DataTable, Column } from "../../components/DataTable";
import { DeleteConfirmationModal } from "../../components/DeleteConfirmationModal";
import { usePermissions } from "../../hooks/usePermissions";

export function HostelTenantList() {
  const navigate = useNavigate();
    const { canEdit, canDelete, canEditOrDelete } = usePermissions();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteID, setDeleteID] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTenants = async () => {
    try {
      setLoading(true);

      const res = await api.get("/hostel-tenants/all");

      if (res.data?.data) {
        setData(res.data.data);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleStatusChange = async (
    id: number,
    status: string
  ) => {
    try {
      await api.put(`/hostel-tenants/change-status/${id}`, {
        status,
      });

      fetchTenants();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!deleteID) return;

    try {
      setIsDeleting(true);

      await api.delete(`/hostel-tenants/delete/${deleteID}`);

      setDeleteModal(false);
      fetchTenants();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-50 text-emerald-600";
      case "Inactive":
        return "bg-red-50 text-red-600";
      case "Reserved":
        return "bg-blue-50 text-blue-600";
      case "Notice":
        return "bg-amber-50 text-amber-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const columns: Column<any>[] = [
    {
      header: "Tenant",
      accessorKey: "name",
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <User size={18} className="text-blue-600" />
          </div>

          <div>
            <div className="font-semibold text-slate-900">
              {item.name}
            </div>

            <div className="text-xs text-slate-500">
              {item.cnic || "N/A"}
            </div>
          </div>
        </div>
      ),
    },

    {
      header: "Contact",
      accessorKey: "contact",
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-2 text-slate-600">
          <Phone size={14} />
          {item.contact || "N/A"}
        </div>
      ),
    },

    {
      header: "Room",
      sortable: true,
      cell: (item) => (
        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
          {item.room?.roomNumber || "Not Assigned"}
        </span>
      ),
    },

    {
      header: "Rent",
      accessorKey: "rent",
      sortable: true,
      cell: (item) => (
        <div className="font-semibold text-emerald-600">
          Rs. {Number(item.rent || 0).toLocaleString()}
        </div>
      ),
    },

    {
      header: "Status",
      cell: (item) => (
        <select
          value={item.status}
          onChange={(e) =>
            handleStatusChange(item.id, e.target.value)
          }
          className={`px-3 py-2 rounded-xl border-0 text-sm font-medium focus:outline-none ${statusBadge(
            item.status
          )}`}
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Reserved">Reserved</option>
          <option value="Notice">Notice</option>
        </select>
      ),
    },

    {
      header: "Actions",
      cell: (item) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              navigate(`/pms/tenants/view/${item.id}`)
            }
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
          >
            <Eye size={18} />
          </button>
 {canEdit && (
          <button
            onClick={() =>
              navigate(`/pms/tenant/edit/${item.id}`)
            }
            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
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
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
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
      {/* Hero Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
              <BadgeCheck size={14} />
              Tenant Management
            </div>

            <h1 className="mt-3 text-3xl font-bold text-slate-900">
              Hostel Tenants
            </h1>

            <p className="mt-2 text-slate-500">
              Manage tenants, room allocations, rent and
              occupancy details.
            </p>
          </div>

          <button
            onClick={() =>
              navigate("/pms/tenants/add")
            }
            className="flex items-center gap-2 px-5 py-3 bg-[#1D4ED8] text-white rounded-2xl hover:bg-blue-700 transition-all shadow-sm font-medium"
          >
            <Plus size={18} />
            Add New Tenant
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-slate-500 text-sm">
            Total Tenants
          </p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">
            {data.length}
          </h3>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-slate-500 text-sm">
            Active Tenants
          </p>
          <h3 className="text-3xl font-bold text-emerald-600 mt-2">
            {
              data.filter(
                (x) => x.status === "Active"
              ).length
            }
          </h3>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-slate-500 text-sm">
            Reserved Tenants
          </p>
          <h3 className="text-3xl font-bold text-blue-600 mt-2">
            {
              data.filter(
                (x) => x.status === "Reserved"
              ).length
            }
          </h3>
        </div>
      </div>

      {/* Table */}
      <DataTable
        title="Tenant Directory"
        columns={columns}
        data={data}
        loading={loading}
        searchKeys={[
          "name",
          "cnic",
          "contact",
          "status",
        ]}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Tenant"
        message="Are you sure you want to delete this tenant? This action cannot be undone."
      />
    </div>
  );
}