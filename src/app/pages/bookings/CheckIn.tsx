import { useState, useEffect } from 'react';
import { Search, Home, Clock, CheckCircle, Phone, AlertCircle, Eye } from 'lucide-react';
import { DataTable, Column } from '../../components/DataTable';
import { reservationService } from '../../services/reservationService';
import { useNavigate } from 'react-router';
import { BookingActionMenu } from './BookingActionMenu';
import { DateRangeFilter, DateRange } from '../../components/DateRangeFilter';
import { exportToCSV } from '../../utils/exportUtils';
import { Download } from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  checked_in: { label: 'Checked In', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={12} /> },
  expected: { label: 'Expected', color: 'bg-blue-100 text-blue-700', icon: <Clock size={12} /> },
  early: { label: 'Early Arrival', color: 'bg-yellow-100 text-yellow-700', icon: <AlertCircle size={12} /> },
  'walk-in': { label: 'Walk-in', color: 'bg-purple-100 text-purple-700', icon: <Home size={12} /> },
};

export function CheckIn() {
  const [searchTerm, setSearchTerm] = useState('');
  const [arrivals, setArrivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateRange>({ startDate: '', endDate: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchArrivals(dateFilter);
  }, [dateFilter]);

  const fetchArrivals = async (range: DateRange) => {
    try {
      setLoading(true);
      const res = await reservationService.getAll({ 
        status: 'checked_in',
        startDate: range.startDate || undefined,
        endDate: range.endDate || undefined
      });
      setArrivals(res.data || []);
    } catch (error) {
      console.error('Failed to fetch arrivals', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Booking ID',
      accessorKey: 'id',
      sortable: true,
      cell: (arrival) => <span className="text-sm font-medium text-[#1D4ED8]">{arrival.refno || arrival.id}</span>
    },
    {
      header: 'Guest',
      accessorKey: 'customer.name',
      sortable: true,
      cell: (arrival) => (
        <div>
          <div className="font-medium text-sm text-gray-900">{arrival.customer?.name || '—'}</div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
            <Phone size={10} />
            {arrival.customer?.phone || '—'}
          </div>
        </div>
      )
    },
    {
      header: 'Room',
      accessorKey: 'rooms',
      sortable: false,
      cell: (arrival) => {
        const room = arrival.rooms?.[0];
        return (
          <>
            <div className="font-medium text-sm text-gray-900">Room {room?.roomNo || '—'}</div>
            <div className="text-xs text-gray-500">{room?.RoomType?.name || '—'}</div>
          </>
        );
      }
    },
    {
      header: 'Stay',
      accessorKey: 'startDate',
      sortable: true,
      cell: (arrival) => {
        const d1 = new Date(arrival.startDate);
        const d2 = new Date(arrival.endDate);
        const nights = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / 86400000));
        return (
          <>
            <div className="text-sm text-gray-900">{new Date(arrival.startDate).toLocaleDateString()} → {new Date(arrival.endDate).toLocaleDateString()}</div>
            <div className="text-xs text-gray-500">{nights} night(s)</div>
          </>
        );
      }
    },
    {
      header: 'Advance',
      accessorKey: 'advancePaid',
      sortable: true,
      cell: (arrival) => <span className="text-sm font-medium text-green-700">Rs {Number(arrival.advancePaid || 0).toLocaleString()}</span>
    },
    {
      header: 'Balance',
      accessorKey: 'balanceAmount',
      sortable: true,
      cell: (arrival) => <span className="text-sm font-medium text-red-700">Rs {Number(arrival.balanceAmount || 0).toLocaleString()}</span>
    },
    {
      header: 'Type',
      accessorKey: 'status',
      sortable: true,
      cell: (arrival) => {
        const cfg = statusConfig[arrival.status] || { label: arrival.status, color: 'bg-gray-100 text-gray-700', icon: <CheckCircle size={12} /> };
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      cell: (arrival) => <BookingActionMenu booking={arrival} />
    }
  ];

  const handleExport = () => {
    const exportColumns = columns
      .filter(c => c.header !== 'Actions')
      .map(c => ({
        header: c.header,
        accessorKey: c.accessorKey || ((row: any) => {
          if (c.header === 'Stay') return `${new Date(row.startDate).toLocaleDateString()} - ${new Date(row.endDate).toLocaleDateString()}`;
          if (c.header === 'Room') return `Room ${row.rooms?.[0]?.roomNo || ''}`;
          if (c.header === 'Type') return statusConfig[row.status]?.label || row.status;
          return '';
        })
      }));

    exportToCSV(arrivals, `checkins_${new Date().toISOString().split('T')[0]}.csv`, exportColumns);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Check-In</h1>
          <p className="text-gray-600 mt-1">Today's expected arrivals and walk-ins</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg px-4 py-2 shadow-sm text-sm text-gray-600 border">
            <span className="font-semibold text-[#0F172A]">{arrivals.length}</span> checked in
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
          <div className="text-gray-500 text-sm">Checked In</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {arrivals.filter((a) => a.status === 'checked_in').length}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search guest, booking ID, or room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <DateRangeFilter onChange={setDateFilter} defaultLabel="Filter Dates" />
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] transition-colors"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Arrivals Table */}
      <DataTable
        title="Check-In List"
        columns={columns}
        data={arrivals}
        searchQuery={searchTerm}
        searchKeys={['customer.name', 'refno', 'id']}
        pageSize={10}
        loading={loading}
      />
    </div>
  );
}
