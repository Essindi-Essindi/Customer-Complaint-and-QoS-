import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardPathForRole } from '../lib/constants';

interface Props {
  children: React.ReactNode;
}

// redirect if logged in
export function GuestRoute({ children }: Props) {
  const { token, role } = useAuth();
  if (token && role) {
    return <Navigate to={dashboardPathForRole(role)} replace />;
  }
  return <>{children}</>;
}
