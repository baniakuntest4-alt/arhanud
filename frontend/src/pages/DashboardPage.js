import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import {
  Users,
  FileCheck,
  AlertCircle,
  TrendingUp,
  Clock,
  Award,
  ChevronRight,
  UserPlus,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
      'CREATE_PERSONNEL': 'Menambah data personel',
      'UPDATE_PERSONNEL': 'Mengubah data personel',
      'CREATE_USER': 'Menambah user baru',
      'CREATE_MUTATION_REQUEST': 'Mengajukan mutasi/pensiun',
      'VERIFY_MUTATION_APPROVED': 'Menyetujui pengajuan',
      'VERIFY_MUTATION_REJECTED': 'Menolak pengajuan',
      'IMPORT_PERSONNEL': 'Import data personel'
    };
    return labels[action] || action;
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
    return <p className="text-sm text-muted-foreground">Tidak ada data</p>;
  }

  const maxValue = Math.max(...Object.values(data));
  const sortedData = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 8);

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

export const DashboardPage = () => {
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (err) {
        setError('Gagal memuat data dashboard');
        console.error(err);
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
          Anda login sebagai <span className="ml-1 px-2 py-0.5 rounded-md text-sm bg-white/20 text-white">{roleLabels[user?.role]}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Personel"
          value={stats?.total_personnel || 0}
          icon={Users}
          color="bg-[#4A5D23]"
          loading={loading}
        />
        <StatCard
          title="Personel Aktif"
          value={stats?.active_personnel || 0}
          icon={TrendingUp}
          color="bg-green-600"
          loading={loading}
        />
        <StatCard
          title="Menunggu Verifikasi"
          value={stats?.pending_mutations || 0}
          icon={FileCheck}
          description="Pengajuan mutasi/pensiun"
          color="bg-amber-500"
          loading={loading}
        />
        <StatCard
          title="Koreksi Data"
          value={stats?.pending_corrections || 0}
          icon={AlertCircle}
          description="Menunggu verifikasi"
          color="bg-blue-600"
          loading={loading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#D4AF37]" />
              Distribusi Pangkat
            </CardTitle>
            <CardDescription>Jumlah personel berdasarkan pangkat</CardDescription>
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
              <p className="text-sm text-muted-foreground text-center py-4">
                Belum ada aktivitas
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {(user?.role === 'admin' || user?.role === 'staff') && (
        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>Akses fitur yang sering digunakan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="justify-start h-auto py-4"
                onClick={() => navigate('/personnel/new')}
                data-testid="quick-add-personnel"
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
                onClick={() => navigate('/personnel')}
                data-testid="quick-view-personnel"
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
                onClick={() => navigate('/mutations')}
                data-testid="quick-mutations"
              >
                <FileCheck className="w-5 h-5 mr-3 text-[#4A5D23]" />
                <div className="text-left">
                  <p className="font-medium">Pengajuan</p>
                  <p className="text-xs text-muted-foreground">Mutasi & pensiun</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="justify-start h-auto py-4"
                onClick={() => navigate('/reports')}
                data-testid="quick-reports"
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

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
