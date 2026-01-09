# Changelog - SIPARHANUD

Semua perubahan penting pada proyek ini didokumentasikan di file ini.

---

## [2.0.0] - 2026-01-09

### 🔄 Major Refactoring
- Migrasi dari single-collection ke multi-collection (normalized) database schema
- Pemisahan data ke collections: personel, dikbang, riwayat_pangkat, riwayat_jabatan, prestasi, tanda_jasa, keluarga, kesejahteraan
- Penambahan reference tables: ref_pangkat, ref_jabatan, ref_satuan, ref_korps, ref_agama

### ✨ New Features

#### Role Personel (Personnel)
- Dashboard Personel dengan welcome card dan ringkasan data
- Halaman Profil Saya (view only) dengan tabs: Pendidikan, Riwayat Karir, Prestasi, Keluarga
- Halaman Pengajuan Koreksi dengan form dan tracking status
- Halaman Pengaturan untuk ganti password
- Login redirect berdasarkan role

#### Dashboard Admin & Verifikator
- Alert kuning prominent jika ada pengajuan pending
- Counter "Pengajuan Pending" di stat cards
- Section "Pengajuan Terbaru" dengan daftar 5 pengajuan terakhir
- Aksi Cepat khusus untuk setiap role

#### DIKBANG (Pendidikan)
- Field TAHUN untuk DIKBANGUM dan DIKBANGSPES
- Tab "Pendidikan (DIKBANG)" di form Edit Personel
- CRUD langsung untuk data pendidikan

### 🐛 Bug Fixes
- Fix: Pangkat kosong di Dashboard - status_personel 'ACTIVE' → 'AKTIF'
- Fix: Distribusi Pangkat "Tidak ada data" - aggregation query filter

### 📝 Documentation
- README.md dengan overview lengkap
- docs/ARCHITECTURE.md - Arsitektur teknis
- docs/API.md - Dokumentasi API endpoints
- docs/DATABASE.md - Schema database
- docs/USER_GUIDE.md - Panduan user per role
- docs/DEVELOPMENT.md - Panduan developer

---

## [1.0.0] - 2026-01-08

### 🎉 Initial Release
- Setup project FastAPI + React + MongoDB
- Implementasi autentikasi JWT
- 5 role user: Admin, Staff, Verifier, Leader, Personnel
- CRUD personel dengan data dasar
- Import data dari Excel (15 personel)
- Dashboard dengan statistik dan chart
- Halaman list personel dengan filter dan search
- Halaman detail personel
- Halaman pengajuan dan verifikasi
- Halaman manajemen user
- Halaman laporan (placeholder)
- Audit log untuk tracking aktivitas
- UI dengan Shadcn/UI dan Tailwind CSS
- Color scheme: Hijau Army, Kuning Emas, Merah Marun

---

## Upcoming Features (Backlog)

### P1 - High Priority
- [ ] Master Data Management UI (admin kelola ref_pangkat, etc.)
- [ ] Export Laporan PDF/Excel
- [ ] Halaman Riwayat Pangkat & Jabatan detail
- [ ] Halaman Prestasi & Tanda Jasa detail

### P2 - Medium Priority
- [ ] PWA Support (Progressive Web App)
- [ ] File upload untuk dokumen (SK, ijazah)
- [ ] Notifikasi real-time
- [ ] Batch import dari Excel

### P3 - Low Priority
- [ ] Custom fields dari UI
- [ ] API rate limiting
- [ ] Redis caching
- [ ] Advanced reporting
