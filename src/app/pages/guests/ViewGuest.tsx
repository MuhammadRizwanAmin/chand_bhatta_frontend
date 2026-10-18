import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Calendar, DollarSign, Mail, Phone, MapPin } from 'lucide-react';
import { customerService } from '../../services/customerService';
import { DateRangeFilter, DateRange } from '../../components/DateRangeFilter';

export default function ViewGuest() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [guest, setGuest] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'reservations' | 'sales'>('reservations');
  const [resDateRange, setResDateRange] = useState<DateRange>({ startDate: '', endDate: '' });
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    if (id) {
      fetchGuest();
    }
  }, [id]);

  const fetchGuest = async () => {
    setLoading(true);
    try {
      const response = await customerService.getById(id as string);
      setGuest(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading guest details...</div>;
  }

  if (!guest) {
    return <div className="p-8 text-center text-red-500">Guest not found.</div>;
  }

  const filteredReservations = guest.reservations?.filter((res: any) => {
    // Status Filter
    if (statusFilter !== 'All' && res.status !== statusFilter) return false;

    // Date Range Filter
    if (!resDateRange.startDate && !resDateRange.endDate) return true;
    const checkIn = new Date(res.startDate);
    const checkOut = new Date(res.endDate);
    const filterStart = resDateRange.startDate ? new Date(resDateRange.startDate) : null;
    const filterEnd = resDateRange.endDate ? new Date(resDateRange.endDate) : null;
    if (filterStart && filterEnd) {
      return checkIn <= filterEnd && checkOut >= filterStart;
    }
    if (filterStart) return checkOut >= filterStart;
    if (filterEnd) return checkIn <= filterEnd;
    return true;
  }) || [];

  const filteredSales = guest.sales?.filter((sale: any) => sale.paymentMethod !== 'BTR') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>

        <h1 className="text-3xl font-bold text-[#0F172A]">Guest Details</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-8">
        {/* Guest Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Guest ID</p>
            <p
              className="font-medium text-[#1D4ED8] cursor-pointer hover:underline"
              onClick={() => navigate(`/guests/${guest.id}`)}
            >
              {guest.id}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium text-gray-900">{guest.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">CNIC</p>
            <p className="font-medium text-gray-900">{guest.cnic || 'N/A'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-gray-400" />
              <p className="font-medium text-gray-900">{guest.phone || 'N/A'}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">Email</p>
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-gray-400" />
              <p className="font-medium text-gray-900">{guest.email || 'N/A'}</p>
            </div>
          </div>

          {guest.address && (
            <div className="col-span-2 md:col-span-4 mt-4">
              <p className="text-sm text-gray-500">Address</p>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-gray-400" />
                <p className="font-medium text-gray-900">{guest.address}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('reservations')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'reservations'
                  ? 'border-[#1D4ED8] text-[#1D4ED8]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar size={18} />
              Reservations
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                {guest.reservations?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('sales')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'sales'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <DollarSign size={18} />
              Sales & Invoices
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                {filteredSales.length}
              </span>
            </button>
          </div>
        </div>

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
              <h3 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
                <Calendar size={20} className="text-[#1D4ED8]" />
                Reservations
              </h3>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                  <span className="text-sm text-gray-500 font-medium">Count:</span>
                  <span className="text-sm font-bold text-[#1D4ED8]">{filteredReservations.length}</span>
                </div>
                <div className="w-40">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">All Statuses</option>
                    <option value="reserved">Reserved</option>
                    <option value="checked_in">Checked In</option>
                    <option value="checked_out">Checked Out</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="w-60">
                  <DateRangeFilter onChange={setResDateRange} defaultLabel="Filter Dates" />
                </div>
              </div>
            </div>

            {filteredReservations.length > 0 ? (
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="px-4 py-3">Booking ID</th>
                      <th className="px-4 py-3">Check-In</th>
                      <th className="px-4 py-3">Check-Out</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Total Amount</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {filteredReservations.map((res: any) => (
                      <tr 
                        key={res.id} 
                        onClick={() => navigate(`/booking/${res.id}`)}
                        className="cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-[#1D4ED8]">
                          {res.refno || res.id}
                        </td>
                        <td className="px-4 py-3">
                          <div>{res.startDate}</div>
                          {res.startTime && <div className="text-xs text-gray-500">{(() => {
                            const [h, m] = res.startTime.split(':');
                            const hour = parseInt(h, 10);
                            return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
                          })()}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <div>{res.endDate}</div>
                          {res.endTime && <div className="text-xs text-gray-500">{(() => {
                            const [h, m] = res.endTime.split(':');
                            const hour = parseInt(h, 10);
                            return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
                          })()}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-gray-200 rounded text-xs">
                            {res.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>PKR {Number(res.totalAmount || 0).toLocaleString()}</div>
                          {Boolean(res.refundedAmount && Number(res.refundedAmount) > 0) && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded mt-0.5">
                              Refund: PKR {Number(res.refundedAmount).toLocaleString()}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No reservations found in the selected date range.</p>
            )}
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div>
            <h3 className="text-xl font-bold text-[#0F172A] mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-green-600" />
              Sales & Invoices
            </h3>

            {filteredSales.length > 0 ? (
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="px-4 py-3">Sale ID</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Payment Method</th>
                      <th className="px-4 py-3">Total Amount</th>
                      <th className="px-4 py-3">Items</th>
                    </tr>
                  </thead>

                <tbody className="divide-y divide-gray-200">
  {filteredSales.map((sale: any) => {
    const paymentMethod = sale.paymentMethod || 'N/A';

    return (
      <tr key={sale.id}>
        <td className="px-4 py-3 font-medium">{sale.prefix}</td>

        <td className="px-4 py-3">
          {sale.createdAt
            ? new Date(sale.createdAt).toLocaleDateString()
            : 'N/A'}
        </td>

        <td className="px-4 py-3">
          <span className="px-2 py-1 bg-gray-200 rounded text-xs">
            {sale.paymentStatus}
          </span>
        </td>

        <td className="px-4 py-3">{paymentMethod}</td>

        <td className="px-4 py-3">
          PKR {Number(sale.totalAmount || 0).toLocaleString()}
        </td>

        <td className="px-4 py-3">
          {sale.items?.length || 0} items
        </td>
      </tr>
    );
  })}
</tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No sales found for this guest.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}