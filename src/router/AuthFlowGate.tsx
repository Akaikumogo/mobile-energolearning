import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { readCachedUser, needsOrganizationSelection } from '@/utils/auth';

/** Login qilingan, lekin majburiy parol almashtirish bosqichi tugallanmagan. */
export function AuthFlowGate() {
  const location = useLocation();
  const user = readCachedUser();
  const path = location.pathname;

  if (!user) return <Outlet />;

  if (user.mustChangePassword && !path.startsWith('/force-change-password')) {
    return <Navigate to="/force-change-password" replace />;
  }

  if (needsOrganizationSelection(user) && !path.startsWith('/organization')) {
    return <Navigate to="/organization" replace />;
  }

  return <Outlet />;
}
