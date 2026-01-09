import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  FileCheck,
  XCircle
} from 'lucide-react';

export const PengajuanPage = () => {
  const { api, user } = useAuth();
  const [pengajuan, setPengajuan] = useState([]);
  const [personelList, setPersonelList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nrp: '',
    jenis_pengajuan: 'mutasi',
    jabatan_lama: '',
    jabatan_baru: '',
    satuan_lama: '',
    satuan_baru: '',
    pangkat_baru: '',
    tmt_pangkat_baru: '',
    alasan: '',
    keterangan: ''
  });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pengajuanRes, personelRes] = await Promise.all([
        api.get('/pengajuan'),
        api.get('/personel')
      ]);
      setPengajuan(pengajuanRes.data);
      setPersonelList(personelRes.data.data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonelChange = (nrp) => {
    const p = personelList.find(x => x.nrp === nrp);
    setFormData(prev => ({
      ...prev,
      nrp: nrp,
      jabatan_lama: p?.jabatan_sekarang || '',
      satuan_lama: p?.satuan_induk || ''
    }));
  };

  const handleSubmit = async () => {
    setProcessing(true);
    setError('');
    
    try {
      await api.post('/pengajuan', formData);
      setSuccess('Pengajuan berhasil dibuat');
      setDialogOpen(false);
      fetchData();
      setFormData({
        nrp: '',
        jenis_pengajuan: 'mutasi',
        jabatan_lama: '',
        jabatan_baru: '',
        satuan_lama: '',
        satuan_baru: '',
        pangkat_baru: '',
        tmt_pangkat_baru: '',
        alasan: '',
        keterangan: ''
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal membuat pengajuan');
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

  const canCreate = user?.role === 'admin' || user?.role === 'staff';

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="pengajuan-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pengajuan</h1>
          <p className="text-muted-foreground">Kelola pengajuan mutasi, pensiun, dan kenaikan pangkat</p>
        </div>
        {canCreate && (
          <Button
            className="bg-[#4A5D23] hover:bg-[#3d4d1c]"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Buat Pengajuan
          </Button>
        )}
      </div>

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Daftar Pengajuan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : pengajuan.length === 0 ? (
            <div className="text-center py-12">
              <FileCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Belum ada pengajuan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Personel</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Catatan Verifikator</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pengajuan.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{p.nama_lengkap || p.nrp}</p>
                          <p className="text-xs text-muted-foreground">{p.pangkat}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{p.jenis_pengajuan}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{p.keterangan || p.alasan || '-'}</TableCell>
                      <TableCell>{getStatusBadge(p.status)}</TableCell>
                      <TableCell className="max-w-xs truncate">{p.catatan_verifikator || '-'}</TableCell>
                      <TableCell>{new Date(p.created_at).toLocaleDateString('id-ID')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Buat Pengajuan Baru</DialogTitle>
            <DialogDescription>Ajukan mutasi, pensiun, atau kenaikan pangkat</DialogDescription>
          </DialogHeader>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Personel</Label>
                <Select value={formData.nrp} onValueChange={handlePersonelChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih personel" />
                  </SelectTrigger>
                  <SelectContent>
                    {personelList.map((p) => (
                      <SelectItem key={p.nrp} value={p.nrp}>
                        {p.nama_lengkap} ({p.nrp})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Jenis Pengajuan</Label>
                <Select value={formData.jenis_pengajuan} onValueChange={(v) => setFormData({ ...formData, jenis_pengajuan: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mutasi">Mutasi</SelectItem>
                    <SelectItem value="pensiun">Pensiun</SelectItem>
                    <SelectItem value="kenaikan_pangkat">Kenaikan Pangkat</SelectItem>
                    <SelectItem value="koreksi">Koreksi Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.jenis_pengajuan === 'mutasi' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Jabatan Lama</Label>
                    <Input value={formData.jabatan_lama} onChange={(e) => setFormData({ ...formData, jabatan_lama: e.target.value })} />
                  </div>
                  <div>
                    <Label>Satuan Lama</Label>
                    <Input value={formData.satuan_lama} onChange={(e) => setFormData({ ...formData, satuan_lama: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Jabatan Baru</Label>
                    <Input value={formData.jabatan_baru} onChange={(e) => setFormData({ ...formData, jabatan_baru: e.target.value })} />
                  </div>
                  <div>
                    <Label>Satuan Baru</Label>
                    <Input value={formData.satuan_baru} onChange={(e) => setFormData({ ...formData, satuan_baru: e.target.value })} />
                  </div>
                </div>
              </>
            )}

            {formData.jenis_pengajuan === 'kenaikan_pangkat' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Pangkat Baru</Label>
                  <Input value={formData.pangkat_baru} onChange={(e) => setFormData({ ...formData, pangkat_baru: e.target.value })} />
                </div>
                <div>
                  <Label>TMT Pangkat Baru</Label>
                  <Input type="date" value={formData.tmt_pangkat_baru} onChange={(e) => setFormData({ ...formData, tmt_pangkat_baru: e.target.value })} />
                </div>
              </div>
            )}

            <div>
              <Label>Alasan/Keterangan</Label>
              <Textarea 
                value={formData.keterangan} 
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })} 
                placeholder="Alasan pengajuan"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button
              onClick={handleSubmit}
              disabled={processing || !formData.nrp}
              className="bg-[#4A5D23] hover:bg-[#3d4d1c]"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ajukan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PengajuanPage;
