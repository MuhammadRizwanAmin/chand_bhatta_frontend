import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Edit2, Trash2, Shield, Check, X, Copy, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { roleService, Role } from '../../services/roleService';
import { privilegeToModuleMap } from '../../hooks/usePermissions';
import { useModule } from '../../context/ModuleContext';
import { toast } from 'sonner';

const ALL_PRIVILEGE_KEYS = [
  { key: 'reservations', label: 'Reservations Management' },
  { key: 'groups', label: 'Group Bookings' },
  { key: 'rooms', label: 'Rooms & Setup' },
  { key: 'floor', label: 'Floor Plan' },
  { key: 'bed', label: 'Beds Management' },
  { key: 'housekeeping', label: 'Housekeeping' },
  { key: 'hostel', label: 'Hostel Module' },
  { key: 'transportation', label: 'Transportation' },
  { key: 'customers', label: 'Guests / Customers' },
  { key: 'organization', label: 'Corporate Accounts' },
  { key: 'agent', label: 'Travel Agents' },
  { key: 'accounts', label: 'Accounts & Finance' },
  { key: 'membership', label: 'Memberships' },
  { key: 'pos', label: 'POS Billing' },
  { key: 'kitchen', label: 'Kitchen Orders' },
  { key: 'assets', label: 'Inventory & Assets' },
  { key: 'passwords', label: 'Password Vault' },
  { key: 'lostfound', label: 'Lost & Found' },
  { key: 'reputation', label: 'Reputation & Reviews' },
  { key: 'reports', label: 'Reports & Analytics' },
  { key: 'staff', label: 'Staff Management' },
  { key: 'hrm', label: 'HRM & Attendance' },
];

const ACTION_PRIVILEGES = [
  { key: 'edit', label: 'Edit Privilege (Can edit existing records)' },
  { key: 'delete', label: 'Delete Privilege (Can delete records)' },
];

const parsePrivileges = (privs: any): Record<string, boolean> => {
  if (!privs) return {};
  if (typeof privs === 'string') {
    try {
      const parsed = JSON.parse(privs);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  }
  if (typeof privs === 'object' && privs !== null) {
    return privs;
  }
  return {};
};

export const RolesManagement: React.FC = () => {
  const navigate = useNavigate();
  const { modules } = useModule();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [privileges, setPrivileges] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  // Filter modules based on globally enabled modules in hotel setting
  const activeModulePrivileges = ALL_PRIVILEGE_KEYS.filter(p => {
    const mapped = privilegeToModuleMap[p.key];
    if (modules && mapped && modules[mapped] === false) return false;
    return true;
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = await roleService.getRoles();
      setRoles(data);
    } catch (e) {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (roleToEdit?: Role) => {
    if (roleToEdit) {
      setEditingRole(roleToEdit);
      setRoleName(roleToEdit.name);
      setDescription(roleToEdit.description || '');
      setPrivileges(parsePrivileges(roleToEdit.privileges));
    } else {
      setEditingRole(null);
      setRoleName('');
      setDescription('');
      // Default to empty privileges for new role
      const initialPrivs: Record<string, boolean> = {};
      activeModulePrivileges.forEach(p => { initialPrivs[p.key] = false; });
      ACTION_PRIVILEGES.forEach(p => { initialPrivs[p.key] = false; });
      setPrivileges(initialPrivs);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
  };

  const togglePrivilege = (key: string) => {
    setPrivileges(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSelectAll = (checked: boolean) => {
    setPrivileges(prev => {
      const updated = { ...prev };
      activeModulePrivileges.forEach(p => { updated[p.key] = checked; });
      ACTION_PRIVILEGES.forEach(p => { updated[p.key] = checked; });
      return updated;
    });
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      return toast.error('Role Name is required');
    }

    setSubmitting(true);
    try {
      if (editingRole) {
        await roleService.updateRole(editingRole.id, {
          name: roleName,
          description,
          privileges,
        });
        toast.success('Role updated successfully!');
      } else {
        await roleService.createRole({
          name: roleName,
          description,
          privileges,
        });
        toast.success('Role created successfully!');
      }
      handleCloseModal();
      loadRoles();
    } catch (err) {
      toast.error('Failed to save role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.isSystem) {
      return toast.error('System default roles cannot be deleted');
    }
    if (!window.confirm(`Are you sure you want to delete role "${role.name}"?`)) return;

    try {
      await roleService.deleteRole(role.id);
      toast.success('Role deleted successfully');
      loadRoles();
    } catch {
      toast.error('Failed to delete role');
    }
  };

  const handleDuplicate = (role: Role) => {
    setEditingRole(null);
    setRoleName(`${role.name} (Copy)`);
    setDescription(role.description || '');
    setPrivileges(parsePrivileges(role.privileges));
    setIsModalOpen(true);
  };

  const isAllSelected = [...activeModulePrivileges, ...ACTION_PRIVILEGES].every(p => !!privileges[p.key]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/staff')}
            className="p-2 hover:bg-white rounded-lg transition border border-gray-200 text-gray-600"
            title="Back to Staff"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#1D4ED8]" />
              Role & Privileges Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Define custom user roles and bind specific module & action privileges to each role.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadRoles}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add New Role
          </button>
        </div>
      </div>

      {/* Roles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 animate-pulse h-48" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map(role => {
            const rolePrivs = parsePrivileges(role.privileges);
            const activePrivCount = Object.keys(rolePrivs).filter(k => rolePrivs[k]).length;

            return (
              <div
                key={role.id}
                className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#1D4ED8] flex items-center justify-center font-bold">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          {role.name}
                          {role.isSystem && (
                            <span className="text-[10px] uppercase font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              System Default
                            </span>
                          )}
                        </h3>
                        <span className="text-xs text-blue-600 font-medium">
                          {activePrivCount} Privileges Granted
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {role.description || 'No description provided.'}
                  </p>

                  {/* Highlights */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {rolePrivs.edit && (
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                        Can Edit
                      </span>
                    )}
                    {rolePrivs.delete && (
                      <span className="text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
                        Can Delete
                      </span>
                    )}
                    {Object.keys(rolePrivs)
                      .filter(k => rolePrivs[k] && k !== 'edit' && k !== 'delete')
                      .slice(0, 4)
                      .map(pKey => (
                        <span key={pKey} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded capitalize">
                          {pKey}
                        </span>
                      ))}
                    {activePrivCount > 6 && (
                      <span className="text-xs text-gray-500 self-center">
                        +{activePrivCount - 6} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleDuplicate(role)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                    title="Duplicate Role"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenModal(role)}
                    className="px-3 py-1.5 text-xs font-medium text-[#1D4ED8] bg-blue-50 hover:bg-blue-100 rounded-lg transition flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Configure Privileges
                  </button>
                  {!role.isSystem && (
                    <button
                      onClick={() => handleDeleteRole(role)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                      title="Delete Role"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Role Config Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-[#1D4ED8] rounded-lg">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {editingRole ? `Configure Role: ${editingRole.name}` : 'Create New Dynamic Role'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    Set permissions bound to this role. Any user with this role receives these exact privileges.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveRole} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    value={roleName}
                    onChange={e => setRoleName(e.target.value)}
                    placeholder="e.g. Senior Receptionist"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1D4ED8] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Brief description of role responsibilities"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1D4ED8] outline-none"
                  />
                </div>
              </div>

              {/* Privilege Section */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Bound Privilege Matrix</h4>
                    <p className="text-xs text-gray-500">Select which modules and actions this role can perform.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(!isAllSelected)}
                    className="text-xs text-[#1D4ED8] hover:underline font-semibold"
                  >
                    {isAllSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                {/* Global Actions */}
                <div className="p-4 bg-amber-50/50 border-b border-gray-200">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-2">
                    Action Controls (Global)
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ACTION_PRIVILEGES.map(action => (
                      <label
                        key={action.key}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                          privileges[action.key]
                            ? 'bg-white border-blue-500 shadow-sm'
                            : 'bg-gray-50 border-gray-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!privileges[action.key]}
                          onChange={() => togglePrivilege(action.key)}
                          className="w-4 h-4 text-[#1D4ED8] rounded border-gray-300 focus:ring-[#1D4ED8]"
                        />
                        <span className="text-xs font-semibold text-gray-800">{action.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Modules Grid */}
                <div className="p-4">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">
                    Module Access Permissions
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {activeModulePrivileges.map(mod => (
                      <label
                        key={mod.key}
                        className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                          privileges[mod.key]
                            ? 'bg-blue-50/70 border-blue-300 text-blue-900 font-medium'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!privileges[mod.key]}
                          onChange={() => togglePrivilege(mod.key)}
                          className="w-4 h-4 text-[#1D4ED8] rounded border-gray-300 focus:ring-[#1D4ED8]"
                        />
                        <span>{mod.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition flex items-center gap-2"
                >
                  {submitting ? 'Saving...' : editingRole ? 'Update Role Privileges' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
