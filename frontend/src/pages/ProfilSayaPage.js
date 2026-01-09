import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  User,
  Award,
  Briefcase,
  GraduationCap,
  Heart,
  Trophy,
  Calendar,
  MapPin,
  Medal,
  Phone,
  Mail,
  Home,
  FileText,
  Download,
  Printer,
  Users,
  Activity
} from 'lucide-react';

const InfoItem = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 py-2">
    {Icon && <Icon className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />}
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-sm break-words">{value || '-'}</p>
    </div>
  </div>
);

export const ProfilSayaPage = () => {
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [personel, setPersonel] = useState(null);
  const [riwayatJabatan, setRiwayatJabatan] = useState([]);
  const [riwayatPangkat, setRiwayatPangkat] = useState([]);
  const [dikbang, setDikbang] = useState([]);
  const [prestasi, setPrestasi] = useState([]);
  const [tandaJasa, setTandaJasa] = useState([]);
  const [keluarga, setKeluarga] = useState([]);
  const [kesejahteraan, setKesejahteraan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get NRP from user data
        const nrp = user?.nrp;
        
        if (!nrp) {
          setError('NRP tidak ditemukan. Silakan hubungi administrator.');
          setLoading(false);
          return;
        }

        const [
          personelRes,
          jabatanRes,
          pangkatRes,
          dikbangRes,
          prestasiRes,
          tandaJasaRes,
          keluargaRes,
          kesejahteraanRes
        ] = await Promise.all([
          api.get(`/personel/${nrp}`),
          api.get(`/personel/${nrp}/riwayat-jabatan`),
          api.get(`/personel/${nrp}/riwayat-pangkat`),
          api.get(`/personel/${nrp}/dikbang`),
          api.get(`/personel/${nrp}/prestasi`),
          api.get(`/personel/${nrp}/tanda-jasa`),
          api.get(`/personel/${nrp}/keluarga`),
          api.get(`/personel/${nrp}/kesejahteraan`)
        ]);
        
        setPersonel(personelRes.data);
        setRiwayatJabatan(jabatanRes.data);
        setRiwayatPangkat(pangkatRes.data);
        setDikbang(dikbangRes.data);
        setPrestasi(prestasiRes.data);
        setTandaJasa(tandaJasaRes.data);
        setKeluarga(keluargaRes.data);
        setKesejahteraan(kesejahteraanRes.data);
      } catch (err) {
        console.error('Error fetching personel:', err);
        setError('Gagal memuat data. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [api, user]);

  const dikbangum = dikbang.filter(d => d.jenis_diklat === 'DIKBANGUM');
  const dikbangspes = dikbang.filter(d => d.jenis_diklat === 'DIKBANGSPES');

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6" data-testid="profil-saya-loading">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !personel) {
    return (
      <div className="text-center py-12" data-testid="profil-saya-error">
        <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold">Data Tidak Ditemukan</h2>
        <p className="text-muted-foreground mt-2">
          {error || 'Data personel tidak ditemukan dalam sistem.'}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Silakan hubungi staf kepegawaian untuk bantuan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="profil-saya-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Diri Saya</h1>
          <p className="text-muted-foreground">Informasi lengkap data personel Anda</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} data-testid="btn-print">
            <Printer className="w-4 h-4 mr-2" />
            Cetak
          </Button>
          <Button 
            className="bg-[#4A5D23] hover:bg-[#3d4d1c]"
            onClick={() => navigate('/pengajuan-saya')}
            data-testid="btn-ajukan-koreksi"
          >
            <FileText className="w-4 h-4 mr-2" />
            Ajukan Koreksi
          </Button>
        </div>
      </div>

      {/* Main Info Card */}
      <Card className="print:shadow-none">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#4A5D23] to-[#6b8a33] flex items-center justify-center shadow-lg">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">{personel.nama_lengkap}</CardTitle>
              <p className="text-muted-foreground">NRP: {personel.nrp}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
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
      <Tabs defaultValue="dikbang" className="w-full print:hidden">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="dikbang" className="flex items-center gap-1">
            <GraduationCap className="w-4 h-4" />
            <span className="hidden sm:inline">Pendidikan</span>
          </TabsTrigger>
          <TabsTrigger value="karir" className="flex items-center gap-1">
            <Briefcase className="w-4 h-4" />
            <span className="hidden sm:inline">Riwayat Karir</span>
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

        {/* Pendidikan Tab */}
        <TabsContent value="dikbang">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#4A5D23]" />
                  DIKBANGUM
                </CardTitle>
                <CardDescription>Pendidikan Pengembangan Umum</CardDescription>
              </CardHeader>
              <CardContent>
                {dikbangum.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Tidak ada data</p>
                ) : (
                  <div className="space-y-3">
                    {dikbangum.map((d, i) => (
                      <div key={d.id} className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#4A5D23]">{i + 1}.</span>
                          <div>
                            <p className="font-medium">{d.nama_diklat}</p>
                            <p className="text-xs text-muted-foreground">{d.hasil}</p>
                          </div>
                        </div>
                        {d.tahun && (
                          <Badge variant="outline" className="bg-[#4A5D23]/10 text-[#4A5D23] border-[#4A5D23]/30">
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
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#D4AF37]" />
                  DIKBANGSPES
                </CardTitle>
                <CardDescription>Pendidikan Pengembangan Spesialis</CardDescription>
              </CardHeader>
              <CardContent>
                {dikbangspes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Tidak ada data</p>
                ) : (
                  <div className="space-y-3">
                    {dikbangspes.map((d, i) => (
                      <div key={d.id} className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#D4AF37]">{i + 1}.</span>
                          <div>
                            <p className="font-medium">{d.nama_diklat}</p>
                            <p className="text-xs text-muted-foreground">{d.hasil}</p>
                          </div>
                        </div>
                        {d.tahun && (
                          <Badge variant="outline" className="bg-[#D4AF37]/10 text-[#8B7500] border-[#D4AF37]/30">
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

        {/* Riwayat Karir Tab */}
        <TabsContent value="karir">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  Riwayat Pangkat
                </CardTitle>
              </CardHeader>
              <CardContent>
                {riwayatPangkat.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Tidak ada riwayat pangkat</p>
                ) : (
                  <div className="space-y-3">
                    {riwayatPangkat.map((r, i) => (
                      <div key={r.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                            <span className="text-xs font-bold text-amber-700">{i + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{r.pangkat}</p>
                            <p className="text-xs text-muted-foreground">TMT: {r.tmt_pangkat}</p>
                          </div>
                        </div>
                        {r.jenis_kenaikan && (
                          <Badge variant="outline">{r.jenis_kenaikan}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  Riwayat Jabatan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {riwayatJabatan.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Tidak ada riwayat jabatan</p>
                ) : (
                  <div className="space-y-3">
                    {riwayatJabatan.map((r, i) => (
                      <div key={r.id} className="p-3 bg-muted/50 rounded-md">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{r.jabatan}</p>
                            <p className="text-sm text-muted-foreground">{r.satuan || '-'}</p>
                            <p className="text-xs text-muted-foreground mt-1">TMT: {r.tmt_jabatan}</p>
                          </div>
                          <Badge variant="outline" className={r.status_jabatan === 'AKTIF' ? 'bg-green-50 text-green-700' : ''}>
                            {r.status_jabatan || 'SELESAI'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Prestasi Tab */}
        <TabsContent value="prestasi">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  Prestasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {prestasi.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Tidak ada data prestasi</p>
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
                <CardTitle className="flex items-center gap-2">
                  <Medal className="w-5 h-5 text-orange-600" />
                  Tanda Jasa
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tandaJasa.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Tidak ada data tanda jasa</p>
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

        {/* Keluarga Tab */}
        <TabsContent value="keluarga">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-600" />
                Data Keluarga
              </CardTitle>
              <CardDescription>
                {kesejahteraan && (
                  <span>Status: {kesejahteraan.status_perkawinan} • Jumlah Tanggungan: {kesejahteraan.jumlah_tanggungan || 0}</span>
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

      {/* Print-only section - shows all data */}
      <div className="hidden print:block space-y-6">
        <Separator />
        <h3 className="font-bold text-lg">Pendidikan (DIKBANG)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">DIKBANGUM</h4>
            {dikbangum.map((d, i) => (
              <p key={d.id} className="text-sm">{i + 1}. {d.nama_diklat} ({d.tahun || '-'})</p>
            ))}
          </div>
          <div>
            <h4 className="font-medium mb-2">DIKBANGSPES</h4>
            {dikbangspes.map((d, i) => (
              <p key={d.id} className="text-sm">{i + 1}. {d.nama_diklat} ({d.tahun || '-'})</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilSayaPage;
