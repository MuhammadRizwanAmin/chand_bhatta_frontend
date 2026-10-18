import React, { useState, useEffect, useRef } from 'react';
import {
  bhattaService,
  Employee,
  EmployeeAttendance,
} from '../../services/bhattaService';
import { useBhattaSettings } from '../../context/BhattaSettingsContext';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Calendar,
  Phone,
  CreditCard,
  Briefcase,
  Edit2,
  Trash2,
  Power,
  FileSpreadsheet,
  AlertCircle,
  Coins,
  X,
  Save,
  MapPin,
  FileDown,
} from 'lucide-react';
import chandLogo from '../../../assets/chand_bricks_logo.jpg';

export function EmployeeManagement() {
  const { settings } = useBhattaSettings();
  const salarySlipRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'employees' | 'attendance'>('employees');
  const [employees, setEmployees] = useState<Employee[]>(bhattaService.getEmployees());
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Employee Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Partial<Employee> | null>(null);

  // Attendance State
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceList, setAttendanceList] = useState<EmployeeAttendance[]>([]);

  // Salary Slip Modal
  const [selectedSlipEmp, setSelectedSlipEmp] = useState<Employee | null>(null);

  useEffect(() => {
    refreshData();
  }, [attendanceDate]);

  const refreshData = () => {
    const emps = bhattaService.getEmployees();
    setEmployees(emps);
    setAttendanceList(bhattaService.getAttendance(attendanceDate));
  };

  const handleOpenAdd = () => {
    setEditingEmp({
      full_name: '',
      phone: '',
      cnic: '',
      role: 'Kacchi_Worker',
      salary_type: 'Per_Thousand_Bricks',
      monthly_salary_amount: 0,
      joining_date: new Date().toISOString().split('T')[0],
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmp({ ...emp });
    setIsModalOpen(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp?.full_name) return;
    bhattaService.saveEmployee(editingEmp);
    setIsModalOpen(false);
    setEditingEmp(null);
    refreshData();
  };

  const handleDeleteEmployee = (id: number) => {
    if (window.confirm('Are you sure you want to delete this worker?')) {
      bhattaService.deleteEmployee(id);
      refreshData();
    }
  };

  const handleToggleStatus = (id: number) => {
    bhattaService.toggleEmployeeStatus(id);
    refreshData();
  };

  const handleSetAttendance = (empId: number, status: EmployeeAttendance['status']) => {
    bhattaService.saveAttendanceRecord({
      employee_id: empId,
      attendance_date: attendanceDate,
      status,
    });
    refreshData();
  };

  const handleMarkAllPresent = () => {
    const activeEmps = employees.filter(e => e.status === 'Active');
    activeEmps.forEach(e => {
      bhattaService.saveAttendanceRecord({
        employee_id: e.id,
        attendance_date: attendanceDate,
        status: 'Present',
      });
    });
    refreshData();
  };

  // Filtered employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.cnic.includes(searchTerm) ||
      emp.phone.includes(searchTerm);
    const matchesRole = roleFilter === 'All' || emp.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const roleLabels: Record<string, string> = {
    Kacchi_Worker: 'Kacchi Pathai (کچی پتھائی)',
    Pakki_Worker: 'Bhatti Jalai (بھٹی جلائی)',
    Bhari_Worker: 'Bhari Labor (بھٹی بھری)',
    Nikasi_Worker: 'Nikasi Labor (بھٹی نکاسی)',
    Munshi: 'Munshi / Manager (منشی/مینیجر)',
    Driver: 'Driver / Transport (ڈرائیور)',
    General_Labor: 'General Labor (عام مزدور)',
  };

  const handlePrintSalarySlip = () => {
    const printContent = salarySlipRef.current;
    if (!printContent) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML).join('\n');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="ur" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <title>SalarySlip_${selectedSlipEmp?.full_name?.replace(/\\s+/g, '_') || 'Worker'}</title>
          ${styles}
          <style>
            @page { size: A4 portrait; margin: 8mm 10mm; }
            *, *::before, *::after, html, body {
              font-family: 'Jameel Noori Nastaliq', 'Jameel Noori Nastaleeq', 'JameelNooriNastaliq', 'Noto Nastaliq Urdu', serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body { background: white !important; color: #0F172A !important; margin: 0; padding: 0; }
            #slip-root { width: 100%; max-width: 100%; margin: 0 auto; background: white; padding: 4mm 6mm; }
          </style>
        </head>
        <body><div id="slip-root">${printContent.innerHTML}</div></body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        try { document.body.removeChild(iframe); } catch {}
      }, 3000);
    }, 400);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <Users className="text-[#1D4ED8]" />
            Employee & Labor Management (مزدور و عملہ کھاتہ)
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Staff directory, daily attendance tracking, wage classification & salary slips
          </p>
        </div>

        {/* Tab Switcher & Add Button */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center">
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'employees' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Workers Directory
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'attendance' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Attendance
            </button>
          </div>

          {activeTab === 'employees' && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <UserPlus size={16} />
              Add Worker
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: WORKERS DIRECTORY */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by worker name, CNIC or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-10 pr-4 py-2 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1D4ED8] focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
              >
                <option value="All">All Roles (تمام شعبہ جات)</option>
                <option value="Kacchi_Worker">Kacchi Pathai</option>
                <option value="Pakki_Worker">Bhatti Jalai</option>
                <option value="Bhari_Worker">Bhari Labor</option>
                <option value="Nikasi_Worker">Nikasi Labor</option>
                <option value="Munshi">Munshi / Manager</option>
                <option value="Driver">Driver</option>
                <option value="General_Labor">General Labor</option>
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8]"
              >
                <option value="All">All Status</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Worker / Staff Name</th>
                    <th className="py-3 px-4">CNIC & Phone</th>
                    <th className="py-3 px-4">Role / Department</th>
                    <th className="py-3 px-4">Salary Type</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-[#0F172A]">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No workers found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#0F172A]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#1E40AF] flex items-center justify-center font-bold text-white text-xs shadow-sm">
                              {emp.full_name[0]}
                            </div>
                            <div>
                              <span>{emp.full_name}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">ID: #{emp.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-mono text-slate-800">{emp.phone || '-'}</p>
                          <p className="font-mono text-[11px] text-slate-400">{emp.cnic || 'CNIC Pending'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#1D4ED8] border border-blue-100">
                            {roleLabels[emp.role] || emp.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-700 capitalize">
                            {emp.salary_type.replace(/_/g, ' ')}
                          </span>
                          {emp.salary_type === 'Monthly_Salary' && (
                            <span className="text-emerald-600 block font-mono font-bold text-[11px]">
                              Rs. {emp.monthly_salary_amount.toLocaleString()}/mo
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono">
                          {emp.joining_date || '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(emp.id)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                              emp.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {emp.status}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedSlipEmp(emp)}
                              title="Salary Slip"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 text-amber-600 transition-colors cursor-pointer border border-slate-200"
                            >
                              <FileSpreadsheet size={15} />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(emp)}
                              title="Edit Worker"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer border border-slate-200"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(emp.id)}
                              title="Delete Worker"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer border border-slate-200"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAILY ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          
          {/* Attendance Controls Bar */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-[#1D4ED8]" />
              <div>
                <label className="text-xs font-semibold text-slate-700">Select Attendance Date (حاضری تاریخ):</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="block bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] mt-1 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllPresent}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle size={15} />
                Mark All Active Present (سب حاضر)
              </button>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Worker Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-center">Status (حاضری کیفیت)</th>
                  <th className="py-3 px-4 text-right">Quick Mark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-[#0F172A]">
                {employees.filter(e => e.status === 'Active').map((emp) => {
                  const att = attendanceList.find(a => a.employee_id === emp.id);
                  const status = att?.status || 'Present';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-50 text-[#1D4ED8] font-bold flex items-center justify-center text-xs border border-blue-100">
                            {emp.full_name[0]}
                          </div>
                          <span>{emp.full_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {roleLabels[emp.role] || emp.role}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {attendanceDate}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            status === 'Present'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : status === 'Absent'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : status === 'Half_Day'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-lg border border-[#E2E8F0]">
                          <button
                            onClick={() => handleSetAttendance(emp.id, 'Present')}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                              status === 'Present' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            P
                          </button>
                          <button
                            onClick={() => handleSetAttendance(emp.id, 'Half_Day')}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                              status === 'Half_Day' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            HD
                          </button>
                          <button
                            onClick={() => handleSetAttendance(emp.id, 'Absent')}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                              status === 'Absent' ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            A
                          </button>
                          <button
                            onClick={() => handleSetAttendance(emp.id, 'Leave')}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                              status === 'Leave' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            L
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT WORKER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] bg-[#0F172A] text-white">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus size={18} className="text-[#1D4ED8]" />
                {editingEmp?.id ? 'Edit Worker Details' : 'Add New Worker / Staff'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4 text-[#0F172A]">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name (مزدور کا نام) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Akram Pathair"
                  value={editingEmp?.full_name || ''}
                  onChange={(e) => setEditingEmp({ ...editingEmp, full_name: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number (فون)</label>
                  <input
                    type="text"
                    placeholder="0300-1234567"
                    value={editingEmp?.phone || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, phone: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">CNIC (شناختی کارڈ)</label>
                  <input
                    type="text"
                    placeholder="36104-XXXXXXX-X"
                    value={editingEmp?.cnic || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, cnic: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Role / Department (شعبہ) *</label>
                  <select
                    value={editingEmp?.role || 'Kacchi_Worker'}
                    onChange={(e) => setEditingEmp({ ...editingEmp, role: e.target.value as any })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                  >
                    <option value="Kacchi_Worker">Kacchi Pathai (کچی پتھائی)</option>
                    <option value="Pakki_Worker">Bhatti Jalai (بھٹی جلائی)</option>
                    <option value="Bhari_Worker">Bhari Labor (بھٹی بھری)</option>
                    <option value="Nikasi_Worker">Nikasi Labor (بھٹی نکاسی)</option>
                    <option value="Munshi">Munshi / Manager (منشی)</option>
                    <option value="Driver">Driver (ڈرائیور)</option>
                    <option value="General_Labor">General Labor (عام مزدور)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Salary Type (طریقہ اجرت) *</label>
                  <select
                    value={editingEmp?.salary_type || 'Per_Thousand_Bricks'}
                    onChange={(e) => setEditingEmp({ ...editingEmp, salary_type: e.target.value as any })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                  >
                    <option value="Per_Thousand_Bricks">Per Thousand Bricks (فی ہزار اینٹ)</option>
                    <option value="Daily_Wage">Daily Wage (روزانہ دیہاڑی)</option>
                    <option value="Monthly_Salary">Monthly Fixed Salary (ماہانہ تنخواہ)</option>
                  </select>
                </div>
              </div>

              {editingEmp?.salary_type === 'Monthly_Salary' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Monthly Salary Amount (ماہانہ رقم - Rs.)</label>
                  <input
                    type="number"
                    value={editingEmp?.monthly_salary_amount || 0}
                    onChange={(e) => setEditingEmp({ ...editingEmp, monthly_salary_amount: Number(e.target.value) })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Joining Date (تاریخ شمولیت)</label>
                  <input
                    type="date"
                    value={editingEmp?.joining_date || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, joining_date: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Status (حیثیت)</label>
                  <select
                    value={editingEmp?.status || 'Active'}
                    onChange={(e) => setEditingEmp({ ...editingEmp, status: e.target.value as any })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                  >
                    <option value="Active">Active (فعال)</option>
                    <option value="Inactive">Inactive (غیر فعال)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <Save size={15} />
                  Save Worker Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SALARY SLIP MODAL */}
      {selectedSlipEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 max-h-[95vh] flex flex-col">
            
            {/* Modal Top Control Bar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Coins size={18} className="text-amber-400" />
                <span className="font-bold text-sm">لیبر سیلری و فائنل سیٹلمنٹ سلپ (Salary & Settlement Slip)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintSalarySlip}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                  title="Save as PDF (پی ڈی ایف ڈاؤن لوڈ)"
                >
                  <FileDown size={14} />
                  <span>پی ڈی ایف (Save PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintSalarySlip}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1D4ED8] hover:bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                  title="Print Salary Slip (پرنٹ سلپ)"
                >
                  <Printer size={14} />
                  <span>پرنٹ سلپ (Print)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSlipEmp(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Printable Slip Container */}
            <div className="flex-1 overflow-y-auto">
              <div
                ref={salarySlipRef}
                className="p-6 sm:p-8 bg-white text-slate-900"
              >
                {/* Top Official Bhatta Header Branding - Exactly Matches Sales Receipt */}
                <div className="border-b-2 border-[#1D4ED8] pb-5">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    
                    {/* Logo and 4 Pure Urdu Lines Aligned Right next to Logo */}
                    <div className="flex items-center gap-4 text-right">
                      <img
                        src={settings.logoUrl || chandLogo}
                        alt="Official Logo"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover bg-white p-1.5 shadow-md shrink-0 border-2 border-slate-200 ring-2 ring-blue-100"
                      />
                      <div className="text-right space-y-0.5">
                        <h2 className="text-2xl sm:text-3xl font-black text-[#1D4ED8] font-urdu leading-tight">
                          {settings.businessNameUrdu || 'چاند برکس سپلائرز (اے ایم ڈی)'}
                        </h2>
                        <p className="text-xs sm:text-sm font-urdu font-bold text-amber-700">
                          {(settings.taglineUrdu || 'چاند برکس بوریوالا (سپیشل اول اینٹ)').replace('• بوریوالا', 'بوریوالا')}
                        </p>
                        <p className="text-xs text-slate-700 font-urdu flex items-center justify-start gap-1">
                          <MapPin size={13} className="text-[#1D4ED8] shrink-0" />
                          <span>{settings.addressUrdu}</span>
                        </p>
                        <p className="text-xs text-slate-600 font-urdu pr-4">
                          چیچہ وطنی روڈ بائی پاس، بوریوالا (ضلع وہاڑی)
                        </p>
                      </div>
                    </div>

                    {/* Tag and Date */}
                    <div className="text-center sm:text-right bg-slate-50 p-3.5 rounded-xl border border-slate-200 shrink-0 min-w-[190px]">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                        <CheckCircle2 size={13} />
                        <span>لیبر سیلری و سیٹلمنٹ سلپ</span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Slip ID:</div>
                      <div className="font-mono font-black text-sm text-[#1D4ED8]">#SAL-{selectedSlipEmp.id}</div>
                      <div className="text-xs text-slate-500 mt-1 font-medium">Payment Month:</div>
                      <div className="font-bold text-xs text-slate-800 font-urdu">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                    </div>
                  </div>

                  {/* Contact Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 bg-blue-50/60 px-3 py-1.5 rounded-lg border border-blue-100">
                      <Phone size={14} className="text-[#1D4ED8] shrink-0" />
                      <span className="font-bold text-slate-800 font-urdu text-xs">سیٹھ حاجی ناصر:</span>
                      <span className="font-mono text-blue-950 font-bold text-xs">{settings.hajiPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50/60 px-3 py-1.5 rounded-lg border border-blue-100">
                      <Phone size={14} className="text-[#1D4ED8] shrink-0" />
                      <span className="font-bold text-slate-800 font-urdu text-xs">منشی سرور:</span>
                      <span className="font-mono text-blue-950 font-bold text-xs">{settings.munshiPhone}</span>
                    </div>
                  </div>

                  {/* Proprietors Strip */}
                  <div className="mt-2.5 py-1.5 px-3 bg-slate-100 rounded-lg text-center text-[11px] text-slate-700 font-urdu border border-slate-200/80">
                    {settings.proprietorsUrdu || 'ملکیت و شراکت داران: سیٹھ حاجی ناصر محمود • میاں محمد احمد • چوہدری عاصم حفیظ'}
                  </div>
                </div>

                {/* Worker Details Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">مزدور کا نام (Worker Name):</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedSlipEmp.full_name}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">کام کی قسم (Role):</span>
                    <p className="font-bold text-slate-900 mt-0.5">{roleLabels[selectedSlipEmp.role] || selectedSlipEmp.role}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">شناختی کارڈ / فون:</span>
                    <p className="font-mono text-slate-800 font-semibold mt-0.5">{selectedSlipEmp.phone || selectedSlipEmp.cnic || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">ادائیگی کا مہینہ (Period):</span>
                    <p className="font-bold text-slate-900 mt-0.5">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                {/* Wage Breakdown Table */}
                <table className="w-full text-xs my-4 border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <thead className="bg-[#1D4ED8] text-white font-semibold">
                    <tr>
                      <th className="py-2.5 px-4 text-left font-urdu text-sm">تفصیل ادائیگی و کٹوتی (Description)</th>
                      <th className="py-2.5 px-4 text-right font-urdu text-sm">رقم (Amount Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        مقررہ ماہانہ اجرت / بنیادی تنخواہ (Base Wages / Fixed Salary)
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        Rs. {selectedSlipEmp.monthly_salary_amount ? selectedSlipEmp.monthly_salary_amount.toLocaleString() : '8,500'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-slate-700">
                        منفی: پیشگی ایڈوانس کی کٹوتی (Less: Advance Recovered)
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-red-600 font-bold text-sm">
                        - Rs. 3,000
                      </td>
                    </tr>
                    <tr className="bg-blue-50/80 font-bold text-blue-950 border-t-2 border-blue-200">
                      <td className="py-3.5 px-4 text-sm font-urdu font-black text-blue-900">
                        خالص قابلِ ادائیگی کیش رقم (Net Cash Payable)
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-lg font-black text-[#1D4ED8]">
                        Rs. {selectedSlipEmp.monthly_salary_amount ? (selectedSlipEmp.monthly_salary_amount - 3000).toLocaleString() : '5,500'}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Terms and Note */}
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <p className="text-[11px] text-slate-600 font-urdu leading-relaxed">
                    نوٹ: یہ سلپ کمپیوٹرائزڈ ہے اور چاند برکس سپلائرز کے مصدقہ لیبر ریکارڈ کے عین مطابق ہے۔ کسی بھی غلطی یا اعتراض کی صورت میں فوری طور پر منشی یا دفتر سے رابطہ کریں۔
                  </p>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 mt-8 pt-4 border-t-2 border-dashed border-slate-300 text-xs text-center">
                  <div>
                    <div className="h-10 border-b border-slate-400 mx-auto w-40"></div>
                    <p className="mt-2 font-bold text-slate-800 font-urdu">دستخط منشی سرور</p>
                    <span className="text-[10px] text-slate-500 font-mono">Bhatta Munshi / Manager</span>
                  </div>
                  <div>
                    <div className="h-10 border-b border-slate-400 mx-auto w-40"></div>
                    <p className="mt-2 font-bold text-slate-800 font-urdu">دستخط / انگوٹھا مزدور</p>
                    <span className="text-[10px] text-slate-500 font-mono">Worker Thumb Impression / Sign</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">Chak 431/E.B Burewala</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSlipEmp(null)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  بند کریں (Close)
                </button>
                <button
                  type="button"
                  onClick={handlePrintSalarySlip}
                  className="px-5 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={15} />
                  <span>پرنٹ سیلری سلپ (Print Slip)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
