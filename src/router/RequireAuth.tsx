import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isDevModeActive } from '@/hooks/useDevMode';

export function RequireAuth() {
  const location = useLocation();
  const token = localStorage.getItem('accessToken');
  if (!token && !isDevModeActive()) {
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
