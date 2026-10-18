import { Navigate, Outlet } from 'react-router';
import { authService } from '../services/authService';

export function ProtectedRoute() {
  const user = authService.getUser();
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  // Housekeeping staff only see their task page
  if (user?.role?.toLowerCase() === 'housekeeping') {
    return <Navigate to="/housekeeping-tasks" replace />;
  }
  return <Outlet />;
}
