import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { hrmService } from '@/app/services/hrmService';
import { staffService } from '@/app/services/staffService';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import Select from 'react-select';

export function Scheduling() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  // Matrix Filters
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Bulk form state
  const [formData, setFormData] = useState({ 
    userId: '', 
    shiftName: '', 
    startDate: '', 
    endDate: '',
    defaultStartTime: '09:00',
    defaultEndTime: '17:00'
  });
  
  const [scheduleDays, setScheduleDays] = useState<any[]>([]);

  useEffect(() => {
    fetchSchedules();
    fetchStaff();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await hrmService.getSchedules();
      if (res.success) setSchedules(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await staffService.getStaffList();
      if (res && res.users) setStaffList(res.users);
    } catch (err) {
      console.error(err);
    }
  };

  // Generate days when start/end dates or default times change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const dates = [];
      let curr = new Date(formData.startDate);
      const last = new Date(formData.endDate);
      while (curr <= last) {
        dates.push({
          date: curr.toISOString().split('T')[0],
          startTime: formData.defaultStartTime,
          endTime: formData.defaultEndTime,
          selected: true
        });
        curr.setDate(curr.getDate() + 1);
      }
      setScheduleDays(dates);
    } else {
      setScheduleDays([]);
    }
  }, [formData.startDate, formData.endDate, formData.defaultStartTime, formData.defaultEndTime]);

  const updateDay = (index: number, field: string, value: any) => {
    const updated = [...scheduleDays];
    updated[index][field] = value;
    setScheduleDays(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = scheduleDays.filter(d => d.selected).map(d => ({
        userId: formData.userId,
        shiftName: formData.shiftName || 'Standard Shift',
        date: d.date,
        startTime: d.startTime,
        endTime: d.endTime
      }));

      if (payload.length === 0) {
        return toast.error("No days selected for scheduling");
      }

      const res = await hrmService.createSchedule(payload);
      if (res.success) {
        toast.success("Schedules created successfully");
        setShowForm(false);
        fetchSchedules();
        setFormData({ ...formData, startDate: '', endDate: '' });
        setScheduleDays([]);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create schedules");
    }
  };

  // --- Excel View Logic ---
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const matrix = staffList.map(staff => {
    const scheduleMap: Record<number, any> = {};
    
    // Filter schedules for this staff in the selected month/year
    schedules.forEach(s => {
      if (s.userId === staff.id) {
        const sDate = new Date(s.date);
        if ((sDate.getMonth() + 1) === selectedMonth && sDate.getFullYear() === selectedYear) {
          const day = sDate.getDate();
          scheduleMap[day] = s;
        }
      }
    });

    return {
      staff,
      scheduleMap
    };
  });

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Roster & Scheduling</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSchedules}>Refresh</Button>
          <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Create Schedule'}</Button>
        </div>
      </div>
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Create Schedule</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium mb-1">Shift Name (Optional)</label>
                <Input type="text" placeholder="e.g. Morning, Evening, Night" value={formData.shiftName} onChange={(e) => setFormData({...formData, shiftName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <Input type="date" required value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <Input type="date" required value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Default Start Time</label>
                <Input type="time" required value={formData.defaultStartTime} onChange={(e) => setFormData({...formData, defaultStartTime: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Default End Time</label>
                <Input type="time" required value={formData.defaultEndTime} onChange={(e) => setFormData({...formData, defaultEndTime: e.target.value})} />
              </div>
            </div>

            {scheduleDays.length > 0 && (
              <div className="border rounded-md p-4 bg-gray-50">
                <h3 className="font-semibold mb-3 text-gray-700">Customize Days</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {scheduleDays.map((day, index) => {
                    const dateObj = new Date(day.date);
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                    return (
                      <div key={index} className="flex items-center gap-4 bg-white p-2 rounded border">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4"
                          checked={day.selected} 
                          onChange={(e) => updateDay(index, 'selected', e.target.checked)} 
                        />
                        <div className="w-32 font-medium">{dayName}, {day.date}</div>
                        <div className="flex items-center gap-2 flex-1">
                          <Input 
                            type="time" 
                            value={day.startTime} 
                            disabled={!day.selected}
                            onChange={(e) => updateDay(index, 'startTime', e.target.value)} 
                          />
                          <span>to</span>
                          <Input 
                            type="time" 
                            value={day.endTime} 
                            disabled={!day.selected}
                            onChange={(e) => updateDay(index, 'endTime', e.target.value)} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={scheduleDays.length === 0}>Save Schedules</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="flex flex-row justify-between items-center bg-gray-50 border-b">
          <CardTitle>Schedule Matrix</CardTitle>
          <div className="flex gap-4">
            <select 
              className="border p-2 rounded-md" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
            <select 
              className="border p-2 rounded-md" 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse min-w-[max-content]">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 border-r border-b sticky left-0 bg-gray-100 z-10 w-48">Employee</th>
                <th className="px-4 py-3 border-r border-b sticky left-48 bg-gray-100 z-10 w-32">Role</th>
                {daysArray.map(day => {
                  const dateObj = new Date(selectedYear, selectedMonth - 1, day);
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const isSunday = dateObj.getDay() === 0;
                  return (
                    <th key={day} className={`px-2 py-2 border-r border-b text-center min-w-[70px] ${isSunday ? 'bg-red-50 text-red-600' : ''}`}>
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
                  <td colSpan={daysArray.length + 2} className="p-6 text-center text-gray-500">
                    No employees found.
                  </td>
                </tr>
              ) : (
                matrix.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 border-r font-medium text-gray-900 sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10 whitespace-nowrap">
                      {row.staff.fullName}
                    </td>
                    <td className="px-4 py-3 border-r text-gray-500 sticky left-48 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10 whitespace-nowrap capitalize">
                      {row.staff.role || 'Staff'}
                    </td>
                    {daysArray.map(day => {
                      const shift = row.scheduleMap[day];
                      if (!shift) {
                        return (
                          <td key={day} className="border-r p-1 text-center bg-gray-100/70 border-gray-200">
                            <span className="text-xs text-gray-400 font-medium">OFF</span>
                          </td>
                        );
                      }

                      // Format time strings (e.g. "09:00:00" -> "09:00")
                      const formatTime = (t: string) => t ? t.substring(0, 5) : '';
                      
                      return (
                        <td key={day} className="border-r p-1 text-center bg-blue-50">
                          <div className="flex flex-col items-center justify-center rounded-md px-1 py-1 bg-blue-100 border border-blue-200 text-blue-700">
                            <span className="text-[10px] font-bold leading-tight">{formatTime(shift.startTime)}</span>
                            <span className="text-[8px] text-blue-500 leading-none my-[1px]">to</span>
                            <span className="text-[10px] font-bold leading-tight">{formatTime(shift.endTime)}</span>
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
    </div>
  );
}
