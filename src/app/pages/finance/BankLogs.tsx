import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Download, Filter, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';

interface BankLog {
  id: string | number;
  type: 'credit' | 'debit';
  amount: number | string;
  description: string;
  createdAt: string;
}

export function BankLogs() {
  const { id } = useParams<{ id: string }>();
  const [bank, setBank] = useState<any>(null);
  const [logs, setLogs] = useState<BankLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(10);

  const fetchBankData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== 'All' && startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const { data } = await api.get(`/banks/${id}${queryString}`);
      
      setBank(data);
      setLogs(data.logs || []);
      setOpeningBalance(Number(data.openingBalance) || 0);
      setClosingBalance(Number(data.closingBalance) || 0);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch bank logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankData();
    setCurrentPage(1);
  }, [id, filterType, startDate, endDate]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    setFilterType(type);

    const now = new Date();
    let start = '';
    let end = new Date().toISOString().split('T')[0];

    if (type === 'Today') {
      start = end;
    } else if (type === 'Yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      start = yesterday.toISOString().split('T')[0];
      end = start;
    } else if (type === 'This Week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(now.setDate(diff));
      start = weekStart.toISOString().split('T')[0];
    } else if (type === 'This Month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      start = monthStart.toISOString().split('T')[0];
    } else if (type === 'All') {
      start = '';
      end = '';
    }

    if (type !== 'Custom') {
      setStartDate(start);
      setEndDate(end);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleExport = () => {
    if (logs.length === 0) {
      toast.warning('No data to export');
      return;
    }

    const headers = ['Date', 'Type', 'Amount', 'Description'];
    const rows = logs.map(log => [
      formatDate(log.createdAt),
      log.type.toUpperCase(),
      log.amount,
      `"${(log.description || '').replace(/"/g, '""')}"`
    ]);

    // Add empty row then summary
    rows.push(['', '', '', '']);
    rows.push(['Opening Balance', '', openingBalance, '']);
    rows.push(['Closing Balance', '', closingBalance, '']);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${bank?.bankName || 'Bank'}_Logs_${filterType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(logs.length / logsPerPage);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link to="/finance/banks" className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-gray-500">
            <ArrowLeft size={20} />
          </Link>
          <div className="w-12 h-12 bg-gradient-to-br from-[#1D4ED8] to-[#1e3a8a] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">{bank ? `${bank.bankName} - ${bank.accountTitle}` : 'Bank Logs'}</h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">Transaction History</p>
          </div>
        </div>
        <button onClick={handleExport} className="bg-white border border-gray-300 text-gray-700 font-bold px-4 py-2 rounded-lg hover:bg-gray-50 shadow-sm flex items-center justify-center gap-2 transition-colors">
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-gray-700 font-semibold">
          <Filter size={18} className="text-blue-600" />
          <span>Date Filters:</span>
        </div>
        <select 
          value={filterType} 
          onChange={handleFilterChange}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="All">Show All Time</option>
          <option value="Today">Today</option>
          <option value="Yesterday">Yesterday</option>
          <option value="This Week">This Week</option>
          <option value="This Month">This Month</option>
          <option value="Custom">Custom Range</option>
        </select>

        {filterType === 'Custom' && (
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <span className="text-gray-400">to</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              min={startDate}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-gray-300 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Opening Balance</p>
              <h3 className="text-2xl font-black text-gray-900">PKR {openingBalance.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
              <ArrowUpRight size={20} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-xl border border-blue-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-blue-600/80 uppercase tracking-widest mb-1">Closing Balance</p>
              <h3 className="text-2xl font-black text-blue-900">PKR {closingBalance.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-200/50 flex items-center justify-center text-blue-700">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0F172A] to-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Total Balance</p>
              <h3 className="text-2xl font-black text-white">PKR {Number(bank?.currentBalance || 0).toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
              <DollarSign size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500 font-medium">Loading transactions...</td></tr>
              ) : currentLogs.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500 font-medium border-2 border-dashed border-gray-100 m-4 rounded-xl inline-block w-[calc(100%-2rem)]">No transaction history found for selected criteria.</td></tr>
              ) : (
                currentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        log.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {log.type === 'credit' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {log.type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold whitespace-nowrap ${
                      log.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {log.type === 'credit' ? '+' : '-'} PKR {Number(log.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">{log.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-900">{indexOfFirstLog + 1}</span> to <span className="font-medium text-gray-900">{Math.min(indexOfLastLog, logs.length)}</span> of <span className="font-medium text-gray-900">{logs.length}</span> results
            </span>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-colors ${
                    currentPage === i + 1 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
