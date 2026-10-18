import { authService } from '../services/authService';
import { useModule } from '../context/ModuleContext';

export const privilegeToModuleMap: Record<string, string> = {
  'reservations': 'reservation',
  'groups': 'groups',
  'rooms': 'room',
  'floor': 'floor',
  'bed': 'beds',
  'housekeeping': 'housekeeping',
  'hostel': 'hostel',
  'transportation': 'transportation',
  'customers': 'customers',
  'organization': 'organization',
  'agent': 'agent',
  'accounts': 'accounts',
  'membership': 'membership',
  'pos': 'pos',
  'extra': 'pos',
  'kitchen': 'kitchen',
  'assets': 'inventory',
  'passwords': 'passwords',
  'lostfound': 'lossfound',
  'reputation': 'reputation',
  'reports': '', // Reports might not have a specific module toggle or it's always on
  'staff': 'staff',
  'hrm': 'hrm',
};

export const usePermissions = () => {
  const user = authService.getUser();
  const { modules } = useModule();

  const roleName = (user?.role || '').toLowerCase();
  const isAdmin = roleName === 'admin';

  // If the role is 'admin', they have full edit privileges.
  // Or if they explicitly have the 'edit' privilege in their user privileges.
  const canEdit = isAdmin || !!(user?.privileges?.edit);

  // If the role is 'admin', they have delete privileges.
  // Or if they explicitly have the 'delete' privilege.
  const canDelete = isAdmin || !!(user?.privileges?.delete);

  // Keeping canEditOrDelete for backward compatibility with existing components
  const canEditOrDelete = canEdit || canDelete;

  // Helper method to check specific module privileges if needed directly in components
  const hasPrivilege = (privilegeName: string): boolean => {
    // First, if there's a module level switch, check it. Applies to everyone including admin.
    const mappedModule = privilegeToModuleMap[privilegeName];
    if (modules && mappedModule && modules[mappedModule] === false) {
      return false; // Module is disabled entirely
    }

    if (!user) return false;
    if (isAdmin) return true; // Admins have all privileges for enabled modules
    
    return !!(user.privileges && user.privileges[privilegeName]);
  };

  return {
    user,
    canEdit,
    canDelete,
    canEditOrDelete,
    hasPrivilege,
  };
};
