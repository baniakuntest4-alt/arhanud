import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
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
  Award,
  Briefcase,
  AlertCircle
} from 'lucide-react';

export const ReportsPage = () => {
  const { api } = useAuth();
  const [reportType, setReportType] = useState('personnel');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async (format) => {
    setLoading(true);
    setError('');
    
    try {
      let endpoint = '';
      let filename = '';
      
      switch (reportType) {
        case 'personnel':
          endpoint = `/reports/personnel?format=${format}`;
          filename = `laporan_personel_${new Date().toISOString().split('T')[0]}`;
          break;
        case 'mutations':
          endpoint = `/reports/mutations`;
          filename = `laporan_mutasi_${new Date().toISOString().split('T')[0]}`;
          break;
        default:
          endpoint = `/reports/personnel?format=${format}`;
          filename = `laporan_${new Date().toISOString().split('T')[0]}`;
      }
      
      const response = await api.get(endpoint);
      const data = response.data.data;
      
      if (format === 'excel') {
        // Convert to CSV for download
        const columns = response.data.columns || Object.keys(data[0] || {});
        const csv = [
          columns.join(','),
          ...data.map(row => columns.map(col => `"${(row[col] || '').toString().replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        // JSON download
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError('Gagal mengunduh laporan');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reports = [
    {
      id: 'personnel',
      title: 'Laporan Data Personel',
      description: 'Daftar semua personel aktif beserta data lengkap',
      icon: Users,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'mutations',
      title: 'Laporan Mutasi & Pensiun',
      description: 'Daftar pengajuan mutasi dan pensiun',
      icon: Briefcase,
      color: 'bg-amber-100 text-amber-800'
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="reports-page">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Laporan</h1>
        <p className="text-muted-foreground">Unduh laporan dalam format Excel atau PDF</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <Card 
            key={report.id} 
            className={`cursor-pointer transition-all ${reportType === report.id ? 'ring-2 ring-[#4A5D23]' : ''}`}
            onClick={() => setReportType(report.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg ${report.color}`}>
                  <report.icon className="w-6 h-6" />
                </div>
                {reportType === report.id && (
                  <Badge className="bg-[#4A5D23] text-white">Terpilih</Badge>
                )}
              </div>
              <CardTitle className="mt-4">{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Unduh Laporan
          </CardTitle>
          <CardDescription>
            Pilih format file untuk mengunduh laporan {reports.find(r => r.id === reportType)?.title}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              variant="outline"
              onClick={() => handleExport('excel')}
              disabled={loading}
              className="flex items-center gap-2"
              data-testid="export-excel"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
              )}
              Export Excel (CSV)
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('json')}
              disabled={loading}
              className="flex items-center gap-2"
              data-testid="export-json"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-blue-600" />
              )}
              Export JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2">Catatan:</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>File Excel akan diunduh dalam format CSV yang dapat dibuka di Microsoft Excel</li>
            <li>File JSON berisi data mentah yang dapat digunakan untuk keperluan lain</li>
            <li>Laporan hanya menampilkan data sesuai hak akses Anda</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
