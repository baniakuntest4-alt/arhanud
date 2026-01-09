import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileCheck,
  TrendingUp,
  Clock,
  Award,
  UserPlus,
  FileText,
  Shield,
  AlertCircle,
  ChevronRight,
  CheckCircle,
  XCircle
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, description, color, loading }) => (
  <Card className="relative overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`p-2 rounded-md ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <>
          <div className="text-2xl font-bold">{value}</div>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </>
      )}
    </CardContent>
  </Card>
);

const ActivityItem = ({ activity }) => {
  const getActionLabel = (action) => {
    const labels = {
      'LOGIN': 'Login ke sistem',
      'LOGOUT': 'Logout dari sistem',
      'CREATE_PERSONEL': 'Menambah data personel',
      'UPDATE_PERSONEL': 'Mengubah data personel',
      'CREATE_USER': 'Menambah user baru',
      'CREATE_PENGAJUAN': 'Membuat pengajuan',
      'VERIFY_PENGAJUAN_APPROVED': 'Menyetujui pengajuan',
      'VERIFY_PENGAJUAN_REJECTED': 'Menolak pengajuan',
      'IMPORT_PERSONEL': 'Import data personel'
    };
    return labels[action] || action.replace(/_/g, ' ');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <Clock className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{getActionLabel(activity.action)}</p>
        <p className="text-xs text-muted-foreground">{activity.username} · {formatTime(activity.timestamp)}</p>
      </div>
    </div>
  );
};

const PangkatChart = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">Tidak ada data</p>;
  }

  const maxValue = Math.max(...Object.values(data));
  const sortedData = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <div className="space-y-3">
      {sortedData.map(([pangkat, count]) => (
        <div key={pangkat} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{pangkat}</span>
            <span className="text-muted-foreground">{count}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4A5D23] rounded-full transition-all duration-500"
              style={{ width: `${(count / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const KategoriChart = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">Tidak ada data</p>;
  }

  const colors = {
    'PERWIRA': 'bg-blue-500',
    'BINTARA': 'bg-green-500',
    'TAMTAMA': 'bg-amber-500',
    'PNS': 'bg-purple-500'
  };

  const total = Object.values(data).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 h-4 rounded-full overflow-hidden">
        {Object.entries(data).map(([kategori, count]) => (
          <div
            key={kategori}
            className={`${colors[kategori] || 'bg-gray-500'} transition-all`}
            style={{ width: `${(count / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(data).map(([kategori, count]) => (
          <div key={kategori} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${colors[kategori] || 'bg-gray-500'}`} />
            <span className="text-sm">{kategori}: <strong>{count}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DashboardPage = () => {
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [api]);

  const roleLabels = {
    admin: 'Administrator',
    staff: 'Staf Kepegawaian',
    verifier: 'Pejabat Verifikator',
    leader: 'Pimpinan',
    personnel: 'Personel'
  };

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="dashboard-page">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#4A5D23] to-[#5d7330] rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Selamat Datang, {user?.nama_lengkap}!</h1>
        <p className="text-white/80 mt-1">
          Anda login sebagai <span className="ml-1 px-2 py-0.5 rounded-md text-sm bg-white/20">{roleLabels[user?.role]}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Personel"
          value={stats?.total || 0}
          icon={Users}
          color="bg-[#4A5D23]"
          loading={loading}
        />
        <StatCard
          title="Personel Aktif"
          value={stats?.aktif || 0}
          icon={TrendingUp}
          color="bg-green-600"
          loading={loading}
        />
        <StatCard
          title="Menunggu Verifikasi"
          value={stats?.pending_pengajuan || 0}
          icon={FileCheck}
          description="Pengajuan pending"
          color="bg-amber-500"
          loading={loading}
        />
        <StatCard
          title="Kategori"
          value={Object.keys(stats?.by_kategori || {}).length}
          icon={Shield}
          description="Jenis kategori"
          color="bg-blue-600"
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kategori Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Distribusi Kategori
            </CardTitle>
            <CardDescription>Personel berdasarkan kategori</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <KategoriChart data={stats?.by_kategori} />
            )}
          </CardContent>
        </Card>

        {/* Pangkat Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#D4AF37]" />
              Distribusi Pangkat
            </CardTitle>
            <CardDescription>Jumlah personel per pangkat</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : (
              <PangkatChart data={stats?.by_pangkat} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : stats?.recent_activities?.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {stats.recent_activities.map((activity, idx) => (
                  <ActivityItem key={idx} activity={activity} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada aktivitas</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {(user?.role === 'admin' || user?.role === 'staff') && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
              <CardDescription>Akses fitur yang sering digunakan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => navigate('/personel/baru')}
                  data-testid="quick-add-personel"
                >
                  <UserPlus className="w-5 h-5 mr-3 text-[#4A5D23]" />
                  <div className="text-left">
                    <p className="font-medium">Tambah Personel</p>
                    <p className="text-xs text-muted-foreground">Input data baru</p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => navigate('/personel')}
                  data-testid="quick-view-personel"
                >
                  <Users className="w-5 h-5 mr-3 text-[#4A5D23]" />
                  <div className="text-left">
                    <p className="font-medium">Lihat Personel</p>
                    <p className="text-xs text-muted-foreground">Daftar semua personel</p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => navigate('/pengajuan')}
                  data-testid="quick-pengajuan"
                >
                  <FileCheck className="w-5 h-5 mr-3 text-[#4A5D23]" />
                  <div className="text-left">
                    <p className="font-medium">Pengajuan</p>
                    <p className="text-xs text-muted-foreground">Mutasi, pensiun, dll</p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => navigate('/laporan')}
                  data-testid="quick-laporan"
                >
                  <FileText className="w-5 h-5 mr-3 text-[#4A5D23]" />
                  <div className="text-left">
                    <p className="font-medium">Laporan</p>
                    <p className="text-xs text-muted-foreground">Export data</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
