import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Register from './pages/Register';
import Login from './pages/Login';
import RoleSelect from './pages/RoleSelect';
import SubmitComplaint from './pages/SubmitComplaint';
import MyComplaints from './pages/MyComplaints';
import ComplaintDetail from './pages/ComplaintDetail';
import InternalLogin from './pages/InternalLogin';
import AgentComplaints from './pages/AgentComplaints';
import ManagerDashboard from './pages/ManagerDashboard';
import ManagerHeatmap from './pages/ManagerHeatmap';
import ManagerKPIs from './pages/ManagerKPIs';
import ManagerReports from './pages/ManagerReports';
import ManagerUsers from './pages/ManagerUsers';
import ManagerConfig from './pages/ManagerConfig';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/internal/login" element={<InternalLogin />} />
          <Route path="/welcome" element={<RoleSelect />} />

          <Route
            path="/submit-complaint"
            element={
              <ProtectedRoute allowedRoles={['SUBSCRIBER']} loginPath="/login">
                <SubmitComplaint />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-complaints"
            element={
              <ProtectedRoute allowedRoles={['SUBSCRIBER']} loginPath="/login">
                <MyComplaints />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-complaints/:ticketNumber"
            element={
              <ProtectedRoute allowedRoles={['SUBSCRIBER']} loginPath="/login">
                <ComplaintDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agent/complaints"
            element={
              <ProtectedRoute allowedRoles={['AGENT']} loginPath="/internal/login">
                <AgentComplaints />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/dashboard"
            element={
              <ProtectedRoute allowedRoles={['MANAGER']} loginPath="/internal/login">
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/heatmap"
            element={
              <ProtectedRoute allowedRoles={['MANAGER']} loginPath="/internal/login">
                <ManagerHeatmap />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/kpis"
            element={
              <ProtectedRoute allowedRoles={['MANAGER']} loginPath="/internal/login">
                <ManagerKPIs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/reports"
            element={
              <ProtectedRoute allowedRoles={['MANAGER']} loginPath="/internal/login">
                <ManagerReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/users"
            element={
              <ProtectedRoute allowedRoles={['MANAGER']} loginPath="/internal/login">
                <ManagerUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/config"
            element={
              <ProtectedRoute allowedRoles={['MANAGER']} loginPath="/internal/login">
                <ManagerConfig />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/welcome" replace />} />
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
