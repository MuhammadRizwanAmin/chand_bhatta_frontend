import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { hrmService } from '@/app/services/hrmService';
import { staffService } from '@/app/services/staffService';
import { DataTable } from '@/app/components/DataTable';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import Select from 'react-select';

export function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ userId: '', startDate: '', endDate: '', type: 'Annual', reason: '' });

  useEffect(() => {
    fetchLeaves();
    fetchStaff();
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await hrmService.getLeaves();
      if (res.success) setLeaves(res.data);
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

  const updateStatus = async (id: number, status: string) => {
    try {
      await hrmService.updateLeaveStatus(id, status);
      fetchLeaves();
    } catch (err) {
      console.error(err);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await hrmService.applyLeave(formData);
      if (res.success) {
        toast.success("Leave applied successfully");
        setShowForm(false);
        fetchLeaves();
        setFormData({ userId: '', startDate: '', endDate: '', type: 'Annual', reason: '' });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to apply leave");
    }
  };

  const renderActions = (item: any) => {
    if (item.status !== 'Pending') return null;
    return (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => updateStatus(item.id, 'Approved')}>Approve</Button>
        <Button size="sm" variant="destructive" onClick={() => updateStatus(item.id, 'Rejected')}>Reject</Button>
      </div>
    );
  };

  const columns = [
    { header: 'Employee', cell: (item: any) => item.user?.fullName },
    { accessorKey: 'type', header: 'Type' },
    { accessorKey: 'startDate', header: 'Start Date' },
    { accessorKey: 'endDate', header: 'End Date' },
    { accessorKey: 'reason', header: 'Reason' },
    { accessorKey: 'status', header: 'Status' },
    { header: 'Actions', cell: renderActions },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Leaves Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLeaves}>Refresh</Button>
          <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Apply Leave'}</Button>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Apply Leave</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium mb-1">Leave Type</label>
              <select 
                className="w-full border p-2 rounded-md" 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="Annual">Annual</option>
                <option value="Casual">Casual</option>
                <option value="Sick">Sick</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Input type="date" required value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Input type="date" required value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Reason</label>
              <Input type="text" placeholder="Reason for leave" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Submit Leave Request</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-0">
          <DataTable
            data={leaves}
            columns={columns}
            keyExtractor={(item: any) => item.id.toString()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
