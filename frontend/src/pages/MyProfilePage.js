import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
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
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  User,
  Award,
  Briefcase,
  GraduationCap,
  Heart,
  Trophy,
  Calendar,
  MapPin,
  Edit,
  AlertCircle,
  CheckCircle,
  Loader2,
  Clock,
  XCircle
} from 'lucide-react';

const InfoItem = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 py-3">
    {Icon && <Icon className="w-5 h-5 text-muted-foreground mt-0.5" />}
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value || '-'}</p>
    </div>
  </div>
);

export const MyProfilePage = () => {
  const { api, user: currentUser } = useAuth();
  const [personnel, setPersonnel] = useState(null);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    field_name: '',
    nilai_lama: '',
    nilai_baru: '',
    alasan: ''
  });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get personnel data by NRP
      const personnelRes = await api.get('/personnel');
      const myData = personnelRes.data.find(p => p.nrp === currentUser?.nrp);
      
      if (myData) {
        setPersonnel(myData);
        // Get correction requests
        const corrRes = await api.get('/correction-requests');
        setCorrections(corrRes.data.filter(c => c.personnel_id === myData.id));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (fieldName, currentValue) => {
    setFormData({
      field_name: fieldName,
      nilai_lama: currentValue || '',
      nilai_baru: '',
      alasan: ''
    });
    setDialogOpen(true);
    setError('');
    setSuccess('');
  };

  const handleSubmitCorrection = async () => {
    if (!formData.nilai_baru || !formData.alasan) {
      setError('Nilai baru dan alasan harus diisi');
      return;
    }

    setProcessing(true);
    setError('');
    
    try {
      await api.post('/correction-requests', {
        personnel_id: personnel.id,
        ...formData
      });
      setSuccess('Pengajuan koreksi berhasil dikirim');
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal mengajukan koreksi');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { label: 'Menunggu', class: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { label: 'Disetujui', class: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { label: 'Ditolak', class: 'bg-red-100 text-red-800', icon: XCircle }
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

  const editableFields = [
    { name: 'nama', label: 'Nama' },
    { name: 'tanggal_lahir', label: 'Tanggal Lahir' },
    { name: 'prestasi', label: 'Prestasi' },
    { name: 'dikbangum', label: 'DIKBANGUM' },
    { name: 'dikbangspes', label: 'DIKBANGSPES' }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!personnel) {
    return (
      <div className="text-center py-12" data-testid="my-profile-page">
        <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold">Data Tidak Ditemukan</h2>
        <p className="text-muted-foreground mt-2">
          Data personel dengan NRP {currentUser?.nrp} tidak ditemukan dalam sistem.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Silakan hubungi staf kepegawaian untuk mendaftarkan data Anda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="my-profile-page">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Data Diri Saya</h1>
        <p className="text-muted-foreground">Lihat dan ajukan koreksi data pribadi Anda</p>
      </div>

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#4A5D23] flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">{personnel.nama}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-amber-100 text-amber-900 border-amber-300">
                  {personnel.pangkat}
                </Badge>
                <Badge className="bg-green-100 text-green-800">Aktif</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoItem label="NRP" value={personnel.nrp} icon={User} />
            <InfoItem label="Jabatan" value={personnel.jabatan} icon={Briefcase} />
            <InfoItem label="Satuan" value={personnel.satuan} icon={MapPin} />
            <InfoItem label="TMT Jabatan" value={personnel.tmt_jabatan} icon={Calendar} />
            <InfoItem label="Tanggal Lahir" value={personnel.tanggal_lahir} icon={Calendar} />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="data" className="w-full">
        <TabsList>
          <TabsTrigger value="data">
            <User className="w-4 h-4 mr-2" />
            Data Lengkap
          </TabsTrigger>
          <TabsTrigger value="corrections">
            <Edit className="w-4 h-4 mr-2" />
            Pengajuan Koreksi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Lengkap</CardTitle>
              <CardDescription>
                Klik tombol "Ajukan Koreksi" jika ada data yang perlu diperbaiki
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Nilai</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editableFields.map((field) => (
                    <TableRow key={field.name}>
                      <TableCell className="font-medium">{field.label}</TableCell>
                      <TableCell className="max-w-md">
                        <p className="whitespace-pre-wrap">{personnel[field.name] || '-'}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(field.name, personnel[field.name])}
                          data-testid={`correct-${field.name}`}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Ajukan Koreksi
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <Separator className="my-6" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Pangkat (tidak dapat dikoreksi sendiri)</h4>
                  <Badge className="bg-amber-100 text-amber-900">{personnel.pangkat}</Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Jabatan (tidak dapat dikoreksi sendiri)</h4>
                  <p className="text-sm text-muted-foreground">{personnel.jabatan}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="corrections">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Pengajuan Koreksi</CardTitle>
              <CardDescription>Daftar koreksi data yang pernah Anda ajukan</CardDescription>
            </CardHeader>
            <CardContent>
              {corrections.length === 0 ? (
                <div className="text-center py-12">
                  <Edit className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Belum ada pengajuan koreksi</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field</TableHead>
                      <TableHead>Nilai Lama</TableHead>
                      <TableHead>Nilai Baru</TableHead>
                      <TableHead>Alasan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Catatan Verifikator</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {corrections.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <Badge variant="outline">{c.field_name}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{c.nilai_lama}</TableCell>
                        <TableCell className="max-w-xs truncate font-medium">{c.nilai_baru}</TableCell>
                        <TableCell className="max-w-xs truncate">{c.alasan}</TableCell>
                        <TableCell>{getStatusBadge(c.status)}</TableCell>
                        <TableCell className="max-w-xs truncate">{c.catatan_verifikator || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Correction Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajukan Koreksi Data</DialogTitle>
            <DialogDescription>
              Isi form berikut untuk mengajukan koreksi. Pengajuan akan diverifikasi oleh petugas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div>
              <Label>Field</Label>
              <Input value={formData.field_name} disabled />
            </div>
            <div>
              <Label>Nilai Saat Ini</Label>
              <Textarea value={formData.nilai_lama} disabled rows={2} />
            </div>
            <div>
              <Label>Nilai Baru yang Diajukan *</Label>
              <Textarea 
                value={formData.nilai_baru}
                onChange={(e) => setFormData({ ...formData, nilai_baru: e.target.value })}
                placeholder="Masukkan nilai yang benar"
                rows={3}
                data-testid="input-nilai-baru"
              />
            </div>
            <div>
              <Label>Alasan Koreksi *</Label>
              <Textarea 
                value={formData.alasan}
                onChange={(e) => setFormData({ ...formData, alasan: e.target.value })}
                placeholder="Jelaskan alasan mengapa data perlu dikoreksi"
                rows={3}
                data-testid="input-alasan"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button
              onClick={handleSubmitCorrection}
              disabled={processing}
              className="bg-[#4A5D23] hover:bg-[#3d4d1c]"
              data-testid="submit-correction"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ajukan Koreksi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyProfilePage;
