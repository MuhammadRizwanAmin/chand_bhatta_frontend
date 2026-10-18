import api from './api'; // assuming api.ts exists and sets up axios

export const hrmService = {
  // --- Attendance ---
  markAttendance: async (data: any) => {
    const res = await api.post('/hrm/attendance', data);
    return res.data;
  },
  getAttendances: async (params?: any) => {
    const res = await api.get('/hrm/attendance', { params });
    return res.data;
  },

  // --- Leaves ---
  applyLeave: async (data: any) => {
    const res = await api.post('/hrm/leave', data);
    return res.data;
  },
  getLeaves: async () => {
    const res = await api.get('/hrm/leave');
    return res.data;
  },
  updateLeaveStatus: async (id: number, status: string) => {
    const res = await api.put(`/hrm/leave/${id}/status`, { status });
    return res.data;
  },

  // --- Schedule ---
  createSchedule: async (data: any) => {
    const res = await api.post('/hrm/schedule', data);
    return res.data;
  },
  getSchedules: async () => {
    const res = await api.get('/hrm/schedule');
    return res.data;
  },

  // --- Payroll ---
  generatePayroll: async (data: any) => {
    const res = await api.post('/hrm/payroll', data);
    return res.data;
  },
  getPayrolls: async () => {
    const res = await api.get('/hrm/payroll');
    return res.data;
  },
  updatePayrollStatus: async (id: number, status: string) => {
    const res = await api.put(`/hrm/payroll/${id}/status`, { status });
    return res.data;
  },
  updatePayroll: async (id: number, data: any) => {
    const res = await api.put(`/hrm/payroll/${id}`, data);
    return res.data;
  },
  deletePayroll: async (id: number) => {
    const res = await api.delete(`/hrm/payroll/${id}`);
    return res.data;
  }
};
