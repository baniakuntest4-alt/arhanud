import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, Plus, Trash2, GraduationCap } from 'lucide-react';

export const PersonelFormPage = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const { nrp } = useParams();
  const isEdit = !!nrp;

  const [formData, setFormData] = useState({
    nrp: '',
    nama_lengkap: '',
    kategori: 'BINTARA',
    pangkat: '',
    korps: 'ARH',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: 'L',
    agama: 'ISLAM',
    status_personel: 'AKTIF',
    tmt_masuk_dinas: '',
    satuan_induk: '',
    jabatan_sekarang: '',
    tmt_pangkat: ''
  });
  const [refPangkat, setRefPangkat] = useState([]);
  const [refAgama, setRefAgama] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchRefs = async () => {
      try {
        const [pangkatRes, agamaRes] = await Promise.all([
          api.get('/reference/pangkat'),
          api.get('/reference/agama')
        ]);
        setRefPangkat(pangkatRes.data);
        setRefAgama(agamaRes.data);
      } catch (err) {
        console.error('Error fetching refs:', err);
      }
    };
    fetchRefs();

    if (isEdit) {
      const fetchPersonel = async () => {
        try {
          const response = await api.get(`/personel/${nrp}`);
          setFormData(response.data);
        } catch (err) {
          setError('Gagal memuat data personel');
        } finally {
          setFetchLoading(false);
        }
      };
      fetchPersonel();
    }
  }, [api, nrp, isEdit]);

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
        await api.put(`/personel/${nrp}`, formData);
        setSuccess('Data berhasil diperbarui');
      } else {
        await api.post('/personel', formData);
        setSuccess('Data berhasil ditambahkan');
        setTimeout(() => navigate(`/personel/${formData.nrp}`), 1500);
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
    <div className="space-y-6 animate-fadeIn" data-testid="personel-form-page">
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
            <CardDescription>Informasi identitas personel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nama_lengkap">Nama Lengkap *</Label>
                <Input
                  id="nama_lengkap"
                  value={formData.nama_lengkap}
                  onChange={(e) => handleChange('nama_lengkap', e.target.value)}
                  placeholder="Nama lengkap dengan gelar"
                  required
                  data-testid="input-nama"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kategori">Kategori *</Label>
                <Select value={formData.kategori} onValueChange={(v) => handleChange('kategori', v)}>
                  <SelectTrigger data-testid="select-kategori">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERWIRA">Perwira</SelectItem>
                    <SelectItem value="BINTARA">Bintara</SelectItem>
                    <SelectItem value="TAMTAMA">Tamtama</SelectItem>
                    <SelectItem value="PNS">PNS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pangkat">Pangkat *</Label>
                <Input
                  id="pangkat"
                  value={formData.pangkat}
                  onChange={(e) => handleChange('pangkat', e.target.value)}
                  placeholder="Contoh: MAYOR ARH, LETKOL ARH"
                  list="pangkat-list"
                  data-testid="input-pangkat"
                />
                <datalist id="pangkat-list">
                  {refPangkat.map((p) => (
                    <option key={p.kode} value={p.kode}>{p.nama}</option>
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="korps">Korps</Label>
                <Input
                  id="korps"
                  value={formData.korps}
                  onChange={(e) => handleChange('korps', e.target.value)}
                  placeholder="ARH"
                  data-testid="input-korps"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                <Select value={formData.jenis_kelamin} onValueChange={(v) => handleChange('jenis_kelamin', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agama">Agama</Label>
                <Select value={formData.agama} onValueChange={(v) => handleChange('agama', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {refAgama.map((a) => (
                      <SelectItem key={a.kode} value={a.kode}>{a.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempat_lahir">Tempat Lahir</Label>
                <Input
                  id="tempat_lahir"
                  value={formData.tempat_lahir}
                  onChange={(e) => handleChange('tempat_lahir', e.target.value)}
                  placeholder="Kota kelahiran"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                <Input
                  id="tanggal_lahir"
                  value={formData.tanggal_lahir}
                  onChange={(e) => handleChange('tanggal_lahir', e.target.value)}
                  placeholder="DD-MM-YYYY"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Jabatan & Penugasan</CardTitle>
            <CardDescription>Informasi jabatan dan satuan saat ini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="jabatan_sekarang">Jabatan Sekarang</Label>
                <Input
                  id="jabatan_sekarang"
                  value={formData.jabatan_sekarang}
                  onChange={(e) => handleChange('jabatan_sekarang', e.target.value)}
                  placeholder="Jabatan saat ini"
                  data-testid="input-jabatan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="satuan_induk">Satuan Induk</Label>
                <Input
                  id="satuan_induk"
                  value={formData.satuan_induk}
                  onChange={(e) => handleChange('satuan_induk', e.target.value)}
                  placeholder="Satuan penugasan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tmt_pangkat">TMT Pangkat</Label>
                <Input
                  id="tmt_pangkat"
                  value={formData.tmt_pangkat}
                  onChange={(e) => handleChange('tmt_pangkat', e.target.value)}
                  placeholder="DD-MM-YYYY"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tmt_masuk_dinas">TMT Masuk Dinas</Label>
                <Input
                  id="tmt_masuk_dinas"
                  value={formData.tmt_masuk_dinas}
                  onChange={(e) => handleChange('tmt_masuk_dinas', e.target.value)}
                  placeholder="DD-MM-YYYY"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status_personel">Status</Label>
                <Select value={formData.status_personel} onValueChange={(v) => handleChange('status_personel', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AKTIF">Aktif</SelectItem>
                    <SelectItem value="PENSIUN">Pensiun</SelectItem>
                    <SelectItem value="MUTASI">Mutasi</SelectItem>
                    <SelectItem value="MENINGGAL">Meninggal</SelectItem>
                    <SelectItem value="DIBERHENTIKAN">Diberhentikan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

export default PersonelFormPage;
