//@ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  Car, User, Calendar, CheckCircle2, PlayCircle, XCircle, FileText, 
  Trash2, CreditCard, Edit, Check, X, RefreshCw, Plus 
} from "lucide-react";
import { DataTable, Column } from "../../components/DataTable";
import api from "../../services/api";
import { DeleteConfirmationModal } from "../../components/DeleteConfirmationModal";
import { InvoiceModal } from "../../components/InvoiceModal";
import Select from "react-select";

const statusStyle: Record<string, { bg: string, color: string, border: string, dot: string }> = {
  Completed: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", dot: "#16a34a" },
  Started: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", dot: "#1d4ed8" },
  Cancelled: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", dot: "#dc2626" },
};

export function TransportationTrips() {
  const [data, setData] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [banksList, setBanksList] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [completeLoadingId, setCompleteLoadingId] = useState<number | null>(null);
  const [cancelLoadingId, setCancelLoadingId] = useState<number | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteID, setDeleteID] = useState<number | null>(null);

  const [editingTrip, setEditingTrip] = useState<any>(null);
  const [viewTarget, setViewTarget] = useState<any>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [paymentTrip, setPaymentTrip] = useState<any>(null);

  const emptyForm = {
    vehicleId: "",
    staffId: "",
    reservationId: "",
    startReading: "",
    endReading: "",
    purpose: "",
    amount: "",
    status: "Completed",
    isReservationLinked: false,
    billingType: "Pay Now",
  };
  const [formData, setFormData] = useState(emptyForm);

  const [paymentData, setPaymentData] = useState({
    amount: "",
    method: "cash",
    date: new Date().toISOString().slice(0, 10),
    note: "",
    bankId: "",
    transactionId: ""
  });
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [staffFilter, setStaffFilter] = useState("All");

  const normalizeTrip = (trip: any) => {
    const vehicleName = trip?.vehicle?.name || trip?.Vehicle?.name || trip?.vehicleName || `Vehicle #${trip?.vehicleId || "-"}`;
    const plate = trip?.vehicle?.plateNumber || trip?.Vehicle?.plateNumber || trip?.plateNumber || "-";
    const staffName = trip?.user?.fullName || trip?.User?.fullName || trip?.staffName || `Staff #${trip?.staffId || "-"}`;
    const reservationLabel = trip?.reservation?.reservationNumber || trip?.reservation?.id || trip?.Reservation?.reservationNumber || trip?.Reservation?.id || trip?.reservationId || "-";
    const tripDate = trip?.startTime ? String(trip.startTime).slice(0, 10) : "-";

    return {
      ...trip,
      vehicleName,
      plate,
      staffName,
      reservationLabel,
      date: tripDate,
    };
  };

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await api.get('/trips');
      const trips = Array.isArray(response.data) ? response.data : Array.isArray(response.data?.data) ? response.data.data : [];
      setData(trips.map(normalizeTrip));
    } catch (error: any) {
      console.error("Fetch trips error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [vehicleRes, userRes, banksRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/users'),
        api.get('/banks')
      ]);

      setVehicles(Array.isArray(vehicleRes.data) ? vehicleRes.data : vehicleRes.data?.data || []);
      setStaff(Array.isArray(userRes.data) ? userRes.data : userRes.data?.users || userRes.data?.data || []);
      setBanksList(banksRes.data?.data || banksRes.data || []);
    } catch (error) {
      console.error("Fetch options error:", error);
    }
  };

  const fetchReservations = async () => {
    try {
      const response = await api.get('/reservation/only/ids');
      const reservationList = Array.isArray(response.data) ? response.data : response.data?.data || response.data?.reservations || [];
      const formattedReservations = reservationList.map((item: any) => ({
        label: `${item.refno} - ${item.customer?.name || "No Name"}`,
        value: item.id,
      }));
      setReservations(formattedReservations);
    } catch (error) {
      console.error("Fetch reservations error:", error);
    }
  };

  useEffect(() => {
    fetchTrips();
    fetchOptions();
  }, []);

  useEffect(() => {
    if (formData.isReservationLinked && reservations.length === 0) {
      fetchReservations();
    }
  }, [formData.isReservationLinked]);

  const filteredData = useMemo(() => {
    return data.filter((t) => {
      const matchStatus = statusFilter === "All" || t.status === statusFilter;
      const matchStaff = staffFilter === "All" || String(t.staffId) === String(staffFilter);
      const matchFrom = !dateFrom || (t.date !== "-" && t.date >= dateFrom);
      const matchTo = !dateTo || (t.date !== "-" && t.date <= dateTo);
      return matchStatus && matchStaff && matchFrom && matchTo;
    });
  }, [data, dateFrom, dateTo, statusFilter, staffFilter]);

  const stats = useMemo(() => {
    return {
      total: data.length,
      completed: data.filter((t) => t.status === "Completed").length,
      started: data.filter((t) => t.status === "Started").length,
      cancelled: data.filter((t) => t.status === "Cancelled").length,
    };
  }, [data]);

  const handleSave = async () => {
    if (!formData.vehicleId || !formData.staffId || formData.startReading === "") {
      alert("Vehicle, Staff and Start Reading are required");
      return;
    }
    if (formData.isReservationLinked && !formData.reservationId) {
      alert("Please select a reservation");
      return;
    }

    const payload = {
      vehicleId: Number(formData.vehicleId),
      staffId: Number(formData.staffId),
      reservationId: formData.isReservationLinked ? Number(formData.reservationId) : null,
      startReading: Number(formData.startReading),
      endReading: formData.endReading !== "" ? Number(formData.endReading) : null,
      purpose: formData.purpose,
      amount: formData.amount !== "" ? Number(formData.amount) : 0,
      status: formData.status,
      billingType: formData.billingType,
    };

    try {
      setSubmitLoading(true);
      if (editingTrip) {
        await api.put(`/trips/${editingTrip.id}`, payload);
      } else {
        await api.post(`/trips`, payload);
      }
      setShowModal(false);
      setEditingTrip(null);
      setFormData(emptyForm);
      fetchTrips();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to save trip");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCompleteTrip = async (trip: any) => {
    const endReadingInput = window.prompt(`Enter end reading for Trip #${trip.id}`, trip.endReading ?? trip.startReading ?? "");
    if (endReadingInput === null) return;
    if (endReadingInput === "" || Number(endReadingInput) < Number(trip.startReading)) {
      alert("Please enter a valid end reading");
      return;
    }
    try {
      setCompleteLoadingId(trip.id);
      await api.patch(`/trips/${trip.id}/complete`, {
        endReading: Number(endReadingInput),
        amount: trip.amount ?? 0,
      });
      fetchTrips();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to complete trip");
    } finally {
      setCompleteLoadingId(null);
    }
  };

  const handleCancelTrip = async (tripId: number) => {
    if (!window.confirm("Are you sure you want to cancel this trip?")) return;
    try {
      setCancelLoadingId(tripId);
      await api.patch(`/trips/${tripId}/cancel`);
      fetchTrips();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to cancel trip");
    } finally {
      setCancelLoadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteID) return;
    try {
      await api.delete(`/trips/${deleteID}`);
      setDeleteModalOpen(false);
      setDeleteID(null);
      fetchTrips();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to delete trip");
    }
  };

  const handlePayment = async () => {
    if (!paymentData.amount || Number(paymentData.amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    try {
      setPaymentLoading(true);
      await api.post(`/trips/${paymentTrip.id}/payment`, {
        amount: Number(paymentData.amount),
        method: paymentData.method,
        date: paymentData.date,
        note: paymentData.note,
        bankId: paymentData.bankId,
        transactionId: paymentData.transactionId,
      });
      setShowPaymentModal(false);
      setPaymentTrip(null);
      setPaymentData({ amount: "", method: "cash", date: new Date().toISOString().slice(0, 10), note: "", bankId: "", transactionId: "" });
      fetchTrips();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to add payment");
    } finally {
      setPaymentLoading(false);
    }
  };

  const columns: Column<any>[] = [
    {
      header: "Vehicle",
      accessorKey: "vehicleName",
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Car size={18} />
          </div>
          <div>
            <div className="font-semibold text-slate-900">{item.vehicleName}</div>
            <div className="text-xs text-slate-500">{item.plate}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Staff",
      accessorKey: "staffName",
      sortable: true,
      cell: (item) => <div className="text-slate-700 font-medium">{item.staffName}</div>,
    },
    {
      header: "Date",
      accessorKey: "date",
      sortable: true,
      cell: (item) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
          <Calendar size={14} />
          {item.date}
        </span>
      ),
    },
    {
      header: "Amount",
      accessorKey: "amount",
      sortable: true,
      cell: (item) => <div className="font-bold text-slate-700">Rs. {item.amount ?? 0}</div>,
    },
    {
      header: "Billing",
      accessorKey: "billingType",
      sortable: true,
      cell: (item) => (
        <span className={`px-2 py-1 rounded-full text-[11px] font-bold uppercase ${item.billingType === "Pay Now" ? "bg-red-50 text-red-600 border border-red-200" : "bg-blue-50 text-blue-600 border border-blue-200"}`}>
          {item.billingType || "Pay Later"}
        </span>
      ),
    },
    {
      header: "Paid",
      accessorKey: "paidAmount",
      sortable: true,
      cell: (item) => <div className="text-emerald-600 font-bold">Rs. {item.paidAmount ?? 0}</div>,
    },
    {
      header: "Balance",
      cell: (item) => {
        const bal = Math.max(0, (item.amount || 0) - (item.paidAmount || 0));
        return <div className={`font-bold ${bal > 0 ? "text-red-600" : "text-emerald-600"}`}>Rs. {bal}</div>;
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (item) => {
        const sc = statusStyle[item.status] || statusStyle.Completed;
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-max border" style={{ backgroundColor: sc.bg, color: sc.color, borderColor: sc.border }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.dot }} />
            {item.status}
          </span>
        );
      },
    },
    {
      header: "Actions",
      cell: (item) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {item.billingType !== "Pay Later" && (
            <button
              onClick={() => {
                setPaymentTrip(item);
                setPaymentData(prev => ({ ...prev, amount: String(Math.max(0, (item.amount || 0) - (item.paidAmount || 0))) }));
                setShowPaymentModal(true);
              }}
              className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              title="Add Payment"
            >
              <CreditCard size={16} />
            </button>
          )}
          <button
            onClick={() => {
              const mockReservation = {
                id: item.id,
                refno: `TRIP-${item.id}`,
                customer: item.reservation?.customer || { name: "Walk-in Customer", phone: "-", email: "-", cnic: "-" },
                startDate: item.startTime ? String(item.startTime).slice(0, 10) : "-",
                endDate: item.endTime ? String(item.endTime).slice(0, 10) : "-",
                rooms: [],
                trips: [item],
                extras: [],
                customExtras: [],
                advancePaid: item.paidAmount || 0,
                balanceAmount: Math.max(0, (item.amount || 0) - (item.paidAmount || 0)),
                discount: 0,
                taxAmount: 0,
                totalAmount: item.amount || 0,
                isStandaloneTripInvoice: true,
              };
              setInvoiceData(mockReservation);
              setShowInvoiceModal(true);
            }}
            className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
            title="Invoice"
          >
            <FileText size={16} />
          </button>
          <button
            onClick={() => {
              setEditingTrip(item);
              setFormData({
                vehicleId: item.vehicleId || "",
                staffId: item.staffId || "",
                reservationId: item.reservationId || "",
                startReading: item.startReading ?? "",
                endReading: item.endReading ?? "",
                purpose: item.purpose || "",
                amount: item.amount ?? "",
                status: item.status || "Completed",
                isReservationLinked: !!item.reservationId,
                billingType: item.billingType || (item.reservationId ? "Pay Later" : "Pay Now"),
              });
              setShowModal(true);
            }}
            className="p-1.5 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          {item.status === "Started" && (
            <>
              <button
                onClick={() => handleCompleteTrip(item)}
                disabled={completeLoadingId === item.id}
                className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
                title="Complete"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => handleCancelTrip(item.id)}
                disabled={cancelLoadingId === item.id}
                className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                title="Cancel"
              >
                <X size={16} />
              </button>
            </>
          )}
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
          <h1 className="text-2xl font-bold text-slate-900">Trip Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage standalone trips and reservation-linked trips with professional controls.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTrips}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl transition-colors shadow-sm font-medium"
          >
            <RefreshCw size={18} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => {
              setEditingTrip(null);
              setFormData(emptyForm);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium"
          >
            <Plus size={18} />
            <span>Add Trip</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Trips", value: stats.total, bg: "bg-blue-50", color: "text-blue-600", icon: <Car size={20} /> },
          { label: "Completed", value: stats.completed, bg: "bg-emerald-50", color: "text-emerald-600", icon: <CheckCircle2 size={20} /> },
          { label: "Started", value: stats.started, bg: "bg-indigo-50", color: "text-indigo-600", icon: <PlayCircle size={20} /> },
          { label: "Cancelled", value: stats.cancelled, bg: "bg-red-50", color: "text-red-600", icon: <XCircle size={20} /> },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{s.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{s.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl ${s.bg} ${s.color} flex items-center justify-center`}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-2">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-sm"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-sm"
        >
          <option value="All">All Statuses</option>
          <option value="Started">Started</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <div className="w-48 sm:w-56 z-10">
          <Select
            options={[
              { value: "All", label: "All Staff" },
              ...staff.map((s) => ({ value: String(s.id), label: s.fullName || s.name }))
            ]}
            value={
              staffFilter === "All"
                ? { value: "All", label: "All Staff" }
                : {
                    value: staffFilter,
                    label: staff.find((s) => String(s.id) === staffFilter)?.fullName || staff.find((s) => String(s.id) === staffFilter)?.name || "Unknown"
                  }
            }
            onChange={(selected: any) => setStaffFilter(selected ? selected.value : "All")}
            className="text-sm"
            styles={{
              control: (base) => ({
                ...base,
                minHeight: '38px',
                borderRadius: '0.5rem',
                borderColor: '#e2e8f0',
                boxShadow: 'none',
                '&:hover': { borderColor: '#cbd5e1' }
              })
            }}
          />
        </div>
        {(dateFrom || dateTo || statusFilter !== "All" || staffFilter !== "All") && (
          <button
            onClick={() => { setDateFrom(""); setDateTo(""); setStatusFilter("All"); setStaffFilter("All"); setSearch(""); }}
            className="px-4 py-2 border border-red-200 bg-red-50 text-red-600 font-semibold rounded-lg text-sm hover:bg-red-100"
          >
            Clear
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        loading={loading}
        searchQuery={search}
        searchKeys={["vehicleName", "plate", "staffName", "purpose"]}
        onRowClick={(item) => setViewTarget(item)}
      />

      {showModal && createPortal(
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" style={{ zIndex: 99999 }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto relative z-[99999]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-slate-900">{editingTrip ? "Edit Trip" : "Add New Trip"}</h2>
              <button onClick={() => !submitLoading && setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm mb-1">Trip Type</h4>
                  <p className="text-xs text-slate-500">Choose whether this trip is standalone or linked with a reservation.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={formData.isReservationLinked} onChange={(e) => setFormData(p => ({ ...p, isReservationLinked: e.target.checked, reservationId: e.target.checked ? p.reservationId : "", billingType: e.target.checked ? "Pay Later" : "Pay Now" }))} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={formData.vehicleId}
                    onChange={(e) => setFormData(p => ({ ...p, vehicleId: e.target.value }))}
                  >
                    <option value="">Select vehicle</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.plateNumber})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Staff</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={formData.staffId}
                    onChange={(e) => setFormData(p => ({ ...p, staffId: e.target.value }))}
                  >
                    <option value="">Select staff</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.fullName || s.name}</option>)}
                  </select>
                </div>

                {formData.isReservationLinked && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Reservation</label>
                      <Select
                        options={reservations}
                        value={reservations.find(r => String(r.value) === String(formData.reservationId)) || null}
                        onChange={(selected: any) => setFormData(p => ({ ...p, reservationId: selected ? selected.value : "" }))}
                        isClearable
                        placeholder="Search and select reservation..."
                        styles={{
                          control: (base) => ({
                            ...base,
                            borderRadius: '0.5rem',
                            borderColor: '#e2e8f0',
                            padding: '1px',
                            boxShadow: 'none',
                            '&:hover': { borderColor: '#cbd5e1' }
                          })
                        }}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Billing Type</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="radio" checked={formData.billingType === "Pay Later"} onChange={() => setFormData(p => ({ ...p, billingType: "Pay Later" }))} />
                          Pay Later (Add to Reservation)
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="radio" checked={formData.billingType === "Pay Now"} onChange={() => setFormData(p => ({ ...p, billingType: "Pay Now" }))} />
                          Pay Now (Standalone)
                        </label>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.amount}
                    onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={formData.status}
                    onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))}
                  >
                    <option value="Started">Started</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Reading</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.startReading}
                    onChange={(e) => setFormData(p => ({ ...p, startReading: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Reading</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.endReading}
                    onChange={(e) => setFormData(p => ({ ...p, endReading: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Purpose</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.purpose}
                    onChange={(e) => setFormData(p => ({ ...p, purpose: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
              <button onClick={() => setShowModal(false)} disabled={submitLoading} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors font-medium text-sm">Cancel</button>
              <button onClick={handleSave} disabled={submitLoading} className="px-4 py-2 bg-[#1D4ED8] text-white hover:bg-blue-700 rounded-xl transition-colors font-medium text-sm disabled:opacity-50">
                {submitLoading ? "Saving..." : "Save Trip"}
              </button>
            </div>
          </div>
        </div>, document.body
      )}

      {showPaymentModal && createPortal(
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" style={{ zIndex: 99999 }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto relative z-[99999]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Add Payment for Trip #{paymentTrip?.id}</h2>
              <button onClick={() => !paymentLoading && setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
                <div className="flex justify-between mb-1"><span className="text-slate-500">Total Amount:</span><span className="font-semibold">Rs. {paymentTrip?.amount}</span></div>
                <div className="flex justify-between mb-1"><span className="text-slate-500">Paid So Far:</span><span className="font-semibold text-emerald-600">Rs. {paymentTrip?.paidAmount || 0}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-1 mt-1 font-semibold"><span className="text-slate-700">Balance:</span><span className="text-red-600">Rs. {Math.max(0, (paymentTrip?.amount || 0) - (paymentTrip?.paidAmount || 0))}</span></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                <input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={paymentData.amount} onChange={(e) => setPaymentData(p => ({ ...p, amount: e.target.value }))} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Method</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={paymentData.method} onChange={(e) => setPaymentData(p => ({ ...p, method: e.target.value }))}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank</option>
                </select>
              </div>

              {paymentData.method === "bank" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bank</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={paymentData.bankId} onChange={(e) => setPaymentData(p => ({ ...p, bankId: e.target.value }))}>
                    <option value="">Select Bank</option>
                    {banksList.map(b => <option key={b.id} value={b.id}>{b.bankName}</option>)}
                  </select>
                </div>
              )}

              {(paymentData.method === "bank" || paymentData.method === "card") && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Transaction ID</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={paymentData.transactionId} onChange={(e) => setPaymentData(p => ({ ...p, transactionId: e.target.value }))} />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={paymentData.date} onChange={(e) => setPaymentData(p => ({ ...p, date: e.target.value }))} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} value={paymentData.note} onChange={(e) => setPaymentData(p => ({ ...p, note: e.target.value }))} />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
              <button onClick={() => setShowPaymentModal(false)} disabled={paymentLoading} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors font-medium text-sm">Cancel</button>
              <button onClick={handlePayment} disabled={paymentLoading} className="px-4 py-2 bg-[#1D4ED8] text-white hover:bg-blue-700 rounded-xl transition-colors font-medium text-sm disabled:opacity-50">
                {paymentLoading ? "Processing..." : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>, document.body
      )}

      {deleteModalOpen && (
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Delete Trip"
          message="Are you sure you want to delete this trip? This action cannot be undone."
        />
      )}

      {viewTarget && createPortal(
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" style={{ zIndex: 99999 }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
            <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] px-6 py-5 flex items-center justify-between">
              <h2 className="text-white text-lg font-bold flex items-center gap-2"><Car size={18}/> Trip Details</h2>
              <button onClick={() => setViewTarget(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1.5"><User size={14}/> Driver (Staff)</div>
                  <div className="font-semibold text-slate-900">{viewTarget.staffName}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1.5"><Car size={14}/> Vehicle</div>
                  <div className="font-semibold text-slate-900">{viewTarget.vehicleName} <span className="text-xs font-normal text-slate-500">({viewTarget.plate})</span></div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium mb-1">Start Reading</div>
                  <div className="font-semibold text-slate-900">{viewTarget.startReading ?? '-'} km</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium mb-1">End Reading</div>
                  <div className="font-semibold text-slate-900">{viewTarget.endReading ?? '-'} km</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 col-span-2">
                  <div className="text-xs text-blue-600 font-medium mb-1">Distance Covered</div>
                  <div className="text-lg font-bold text-blue-800">
                    {viewTarget.startReading && viewTarget.endReading ? Math.max(0, viewTarget.endReading - viewTarget.startReading) : '-'} km
                  </div>
                </div>
                <div className="col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium mb-1">Purpose</div>
                  <div className="text-sm text-slate-900">{viewTarget.purpose || '-'}</div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setViewTarget(null)} className="px-5 py-2 border border-slate-300 bg-white rounded-lg hover:bg-slate-50 text-sm font-medium">Close</button>
            </div>
          </div>
        </div>, document.body
      )}

      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        booking={invoiceData}
      />
    </div>
  );
}
