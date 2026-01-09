# Development Guide - SIPARHANUD

Panduan untuk developer yang akan melanjutkan pengembangan sistem.

---

## 🚀 Quick Start Development

### 1. Clone & Setup
```bash
# Clone repository
git clone <repo-url>
cd siparhanud

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
yarn install
```

### 2. Environment Variables

**Backend (`backend/.env`)**
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="siparhanud_db"
JWT_SECRET="your-super-secret-key-change-in-production"
```

**Frontend (`frontend/.env`)**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### 3. Run Development Servers
```bash
# Terminal 1 - Backend
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2 - Frontend
cd frontend
yarn start
```

### 4. Initialize Database
```bash
# Buka browser, akses:
POST http://localhost:8001/api/initialize-system

# Atau via curl:
curl -X POST http://localhost:8001/api/initialize-system
```

---

## 📁 Project Structure Explained

```
/app
├── backend/
│   ├── server.py           # ⭐ MAIN FILE - All backend logic
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/        # Shadcn/UI components (DON'T MODIFY)
│   │   │   └── Layout.js  # ⭐ Main layout with sidebar
│   │   │
│   │   ├── contexts/
│   │   │   └── AuthContext.js  # ⭐ Auth state management
│   │   │
│   │   ├── pages/         # ⭐ All page components
│   │   │   ├── LoginPage.js
│   │   │   ├── DashboardPage.js
│   │   │   ├── DashboardPersonelPage.js
│   │   │   ├── PersonelListPage.js
│   │   │   ├── PersonelDetailPage.js
│   │   │   ├── PersonelFormPage.js
│   │   │   ├── ProfilSayaPage.js
│   │   │   ├── PengajuanSayaPage.js
│   │   │   ├── PengajuanPage.js
│   │   │   ├── VerifikasiPage.js
│   │   │   ├── UserManagementPage.js
│   │   │   ├── ReportsPage.js
│   │   │   ├── AuditLogPage.js
│   │   │   └── PengaturanPage.js
│   │   │
│   │   ├── App.js         # ⭐ Router & protected routes
│   │   ├── App.css        # Global styles
│   │   └── index.css      # Tailwind imports
│   │
│   ├── package.json
│   └── tailwind.config.js
│
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── USER_GUIDE.md
│   └── DEVELOPMENT.md     # This file
│
└── memory/
    └── PRD.md             # Product requirements
```

---

## 🔧 Common Development Tasks

### Adding a New Page

1. **Create page component:**
```jsx
// frontend/src/pages/NewPage.js
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export const NewPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New Page</h1>
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
        <CardContent>
          Content here
        </CardContent>
      </Card>
    </div>
  );
};

export default NewPage;
```

2. **Add route in App.js:**
```jsx
import NewPage from './pages/NewPage';

// Inside AppRoutes function:
<Route 
  path="/new-page" 
  element={
    <ProtectedRoute allowedRoles={['admin', 'staff']}>
      <NewPage />
    </ProtectedRoute>
  } 
/>
```

3. **Add menu item in Layout.js:**
```jsx
// Find menuItems object and add:
admin: [
  // ... existing items
  { icon: SomeIcon, label: 'New Page', path: '/new-page' },
],
```

### Adding a New API Endpoint

1. **Add in server.py:**
```python
@api_router.get("/new-endpoint")
async def new_endpoint(user: dict = Depends(get_current_user)):
    """Description of endpoint"""
    # Your logic here
    result = await db.collection.find({}, {"_id": 0}).to_list(100)
    return result

@api_router.post("/new-endpoint")
async def create_new_item(
    data: dict = Body(...), 
    user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))
):
    """Create new item - admin/staff only"""
    data["id"] = generate_id()
    data["created_at"] = now_isoformat()
    await db.collection.insert_one(data)
    await create_audit_log(user["id"], user["username"], "CREATE_ITEM", "collection", data["id"])
    return {"message": "Success", "id": data["id"]}
```

2. **Call from frontend:**
```jsx
const { api } = useAuth();

// GET
const fetchData = async () => {
  const response = await api.get('/new-endpoint');
  setData(response.data);
};

// POST
const createItem = async (data) => {
  const response = await api.post('/new-endpoint', data);
  return response.data;
};
```

### Adding a New Database Collection

1. **Define schema in DATABASE.md**

2. **Add CRUD endpoints in server.py:**
```python
# Create
@api_router.post("/collection")
async def create_item(...):
    pass

# Read all
@api_router.get("/collection")
async def get_items(...):
    pass

# Read one
@api_router.get("/collection/{id}")
async def get_item(id: str, ...):
    pass

# Update
@api_router.put("/collection/{id}")
async def update_item(id: str, ...):
    pass

# Delete (soft)
@api_router.delete("/collection/{id}")
async def delete_item(id: str, ...):
    pass
```

---

## 🎨 UI Components (Shadcn/UI)

### Available Components
Located in `frontend/src/components/ui/`:

| Component | Usage |
|-----------|-------|
| `button` | Buttons with variants |
| `card` | Card containers |
| `input` | Text inputs |
| `select` | Dropdown selects |
| `dialog` | Modal dialogs |
| `alert` | Alert messages |
| `badge` | Status badges |
| `table` | Data tables |
| `tabs` | Tab navigation |
| `skeleton` | Loading placeholders |
| `separator` | Dividers |
| `sonner` | Toast notifications |

### Usage Example
```jsx
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Badge variant="outline">Status</Badge>
    <Button className="bg-[#4A5D23]">Action</Button>
  </CardContent>
</Card>
```

### Color Palette
```css
/* Primary - Hijau Army */
bg-[#4A5D23]
text-[#4A5D23]
border-[#4A5D23]

/* Secondary - Kuning Emas */
bg-[#D4AF37]
text-[#D4AF37]
border-[#D4AF37]

/* Accent - Merah Marun */
bg-[#8B0000]
text-[#8B0000]
border-[#8B0000]
```

---

## 🔐 Authentication & Authorization

### How Auth Works

1. **Login Flow:**
```
User submits credentials
    ↓
POST /api/auth/login
    ↓
Backend verifies password (bcrypt)
    ↓
Generate JWT token (user_id, role)
    ↓
Return token to frontend
    ↓
Frontend stores in localStorage
    ↓
AuthContext sets user state
```

2. **Protected Request:**
```
Frontend calls api.get('/endpoint')
    ↓
Axios interceptor adds: Authorization: Bearer <token>
    ↓
Backend get_current_user() validates token
    ↓
If valid, continue; else 401 Unauthorized
```

### Adding Role Restrictions

**Backend:**
```python
@api_router.post("/admin-only")
async def admin_only(user: dict = Depends(require_roles(UserRole.ADMIN))):
    pass

@api_router.post("/multi-role")
async def multi_role(user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    pass
```

**Frontend:**
```jsx
<ProtectedRoute allowedRoles={['admin']}>
  <AdminPage />
</ProtectedRoute>

// Or check in component:
const { user } = useAuth();
if (user?.role !== 'admin') return <AccessDenied />;
```

---

## 🐛 Debugging Tips

### Backend Logs
```bash
# Watch uvicorn output for errors
uvicorn server:app --reload

# Common issues:
# - MongoDB connection failed → Check MONGO_URL
# - JWT decode error → Check JWT_SECRET
# - 422 Validation Error → Check request body
```

### Frontend Logs
```javascript
// Add console.log in components
console.log('User:', user);
console.log('Response:', response.data);

// Check browser DevTools:
// - Console tab for errors
// - Network tab for API calls
```

### MongoDB Queries
```bash
# Connect to MongoDB shell
mongosh

# Select database
use siparhanud_db

# View collections
show collections

# Query examples
db.users.find().pretty()
db.personel.find({kategori: "PERWIRA"}).pretty()
db.pengajuan.find({status: "pending"}).pretty()
```

---

## 📝 Code Conventions

### Python (Backend)
```python
# Function names: snake_case
async def get_personel_by_nrp(nrp: str):
    pass

# Constants: UPPER_CASE
JWT_SECRET = os.environ.get("JWT_SECRET")

# Always exclude _id from MongoDB responses
doc = await db.collection.find_one({"id": id}, {"_id": 0})

# Always use generate_id() for new documents
data["id"] = generate_id()

# Always add timestamps
data["created_at"] = now_isoformat()
```

### JavaScript/React (Frontend)
```jsx
// Component names: PascalCase
export const PersonelListPage = () => { ... }

// Function names: camelCase
const handleSubmit = async () => { ... }

// Use data-testid for testing
<Button data-testid="submit-btn">Submit</Button>

// Use useAuth hook for API calls
const { api } = useAuth();
const response = await api.get('/endpoint');
```

---

## 🧪 Testing Checklist

Before pushing changes:

- [ ] Login works for all 5 roles
- [ ] Dashboard loads without errors
- [ ] Can create/edit/view personel (as staff)
- [ ] Can submit pengajuan (as personel)
- [ ] Can verify pengajuan (as verifikator)
- [ ] Role restrictions work correctly
- [ ] No console errors in browser
- [ ] No Python errors in terminal

---

## 🚀 Deployment Notes

### Production Checklist
- [ ] Change JWT_SECRET to strong random string
- [ ] Set proper CORS origins (not "*")
- [ ] Enable MongoDB authentication
- [ ] Use HTTPS
- [ ] Set secure cookie flags
- [ ] Configure rate limiting
- [ ] Setup monitoring/logging

### Environment Variables (Production)
```env
# Backend
MONGO_URL="mongodb://user:pass@host:27017/siparhanud?authSource=admin"
DB_NAME="siparhanud_prod"
JWT_SECRET="<random-64-char-string>"
CORS_ORIGINS="https://yourdomain.com"

# Frontend
REACT_APP_BACKEND_URL=https://api.yourdomain.com
```

---

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Manual](https://www.mongodb.com/docs/manual/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn/UI](https://ui.shadcn.com/)
