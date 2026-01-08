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

export const MutationsPage = () => {
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [mutations, setMutations] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    personnel_id: '',
    jenis_mutasi: 'mutasi',
    jabatan_asal: '',
    jabatan_tujuan: '',
    satuan_asal: '',
    satuan_tujuan: '',
    alasan: '',
    tanggal_efektif: ''
  });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [personnelMap, setPersonnelMap] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mutRes, persRes] = await Promise.all([
        api.get('/mutation-requests'),
        api.get('/personnel')
      ]);
      setMutations(mutRes.data);
      setPersonnel(persRes.data);
      
      const map = {};
      persRes.data.forEach(p => { map[p.id] = p; });
      setPersonnelMap(map);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonnelChange = (personnelId) => {
    const p = personnelMap[personnelId];
    setFormData(prev => ({
      ...prev,
      personnel_id: personnelId,
      jabatan_asal: p?.jabatan || '',
      satuan_asal: p?.satuan || ''
    }));
  };

  const handleSubmit = async () => {
    setProcessing(true);
    setError('');
    
    try {
      await api.post('/mutation-requests', formData);
      setSuccess('Pengajuan berhasil dikirim');
      setDialogOpen(false);
      fetchData();
      setFormData({
        personnel_id: '',
        jenis_mutasi: 'mutasi',
        jabatan_asal: '',
        jabatan_tujuan: '',
        satuan_asal: '',
        satuan_tujuan: '',
        alasan: '',
        tanggal_efektif: ''
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal mengajukan');
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
    <div className="space-y-6 animate-fadeIn" data-testid="mutations-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pengajuan Mutasi & Pensiun</h1>
          <p className="text-muted-foreground">Kelola pengajuan mutasi dan pensiun personel</p>
        </div>
        {canCreate && (
          <Button
            className="bg-[#4A5D23] hover:bg-[#3d4d1c]"
            onClick={() => setDialogOpen(true)}
            data-testid="new-mutation-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Buat Pengajuan
          </Button>
        )}
      </div>

      {(error || success) && (
        <Alert variant={error ? 'destructive' : 'default'} className={success ? 'bg-green-50 border-green-200' : ''}>
          {error ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
          <AlertDescription className={success ? 'text-green-800' : ''}>{error || success}</AlertDescription>
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
          ) : mutations.length === 0 ? (
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
                    <TableHead>Jabatan Asal</TableHead>
                    <TableHead>Jabatan Tujuan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mutations.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{personnelMap[m.personnel_id]?.nama || '-'}</p>
                          <p className="text-xs text-muted-foreground">{personnelMap[m.personnel_id]?.nrp}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{m.jenis_mutasi}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{m.jabatan_asal}</TableCell>
                      <TableCell className="max-w-xs truncate">{m.jabatan_tujuan || '-'}</TableCell>
                      <TableCell>{getStatusBadge(m.status)}</TableCell>
                      <TableCell className="max-w-xs truncate">{m.catatan_verifikator || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Mutation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Buat Pengajuan Baru</DialogTitle>
            <DialogDescription>Ajukan mutasi atau pensiun untuk personel</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Personel</Label>
                <Select value={formData.personnel_id} onValueChange={handlePersonnelChange}>
                  <SelectTrigger data-testid="select-personnel">
                    <SelectValue placeholder="Pilih personel" />
                  </SelectTrigger>
                  <SelectContent>
                    {personnel.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nama} ({p.nrp})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Jenis Pengajuan</Label>
                <Select value={formData.jenis_mutasi} onValueChange={(v) => setFormData({ ...formData, jenis_mutasi: v })}>
                  <SelectTrigger data-testid="select-jenis">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mutasi">Mutasi</SelectItem>
                    <SelectItem value="pensiun">Pensiun</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Jabatan Asal</Label>
                <Input value={formData.jabatan_asal} onChange={(e) => setFormData({ ...formData, jabatan_asal: e.target.value })} />
              </div>
              <div>
                <Label>Satuan Asal</Label>
                <Input value={formData.satuan_asal} onChange={(e) => setFormData({ ...formData, satuan_asal: e.target.value })} />
              </div>
            </div>
            {formData.jenis_mutasi === 'mutasi' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Jabatan Tujuan</Label>
                  <Input value={formData.jabatan_tujuan} onChange={(e) => setFormData({ ...formData, jabatan_tujuan: e.target.value })} data-testid="input-jabatan-tujuan" />
                </div>
                <div>
                  <Label>Satuan Tujuan</Label>
                  <Input value={formData.satuan_tujuan} onChange={(e) => setFormData({ ...formData, satuan_tujuan: e.target.value })} />
                </div>
              </div>
            )}
            <div>
              <Label>Tanggal Efektif</Label>
              <Input type="date" value={formData.tanggal_efektif} onChange={(e) => setFormData({ ...formData, tanggal_efektif: e.target.value })} />
            </div>
            <div>
              <Label>Alasan</Label>
              <Textarea value={formData.alasan} onChange={(e) => setFormData({ ...formData, alasan: e.target.value })} placeholder="Alasan pengajuan" data-testid="input-alasan" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button
              onClick={handleSubmit}
              disabled={processing || !formData.personnel_id}
              className="bg-[#4A5D23] hover:bg-[#3d4d1c]"
              data-testid="submit-mutation"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ajukan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MutationsPage;
