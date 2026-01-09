# Architecture Guide - SIPARHANUD

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   React Frontend                     │    │
│  │  • Pages (Dashboard, Personel, Verifikasi, etc.)    │    │
│  │  • Components (UI, Layout, Forms)                   │    │
│  │  • Context (AuthContext)                            │    │
│  │  • Shadcn/UI + Tailwind CSS                         │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              │ (JWT Authentication)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        SERVER LAYER                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  FastAPI Backend                     │    │
│  │  • API Routes (/api/*)                              │    │
│  │  • Authentication & Authorization                   │    │
│  │  • Business Logic                                   │    │
│  │  • Data Validation (Pydantic)                       │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ MongoDB Driver
                              │ (Motor - Async)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        DATA LAYER                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    MongoDB                           │    │
│  │  • Collections (personel, users, pengajuan, etc.)   │    │
│  │  • Reference Tables (ref_pangkat, ref_jabatan)      │    │
│  │  • Audit Logs                                       │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 🗂️ Frontend Architecture

### Directory Structure

```
frontend/src/
├── components/
│   ├── ui/                    # Shadcn/UI components
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   ├── dialog.jsx
│   │   ├── input.jsx
│   │   ├── select.jsx
│   │   ├── table.jsx
│   │   ├── tabs.jsx
│   │   └── ...
│   └── Layout.js              # Main layout with sidebar
├── contexts/
│   └── AuthContext.js         # Authentication state management
├── pages/
│   ├── LoginPage.js           # Login form
│   ├── DashboardPage.js       # Admin/Staff/Verifier dashboard
│   ├── DashboardPersonelPage.js  # Personnel dashboard
│   ├── PersonelListPage.js    # Personnel list with filters
│   ├── PersonelDetailPage.js  # Personnel detail view (tabs)
│   ├── PersonelFormPage.js    # Add/Edit personnel form
│   ├── ProfilSayaPage.js      # My profile (personnel role)
│   ├── PengajuanSayaPage.js   # My submissions (personnel role)
│   ├── PengajuanPage.js       # Submissions management
│   ├── VerifikasiPage.js      # Verification page
│   ├── UserManagementPage.js  # User management (admin)
│   ├── ReportsPage.js         # Reports
│   ├── AuditLogPage.js        # Activity logs
│   └── PengaturanPage.js      # Settings
├── App.js                     # Main router & protected routes
├── App.css                    # Global styles
└── index.css                  # Tailwind imports
```

### Key Concepts

#### 1. Authentication Flow
```javascript
// AuthContext.js provides:
- user: Current logged-in user object
- login(username, password): Login function
- logout(): Logout function
- api: Axios instance with JWT header
- isAuthenticated: Boolean auth status
```

#### 2. Protected Routes
```javascript
// App.js
<ProtectedRoute allowedRoles={['admin', 'staff']}>
  <SomePage />
</ProtectedRoute>
```

#### 3. Role-Based Menu
```javascript
// Layout.js - menuItems per role
admin: [Dashboard, Data Personel, Pengajuan, Users, Master Data, Laporan, Audit Log]
staff: [Dashboard, Data Personel, Dikbang, Prestasi, Kesejahteraan, Pengajuan, Laporan]
verifier: [Dashboard, Verifikasi, Data Personel, Laporan]
leader: [Dashboard, Data Personel, Laporan, Audit Log]
personnel: [Dashboard, Profil Saya, Pengajuan Koreksi, Pengaturan]
```

## 🔧 Backend Architecture

### File Structure

```
backend/
├── server.py              # Single file containing all logic
├── requirements.txt       # Python dependencies
└── .env                  # Environment variables
```

### server.py Structure

```python
# 1. Imports & Configuration
from fastapi import FastAPI, APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient
# ... other imports

# 2. Constants & Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    STAFF = "staff"
    VERIFIER = "verifier"
    LEADER = "leader"
    PERSONNEL = "personnel"

# 3. Database Connection
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# 4. Utility Functions
def hash_password(password: str) -> str
def verify_password(plain: str, hashed: str) -> bool
def create_access_token(data: dict) -> str
def generate_id() -> str
def now_isoformat() -> str

# 5. Authentication Functions
async def get_current_user(token: str) -> dict
def require_roles(*roles) -> Callable

# 6. API Routes
# - Auth: /auth/login, /auth/me
# - Personel: /personel, /personel/{nrp}
# - Pengajuan: /pengajuan
# - Users: /users
# - Dashboard: /dashboard/stats
# - Reference: /reference/{type}
# ... etc

# 7. App Initialization
app = FastAPI(title="SIPARHANUD API")
app.include_router(api_router, prefix="/api")
```

### Authentication Flow

```
1. User submits username/password to POST /api/auth/login
2. Backend verifies credentials against MongoDB
3. If valid, generates JWT token with user_id and role
4. Frontend stores token in localStorage
5. All subsequent requests include: Authorization: Bearer <token>
6. Backend validates token on each request via get_current_user()
```

### Role-Based Access Control

```python
# Example: Only admin and staff can create personel
@api_router.post("/personel")
async def create_personel(
    data: dict = Body(...), 
    user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))
):
    # ... create logic
```

## 🗄️ Database Design

### Design Principles

1. **Normalized Schema** - Data split into multiple collections to avoid duplication
2. **Reference Tables** - Configurable dropdowns (pangkat, jabatan, satuan)
3. **History Tracking** - Separate collections for riwayat (history)
4. **NRP as Foreign Key** - Personnel identified by NRP across collections
5. **Soft Delete** - Records marked inactive, not deleted

### Collections Overview

```
MongoDB Database: siparhanud_db
│
├── users                 # User accounts
├── personel              # Master personnel data
├── ref_pangkat           # Reference: Ranks
├── ref_jabatan           # Reference: Positions
├── ref_satuan            # Reference: Units
├── ref_korps             # Reference: Corps
├── ref_agama             # Reference: Religions
├── riwayat_pangkat       # Rank history
├── riwayat_jabatan       # Position history
├── dikbang               # Education/training
├── prestasi              # Achievements
├── tanda_jasa            # Medals/awards
├── keluarga              # Family members
├── kesejahteraan         # Welfare data
├── pengajuan             # Submissions
└── audit_logs            # Activity logs
```

## 🔐 Security

### Authentication
- JWT tokens with 8-hour expiration
- Passwords hashed with bcrypt
- Token required for all API routes except /login

### Authorization
- Role-based access control (RBAC)
- Route-level permission checks
- Data-level filtering (personnel can only see own data)

### Best Practices
- No sensitive data in JWT payload (only user_id, role)
- CORS configured for frontend origin only
- Input validation via Pydantic models
- SQL injection not applicable (NoSQL)

## 📊 Data Flow Examples

### 1. Personnel Views Own Profile
```
[Frontend]                    [Backend]                    [MongoDB]
     │                            │                            │
     │ GET /api/personel/{nrp}   │                            │
     │ + JWT Token               │                            │
     │ ─────────────────────────▶│                            │
     │                            │ Verify JWT                │
     │                            │ Check role = personnel     │
     │                            │ Check nrp matches user.nrp │
     │                            │                            │
     │                            │ db.personel.find_one()    │
     │                            │ ──────────────────────────▶│
     │                            │◀──────────────────────────│
     │                            │                            │
     │◀───────────────────────── │ Return personnel data      │
     │ Display profile            │                            │
```

### 2. Personnel Submits Correction
```
[Personnel]                   [Backend]                    [MongoDB]
     │                            │                            │
     │ POST /api/pengajuan        │                            │
     │ {field, nilai_baru, alasan}│                            │
     │ ─────────────────────────▶│                            │
     │                            │ Validate: nrp = user.nrp  │
     │                            │ Validate: jenis = koreksi │
     │                            │                            │
     │                            │ db.pengajuan.insert_one() │
     │                            │ db.audit_logs.insert_one()│
     │                            │ ──────────────────────────▶│
     │                            │                            │
     │◀─────────────────────────  │ {success, id}             │
```

### 3. Verifier Approves Submission
```
[Verifier]                    [Backend]                    [MongoDB]
     │                            │                            │
     │ PUT /api/pengajuan/{id}    │                            │
     │ {status: approved}         │                            │
     │ ─────────────────────────▶│                            │
     │                            │ Validate: role = verifier │
     │                            │                            │
     │                            │ db.pengajuan.update_one() │
     │                            │ db.audit_logs.insert_one()│
     │                            │ ──────────────────────────▶│
     │                            │                            │
     │◀─────────────────────────  │ {success}                 │
```

## 🚀 Deployment

### Development
```bash
# Backend
cd backend && uvicorn server:app --reload --port 8001

# Frontend
cd frontend && yarn start
```

### Production
- Use supervisor/systemd for process management
- Enable HTTPS via nginx reverse proxy
- Set proper CORS origins
- Use environment variables for secrets
- Enable MongoDB authentication

## 🔮 Future Improvements

1. **PWA Support** - Offline capability, installable app
2. **File Upload** - Document attachments (SK, ijazah)
3. **Notifications** - Real-time alerts for pengajuan status
4. **Export PDF/Excel** - Report generation
5. **Batch Import** - Excel upload for bulk data
6. **API Rate Limiting** - Prevent abuse
7. **Caching** - Redis for frequently accessed data
