import { Navigate, Outlet, useLocation } from 'react-router-dom';

export function RequireAuth() {
  const location = useLocation();
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
