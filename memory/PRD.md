# SIPARHANUD - Product Requirements Document

## Informasi Proyek
- **Nama**: SIPARHANUD (Sistem Informasi Personel Arhanud)
- **Tanggal Dibuat**: 8 Januari 2025
- **Status**: MVP Complete, Features In Progress
- **Last Updated**: 9 Januari 2025

## Problem Statement
Membangun aplikasi web internal untuk kepegawaian militer TNI AD (Arhanud) dengan fitur:
- Multi-role access (Admin, Staf, Verifikator, Pimpinan, Personel)
- Data personel lengkap (NRP, pangkat, jabatan, pendidikan, prestasi)
- Alur verifikasi untuk perubahan data
- Import data dari Excel
- Laporan yang bisa diunduh (PDF/Excel)
- Audit log untuk setiap aktivitas
- Upload dokumen pendukung

## User Personas
1. **Administrator** - Mengelola akun pengguna, master data referensi
2. **Staf Kepegawaian** - Input dan kelola data personel, upload dokumen
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
- [x] Export Laporan Excel
- [x] Export Laporan PDF
- [x] Export Statistik Excel
- [x] Upload Dokumen Personel
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
- [x] Laporan export Excel
- [x] Laporan export PDF
- [x] Export Statistik Excel
- [x] Upload Dokumen Personel
- [x] Audit log

### P2 (Medium Priority)
- [ ] Riwayat pangkat dengan timeline visual
- [ ] Riwayat jabatan dengan timeline visual
- [ ] Notifikasi masa pensiun mendekati
- [ ] Filter advanced di halaman personel
- [ ] Implementasi halaman Prestasi, Kesejahteraan, Riwayat Karir
- [ ] Full verification workflow (apply changes after approval)
- [ ] User notification system

### P3 (Nice to Have)
- [ ] PWA (Progressive Web App) untuk mobile
- [ ] Custom fields yang bisa ditambah admin
- [ ] Grafik statistik yang lebih detail
- [ ] Print view untuk laporan
- [ ] Bulk update personel
- [ ] Import keluarga dari Excel

## Next Action Items
1. ~~Tambahkan field TAHUN untuk DIKBANG (Pendidikan Pengembangan)~~ ✅ DONE
2. ~~Master Data Management UI~~ ✅ DONE
3. ~~Export Laporan PDF/Excel~~ ✅ DONE (9 Jan 2025)
4. ~~Upload Dokumen Personel~~ ✅ DONE (9 Jan 2025)
5. Build halaman-halaman lainnya (Prestasi, Kesejahteraan, Riwayat Karir)
6. Test alur verifikasi end-to-end
7. Sistem notifikasi untuk Personel

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
- **Added**: Halaman lengkap untuk Role PERSONEL
  - Dashboard Personel: Welcome card, stats (status, total pendidikan, pengajuan), ringkasan data, aksi cepat
  - Profil Saya: View only semua data personel (data dasar, dikbang, riwayat karir, prestasi, keluarga)
  - Pengajuan Koreksi: Form ajukan koreksi data, riwayat pengajuan, status tracking
  - Pengaturan: Ganti password
  - Login redirect berdasarkan role (personnel -> /dashboard-personel)
- **Added**: Dashboard Admin/Verifikator Improvements
  - Alert kuning prominent jika ada pengajuan pending
  - Counter "Pengajuan Pending" di stat cards
  - Section "Pengajuan Terbaru" dengan daftar 5 pengajuan terakhir
  - Aksi Cepat khusus untuk role Verifikator
- **Added**: Halaman Master Data Management (Admin only)
  - 6 tabs: Pangkat, Jabatan, Satuan, Korps, Agama, Jenis Diklat
  - CRUD operations untuk semua reference data
  - Search/filter data
  - Seeded initial data: 21 pangkat, 10 korps, 6 agama, 4 jenis diklat, 4 satuan, 8 jabatan
- **Added (9 Jan 2025)**: Export Laporan PDF/Excel
  - Halaman Laporan dengan UI lengkap
  - Export Daftar Personel ke Excel dengan filter (kategori, status)
  - Export Daftar Personel ke PDF dengan filter
  - Export Statistik Personel ke Excel (per kategori, per pangkat)
  - Export Biodata Individu ke PDF
- **Added (9 Jan 2025)**: Upload Dokumen Personel
  - Tab "Dokumen" di halaman Detail Personel
  - Upload dokumen dengan jenis: SK Pangkat, SK Jabatan, Ijazah, Sertifikat, Foto, Lainnya
  - Download dan hapus dokumen
  - Role-based access (Admin/Staff dapat upload, Personel hanya lihat)
  - Validasi file type (.pdf, .jpg, .png, .doc, .docx) dan ukuran (max 10MB)

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
