# SIPARHANUD - Product Requirements Document

## Informasi Proyek
- **Nama**: SIPARHANUD (Sistem Informasi Personel Arhanud)
- **Tanggal Dibuat**: 8 Januari 2025
- **Status**: MVP Selesai, Refactoring In Progress
- **Last Updated**: 9 Januari 2025

## Problem Statement
Membangun aplikasi web internal untuk kepegawaian militer TNI AD (Arhanud) dengan fitur:
- Multi-role access (Admin, Staf, Verifikator, Pimpinan, Personel)
- Data personel lengkap (NRP, pangkat, jabatan, pendidikan, prestasi)
- Alur verifikasi untuk perubahan data
- Import data dari Excel
- Laporan yang bisa diunduh
- Audit log untuk setiap aktivitas

## User Personas
1. **Administrator** - Mengelola akun pengguna, tidak bisa ubah data kepegawaian
2. **Staf Kepegawaian** - Input dan kelola data personel, ajukan mutasi/pensiun
3. **Pejabat Verifikator** - Verifikasi dan setujui/tolak pengajuan
4. **Pimpinan** - Lihat dashboard dan laporan saja
5. **Personel** - Lihat data diri, ajukan koreksi

## Core Requirements
- [x] Autentikasi & Otorisasi (5 role)
- [x] Data Induk Personel (CRUD)
- [x] Import Excel
- [x] Pengajuan Mutasi & Pensiun
- [x] Pengajuan Koreksi Data (Personel)
- [x] Verifikasi & Persetujuan
- [x] Dashboard dengan statistik
- [x] Laporan (Export CSV/JSON)
- [x] Audit Log

## What's Been Implemented (8 Jan 2025)
### Backend (FastAPI)
- Auth endpoints (login, logout, change-password)
- User management (CRUD)
- Personnel management (CRUD)
- Rank & Position history
- Education & Family data
- Mutation & Correction requests
- Verification workflow
- Audit logging
- Excel import
- Reports export
- Reference data (pangkat, satuan)

### Frontend (React)
- Login page dengan logo Arhanud
- Dashboard dengan statistik
- Data Personel (list, detail, form)
- Manajemen User (admin)
- Halaman Verifikasi
- Halaman Pengajuan Mutasi
- Halaman Laporan
- Audit Log
- Profile Personel dengan koreksi

### Design
- Warna: Dominan putih + Hijau Army (#4A5D23)
- Logo: Arhanud (Pussenarhanud)
- Font: Chivo (heading), Inter (body)
- Bahasa: Indonesia

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Login/Logout
- [x] Role-based access
- [x] Data Personel CRUD
- [x] Verifikasi workflow

### P1 (High Priority) - DONE
- [x] Import Excel
- [x] Dashboard stats
- [x] Laporan export
- [x] Audit log

### P2 (Medium Priority)
- [ ] Riwayat pangkat dengan timeline visual
- [ ] Riwayat jabatan dengan timeline visual
- [ ] Notifikasi masa pensiun mendekati
- [ ] Filter advanced di halaman personel
- [ ] Export PDF untuk laporan

### P3 (Nice to Have)
- [ ] Grafik statistik yang lebih detail
- [ ] Print view untuk laporan
- [ ] Bulk update personel
- [ ] Import keluarga dari Excel

## Next Action Items
1. ~~Tambahkan field TAHUN untuk DIKBANG (Pendidikan Pengembangan)~~ ✅ DONE
2. Build halaman-halaman lainnya (Riwayat, Prestasi, Kesejahteraan, dll)
3. Implementasi Master Data Management UI
4. Test alur verifikasi end-to-end
5. Tambah fitur export PDF

## Bug Fix Log (9 Jan 2025)
- **Fixed**: Pangkat kosong di Dashboard - Penyebab: `status_personel` tersimpan sebagai `ACTIVE` (EN) bukan `AKTIF` (ID). Updated 15 dokumen untuk konsistensi.
- **Fixed**: Distribusi Pangkat menampilkan "Tidak ada data" - Sama dengan di atas, aggregation query tidak menemukan data karena filter `status_personel: AKTIF` tidak match.

## Feature Update Log (9 Jan 2025)
- **Added**: Field TAHUN untuk DIKBANG (Pendidikan Pengembangan)
  - Updated 76 records dikbang dengan data tahun
  - Frontend menampilkan tahun dalam badge yang jelas (hijau untuk DIKBANGUM, emas untuk DIKBANGSPES)
  - Format: Nama Diklat - [TAHUN]
- **Added**: Tab "Pendidikan (DIKBANG)" di form Edit/Tambah Personel
  - User dapat menambah DIKBANGUM dan DIKBANGSPES baru dengan field: Nama, Tahun, Hasil
  - User dapat mengedit TAHUN langsung di list yang sudah ada
  - User dapat menghapus data DIKBANG
  - Form terpisah untuk DIKBANGUM (hijau) dan DIKBANGSPES (emas)

## Database Schema (Refactored)
Aplikasi menggunakan schema multi-koleksi yang ternormalisasi:
- **Reference Tables**: `ref_pangkat`, `ref_jabatan`, `ref_satuan`, `ref_korps`, `ref_agama`, `ref_jenis_diklat`
- **Core Data**: `personel` (master data)
- **Historical Data**: `riwayat_pangkat`, `riwayat_jabatan`, `dikbang` (pendidikan)
- **Supporting Data**: `prestasi`, `tanda_jasa`, `keluarga`, `kesejahteraan`, `kesjas`
- **Workflow**: `pengajuan`, `audit_logs`
- **Users**: `users`

## Default Users
| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Administrator |
| staff1 | staff123 | Staf Kepegawaian |
| verifikator1 | verif123 | Verifikator |
| pimpinan | pimpin123 | Pimpinan |
| personel1 | personel123 | Personel |
