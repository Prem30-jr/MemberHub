import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Plans from './pages/Plans';
import Payments from './pages/Payments';
import Notifications from './pages/Notifications';
import ManageStaff from './pages/ManageStaff';

const DashboardRedirect = () => {
  const { role, loading } = useAuth();
  if (loading) return null;
  if (role === 'admin') return <Navigate to="/dashboard/admin" />;
  if (role === 'staff') return <Navigate to="/dashboard/staff" />;
  return <Navigate to="/dashboard/user" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/staff"
            element={
              <ProtectedRoute roles={['staff']}>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/user"
            element={
              <ProtectedRoute roles={['user']}>
                <DashboardLayout>
                  <div className="p-12 text-center text-slate-500 font-black uppercase tracking-widest">
                    Welcome to your Personal Hub.
                  </div>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/staff"
            element={
              <ProtectedRoute roles={['admin']}>
                <DashboardLayout>
                  <ManageStaff />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/members"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Members />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/plans"
            element={
              <ProtectedRoute roles={['admin']}>
                <DashboardLayout>
                  <Plans />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Payments />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Notifications />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
