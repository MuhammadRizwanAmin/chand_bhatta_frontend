import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { hrmService } from '@/app/services/hrmService';
import { staffService } from '@/app/services/staffService';
import { toast } from 'sonner';
import { LogIn, LogOut, Search, Download, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import Select from 'react-select';



// ─── Check Out Modal ────────────────────────────────────────────────────────
function CheckOutModal({ attendance, onClose, onSaved }: {
  attendance: any, onClose: () => void, onSaved: () => void
}) {
  // min time = checkIn time (can't check out before checking in)
  const checkInTime = attendance.checkIn ? attendance.checkIn.substring(0, 5) : '';
  const [checkOut, setCheckOut] = useState('');

  const handleSave = async () => {
    if (!checkOut) return toast.error('Please enter check-out time');
    if (checkInTime && checkOut <= checkInTime) {
      return toast.error('Check-out time must be after check-in time');
    }
    try {
      const res = await hrmService.markAttendance({
        userId: attendance.userId,
        date: attendance.date,
        checkIn: attendance.checkIn,
        checkOut,
        status: attendance.status
      });
      if (res.success) {
        toast.success('Check-out saved!');
        onSaved();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save check-out');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Check Out</h2>
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">{attendance.user?.fullName}</span> — {attendance.date}
        </p>
        <p className="text-sm text-gray-400">
          Checked in at: <span className="font-medium text-gray-700">{checkInTime || '—'}</span>
        </p>
        <div>
          <label className="block text-sm font-medium mb-1">Check-Out Time</label>
          <Input
            type="time"
            value={checkOut}
            min={checkInTime}
            onChange={(e) => setCheckOut(e.target.value)}
          />
          {checkInTime && (
            <p className="text-xs text-gray-400 mt-1">Must be after {checkInTime}</p>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}><LogOut size={14} className="mr-1" /> Save Check-Out</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Attendance Modal ─────────────────────────────────────────────────
function EditAttendanceModal({ target, onClose, onSaved }: {
  target: { userId: number, date: string, record: any | null, employeeName: string },
  onClose: () => void,
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    checkIn:  target.record?.checkIn?.substring(0, 5)  || '',
    checkOut: target.record?.checkOut?.substring(0, 5) || '',
    status:   target.record?.status || 'Present',
  });

  const handleSave = async () => {
    if (!form.checkIn && form.status === 'Present') return toast.error('Check-in time is required for Present status');
    if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) {
      return toast.error('Check-out must be after check-in time');
    }
    try {
      const res = await hrmService.markAttendance({
        userId: target.userId,
        date:   target.date,
        checkIn:  form.checkIn  || null,
        checkOut: form.checkOut || null,
        status:   form.status,
      });
      if (res.success) {
        toast.success('Attendance updated!');
        onSaved();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update attendance');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Edit Attendance</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            <span className="font-medium text-gray-700">{target.employeeName}</span>
            {' · '}{target.date}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Check-In Time</label>
            <Input type="time" value={form.checkIn}
              onChange={(e) => setForm({ ...form, checkIn: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Check-Out Time</label>
            <Input type="time" value={form.checkOut}
              min={form.checkIn || undefined}
              onChange={(e) => setForm({ ...form, checkOut: e.target.value })} />
            {form.checkIn && (
              <p className="text-xs text-gray-400 mt-1">Must be after {form.checkIn}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <div className="grid grid-cols-4 gap-2">
            {['Present', 'Absent', 'Half-day', 'Leave'].map(s => (
              <button key={s} type="button"
                onClick={() => setForm({ ...form, status: s })}
                className={`py-2 px-1 rounded-md text-xs font-semibold border transition-all ${
                  form.status === s
                    ? s === 'Present'   ? 'bg-green-500 text-white border-green-500'
                    : s === 'Absent'    ? 'bg-red-500 text-white border-red-500'
                    : s === 'Half-day'  ? 'bg-yellow-400 text-white border-yellow-400'
                    :                    'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >{s}</button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Cell Helper ─────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  Present:   'bg-green-500 text-white',
  Absent:    'bg-red-500 text-white',
  'Half-day': 'bg-yellow-400 text-white',
  Leave:     'bg-blue-500 text-white',
};

// ─── Main Component ─────────────────────────────────────────────────────────
export function Attendance() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<{ userId: number, date: string, record: any | null, employeeName: string } | null>(null);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [formData, setFormData] = useState({
    userId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '',
    status: 'Present'
  });

  useEffect(() => { fetchAttendances(); fetchStaff(); fetchSchedules(); }, []);

  const fetchAttendances = async () => {
    try {
      const res = await hrmService.getAttendances();
      if (res.success) setAttendances(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchSchedules = async () => {
    try {
      const res = await hrmService.getSchedules();
      if (res.success) setSchedules(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchStaff = async () => {
    try {
      const res = await staffService.getStaffList();
      if (res?.users) setStaffList(res.users);
    } catch (err) { console.error(err); }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId) return toast.error('Please select an employee');
    if (!formData.checkIn) return toast.error('Please enter check-in time');
    try {
      const res = await hrmService.markAttendance({
        userId: formData.userId,
        date: formData.date,
        checkIn: formData.checkIn,
        checkOut: null,
        status: formData.status
      });
      if (res.success) {
        toast.success('Check-in marked!');
        setShowForm(false);
        fetchAttendances();
        setFormData({ userId: '', date: new Date().toISOString().split('T')[0], checkIn: '', status: 'Present' });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark attendance');
    }
  };

  const getExportData = () => {
    return matrix.map(row => {
      const data: any = { Employee: row.staff.fullName, Role: row.staff.role || 'Staff' };
      daysArray.forEach(day => {
        const record = row.attendanceMap[day];
        const hasSchedule = !!row.scheduleMap[day];
        const cellDate = new Date(selectedYear, selectedMonth - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!hasSchedule) data[day] = 'Off';
        else if (!record) {
          if (cellDate > today) data[day] = '—';
          else data[day] = 'Absent';
        } else {
          data[day] = record.status;
        }
      });
      return data;
    });
  };

  const exportToExcel = () => {
    const data = getExportData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    XLSX.writeFile(workbook, `Attendance_${selectedMonth}_${selectedYear}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    const data = getExportData();
    const columns = [
      { header: 'Employee', dataKey: 'Employee' },
      { header: 'Role', dataKey: 'Role' },
      ...daysArray.map(day => ({ header: day.toString(), dataKey: day.toString() }))
    ];
    
    (doc as any).autoTable({
      head: [columns.map(c => c.header)],
      body: data.map(row => columns.map(c => row[c.dataKey])),
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1 },
      headStyles: { fillColor: [66, 139, 202] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 20 },
      },
    });
    
    doc.save(`Attendance_${selectedMonth}_${selectedYear}.pdf`);
  };

  // ─── Build Matrix ───────────────────────────────────────────────────────
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const matrix = staffList.map(staff => {
    const attendanceMap: Record<number, any> = {};
    const scheduleMap: Record<number, any> = {};

    attendances.forEach(a => {
      if (a.userId === staff.id) {
        const aDate = new Date(a.date);
        if ((aDate.getMonth() + 1) === selectedMonth && aDate.getFullYear() === selectedYear) {
          attendanceMap[aDate.getDate()] = a;
        }
      }
    });

    schedules.forEach(s => {
      if (s.userId === staff.id) {
        const sDate = new Date(s.date);
        if ((sDate.getMonth() + 1) === selectedMonth && sDate.getFullYear() === selectedYear) {
          scheduleMap[sDate.getDate()] = s;
        }
      }
    });

    return { staff, attendanceMap, scheduleMap };
  });

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel} title="Export to Excel">
            <Download size={14} className="mr-1" /> Excel
          </Button>
          <Button variant="outline" onClick={exportToPDF} title="Export to PDF">
            <FileText size={14} className="mr-1" /> PDF
          </Button>
          <Button variant="outline" onClick={fetchAttendances}>Refresh</Button>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : <><LogIn size={14} className="mr-1 inline" /> Mark Check-In</>}
          </Button>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn size={18} className="text-blue-600" /> Mark Check-In
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCheckIn} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Employee</label>
              <Select
                options={staffList.map((s: any) => ({ value: String(s.id), label: s.fullName }))}
                value={
                  staffList.filter((s: any) => String(s.id) === String(formData.userId))
                           .map((s: any) => ({ value: String(s.id), label: s.fullName }))[0] || null
                }
                onChange={(opt: any) => setFormData({...formData, userId: opt ? opt.value : ''})}
                placeholder="Search Employee..."
                isClearable
                menuPortalTarget={document.body}
                styles={{ menuPortal: base => ({ ...base, zIndex: 10000, pointerEvents: 'auto' }) }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <Input type="date" required value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Check-In Time</label>
              <Input type="time" required value={formData.checkIn}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select className="w-full border p-2 rounded-md" value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="Present">Present</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Save Check-In</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap text-xs">
        {[['Present', 'bg-green-500'], ['Absent', 'bg-red-500'], ['Half-day', 'bg-yellow-400'], ['Leave', 'bg-blue-500'], ['Off/No Record', 'bg-gray-200']].map(([label, cls]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-4 h-4 rounded ${cls} inline-block`} />
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Matrix */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="flex flex-row justify-between items-center bg-gray-50 border-b">
          <CardTitle>Attendance Matrix</CardTitle>
          <div className="flex gap-3 items-center">
            <select className="border p-2 rounded-md text-sm" value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>
                  {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <select className="border p-2 rounded-md text-sm" value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}>
              {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse min-w-[max-content]">
            <thead className="bg-gray-100 text-gray-700 text-xs">
              <tr>
                <th className="px-4 py-3 border-r border-b sticky left-0 bg-gray-100 z-10 w-48">Employee</th>
                <th className="px-4 py-3 border-r border-b sticky left-48 bg-gray-100 z-10 w-24">Role</th>
                {daysArray.map(day => {
                  const dateObj = new Date(selectedYear, selectedMonth - 1, day);
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const isSunday = dateObj.getDay() === 0;
                  return (
                    <th key={day} className={`px-1 py-2 border-r border-b text-center min-w-[52px] ${isSunday ? 'bg-red-50' : ''}`}>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-xs font-bold">{day}</span>
                        <span className={`text-[10px] font-medium ${isSunday ? 'text-red-400' : 'text-gray-400'}`}>{dayName}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {matrix.length === 0 ? (
                <tr>
                  <td colSpan={daysArray.length + 2} className="p-6 text-center text-gray-400">No employees found.</td>
                </tr>
              ) : (
                matrix.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50/50 transition-colors">
                    {/* Sticky Employee Name */}
                    <td className="px-4 py-2 border-r font-medium text-gray-900 sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10 whitespace-nowrap">
                      <span 
                        className="cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                        onClick={() => window.location.href = `/hrm/attendance/${row.staff.id}`}
                        title="View Attendance Logs"
                      >
                        {row.staff.fullName}
                      </span>
                    </td>
                    {/* Sticky Role */}
                    <td className="px-4 py-2 border-r text-gray-400 text-xs sticky left-48 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10 whitespace-nowrap capitalize">
                      {row.staff.role || 'Staff'}
                    </td>

                    {daysArray.map(day => {
                      const record = row.attendanceMap[day];
                      const hasSchedule = !!row.scheduleMap[day];
                      const isSunday = new Date(selectedYear, selectedMonth - 1, day).getDay() === 0;

                      if (!hasSchedule) {
                        return (
                          <td key={day} className="border-r p-1 text-center bg-gray-100/60">
                            <span className="text-[10px] text-gray-400 font-medium">Off</span>
                          </td>
                        );
                      }

                      if (!record) {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const cellDate = new Date(selectedYear, selectedMonth - 1, day);

                        if (cellDate > today) {
                          return (
                            <td key={day} className="border-r p-1 text-center bg-blue-50/40">
                              <span className="text-[10px] text-blue-400 font-medium">—</span>
                            </td>
                          );
                        }

                        return (
                          <td key={day} className="border-r p-1 text-center">
                            <div
                              className="rounded-md px-1 py-1 bg-red-500 text-white cursor-pointer hover:bg-red-600 transition-colors"
                              onClick={() => setEditTarget({ userId: row.staff.id, date: `${selectedYear}-${String(selectedMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`, record: null, employeeName: row.staff.fullName })}
                              title="Click to mark attendance"
                            >
                              <div className="text-[9px] font-bold leading-tight">Absent</div>
                            </div>
                          </td>
                        );
                      }

                      const fmt = (t: string) => t ? t.substring(0, 5) : '';
                      const style = STATUS_STYLES[record.status] || 'bg-gray-200 text-gray-600';

                      return (
                        <td key={day} className="border-r p-1 text-center">
                          <div
                            className={`rounded-md px-1 py-1 ${style} cursor-pointer hover:opacity-90 transition-opacity`}
                            onClick={() => setEditTarget({ userId: record.userId, date: record.date, record, employeeName: row.staff.fullName })}
                            title="Click to edit attendance"
                          >
                            <div className="text-[9px] font-bold leading-tight">{fmt(record.checkIn) || '—'}</div>
                            <div className="text-[8px] opacity-75 leading-none my-[1px]">
                              {record.checkOut ? `→ ${fmt(record.checkOut)}` : (
                                <span className="underline">Out?</span>
                              )}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Edit / Add Attendance Modal */}
      {editTarget && (
        <EditAttendanceModal
          target={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={fetchAttendances}
        />
      )}
    </div>
  );
}
