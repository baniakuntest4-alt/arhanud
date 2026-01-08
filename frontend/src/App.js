import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PersonnelListPage from './pages/PersonnelListPage';
import PersonnelDetailPage from './pages/PersonnelDetailPage';
import PersonnelFormPage from './pages/PersonnelFormPage';
import VerificationPage from './pages/VerificationPage';
import UserManagementPage from './pages/UserManagementPage';
import AuditLogPage from './pages/AuditLogPage';
import ReportsPage from './pages/ReportsPage';
import MutationsPage from './pages/MutationsPage';

// Components
import Layout from './components/Layout';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#4A5D23] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#4A5D23] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      
      {/* Personnel Routes */}
      <Route path="/personnel" element={<ProtectedRoute><PersonnelListPage /></ProtectedRoute>} />
      <Route path="/personnel/new" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><PersonnelFormPage /></ProtectedRoute>} />
      <Route path="/personnel/:id" element={<ProtectedRoute><PersonnelDetailPage /></ProtectedRoute>} />
      <Route path="/personnel/:id/edit" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><PersonnelFormPage /></ProtectedRoute>} />
      
      {/* Verification Routes */}
      <Route path="/verification" element={<ProtectedRoute allowedRoles={['verifier']}><VerificationPage /></ProtectedRoute>} />
      
      {/* User Management */}
      <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagementPage /></ProtectedRoute>} />
      
      {/* Audit Log */}
      <Route path="/audit-log" element={<ProtectedRoute allowedRoles={['admin', 'leader']}><AuditLogPage /></ProtectedRoute>} />
      
      {/* Reports */}
      <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'staff', 'verifier', 'leader']}><ReportsPage /></ProtectedRoute>} />
      
      {/* Mutations */}
      <Route path="/mutations" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><MutationsPage /></ProtectedRoute>} />
      
      {/* Personnel Profile (for personnel role) */}
      <Route path="/my-profile" element={<ProtectedRoute allowedRoles={['personnel']}><PersonnelDetailPage /></ProtectedRoute>} />
      
      {/* Rank History */}
      <Route path="/rank-history" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><PersonnelListPage /></ProtectedRoute>} />
      
      {/* Position History */}
      <Route path="/position-history" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><PersonnelListPage /></ProtectedRoute>} />
      
      {/* Education */}
      <Route path="/education" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><PersonnelListPage /></ProtectedRoute>} />
      
      {/* Family */}
      <Route path="/family" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><PersonnelListPage /></ProtectedRoute>} />
      
      {/* Settings */}
      <Route path="/settings" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      
      {/* Corrections (for personnel) */}
      <Route path="/corrections" element={<ProtectedRoute allowedRoles={['personnel']}><DashboardPage /></ProtectedRoute>} />
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
