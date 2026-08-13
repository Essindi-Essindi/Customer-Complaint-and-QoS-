import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../lib/constants';

interface Props {
  children: React.ReactNode;
  allowedRoles: Role[];
  loginPath: string;
}

export function ProtectedRoute({ children, allowedRoles, loginPath }: Props) {
  const { token, role } = useAuth();
  if (!token || !role || !allowedRoles.includes(role)) {
    return <Navigate to={loginPath} replace />;
  }
  return <>{children}</>;
}
