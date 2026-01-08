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
  MapPin
} from 'lucide-react';

const InfoItem = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 py-3">
    {Icon && <Icon className="w-5 h-5 text-muted-foreground mt-0.5" />}
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value || '-'}</p>
    </div>
  </div>
);

export const PersonnelDetailPage = () => {
  const { api, user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [personnel, setPersonnel] = useState(null);
  const [rankHistory, setRankHistory] = useState([]);
  const [positionHistory, setPositionHistory] = useState([]);
  const [education, setEducation] = useState([]);
  const [family, setFamily] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [personnelRes, rankRes, positionRes, eduRes, familyRes] = await Promise.all([
          api.get(`/personnel/${id}`),
          api.get(`/personnel/${id}/rank-history`),
          api.get(`/personnel/${id}/position-history`),
          api.get(`/personnel/${id}/education`),
          api.get(`/personnel/${id}/family`)
        ]);
        setPersonnel(personnelRes.data);
        setRankHistory(rankRes.data);
        setPositionHistory(positionRes.data);
        setEducation(eduRes.data);
        setFamily(familyRes.data);
      } catch (error) {
        console.error('Error fetching personnel:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [api, id]);

  const canEdit = user?.role === 'admin' || user?.role === 'staff';

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!personnel) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold">Data tidak ditemukan</h2>
        <Button variant="outline" onClick={() => navigate('/personnel')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const variants = {
      active: { label: 'Aktif', class: 'bg-green-100 text-green-800' },
      pensiun: { label: 'Pensiun', class: 'bg-gray-100 text-gray-800' },
      mutasi: { label: 'Mutasi', class: 'bg-blue-100 text-blue-800' }
    };
    const variant = variants[status] || variants.active;
    return <Badge className={variant.class}>{variant.label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="personnel-detail-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/personnel')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{personnel.nama}</h1>
            <p className="text-muted-foreground">NRP: {personnel.nrp}</p>
          </div>
        </div>
        {canEdit && (
          <Button
            onClick={() => navigate(`/personnel/${id}/edit`)}
            className="bg-[#4A5D23] hover:bg-[#3d4d1c]"
            data-testid="edit-personnel-btn"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Data
          </Button>
        )}
      </div>

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-[#4A5D23] flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">{personnel.nama}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-amber-100 text-amber-900 border-amber-300">
                    {personnel.pangkat}
                  </Badge>
                  {getStatusBadge(personnel.status)}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoItem label="NRP" value={personnel.nrp} icon={User} />
            <InfoItem label="Jabatan" value={personnel.jabatan} icon={Briefcase} />
            <InfoItem label="Satuan" value={personnel.satuan} icon={MapPin} />
            <InfoItem label="TMT Jabatan" value={personnel.tmt_jabatan} icon={Calendar} />
            <InfoItem label="Tanggal Lahir" value={personnel.tanggal_lahir} icon={Calendar} />
          </div>
        </CardContent>
      </Card>

      {/* Tabs for History */}
      <Tabs defaultValue="prestasi" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="prestasi" className="flex items-center gap-1">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Prestasi</span>
          </TabsTrigger>
          <TabsTrigger value="pangkat" className="flex items-center gap-1">
            <Award className="w-4 h-4" />
            <span className="hidden sm:inline">Pangkat</span>
          </TabsTrigger>
          <TabsTrigger value="jabatan" className="flex items-center gap-1">
            <Briefcase className="w-4 h-4" />
            <span className="hidden sm:inline">Jabatan</span>
          </TabsTrigger>
          <TabsTrigger value="pendidikan" className="flex items-center gap-1">
            <GraduationCap className="w-4 h-4" />
            <span className="hidden sm:inline">Pendidikan</span>
          </TabsTrigger>
          <TabsTrigger value="keluarga" className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Keluarga</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prestasi">
          <Card>
            <CardHeader>
              <CardTitle>Prestasi</CardTitle>
              <CardDescription>Daftar prestasi dan penghargaan</CardDescription>
            </CardHeader>
            <CardContent>
              {personnel.prestasi ? (
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{personnel.prestasi}</p>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Tidak ada data prestasi</p>
              )}
              <Separator className="my-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">DIKBANGUM</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {personnel.dikbangum || '-'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">DIKBANGSPES</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {personnel.dikbangspes || '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pangkat">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Pangkat</CardTitle>
              <CardDescription>Perubahan pangkat dari waktu ke waktu</CardDescription>
            </CardHeader>
            <CardContent>
              {rankHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Tidak ada riwayat pangkat</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pangkat Lama</TableHead>
                      <TableHead>Pangkat Baru</TableHead>
                      <TableHead>TMT</TableHead>
                      <TableHead>No. SK</TableHead>
                      <TableHead>Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankHistory.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.pangkat_lama}</TableCell>
                        <TableCell>
                          <Badge className="bg-amber-100 text-amber-900">{r.pangkat_baru}</Badge>
                        </TableCell>
                        <TableCell>{r.tmt}</TableCell>
                        <TableCell>{r.nomor_sk || '-'}</TableCell>
                        <TableCell>{r.keterangan || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jabatan">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Jabatan</CardTitle>
              <CardDescription>Perubahan jabatan dari waktu ke waktu</CardDescription>
            </CardHeader>
            <CardContent>
              {positionHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Tidak ada riwayat jabatan</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jabatan Lama</TableHead>
                      <TableHead>Jabatan Baru</TableHead>
                      <TableHead>Satuan</TableHead>
                      <TableHead>TMT</TableHead>
                      <TableHead>No. SK</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positionHistory.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.jabatan_lama}</TableCell>
                        <TableCell className="font-medium">{p.jabatan_baru}</TableCell>
                        <TableCell>{p.satuan || '-'}</TableCell>
                        <TableCell>{p.tmt}</TableCell>
                        <TableCell>{p.nomor_sk || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pendidikan">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Pendidikan</CardTitle>
              <CardDescription>Pendidikan dan pelatihan yang diikuti</CardDescription>
            </CardHeader>
            <CardContent>
              {education.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Tidak ada data pendidikan</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Nama Pendidikan</TableHead>
                      <TableHead>Tahun</TableHead>
                      <TableHead>Tempat</TableHead>
                      <TableHead>Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {education.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>
                          <Badge variant="outline">{e.jenis_pendidikan}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{e.nama_pendidikan}</TableCell>
                        <TableCell>{e.tahun || '-'}</TableCell>
                        <TableCell>{e.tempat || '-'}</TableCell>
                        <TableCell>{e.keterangan || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keluarga">
          <Card>
            <CardHeader>
              <CardTitle>Data Keluarga</CardTitle>
              <CardDescription>Anggota keluarga dan tanggungan</CardDescription>
            </CardHeader>
            <CardContent>
              {family.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Tidak ada data keluarga</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hubungan</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Tanggal Lahir</TableHead>
                      <TableHead>Pekerjaan</TableHead>
                      <TableHead>Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {family.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell>
                          <Badge variant="outline">{f.hubungan}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{f.nama}</TableCell>
                        <TableCell>{f.tanggal_lahir || '-'}</TableCell>
                        <TableCell>{f.pekerjaan || '-'}</TableCell>
                        <TableCell>{f.keterangan || '-'}</TableCell>
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

export default PersonnelDetailPage;
