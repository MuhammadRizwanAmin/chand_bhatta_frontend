import React, { useState, useEffect } from "react";
import { Car, Settings, PlayCircle, Edit, Trash2, Plus, Receipt, X } from "lucide-react";
import { DataTable, Column } from "../../components/DataTable";
import api from "../../services/api";
import { DeleteConfirmationModal } from "../../components/DeleteConfirmationModal";

const statusConfig: Record<string, { bg: string, color: string, border: string }> = {
  Available: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  "On Trip": { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  Maintenance: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
};

export function TransportationVehicle() {
  const [data, setData] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [expenseLoading, setExpenseLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteID, setDeleteID] = useState<number | null>(null);

  const emptyForm = {
    name: "",
    model: "",
    plateNumber: "",
    type: "Car",
    driver: "",
    status: "Available",
  };
  const [formData, setFormData] = useState(emptyForm);

  const emptyExpenseForm = {
    title: "",
    price: "",
    date_for: new Date().toISOString().split("T")[0],
    payment_type: "cash",
    description: "",
    expense_type: "vehicle expense",
    bankId: "",
  };
  const [expenseFormData, setExpenseFormData] = useState(emptyExpenseForm);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await api.get("/vehicles");
      setData(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await api.get("/banks");
      setBanks(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchBanks();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitLoading(true);
      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle.id}`, formData);
      } else {
        await api.post("/vehicles", formData);
      }
      setShowModal(false);
      setFormData(emptyForm);
      setEditingVehicle(null);
      fetchVehicles();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save vehicle");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteID) return;
    try {
      await api.delete(`/vehicles/${deleteID}`);
      setDeleteModalOpen(false);
      setDeleteID(null);
      fetchVehicles();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete vehicle");
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.patch(`/vehicles/${id}/status`, { status });
      setData(prev => prev.map(v => v.id === id ? { ...v, status } : v));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to change status");
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseFormData.title || !expenseFormData.price) {
      alert("Please enter title and amount");
      return;
    }
    if (expenseFormData.payment_type !== "cash" && !expenseFormData.bankId) {
      alert("Please select a bank");
      return;
    }
    try {
      setExpenseLoading(true);
      await api.post("/expenses", {
        ...expenseFormData,
        vehicleId: selectedVehicle.id,
        amount: expenseFormData.price // backend usually expects amount or price
      });
      setShowExpenseModal(false);
      setExpenseFormData(emptyExpenseForm);
      setSelectedVehicle(null);
      alert("Expense added successfully");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save expense");
    } finally {
      setExpenseLoading(false);
    }
  };

  const columns: Column<any>[] = [
    {
      header: "Vehicle Details",
      accessorKey: "name",
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Car size={18} />
          </div>
          <div>
            <div className="font-semibold text-slate-900">{item.name}</div>
            <div className="text-xs text-slate-500">{item.type}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Model",
      accessorKey: "model",
      sortable: true,
      cell: (item) => <div className="text-slate-700 font-medium">{item.model || "-"}</div>,
    },
    {
      header: "Plate Number",
      accessorKey: "plateNumber",
      sortable: true,
      cell: (item) => (
        <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded font-mono text-sm text-slate-800">
          {item.plateNumber}
        </span>
      ),
    },
    {
      header: "Driver",
      accessorKey: "driver",
      sortable: true,
      cell: (item) => <div className="text-slate-700">{item.driver || "Unassigned"}</div>,
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (item) => {
        const conf = statusConfig[item.status] || statusConfig.Available;
        return (
          <select
            value={item.status}
            onChange={(e) => handleStatusChange(item.id, e.target.value)}
            className="text-xs font-bold rounded-full px-2 py-1 outline-none border cursor-pointer w-max"
            style={{ backgroundColor: conf.bg, color: conf.color, borderColor: conf.border }}
          >
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        );
      },
    },
    {
      header: "Actions",
      cell: (item) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setSelectedVehicle(item);
              setExpenseFormData({ ...emptyExpenseForm, title: `Expense for ${item.name}` });
              setShowExpenseModal(true);
            }}
            className="p-1.5 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
            title="Add Expense"
          >
            <Receipt size={16} />
          </button>
          <button
            onClick={() => {
              setEditingVehicle(item);
              setFormData({
                name: item.name || "",
                model: item.model || "",
                plateNumber: item.plateNumber || "",
                type: item.type || "Car",
                driver: item.driver || "",
                status: item.status || "Available",
              });
              setShowModal(true);
            }}
            className="p-1.5 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => { setDeleteID(item.id); setDeleteModalOpen(true); }}
            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vehicle Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage transportation vehicles, their statuses, and add expenses.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingVehicle(null);
              setFormData(emptyForm);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium"
          >
            <Plus size={18} />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        searchKeys={["name", "model", "plateNumber", "driver"]}
      />

      {/* VEHICLE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{editingVehicle ? "Edit Vehicle" : "Add Vehicle"}</h2>
              <button onClick={() => !submitLoading && setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Name</label>
                <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Toyota Corolla" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={formData.type} onChange={(e) => setFormData(p => ({ ...p, type: e.target.value }))}>
                    <option value="Car">Car</option>
                    <option value="Van">Van</option>
                    <option value="Bus">Bus</option>
                    <option value="Truck">Truck</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.model} onChange={(e) => setFormData(p => ({ ...p, model: e.target.value }))} placeholder="e.g. 2022" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Plate Number</label>
                  <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" value={formData.plateNumber} onChange={(e) => setFormData(p => ({ ...p, plateNumber: e.target.value.toUpperCase() }))} placeholder="ABC-123" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={formData.status} onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))}>
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Driver (Optional)</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.driver} onChange={(e) => setFormData(p => ({ ...p, driver: e.target.value }))} placeholder="Driver name" />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setShowModal(false)} disabled={submitLoading} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors font-medium text-sm">Cancel</button>
                <button type="submit" disabled={submitLoading} className="px-4 py-2 bg-[#1D4ED8] text-white hover:bg-blue-700 rounded-xl transition-colors font-medium text-sm disabled:opacity-50">
                  {submitLoading ? "Saving..." : "Save Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Add Vehicle Expense</h2>
              <button onClick={() => !expenseLoading && setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              <div className="bg-orange-50 text-orange-800 p-3 rounded-lg text-sm mb-2 border border-orange-100 font-medium flex items-center gap-2">
                <Car size={16} /> Recording expense for {selectedVehicle?.name} ({selectedVehicle?.plateNumber})
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expense Title</label>
                <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={expenseFormData.title} onChange={(e) => setExpenseFormData(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Fuel, Oil Change" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                  <input required type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={expenseFormData.price} onChange={(e) => setExpenseFormData(p => ({ ...p, price: e.target.value }))} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input required type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={expenseFormData.date_for} onChange={(e) => setExpenseFormData(p => ({ ...p, date_for: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={expenseFormData.payment_type} onChange={(e) => setExpenseFormData(p => ({ ...p, payment_type: e.target.value }))}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
              {expenseFormData.payment_type !== "cash" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Bank</label>
                  <select required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={expenseFormData.bankId} onChange={(e) => setExpenseFormData(p => ({ ...p, bankId: e.target.value }))}>
                    <option value="">Select bank...</option>
                    {banks.map(b => <option key={b.id} value={b.id}>{b.bankName}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <textarea rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" value={expenseFormData.description} onChange={(e) => setExpenseFormData(p => ({ ...p, description: e.target.value }))} />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setShowExpenseModal(false)} disabled={expenseLoading} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors font-medium text-sm">Cancel</button>
                <button type="submit" disabled={expenseLoading} className="px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 rounded-xl transition-colors font-medium text-sm disabled:opacity-50">
                  {expenseLoading ? "Saving..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Delete Vehicle"
          message="Are you sure you want to delete this vehicle? This action cannot be undone."
        />
      )}
    </div>
  );
}