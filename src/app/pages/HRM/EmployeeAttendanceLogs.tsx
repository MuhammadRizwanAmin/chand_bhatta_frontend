import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { ChevronLeft, Calendar, Clock, Download } from 'lucide-react';
import { hrmService } from '@/app/services/hrmService';
import { staffService } from '@/app/services/staffService';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

const STATUS_STYLES: Record<string, string> = {
  Present: 'bg-green-100 text-green-700 border-green-200',
  Absent: 'bg-red-100 text-red-700 border-red-200',
  'Half-day': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Leave: 'bg-blue-100 text-blue-700 border-blue-200',
};

export function EmployeeAttendanceLogs() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [staff, setStaff] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Date filters
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffRes, attendanceRes] = await Promise.all([
        staffService.getStaffDetails(id!),
        hrmService.getAttendances() // Fetch all and filter, or backend might handle it
      ]);
      setStaff(staffRes.user);
      
      const filtered = (attendanceRes.data || []).filter((a: any) => String(a.userId) === String(id));
      setAttendances(filtered);
    } catch (err: any) {
      toast.error('Failed to load attendance logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = attendances.filter(a => {
    const d = a.date;
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const exportToExcel = () => {
    const data = filteredLogs.map(log => ({
      Date: log.date,
      Status: log.status,
      'Check In': log.checkIn || '—',
      'Check Out': log.checkOut || '—',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Logs');
    XLSX.writeFile(workbook, `${staff?.fullName}_Attendance_Logs.xlsx`);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading logs...</div>;
  }

  if (!staff) {
    return <div className="p-8 text-center text-red-500">Employee not found.</div>;
  }

  const totalPresent = filteredLogs.filter(l => l.status === 'Present').length;
  const totalAbsent = filteredLogs.filter(l => l.status === 'Absent').length;
  const totalLeaves = filteredLogs.filter(l => l.status === 'Leave').length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{staff.fullName}'s Attendance Logs</h1>
            <p className="text-sm text-gray-500 capitalize">{staff.role}</p>
          </div>
        </div>
        <Button variant="outline" onClick={exportToExcel} disabled={filteredLogs.length === 0}>
          <Download size={16} className="mr-2" /> Export
        </Button>
      </div>

      {/* Filters and Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" /> Filter by Date
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold">Summary (Selected Period)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="text-2xl font-bold text-green-700">{totalPresent}</div>
              <div className="text-xs font-medium text-green-600 uppercase mt-1">Present</div>
            </div>
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="text-2xl font-bold text-red-700">{totalAbsent}</div>
              <div className="text-xs font-medium text-red-600 uppercase mt-1">Absent</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="text-2xl font-bold text-blue-700">{totalLeaves}</div>
              <div className="text-xs font-medium text-blue-600 uppercase mt-1">Leaves</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card className="shadow-sm">
        <CardHeader className="bg-gray-50 border-b border-gray-100">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock size={16} /> Attendance Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white border-b text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Check In</th>
                <th className="px-6 py-3 font-medium">Check Out</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    No attendance records found for this period.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="border-b hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[log.status] || 'bg-gray-100 text-gray-700'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{log.checkIn || '—'}</td>
                    <td className="px-6 py-3 text-gray-600">{log.checkOut || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
