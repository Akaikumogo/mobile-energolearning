import { Navigate } from 'react-router-dom';
import { readCachedUser, needsOrganizationSelection } from '@/utils/auth';

export function RootRedirect() {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return <Navigate to="/welcome" replace />;
  }
  const user = readCachedUser();
  if (needsOrganizationSelection(user)) {
    return <Navigate to="/organization" replace />;
  }
  return <Navigate to="/learn" replace />;
}
