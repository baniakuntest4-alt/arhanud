import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Edit,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  ArrowLeft,
  Send
} from 'lucide-react';

export const PengajuanSayaPage = () => {
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [personel, setPersonel] = useState(null);
  const [pengajuan, setPengajuan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    jenis_pengajuan: 'koreksi',
    field_name: '',
    nilai_lama: '',
    nilai_baru: '',
    alasan: ''
  });

  // Fields yang bisa dikoreksi oleh personel
  const editableFields = [
    { value: 'nama_lengkap', label: 'Nama Lengkap' },
    { value: 'tempat_lahir', label: 'Tempat Lahir' },
    { value: 'tanggal_lahir', label: 'Tanggal Lahir' },
    { value: 'agama', label: 'Agama' },
    { value: 'alamat', label: 'Alamat' },
    { value: 'no_hp', label: 'Nomor HP' },
    { value: 'email', label: 'Email' },
    { value: 'dikbangum', label: 'Data DIKBANGUM (Pendidikan Umum)' },
    { value: 'dikbangspes', label: 'Data DIKBANGSPES (Pendidikan Spesialis)' },
    { value: 'data_keluarga', label: 'Data Keluarga' },
    { value: 'prestasi', label: 'Data Prestasi' },
    { value: 'lainnya', label: 'Lainnya' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const nrp = user?.nrp;
      
      if (!nrp) {
        setError('NRP tidak ditemukan');
        setLoading(false);
        return;
      }

      // Get personel data
      const personelRes = await api.get(`/personel/${nrp}`);
      setPersonel(personelRes.data);

      // Get pengajuan for this personel
      const pengajuanRes = await api.get('/pengajuan');
      const myPengajuan = pengajuanRes.data.filter(p => p.nrp === nrp);
      setPengajuan(myPengajuan);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      jenis_pengajuan: 'koreksi',
      field_name: '',
      nilai_lama: '',
      nilai_baru: '',
      alasan: ''
    });
    setError('');
    setSuccess('');
    setDialogOpen(true);
  };

  const handleFieldChange = (field) => {
    // Get current value from personel data
    let currentValue = '';
    if (personel && personel[field]) {
      currentValue = personel[field];
    }
    setFormData(prev => ({ ...prev, field_name: field, nilai_lama: currentValue }));
  };

  const handleSubmit = async () => {
    if (!formData.field_name || !formData.nilai_baru || !formData.alasan) {
      setError('Semua field harus diisi');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      await api.post('/pengajuan', {
        nrp: user?.nrp,
        jenis_pengajuan: 'koreksi',
        field_name: formData.field_name,
        nilai_lama: formData.nilai_lama,
        nilai_baru: formData.nilai_baru,
        alasan: formData.alasan,
        keterangan: `Pengajuan koreksi field ${formData.field_name}`
      });

      setSuccess('Pengajuan koreksi berhasil dikirim');
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal mengirim pengajuan');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { label: 'Menunggu Verifikasi', class: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
      approved: { label: 'Disetujui', class: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
      rejected: { label: 'Ditolak', class: 'bg-red-100 text-red-800 border-red-300', icon: XCircle }
    };
    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;
    return (
      <Badge className={`${variant.class} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {variant.label}
      </Badge>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingCount = pengajuan.filter(p => p.status === 'pending').length;
  const approvedCount = pengajuan.filter(p => p.status === 'approved').length;
  const rejectedCount = pengajuan.filter(p => p.status === 'rejected').length;

  if (loading) {
    return (
      <div className="space-y-6" data-testid="pengajuan-saya-loading">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="pengajuan-saya-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/profil-saya')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pengajuan Koreksi Data</h1>
            <p className="text-muted-foreground">Ajukan koreksi jika ada data yang tidak sesuai</p>
          </div>
        </div>
        <Button 
          className="bg-[#4A5D23] hover:bg-[#3d4d1c]"
          onClick={handleOpenDialog}
          data-testid="btn-new-pengajuan"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajukan Koreksi Baru
        </Button>
      </div>

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Menunggu Verifikasi</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disetujui</p>
                <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ditolak</p>
                <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pengajuan List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Riwayat Pengajuan
          </CardTitle>
          <CardDescription>Daftar semua pengajuan koreksi data yang pernah Anda buat</CardDescription>
        </CardHeader>
        <CardContent>
          {pengajuan.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Belum ada pengajuan koreksi</p>
              <p className="text-sm text-muted-foreground mt-1">
                Klik tombol "Ajukan Koreksi Baru" untuk membuat pengajuan
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Nilai Lama</TableHead>
                  <TableHead>Nilai Baru</TableHead>
                  <TableHead>Alasan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Catatan Verifikator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pengajuan.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm">{formatDate(p.created_at)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.field_name || p.jenis_pengajuan}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-sm">{p.nilai_lama || '-'}</TableCell>
                    <TableCell className="max-w-[150px] truncate text-sm font-medium">{p.nilai_baru || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{p.alasan || p.keterangan || '-'}</TableCell>
                    <TableCell>{getStatusBadge(p.status)}</TableCell>
                    <TableCell className="max-w-[150px] truncate text-sm">{p.catatan_verifikator || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Form */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Ajukan Koreksi Data
            </DialogTitle>
            <DialogDescription>
              Pilih data yang ingin dikoreksi dan isi nilai yang benar
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label>Field yang Ingin Dikoreksi *</Label>
              <Select value={formData.field_name} onValueChange={handleFieldChange}>
                <SelectTrigger data-testid="select-field">
                  <SelectValue placeholder="Pilih field" />
                </SelectTrigger>
                <SelectContent>
                  {editableFields.map((field) => (
                    <SelectItem key={field.value} value={field.value}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nilai Saat Ini</Label>
              <Textarea 
                value={formData.nilai_lama} 
                onChange={(e) => setFormData(prev => ({ ...prev, nilai_lama: e.target.value }))}
                placeholder="Nilai saat ini (jika diketahui)"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Nilai Baru yang Benar *</Label>
              <Textarea 
                value={formData.nilai_baru}
                onChange={(e) => setFormData(prev => ({ ...prev, nilai_baru: e.target.value }))}
                placeholder="Masukkan nilai yang benar"
                rows={3}
                data-testid="input-nilai-baru"
              />
            </div>

            <div className="space-y-2">
              <Label>Alasan Koreksi *</Label>
              <Textarea 
                value={formData.alasan}
                onChange={(e) => setFormData(prev => ({ ...prev, alasan: e.target.value }))}
                placeholder="Jelaskan alasan mengapa data perlu dikoreksi (sertakan bukti jika ada)"
                rows={3}
                data-testid="input-alasan"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={processing}
              className="bg-[#4A5D23] hover:bg-[#3d4d1c]"
              data-testid="submit-pengajuan"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Kirim Pengajuan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PengajuanSayaPage;
