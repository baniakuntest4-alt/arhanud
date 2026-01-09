import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  User,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Bell,
  Briefcase,
  GraduationCap,
  Award,
  AlertCircle,
  Calendar
} from 'lucide-react';

export const DashboardPersonelPage = () => {
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [personel, setPersonel] = useState(null);
  const [pengajuan, setPengajuan] = useState([]);
  const [dikbangCount, setDikbangCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const nrp = user?.nrp;
        
        if (!nrp) {
          setError('NRP tidak ditemukan. Silakan hubungi administrator.');
          setLoading(false);
          return;
        }

        const [personelRes, pengajuanRes, dikbangRes] = await Promise.all([
          api.get(`/personel/${nrp}`),
          api.get('/pengajuan'),
          api.get(`/personel/${nrp}/dikbang`)
        ]);

        setPersonel(personelRes.data);
        setPengajuan(pengajuanRes.data.filter(p => p.nrp === nrp));
        setDikbangCount(dikbangRes.data.length);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response?.status === 404) {
          setError('Data personel tidak ditemukan. Silakan hubungi staf kepegawaian.');
        } else {
          setError('Gagal memuat data');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [api, user]);

  const pendingPengajuan = pengajuan.filter(p => p.status === 'pending');
  const approvedPengajuan = pengajuan.filter(p => p.status === 'approved');

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  if (loading) {
    return (
      <div className="space-y-6" data-testid="dashboard-personel-loading">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12" data-testid="dashboard-personel-error">
        <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-red-600">Terjadi Kesalahan</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="dashboard-personel-page">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-[#4A5D23] to-[#6b8a33] text-white">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white/80 text-sm">{getGreeting()},</p>
              <h1 className="text-2xl font-bold">{personel?.nama_lengkap || user?.nama_lengkap}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge className="bg-white/20 text-white border-white/30">
                  {personel?.pangkat}
                </Badge>
                <span className="text-white/80 text-sm">•</span>
                <span className="text-white/90 text-sm">{personel?.jabatan_sekarang || '-'}</span>
              </div>
            </div>
            <Button 
              variant="secondary" 
              className="bg-white/20 text-white hover:bg-white/30 border-0"
              onClick={() => navigate('/profil-saya')}
              data-testid="btn-lihat-profil"
            >
              Lihat Profil
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/profil-saya')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-xl font-bold text-green-600">{personel?.status_personel || 'AKTIF'}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/profil-saya')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pendidikan</p>
                <p className="text-2xl font-bold text-[#4A5D23]">{dikbangCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#4A5D23]/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-[#4A5D23]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/pengajuan-saya')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pengajuan Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingPengajuan.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/pengajuan-saya')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pengajuan Disetujui</p>
                <p className="text-2xl font-bold text-green-600">{approvedPengajuan.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications / Pending Pengajuan */}
      {pendingPengajuan.length > 0 && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <Clock className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Anda memiliki <strong>{pendingPengajuan.length}</strong> pengajuan koreksi yang sedang menunggu verifikasi.
            <Button variant="link" className="p-0 h-auto ml-2 text-yellow-700" onClick={() => navigate('/pengajuan-saya')}>
              Lihat Detail →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#4A5D23]" />
              Ringkasan Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">NRP</span>
                <span className="font-medium">{personel?.nrp}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Pangkat</span>
                <Badge className="bg-amber-100 text-amber-900">{personel?.pangkat}</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Kategori</span>
                <Badge variant="outline">{personel?.kategori}</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Satuan</span>
                <span className="font-medium text-sm">{personel?.satuan_induk || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">TMT Pangkat</span>
                <span className="font-medium">{personel?.tmt_pangkat || '-'}</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate('/profil-saya')}
            >
              Lihat Profil Lengkap
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#4A5D23]" />
              Aksi Cepat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-4"
                onClick={() => navigate('/profil-saya')}
                data-testid="quick-profil"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Lihat Profil Saya</p>
                    <p className="text-xs text-muted-foreground">Cek data diri Anda secara lengkap</p>
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-4"
                onClick={() => navigate('/pengajuan-saya')}
                data-testid="quick-pengajuan"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Ajukan Koreksi Data</p>
                    <p className="text-xs text-muted-foreground">Koreksi data yang tidak sesuai</p>
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-4"
                onClick={() => navigate('/pengaturan')}
                data-testid="quick-pengaturan"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Award className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Pengaturan Akun</p>
                    <p className="text-xs text-muted-foreground">Ganti password dan pengaturan lainnya</p>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Pengajuan */}
      {pengajuan.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#4A5D23]" />
                Pengajuan Terakhir
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/pengajuan-saya')}>
                Lihat Semua
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pengajuan.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div>
                    <p className="font-medium text-sm">{p.field_name || p.jenis_pengajuan}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <Badge className={
                    p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    p.status === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {p.status === 'pending' ? 'Menunggu' : p.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardPersonelPage;
