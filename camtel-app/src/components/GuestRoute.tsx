import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardPathForRole } from '../lib/constants';

interface Props {
  children: React.ReactNode;
}

// Inverse of ProtectedRoute — wraps the login/register/role-select pages so
// an already-authenticated user bounced back onto one of them (browser back
// button, a stale bookmark, retyping the URL, ...) lands on their dashboard
// instead of seeing the login form again. Without this, pressing Back after
// logging in re-renders the cached /login route from history even though
// the token is still valid, which reads as "it logged me out".
export function GuestRoute({ children }: Props) {
  const { token, role } = useAuth();
  if (token && role) {
    return <Navigate to={dashboardPathForRole(role)} replace />;
  }
  return <>{children}</>;
}
