# API Documentation - SIPARHANUD

Base URL: `/api`

## 🔐 Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "username": "admin",
    "nama_lengkap": "Administrator",
    "role": "admin",
    "nrp": null
  }
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

## 👤 Personel

### List All Personel
```http
GET /api/personel
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| kategori | string | Filter by kategori (PERWIRA/BINTARA/TAMTAMA/PNS) |
| status | string | Filter by status (AKTIF/PENSIUN/MUTASI) |
| search | string | Search by name or NRP |

**Response:**
```json
[
  {
    "nrp": "11120017460989",
    "nama_lengkap": "EKA SEPTRIA JAYA, S.T.",
    "pangkat": "MAYOR ARH",
    "kategori": "PERWIRA",
    "jabatan_sekarang": "DANDENARHANUD",
    "satuan_induk": "003/ARK",
    "status_personel": "AKTIF"
  }
]
```

### Get Personel by NRP
```http
GET /api/personel/{nrp}
Authorization: Bearer <token>
```

### Create Personel
```http
POST /api/personel
Authorization: Bearer <token>
Content-Type: application/json

{
  "nrp": "12345678901234",
  "nama_lengkap": "NAMA LENGKAP",
  "kategori": "PERWIRA",
  "pangkat": "LETTU ARH",
  "korps": "ARH",
  "tempat_lahir": "Jakarta",
  "tanggal_lahir": "01-01-1990",
  "jenis_kelamin": "L",
  "agama": "ISLAM",
  "status_personel": "AKTIF"
}
```

**Allowed Roles:** admin, staff

### Update Personel
```http
PUT /api/personel/{nrp}
Authorization: Bearer <token>
Content-Type: application/json

{
  "nama_lengkap": "NAMA BARU",
  "jabatan_sekarang": "JABATAN BARU"
}
```

**Allowed Roles:** admin, staff

---

## 📚 Personel - Related Data

### Get DIKBANG (Pendidikan)
```http
GET /api/personel/{nrp}/dikbang
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "nrp": "11120017460989",
    "jenis_diklat": "DIKBANGUM",
    "nama_diklat": "AKMIL",
    "tahun": "2006",
    "hasil": "LULUS"
  }
]
```

### Add DIKBANG
```http
POST /api/personel/{nrp}/dikbang
Authorization: Bearer <token>
Content-Type: application/json

{
  "jenis_diklat": "DIKBANGUM",
  "nama_diklat": "SESKOAD",
  "tahun": "2020",
  "hasil": "LULUS"
}
```

### Update DIKBANG
```http
PUT /api/dikbang/{dikbang_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "tahun": "2021"
}
```

### Delete DIKBANG
```http
DELETE /api/dikbang/{dikbang_id}
Authorization: Bearer <token>
```

### Get Riwayat Pangkat
```http
GET /api/personel/{nrp}/riwayat-pangkat
Authorization: Bearer <token>
```

### Get Riwayat Jabatan
```http
GET /api/personel/{nrp}/riwayat-jabatan
Authorization: Bearer <token>
```

### Get Prestasi
```http
GET /api/personel/{nrp}/prestasi
Authorization: Bearer <token>
```

### Get Tanda Jasa
```http
GET /api/personel/{nrp}/tanda-jasa
Authorization: Bearer <token>
```

### Get Keluarga
```http
GET /api/personel/{nrp}/keluarga
Authorization: Bearer <token>
```

### Get Kesejahteraan
```http
GET /api/personel/{nrp}/kesejahteraan
Authorization: Bearer <token>
```

---

## 📝 Pengajuan (Submissions)

### List All Pengajuan
```http
GET /api/pengajuan
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "nrp": "11120017460989",
    "jenis_pengajuan": "koreksi",
    "field_name": "tempat_lahir",
    "nilai_lama": "",
    "nilai_baru": "Jakarta",
    "alasan": "Data belum diisi",
    "status": "pending",
    "created_by": "user_id",
    "created_at": "2026-01-09T17:24:00Z"
  }
]
```

### Create Pengajuan
```http
POST /api/pengajuan
Authorization: Bearer <token>
Content-Type: application/json

{
  "nrp": "11120017460989",
  "jenis_pengajuan": "koreksi",
  "field_name": "tempat_lahir",
  "nilai_lama": "",
  "nilai_baru": "Jakarta",
  "alasan": "Data belum diisi"
}
```

**Notes:**
- Role `personnel` can only create `koreksi` type for their own NRP
- Role `staff` can create any type for any NRP

### Update Pengajuan (Verify)
```http
PUT /api/pengajuan/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "approved",
  "catatan_verifikator": "Data sudah diverifikasi"
}
```

**Allowed Roles:** verifier

**Status Options:**
- `pending` - Waiting for verification
- `approved` - Approved by verifier
- `rejected` - Rejected by verifier

---

## 👥 Users

### List Users
```http
GET /api/users
Authorization: Bearer <token>
```

**Allowed Roles:** admin

### Create User
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "nama_lengkap": "Nama User Baru",
  "role": "staff",
  "nrp": null
}
```

**Allowed Roles:** admin

### Update User
```http
PUT /api/users/{user_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "nama_lengkap": "Nama Baru",
  "role": "verifier"
}
```

**Allowed Roles:** admin

### Change Password
```http
PUT /api/users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "current_password": "oldpass123",
  "new_password": "newpass123"
}
```

**Allowed Roles:** All authenticated users

### Deactivate User
```http
DELETE /api/users/{user_id}
Authorization: Bearer <token>
```

**Allowed Roles:** admin

---

## 📊 Dashboard

### Get Statistics
```http
GET /api/dashboard/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total": 15,
  "aktif": 15,
  "pending_pengajuan": 1,
  "by_kategori": {
    "PERWIRA": 10,
    "BINTARA": 5
  },
  "by_pangkat": {
    "LETKOL ARH": 7,
    "MAYOR ARH": 3,
    "SERDA": 3,
    "SERTU": 2
  },
  "recent_activities": [
    {
      "action": "LOGIN",
      "username": "admin",
      "timestamp": "2026-01-09T17:00:00Z"
    }
  ]
}
```

---

## 📋 Reference Data

### Get Reference by Type
```http
GET /api/reference/{type}
Authorization: Bearer <token>
```

**Types:** `pangkat`, `jabatan`, `satuan`, `korps`, `agama`, `jenis_diklat`

**Response:**
```json
[
  {
    "kode": "MAYOR",
    "nama": "Mayor",
    "golongan": "IV/a"
  }
]
```

---

## 📜 Audit Log

### Get Audit Logs
```http
GET /api/audit-logs
Authorization: Bearer <token>
```

**Allowed Roles:** admin, leader

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| limit | int | Number of records (default: 100) |

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "user_uuid",
    "username": "admin",
    "action": "CREATE_PERSONEL",
    "entity_type": "personel",
    "entity_id": "nrp",
    "timestamp": "2026-01-09T10:00:00Z"
  }
]
```

---

## 🔧 System

### Initialize System
```http
POST /api/initialize-system
```

**Notes:**
- Creates default users if not exists
- Creates default reference data
- Only works when database is empty

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "database": "connected"
}
```

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid input data"
}
```

### 401 Unauthorized
```json
{
  "detail": "Token tidak valid atau expired"
}
```

### 403 Forbidden
```json
{
  "detail": "Akses ditolak"
}
```

### 404 Not Found
```json
{
  "detail": "Data tidak ditemukan"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## 📝 Notes for Developers

### Adding JWT to Requests
```javascript
// Using axios
const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL,
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

### Role Check in Backend
```python
from fastapi import Depends

@api_router.post("/some-route")
async def some_route(user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    # Only admin and staff can access
    pass
```

### MongoDB ObjectId Handling
Always exclude `_id` from responses:
```python
doc = await db.collection.find_one({"id": id}, {"_id": 0})
```
