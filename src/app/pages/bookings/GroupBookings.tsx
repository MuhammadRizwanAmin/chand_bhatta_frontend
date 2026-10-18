import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, Users, Calendar, Eye, Building2, Plus, RefreshCw } from 'lucide-react';
import { reservationService } from '../../services/reservationService';
import { DataTable, Column } from '../../components/DataTable';
import { DateRangeFilter, DateRange } from '../../components/DateRangeFilter';

const statusColors: Record<string, string> = {
  reserved:    'bg-blue-100 text-blue-700',
  checked_in:  'bg-green-100 text-green-700',
  checked_out: 'bg-gray-100 text-gray-700',
  cancelled:   'bg-red-100 text-red-700',
  draft:       'bg-yellow-100 text-yellow-700',
};

const paymentStatusColors: Record<string, string> = {
  paid:    'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  partial: 'bg-orange-100 text-orange-700',
};

interface GroupBooking {
  id: string;
  dbId: number;
  refno: string;
  guestName: string;
  groupName: string;
  groupId: number;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  amount: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  paymentStatus: string;
}

export function GroupBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<GroupBooking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: '', endDate: '' });

  useEffect(() => {
    const h = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(h);
  }, [searchTerm]);

  useEffect(() => { setPage(1); }, [debouncedSearch, filterStatus, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        status: filterStatus === 'all' ? undefined : filterStatus,
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
        groupOnly: true,   // tell backend to filter only group reservations
      };
      const response = await reservationService.getAll(params);

      const mapped = (response.data || [])
        .filter((res: any) => res.groupId)   // double-filter on frontend for safety
        .map((res: any) => {
          const roomNumbers = res.rooms?.map((r: any) => r.roomNo).join(', ') || 'N/A';
          const roomTypes   = res.rooms?.map((r: any) => r.RoomType?.name).join(', ') || 'N/A';
          let paymentStat = 'pending';
          if (res.balanceAmount <= 0 && res.totalAmount > 0) paymentStat = 'paid';
          else if (res.advancePaid > 0) paymentStat = 'partial';

          return {
            id:            res.refno || String(res.id),
            dbId:          res.id,
            refno:         res.refno || `#${res.id}`,
            guestName:     res.customer?.name || 'Unknown',
            groupName:     res.group?.name || `Group #${res.groupId}`,
            groupId:       res.groupId,
            roomNumber:    roomNumbers,
            roomType:      roomTypes,
            checkIn:       res.startDate,
            checkOut:      res.endDate,
            guests:        res.numOfSeats || 1,
            amount:        `PKR ${Number((res.totalAmount || 0) - (res.waivedAmount || 0)).toLocaleString()}`,
            totalAmount:   Number((res.totalAmount || 0) - (res.waivedAmount || 0)),
            paidAmount:    Number(res.advancePaid || 0),
            dueAmount:     Number(res.balanceAmount || 0),
            status:        res.status || 'draft',
            paymentStatus: paymentStat,
          };
        });

      setBookings(mapped);
      setTotal(response.total || mapped.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, debouncedSearch, filterStatus, dateRange]);

  // ── Summary counts (computed from current page; totals reflect full dataset) ──
  const confirmedCount  = bookings.filter(b => b.status === 'reserved').length;
  const checkedInCount  = bookings.filter(b => b.status === 'checked_in').length;
  const checkedOutCount = bookings.filter(b => b.status === 'checked_out').length;

  // ── Unique groups on this page for group-level summary badge ──
  const uniqueGroups = [...new Map(bookings.map(b => [b.groupId, b.groupName])).entries()];

  const columns: Column<GroupBooking>[] = [
    {
      header: 'Ref No',
      accessorKey: 'id',
      sortable: true,
      cell: (b) => (
        <span
          className="text-sm font-semibold text-[#1D4ED8] cursor-pointer hover:underline"
          onClick={() => navigate(`/booking/${b.dbId}`)}
        >
          {b.id}
        </span>
      ),
    },
    {
      header: 'Company / Group',
      accessorKey: 'groupName',
      sortable: true,
      cell: (b) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Building2 size={13} className="text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">{b.groupName}</div>
            <div className="text-xs text-gray-400">ID #{b.groupId}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Guest',
      accessorKey: 'guestName',
      sortable: true,
      cell: (b) => <span className="text-sm text-gray-900">{b.guestName}</span>,
    },
    {
      header: 'Room',
      accessorKey: 'roomNumber',
      sortable: true,
      cell: (b) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          <span className="font-medium text-gray-900 text-sm">{b.roomNumber}</span>
        </div>
      ),
    },
    {
      header: 'Check-In',
      accessorKey: 'checkIn',
      sortable: true,
      cell: (b) => (
        <div className="flex flex-col">
          <span className="text-sm text-gray-700">{b.checkIn ? new Date(b.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</span>
          {b.checkIn && <span className="text-sm text-gray-500">{new Date(b.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>}
        </div>
      ),
    },
    {
      header: 'Check-Out',
      accessorKey: 'checkOut',
      sortable: true,
      cell: (b) => (
        <div className="flex flex-col">
          <span className="text-sm text-gray-700">{b.checkOut ? new Date(b.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</span>
          {b.checkOut && <span className="text-sm text-gray-500">{new Date(b.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>}
        </div>
      ),
    },
    {
      header: 'Total',
      accessorKey: 'totalAmount',
      sortable: true,
      cell: (b) => <span className="text-sm font-semibold text-gray-900">PKR {b.totalAmount.toLocaleString()}</span>,
    },
    {
      header: 'Paid',
      accessorKey: 'paidAmount',
      sortable: true,
      cell: (b) => <span className="text-sm text-emerald-600 font-medium">PKR {b.paidAmount.toLocaleString()}</span>,
    },
    {
      header: 'Due',
      accessorKey: 'dueAmount',
      sortable: true,
      cell: (b) => <span className="text-sm text-red-600 font-medium">PKR {b.dueAmount.toLocaleString()}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (b) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[b.status] || 'bg-gray-100 text-gray-600'}`}>
          {b.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
      ),
    },
    {
      header: 'Payment',
      accessorKey: 'paymentStatus',
      sortable: true,
      cell: (b) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${paymentStatusColors[b.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>
          {b.paymentStatus.charAt(0).toUpperCase() + b.paymentStatus.slice(1)}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (b: any) => (
        <button
          onClick={() => navigate(`/booking/${b.dbId}`)}
          className="p-1.5 text-gray-500 hover:text-[#1D4ED8] hover:bg-blue-50 rounded-lg transition-colors"
          title="View Reservation"
        >
          <Eye size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Group Bookings</h1>
          <p className="text-gray-500 mt-1">All reservations linked to a company or group</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={() => navigate('/booking/create')}
            className="flex items-center gap-2 bg-[#1D4ED8] text-white px-5 py-2.5 rounded-lg hover:bg-[#1E40AF] transition-colors text-sm font-semibold"
          >
            <Plus size={18} /> New Booking
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Reservations', value: bookings.length,  border: 'border-[#1D4ED8]', text: 'text-[#1D4ED8]' },
          { label: 'Total Amount',       value: `PKR ${bookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}`, border: 'border-blue-400', text: 'text-blue-600' },
          { label: 'Amount Paid',        value: `PKR ${bookings.reduce((sum, b) => sum + b.paidAmount, 0).toLocaleString()}`, border: 'border-emerald-500', text: 'text-emerald-600' },
          { label: 'Amount Due',         value: `PKR ${bookings.reduce((sum, b) => sum + b.dueAmount, 0).toLocaleString()}`, border: 'border-red-500', text: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${s.border}`}>
            <div className="text-gray-500 text-xs font-medium uppercase tracking-wide">{s.label}</div>
            <div className={`text-xl font-bold mt-1 ${s.text}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Active Groups on this page ── */}
      {uniqueGroups.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm px-5 py-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Groups shown on this page</div>
          <div className="flex flex-wrap gap-2">
            {uniqueGroups.map(([gid, gname]) => (
              <span
                key={gid}
                onClick={() => navigate(`/guests/companies/${gid}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold cursor-pointer hover:bg-blue-100 transition-colors"
              >
                <Building2 size={11} /> {gname}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search guest name, ref no, room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>
          <div className="w-full md:w-64 shrink-0">
            <DateRangeFilter onChange={setDateRange} defaultLabel="Filter by Check-in/out" />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
          >
            <option value="all">All Statuses</option>
            <option value="reserved">Reserved</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <DataTable
        columns={columns}
        data={bookings}
        pageSize={10}
        serverSide={true}
        totalItems={total}
        page={page}
        onPageChange={setPage}
        loading={loading}
      />
    </div>
  );
}
