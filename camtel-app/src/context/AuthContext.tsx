import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Role } from '../lib/constants';
import type { AuthResponse } from '../lib/api';

// Mirrors dto/response/AuthResponse.java exactly.
// department: for agents = assignedService (MOBILE/ADSL/FTTH), for managers = department name.
interface AuthState {
  token: string | null;
  role: Role | null;
  userId: number | null;
  name: string | null;
  department: string | null; // agent's service or manager's department
}

interface AuthContextType extends AuthState {
  login: (data: AuthResponse) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'camtel_auth';

function loadStored(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { token: null, role: null, userId: null, name: null, department: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadStored);

  const login = useCallback((data: AuthResponse) => {
    const next: AuthState = {
      token: data.token,
      role: data.role,
      userId: data.userId,
      name: data.name,
      department: data.department ?? null,
    };
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const logout = useCallback(() => {
    setState({ token: null, role: null, userId: null, name: null, department: null });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
      <AuthContext.Provider
          value={{
            ...state,
            login,
            logout,
            isAuthenticated: !!state.token,
          }}
      >
        {children}
      </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}