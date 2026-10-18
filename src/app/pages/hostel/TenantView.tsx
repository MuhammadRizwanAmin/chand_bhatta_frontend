import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import api from "../../services/api";
import { ArrowLeft } from "lucide-react";

export function TenantView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [status, setStatus] = useState("");

  const fetchTenant = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/hostel-tenants/${id}`);
      if (res.data?.data) {
        setTenant(res.data.data);
        setStatus(res.data.data.status);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, [id]);

  const handleStatusChange = async (value: string) => {
    try {
      setStatus(value);
      await api.put(`/hostel-tenants/change-status/${id}`, {
        status: value,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString() : "-";

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center mt-10 text-slate-500">
        Tenant not found
      </div>
    );
  }

  // ledger flatten
  const ledger =
    tenant.fees?.flatMap((fee: any) =>
      fee.payments?.map((p: any) => ({
        ...p,
        slipNo: fee.slipNo,
        month: fee.month,
        year: fee.year,
      }))
    ) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">

      {/* HEADER */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {tenant.name}
            </h1>
            <p className="text-sm text-slate-500">
              Tenant Profile Details
            </p>
          </div>
        </div>

        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Reserved">Reserved</option>
          <option value="Notice">Notice</option>
        </select>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-12 gap-6">

        {/* LEFT NAV */}
        <div className="col-span-12 md:col-span-3 space-y-4">

          <div className="bg-white border rounded-2xl p-4">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full text-left p-2 rounded-lg ${
                activeTab === "overview" ? "bg-blue-50 text-blue-600" : ""
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => setActiveTab("room")}
              className={`w-full text-left p-2 rounded-lg ${
                activeTab === "room" ? "bg-blue-50 text-blue-600" : ""
              }`}
            >
              Room
            </button>

            <button
              onClick={() => setActiveTab("fees")}
              className={`w-full text-left p-2 rounded-lg ${
                activeTab === "fees" ? "bg-blue-50 text-blue-600" : ""
              }`}
            >
              Fees
            </button>

            <button
              onClick={() => setActiveTab("ledger")}
              className={`w-full text-left p-2 rounded-lg ${
                activeTab === "ledger" ? "bg-blue-50 text-blue-600" : ""
              }`}
            >
              Ledger
            </button>
          </div>

          {/* SUMMARY */}
          <div className="bg-white border rounded-2xl p-4">
            <p className="text-xs text-slate-500">Rent</p>
            <p className="text-lg font-bold text-slate-900">
              Rs {tenant.rent || 0}
            </p>

            <p className="text-xs text-slate-500 mt-4">Joined</p>
            <p className="font-semibold text-slate-700">
              {formatDate(tenant.createdAt)}
            </p>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="col-span-12 md:col-span-9">

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="bg-white border rounded-2xl p-5 space-y-6">
              <h2 className="font-semibold">Personal Info</h2>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Name</p>
                  <p className="font-semibold">{tenant.name}</p>
                </div>

                <div>
                  <p className="text-slate-500">CNIC</p>
                  <p className="font-semibold">{tenant.cnic || "-"}</p>
                </div>

                <div>
                  <p className="text-slate-500">Phone</p>
                  <p className="font-semibold">{tenant.contact || "-"}</p>
                </div>

                <div>
                  <p className="text-slate-500">Email</p>
                  <p className="font-semibold">{tenant.email || "-"}</p>
                </div>
              </div>
            </div>
          )}

          {/* ROOM */}
          {activeTab === "room" && (
            <div className="bg-white border rounded-2xl p-5 space-y-4">
              <h2 className="font-semibold">Room Info</h2>

              {tenant.room ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p>Room: {tenant.room.roomNumber}</p>
                  <p>Capacity: {tenant.room.capacity}</p>
                </div>
              ) : (
                <p className="text-slate-500">No room assigned</p>
              )}
            </div>
          )}

          {/* FEES */}
          {activeTab === "fees" && (
            <div className="bg-white border rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3 text-left">Slip</th>
                    <th className="p-3 text-left">Month</th>
                    <th className="p-3 text-left">Amount</th>
                    <th className="p-3 text-left">Paid</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {tenant.fees?.map((f: any) => (
                    <tr key={f.id} className="border-t">
                      <td className="p-3">{f.slipNo}</td>
                      <td className="p-3">
                        {f.month} {f.year}
                      </td>
                      <td className="p-3">{f.amount}</td>
                      <td className="p-3 text-green-600">
                        {f.paidAmount}
                      </td>
                      <td className="p-3">{f.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* LEDGER */}
          {activeTab === "ledger" && (
            <div className="bg-white border rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Slip</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Method</th>
                  </tr>
                </thead>

                <tbody>
                  {ledger.map((l: any) => (
                    <tr key={l.id} className="border-t">
                      <td className="p-3">{formatDate(l.date)}</td>
                      <td className="p-3">{l.slipNo}</td>
                      <td className="p-3 text-green-600">
                        {l.amount}
                      </td>
                      <td className="p-3 uppercase">
                        {l.method}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}