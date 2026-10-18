import { useState, useEffect } from 'react';
import { Search, LogOut, DollarSign, Eye, FileText, AlertTriangle } from 'lucide-react';
import { DataTable, Column } from '../../components/DataTable';
import { reservationService } from '../../services/reservationService';
import { useNavigate } from 'react-router';
import { BookingActionMenu } from './BookingActionMenu';
import { DateRangeFilter, DateRange } from '../../components/DateRangeFilter';
import { exportToCSV } from '../../utils/exportUtils';
import { Download } from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string }> = {
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700' },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700' },
  checked_out: { label: 'Checked Out', color: 'bg-gray-100 text-gray-700' },
};

export function CheckOut() {
  const [searchTerm, setSearchTerm] = useState('');
  const [departures, setDepartures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateRange>({ startDate: '', endDate: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartures(dateFilter);
  }, [dateFilter]);

  const fetchDepartures = async (range: DateRange) => {
    try {
      setLoading(true);
      const res = await reservationService.getAll({ 
        status: 'checked_out',
        startDate: range.startDate || undefined,
        endDate: range.endDate || undefined
      });
      setDepartures(res.data || []);
    } catch (error) {
      console.error('Failed to fetch departures', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<any>[] = [
    { header: 'Booking', accessorKey: 'id', sortable: true, cell: (dep) => (
      <button
        type="button"
        onClick={() => navigate(`/booking/${dep.id}`)}
        className="cursor-pointer text-sm font-semibold text-[#1D4ED8] hover:text-[#1E40AF] hover:underline transition-colors"
      >
        {dep.refno || dep.id}
      </button>
    )},
    { header: 'Guest', accessorKey: 'customer.name', sortable: true, cell: (dep) => <span className="text-sm font-medium text-gray-900">{dep.customer?.name || '—'}</span> },
    { header: 'Room', accessorKey: 'rooms', sortable: false, cell: (dep) => {
      const rooms = dep.rooms || [];
      return (
        <div className="flex flex-wrap gap-x-2 gap-y-1 max-w-[200px]">
          {rooms.length > 0 ? rooms.map((room: any, i: number) => (
            <span key={i} className="font-medium text-sm text-gray-900">
              Room {room?.roomNo || '—'}{i < rooms.length - 1 ? ',' : ''}
            </span>
          )) : (
            <span className="font-medium text-sm text-gray-900">—</span>
          )}
        </div>
      )
    }},
    { header: 'Check-In', accessorKey: 'startDate', sortable: true, cell: (dep) => (
      <div className="flex flex-col">
        <span className="text-sm text-gray-900">{new Date(dep.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        {dep.startTime && (
          <span className="text-xs text-gray-500">
            {(() => {
              const [h, m] = dep.startTime.split(':');
              const hour = parseInt(h, 10);
              const ampm = hour >= 12 ? 'PM' : 'AM';
              return `${hour % 12 || 12}:${m} ${ampm}`;
            })()}
          </span>
        )}
      </div>
    )},
    { header: 'Check-Out', accessorKey: 'endDate', sortable: true, cell: (dep) => (
      <div className="flex flex-col">
        <span className="text-sm text-gray-900">{new Date(dep.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        {dep.endTime && (
          <span className="text-xs text-gray-500">
            {(() => {
              const [h, m] = dep.endTime.split(':');
              const hour = parseInt(h, 10);
              const ampm = hour >= 12 ? 'PM' : 'AM';
              return `${hour % 12 || 12}:${m} ${ampm}`;
            })()}
          </span>
        )}
      </div>
    )},
    { header: 'Nights', sortable: false, cell: (dep) => {
      const d1 = new Date(dep.startDate);
      const d2 = new Date(dep.endDate);
      const nights = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / 86400000));
      return <span className="text-sm text-gray-900">{nights}</span>;
    }},
    { header: 'Total Bill', accessorKey: 'totalAmount', sortable: true, cell: (dep) => <span className="text-sm font-semibold text-gray-900">Rs {Number((dep.totalAmount || 0) - (dep.waivedAmount || 0)).toLocaleString()}</span> },
    { header: 'Advance', accessorKey: 'advancePaid', sortable: true, cell: (dep) => <span className="text-sm text-green-700">Rs {Number(dep.advancePaid || 0).toLocaleString()}</span> },
    { header: 'Balance', accessorKey: 'balanceAmount', sortable: true, cell: (dep) => {
      const balance = Number(dep.balanceAmount || 0);
      return <span className={`text-sm font-bold ${balance <= 0 ? 'text-green-700' : 'text-red-700'}`}>Rs {balance.toLocaleString()}</span>;
    }},
    { header: 'Status', accessorKey: 'status', sortable: true, cell: (dep) => {
      const cfg = statusConfig[dep.status] || { label: dep.status, color: 'bg-gray-100 text-gray-700' };
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
          {cfg.label}
        </span>
      );
    }},
    { header: 'Actions', cell: (dep) => <BookingActionMenu booking={dep} onSuccess={() => fetchDepartures(dateFilter)} /> }
  ];

  const handleExport = () => {
    const exportColumns = columns
      .filter(c => c.header !== 'Actions')
      .map(c => ({
        header: c.header,
        accessorKey: c.accessorKey || ((row: any) => {
          if (c.header === 'Stay') return `${new Date(row.startDate).toLocaleDateString()} - ${new Date(row.endDate).toLocaleDateString()}`;
          if (c.header === 'Room') return `Room ${row.rooms?.[0]?.roomNo || ''}`;
          if (c.header === 'Status') return statusConfig[row.status]?.label || row.status;
          return '';
        })
      }));

    exportToCSV(departures, `checkouts_${new Date().toISOString().split('T')[0]}.csv`, exportColumns);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Check-Out</h1>
          <p className="text-gray-600 mt-1">Process guest departures and final settlements</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#1D4ED8]">
          <div className="text-gray-500 text-sm">Checked Out</div>
          <div className="text-2xl font-bold text-[#1D4ED8] mt-1">{departures.length}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Search guest, booking ID, or room..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
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

      <DataTable
        title="Check-Out List"
        columns={columns}
        data={departures}
        searchQuery={searchTerm}
        searchKeys={['customer.name', 'refno', 'id']}
        pageSize={10}
        loading={loading}
      />
    </div>
  );
}
