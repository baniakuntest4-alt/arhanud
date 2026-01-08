import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Users,
  Plus,
  Edit,
  Key,
  UserX,
  Loader2,
  AlertCircle,
  CheckCircle,
  Shield
} from 'lucide-react';

const roleLabels = {
  admin: 'Administrator',
  staff: 'Staf Kepegawaian',
  verifier: 'Pejabat Verifikator',
  leader: 'Pimpinan',
  personnel: 'Personel'
};

export const UserManagementPage = () => {
  const { api, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    nama_lengkap: '',
    role: 'staff',
    nrp: '',
    password: ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      setError('Gagal memuat data user');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        username: user.username,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        nrp: user.nrp || '',
        password: ''
      });
    } else {
      setSelectedUser(null);
      setFormData({
        username: '',
        nama_lengkap: '',
        role: 'staff',
        nrp: '',
        password: ''
      });
    }
    setDialogOpen(true);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async () => {
    setProcessing(true);
    setError('');
    
    try {
      if (selectedUser) {
        await api.put(`/users/${selectedUser.id}`, {
          nama_lengkap: formData.nama_lengkap,
          role: formData.role,
          nrp: formData.nrp || null
        });
        setSuccess('User berhasil diupdate');
      } else {
        await api.post('/users', formData);
        setSuccess('User berhasil ditambahkan');
      }
      fetchUsers();
      setDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal menyimpan user');
    } finally {
      setProcessing(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    
    setProcessing(true);
    setError('');
    
    try {
      await api.post(`/users/${selectedUser.id}/reset-password?new_password=${encodeURIComponent(newPassword)}`);
      setSuccess('Password berhasil direset');
      setResetDialogOpen(false);
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal reset password');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Yakin ingin menonaktifkan user ini?')) return;
    
    try {
      await api.delete(`/users/${userId}`);
      fetchUsers();
      setSuccess('User berhasil dinonaktifkan');
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal menonaktifkan user');
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      staff: 'bg-blue-100 text-blue-800',
      verifier: 'bg-amber-100 text-amber-800',
      leader: 'bg-green-100 text-green-800',
      personnel: 'bg-gray-100 text-gray-800'
    };
    return <Badge className={colors[role]}>{roleLabels[role]}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="user-management-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen User</h1>
          <p className="text-muted-foreground">Kelola akun pengguna sistem</p>
        </div>
        <Button
          className="bg-[#4A5D23] hover:bg-[#3d4d1c]"
          onClick={() => handleOpenDialog()}
          data-testid="add-user-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah User
        </Button>
      </div>

      {(error || success) && (
        <Alert variant={error ? 'destructive' : 'default'} className={success ? 'bg-green-50 border-green-200' : ''}>
          {error ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
          <AlertDescription className={success ? 'text-green-800' : ''}>{error || success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Daftar User
          </CardTitle>
          <CardDescription>Semua pengguna yang terdaftar di sistem</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>NRP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono">{u.username}</TableCell>
                    <TableCell className="font-medium">{u.nama_lengkap}</TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell>{u.nrp || '-'}</TableCell>
                    <TableCell>
                      <Badge className={u.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {u.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(u)}
                          data-testid={`edit-user-${u.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(u);
                            setResetDialogOpen(true);
                            setError('');
                          }}
                          data-testid={`reset-pwd-${u.id}`}
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                        {u.id !== currentUser?.id && u.is_active && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDeactivate(u.id)}
                            data-testid={`deactivate-${u.id}`}
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Edit User' : 'Tambah User Baru'}</DialogTitle>
            <DialogDescription>
              {selectedUser ? 'Ubah data user' : 'Buat akun pengguna baru'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={!!selectedUser}
                data-testid="input-username"
              />
            </div>
            <div>
              <Label htmlFor="nama_lengkap">Nama Lengkap</Label>
              <Input
                id="nama_lengkap"
                value={formData.nama_lengkap}
                onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                data-testid="input-nama"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger data-testid="select-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="staff">Staf Kepegawaian</SelectItem>
                  <SelectItem value="verifier">Pejabat Verifikator</SelectItem>
                  <SelectItem value="leader">Pimpinan</SelectItem>
                  <SelectItem value="personnel">Personel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.role === 'personnel' && (
              <div>
                <Label htmlFor="nrp">NRP (untuk role Personel)</Label>
                <Input
                  id="nrp"
                  value={formData.nrp}
                  onChange={(e) => setFormData({ ...formData, nrp: e.target.value })}
                  placeholder="Masukkan NRP"
                  data-testid="input-nrp"
                />
              </div>
            )}
            {!selectedUser && (
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  data-testid="input-password"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button
              onClick={handleSubmit}
              disabled={processing}
              className="bg-[#4A5D23] hover:bg-[#3d4d1c]"
              data-testid="submit-user"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password untuk {selectedUser?.nama_lengkap}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new_password">Password Baru</Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                data-testid="input-new-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>Batal</Button>
            <Button
              onClick={handleResetPassword}
              disabled={processing}
              className="bg-[#4A5D23] hover:bg-[#3d4d1c]"
              data-testid="confirm-reset-pwd"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementPage;
