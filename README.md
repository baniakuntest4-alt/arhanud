# SIPARHANUD - Sistem Informasi Personel Arhanud

![Version](https://img.shields.io/badge/version-2.0.0-green)
![Stack](https://img.shields.io/badge/stack-FastAPI%20%2B%20React%20%2B%20MongoDB-blue)

Aplikasi web internal untuk mengelola data kepegawaian personel TNI AD (khusus satuan Arhanud).

## 📌 Deskripsi

SIPARHANUD adalah sistem informasi kepegawaian yang digunakan untuk:
- Menyimpan & mengelola data personel (identitas, pangkat, jabatan, pendidikan, keluarga)
- Mengajukan & memverifikasi perubahan data (mutasi, kenaikan pangkat, koreksi)
- Melihat laporan & statistik personel
- Tracking riwayat perubahan data

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Tailwind CSS, Shadcn/UI |
| Backend | FastAPI (Python 3.11+) |
| Database | MongoDB |
| Authentication | JWT (JSON Web Token) |

## 📁 Struktur Project

```
/app
├── backend/
│   ├── server.py          # Main FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # React contexts (Auth)
│   │   ├── pages/        # Page components
│   │   └── App.js        # Main router
│   ├── package.json      # Node dependencies
│   └── .env             # Frontend environment
├── docs/                 # Documentation folder
│   ├── ARCHITECTURE.md   # Technical architecture
│   ├── API.md           # API documentation
│   ├── DATABASE.md      # Database schema
│   └── USER_GUIDE.md    # User guide per role
├── memory/
│   └── PRD.md           # Product Requirements Document
└── README.md            # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB 6+

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend Setup
```bash
cd frontend
yarn install
yarn start
```

### Environment Variables

**Backend (`backend/.env`)**
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="siparhanud_db"
JWT_SECRET="your-secret-key"
```

**Frontend (`frontend/.env`)**
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

## 👥 User Roles

| Role | Username | Password | Akses |
|------|----------|----------|-------|
| Administrator | `admin` | `admin123` | Semua menu |
| Staf Kepegawaian | `staff1` | `staff123` | Data Personel, Pengajuan, Laporan |
| Verifikator | `verifikator1` | `verif123` | Verifikasi, Data Personel |
| Pimpinan | `pimpinan` | `pimpin123` | Dashboard, Laporan (view only) |
| Personel | `personel1` | `personel123` | Profil Saya, Pengajuan Koreksi |

## 📚 Dokumentasi Lengkap

- [Architecture Guide](docs/ARCHITECTURE.md) - Arsitektur teknis sistem
- [API Documentation](docs/API.md) - Daftar endpoint API
- [Database Schema](docs/DATABASE.md) - Struktur database MongoDB
- [User Guide](docs/USER_GUIDE.md) - Panduan penggunaan per role

## 🔄 Alur Sistem

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Personel  │───▶│    Staf     │───▶│ Verifikator │
│ Ajukan      │    │ Input Data  │    │ Approve/    │
│ Koreksi     │    │ Personel    │    │ Reject      │
└─────────────┘    └─────────────┘    └─────────────┘
                          │                  │
                          ▼                  ▼
                   ┌─────────────┐    ┌─────────────┐
                   │  Pimpinan   │    │   Admin     │
                   │  Monitoring │    │ Kelola User │
                   └─────────────┘    └─────────────┘
```

## 🎨 Color Scheme

| Warna | Hex Code | Penggunaan |
|-------|----------|------------|
| Hijau Army | `#4A5D23` | Primary color, sidebar, buttons |
| Kuning Emas | `#D4AF37` | Secondary, highlights |
| Merah Marun | `#8B0000` | Accent, alerts |
| White | `#FFFFFF` | Background |

## 📝 License

Internal use only - TNI AD Arhanud

## 👨‍💻 Development Team

Developed with Emergent AI Platform
