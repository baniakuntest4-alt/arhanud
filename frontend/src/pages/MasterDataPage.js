import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
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
import {
  Database,
  Plus,
  Edit,
  Trash2,
  Award,
  Briefcase,
  Building,
  Shield,
  BookOpen,
  Heart,
  Loader2,
  CheckCircle,
  AlertCircle,
  Search
} from 'lucide-react';

// Reference type configurations
const REF_TYPES = {
  pangkat: {
    label: 'Pangkat',
    icon: Award,
    description: 'Data pangkat/golongan',
    fields: [
      { name: 'kode', label: 'Kode', required: true, placeholder: 'MAYOR' },
      { name: 'nama', label: 'Nama Lengkap', required: true, placeholder: 'Mayor' },
      { name: 'golongan', label: 'Golongan', required: false, placeholder: 'IV/a' },
      { name: 'kategori', label: 'Kategori', required: false, type: 'select', options: ['PERWIRA', 'BINTARA', 'TAMTAMA', 'PNS'] },
      { name: 'urutan', label: 'Urutan', required: false, type: 'number', placeholder: '10' },
    ]
  },
  jabatan: {
    label: 'Jabatan',
    icon: Briefcase,
    description: 'Data jabatan/posisi',
    fields: [
      { name: 'kode', label: 'Kode', required: true, placeholder: 'DANDENARHANUD' },
      { name: 'nama', label: 'Nama Jabatan', required: true, placeholder: 'Komandan Detasemen Arhanud' },
      { name: 'tingkat', label: 'Tingkat', required: false, placeholder: 'ESELON_3' },
    ]
  },
  satuan: {
    label: 'Satuan',
    icon: Building,
    description: 'Data satuan/unit',
    fields: [
      { name: 'kode', label: 'Kode', required: true, placeholder: '003_ARK' },
      { name: 'nama', label: 'Nama Satuan', required: true, placeholder: 'DENARHANUD 003/ARK' },
      { name: 'induk', label: 'Satuan Induk', required: false, placeholder: 'KODAM_JAYA' },
    ]
  },
  korps: {
    label: 'Korps',
    icon: Shield,
    description: 'Data korps/kecabangan',
    fields: [
      { name: 'kode', label: 'Kode', required: true, placeholder: 'ARH' },
      { name: 'nama', label: 'Nama Korps', required: true, placeholder: 'Arhanud' },
      { name: 'deskripsi', label: 'Deskripsi', required: false, placeholder: 'Artileri Pertahanan Udara' },
    ]
  },
  agama: {
    label: 'Agama',
    icon: Heart,
    description: 'Data agama',
    fields: [
      { name: 'kode', label: 'Kode', required: true, placeholder: 'ISLAM' },
      { name: 'nama', label: 'Nama', required: true, placeholder: 'Islam' },
    ]
  },
  jenis_diklat: {
    label: 'Jenis Diklat',
    icon: BookOpen,
    description: 'Jenis pendidikan & pelatihan',
    fields: [
      { name: 'kode', label: 'Kode', required: true, placeholder: 'DIKBANGUM' },
      { name: 'nama', label: 'Nama', required: true, placeholder: 'Pendidikan Pengembangan Umum' },
      { name: 'deskripsi', label: 'Deskripsi', required: false, placeholder: 'AKMIL, SESKOAD, dll' },
    ]
  }
};

export const MasterDataPage = () => {
  const { api } = useAuth();
  const [activeTab, setActiveTab] = useState('pangkat');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [editId, setEditId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        Object.keys(REF_TYPES).map(async (type) => {
          const res = await api.get(`/reference/${type}`);
          return { type, data: res.data };
        })
      );
      
      const dataMap = {};
      results.forEach(({ type, data }) => {
        dataMap[type] = data;
      });
      setData(dataMap);
    } catch (err) {
      console.error('Error fetching reference data:', err);
      setError('Gagal memuat data referensi');
    } finally {
      setLoading(false);
    }
  };

  const fetchTypeData = async (type) => {
    try {
      const res = await api.get(`/reference/${type}`);
      setData(prev => ({ ...prev, [type]: res.data }));
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
    }
  };

  const handleOpenAdd = () => {
    setEditMode(false);
    setEditId(null);
    setFormData({});
    setError('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditMode(true);
    setEditId(item.id);
    setFormData({ ...item });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const config = REF_TYPES[activeTab];
    
    // Validate required fields
    for (const field of config.fields) {
      if (field.required && !formData[field.name]) {
        setError(`${field.label} wajib diisi`);
        return;
      }
    }

    setProcessing(true);
    setError('');

    try {
      if (editMode) {
        await api.put(`/reference/${activeTab}/${editId}`, formData);
        setSuccess('Data berhasil diupdate');
      } else {
        await api.post(`/reference/${activeTab}`, formData);
        setSuccess('Data berhasil ditambahkan');
      }
      
      setDialogOpen(false);
      fetchTypeData(activeTab);
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal menyimpan data');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Yakin ingin menghapus data ini?')) return;

    try {
      await api.delete(`/reference/${activeTab}/${itemId}`);
      setSuccess('Data berhasil dihapus');
      fetchTypeData(activeTab);
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal menghapus data');
    }
  };

  const currentConfig = REF_TYPES[activeTab];
  const currentData = data[activeTab] || [];
  const CurrentIcon = currentConfig?.icon || Database;

  // Filter data by search term
  const filteredData = currentData.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="space-y-6" data-testid="master-data-loading">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="master-data-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Database className="w-6 h-6" />
            Master Data
          </h1>
          <p className="text-muted-foreground">Kelola data referensi sistem</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSearchTerm(''); setSuccess(''); setError(''); }}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {Object.entries(REF_TYPES).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <TabsTrigger key={key} value={key} className="flex items-center gap-1.5">
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{config.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.keys(REF_TYPES).map((type) => (
          <TabsContent key={type} value={type}>
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CurrentIcon className="w-5 h-5 text-[#4A5D23]" />
                      {REF_TYPES[type].label}
                    </CardTitle>
                    <CardDescription>{REF_TYPES[type].description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Cari..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                        data-testid="search-input"
                      />
                    </div>
                    <Button 
                      className="bg-[#4A5D23] hover:bg-[#3d4d1c]"
                      onClick={handleOpenAdd}
                      data-testid="btn-add"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredData.length === 0 ? (
                  <div className="text-center py-12">
                    <CurrentIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm ? 'Tidak ada data yang cocok' : 'Belum ada data'}
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={handleOpenAdd}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Data Pertama
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          {REF_TYPES[type].fields.map((field) => (
                            <TableHead key={field.name}>{field.label}</TableHead>
                          ))}
                          <TableHead className="text-right w-24">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.map((item, idx) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                            {REF_TYPES[type].fields.map((field) => (
                              <TableCell key={field.name}>
                                {field.name === 'kode' ? (
                                  <Badge variant="outline" className="font-mono">
                                    {item[field.name] || '-'}
                                  </Badge>
                                ) : field.name === 'kategori' ? (
                                  item[field.name] ? (
                                    <Badge className={
                                      item[field.name] === 'PERWIRA' ? 'bg-blue-100 text-blue-800' :
                                      item[field.name] === 'BINTARA' ? 'bg-green-100 text-green-800' :
                                      item[field.name] === 'TAMTAMA' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }>
                                      {item[field.name]}
                                    </Badge>
                                  ) : '-'
                                ) : (
                                  item[field.name] || '-'
                                )}
                              </TableCell>
                            ))}
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenEdit(item)}
                                  data-testid={`btn-edit-${item.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDelete(item.id)}
                                  data-testid={`btn-delete-${item.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="mt-4 text-sm text-muted-foreground">
                  Total: {filteredData.length} data
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog Add/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CurrentIcon className="w-5 h-5" />
              {editMode ? 'Edit' : 'Tambah'} {currentConfig?.label}
            </DialogTitle>
            <DialogDescription>
              {editMode ? 'Edit data yang sudah ada' : 'Tambahkan data baru ke sistem'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {currentConfig?.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                
                {field.type === 'select' ? (
                  <Select 
                    value={formData[field.name] || ''} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, [field.name]: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Pilih ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={field.type || 'text'}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                    data-testid={`input-${field.name}`}
                  />
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={processing}
              className="bg-[#4A5D23] hover:bg-[#3d4d1c]"
              data-testid="btn-save"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Simpan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MasterDataPage;
