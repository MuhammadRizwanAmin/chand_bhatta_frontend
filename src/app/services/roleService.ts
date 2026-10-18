import api from './api';

export interface Role {
  id: number | string;
  name: string;
  description: string;
  isSystem?: boolean;
  privileges: Record<string, boolean>;
}

export const DEFAULT_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full access to all system modules, settings, edit & delete capabilities.',
    isSystem: true,
    privileges: {
      reservations: true,
      groups: true,
      rooms: true,
      floor: true,
      bed: true,
      housekeeping: true,
      hostel: true,
      transportation: true,
      customers: true,
      organization: true,
      agent: true,
      accounts: true,
      membership: true,
      pos: true,
      extra: true,
      kitchen: true,
      assets: true,
      passwords: true,
      lostfound: true,
      reputation: true,
      reports: true,
      staff: true,
      hrm: true,
      edit: true,
      delete: true,
    },
  },
  {
    id: 'housekeeping',
    name: 'Housekeeping',
    description: 'Room clean status, task checklists, and lost & found management.',
    isSystem: true,
    privileges: {
      rooms: true,
      floor: true,
      housekeeping: true,
      lostfound: true,
      edit: true,
      delete: false,
    },
  },
];

const LOCAL_STORAGE_KEY = 'dove_inn_custom_roles';

export const roleService = {
  getRoles: async (): Promise<Role[]> => {
    try {
      const res = await api.get('/roles');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // Fallback to localStorage + DEFAULT_ROLES if backend API endpoint is not active yet
    }

    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const customRoles: Role[] = JSON.parse(saved);
        // Merge custom roles with default roles
        const customMap = new Map(customRoles.map(r => [r.id, r]));
        const mergedDefaults = DEFAULT_ROLES.map(r => customMap.get(r.id) || r);
        const nonDefaults = customRoles.filter(r => !DEFAULT_ROLES.some(d => d.id === r.id));
        return [...mergedDefaults, ...nonDefaults];
      } catch (e) {
        console.error("Error parsing stored custom roles", e);
      }
    }
    return DEFAULT_ROLES;
  },

  createRole: async (roleData: Omit<Role, 'id'>): Promise<Role> => {
    const newRole: Role = {
      ...roleData,
      id: `role_${Date.now()}`,
      isSystem: false,
    };

    try {
      const res = await api.post('/roles', newRole);
      if (res.data) return res.data;
    } catch {
      // API fallback to local storage
    }

    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    const existing: Role[] = saved ? JSON.parse(saved) : [];
    const updated = [...existing, newRole];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return newRole;
  },

  updateRole: async (id: string, roleData: Partial<Role>): Promise<Role> => {
    try {
      const res = await api.put(`/roles/${id}`, roleData);
      if (res.data) return res.data;
    } catch {
      // LocalStorage update fallback
    }

    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    let existing: Role[] = saved ? JSON.parse(saved) : [];
    
    const isDefault = DEFAULT_ROLES.some(r => r.id === id);
    if (isDefault) {
      const defaultRole = DEFAULT_ROLES.find(r => r.id === id)!;
      const updatedRole = { ...defaultRole, ...roleData, id };
      existing = existing.filter(r => r.id !== id);
      existing.push(updatedRole);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
      return updatedRole;
    }

    existing = existing.map(r => r.id === id ? { ...r, ...roleData } : r);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
    const target = existing.find(r => r.id === id);
    return target || ({ id, ...roleData } as Role);
  },

  deleteRole: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/roles/${id}`);
    } catch {
      // Local storage fallback
    }

    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const existing: Role[] = JSON.parse(saved);
      const updated = existing.filter(r => r.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    }
    return true;
  }
};
