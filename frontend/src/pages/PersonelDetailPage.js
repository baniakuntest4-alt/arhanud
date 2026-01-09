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
      </Tabs>
    </div>
  );
};

export default PersonelDetailPage;
