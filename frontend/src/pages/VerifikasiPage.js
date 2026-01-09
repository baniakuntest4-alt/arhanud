import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Textarea } from '../components/ui/textarea';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import {
  FileCheck,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const VerifikasiPage = () => {
  const { api } = useAuth();
  const [pengajuan, setPengajuan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [catatan, setCatatan] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/pengajuan');
      setPengajuan(response.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (item, type) => {
    setSelectedItem(item);
    setActionType(type);
    setCatatan('');
    setDialogOpen(true);
  };

  const processVerification = async () => {
    setProcessing(true);
    try {
      await api.put(`/pengajuan/${selectedItem.id}/verify`, {
        status: actionType,
        catatan: catatan
      });
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      alert('Gagal: ' + (err.response?.data?.detail || err.message));
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

  const getJenisBadge = (jenis) => {
    const colors = {
      'mutasi': 'bg-blue-100 text-blue-800',
      'pensiun': 'bg-gray-100 text-gray-800',
      'kenaikan_pangkat': 'bg-amber-100 text-amber-800',
      'koreksi': 'bg-purple-100 text-purple-800'
    };
    return <Badge className={colors[jenis] || 'bg-gray-100 text-gray-800'}>{jenis}</Badge>;
  };

  const pendingItems = pengajuan.filter(p => p.status === 'pending');
  const processedItems = pengajuan.filter(p => p.status !== 'pending');

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="verifikasi-page">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Verifikasi Pengajuan</h1>
        <p className="text-muted-foreground">Periksa dan verifikasi pengajuan dari staf kepegawaian</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Menunggu
            {pendingItems.length > 0 && (
              <Badge variant="secondary">{pendingItems.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="processed" className="flex items-center gap-2">
            <FileCheck className="w-4 h-4" />
            Sudah Diproses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pengajuan Menunggu Verifikasi</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : pendingItems.length === 0 ? (
                <div className="text-center py-12">
                  <FileCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Tidak ada pengajuan yang menunggu</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Personel</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead>Diajukan Oleh</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingItems.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{p.nama_lengkap || p.nrp}</p>
                            <p className="text-xs text-muted-foreground">{p.pangkat}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getJenisBadge(p.jenis_pengajuan)}</TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate">{p.keterangan || p.alasan || '-'}</p>
                        </TableCell>
                        <TableCell>{p.created_by_name}</TableCell>
                        <TableCell>{new Date(p.created_at).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:bg-green-50"
                              onClick={() => handleVerify(p, 'approved')}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleVerify(p, 'rejected')}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processed">
          <Card>
            <CardHeader>
              <CardTitle>Pengajuan Sudah Diproses</CardTitle>
            </CardHeader>
            <CardContent>
              {processedItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Belum ada pengajuan yang diproses</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Personel</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Catatan</TableHead>
                      <TableHead>Diverifikasi Oleh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedItems.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{p.nama_lengkap || p.nrp}</p>
                            <p className="text-xs text-muted-foreground">{p.pangkat}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getJenisBadge(p.jenis_pengajuan)}</TableCell>
                        <TableCell>{getStatusBadge(p.status)}</TableCell>
                        <TableCell className="max-w-xs truncate">{p.catatan_verifikator || '-'}</TableCell>
                        <TableCell>{p.verified_by_name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Verification Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approved' ? 'Setujui Pengajuan' : 'Tolak Pengajuan'}
            </DialogTitle>
            <DialogDescription>
              {selectedItem && (
                <span>
                  {selectedItem.jenis_pengajuan} untuk {selectedItem.nama_lengkap || selectedItem.nrp}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Catatan Verifikator</label>
              <Textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tambahkan catatan (opsional)"
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button
              onClick={processVerification}
              disabled={processing}
              className={actionType === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : actionType === 'approved' ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Setujui
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Tolak
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerifikasiPage;
