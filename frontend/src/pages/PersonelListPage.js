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
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Upload,
  Filter,
  Users,
  Loader2,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

export const PersonelListPage = () => {
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [migrating, setMigrating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (kategoriFilter && kategoriFilter !== 'all') params.append('kategori', kategoriFilter);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await api.get(`/personel?${params.toString()}`);
      setData(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching personel:', error);
    } finally {
      setLoading(false);
    }
  }, [api, search, kategoriFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleImport = async () => {
    if (!importFile) return;
    
    setImporting(true);
    setImportResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      
      const response = await api.post('/import/personel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setImportResult({ success: true, ...response.data });
      fetchData();
    } catch (error) {
      setImportResult({ 
        success: false, 
        message: error.response?.data?.detail || 'Gagal import data'
      });
    } finally {
      setImporting(false);
    }
  };

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      const response = await api.post('/migrate/old-data');
      alert(response.data.message);
      fetchData();
    } catch (error) {
      alert('Gagal migrasi: ' + (error.response?.data?.detail || error.message));
    } finally {
      setMigrating(false);
    }
  };

  const getKategoriBadge = (kategori) => {
    const colors = {
      'PERWIRA': 'bg-blue-100 text-blue-800',
      'BINTARA': 'bg-green-100 text-green-800',
      'TAMTAMA': 'bg-amber-100 text-amber-800',
      'PNS': 'bg-purple-100 text-purple-800'
    };
    return <Badge className={colors[kategori] || 'bg-gray-100 text-gray-800'}>{kategori}</Badge>;
  };

  const getStatusBadge = (status) => {
    const variants = {
      'AKTIF': 'bg-green-100 text-green-800',
      'PENSIUN': 'bg-gray-100 text-gray-800',
      'MUTASI': 'bg-blue-100 text-blue-800'
    };
    return <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  const canEdit = user?.role === 'admin' || user?.role === 'staff';

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="personel-list-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Personel</h1>
          <p className="text-muted-foreground">Kelola data personel Arhanud</p>
        </div>
        {canEdit && (
          <div className="flex gap-2 flex-wrap">
            {user?.role === 'admin' && (
              <Button
                variant="outline"
                onClick={handleMigrate}
                disabled={migrating}
              >
                {migrating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Migrasi Data Lama
              </Button>
            )}
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
              onClick={() => navigate('/personel/baru')}
              data-testid="add-personel-btn"
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
                placeholder="Cari nama atau NRP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
            <Select value={kategoriFilter} onValueChange={setKategoriFilter}>
              <SelectTrigger className="w-full sm:w-40" data-testid="kategori-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                <SelectItem value="PERWIRA">Perwira</SelectItem>
                <SelectItem value="BINTARA">Bintara</SelectItem>
                <SelectItem value="TAMTAMA">Tamtama</SelectItem>
                <SelectItem value="PNS">PNS</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40" data-testid="status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="AKTIF">Aktif</SelectItem>
                <SelectItem value="PENSIUN">Pensiun</SelectItem>
                <SelectItem value="MUTASI">Mutasi</SelectItem>
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
            <Badge variant="secondary" className="ml-2">{total} data</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : data.length === 0 ? (
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
                    <TableHead>Kategori</TableHead>
                    <TableHead>Pangkat</TableHead>
                    <TableHead className="hidden lg:table-cell">Jabatan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((p) => (
                    <TableRow key={p.nrp} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{p.nrp}</TableCell>
                      <TableCell className="font-medium">{p.nama_lengkap}</TableCell>
                      <TableCell>{getKategoriBadge(p.kategori)}</TableCell>
                      <TableCell>
                        <Badge className="bg-amber-100 text-amber-900 border-amber-300">
                          {p.pangkat}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell max-w-xs truncate">
                        {p.jabatan_sekarang}
                      </TableCell>
                      <TableCell>{getStatusBadge(p.status_personel)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/personel/${p.nrp}`)}
                            data-testid={`view-${p.nrp}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/personel/${p.nrp}/edit`)}
                              data-testid={`edit-${p.nrp}`}
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
              Upload file Excel dengan format: PERWIRA dan BINTARA sebagai section header, 
              kolom: NO, NAMA, PANGKAT, NRP, JABATAN, TMT, TGL LAHIR, PRESTASI, DIKBANGUM, TAHUN, DIKBANGSPES, TAHUN
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setImportFile(e.target.files[0])}
              data-testid="import-file-input"
            />
            {importResult && (
              <Alert variant={importResult.success ? 'default' : 'destructive'}>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  {importResult.message || `${importResult.imported} data berhasil diimport, ${importResult.skipped} dilewati`}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Batal</Button>
            <Button
              onClick={handleImport}
              disabled={!importFile || importing}
              className="bg-[#4A5D23] hover:bg-[#3d4d1c]"
              data-testid="import-submit-btn"
            >
              {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PersonelListPage;
