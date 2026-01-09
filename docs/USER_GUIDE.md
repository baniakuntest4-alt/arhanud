# User Guide - SIPARHANUD

Panduan penggunaan sistem berdasarkan role pengguna.

---

## 🔐 Login

1. Buka aplikasi di browser
2. Masukkan **Username** dan **Password**
3. Klik tombol **Masuk**

| Role | Username | Password |
|------|----------|----------|
| Administrator | `admin` | `admin123` |
| Staf Kepegawaian | `staff1` | `staff123` |
| Verifikator | `verifikator1` | `verif123` |
| Pimpinan | `pimpinan` | `pimpin123` |
| Personel | `personel1` | `personel123` |

---

## 👨‍💼 Role: Administrator

### Akses Menu
- Dashboard
- Data Personel
- Pengajuan
- Manajemen User
- Master Data
- Laporan
- Audit Log

### Tugas Utama

#### 1. Kelola User
```
Manajemen User → Tambah User Baru
├── Isi Username
├── Isi Password
├── Isi Nama Lengkap
├── Pilih Role
├── (Jika Personnel) Link ke NRP
└── Simpan
```

#### 2. Nonaktifkan User
```
Manajemen User → Cari User → Klik Nonaktifkan
```

#### 3. Lihat Audit Log
```
Audit Log → Lihat semua aktivitas sistem
├── Siapa yang login
├── Siapa yang edit data
├── Siapa yang approve/reject
└── Kapan dilakukan
```

#### 4. Kelola Master Data
```
Master Data → Pilih Jenis (Pangkat/Jabatan/Satuan)
├── Tambah data baru
├── Edit data existing
└── Nonaktifkan data
```

---

## 👩‍💼 Role: Staf Kepegawaian

### Akses Menu
- Dashboard
- Data Personel
- Dikbang
- Prestasi
- Kesejahteraan
- Pengajuan
- Laporan

### Tugas Utama

#### 1. Tambah Personel Baru
```
Data Personel → Tambah Personel
├── Tab Data Dasar
│   ├── NRP (wajib)
│   ├── Nama Lengkap (wajib)
│   ├── Kategori (Perwira/Bintara/Tamtama/PNS)
│   ├── Pangkat
│   ├── Korps
│   ├── Tempat & Tanggal Lahir
│   ├── Jenis Kelamin
│   └── Agama
├── Tab Jabatan & Penugasan
│   ├── Jabatan Sekarang
│   ├── Satuan Induk
│   ├── TMT Pangkat
│   ├── TMT Jabatan
│   └── Status Personel
└── Simpan
```

#### 2. Edit Data Personel
```
Data Personel → Cari Personel → Klik Edit (ikon pensil)
├── Edit field yang diperlukan
└── Simpan
```

#### 3. Tambah Data Pendidikan (DIKBANG)
```
Data Personel → Pilih Personel → Edit → Tab Pendidikan
├── DIKBANGUM
│   ├── Nama Pendidikan (AKMIL, SESKOAD, dll)
│   ├── Tahun Lulus
│   ├── Hasil (Lulus/Tidak Lulus)
│   └── Klik Tambah
└── DIKBANGSPES
    ├── Nama Pendidikan (SUSPA TIH, COMBAT INTEL, dll)
    ├── Tahun Lulus
    ├── Hasil
    └── Klik Tambah
```

#### 4. Lihat Pengajuan
```
Pengajuan → Lihat daftar pengajuan dari personel
├── Filter by status (Pending/Approved/Rejected)
└── Lihat detail pengajuan
```

#### 5. Export Laporan
```
Laporan → Pilih jenis laporan → Download PDF/Excel
```

---

## ✅ Role: Verifikator

### Akses Menu
- Dashboard (dengan alert pengajuan)
- Verifikasi
- Data Personel (view only)
- Laporan

### Tugas Utama

#### 1. Verifikasi Pengajuan
```
Dashboard → Lihat Alert "X Pengajuan Menunggu" → Klik "Lihat Sekarang"

ATAU

Verifikasi → Lihat daftar pengajuan pending
├── Klik pengajuan untuk review
├── Cek data yang diajukan
│   ├── Field yang dikoreksi
│   ├── Nilai lama
│   ├── Nilai baru
│   └── Alasan pengajuan
├── Pilih aksi:
│   ├── ✅ Setujui (Approve)
│   └── ❌ Tolak (Reject) + isi alasan
└── Submit
```

#### 2. Cek Data Personel
```
Data Personel → Cari & lihat detail personel
(Hanya bisa lihat, tidak bisa edit)
```

---

## 👔 Role: Pimpinan

### Akses Menu
- Dashboard
- Data Personel (view only)
- Laporan
- Audit Log

### Tugas Utama

#### 1. Monitoring Dashboard
```
Dashboard → Lihat statistik:
├── Total Personel
├── Personel Aktif
├── Distribusi per Pangkat (chart)
├── Distribusi per Kategori (chart)
└── Aktivitas Terbaru
```

#### 2. Lihat Data Personel
```
Data Personel → Cari & filter personel
├── Filter by kategori
├── Filter by status
├── Search by nama/NRP
└── Lihat detail personel
```

#### 3. Download Laporan
```
Laporan → Pilih jenis → Download
```

#### 4. Review Audit Log
```
Audit Log → Pantau aktivitas sistem
```

---

## 👤 Role: Personel

### Akses Menu
- Dashboard
- Profil Saya
- Pengajuan Koreksi
- Pengaturan

### Tugas Utama

#### 1. Lihat Data Diri
```
Profil Saya → Lihat semua data:
├── Data Dasar (NRP, Nama, Pangkat, dll)
├── Tab Pendidikan (DIKBANG)
├── Tab Riwayat Karir (Pangkat & Jabatan)
├── Tab Prestasi & Tanda Jasa
└── Tab Keluarga
```

#### 2. Ajukan Koreksi Data
```
Pengajuan Koreksi → Klik "Ajukan Koreksi Baru"
├── Pilih field yang ingin dikoreksi:
│   ├── Nama Lengkap
│   ├── Tempat Lahir
│   ├── Tanggal Lahir
│   ├── Agama
│   ├── Alamat
│   ├── No HP
│   ├── Email
│   ├── Data DIKBANG
│   ├── Data Keluarga
│   ├── Data Prestasi
│   └── Lainnya
├── Isi Nilai Saat Ini (jika tahu)
├── Isi Nilai Baru yang Benar
├── Isi Alasan Koreksi
└── Klik "Kirim Pengajuan"
```

#### 3. Pantau Status Pengajuan
```
Pengajuan Koreksi → Lihat riwayat pengajuan
├── Status: Pending (kuning) = Sedang diproses
├── Status: Disetujui (hijau) = Sudah diupdate
└── Status: Ditolak (merah) = Lihat catatan verifikator
```

#### 4. Ganti Password
```
Pengaturan → Ubah Password
├── Masukkan Password Saat Ini
├── Masukkan Password Baru (min. 6 karakter)
├── Konfirmasi Password Baru
└── Klik "Ubah Password"
```

#### 5. Cetak Biodata
```
Profil Saya → Klik tombol "Cetak" → Print/Save as PDF
```

---

## 🔄 Alur Kerja (Workflow)

### Alur Input Data Personel Baru
```
┌─────────────────┐
│ Staf Kepegawaian│
│ input data baru │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Data tersimpan  │
│ di database     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Muncul di       │
│ Dashboard semua │
└─────────────────┘
```

### Alur Koreksi Data
```
┌─────────────────┐
│ Personel ajukan │
│ koreksi data    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Alert muncul di │
│ Dashboard Admin │
│ & Verifikator   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verifikator     │
│ review & verify │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Approve│ │Reject │
└───┬───┘ └───┬───┘
    │         │
    ▼         ▼
┌───────┐ ┌─────────────┐
│ Data  │ │ Status      │
│updated│ │ ditolak,    │
│       │ │ ada catatan │
└───────┘ └─────────────┘
         │
         ▼
┌─────────────────┐
│ Personel lihat  │
│ status di       │
│ Pengajuan Saya  │
└─────────────────┘
```

---

## ❓ FAQ

### Q: Bagaimana jika lupa password?
**A:** Hubungi Administrator untuk reset password.

### Q: Kenapa data saya tidak bisa diedit langsung?
**A:** Untuk keamanan data, personel harus mengajukan koreksi yang akan diverifikasi. Ini mencegah perubahan data tanpa approval.

### Q: Berapa lama pengajuan diproses?
**A:** Tergantung verifikator. Cek status di halaman "Pengajuan Saya".

### Q: Data apa saja yang bisa dikoreksi?
**A:** Nama, tempat/tanggal lahir, agama, alamat, no HP, email, data pendidikan, data keluarga, dan data prestasi.

### Q: Siapa yang bisa melihat data saya?
**A:** Admin, Staf Kepegawaian, Verifikator, dan Pimpinan bisa melihat data semua personel. Personel lain tidak bisa melihat data Anda.

### Q: Bagaimana cara menambah data pendidikan baru?
**A:** Ajukan melalui "Pengajuan Koreksi" dengan memilih field "Data DIKBANGUM" atau "Data DIKBANGSPES".

---

## 📞 Kontak Support

Jika mengalami kendala teknis, hubungi:
- Administrator Sistem
- Tim IT Satuan
