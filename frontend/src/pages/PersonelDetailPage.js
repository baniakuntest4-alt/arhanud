import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
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
  ArrowLeft,
  Edit,
  User,
  Award,
  Briefcase,
  GraduationCap,
  Heart,
  Trophy,
  Calendar,
  MapPin,
  Medal,
  Activity,
  FileText,
  Plus,
  Upload,
  Download,
  Trash2,
  File,
  FileImage,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
  DialogTrigger,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { Alert, AlertDescription } from '../components/ui/alert';

const InfoItem = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 py-2">
    {Icon && <Icon className="w-4 h-4 text-muted-foreground mt-1" />}
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-sm">{value || '-'}</p>
    </div>
  </div>
);

export const PersonelDetailPage = () => {
  const { api, user } = useAuth();
  const { nrp } = useParams();
  const navigate = useNavigate();
  const [personel, setPersonel] = useState(null);
  const [riwayatJabatan, setRiwayatJabatan] = useState([]);
  const [riwayatPangkat, setRiwayatPangkat] = useState([]);
  const [dikbang, setDikbang] = useState([]);
  const [prestasi, setPrestasi] = useState([]);
  const [tandaJasa, setTandaJasa] = useState([]);
  const [keluarga, setKeluarga] = useState([]);
  const [kesejahteraan, setKesejahteraan] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadForm, setUploadForm] = useState({
    file: null,
    jenis_dokumen: '',
    keterangan: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          personelRes,
          jabatanRes,
          pangkatRes,
          dikbangRes,
          prestasiRes,
          tandaJasaRes,
          keluargaRes,
          kesejahteraanRes,
          documentsRes
        ] = await Promise.all([
          api.get(`/personel/${nrp}`),
          api.get(`/personel/${nrp}/riwayat-jabatan`),
          api.get(`/personel/${nrp}/riwayat-pangkat`),
          api.get(`/personel/${nrp}/dikbang`),
          api.get(`/personel/${nrp}/prestasi`),
          api.get(`/personel/${nrp}/tanda-jasa`),
          api.get(`/personel/${nrp}/keluarga`),
          api.get(`/personel/${nrp}/kesejahteraan`),
          api.get(`/personel/${nrp}/documents`)
        ]);
        
        setPersonel(personelRes.data);
        setRiwayatJabatan(jabatanRes.data);
        setRiwayatPangkat(pangkatRes.data);
        setDikbang(dikbangRes.data);
        setPrestasi(prestasiRes.data);
        setTandaJasa(tandaJasaRes.data);
        setKeluarga(keluargaRes.data);
        setKesejahteraan(kesejahteraanRes.data);
        setDocuments(documentsRes.data || []);
      } catch (error) {
        console.error('Error fetching personel:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [api, nrp]);

  const canEdit = user?.role === 'admin' || user?.role === 'staff';

  // Document upload handlers
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm(prev => ({ ...prev, file }));
    }
  };

  const handleUploadDocument = async () => {
    if (!uploadForm.file || !uploadForm.jenis_dokumen) {
      setUploadError('File dan jenis dokumen harus diisi');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      
      const params = new URLSearchParams({
        jenis_dokumen: uploadForm.jenis_dokumen,
        keterangan: uploadForm.keterangan || ''
      });

      await api.post(`/personel/${nrp}/documents?${params.toString()}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Refresh documents list
      const docsRes = await api.get(`/personel/${nrp}/documents`);
      setDocuments(docsRes.data || []);
      
      // Reset form and close dialog
      setUploadForm({ file: null, jenis_dokumen: '', keterangan: '' });
      setUploadDialogOpen(false);
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'Gagal mengupload dokumen');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDocument = async (docId, filename) => {
    try {
      const response = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await api.delete(`/documents/${docId}`);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const getDocIcon = (fileType) => {
    if (['.jpg', '.jpeg', '.png'].includes(fileType)) return FileImage;
    return File;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const JENIS_DOKUMEN_OPTIONS = [
    { value: 'SK_PANGKAT', label: 'SK Pangkat' },
    { value: 'SK_JABATAN', label: 'SK Jabatan' },
    { value: 'IJAZAH', label: 'Ijazah' },
    { value: 'SERTIFIKAT', label: 'Sertifikat' },
    { value: 'FOTO', label: 'Foto' },
    { value: 'LAINNYA', label: 'Lainnya' }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!personel) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold">Data tidak ditemukan</h2>
        <Button variant="outline" onClick={() => navigate('/personel')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
      </div>
    );
  }

  const dikbangum = dikbang.filter(d => d.jenis_diklat === 'DIKBANGUM');
  const dikbangspes = dikbang.filter(d => d.jenis_diklat === 'DIKBANGSPES');

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="personel-detail-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/personel')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{personel.nama_lengkap}</h1>
            <p className="text-muted-foreground">NRP: {personel.nrp}</p>
          </div>
        </div>
        {canEdit && (
          <Button
            onClick={() => navigate(`/personel/${nrp}/edit`)}
            className="bg-[#4A5D23] hover:bg-[#3d4d1c]"
            data-testid="edit-personel-btn"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Data
          </Button>
        )}
      </div>

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#4A5D23] flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">{personel.nama_lengkap}</CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge className={personel.kategori === 'PERWIRA' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                  {personel.kategori}
                </Badge>
                <Badge className="bg-amber-100 text-amber-900 border-amber-300">
                  {personel.pangkat}
                </Badge>
                <Badge className={personel.status_personel === 'AKTIF' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {personel.status_personel}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <InfoItem label="NRP" value={personel.nrp} icon={User} />
            <InfoItem label="Korps" value={personel.korps} icon={Award} />
            <InfoItem label="Jabatan" value={personel.jabatan_sekarang} icon={Briefcase} />
            <InfoItem label="Satuan" value={personel.satuan_induk} icon={MapPin} />
            <InfoItem label="TMT Pangkat" value={personel.tmt_pangkat} icon={Calendar} />
            <InfoItem label="Tempat Lahir" value={personel.tempat_lahir} icon={MapPin} />
            <InfoItem label="Tanggal Lahir" value={personel.tanggal_lahir} icon={Calendar} />
            <InfoItem label="Jenis Kelamin" value={personel.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} icon={User} />
            <InfoItem label="Agama" value={personel.agama} icon={Activity} />
            <InfoItem label="TMT Masuk Dinas" value={personel.tmt_masuk_dinas} icon={Calendar} />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="dikbang" className="w-full">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="dikbang" className="flex items-center gap-1">
            <GraduationCap className="w-4 h-4" />
            <span className="hidden sm:inline">Dikbang</span>
          </TabsTrigger>
          <TabsTrigger value="jabatan" className="flex items-center gap-1">
            <Briefcase className="w-4 h-4" />
            <span className="hidden sm:inline">Jabatan</span>
          </TabsTrigger>
          <TabsTrigger value="pangkat" className="flex items-center gap-1">
            <Award className="w-4 h-4" />
            <span className="hidden sm:inline">Pangkat</span>
          </TabsTrigger>
          <TabsTrigger value="prestasi" className="flex items-center gap-1">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Prestasi</span>
          </TabsTrigger>
          <TabsTrigger value="keluarga" className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Keluarga</span>
          </TabsTrigger>
          <TabsTrigger value="dokumen" className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Dokumen</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dikbang">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">DIKBANGUM</CardTitle>
                <CardDescription>Pendidikan Pengembangan Umum</CardDescription>
              </CardHeader>
              <CardContent>
                {dikbangum.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Tidak ada data</p>
                ) : (
                  <div className="space-y-3">
                    {dikbangum.map((d, i) => (
                      <div key={d.id} className="flex items-start justify-between gap-3 p-3 bg-muted/50 rounded-md" data-testid={`dikbangum-item-${i}`}>
                        <div className="flex items-start gap-3">
                          <span className="font-bold text-[#4A5D23]">{i + 1}.</span>
                          <div>
                            <p className="font-medium">{d.nama_diklat}</p>
                            {d.hasil && <p className="text-xs text-muted-foreground">{d.hasil}</p>}
                          </div>
                        </div>
                        {d.tahun && (
                          <Badge variant="outline" className="bg-[#4A5D23]/10 text-[#4A5D23] border-[#4A5D23]/30 shrink-0">
                            {d.tahun}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">DIKBANGSPES</CardTitle>
                <CardDescription>Pendidikan Pengembangan Spesialis</CardDescription>
              </CardHeader>
              <CardContent>
                {dikbangspes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Tidak ada data</p>
                ) : (
                  <div className="space-y-3">
                    {dikbangspes.map((d, i) => (
                      <div key={d.id} className="flex items-start justify-between gap-3 p-3 bg-muted/50 rounded-md" data-testid={`dikbangspes-item-${i}`}>
                        <div className="flex items-start gap-3">
                          <span className="font-bold text-[#4A5D23]">{i + 1}.</span>
                          <div>
                            <p className="font-medium">{d.nama_diklat}</p>
                            {d.hasil && <p className="text-xs text-muted-foreground">{d.hasil}</p>}
                          </div>
                        </div>
                        {d.tahun && (
                          <Badge variant="outline" className="bg-[#D4AF37]/10 text-[#8B7500] border-[#D4AF37]/30 shrink-0">
                            {d.tahun}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jabatan">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Jabatan</CardTitle>
            </CardHeader>
            <CardContent>
              {riwayatJabatan.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Tidak ada riwayat jabatan</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jabatan</TableHead>
                      <TableHead>Satuan</TableHead>
                      <TableHead>TMT</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riwayatJabatan.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.jabatan}</TableCell>
                        <TableCell>{r.satuan || '-'}</TableCell>
                        <TableCell>{r.tmt_jabatan}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{r.status_jabatan || 'AKTIF'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pangkat">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Pangkat</CardTitle>
            </CardHeader>
            <CardContent>
              {riwayatPangkat.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Tidak ada riwayat pangkat</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pangkat</TableHead>
                      <TableHead>TMT</TableHead>
                      <TableHead>Jenis Kenaikan</TableHead>
                      <TableHead>Dasar SK</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riwayatPangkat.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <Badge className="bg-amber-100 text-amber-900">{r.pangkat}</Badge>
                        </TableCell>
                        <TableCell>{r.tmt_pangkat}</TableCell>
                        <TableCell>{r.jenis_kenaikan || '-'}</TableCell>
                        <TableCell>{r.dasar_sk || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prestasi">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Prestasi</CardTitle>
              </CardHeader>
              <CardContent>
                {prestasi.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Tidak ada data</p>
                ) : (
                  <div className="space-y-3">
                    {prestasi.map((p) => (
                      <div key={p.id} className="p-3 bg-muted/50 rounded-md">
                        <p className="font-medium">{p.nama_prestasi}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.tingkat && `${p.tingkat} •`} {p.tahun}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tanda Jasa</CardTitle>
              </CardHeader>
              <CardContent>
                {tandaJasa.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Tidak ada data</p>
                ) : (
                  <div className="space-y-3">
                    {tandaJasa.map((t) => (
                      <div key={t.id} className="p-3 bg-muted/50 rounded-md">
                        <p className="font-medium">{t.nama_tanda_jasa}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.pemberi && `Dari: ${t.pemberi} •`} {t.tahun}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="keluarga">
          <Card>
            <CardHeader>
              <CardTitle>Data Keluarga</CardTitle>
              <CardDescription>
                {kesejahteraan && (
                  <span>Status: {kesejahteraan.status_perkawinan} • Tanggungan: {kesejahteraan.jumlah_tanggungan}</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {keluarga.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Tidak ada data keluarga</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hubungan</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Tanggal Lahir</TableHead>
                      <TableHead>Pekerjaan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keluarga.map((k) => (
                      <TableRow key={k.id}>
                        <TableCell>
                          <Badge variant="outline">{k.hubungan}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{k.nama}</TableCell>
                        <TableCell>{k.tanggal_lahir || '-'}</TableCell>
                        <TableCell>{k.pekerjaan || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dokumen">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Dokumen</CardTitle>
                  <CardDescription>Dokumen pendukung personel (SK, Ijazah, Sertifikat, dll)</CardDescription>
                </div>
                {canEdit && (
                  <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-[#4A5D23] hover:bg-[#3d4d1c]" data-testid="upload-document-btn">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Dokumen
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Dokumen</DialogTitle>
                        <DialogDescription>
                          Upload dokumen untuk {personel?.nama_lengkap}
                        </DialogDescription>
                      </DialogHeader>
                      
                      {uploadError && (
                        <Alert variant="destructive">
                          <AlertCircle className="w-4 h-4" />
                          <AlertDescription>{uploadError}</AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="jenis_dokumen">Jenis Dokumen *</Label>
                          <Select 
                            value={uploadForm.jenis_dokumen} 
                            onValueChange={(v) => setUploadForm(prev => ({ ...prev, jenis_dokumen: v }))}
                          >
                            <SelectTrigger data-testid="jenis-dokumen-select">
                              <SelectValue placeholder="Pilih jenis dokumen" />
                            </SelectTrigger>
                            <SelectContent>
                              {JENIS_DOKUMEN_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="file">File *</Label>
                          <Input 
                            type="file" 
                            onChange={handleFileChange}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            data-testid="file-input"
                          />
                          <p className="text-xs text-muted-foreground">
                            Format: PDF, JPG, PNG, DOC, DOCX. Maks 10MB
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="keterangan">Keterangan</Label>
                          <Input 
                            value={uploadForm.keterangan}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, keterangan: e.target.value }))}
                            placeholder="Keterangan tambahan (opsional)"
                            data-testid="keterangan-input"
                          />
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                          Batal
                        </Button>
                        <Button 
                          onClick={handleUploadDocument} 
                          disabled={uploading}
                          className="bg-[#4A5D23] hover:bg-[#3d4d1c]"
                          data-testid="submit-upload-btn"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Mengupload...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">Belum ada dokumen yang diupload</p>
                  {canEdit && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Klik tombol "Upload Dokumen" untuk menambahkan
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => {
                    const DocIcon = getDocIcon(doc.file_type);
                    return (
                      <div 
                        key={doc.id} 
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                        data-testid={`document-item-${doc.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-[#4A5D23]/10 rounded-lg">
                            <DocIcon className="w-6 h-6 text-[#4A5D23]" />
                          </div>
                          <div>
                            <p className="font-medium">{doc.nama_file}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">{doc.jenis_dokumen}</Badge>
                              <span>{formatFileSize(doc.file_size)}</span>
                              {doc.keterangan && <span>• {doc.keterangan}</span>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Diupload oleh {doc.uploaded_by_name} pada {new Date(doc.created_at).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadDocument(doc.id, doc.nama_file)}
                            data-testid={`download-doc-${doc.id}`}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          {canEdit && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  data-testid={`delete-doc-${doc.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Dokumen?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Dokumen "{doc.nama_file}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PersonelDetailPage;
