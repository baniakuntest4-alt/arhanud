import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { ArrowLeft, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export const PersonnelFormPage = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    nrp: '',
    nama: '',
    pangkat: '',
    jabatan: '',
    satuan: '',
    tmt_jabatan: '',
    tanggal_lahir: '',
    prestasi: '',
    dikbangum: '',
    dikbangspes: '',
    status: 'active'
  });
  const [pangkatList, setPangkatList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchPangkat = async () => {
      try {
        const response = await api.get('/reference/pangkat');
        setPangkatList([...new Set(response.data)]);
      } catch (err) {
        console.error('Error fetching pangkat:', err);
      }
    };
    fetchPangkat();

    if (isEdit) {
      const fetchPersonnel = async () => {
        try {
          const response = await api.get(`/personnel/${id}`);
          setFormData(response.data);
        } catch (err) {
          setError('Gagal memuat data personel');
        } finally {
          setFetchLoading(false);
        }
      };
      fetchPersonnel();
    }
  }, [api, id, isEdit]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isEdit) {
        await api.put(`/personnel/${id}`, formData);
        setSuccess('Data berhasil diperbarui');
      } else {
        const response = await api.post('/personnel', formData);
        setSuccess('Data berhasil ditambahkan');
        setTimeout(() => navigate(`/personnel/${response.data.id}`), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#4A5D23]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="personnel-form-page">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEdit ? 'Edit Data Personel' : 'Tambah Personel Baru'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Ubah data personel yang sudah ada' : 'Masukkan data personel baru'}
          </p>
        </div>
      </div>

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

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Data Dasar</CardTitle>
            <CardDescription>Informasi dasar personel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nrp">NRP *</Label>
                <Input
                  id="nrp"
                  value={formData.nrp}
                  onChange={(e) => handleChange('nrp', e.target.value)}
                  placeholder="Nomor Registrasi Pokok"
                  required
                  disabled={isEdit}
                  data-testid="input-nrp"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap *</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => handleChange('nama', e.target.value)}
                  placeholder="Nama lengkap dengan gelar"
                  required
                  data-testid="input-nama"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pangkat">Pangkat *</Label>
                <Select
                  value={formData.pangkat}
                  onValueChange={(value) => handleChange('pangkat', value)}
                >
                  <SelectTrigger data-testid="select-pangkat">
                    <SelectValue placeholder="Pilih pangkat" />
                  </SelectTrigger>
                  <SelectContent>
                    {pangkatList.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                <Input
                  id="tanggal_lahir"
                  value={formData.tanggal_lahir}
                  onChange={(e) => handleChange('tanggal_lahir', e.target.value)}
                  placeholder="DD-MM-YYYY"
                  data-testid="input-tanggal-lahir"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Jabatan & Penugasan</CardTitle>
            <CardDescription>Informasi jabatan dan satuan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="jabatan">Jabatan *</Label>
                <Input
                  id="jabatan"
                  value={formData.jabatan}
                  onChange={(e) => handleChange('jabatan', e.target.value)}
                  placeholder="Jabatan lengkap"
                  required
                  data-testid="input-jabatan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="satuan">Satuan</Label>
                <Input
                  id="satuan"
                  value={formData.satuan}
                  onChange={(e) => handleChange('satuan', e.target.value)}
                  placeholder="Satuan penugasan"
                  data-testid="input-satuan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tmt_jabatan">TMT Jabatan</Label>
                <Input
                  id="tmt_jabatan"
                  value={formData.tmt_jabatan}
                  onChange={(e) => handleChange('tmt_jabatan', e.target.value)}
                  placeholder="DD-MM-YYYY"
                  data-testid="input-tmt"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value)}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="pensiun">Pensiun</SelectItem>
                    <SelectItem value="mutasi">Mutasi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Pendidikan & Prestasi</CardTitle>
            <CardDescription>Riwayat pendidikan dan prestasi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="dikbangum">DIKBANGUM (Pendidikan Pengembangan Umum)</Label>
              <Textarea
                id="dikbangum"
                value={formData.dikbangum}
                onChange={(e) => handleChange('dikbangum', e.target.value)}
                placeholder="Daftar pendidikan umum yang diikuti"
                rows={3}
                data-testid="input-dikbangum"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dikbangspes">DIKBANGSPES (Pendidikan Pengembangan Spesialisasi)</Label>
              <Textarea
                id="dikbangspes"
                value={formData.dikbangspes}
                onChange={(e) => handleChange('dikbangspes', e.target.value)}
                placeholder="Daftar pendidikan spesialisasi"
                rows={3}
                data-testid="input-dikbangspes"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prestasi">Prestasi</Label>
              <Textarea
                id="prestasi"
                value={formData.prestasi}
                onChange={(e) => handleChange('prestasi', e.target.value)}
                placeholder="Daftar prestasi dan penghargaan"
                rows={4}
                data-testid="input-prestasi"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Batal
          </Button>
          <Button
            type="submit"
            className="bg-[#4A5D23] hover:bg-[#3d4d1c]"
            disabled={loading}
            data-testid="submit-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Simpan
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PersonnelFormPage;
