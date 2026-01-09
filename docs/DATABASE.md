# Database Schema - SIPARHANUD

## 📊 Overview

Database menggunakan **MongoDB** dengan schema ternormalisasi (multiple collections).

**Key Design Decisions:**
- NRP sebagai foreign key antar collections
- Reference tables untuk data dropdown
- Soft delete (is_active = false)
- Timestamp untuk tracking perubahan
- UUID untuk id (bukan ObjectId)

---

## 📦 Collections

### 1. users
Menyimpan data akun pengguna sistem.

```javascript
{
  "id": "uuid",                    // Primary key
  "username": "admin",             // Unique, untuk login
  "password": "hashed_password",   // Bcrypt hash
  "nama_lengkap": "Administrator", // Display name
  "role": "admin",                 // admin|staff|verifier|leader|personnel
  "nrp": null,                     // Linked NRP (for personnel role)
  "is_active": true,               // Soft delete flag
  "created_at": "ISO8601"          // Timestamp
}
```

**Indexes:**
- `username`: unique
- `id`: unique

---

### 2. personel
Master data personel - data utama setiap anggota.

```javascript
{
  "nrp": "11120017460989",          // Primary key (Nomor Registrasi Pokok)
  "nama_lengkap": "EKA SEPTRIA JAYA, S.T.",
  "kategori": "PERWIRA",            // PERWIRA|BINTARA|TAMTAMA|PNS
  "pangkat": "MAYOR ARH",           // Current rank
  "korps": "ARH",                   // Corps code
  "tempat_lahir": "Jakarta",
  "tanggal_lahir": "17-09-1989",
  "jenis_kelamin": "L",             // L|P
  "agama": "ISLAM",
  "golongan_darah": "O",
  "status_personel": "AKTIF",       // AKTIF|PENSIUN|MUTASI|MENINGGAL|DIBERHENTIKAN
  "jabatan_sekarang": "DANDENARHANUD 003/ARK",
  "satuan_induk": "DENARHANUD 003/ARK",
  "tmt_pangkat": "26-06-2025",      // Terhitung Mulai Tanggal
  "tmt_jabatan": "01-01-2024",
  "tmt_masuk_dinas": "01-08-2006",
  "alamat": "Jl. ...",
  "no_hp": "08123456789",
  "email": "email@example.com",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

**Indexes:**
- `nrp`: unique (primary key)
- `kategori`: for filtering
- `status_personel`: for filtering
- `pangkat`: for aggregation

---

### 3. dikbang
Data pendidikan & pelatihan (DIKBANGUM & DIKBANGSPES).

```javascript
{
  "id": "uuid",                    // Primary key
  "nrp": "11120017460989",         // Foreign key to personel
  "jenis_diklat": "DIKBANGUM",     // DIKBANGUM|DIKBANGSPES
  "nama_diklat": "AKMIL",          // Nama pendidikan
  "tahun": "2006",                 // Tahun lulus
  "hasil": "LULUS",                // LULUS|TIDAK LULUS
  "tempat": "Magelang",
  "created_at": "ISO8601"
}
```

**Indexes:**
- `nrp`: for lookup
- `jenis_diklat`: for filtering

---

### 4. riwayat_pangkat
Riwayat kenaikan pangkat.

```javascript
{
  "id": "uuid",
  "nrp": "11120017460989",
  "pangkat": "MAYOR ARH",
  "pangkat_sebelumnya": "KAPTEN ARH",
  "tmt_pangkat": "26-06-2025",
  "nomor_sk": "SK/123/2025",
  "jenis_kenaikan": "REGULER",      // REGULER|LUAR_BIASA
  "created_at": "ISO8601"
}
```

---

### 5. riwayat_jabatan
Riwayat jabatan/penugasan.

```javascript
{
  "id": "uuid",
  "nrp": "11120017460989",
  "jabatan": "DANDENARHANUD 003/ARK",
  "satuan": "DENARHANUD 003/ARK",
  "tmt_jabatan": "01-01-2024",
  "tmt_selesai": null,              // null = masih aktif
  "nomor_sk": "SK/456/2024",
  "status_jabatan": "AKTIF",        // AKTIF|SELESAI
  "created_at": "ISO8601"
}
```

---

### 6. prestasi
Data prestasi personel.

```javascript
{
  "id": "uuid",
  "nrp": "11120017460989",
  "nama_prestasi": "Juara 1 Menembak",
  "tingkat": "NASIONAL",            // SATUAN|KODAM|NASIONAL|INTERNASIONAL
  "tahun": "2023",
  "keterangan": "Lomba Menembak TNI AD",
  "created_at": "ISO8601"
}
```

---

### 7. tanda_jasa
Data tanda jasa/penghargaan.

```javascript
{
  "id": "uuid",
  "nrp": "11120017460989",
  "nama_tanda_jasa": "Satya Lencana Kesetiaan",
  "pemberi": "Presiden RI",
  "tahun": "2020",
  "nomor_sk": "KEPPRES/123/2020",
  "created_at": "ISO8601"
}
```

---

### 8. keluarga
Data anggota keluarga personel.

```javascript
{
  "id": "uuid",
  "nrp": "11120017460989",
  "hubungan": "ISTRI",              // ISTRI|SUAMI|ANAK|AYAH|IBU
  "nama": "NAMA ISTRI",
  "tempat_lahir": "Jakarta",
  "tanggal_lahir": "01-01-1992",
  "pekerjaan": "PNS",
  "pendidikan": "S1",               // For anak
  "keterangan": "",
  "created_at": "ISO8601"
}
```

---

### 9. kesejahteraan
Data kesejahteraan personel.

```javascript
{
  "id": "uuid",
  "nrp": "11120017460989",
  "status_perkawinan": "KAWIN",     // KAWIN|BELUM_KAWIN|CERAI
  "jumlah_tanggungan": 3,
  "npwp": "12.345.678.9-012.345",
  "bpjs_kesehatan": "0001234567890",
  "bpjs_ketenagakerjaan": "1234567890",
  "created_at": "ISO8601"
}
```

---

### 10. pengajuan
Data pengajuan (koreksi, mutasi, dll).

```javascript
{
  "id": "uuid",
  "nrp": "11120017460989",
  "jenis_pengajuan": "koreksi",     // koreksi|mutasi|kenaikan_pangkat|pensiun
  "field_name": "tempat_lahir",     // For koreksi
  "nilai_lama": "",
  "nilai_baru": "Jakarta",
  "alasan": "Data belum diisi",
  "keterangan": "...",
  "status": "pending",              // pending|approved|rejected
  "catatan_verifikator": "",
  "verified_by": "user_id",
  "verified_at": "ISO8601",
  "created_by": "user_id",
  "created_by_name": "Nama User",
  "created_at": "ISO8601"
}
```

**Indexes:**
- `nrp`: for filtering
- `status`: for filtering
- `created_at`: for sorting

---

### 11. audit_logs
Log aktivitas sistem.

```javascript
{
  "id": "uuid",
  "user_id": "user_uuid",
  "username": "admin",
  "action": "CREATE_PERSONEL",      // LOGIN|CREATE_*|UPDATE_*|DELETE_*|VERIFY_*
  "entity_type": "personel",        // personel|user|pengajuan|etc
  "entity_id": "nrp_or_id",
  "details": {},                    // Additional info
  "ip_address": "192.168.1.1",
  "timestamp": "ISO8601"
}
```

**Indexes:**
- `timestamp`: for sorting (descending)
- `user_id`: for filtering
- `action`: for filtering

---

### 12. Reference Tables

#### ref_pangkat
```javascript
{
  "kode": "MAYOR",
  "nama": "Mayor",
  "golongan": "IV/a",
  "kategori": "PERWIRA",
  "urutan": 10
}
```

#### ref_jabatan
```javascript
{
  "kode": "DANDENARHANUD",
  "nama": "Komandan Detasemen Arhanud",
  "tingkat": "ESELON_3"
}
```

#### ref_satuan
```javascript
{
  "kode": "003_ARK",
  "nama": "DENARHANUD 003/ARK",
  "induk": "KODAM_JAYA"
}
```

#### ref_korps
```javascript
{
  "kode": "ARH",
  "nama": "Arhanud",
  "deskripsi": "Artileri Pertahanan Udara"
}
```

#### ref_agama
```javascript
{
  "kode": "ISLAM",
  "nama": "Islam"
}
```

#### ref_jenis_diklat
```javascript
{
  "kode": "DIKBANGUM",
  "nama": "Pendidikan Pengembangan Umum",
  "deskripsi": "AKMIL, SESKOAD, dll"
}
```

---

## 🔗 Relationships

```
                    ┌─────────────┐
                    │   users     │
                    │             │
                    │ nrp ────────┼─────┐
                    └─────────────┘     │
                                        │
┌─────────────┐     ┌─────────────┐     │
│ ref_pangkat │     │  personel   │◀────┘
│ ref_jabatan │────▶│   (NRP)     │
│ ref_satuan  │     └──────┬──────┘
│ ref_korps   │            │
│ ref_agama   │            │ NRP as FK
└─────────────┘            │
                    ┌──────┴──────┐
            ┌───────┼───────┬─────┼───────┐
            ▼       ▼       ▼     ▼       ▼
      ┌─────────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────────┐
      │ dikbang │ │rwyt │ │prst │ │ klrg│ │kesejah- │
      │         │ │pngkt│ │     │ │     │ │teraan   │
      └─────────┘ │rwyt │ │     │ │     │ └─────────┘
                  │jbtn │ │     │ │     │
                  └─────┘ └─────┘ └─────┘
```

---

## 📝 Notes for Developers

### ID Generation
```python
import uuid
def generate_id():
    return str(uuid.uuid4())
```

### Timestamp Format
```python
from datetime import datetime, timezone
def now_isoformat():
    return datetime.now(timezone.utc).isoformat()
```

### MongoDB Query Examples

```python
# Get personel with all related data
async def get_personel_full(nrp: str):
    personel = await db.personel.find_one({"nrp": nrp}, {"_id": 0})
    dikbang = await db.dikbang.find({"nrp": nrp}, {"_id": 0}).to_list(100)
    keluarga = await db.keluarga.find({"nrp": nrp}, {"_id": 0}).to_list(100)
    # ... etc
    return {**personel, "dikbang": dikbang, "keluarga": keluarga}

# Aggregation: Count by pangkat
pipeline = [
    {"$match": {"status_personel": "AKTIF"}},
    {"$group": {"_id": "$pangkat", "count": {"$sum": 1}}}
]
result = await db.personel.aggregate(pipeline).to_list(100)
```

### Important: Always Exclude _id
```python
# Bad - will cause JSON serialization error
doc = await db.collection.find_one({"id": id})

# Good - exclude _id
doc = await db.collection.find_one({"id": id}, {"_id": 0})
```

---

## 🔄 Migration Notes

### From Simple to Normalized Schema

The database was migrated from a single-collection design to this normalized schema. Key changes:

1. **personel** - Main personnel data only (no embedded arrays)
2. **dikbang** - Separated from personel.pendidikan
3. **riwayat_pangkat** - New collection for rank history
4. **riwayat_jabatan** - New collection for position history
5. **keluarga** - Separated from personel.keluarga

### Data Migration Script
Located in `server.py` function `migrate_old_data_to_new_schema()`
