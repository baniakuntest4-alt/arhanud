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
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  FileCheck,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Eye
} from 'lucide-react';

export const VerificationPage = () => {
  const { api } = useAuth();
  const [mutations, setMutations] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [catatan, setCatatan] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [personnelMap, setPersonnelMap] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mutRes, corrRes] = await Promise.all([
        api.get('/mutation-requests'),
        api.get('/correction-requests')
      ]);
      setMutations(mutRes.data);
      setCorrections(corrRes.data);

      // Fetch personnel names
      const personnelIds = [
        ...new Set([
          ...mutRes.data.map(m => m.personnel_id),
          ...corrRes.data.map(c => c.personnel_id)
        ])
      ];
      
      const personnelData = {};
      for (const id of personnelIds) {
        try {
          const res = await api.get(`/personnel/${id}`);
          personnelData[id] = res.data;
        } catch (e) {
          personnelData[id] = { nama: 'Unknown', nrp: '-' };
        }
      }
      setPersonnelMap(personnelData);
    } catch (err) {
      setError('Gagal memuat data verifikasi');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (item, type, itemType) => {
    setSelectedItem({ ...item, itemType });
    setActionType(type);
    setCatatan('');
    setDialogOpen(true);
  };

  const processVerification = async () => {
    setProcessing(true);
    setError('');
    
    try {
      const endpoint = selectedItem.itemType === 'mutation' 
        ? `/mutation-requests/${selectedItem.id}/verify`
        : `/correction-requests/${selectedItem.id}/verify`;
      
      await api.put(endpoint, {
        status: actionType,
        catatan: catatan
      });
      
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal memproses verifikasi');
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

  const pendingMutations = mutations.filter(m => m.status === 'pending');
  const pendingCorrections = corrections.filter(c => c.status === 'pending');

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="verification-page">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Verifikasi Data</h1>
        <p className="text-muted-foreground">Periksa dan verifikasi pengajuan dari staf kepegawaian dan personel</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="mutations" className="w-full">
        <TabsList>
          <TabsTrigger value="mutations" className="flex items-center gap-2">
            <FileCheck className="w-4 h-4" />
            Mutasi/Pensiun
            {pendingMutations.length > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingMutations.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="corrections" className="flex items-center gap-2">
            <FileCheck className="w-4 h-4" />
            Koreksi Data
            {pendingCorrections.length > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingCorrections.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mutations">
          <Card>
            <CardHeader>
              <CardTitle>Pengajuan Mutasi & Pensiun</CardTitle>
              <CardDescription>Pengajuan yang memerlukan verifikasi</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : mutations.length === 0 ? (
                <div className="text-center py-12">
                  <FileCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Tidak ada pengajuan</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Personel</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Jabatan Asal</TableHead>
                      <TableHead>Jabatan Tujuan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
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
                          <Badge variant="outline">{m.jenis_mutasi}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{m.jabatan_asal}</TableCell>
                        <TableCell className="max-w-xs truncate">{m.jabatan_tujuan || '-'}</TableCell>
                        <TableCell>{getStatusBadge(m.status)}</TableCell>
                        <TableCell className="text-right">
                          {m.status === 'pending' && (
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:bg-green-50"
                                onClick={() => handleVerify(m, 'approved', 'mutation')}
                                data-testid={`approve-${m.id}`}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleVerify(m, 'rejected', 'mutation')}
                                data-testid={`reject-${m.id}`}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="corrections">
          <Card>
            <CardHeader>
              <CardTitle>Pengajuan Koreksi Data</CardTitle>
              <CardDescription>Koreksi yang diajukan oleh personel</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : corrections.length === 0 ? (
                <div className="text-center py-12">
                  <FileCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Tidak ada pengajuan koreksi</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Personel</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Nilai Lama</TableHead>
                      <TableHead>Nilai Baru</TableHead>
                      <TableHead>Alasan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {corrections.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{personnelMap[c.personnel_id]?.nama || '-'}</p>
                            <p className="text-xs text-muted-foreground">{personnelMap[c.personnel_id]?.nrp}</p>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{c.field_name}</Badge></TableCell>
                        <TableCell className="max-w-xs truncate">{c.nilai_lama}</TableCell>
                        <TableCell className="max-w-xs truncate font-medium">{c.nilai_baru}</TableCell>
                        <TableCell className="max-w-xs truncate">{c.alasan}</TableCell>
                        <TableCell>{getStatusBadge(c.status)}</TableCell>
                        <TableCell className="text-right">
                          {c.status === 'pending' && (
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:bg-green-50"
                                onClick={() => handleVerify(c, 'approved', 'correction')}
                                data-testid={`approve-corr-${c.id}`}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleVerify(c, 'rejected', 'correction')}
                                data-testid={`reject-corr-${c.id}`}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
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
              {actionType === 'approved' 
                ? 'Apakah Anda yakin ingin menyetujui pengajuan ini?'
                : 'Apakah Anda yakin ingin menolak pengajuan ini?'}
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
                data-testid="verification-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={processVerification}
              disabled={processing}
              className={actionType === 'approved' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'}
              data-testid="confirm-verification"
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

export default VerificationPage;
