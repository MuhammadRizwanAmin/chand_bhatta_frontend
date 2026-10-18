import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, Plus, Mail, Phone, Edit, Trash2, RefreshCw, Eye, Shield } from 'lucide-react';
import { toast } from 'sonner';

import { staffService } from '../../services/staffService';
import { useConfirm } from '../../components/ConfirmProvider';
import { DataTable } from '../../components/DataTable';
import { usePermissions } from '../../hooks/usePermissions';
import { locationService, Location } from '../../services/locationService';

interface StaffMember {
  id: number;
  fullName: string;
  role: string;
  roleId?: number;
  roleDetails?: {
    id: number;
    name: string;
    description?: string;
  };
  locationId?: string | number;
  allowedLocations?: string[] | string;
  email: string;
  phone: string;
  salary: string;
  payout_date: string;
  profile_image: string | null;
  createdAt: string;
}

export const formatRoleName = (role?: string, roleDetails?: { name: string }) => {
  if (roleDetails && roleDetails.name) return roleDetails.name;
  if (!role) return '—';
  if (role.toLowerCase() === 'front_desk') return 'Front Desk';
  if (role.toLowerCase() === 'housekeeping') return 'House Keeping';
  return role.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

export function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
      const { canEdit, canDelete } = usePermissions();

  const navigate = useNavigate();
  const { confirm } = useConfirm();

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await staffService.getStaffList();
      setStaff(res.users || []);
    } catch (err: any) {
      toast.error('Failed to load staff list');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    fetchStaff();
    locationService.getAll().then(setLocations).catch(console.error);
  }, []);

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Delete Staff',
      message: 'Are you sure you want to delete this staff member? This action cannot be undone.',
      confirmText: 'Delete',
      type: 'danger'
    });

    if (isConfirmed) {
      try {
        await staffService.deleteStaff(id);
        toast.success('Staff member deleted successfully');
        setStaff(prev => prev.filter(s => s.id !== id));
      } catch (err: any) {
        toast.error('Failed to delete staff member');
      }
    }
  };

  const roles = ['all', ...Array.from(new Set(staff.map((s) => s.role || 'Unspecified')))];

  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      (s.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toString().includes(searchTerm.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const roleVal = s.role || 'Unspecified';
    const matchesRole = filterRole === 'all' || roleVal === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const columns = [
    // {
    //   header: 'Staff ID',
    //   cell: (row: StaffMember) => <span className="font-medium text-[#1D4ED8]">#{row.id}</span>
    // },
    {
      header: 'Name',
      cell: (row: StaffMember) => (
        <div className="flex items-center gap-3">
          {row.profile_image ? (
            <img src={row.profile_image} alt={row.fullName} className="w-10 h-10 rounded-full object-cover shadow-sm" />
          ) : (
            <div className="w-10 h-10 bg-[#1D4ED8]/10 rounded-full flex items-center justify-center">
              <span className="text-[#1D4ED8] font-bold text-sm">
                {(row.fullName || 'U').split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-sm font-medium text-gray-900">{row.fullName}</span>
        </div>
      )
    },
    {
      header: 'Role',
      cell: (row: StaffMember) => <span className="text-sm font-medium text-gray-900">{formatRoleName(row.role, row.roleDetails)}</span>
    },
    {
      header: 'Location Access',
      cell: (row: StaffMember) => {
        let allowedList: string[] = [];
        if (row.allowedLocations) {
          if (typeof row.allowedLocations === 'string') {
            try { allowedList = JSON.parse(row.allowedLocations).map(String); } catch { allowedList = []; }
          } else if (Array.isArray(row.allowedLocations)) {
            allowedList = row.allowedLocations.map(String);
          }
        }
        
        const isAll = !row.locationId || String(row.locationId) === 'all';
        if (isAll && allowedList.length === 0) {
          return (
             <span className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-700 text-[11px] font-bold uppercase tracking-wider rounded border border-purple-200">
               All Locations
             </span>
          );
        }

        // Include primary location if it's specific
        if (!isAll && row.locationId && !allowedList.includes(String(row.locationId))) {
          allowedList.push(String(row.locationId));
        }

        return (
          <div className="flex flex-wrap gap-1 items-start max-w-[200px]">
             {allowedList.map(id => {
                const loc = locations.find(l => String(l.id) === id);
                return (
                  <span key={id} className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded border border-blue-200">
                    {loc ? loc.name : `Branch #${id}`}
                  </span>
                )
             })}
          </div>
        );
      }
    },
    {
      header: 'Contact',
      cell: (row: StaffMember) => (
        <div className="space-y-1">
          {row.email && (
            <div className="flex items-center gap-2 text-xs text-gray-900">
              <Mail size={12} className="text-gray-400" /> {row.email}
            </div>
          )}
          {row.phone && (
            <div className="flex items-center gap-2 text-xs text-gray-900">
              <Phone size={12} className="text-gray-400" /> {row.phone}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Salary',
      cell: (row: StaffMember) => (
        <span className="text-sm text-gray-900">{row.salary ? `Rs ${Number(row.salary).toLocaleString()}` : '—'}</span>
      )
    },
    {
      header: 'Actions',
      cell: (row: StaffMember) => (
        <div className="flex items-center gap-1">
          <button 
            onClick={() => navigate(`/staff/view/${row.id}`)}
            className="p-1.5 text-gray-500 hover:text-[#1D4ED8] hover:bg-blue-50 rounded-lg transition-colors"
            title="View Staff"
          >
            <Eye size={16} />
          </button>
                         {canEdit && (
          <button 
            onClick={() => navigate(`/staff/edit/${row.id}`)}
            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Edit Staff"
          >
            <Edit size={16} />
          </button>
                         )}
                         {canDelete && (
          <button 
            onClick={() => handleDelete(row.id)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Staff"
          >
            <Trash2 size={16} />
          </button>
                         )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Staff Management</h1>
          <p className="text-gray-600 mt-1">Manage hotel staff, privileges, and assignments</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchStaff}
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button 
            onClick={() => navigate('/staff/roles')}
            className="flex items-center gap-2 bg-white border border-[#1D4ED8] text-[#1D4ED8] px-4 py-2.5 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            <Shield size={18} />
            Manage Roles & Privileges
          </button>
          <button 
            onClick={() => navigate('/staff/add')}
            className="flex items-center gap-2 bg-[#1D4ED8] text-white px-6 py-2.5 rounded-lg hover:bg-[#1E40AF] transition-colors shadow-sm"
          >
            <Plus size={20} />
            Add Staff
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-[#1D4ED8]">
          <div className="text-gray-500 text-sm font-medium mb-1">Total Staff</div>
          <div className="text-3xl font-bold text-[#0F172A]">{loading ? '...' : staff.length}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-emerald-500">
          <div className="text-gray-500 text-sm font-medium mb-1">Housekeeping Staff</div>
          <div className="text-3xl font-bold text-emerald-600">{loading ? '...' : staff.filter(s => (s.role || '').toLowerCase() === 'housekeeping').length}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-amber-500">
          <div className="text-gray-500 text-sm font-medium mb-1">Admins</div>
          <div className="text-3xl font-bold text-amber-600">{loading ? '...' : staff.filter(s => (s.role || '').toLowerCase() === 'admin').length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>
          <div className="sm:w-64">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] bg-white capitalize"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role === 'all' ? 'All Roles' : formatRoleName(role)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <RefreshCw className="animate-spin mb-4 text-[#1D4ED8]" size={32} />
            <p>Loading staff data...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredStaff}
            pageSize={10}
            searchable={false}
          />
        )}
      </div>
    </div>
  );
}
