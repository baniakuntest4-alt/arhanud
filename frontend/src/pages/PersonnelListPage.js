import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Upload,
  Download,
  Filter,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export const PersonnelListPage = () => {
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pangkatFilter, setPangkatFilter] = useState('all');
  const [pangkatList, setPangkatList] = useState([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const fetchPersonnel = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (pangkatFilter && pangkatFilter !== 'all') params.append('pangkat', pangkatFilter);
      
      const response = await api.get(`/personnel?${params.toString()}`);
      setPersonnel(response.data);
    } catch (error) {
      console.error('Error fetching personnel:', error);
    } finally {
      setLoading(false);
    }
  }, [api, search, pangkatFilter]);

  const fetchPangkatList = useCallback(async () => {
    try {
      const response = await api.get('/reference/pangkat');
      setPangkatList(response.data);
    } catch (error) {
      console.error('Error fetching pangkat list:', error);
    }
  }, [api]);

  useEffect(() => {
    fetchPersonnel();
    fetchPangkatList();
  }, [fetchPersonnel, fetchPangkatList]);

  const handleImport = async () => {
    if (!importFile) return;
    
    setImporting(true);
    setImportResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      
      const response = await api.post('/import/personnel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setImportResult({ success: true, ...response.data });
      fetchPersonnel();
    } catch (error) {
      setImportResult({ 
        success: false, 
        message: error.response?.data?.detail || 'Gagal import data'
      });
    } finally {
      setImporting(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: { label: 'Aktif', class: 'bg-green-100 text-green-800' },
      pensiun: { label: 'Pensiun', class: 'bg-gray-100 text-gray-800' },
      mutasi: { label: 'Mutasi', class: 'bg-blue-100 text-blue-800' }
    };
    const variant = variants[status] || variants.active;
    return <Badge className={variant.class}>{variant.label}</Badge>;
  };

  const canEdit = user?.role === 'admin' || user?.role === 'staff';

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="personnel-list-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Personel</h1>
          <p className="text-muted-foreground">Kelola data personel Arhanud</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(true)}
              data-testid="import-btn"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Excel
            </Button>
            <Button
              className="bg-[#4A5D23] hover:bg-[#3d4d1c]"
              onClick={() => navigate('/personnel/new')}
              data-testid="add-personnel-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Personel
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, NRP, atau jabatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
            <Select value={pangkatFilter} onValueChange={setPangkatFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="pangkat-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter Pangkat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Pangkat</SelectItem>
                {[...new Set(pangkatList)].map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Daftar Personel
            <Badge variant="secondary" className="ml-2">{personnel.length} data</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : personnel.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Tidak ada data</h3>
              <p className="text-muted-foreground">
                {search ? 'Coba ubah kata kunci pencarian' : 'Belum ada data personel'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NRP</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Pangkat</TableHead>
                    <TableHead className="hidden md:table-cell">Jabatan</TableHead>
                    <TableHead className="hidden lg:table-cell">TMT</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personnel.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{p.nrp}</TableCell>
                      <TableCell className="font-medium">{p.nama}</TableCell>
                      <TableCell>
                        <Badge className="bg-amber-100 text-amber-900 border-amber-300">
                          {p.pangkat}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs truncate">
                        {p.jabatan}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{p.tmt_jabatan}</TableCell>
                      <TableCell>{getStatusBadge(p.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/personnel/${p.id}`)}
                            data-testid={`view-${p.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/personnel/${p.id}/edit`)}
                              data-testid={`edit-${p.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data Personel</DialogTitle>
            <DialogDescription>
              Upload file Excel (.xlsx) berisi data personel. Kolom yang diperlukan: NAMA, PANGKAT, NRP, JABATAN, TMT, TGL LAHIR.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">File Excel</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files[0])}
                data-testid="import-file-input"
              />
            </div>
            {importResult && (
              <Alert variant={importResult.success ? 'default' : 'destructive'}>
                {importResult.success ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <AlertDescription>
                  {importResult.message || `${importResult.imported} data berhasil diimport, ${importResult.skipped} data dilewati`}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importFile || importing}
              className="bg-[#4A5D23] hover:bg-[#3d4d1c]"
              data-testid="import-submit-btn"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengimport...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PersonnelListPage;
