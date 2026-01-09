from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Query, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from enum import Enum
import io
import pandas as pd

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'siparhanud-secret-key-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Create the main app
app = FastAPI(title="SIPARHANUD API", version="2.0.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ================== ENUMS ==================
class UserRole(str, Enum):
    ADMIN = "admin"
    STAFF = "staff"
    VERIFIER = "verifier"
    LEADER = "leader"
    PERSONNEL = "personnel"

class RequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class Kategori(str, Enum):
    PERWIRA = "PERWIRA"
    BINTARA = "BINTARA"
    TAMTAMA = "TAMTAMA"
    PNS = "PNS"

class JenisKelamin(str, Enum):
    L = "L"
    P = "P"

class StatusPersonel(str, Enum):
    AKTIF = "AKTIF"
    PENSIUN = "PENSIUN"
    MUTASI = "MUTASI"
    MENINGGAL = "MENINGGAL"
    DIBERHENTIKAN = "DIBERHENTIKAN"

# ================== HELPER FUNCTIONS ==================
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def generate_id() -> str:
    return str(uuid.uuid4())

def now_isoformat() -> str:
    return datetime.now(timezone.utc).isoformat()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token tidak valid")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User tidak ditemukan")
        if not user.get("is_active", True):
            raise HTTPException(status_code=401, detail="User tidak aktif")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token sudah kadaluarsa")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token tidak valid")

def require_roles(*roles: UserRole):
    async def role_checker(user: dict = Depends(get_current_user)):
        if user["role"] not in [r.value for r in roles]:
            raise HTTPException(status_code=403, detail="Akses ditolak")
        return user
    return role_checker

async def create_audit_log(user_id: str, username: str, action: str, entity_type: str, 
                           entity_id: str = None, old_value: dict = None, new_value: dict = None):
    log = {
        "id": generate_id(),
        "user_id": user_id,
        "username": username,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "old_value": old_value,
        "new_value": new_value,
        "timestamp": now_isoformat()
    }
    await db.audit_logs.insert_one(log)

# ================== AUTH ROUTES ==================
@api_router.post("/auth/login")
async def login(credentials: dict = Body(...)):
    user = await db.users.find_one({"username": credentials["username"]}, {"_id": 0})
    if not user or not verify_password(credentials["password"], user["password"]):
        raise HTTPException(status_code=401, detail="Username atau password salah")
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Akun tidak aktif")
    
    token = create_access_token({"sub": user["id"], "role": user["role"]})
    await create_audit_log(user["id"], user["username"], "LOGIN", "auth")
    
    user_response = {k: v for k, v in user.items() if k != "password"}
    return {"access_token": token, "token_type": "bearer", "user": user_response}

@api_router.post("/auth/logout")
async def logout(user: dict = Depends(get_current_user)):
    await create_audit_log(user["id"], user["username"], "LOGOUT", "auth")
    return {"message": "Logout berhasil"}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {k: v for k, v in user.items() if k != "password"}

# ================== REFERENCE DATA ROUTES ==================
REFERENCE_COLLECTIONS = {
    "pangkat": "ref_pangkat",
    "jabatan": "ref_jabatan", 
    "satuan": "ref_satuan",
    "korps": "ref_korps",
    "agama": "ref_agama",
    "jenis_diklat": "ref_jenis_diklat",
    "status_personel": "ref_status_personel",
    "tanda_jasa": "ref_tanda_jasa",
    "jenis_hukuman": "ref_jenis_hukuman",
    "jenis_cuti": "ref_jenis_cuti",
    "hubungan_keluarga": "ref_hubungan_keluarga"
}

@api_router.get("/reference/{ref_type}")
async def get_reference_data(ref_type: str, user: dict = Depends(get_current_user)):
    if ref_type not in REFERENCE_COLLECTIONS:
        raise HTTPException(status_code=404, detail="Tipe referensi tidak ditemukan")
    
    collection = REFERENCE_COLLECTIONS[ref_type]
    data = await db[collection].find({}, {"_id": 0}).sort("urutan", 1).to_list(1000)
    return data

@api_router.post("/reference/{ref_type}")
async def create_reference_data(ref_type: str, data: dict = Body(...), user: dict = Depends(require_roles(UserRole.ADMIN))):
    if ref_type not in REFERENCE_COLLECTIONS:
        raise HTTPException(status_code=404, detail="Tipe referensi tidak ditemukan")
    
    collection = REFERENCE_COLLECTIONS[ref_type]
    data["id"] = generate_id()
    data["created_at"] = now_isoformat()
    
    await db[collection].insert_one(data)
    await create_audit_log(user["id"], user["username"], f"CREATE_REF_{ref_type.upper()}", collection, data["id"])
    
    return {"message": "Data berhasil ditambahkan", "id": data["id"]}

@api_router.put("/reference/{ref_type}/{item_id}")
async def update_reference_data(ref_type: str, item_id: str, data: dict = Body(...), user: dict = Depends(require_roles(UserRole.ADMIN))):
    if ref_type not in REFERENCE_COLLECTIONS:
        raise HTTPException(status_code=404, detail="Tipe referensi tidak ditemukan")
    
    collection = REFERENCE_COLLECTIONS[ref_type]
    data.pop("id", None)
    data.pop("_id", None)
    data["updated_at"] = now_isoformat()
    
    result = await db[collection].update_one({"id": item_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    
    await create_audit_log(user["id"], user["username"], f"UPDATE_REF_{ref_type.upper()}", collection, item_id)
    return {"message": "Data berhasil diupdate"}

@api_router.delete("/reference/{ref_type}/{item_id}")
async def delete_reference_data(ref_type: str, item_id: str, user: dict = Depends(require_roles(UserRole.ADMIN))):
    if ref_type not in REFERENCE_COLLECTIONS:
        raise HTTPException(status_code=404, detail="Tipe referensi tidak ditemukan")
    
    collection = REFERENCE_COLLECTIONS[ref_type]
    result = await db[collection].delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    
    await create_audit_log(user["id"], user["username"], f"DELETE_REF_{ref_type.upper()}", collection, item_id)
    return {"message": "Data berhasil dihapus"}

# ================== PERSONEL ROUTES ==================
@api_router.get("/personel")
async def get_all_personel(
    search: Optional[str] = None,
    kategori: Optional[str] = None,
    pangkat: Optional[str] = None,
    satuan: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    user: dict = Depends(get_current_user)
):
    query = {}
    
    # Personnel can only see their own data
    if user["role"] == UserRole.PERSONNEL.value:
        query["nrp"] = user.get("nrp")
    
    if search:
        query["$or"] = [
            {"nama_lengkap": {"$regex": search, "$options": "i"}},
            {"nrp": {"$regex": search, "$options": "i"}}
        ]
    if kategori:
        query["kategori"] = kategori
    if pangkat:
        query["pangkat"] = pangkat
    if satuan:
        query["satuan_induk"] = {"$regex": satuan, "$options": "i"}
    if status:
        query["status_personel"] = status
    
    personel = await db.personel.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.personel.count_documents(query)
    
    return {"data": personel, "total": total}

@api_router.get("/personel/stats")
async def get_personel_stats(user: dict = Depends(get_current_user)):
    total = await db.personel.count_documents({})
    aktif = await db.personel.count_documents({"status_personel": "AKTIF"})
    
    by_kategori = await db.personel.aggregate([
        {"$group": {"_id": "$kategori", "count": {"$sum": 1}}}
    ]).to_list(10)
    
    by_pangkat = await db.personel.aggregate([
        {"$match": {"status_personel": "AKTIF"}},
        {"$group": {"_id": "$pangkat", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 15}
    ]).to_list(15)
    
    by_satuan = await db.personel.aggregate([
        {"$match": {"status_personel": "AKTIF"}},
        {"$group": {"_id": "$satuan_induk", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]).to_list(10)
    
    pending_pengajuan = await db.pengajuan.count_documents({"status": "pending"})
    
    return {
        "total": total,
        "aktif": aktif,
        "pending_pengajuan": pending_pengajuan,
        "by_kategori": {item["_id"]: item["count"] for item in by_kategori if item["_id"]},
        "by_pangkat": {item["_id"]: item["count"] for item in by_pangkat if item["_id"]},
        "by_satuan": {item["_id"]: item["count"] for item in by_satuan if item["_id"]}
    }

@api_router.get("/personel/{nrp}")
async def get_personel_by_nrp(nrp: str, user: dict = Depends(get_current_user)):
    # Personnel can only see their own data
    if user["role"] == UserRole.PERSONNEL.value and user.get("nrp") != nrp:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    personel = await db.personel.find_one({"nrp": nrp}, {"_id": 0})
    if not personel:
        raise HTTPException(status_code=404, detail="Personel tidak ditemukan")
    return personel

@api_router.post("/personel")
async def create_personel(data: dict = Body(...), user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    existing = await db.personel.find_one({"nrp": data["nrp"]})
    if existing:
        raise HTTPException(status_code=400, detail="NRP sudah terdaftar")
    
    data["id"] = generate_id()
    data["created_at"] = now_isoformat()
    data["created_by"] = user["id"]
    
    await db.personel.insert_one(data)
    await create_audit_log(user["id"], user["username"], "CREATE_PERSONEL", "personel", data["nrp"], new_value=data)
    
    return {"message": "Personel berhasil ditambahkan", "nrp": data["nrp"]}

@api_router.put("/personel/{nrp}")
async def update_personel(nrp: str, data: dict = Body(...), user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    existing = await db.personel.find_one({"nrp": nrp}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Personel tidak ditemukan")
    
    data.pop("nrp", None)
    data.pop("_id", None)
    data["updated_at"] = now_isoformat()
    data["updated_by"] = user["id"]
    
    await db.personel.update_one({"nrp": nrp}, {"$set": data})
    await create_audit_log(user["id"], user["username"], "UPDATE_PERSONEL", "personel", nrp, existing, data)
    
    return {"message": "Personel berhasil diupdate"}

# ================== RIWAYAT JABATAN ROUTES ==================
@api_router.get("/personel/{nrp}/riwayat-jabatan")
async def get_riwayat_jabatan(nrp: str, user: dict = Depends(get_current_user)):
    data = await db.riwayat_jabatan.find({"nrp": nrp}, {"_id": 0}).sort("tmt_jabatan", -1).to_list(100)
    return data

@api_router.post("/personel/{nrp}/riwayat-jabatan")
async def create_riwayat_jabatan(nrp: str, data: dict = Body(...), user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    personel = await db.personel.find_one({"nrp": nrp})
    if not personel:
        raise HTTPException(status_code=404, detail="Personel tidak ditemukan")
    
    data["id"] = generate_id()
    data["nrp"] = nrp
    data["created_at"] = now_isoformat()
    
    await db.riwayat_jabatan.insert_one(data)
    
    # Update current jabatan if this is the latest
    if data.get("status_jabatan") == "AKTIF":
        await db.personel.update_one({"nrp": nrp}, {"$set": {
            "jabatan_sekarang": data.get("jabatan"),
            "satuan_induk": data.get("satuan")
        }})
    
    await create_audit_log(user["id"], user["username"], "CREATE_RIWAYAT_JABATAN", "riwayat_jabatan", data["id"])
    return {"message": "Riwayat jabatan berhasil ditambahkan", "id": data["id"]}

# ================== RIWAYAT PANGKAT ROUTES ==================
@api_router.get("/personel/{nrp}/riwayat-pangkat")
async def get_riwayat_pangkat(nrp: str, user: dict = Depends(get_current_user)):
    data = await db.riwayat_pangkat.find({"nrp": nrp}, {"_id": 0}).sort("tmt_pangkat", -1).to_list(100)
    return data

@api_router.post("/personel/{nrp}/riwayat-pangkat")
async def create_riwayat_pangkat(nrp: str, data: dict = Body(...), user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    personel = await db.personel.find_one({"nrp": nrp})
    if not personel:
        raise HTTPException(status_code=404, detail="Personel tidak ditemukan")
    
    data["id"] = generate_id()
    data["nrp"] = nrp
    data["created_at"] = now_isoformat()
    
    await db.riwayat_pangkat.insert_one(data)
    
    # Update current pangkat
    await db.personel.update_one({"nrp": nrp}, {"$set": {
        "pangkat": data.get("pangkat"),
        "tmt_pangkat": data.get("tmt_pangkat")
    }})
    
    await create_audit_log(user["id"], user["username"], "CREATE_RIWAYAT_PANGKAT", "riwayat_pangkat", data["id"])
    return {"message": "Riwayat pangkat berhasil ditambahkan", "id": data["id"]}

# ================== DIKBANG ROUTES ==================
@api_router.get("/personel/{nrp}/dikbang")
async def get_dikbang(nrp: str, jenis: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {"nrp": nrp}
    if jenis:
        query["jenis_diklat"] = jenis
    data = await db.dikbang.find(query, {"_id": 0}).sort("tahun", -1).to_list(100)
    return data

@api_router.post("/personel/{nrp}/dikbang")
async def create_dikbang(nrp: str, data: dict = Body(...), user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    personel = await db.personel.find_one({"nrp": nrp})
    if not personel:
        raise HTTPException(status_code=404, detail="Personel tidak ditemukan")
    
    data["id"] = generate_id()
    data["nrp"] = nrp
    data["created_at"] = now_isoformat()
    
    await db.dikbang.insert_one(data)
    await create_audit_log(user["id"], user["username"], "CREATE_DIKBANG", "dikbang", data["id"])
    return {"message": "Dikbang berhasil ditambahkan", "id": data["id"]}

@api_router.put("/dikbang/{dikbang_id}")
async def update_dikbang(dikbang_id: str, data: dict = Body(...), user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    existing = await db.dikbang.find_one({"id": dikbang_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    
    data.pop("id", None)
    data.pop("_id", None)
    data["updated_at"] = now_isoformat()
    
    await db.dikbang.update_one({"id": dikbang_id}, {"$set": data})
    await create_audit_log(user["id"], user["username"], "UPDATE_DIKBANG", "dikbang", dikbang_id)
    return {"message": "Dikbang berhasil diupdate"}

@api_router.delete("/dikbang/{dikbang_id}")
async def delete_dikbang(dikbang_id: str, user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    result = await db.dikbang.delete_one({"id": dikbang_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    await create_audit_log(user["id"], user["username"], "DELETE_DIKBANG", "dikbang", dikbang_id)
    return {"message": "Dikbang berhasil dihapus"}

# ================== PRESTASI ROUTES ==================
@api_router.get("/personel/{nrp}/prestasi")
async def get_prestasi(nrp: str, user: dict = Depends(get_current_user)):
    data = await db.prestasi.find({"nrp": nrp}, {"_id": 0}).sort("tahun", -1).to_list(100)
    return data

@api_router.post("/personel/{nrp}/prestasi")
async def create_prestasi(nrp: str, data: dict = Body(...), user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    personel = await db.personel.find_one({"nrp": nrp})
    if not personel:
        raise HTTPException(status_code=404, detail="Personel tidak ditemukan")
    
    data["id"] = generate_id()
    data["nrp"] = nrp
    data["created_at"] = now_isoformat()
    
    await db.prestasi.insert_one(data)
    await create_audit_log(user["id"], user["username"], "CREATE_PRESTASI", "prestasi", data["id"])
    return {"message": "Prestasi berhasil ditambahkan", "id": data["id"]}

# ================== TANDA JASA ROUTES ==================
@api_router.get("/personel/{nrp}/tanda-jasa")
async def get_tanda_jasa(nrp: str, user: dict = Depends(get_current_user)):
    data = await db.tanda_jasa.find({"nrp": nrp}, {"_id": 0}).sort("tahun", -1).to_list(100)
    return data

@api_router.post("/personel/{nrp}/tanda-jasa")
async def create_tanda_jasa(nrp: str, data: dict = Body(...), user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    personel = await db.personel.find_one({"nrp": nrp})
    if not personel:
        raise HTTPException(status_code=404, detail="Personel tidak ditemukan")
    
    data["id"] = generate_id()
    data["nrp"] = nrp
    data["created_at"] = now_isoformat()
    
    await db.tanda_jasa.insert_one(data)
    await create_audit_log(user["id"], user["username"], "CREATE_TANDA_JASA", "tanda_jasa", data["id"])
    return {"message": "Tanda jasa berhasil ditambahkan", "id": data["id"]}

# ================== KELUARGA ROUTES ==================
@api_router.get("/personel/{nrp}/keluarga")
async def get_keluarga(nrp: str, user: dict = Depends(get_current_user)):
    data = await db.keluarga.find({"nrp": nrp}, {"_id": 0}).to_list(100)
    return data

@api_router.post("/personel/{nrp}/keluarga")
async def create_keluarga(nrp: str, data: dict = Body(...), user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    personel = await db.personel.find_one({"nrp": nrp})
    if not personel:
        raise HTTPException(status_code=404, detail="Personel tidak ditemukan")
    
    data["id"] = generate_id()
    data["nrp"] = nrp
    data["created_at"] = now_isoformat()
    
    await db.keluarga.insert_one(data)
    await create_audit_log(user["id"], user["username"], "CREATE_KELUARGA", "keluarga", data["id"])
    return {"message": "Data keluarga berhasil ditambahkan", "id": data["id"]}

# ================== KESEJAHTERAAN ROUTES ==================
@api_router.get("/personel/{nrp}/kesejahteraan")
async def get_kesejahteraan(nrp: str, user: dict = Depends(get_current_user)):
    data = await db.kesejahteraan.find_one({"nrp": nrp}, {"_id": 0})
    return data or {}

@api_router.post("/personel/{nrp}/kesejahteraan")
async def upsert_kesejahteraan(nrp: str, data: dict = Body(...), user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    personel = await db.personel.find_one({"nrp": nrp})
    if not personel:
        raise HTTPException(status_code=404, detail="Personel tidak ditemukan")
    
    data["nrp"] = nrp
    data["updated_at"] = now_isoformat()
    
    existing = await db.kesejahteraan.find_one({"nrp": nrp})
    if existing:
        await db.kesejahteraan.update_one({"nrp": nrp}, {"$set": data})
    else:
        data["id"] = generate_id()
        data["created_at"] = now_isoformat()
        await db.kesejahteraan.insert_one(data)
    
    await create_audit_log(user["id"], user["username"], "UPSERT_KESEJAHTERAAN", "kesejahteraan", nrp)
    return {"message": "Data kesejahteraan berhasil disimpan"}

# ================== KESJAS (KESEHATAN JASMANI) ROUTES ==================
@api_router.get("/personel/{nrp}/kesjas")
async def get_kesjas(nrp: str, user: dict = Depends(get_current_user)):
    data = await db.kesjas.find({"nrp": nrp}, {"_id": 0}).sort("tanggal_tes", -1).to_list(100)
    return data

@api_router.post("/personel/{nrp}/kesjas")
async def create_kesjas(nrp: str, data: dict = Body(...), user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    personel = await db.personel.find_one({"nrp": nrp})
    if not personel:
        raise HTTPException(status_code=404, detail="Personel tidak ditemukan")
    
    data["id"] = generate_id()
    data["nrp"] = nrp
    data["created_at"] = now_isoformat()
    
    await db.kesjas.insert_one(data)
    await create_audit_log(user["id"], user["username"], "CREATE_KESJAS", "kesjas", data["id"])
    return {"message": "Data kesjas berhasil ditambahkan", "id": data["id"]}

# ================== HUKUMAN DISIPLIN ROUTES ==================
@api_router.get("/personel/{nrp}/hukuman")
async def get_hukuman(nrp: str, user: dict = Depends(get_current_user)):
    data = await db.hukuman.find({"nrp": nrp}, {"_id": 0}).sort("tmt_mulai", -1).to_list(100)
    return data

@api_router.post("/personel/{nrp}/hukuman")
async def create_hukuman(nrp: str, data: dict = Body(...), user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    personel = await db.personel.find_one({"nrp": nrp})
    if not personel:
        raise HTTPException(status_code=404, detail="Personel tidak ditemukan")
    
    data["id"] = generate_id()
    data["nrp"] = nrp
    data["created_at"] = now_isoformat()
    
    await db.hukuman.insert_one(data)
    await create_audit_log(user["id"], user["username"], "CREATE_HUKUMAN", "hukuman", data["id"])
    return {"message": "Data hukuman berhasil ditambahkan", "id": data["id"]}

# ================== ABSENSI CUTI ROUTES ==================
@api_router.get("/personel/{nrp}/cuti")
async def get_cuti(nrp: str, user: dict = Depends(get_current_user)):
    data = await db.absensi_cuti.find({"nrp": nrp}, {"_id": 0}).sort("tanggal_mulai", -1).to_list(100)
    return data

@api_router.post("/personel/{nrp}/cuti")
async def create_cuti(nrp: str, data: dict = Body(...), user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    personel = await db.personel.find_one({"nrp": nrp})
    if not personel:
        raise HTTPException(status_code=404, detail="Personel tidak ditemukan")
    
    data["id"] = generate_id()
    data["nrp"] = nrp
    data["status"] = "pending"
    data["created_at"] = now_isoformat()
    
    await db.absensi_cuti.insert_one(data)
    await create_audit_log(user["id"], user["username"], "CREATE_CUTI", "absensi_cuti", data["id"])
    return {"message": "Pengajuan cuti berhasil ditambahkan", "id": data["id"]}

# ================== PENGAJUAN (UNIFIED REQUEST) ROUTES ==================
@api_router.get("/pengajuan")
async def get_all_pengajuan(
    status: Optional[str] = None,
    jenis: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    if jenis:
        query["jenis_pengajuan"] = jenis
    
    data = await db.pengajuan.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Enrich with personel data
    for item in data:
        personel = await db.personel.find_one({"nrp": item.get("nrp")}, {"_id": 0, "nama_lengkap": 1, "pangkat": 1})
        if personel:
            item["nama_lengkap"] = personel.get("nama_lengkap")
            item["pangkat"] = personel.get("pangkat")
    
    return data

@api_router.post("/pengajuan")
async def create_pengajuan(data: dict = Body(...), user: dict = Depends(get_current_user)):
    """Create new pengajuan - Personnel can create koreksi for their own data"""
    nrp = data.get("nrp")
    
    # Personnel can only create pengajuan for themselves
    if user["role"] == "personnel":
        if nrp != user.get("nrp"):
            raise HTTPException(status_code=403, detail="Anda hanya dapat mengajukan koreksi untuk data diri sendiri")
        # Personnel can only create koreksi type
        if data.get("jenis_pengajuan") != "koreksi":
            raise HTTPException(status_code=403, detail="Personel hanya dapat mengajukan koreksi data")
    
    personel = await db.personel.find_one({"nrp": nrp})
    if not personel:
        raise HTTPException(status_code=404, detail="Personel tidak ditemukan")
    
    data["id"] = generate_id()
    data["status"] = "pending"
    data["created_by"] = user["id"]
    data["created_by_name"] = user.get("nama_lengkap", user["username"])
    data["created_at"] = now_isoformat()
    
    await db.pengajuan.insert_one(data)
    await create_audit_log(user["id"], user["username"], "CREATE_PENGAJUAN", "pengajuan", data["id"])
    return {"message": "Pengajuan berhasil dibuat", "id": data["id"]}

@api_router.put("/pengajuan/{pengajuan_id}/verify")
async def verify_pengajuan(pengajuan_id: str, action: dict = Body(...), user: dict = Depends(require_roles(UserRole.VERIFIER))):
    existing = await db.pengajuan.find_one({"id": pengajuan_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")
    if existing["status"] != "pending":
        raise HTTPException(status_code=400, detail="Pengajuan sudah diverifikasi")
    
    update_data = {
        "status": action["status"],
        "catatan_verifikator": action.get("catatan", ""),
        "verified_by": user["id"],
        "verified_by_name": user["nama_lengkap"],
        "verified_at": now_isoformat()
    }
    
    await db.pengajuan.update_one({"id": pengajuan_id}, {"$set": update_data})
    
    # Apply changes if approved
    if action["status"] == "approved":
        nrp = existing["nrp"]
        jenis = existing["jenis_pengajuan"]
        
        if jenis == "mutasi":
            if existing.get("jabatan_baru"):
                await db.personel.update_one({"nrp": nrp}, {"$set": {
                    "jabatan_sekarang": existing["jabatan_baru"],
                    "satuan_induk": existing.get("satuan_baru", "")
                }})
        elif jenis == "pensiun":
            await db.personel.update_one({"nrp": nrp}, {"$set": {"status_personel": "PENSIUN"}})
        elif jenis == "kenaikan_pangkat":
            if existing.get("pangkat_baru"):
                await db.personel.update_one({"nrp": nrp}, {"$set": {
                    "pangkat": existing["pangkat_baru"],
                    "tmt_pangkat": existing.get("tmt_pangkat_baru", "")
                }})
        elif jenis == "koreksi":
            if existing.get("field_name") and existing.get("nilai_baru"):
                await db.personel.update_one({"nrp": nrp}, {"$set": {existing["field_name"]: existing["nilai_baru"]}})
    
    await create_audit_log(user["id"], user["username"], f"VERIFY_PENGAJUAN_{action['status'].upper()}", "pengajuan", pengajuan_id)
    return {"message": f"Pengajuan {action['status']}"}

# ================== USER MANAGEMENT ROUTES ==================
@api_router.get("/users")
async def get_users(user: dict = Depends(require_roles(UserRole.ADMIN))):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return users

@api_router.post("/users")
async def create_user(data: dict = Body(...), admin: dict = Depends(require_roles(UserRole.ADMIN))):
    existing = await db.users.find_one({"username": data["username"]})
    if existing:
        raise HTTPException(status_code=400, detail="Username sudah digunakan")
    
    data["id"] = generate_id()
    data["password"] = hash_password(data["password"])
    data["is_active"] = True
    data["created_at"] = now_isoformat()
    
    await db.users.insert_one(data)
    await create_audit_log(admin["id"], admin["username"], "CREATE_USER", "user", data["id"])
    
    return {"message": "User berhasil ditambahkan", "id": data["id"]}

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, data: dict = Body(...), admin: dict = Depends(require_roles(UserRole.ADMIN))):
    existing = await db.users.find_one({"id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    data.pop("id", None)
    data.pop("password", None)
    data.pop("_id", None)
    data["updated_at"] = now_isoformat()
    
    await db.users.update_one({"id": user_id}, {"$set": data})
    await create_audit_log(admin["id"], admin["username"], "UPDATE_USER", "user", user_id)
    return {"message": "User berhasil diupdate"}

@api_router.post("/users/{user_id}/reset-password")
async def reset_password(user_id: str, new_password: str = Query(...), admin: dict = Depends(require_roles(UserRole.ADMIN))):
    existing = await db.users.find_one({"id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    hashed = hash_password(new_password)
    await db.users.update_one({"id": user_id}, {"$set": {"password": hashed}})
    await create_audit_log(admin["id"], admin["username"], "RESET_PASSWORD", "user", user_id)
    return {"message": "Password berhasil direset"}

@api_router.delete("/users/{user_id}")
async def deactivate_user(user_id: str, admin: dict = Depends(require_roles(UserRole.ADMIN))):
    await db.users.update_one({"id": user_id}, {"$set": {"is_active": False}})
    await create_audit_log(admin["id"], admin["username"], "DEACTIVATE_USER", "user", user_id)
    return {"message": "User berhasil dinonaktifkan"}

@api_router.put("/users/change-password")
async def change_password(data: dict = Body(...), user: dict = Depends(get_current_user)):
    """Change password for current user"""
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Password lama dan baru harus diisi")
    
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password baru minimal 6 karakter")
    
    # Get user with password
    user_data = await db.users.find_one({"id": user["id"]})
    if not user_data:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    # Verify current password
    if not verify_password(current_password, user_data["password"]):
        raise HTTPException(status_code=400, detail="Password saat ini salah")
    
    # Update password
    hashed = hash_password(new_password)
    await db.users.update_one({"id": user["id"]}, {"$set": {"password": hashed, "updated_at": now_isoformat()}})
    await create_audit_log(user["id"], user["username"], "CHANGE_PASSWORD", "user", user["id"])
    
    return {"message": "Password berhasil diubah"}

# ================== AUDIT LOG ROUTES ==================
@api_router.get("/audit-logs")
async def get_audit_logs(
    entity_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.LEADER))
):
    query = {}
    if entity_type:
        query["entity_type"] = entity_type
    
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    return logs

# ================== DASHBOARD ROUTES ==================
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user: dict = Depends(get_current_user)):
    stats = await get_personel_stats(user)
    
    recent_activities = await db.audit_logs.find({}, {"_id": 0}).sort("timestamp", -1).limit(10).to_list(10)
    stats["recent_activities"] = recent_activities
    
    return stats

# ================== IMPORT EXCEL ==================
@api_router.post("/import/personel")
async def import_personel_excel(file: UploadFile = File(...), user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File harus berformat Excel")
    
    content = await file.read()
    df_raw = pd.read_excel(io.BytesIO(content), header=None)
    
    imported_count = 0
    skipped_count = 0
    errors = []
    current_kategori = None
    header_row = None
    columns = []
    
    for idx, row in df_raw.iterrows():
        row_values = [str(v).strip() if pd.notna(v) else '' for v in row]
        row_text = ' '.join(row_values).upper()
        
        # Detect category
        if 'PERWIRA' in row_text and len(row_text) < 20:
            current_kategori = 'PERWIRA'
            header_row = None
            continue
        elif 'BINTARA' in row_text and len(row_text) < 20:
            current_kategori = 'BINTARA'
            header_row = None
            continue
        elif 'TAMTAMA' in row_text and len(row_text) < 20:
            current_kategori = 'TAMTAMA'
            header_row = None
            continue
        
        # Detect header row
        if 'NRP' in row_text and 'NAMA' in row_text:
            header_row = idx
            columns = row_values
            continue
        
        if header_row is None or current_kategori is None:
            continue
        
        # Skip sub-header rows
        if any(x in row_text for x in ['URT', 'BAG', '1 2 3 4 5']):
            continue
        
        # Get NRP
        nrp_idx = None
        for i, col in enumerate(columns):
            if 'NRP' in col.upper():
                nrp_idx = i
                break
        
        if nrp_idx is None or nrp_idx >= len(row_values):
            continue
        
        nrp = row_values[nrp_idx]
        if not nrp or not any(c.isdigit() for c in nrp) or len(nrp) < 5:
            continue
        
        # Check if exists
        existing = await db.personel.find_one({"nrp": nrp})
        if existing:
            skipped_count += 1
            continue
        
        try:
            # Map columns
            def get_val(col_name):
                for i, col in enumerate(columns):
                    if col_name.upper() in col.upper() and i < len(row_values):
                        val = row_values[i]
                        if val and val.lower() != 'nan':
                            return val
                return ''
            
            personel = {
                "id": generate_id(),
                "nrp": nrp,
                "nama_lengkap": get_val('NAMA'),
                "kategori": current_kategori,
                "pangkat": get_val('PANGKAT'),
                "korps": "ARH",
                "tempat_lahir": "",
                "tanggal_lahir": get_val('LAHIR'),
                "jenis_kelamin": "L",
                "agama": "ISLAM",
                "status_personel": "AKTIF",
                "tmt_masuk_dinas": "",
                "satuan_induk": "",
                "jabatan_sekarang": get_val('JABATAN'),
                "tmt_pangkat": get_val('TMT'),
                "created_at": now_isoformat(),
                "created_by": user["id"]
            }
            
            await db.personel.insert_one(personel)
            
            # Import DIKBANG
            dikbangum = get_val('DIKBANGUM')
            tahun_dikbangum = get_val('TAHUN')
            if dikbangum:
                for i, dik in enumerate(dikbangum.split(',')):
                    dik = dik.strip()
                    if dik and not dik[0].isdigit():
                        dik = dik
                    elif dik:
                        dik = dik.split('.', 1)[-1].strip() if '.' in dik else dik
                    
                    if dik:
                        await db.dikbang.insert_one({
                            "id": generate_id(),
                            "nrp": nrp,
                            "jenis_diklat": "DIKBANGUM",
                            "nama_diklat": dik,
                            "tahun": "",
                            "hasil": "LULUS",
                            "created_at": now_isoformat()
                        })
            
            dikbangspes = get_val('DIKBANGSPES')
            if dikbangspes:
                for dik in dikbangspes.split(','):
                    dik = dik.strip()
                    if dik and not dik[0].isdigit():
                        dik = dik
                    elif dik:
                        dik = dik.split('.', 1)[-1].strip() if '.' in dik else dik
                    
                    if dik:
                        await db.dikbang.insert_one({
                            "id": generate_id(),
                            "nrp": nrp,
                            "jenis_diklat": "DIKBANGSPES",
                            "nama_diklat": dik,
                            "tahun": "",
                            "hasil": "LULUS",
                            "created_at": now_isoformat()
                        })
            
            # Import Prestasi
            prestasi = get_val('PRESTASI')
            if prestasi:
                await db.prestasi.insert_one({
                    "id": generate_id(),
                    "nrp": nrp,
                    "nama_prestasi": prestasi,
                    "tingkat": "",
                    "tahun": "",
                    "created_at": now_isoformat()
                })
            
            imported_count += 1
            
        except Exception as e:
            errors.append(f"Row {idx}: {str(e)}")
    
    await create_audit_log(user["id"], user["username"], "IMPORT_PERSONEL", "personel", None, None, {
        "imported": imported_count,
        "skipped": skipped_count
    })
    
    return {
        "message": f"Import selesai. {imported_count} data berhasil, {skipped_count} dilewati",
        "imported": imported_count,
        "skipped": skipped_count,
        "errors": errors[:10]
    }

# ================== REPORTS ==================
@api_router.get("/reports/dsp")
async def get_dsp_report(
    satuan: Optional[str] = None,
    kategori: Optional[str] = None,
    user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF, UserRole.LEADER))
):
    query = {"status_personel": "AKTIF"}
    if satuan:
        query["satuan_induk"] = {"$regex": satuan, "$options": "i"}
    if kategori:
        query["kategori"] = kategori
    
    personel = await db.personel.find(query, {"_id": 0}).sort([("kategori", 1), ("pangkat", 1)]).to_list(10000)
    
    return {
        "data": personel,
        "total": len(personel),
        "generated_at": now_isoformat()
    }

@api_router.get("/reports/mutasi")
async def get_mutasi_report(
    status: Optional[str] = None,
    user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF, UserRole.LEADER))
):
    query = {"jenis_pengajuan": {"$in": ["mutasi", "pensiun"]}}
    if status:
        query["status"] = status
    
    data = await db.pengajuan.find(query, {"_id": 0}).sort("created_at", -1).to_list(10000)
    
    for item in data:
        personel = await db.personel.find_one({"nrp": item.get("nrp")}, {"_id": 0, "nama_lengkap": 1, "pangkat": 1})
        if personel:
            item["nama_lengkap"] = personel.get("nama_lengkap")
            item["pangkat"] = personel.get("pangkat")
    
    return {"data": data, "total": len(data)}

# ================== CUSTOM FIELDS ==================
@api_router.get("/custom-fields/{entity_type}")
async def get_custom_fields(entity_type: str, user: dict = Depends(get_current_user)):
    fields = await db.custom_fields.find({"entity_type": entity_type}, {"_id": 0}).sort("urutan", 1).to_list(100)
    return fields

@api_router.post("/custom-fields")
async def create_custom_field(data: dict = Body(...), user: dict = Depends(require_roles(UserRole.ADMIN))):
    data["id"] = generate_id()
    data["created_at"] = now_isoformat()
    await db.custom_fields.insert_one(data)
    await create_audit_log(user["id"], user["username"], "CREATE_CUSTOM_FIELD", "custom_fields", data["id"])
    return {"message": "Custom field berhasil ditambahkan", "id": data["id"]}

# ================== FILE UPLOAD (DOCUMENTS) ==================
import os
import shutil
from fastapi.responses import FileResponse

UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

@api_router.get("/personel/{nrp}/documents")
async def get_personel_documents(nrp: str, user: dict = Depends(get_current_user)):
    """Get all documents for a personel"""
    # Personnel can only access own documents
    if user["role"] == "personnel" and user.get("nrp") != nrp:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    documents = await db.documents.find({"nrp": nrp}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return documents

@api_router.post("/personel/{nrp}/documents")
async def upload_document(
    nrp: str,
    file: UploadFile = File(...),
    jenis_dokumen: str = Query(..., description="Jenis dokumen: SK_PANGKAT, SK_JABATAN, IJAZAH, SERTIFIKAT, FOTO, LAINNYA"),
    keterangan: str = Query("", description="Keterangan tambahan"),
    user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))
):
    """Upload a document for a personel"""
    # Validate personel exists
    personel = await db.personel.find_one({"nrp": nrp})
    if not personel:
        raise HTTPException(status_code=404, detail="Personel tidak ditemukan")
    
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Format file tidak didukung. Gunakan: {', '.join(ALLOWED_EXTENSIONS)}")
    
    # Read and validate file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Ukuran file maksimal 10MB")
    
    # Create directory for personel
    personel_dir = UPLOAD_DIR / nrp
    personel_dir.mkdir(exist_ok=True)
    
    # Generate unique filename
    doc_id = generate_id()
    filename = f"{doc_id}{file_ext}"
    file_path = personel_dir / filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Save to database
    doc_data = {
        "id": doc_id,
        "nrp": nrp,
        "jenis_dokumen": jenis_dokumen,
        "nama_file": file.filename,
        "filename_stored": filename,
        "file_path": str(file_path),
        "file_size": len(content),
        "file_type": file_ext,
        "keterangan": keterangan,
        "uploaded_by": user["id"],
        "uploaded_by_name": user.get("nama_lengkap", user["username"]),
        "created_at": now_isoformat()
    }
    
    await db.documents.insert_one(doc_data)
    await create_audit_log(user["id"], user["username"], "UPLOAD_DOCUMENT", "documents", doc_id)
    
    return {"message": "Dokumen berhasil diupload", "id": doc_id, "filename": file.filename}

@api_router.get("/documents/{doc_id}/download")
async def download_document(doc_id: str, user: dict = Depends(get_current_user)):
    """Download a document"""
    doc = await db.documents.find_one({"id": doc_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan")
    
    # Personnel can only download own documents
    if user["role"] == "personnel" and user.get("nrp") != doc["nrp"]:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    file_path = Path(doc["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File tidak ditemukan di server")
    
    return FileResponse(
        path=file_path,
        filename=doc["nama_file"],
        media_type="application/octet-stream"
    )

@api_router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    """Delete a document"""
    doc = await db.documents.find_one({"id": doc_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan")
    
    # Delete file from disk
    file_path = Path(doc["file_path"])
    if file_path.exists():
        file_path.unlink()
    
    # Delete from database
    await db.documents.delete_one({"id": doc_id})
    await create_audit_log(user["id"], user["username"], "DELETE_DOCUMENT", "documents", doc_id)
    
    return {"message": "Dokumen berhasil dihapus"}

# ================== EXPORT REPORTS PDF/EXCEL ==================
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import xlsxwriter

@api_router.get("/export/personel/excel")
async def export_personel_excel(
    kategori: Optional[str] = None,
    status: Optional[str] = None,
    user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF, UserRole.LEADER))
):
    """Export daftar personel ke Excel"""
    query = {}
    if kategori:
        query["kategori"] = kategori
    if status:
        query["status_personel"] = status
    
    personel_list = await db.personel.find(query, {"_id": 0}).sort([("kategori", 1), ("pangkat", 1)]).to_list(10000)
    
    # Create Excel file in memory
    output = io.BytesIO()
    workbook = xlsxwriter.Workbook(output, {'in_memory': True})
    worksheet = workbook.add_worksheet('Data Personel')
    
    # Styles
    header_format = workbook.add_format({
        'bold': True,
        'bg_color': '#4A5D23',
        'font_color': 'white',
        'border': 1,
        'align': 'center',
        'valign': 'vcenter'
    })
    cell_format = workbook.add_format({
        'border': 1,
        'align': 'left',
        'valign': 'vcenter'
    })
    
    # Headers
    headers = ['No', 'NRP', 'Nama Lengkap', 'Pangkat', 'Kategori', 'Jabatan', 'Satuan', 'Status']
    for col, header in enumerate(headers):
        worksheet.write(0, col, header, header_format)
    
    # Data
    for row, p in enumerate(personel_list, start=1):
        worksheet.write(row, 0, row, cell_format)
        worksheet.write(row, 1, p.get('nrp', ''), cell_format)
        worksheet.write(row, 2, p.get('nama_lengkap', ''), cell_format)
        worksheet.write(row, 3, p.get('pangkat', ''), cell_format)
        worksheet.write(row, 4, p.get('kategori', ''), cell_format)
        worksheet.write(row, 5, p.get('jabatan_sekarang', ''), cell_format)
        worksheet.write(row, 6, p.get('satuan_induk', ''), cell_format)
        worksheet.write(row, 7, p.get('status_personel', ''), cell_format)
    
    # Set column widths
    worksheet.set_column(0, 0, 5)   # No
    worksheet.set_column(1, 1, 18)  # NRP
    worksheet.set_column(2, 2, 35)  # Nama
    worksheet.set_column(3, 3, 15)  # Pangkat
    worksheet.set_column(4, 4, 12)  # Kategori
    worksheet.set_column(5, 5, 30)  # Jabatan
    worksheet.set_column(6, 6, 25)  # Satuan
    worksheet.set_column(7, 7, 12)  # Status
    
    workbook.close()
    output.seek(0)
    
    filename = f"data_personel_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    await create_audit_log(user["id"], user["username"], "EXPORT_EXCEL", "personel", "all")
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@api_router.get("/export/personel/pdf")
async def export_personel_pdf(
    kategori: Optional[str] = None,
    status: Optional[str] = None,
    user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF, UserRole.LEADER))
):
    """Export daftar personel ke PDF"""
    query = {}
    if kategori:
        query["kategori"] = kategori
    if status:
        query["status_personel"] = status
    
    personel_list = await db.personel.find(query, {"_id": 0}).sort([("kategori", 1), ("pangkat", 1)]).to_list(10000)
    
    # Create PDF in memory
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), 
                           leftMargin=1*cm, rightMargin=1*cm,
                           topMargin=1*cm, bottomMargin=1*cm)
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        alignment=1,  # Center
        spaceAfter=20
    )
    elements.append(Paragraph("DAFTAR PERSONEL ARHANUD", title_style))
    
    # Subtitle
    subtitle = f"Tanggal: {datetime.now().strftime('%d-%m-%Y %H:%M')}"
    if kategori:
        subtitle += f" | Kategori: {kategori}"
    if status:
        subtitle += f" | Status: {status}"
    elements.append(Paragraph(subtitle, styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Table data
    table_data = [['No', 'NRP', 'Nama Lengkap', 'Pangkat', 'Kategori', 'Jabatan', 'Status']]
    
    for idx, p in enumerate(personel_list, start=1):
        table_data.append([
            str(idx),
            p.get('nrp', ''),
            p.get('nama_lengkap', '')[:40],  # Truncate long names
            p.get('pangkat', ''),
            p.get('kategori', ''),
            (p.get('jabatan_sekarang', '') or '')[:30],
            p.get('status_personel', '')
        ])
    
    # Create table
    col_widths = [1*cm, 4*cm, 6*cm, 3*cm, 2.5*cm, 6*cm, 2.5*cm]
    table = Table(table_data, colWidths=col_widths, repeatRows=1)
    
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4A5D23')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('ALIGN', (0, 1), (0, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
    ]))
    
    elements.append(table)
    
    # Footer
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(f"Total: {len(personel_list)} personel", styles['Normal']))
    
    doc.build(elements)
    buffer.seek(0)
    
    filename = f"data_personel_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    
    await create_audit_log(user["id"], user["username"], "EXPORT_PDF", "personel", "all")
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@api_router.get("/export/personel/{nrp}/pdf")
async def export_personel_detail_pdf(nrp: str, user: dict = Depends(get_current_user)):
    """Export biodata personel individu ke PDF"""
    # Personnel can only export own data
    if user["role"] == "personnel" and user.get("nrp") != nrp:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    personel = await db.personel.find_one({"nrp": nrp}, {"_id": 0})
    if not personel:
        raise HTTPException(status_code=404, detail="Personel tidak ditemukan")
    
    # Get related data
    dikbang = await db.dikbang.find({"nrp": nrp}, {"_id": 0}).to_list(100)
    keluarga = await db.keluarga.find({"nrp": nrp}, {"_id": 0}).to_list(100)
    
    # Create PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                           leftMargin=2*cm, rightMargin=2*cm,
                           topMargin=2*cm, bottomMargin=2*cm)
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=14,
        alignment=1,
        spaceAfter=10
    )
    elements.append(Paragraph("BIODATA PERSONEL", title_style))
    elements.append(Paragraph("SATUAN ARHANUD", styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Personal Info Table
    personal_data = [
        ['NRP', personel.get('nrp', '-')],
        ['Nama Lengkap', personel.get('nama_lengkap', '-')],
        ['Pangkat', personel.get('pangkat', '-')],
        ['Korps', personel.get('korps', '-')],
        ['Kategori', personel.get('kategori', '-')],
        ['Tempat/Tgl Lahir', f"{personel.get('tempat_lahir', '-')} / {personel.get('tanggal_lahir', '-')}"],
        ['Jenis Kelamin', 'Laki-laki' if personel.get('jenis_kelamin') == 'L' else 'Perempuan'],
        ['Agama', personel.get('agama', '-')],
        ['Jabatan', personel.get('jabatan_sekarang', '-')],
        ['Satuan', personel.get('satuan_induk', '-')],
        ['TMT Pangkat', personel.get('tmt_pangkat', '-')],
        ['TMT Masuk Dinas', personel.get('tmt_masuk_dinas', '-')],
        ['Status', personel.get('status_personel', '-')],
    ]
    
    personal_table = Table(personal_data, colWidths=[5*cm, 10*cm])
    personal_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(personal_table)
    elements.append(Spacer(1, 20))
    
    # DIKBANG Section
    if dikbang:
        elements.append(Paragraph("<b>RIWAYAT PENDIDIKAN</b>", styles['Heading3']))
        elements.append(Spacer(1, 10))
        
        dikbang_data = [['No', 'Jenis', 'Nama Pendidikan', 'Tahun', 'Hasil']]
        for idx, d in enumerate(dikbang, 1):
            dikbang_data.append([
                str(idx),
                d.get('jenis_diklat', '-'),
                d.get('nama_diklat', '-'),
                d.get('tahun', '-'),
                d.get('hasil', '-')
            ])
        
        dikbang_table = Table(dikbang_data, colWidths=[1*cm, 3*cm, 6*cm, 2*cm, 3*cm])
        dikbang_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4A5D23')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(dikbang_table)
        elements.append(Spacer(1, 20))
    
    # Keluarga Section
    if keluarga:
        elements.append(Paragraph("<b>DATA KELUARGA</b>", styles['Heading3']))
        elements.append(Spacer(1, 10))
        
        keluarga_data = [['No', 'Hubungan', 'Nama', 'Tgl Lahir', 'Pekerjaan']]
        for idx, k in enumerate(keluarga, 1):
            keluarga_data.append([
                str(idx),
                k.get('hubungan', '-'),
                k.get('nama', '-'),
                k.get('tanggal_lahir', '-'),
                k.get('pekerjaan', '-')
            ])
        
        keluarga_table = Table(keluarga_data, colWidths=[1*cm, 3*cm, 5*cm, 3*cm, 3*cm])
        keluarga_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4A5D23')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(keluarga_table)
    
    # Footer
    elements.append(Spacer(1, 30))
    elements.append(Paragraph(f"Dicetak pada: {datetime.now().strftime('%d-%m-%Y %H:%M')}", styles['Normal']))
    
    doc.build(elements)
    buffer.seek(0)
    
    filename = f"biodata_{nrp}_{datetime.now().strftime('%Y%m%d')}.pdf"
    
    await create_audit_log(user["id"], user["username"], "EXPORT_PDF", "personel", nrp)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@api_router.get("/export/statistik/excel")
async def export_statistik_excel(user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF, UserRole.LEADER))):
    """Export statistik personel ke Excel"""
    # Get stats
    total = await db.personel.count_documents({})
    aktif = await db.personel.count_documents({"status_personel": "AKTIF"})
    
    by_kategori = {}
    for kategori in ["PERWIRA", "BINTARA", "TAMTAMA", "PNS"]:
        count = await db.personel.count_documents({"kategori": kategori})
        if count > 0:
            by_kategori[kategori] = count
    
    by_pangkat_pipeline = [
        {"$group": {"_id": "$pangkat", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    by_pangkat_result = await db.personel.aggregate(by_pangkat_pipeline).to_list(100)
    
    # Create Excel
    output = io.BytesIO()
    workbook = xlsxwriter.Workbook(output, {'in_memory': True})
    
    # Summary sheet
    summary_sheet = workbook.add_worksheet('Ringkasan')
    header_format = workbook.add_format({'bold': True, 'bg_color': '#4A5D23', 'font_color': 'white', 'border': 1})
    cell_format = workbook.add_format({'border': 1})
    
    summary_sheet.write(0, 0, 'STATISTIK PERSONEL ARHANUD', workbook.add_format({'bold': True, 'font_size': 14}))
    summary_sheet.write(1, 0, f'Tanggal: {datetime.now().strftime("%d-%m-%Y %H:%M")}')
    
    summary_sheet.write(3, 0, 'Keterangan', header_format)
    summary_sheet.write(3, 1, 'Jumlah', header_format)
    summary_sheet.write(4, 0, 'Total Personel', cell_format)
    summary_sheet.write(4, 1, total, cell_format)
    summary_sheet.write(5, 0, 'Personel Aktif', cell_format)
    summary_sheet.write(5, 1, aktif, cell_format)
    
    summary_sheet.set_column(0, 0, 25)
    summary_sheet.set_column(1, 1, 15)
    
    # By Kategori sheet
    kategori_sheet = workbook.add_worksheet('Per Kategori')
    kategori_sheet.write(0, 0, 'Kategori', header_format)
    kategori_sheet.write(0, 1, 'Jumlah', header_format)
    row = 1
    for kat, count in by_kategori.items():
        kategori_sheet.write(row, 0, kat, cell_format)
        kategori_sheet.write(row, 1, count, cell_format)
        row += 1
    kategori_sheet.set_column(0, 0, 20)
    kategori_sheet.set_column(1, 1, 15)
    
    # By Pangkat sheet
    pangkat_sheet = workbook.add_worksheet('Per Pangkat')
    pangkat_sheet.write(0, 0, 'Pangkat', header_format)
    pangkat_sheet.write(0, 1, 'Jumlah', header_format)
    row = 1
    for item in by_pangkat_result:
        pangkat_sheet.write(row, 0, item['_id'] or '-', cell_format)
        pangkat_sheet.write(row, 1, item['count'], cell_format)
        row += 1
    pangkat_sheet.set_column(0, 0, 20)
    pangkat_sheet.set_column(1, 1, 15)
    
    workbook.close()
    output.seek(0)
    
    filename = f"statistik_personel_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    await create_audit_log(user["id"], user["username"], "EXPORT_EXCEL", "statistik", "all")
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ================== INITIALIZATION ==================
@api_router.post("/init/setup")
async def initialize_system():
    admin_exists = await db.users.find_one({"role": "admin"})
    if admin_exists:
        return {"message": "System already initialized"}
    
    # Create default users
    default_users = [
        {"username": "admin", "nama_lengkap": "Administrator", "role": "admin", "password": "admin123"},
        {"username": "staff1", "nama_lengkap": "Staf Kepegawaian 1", "role": "staff", "password": "staff123"},
        {"username": "verifikator1", "nama_lengkap": "Pejabat Verifikator", "role": "verifier", "password": "verif123"},
        {"username": "pimpinan", "nama_lengkap": "Pimpinan Satuan", "role": "leader", "password": "pimpin123"},
        {"username": "personel1", "nama_lengkap": "Personel Contoh", "role": "personnel", "nrp": "11120017460989", "password": "personel123"}
    ]
    
    for user_data in default_users:
        await db.users.insert_one({
            "id": generate_id(),
            "username": user_data["username"],
            "nama_lengkap": user_data["nama_lengkap"],
            "role": user_data["role"],
            "nrp": user_data.get("nrp"),
            "password": hash_password(user_data["password"]),
            "is_active": True,
            "created_at": now_isoformat()
        })
    
    # Create default reference data
    ref_pangkat = [
        {"kode": "JENDERAL", "nama": "Jenderal", "golongan": "I", "kategori": "PERWIRA", "urutan": 1},
        {"kode": "LETJEN", "nama": "Letnan Jenderal", "golongan": "II", "kategori": "PERWIRA", "urutan": 2},
        {"kode": "MAYJEN", "nama": "Mayor Jenderal", "golongan": "III", "kategori": "PERWIRA", "urutan": 3},
        {"kode": "BRIGJEN", "nama": "Brigadir Jenderal", "golongan": "IV", "kategori": "PERWIRA", "urutan": 4},
        {"kode": "KOLONEL", "nama": "Kolonel", "golongan": "IV/c", "kategori": "PERWIRA", "urutan": 5},
        {"kode": "KOLONEL ARH", "nama": "Kolonel Arhanud", "golongan": "IV/c", "kategori": "PERWIRA", "urutan": 6},
        {"kode": "LETKOL", "nama": "Letnan Kolonel", "golongan": "IV/b", "kategori": "PERWIRA", "urutan": 7},
        {"kode": "LETKOL ARH", "nama": "Letnan Kolonel Arhanud", "golongan": "IV/b", "kategori": "PERWIRA", "urutan": 8},
        {"kode": "MAYOR", "nama": "Mayor", "golongan": "IV/a", "kategori": "PERWIRA", "urutan": 9},
        {"kode": "MAYOR ARH", "nama": "Mayor Arhanud", "golongan": "IV/a", "kategori": "PERWIRA", "urutan": 10},
        {"kode": "KAPTEN", "nama": "Kapten", "golongan": "III/d", "kategori": "PERWIRA", "urutan": 11},
        {"kode": "KAPTEN ARH", "nama": "Kapten Arhanud", "golongan": "III/d", "kategori": "PERWIRA", "urutan": 12},
        {"kode": "LETTU", "nama": "Letnan Satu", "golongan": "III/c", "kategori": "PERWIRA", "urutan": 13},
        {"kode": "LETDA", "nama": "Letnan Dua", "golongan": "III/b", "kategori": "PERWIRA", "urutan": 14},
        {"kode": "SERMA", "nama": "Sersan Mayor", "golongan": "III/a", "kategori": "BINTARA", "urutan": 15},
        {"kode": "SERKA", "nama": "Sersan Kepala", "golongan": "II/d", "kategori": "BINTARA", "urutan": 16},
        {"kode": "SERTU", "nama": "Sersan Satu", "golongan": "II/c", "kategori": "BINTARA", "urutan": 17},
        {"kode": "SERDA", "nama": "Sersan Dua", "golongan": "II/b", "kategori": "BINTARA", "urutan": 18},
        {"kode": "KOPKA", "nama": "Kopral Kepala", "golongan": "II/a", "kategori": "BINTARA", "urutan": 19},
        {"kode": "KOPTU", "nama": "Kopral Satu", "golongan": "I/d", "kategori": "BINTARA", "urutan": 20},
        {"kode": "KOPDA", "nama": "Kopral Dua", "golongan": "I/c", "kategori": "BINTARA", "urutan": 21},
    ]
    
    for p in ref_pangkat:
        p["id"] = generate_id()
        p["created_at"] = now_isoformat()
        await db.ref_pangkat.insert_one(p)
    
    ref_agama = [
        {"kode": "ISLAM", "nama": "Islam", "urutan": 1},
        {"kode": "KRISTEN", "nama": "Kristen", "urutan": 2},
        {"kode": "KATOLIK", "nama": "Katolik", "urutan": 3},
        {"kode": "HINDU", "nama": "Hindu", "urutan": 4},
        {"kode": "BUDDHA", "nama": "Buddha", "urutan": 5},
        {"kode": "KONGHUCU", "nama": "Konghucu", "urutan": 6},
    ]
    
    for a in ref_agama:
        a["id"] = generate_id()
        a["created_at"] = now_isoformat()
        await db.ref_agama.insert_one(a)
    
    ref_jenis_diklat = [
        {"kode": "DIKBANGUM", "nama": "Pendidikan Pengembangan Umum", "kategori": "UMUM", "urutan": 1},
        {"kode": "DIKBANGSPES", "nama": "Pendidikan Pengembangan Spesialis", "kategori": "SPESIALIS", "urutan": 2},
    ]
    
    for d in ref_jenis_diklat:
        d["id"] = generate_id()
        d["created_at"] = now_isoformat()
        await db.ref_jenis_diklat.insert_one(d)
    
    ref_hubungan = [
        {"kode": "ISTRI", "nama": "Istri", "urutan": 1},
        {"kode": "SUAMI", "nama": "Suami", "urutan": 2},
        {"kode": "ANAK", "nama": "Anak", "urutan": 3},
        {"kode": "AYAH", "nama": "Ayah", "urutan": 4},
        {"kode": "IBU", "nama": "Ibu", "urutan": 5},
    ]
    
    for h in ref_hubungan:
        h["id"] = generate_id()
        h["created_at"] = now_isoformat()
        await db.ref_hubungan_keluarga.insert_one(h)
    
    return {
        "message": "System initialized successfully",
        "users": [
            {"username": "admin", "password": "admin123", "role": "Admin"},
            {"username": "staff1", "password": "staff123", "role": "Staf Kepegawaian"},
            {"username": "verifikator1", "password": "verif123", "role": "Verifikator"},
            {"username": "pimpinan", "password": "pimpin123", "role": "Pimpinan"},
            {"username": "personel1", "password": "personel123", "role": "Personel"}
        ]
    }

# ================== MIGRATE OLD DATA ==================
@api_router.post("/migrate/old-data")
async def migrate_old_data(user: dict = Depends(require_roles(UserRole.ADMIN))):
    """Migrate data from old 'personnel' collection to new 'personel' collection"""
    old_data = await db.personnel.find({}, {"_id": 0}).to_list(10000)
    migrated = 0
    
    for old in old_data:
        nrp = old.get("nrp")
        if not nrp:
            continue
        
        existing = await db.personel.find_one({"nrp": nrp})
        if existing:
            continue
        
        # Determine kategori from pangkat
        pangkat = old.get("pangkat", "").upper()
        kategori = "BINTARA"
        if any(x in pangkat for x in ["MAYOR", "LETKOL", "KOLONEL", "JENDERAL", "KAPTEN", "LETTU", "LETDA"]):
            kategori = "PERWIRA"
        elif any(x in pangkat for x in ["SERTU", "SERDA", "SERKA", "SERMA", "KOPKA", "KOPTU", "KOPDA"]):
            kategori = "BINTARA"
        
        new_personel = {
            "id": generate_id(),
            "nrp": nrp,
            "nama_lengkap": old.get("nama", ""),
            "kategori": kategori,
            "pangkat": old.get("pangkat", ""),
            "korps": "ARH",
            "tempat_lahir": "",
            "tanggal_lahir": old.get("tanggal_lahir", ""),
            "jenis_kelamin": "L",
            "agama": "ISLAM",
            "status_personel": old.get("status", "AKTIF").upper(),
            "tmt_masuk_dinas": "",
            "satuan_induk": old.get("satuan", ""),
            "jabatan_sekarang": old.get("jabatan", ""),
            "tmt_pangkat": old.get("tmt_jabatan", ""),
            "created_at": now_isoformat(),
            "migrated_from": "personnel"
        }
        
        await db.personel.insert_one(new_personel)
        
        # Migrate dikbang
        dikbangum = old.get("dikbangum", "")
        if dikbangum:
            for dik in str(dikbangum).replace('\n', ',').split(','):
                dik = dik.strip()
                if dik and len(dik) > 2:
                    # Remove numbering
                    if dik[0].isdigit() and '.' in dik:
                        dik = dik.split('.', 1)[-1].strip()
                    if dik:
                        await db.dikbang.insert_one({
                            "id": generate_id(),
                            "nrp": nrp,
                            "jenis_diklat": "DIKBANGUM",
                            "nama_diklat": dik,
                            "tahun": "",
                            "hasil": "LULUS",
                            "created_at": now_isoformat()
                        })
        
        dikbangspes = old.get("dikbangspes", "")
        if dikbangspes:
            for dik in str(dikbangspes).replace('\n', ',').split(','):
                dik = dik.strip()
                if dik and len(dik) > 2:
                    if dik[0].isdigit() and '.' in dik:
                        dik = dik.split('.', 1)[-1].strip()
                    if dik:
                        await db.dikbang.insert_one({
                            "id": generate_id(),
                            "nrp": nrp,
                            "jenis_diklat": "DIKBANGSPES",
                            "nama_diklat": dik,
                            "tahun": "",
                            "hasil": "LULUS",
                            "created_at": now_isoformat()
                        })
        
        # Migrate prestasi
        prestasi = old.get("prestasi", "")
        if prestasi:
            await db.prestasi.insert_one({
                "id": generate_id(),
                "nrp": nrp,
                "nama_prestasi": prestasi,
                "tingkat": "",
                "tahun": "",
                "created_at": now_isoformat()
            })
        
        migrated += 1
    
    return {"message": f"Migrated {migrated} records from old collection"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
