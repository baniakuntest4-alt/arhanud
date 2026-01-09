import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DashboardPersonelPage from './pages/DashboardPersonelPage';
import PersonelListPage from './pages/PersonelListPage';
import PersonelDetailPage from './pages/PersonelDetailPage';
import PersonelFormPage from './pages/PersonelFormPage';
import VerifikasiPage from './pages/VerifikasiPage';
import UserManagementPage from './pages/UserManagementPage';
import AuditLogPage from './pages/AuditLogPage';
import ReportsPage from './pages/ReportsPage';
import PengajuanPage from './pages/PengajuanPage';
import ProfilSayaPage from './pages/ProfilSayaPage';
import PengajuanSayaPage from './pages/PengajuanSayaPage';
import PengaturanPage from './pages/PengaturanPage';
import MasterDataPage from './pages/MasterDataPage';

// Components
import Layout from './components/Layout';

// Protected Route
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

// Public Route
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-[#4A5D23] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  const { user, isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      
      {/* Dashboard - role based */}
      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'staff', 'verifier', 'leader']}><DashboardPage /></ProtectedRoute>} />
      <Route path="/dashboard-personel" element={<ProtectedRoute allowedRoles={['personnel']}><DashboardPersonelPage /></ProtectedRoute>} />
      
      {/* Personel Data - Admin/Staff/Verifier/Leader */}
      <Route path="/personel" element={<ProtectedRoute allowedRoles={['admin', 'staff', 'verifier', 'leader']}><PersonelListPage /></ProtectedRoute>} />
      <Route path="/personel/baru" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><PersonelFormPage /></ProtectedRoute>} />
      <Route path="/personel/:nrp" element={<ProtectedRoute allowedRoles={['admin', 'staff', 'verifier', 'leader']}><PersonelDetailPage /></ProtectedRoute>} />
      <Route path="/personel/:nrp/edit" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><PersonelFormPage /></ProtectedRoute>} />
      
      {/* Personnel (User Personel) Pages */}
      <Route path="/profil-saya" element={<ProtectedRoute allowedRoles={['personnel']}><ProfilSayaPage /></ProtectedRoute>} />
      <Route path="/pengajuan-saya" element={<ProtectedRoute allowedRoles={['personnel']}><PengajuanSayaPage /></ProtectedRoute>} />
      <Route path="/pengaturan" element={<ProtectedRoute><PengaturanPage /></ProtectedRoute>} />
      
      {/* Pengajuan - Admin/Staff */}
      <Route path="/pengajuan" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><PengajuanPage /></ProtectedRoute>} />
      
      {/* Verifikasi */}
      <Route path="/verifikasi" element={<ProtectedRoute allowedRoles={['verifier']}><VerifikasiPage /></ProtectedRoute>} />
      
      {/* Users */}
      <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagementPage /></ProtectedRoute>} />
      
      {/* Master Data */}
      <Route path="/master-data" element={<ProtectedRoute allowedRoles={['admin']}><DashboardPage /></ProtectedRoute>} />
      
      {/* Laporan */}
      <Route path="/laporan" element={<ProtectedRoute allowedRoles={['admin', 'staff', 'verifier', 'leader']}><ReportsPage /></ProtectedRoute>} />
      
      {/* Audit Log */}
      <Route path="/audit-log" element={<ProtectedRoute allowedRoles={['admin', 'leader']}><AuditLogPage /></ProtectedRoute>} />
      
      {/* Dikbang */}
      <Route path="/dikbang" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><PersonelListPage /></ProtectedRoute>} />
      
      {/* Prestasi */}
      <Route path="/prestasi" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><PersonelListPage /></ProtectedRoute>} />
      
      {/* Kesejahteraan */}
      <Route path="/kesejahteraan" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><PersonelListPage /></ProtectedRoute>} />
      
      {/* Default - redirect based on role */}
      <Route path="/" element={
        isAuthenticated 
          ? <Navigate to={user?.role === 'personnel' ? '/dashboard-personel' : '/dashboard'} replace />
          : <Navigate to="/login" replace />
      } />
      <Route path="*" element={
        isAuthenticated 
          ? <Navigate to={user?.role === 'personnel' ? '/dashboard-personel' : '/dashboard'} replace />
          : <Navigate to="/login" replace />
      } />
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
