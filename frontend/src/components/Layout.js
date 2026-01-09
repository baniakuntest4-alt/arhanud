import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Users,
  Award,
  Briefcase,
  GraduationCap,
  Heart,
  FileCheck,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  ClipboardList,
  UserCog,
  History,
  Medal,
  Activity,
  Calendar,
  Database,
  Shield
} from 'lucide-react';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_armypersonnel/artifacts/yzj1ursp_Pussenarhanud.svg.png';

const menuConfig = {
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Data Personel', path: '/personel' },
    { icon: ClipboardList, label: 'Pengajuan', path: '/pengajuan' },
    { icon: UserCog, label: 'Manajemen User', path: '/users' },
    { icon: Database, label: 'Master Data', path: '/master-data' },
    { icon: FileText, label: 'Laporan', path: '/laporan' },
    { icon: History, label: 'Audit Log', path: '/audit-log' },
  ],
  staff: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Data Personel', path: '/personel' },
    { icon: GraduationCap, label: 'Dikbang', path: '/dikbang' },
    { icon: Medal, label: 'Prestasi & Penghargaan', path: '/prestasi' },
    { icon: Heart, label: 'Kesejahteraan', path: '/kesejahteraan' },
    { icon: ClipboardList, label: 'Pengajuan', path: '/pengajuan' },
    { icon: FileText, label: 'Laporan', path: '/laporan' },
  ],
  verifier: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileCheck, label: 'Verifikasi', path: '/verifikasi' },
    { icon: Users, label: 'Data Personel', path: '/personel' },
    { icon: FileText, label: 'Laporan', path: '/laporan' },
  ],
  leader: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Data Personel', path: '/personel' },
    { icon: FileText, label: 'Laporan', path: '/laporan' },
    { icon: History, label: 'Audit Log', path: '/audit-log' },
  ],
  personnel: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard-personel' },
    { icon: Users, label: 'Profil Saya', path: '/profil-saya' },
    { icon: ClipboardList, label: 'Pengajuan Koreksi', path: '/pengajuan-saya' },
    { icon: Settings, label: 'Pengaturan', path: '/pengaturan' },
  ],
};

const roleLabels = {
  admin: 'Administrator',
  staff: 'Staf Kepegawaian',
  verifier: 'Pejabat Verifikator',
  leader: 'Pimpinan',
  personnel: 'Personel',
};

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentMenu = menuConfig[user?.role] || menuConfig.personnel;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const NavItem = ({ item, mobile = false }) => {
    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    return (
      <Link
        to={item.path}
        onClick={() => mobile && setMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${
          isActive
            ? 'bg-[#4A5D23] text-white shadow-md'
            : 'text-foreground hover:bg-muted hover:translate-x-1'
        }`}
        data-testid={`nav-${item.path.slice(1)}`}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        {(sidebarOpen || mobile) && <span className="text-sm font-medium">{item.label}</span>}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen bg-white border-r border-border transition-all duration-300 hidden lg:block ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        <div className="flex items-center h-16 px-4 border-b border-border">
          <img src={LOGO_URL} alt="Logo" className="w-10 h-10 object-contain" />
          {sidebarOpen && (
            <div className="ml-3">
              <h1 className="font-bold text-[#4A5D23] text-lg leading-tight">SIPARHANUD</h1>
              <p className="text-xs text-muted-foreground">Sistem Informasi Personel</p>
            </div>
          )}
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)]">
          <nav className="p-3 space-y-1">
            {currentMenu.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </nav>
        </ScrollArea>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 bg-white border-r border-border transform transition-transform lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <div className="flex items-center">
            <img src={LOGO_URL} alt="Logo" className="w-10 h-10 object-contain" />
            <h1 className="ml-3 font-bold text-[#4A5D23] text-lg">SIPARHANUD</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <nav className="p-3 space-y-1">
            {currentMenu.map((item) => (
              <NavItem key={item.path} item={item} mobile />
            ))}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between h-full px-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
                data-testid="mobile-menu-toggle"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                data-testid="sidebar-toggle"
              >
                <ChevronRight className={`w-5 h-5 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
              </Button>
              <div className="hidden sm:block">
                <h2 className="font-semibold text-foreground">
                  {currentMenu.find(item => location.pathname.startsWith(item.path))?.label || 'SIPARHANUD'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2" data-testid="user-menu">
                    <Avatar className="w-8 h-8 bg-[#4A5D23]">
                      <AvatarFallback className="bg-[#4A5D23] text-white text-sm">
                        {getInitials(user?.nama_lengkap)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium">{user?.nama_lengkap}</p>
                      <p className="text-xs text-muted-foreground">{roleLabels[user?.role]}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">{user?.nama_lengkap}</p>
                      <p className="text-xs text-muted-foreground">{roleLabels[user?.role]}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600" data-testid="logout-btn">
                    <LogOut className="w-4 h-4 mr-2" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
