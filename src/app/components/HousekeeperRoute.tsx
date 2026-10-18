import { Navigate, Outlet } from 'react-router';
import { authService } from '../services/authService';

/**
 * Wraps routes that should ONLY be accessible to the housekeeping role.
 * Redirects to login if not authenticated, or to /housekeeping-tasks if not housekeeping.
 */
export function HousekeeperRoute() {
  const user = authService.getUser();
  if (!user) return <Navigate to="/login" replace />;
  const role = user.role?.toLowerCase();
  if (role !== 'housekeeping') return <Navigate to="/" replace />;
  return <Outlet />;
}
