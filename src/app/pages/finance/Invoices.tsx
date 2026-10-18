import { useState } from 'react';
import { Search, Download, Eye, FileText, Printer } from 'lucide-react';
import { DataTable, Column } from '../../components/DataTable';

interface Invoice {
  id: string;
  bookingId: string;
  guestName: string;
  issuedDate: string;
  dueDate: string;
  amount: string;
  tax: string;
  total: string;
  status: 'paid' | 'unpaid' | 'overdue' | 'cancelled';
  type: 'reservation' | 'extra' | 'group';
}

const invoices: Invoice[] = [
  { id: 'INV001', bookingId: 'BK001', guestName: 'Rajesh Kumar', issuedDate: '2026-05-16', dueDate: '2026-05-16', amount: '₹8,500', tax: '₹1,530', total: '₹10,030', status: 'paid', type: 'reservation' },
  { id: 'INV002', bookingId: 'BK002', guestName: 'Priya Sharma', issuedDate: '2026-05-17', dueDate: '2026-05-20', amount: '₹15,000', tax: '₹2,700', total: '₹17,700', status: 'unpaid', type: 'reservation' },
  { id: 'INV003', bookingId: 'BK003', guestName: 'Amit Patel', issuedDate: '2026-05-15', dueDate: '2026-05-15', amount: '₹4,500', tax: '₹810', total: '₹5,310', status: 'paid', type: 'reservation' },
  { id: 'INV004', bookingId: 'GRP001', guestName: 'Ahmad Family Reunion', issuedDate: '2026-05-18', dueDate: '2026-05-21', amount: '₹85,000', tax: '₹15,300', total: '₹1,00,300', status: 'unpaid', type: 'group' },
  { id: 'INV005', bookingId: 'BK004', guestName: 'Sneha Gupta', issuedDate: '2026-05-14', dueDate: '2026-05-14', amount: '₹2,400', tax: '₹432', total: '₹2,832', status: 'overdue', type: 'extra' },
];

const statusColors = {
  paid: 'bg-green-100 text-green-700',
  unpaid: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

const typeColors = {
  reservation: 'bg-blue-50 text-blue-700',
  extra: 'bg-orange-50 text-orange-700',
  group: 'bg-purple-50 text-purple-700',
};

export function Invoices() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredData = invoices.filter((inv) => statusFilter === 'all' || inv.status === statusFilter);

  const columns: Column<Invoice>[] = [
    {
      header: 'Invoice #',
      accessorKey: 'id',
      sortable: true,
      cell: (inv) => <span className="text-sm font-medium text-[#1D4ED8]">{inv.id}</span>
    },
    {
      header: 'Booking',
      accessorKey: 'bookingId',
      sortable: true,
      cell: (inv) => <span className="text-sm text-gray-700">{inv.bookingId}</span>
    },
    {
      header: 'Guest / Group',
      accessorKey: 'guestName',
      sortable: true,
      cell: (inv) => <span className="text-sm font-medium text-gray-900">{inv.guestName}</span>
    },
    {
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: (inv) => <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${typeColors[inv.type]}`}>{inv.type}</span>
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      sortable: true,
      cell: (inv) => <span className="text-sm text-gray-900">{inv.amount}</span>
    },
    {
      header: 'Tax (18%)',
      accessorKey: 'tax',
      sortable: true,
      cell: (inv) => <span className="text-sm text-gray-600">{inv.tax}</span>
    },
    {
      header: 'Total',
      accessorKey: 'total',
      sortable: true,
      cell: (inv) => <span className="text-sm font-bold text-gray-900">{inv.total}</span>
    },
    {
      header: 'Issued',
      accessorKey: 'issuedDate',
      sortable: true,
      cell: (inv) => <span className="text-sm text-gray-600">{inv.issuedDate}</span>
    },
    {
      header: 'Due',
      accessorKey: 'dueDate',
      sortable: true,
      cell: (inv) => <span className="text-sm text-gray-600">{inv.dueDate}</span>
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (inv) => <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[inv.status]}`}>{inv.status}</span>
    },
    {
      header: 'Actions',
      cell: () => (
        <div className="flex gap-1">
          <button className="p-2 text-gray-500 hover:text-[#1D4ED8] hover:bg-blue-50 rounded-lg transition-colors"><Eye size={15} /></button>
          <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"><Printer size={15} /></button>
          <button className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"><Download size={15} /></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Invoices</h1>
          <p className="text-gray-600 mt-1">View and manage all billing records</p>
        </div>
        <button className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
          <Download size={18} />Export All
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoices', value: invoices.length, color: 'border-[#1D4ED8]', text: 'text-[#1D4ED8]' },
          { label: 'Paid', value: invoices.filter(i => i.status === 'paid').length, color: 'border-green-500', text: 'text-green-600' },
          { label: 'Unpaid', value: invoices.filter(i => i.status === 'unpaid').length, color: 'border-yellow-500', text: 'text-yellow-600' },
          { label: 'Overdue', value: invoices.filter(i => i.status === 'overdue').length, color: 'border-red-500', text: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${s.color}`}>
            <div className="text-gray-500 text-sm">{s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.text}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search invoice or guest..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        searchQuery={search}
        searchKeys={['guestName', 'id', 'bookingId']}
        pageSize={10}
      />
    </div>
  );
}
