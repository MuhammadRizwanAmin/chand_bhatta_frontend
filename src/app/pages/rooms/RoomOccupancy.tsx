import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { DateRangeFilter, DateRange } from '../../components/DateRangeFilter';
import api from '../../services/api';
import { BarChart3, DoorClosed, Loader2, RefreshCcw, LogIn, LogOut, CalendarClock, XCircle, BedDouble, FileText, Download, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getCurrency } from '../../utils/currency';

export function RoomOccupancy() {
  const [searchParams] = useSearchParams();
  const initialRoomNo = searchParams.get('roomNo') || '';

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [roomNo, setRoomNo] = useState(initialRoomNo);

  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dlLoading, setDlLoading] = useState(false);
  const [allRooms, setAllRooms] = useState<any[]>([]);

  const formatDate = (v: any) => {
    if (!v) return '-';
    const d = new Date(v);
    if (isNaN(d.getTime())) return '-';
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toLowerCase();
    const year = d.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    api.get('/assignRoom/assigned-rooms-with-type')
      .then(res => {
        const sortedRooms = (res.data?.data || []).sort((a: any, b: any) => (a.roomNo || '').localeCompare(b.roomNo || '', undefined, { numeric: true }));
        setAllRooms(sortedRooms);
      })
      .catch(() => {});
  }, []);

  const fetchOccupancyData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/report/live/room_occupancy', {
        params: { startDate: dateRange.startDate, endDate: dateRange.endDate, roomNo: roomNo || undefined }
      });
      setData(res.data.data || []);
      setSummary(res.data.summary || null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch occupancy data');
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    setDlLoading(true);
    try {
      const res = await api.post('/report/generate', { 
        reportType: 'Room Occupancy Report', 
        startDate: dateRange.startDate, 
        endDate: dateRange.endDate, 
        roomNo: roomNo || undefined 
      });
      if (res.data.fileUrl) window.open(res.data.fileUrl, '_blank');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Download failed.');
    } finally { setDlLoading(false); }
  };

  const downloadPdf = () => {
    if (!data.length) return;
    const doc = new jsPDF();
    doc.text(`Room Occupancy Report`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, 14, 22);

    autoTable(doc, {
      html: '#room-occupancy-table',
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [17, 24, 39] }
    });

    doc.save(`Room_Occupancy_${dateRange.startDate}_${dateRange.endDate}.pdf`);
  };

  useEffect(() => {
    fetchOccupancyData();
  }, [dateRange, roomNo]);

  const statusCounts = {
    checkedIn:   data.filter(r => r.status === 'checked_in').length,
    reserved:    data.filter(r => r.status === 'reserved').length,
    checkedOut:  data.filter(r => r.status === 'checked_out').length,
    overdue:     data.filter(r => r.status === 'overdue').length,
    cancelled:   data.filter(r => r.status === 'cancelled').length,
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      checked_in:  'bg-emerald-100 text-emerald-700',
      reserved:    'bg-blue-100 text-blue-700',
      checked_out: 'bg-slate-100 text-slate-600',
      overdue:     'bg-red-100 text-red-700',
      cancelled:   'bg-rose-100 text-rose-600',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-8 space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
            <BarChart3 className="text-blue-600" />
            Room Occupancy Report
          </h1>
          <p className="text-sm font-medium text-slate-500">
            View room occupancy and status over a specific period.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={roomNo}
            onChange={(e) => {
              setRoomNo(e.target.value);
            }}
            className="w-32 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Rooms</option>
            {allRooms.map((r, idx) => (
              <option key={idx} value={r.roomNo}>{r.roomNo}</option>
            ))}
          </select>
          <DateRangeFilter onChange={setDateRange} defaultLabel="Select Range" darkMode={false} />
          <button 
            onClick={fetchOccupancyData}
            disabled={loading}
            className="flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-xl border border-slate-200 bg-emerald-50 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <LogIn className="text-emerald-600" size={18} />
              </div>
              <div>
                <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Checked In</div>
                <div className="text-3xl font-extrabold text-emerald-900">{statusCounts.checkedIn}</div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-blue-50 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <BedDouble className="text-blue-600" size={18} />
              </div>
              <div>
                <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Reserved</div>
                <div className="text-3xl font-extrabold text-blue-900">{statusCounts.reserved}</div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-100 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                <LogOut className="text-slate-500" size={18} />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Checked Out</div>
                <div className="text-3xl font-extrabold text-slate-700">{statusCounts.checkedOut}</div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-red-50 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <CalendarClock className="text-red-600" size={18} />
              </div>
              <div>
                <div className="text-xs font-semibold text-red-700 uppercase tracking-wide">Overdue</div>
                <div className="text-3xl font-extrabold text-red-900">{statusCounts.overdue}</div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-rose-50 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <XCircle className="text-rose-500" size={18} />
              </div>
              <div>
                <div className="text-xs font-semibold text-rose-600 uppercase tracking-wide">Cancelled</div>
                <div className="text-3xl font-extrabold text-rose-800">{statusCounts.cancelled}</div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-indigo-50 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="text-indigo-600" size={18} />
              </div>
              <div>
                <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Revenue</div>
                <div className="text-xl font-extrabold text-indigo-900 mt-1">{getCurrency()} {Number(summary?.totalRevenue || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-slate-800">Occupancy Details</h2>
                <span className="text-xs font-semibold px-2 py-1 bg-slate-200 text-slate-700 rounded-full">
                  {data.length} Records
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 text-sm font-medium transition-colors">
                  Print
                </button>
                <button onClick={downloadPdf} className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 text-sm font-medium transition-colors">
                  <FileText size={15} /> PDF
                </button>
                <button onClick={downloadExcel} disabled={dlLoading} className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors disabled:opacity-60">
                  {dlLoading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Excel
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table id="room-occupancy-table" className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Room No</th>
                    <th className="px-5 py-3">Floor</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Guest Name</th>
                    <th className="px-5 py-3">Check In</th>
                    <th className="px-5 py-3">Check Out</th>
                    <th className="px-5 py-3">Daily Rent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                        <DoorClosed className="mx-auto mb-2 opacity-50" size={32} />
                        No occupancy data found for this period.
                      </td>
                    </tr>
                  ) : (
                    data.map((row, idx) => (
                      <tr key={idx} className={`transition-colors ${roomNo && row.roomNo === roomNo ? 'bg-blue-100 hover:bg-blue-200' : 'hover:bg-slate-50/50'}`}>
                        <td className="px-5 py-3 font-semibold text-slate-800">{row.roomNo}</td>
                        <td className="px-5 py-3 text-slate-600">{row.floor}</td>
                        <td className="px-5 py-3 text-slate-600">{row.category}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadge(row.status)}`}>
                            {row.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-800">{row.guestName || row.guest}</td>
                        <td className="px-5 py-3 text-slate-600">{formatDate(row.checkIn)}</td>
                        <td className="px-5 py-3 text-slate-600">{formatDate(row.checkOut)}</td>
                        <td className="px-5 py-3 text-slate-600">{getCurrency()} {Number(row.dailyRent || 0).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
