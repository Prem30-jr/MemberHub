import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Plans from './pages/Plans';
import Payments from './pages/Payments';
import Notifications from './pages/Notifications';

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
                <DashboardLayout>
                  <Dashboard />
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
