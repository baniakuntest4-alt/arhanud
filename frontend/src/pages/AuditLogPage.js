import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
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
import { History, Filter, User, Clock } from 'lucide-react';

export const AuditLogPage = () => {
  const { api } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, [entityFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (entityFilter && entityFilter !== 'all') {
        params.append('entity_type', entityFilter);
      }
      const response = await api.get(`/audit-logs?${params.toString()}`);
      setLogs(response.data);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action) => {
    const labels = {
      'LOGIN': 'Login',
      'LOGOUT': 'Logout',
      'CREATE_PERSONNEL': 'Tambah Personel',
      'UPDATE_PERSONNEL': 'Update Personel',
      'CREATE_USER': 'Tambah User',
      'UPDATE_USER': 'Update User',
      'DEACTIVATE_USER': 'Nonaktifkan User',
      'RESET_PASSWORD': 'Reset Password',
      'CHANGE_PASSWORD': 'Ubah Password',
      'CREATE_MUTATION_REQUEST': 'Ajukan Mutasi',
      'VERIFY_MUTATION_APPROVED': 'Setujui Mutasi',
      'VERIFY_MUTATION_REJECTED': 'Tolak Mutasi',
      'CREATE_CORRECTION_REQUEST': 'Ajukan Koreksi',
      'VERIFY_CORRECTION_APPROVED': 'Setujui Koreksi',
      'VERIFY_CORRECTION_REJECTED': 'Tolak Koreksi',
      'IMPORT_PERSONNEL': 'Import Data',
      'CREATE_RANK_HISTORY': 'Tambah Riwayat Pangkat',
      'CREATE_POSITION_HISTORY': 'Tambah Riwayat Jabatan',
      'CREATE_EDUCATION': 'Tambah Pendidikan',
      'CREATE_FAMILY': 'Tambah Keluarga'
    };
    return labels[action] || action;
  };

  const getActionBadge = (action) => {
    let color = 'bg-gray-100 text-gray-800';
    if (action.includes('CREATE') || action.includes('APPROVED')) {
      color = 'bg-green-100 text-green-800';
    } else if (action.includes('UPDATE') || action.includes('IMPORT')) {
      color = 'bg-blue-100 text-blue-800';
    } else if (action.includes('DELETE') || action.includes('DEACTIVATE') || action.includes('REJECTED')) {
      color = 'bg-red-100 text-red-800';
    } else if (action.includes('LOGIN') || action.includes('LOGOUT')) {
      color = 'bg-purple-100 text-purple-800';
    }
    return <Badge className={color}>{getActionLabel(action)}</Badge>;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="audit-log-page">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Catatan Aktivitas</h1>
        <p className="text-muted-foreground">Riwayat semua aktivitas pengguna di sistem</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Log Aktivitas
              </CardTitle>
              <CardDescription>Semua perubahan data tercatat di sini</CardDescription>
            </div>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-48" data-testid="entity-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Entitas</SelectItem>
                <SelectItem value="auth">Autentikasi</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="personnel">Personel</SelectItem>
                <SelectItem value="mutation_request">Mutasi</SelectItem>
                <SelectItem value="correction_request">Koreksi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Tidak ada log aktivitas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Aksi</TableHead>
                    <TableHead>Entitas</TableHead>
                    <TableHead>ID Entitas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{formatTimestamp(log.timestamp)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#4A5D23] flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium">{log.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.entity_type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.entity_id ? log.entity_id.slice(0, 8) + '...' : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogPage;
