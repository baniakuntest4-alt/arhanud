import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  FileText,
  Download,
  Loader2,
  FileSpreadsheet,
  Users,
  BarChart3,
  AlertCircle,
  CheckCircle,
  FileDown
} from 'lucide-react';

export const ReportsPage = () => {
  const { api } = useAuth();
  const [loading, setLoading] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    kategori: 'ALL',
    status: 'ALL'
  });

  const downloadFile = async (url, filename) => {
    const response = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  };

  const handleExport = async (reportType, format) => {
    const loadingKey = `${reportType}_${format}`;
    setLoading(prev => ({ ...prev, [loadingKey]: true }));
    setError('');
    setSuccess('');

    try {
      let url = '';
      let filename = '';
      const timestamp = new Date().toISOString().split('T')[0];
      
      // Build query params
      const params = new URLSearchParams();
      if (filters.kategori && filters.kategori !== 'ALL') params.append('kategori', filters.kategori);
      if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
      const queryString = params.toString() ? `?${params.toString()}` : '';

      switch (reportType) {
        case 'personel_list':
          url = `/export/personel/${format}${queryString}`;
          filename = `data_personel_${timestamp}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
          break;
        case 'statistik':
          url = `/export/statistik/excel`;
          filename = `statistik_personel_${timestamp}.xlsx`;
          break;
        default:
          throw new Error('Jenis laporan tidak valid');
      }

      await downloadFile(url, filename);
      setSuccess(`Laporan berhasil diunduh: ${filename}`);
    } catch (err) {
      console.error('Export error:', err);
      setError(err.response?.data?.detail || 'Gagal mengunduh laporan');
    } finally {
      setLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const reports = [
    {
      id: 'personel_list',
      title: 'Daftar Personel',
      description: 'Export daftar semua personel dengan data lengkap (NRP, Nama, Pangkat, Jabatan, dll)',
      icon: Users,
      color: 'bg-blue-500',
      formats: ['excel', 'pdf'],
      hasFilters: true
    },
    {
      id: 'statistik',
      title: 'Statistik Personel',
      description: 'Ringkasan statistik personel (per kategori, per pangkat, total aktif)',
      icon: BarChart3,
      color: 'bg-green-500',
      formats: ['excel'],
      hasFilters: false
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="reports-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Laporan
        </h1>
        <p className="text-muted-foreground">Unduh laporan dalam format Excel atau PDF</p>
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Laporan</CardTitle>
          <CardDescription>Filter data yang akan di-export (berlaku untuk Daftar Personel)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={filters.kategori} onValueChange={(v) => setFilters(prev => ({ ...prev, kategori: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Kategori</SelectItem>
                  <SelectItem value="PERWIRA">Perwira</SelectItem>
                  <SelectItem value="BINTARA">Bintara</SelectItem>
                  <SelectItem value="TAMTAMA">Tamtama</SelectItem>
                  <SelectItem value="PNS">PNS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="AKTIF">Aktif</SelectItem>
                  <SelectItem value="PENSIUN">Pensiun</SelectItem>
                  <SelectItem value="MUTASI">Mutasi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFilters({ kategori: '', status: '' })}
              >
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${report.color} text-white`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle>{report.title}</CardTitle>
                    <CardDescription className="mt-1">{report.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {report.formats.includes('excel') && (
                    <Button
                      onClick={() => handleExport(report.id, 'excel')}
                      disabled={loading[`${report.id}_excel`]}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid={`export-${report.id}-excel`}
                    >
                      {loading[`${report.id}_excel`] ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                      )}
                      Download Excel
                    </Button>
                  )}
                  {report.formats.includes('pdf') && (
                    <Button
                      onClick={() => handleExport(report.id, 'pdf')}
                      disabled={loading[`${report.id}_pdf`]}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      data-testid={`export-${report.id}-pdf`}
                    >
                      {loading[`${report.id}_pdf`] ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <FileDown className="w-4 h-4 mr-2" />
                      )}
                      Download PDF
                    </Button>
                  )}
                </div>
                {report.hasFilters && (filters.kategori && filters.kategori !== 'ALL' || filters.status && filters.status !== 'ALL') && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-sm text-muted-foreground">Filter aktif:</span>
                    {filters.kategori && filters.kategori !== 'ALL' && (
                      <Badge variant="outline">{filters.kategori}</Badge>
                    )}
                    {filters.status && filters.status !== 'ALL' && (
                      <Badge variant="outline">{filters.status}</Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Catatan
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>File Excel (.xlsx) dapat dibuka di Microsoft Excel, Google Sheets, atau LibreOffice</li>
            <li>File PDF siap cetak dengan format tabel yang rapi</li>
            <li>Filter hanya berlaku untuk laporan "Daftar Personel"</li>
            <li>Untuk export biodata individu, buka halaman detail personel → Cetak</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
