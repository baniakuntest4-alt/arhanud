from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
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
app = FastAPI(title="SIPARHANUD API", version="1.0.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ================== ENUMS ==================
class UserRole(str, Enum):
    ADMIN = "admin"
    STAFF = "staff"  # Staf Kepegawaian
    VERIFIER = "verifier"  # Pejabat Verifikator
    LEADER = "leader"  # Pimpinan
    PERSONNEL = "personnel"  # Personel

class RequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

# ================== MODELS ==================
class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    username: str
    nama_lengkap: str
    role: UserRole
    nrp: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime

class UserLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class PersonnelBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    nrp: str
    nama: str
    pangkat: str
    jabatan: str
    satuan: Optional[str] = None
    tmt_jabatan: Optional[str] = None
    tanggal_lahir: Optional[str] = None
    prestasi: Optional[str] = None
    dikbangum: Optional[str] = None
    dikbangspes: Optional[str] = None
    status: str = "active"

class PersonnelCreate(PersonnelBase):
    pass

class PersonnelUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    nama: Optional[str] = None
    pangkat: Optional[str] = None
    jabatan: Optional[str] = None
    satuan: Optional[str] = None
    tmt_jabatan: Optional[str] = None
    tanggal_lahir: Optional[str] = None
    prestasi: Optional[str] = None
    dikbangum: Optional[str] = None
    dikbangspes: Optional[str] = None
    status: Optional[str] = None

class PersonnelResponse(PersonnelBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

class RankHistoryBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    personnel_id: str
    pangkat_lama: str
    pangkat_baru: str
    tmt: str
    nomor_sk: Optional[str] = None
    keterangan: Optional[str] = None

class RankHistoryCreate(RankHistoryBase):
    pass

class RankHistoryResponse(RankHistoryBase):
    id: str
    created_at: datetime

class PositionHistoryBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    personnel_id: str
    jabatan_lama: str
    jabatan_baru: str
    satuan: Optional[str] = None
    tmt: str
    nomor_sk: Optional[str] = None
    keterangan: Optional[str] = None

class PositionHistoryCreate(PositionHistoryBase):
    pass

class PositionHistoryResponse(PositionHistoryBase):
    id: str
    created_at: datetime

class EducationBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    personnel_id: str
    jenis_pendidikan: str  # DIKBANGUM or DIKBANGSPES
    nama_pendidikan: str
    tahun: Optional[str] = None
    tempat: Optional[str] = None
    keterangan: Optional[str] = None

class EducationCreate(EducationBase):
    pass

class EducationResponse(EducationBase):
    id: str
    created_at: datetime

class FamilyBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    personnel_id: str
    hubungan: str  # istri, suami, anak, dll
    nama: str
    tanggal_lahir: Optional[str] = None
    pekerjaan: Optional[str] = None
    keterangan: Optional[str] = None

class FamilyCreate(FamilyBase):
    pass

class FamilyResponse(FamilyBase):
    id: str
    created_at: datetime

class MutationRequestBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    personnel_id: str
    jenis_mutasi: str  # mutasi, pensiun
    jabatan_asal: str
    jabatan_tujuan: Optional[str] = None
    satuan_asal: Optional[str] = None
    satuan_tujuan: Optional[str] = None
    alasan: Optional[str] = None
    tanggal_efektif: Optional[str] = None

class MutationRequestCreate(MutationRequestBase):
    pass

class MutationRequestResponse(MutationRequestBase):
    id: str
    status: RequestStatus = RequestStatus.PENDING
    catatan_verifikator: Optional[str] = None
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_by: str
    created_at: datetime

class VerificationAction(BaseModel):
    status: RequestStatus
    catatan: Optional[str] = None

class CorrectionRequestBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    personnel_id: str
    field_name: str
    nilai_lama: str
    nilai_baru: str
    alasan: str

class CorrectionRequestCreate(CorrectionRequestBase):
    pass

class CorrectionRequestResponse(CorrectionRequestBase):
    id: str
    status: RequestStatus = RequestStatus.PENDING
    catatan_verifikator: Optional[str] = None
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_by: str
    created_at: datetime

class AuditLogBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    username: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    old_value: Optional[Dict] = None
    new_value: Optional[Dict] = None
    ip_address: Optional[str] = None

class AuditLogResponse(AuditLogBase):
    id: str
    timestamp: datetime

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
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "username": username,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "old_value": old_value,
        "new_value": new_value,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.audit_logs.insert_one(log)

# ================== AUTH ROUTES ==================
@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"username": credentials.username}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Username atau password salah")
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Akun tidak aktif")
    
    token = create_access_token({"sub": user["id"], "role": user["role"]})
    await create_audit_log(user["id"], user["username"], "LOGIN", "auth")
    
    user_response = {k: v for k, v in user.items() if k != "password"}
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/logout")
async def logout(user: dict = Depends(get_current_user)):
    await create_audit_log(user["id"], user["username"], "LOGOUT", "auth")
    return {"message": "Logout berhasil"}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {k: v for k, v in user.items() if k != "password"}

@api_router.post("/auth/change-password")
async def change_password(old_password: str, new_password: str, user: dict = Depends(get_current_user)):
    if not verify_password(old_password, user["password"]):
        raise HTTPException(status_code=400, detail="Password lama salah")
    hashed = hash_password(new_password)
    await db.users.update_one({"id": user["id"]}, {"$set": {"password": hashed}})
    await create_audit_log(user["id"], user["username"], "CHANGE_PASSWORD", "user", user["id"])
    return {"message": "Password berhasil diubah"}

# ================== USER MANAGEMENT ROUTES (Admin Only) ==================
@api_router.post("/users", response_model=UserResponse)
async def create_user(user_data: UserCreate, admin: dict = Depends(require_roles(UserRole.ADMIN))):
    existing = await db.users.find_one({"username": user_data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username sudah digunakan")
    
    user_dict = user_data.model_dump()
    user_dict["id"] = str(uuid.uuid4())
    user_dict["password"] = hash_password(user_data.password)
    user_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.insert_one(user_dict)
    await create_audit_log(admin["id"], admin["username"], "CREATE_USER", "user", user_dict["id"])
    
    del user_dict["password"]
    user_dict["created_at"] = datetime.fromisoformat(user_dict["created_at"])
    return UserResponse(**user_dict)

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(admin: dict = Depends(require_roles(UserRole.ADMIN))):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    for u in users:
        if isinstance(u.get("created_at"), str):
            u["created_at"] = datetime.fromisoformat(u["created_at"])
    return users

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, admin: dict = Depends(require_roles(UserRole.ADMIN))):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    if isinstance(user.get("created_at"), str):
        user["created_at"] = datetime.fromisoformat(user["created_at"])
    return UserResponse(**user)

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, user_data: dict, admin: dict = Depends(require_roles(UserRole.ADMIN))):
    existing = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    update_data = {k: v for k, v in user_data.items() if k not in ["id", "password", "created_at"]}
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
        await create_audit_log(admin["id"], admin["username"], "UPDATE_USER", "user", user_id, existing, update_data)
    return {"message": "User berhasil diupdate"}

@api_router.post("/users/{user_id}/reset-password")
async def reset_password(user_id: str, new_password: str, admin: dict = Depends(require_roles(UserRole.ADMIN))):
    existing = await db.users.find_one({"id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    hashed = hash_password(new_password)
    await db.users.update_one({"id": user_id}, {"$set": {"password": hashed}})
    await create_audit_log(admin["id"], admin["username"], "RESET_PASSWORD", "user", user_id)
    return {"message": "Password berhasil direset"}

@api_router.delete("/users/{user_id}")
async def deactivate_user(user_id: str, admin: dict = Depends(require_roles(UserRole.ADMIN))):
    existing = await db.users.find_one({"id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    await db.users.update_one({"id": user_id}, {"$set": {"is_active": False}})
    await create_audit_log(admin["id"], admin["username"], "DEACTIVATE_USER", "user", user_id)
    return {"message": "User berhasil dinonaktifkan"}

# ================== PERSONNEL ROUTES ==================
@api_router.get("/personnel", response_model=List[PersonnelResponse])
async def get_all_personnel(
    search: Optional[str] = None,
    pangkat: Optional[str] = None,
    satuan: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    user: dict = Depends(get_current_user)
):
    query = {}
    if user["role"] == UserRole.PERSONNEL.value:
        query["nrp"] = user.get("nrp")
    
    if search:
        query["$or"] = [
            {"nama": {"$regex": search, "$options": "i"}},
            {"nrp": {"$regex": search, "$options": "i"}},
            {"jabatan": {"$regex": search, "$options": "i"}}
        ]
    if pangkat:
        query["pangkat"] = pangkat
    if satuan:
        query["satuan"] = {"$regex": satuan, "$options": "i"}
    if status:
        query["status"] = status
    
    personnel = await db.personnel.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    for p in personnel:
        if isinstance(p.get("created_at"), str):
            p["created_at"] = datetime.fromisoformat(p["created_at"])
        if isinstance(p.get("updated_at"), str):
            p["updated_at"] = datetime.fromisoformat(p["updated_at"])
    return personnel

@api_router.get("/personnel/count")
async def get_personnel_count(user: dict = Depends(get_current_user)):
    total = await db.personnel.count_documents({})
    by_pangkat = await db.personnel.aggregate([
        {"$group": {"_id": "$pangkat", "count": {"$sum": 1}}}
    ]).to_list(100)
    by_status = await db.personnel.aggregate([
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]).to_list(10)
    return {
        "total": total,
        "by_pangkat": {item["_id"]: item["count"] for item in by_pangkat if item["_id"]},
        "by_status": {item["_id"]: item["count"] for item in by_status if item["_id"]}
    }

@api_router.get("/personnel/{personnel_id}", response_model=PersonnelResponse)
async def get_personnel(personnel_id: str, user: dict = Depends(get_current_user)):
    personnel = await db.personnel.find_one({"id": personnel_id}, {"_id": 0})
    if not personnel:
        raise HTTPException(status_code=404, detail="Personel tidak ditemukan")
    
    if user["role"] == UserRole.PERSONNEL.value and personnel["nrp"] != user.get("nrp"):
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    if isinstance(personnel.get("created_at"), str):
        personnel["created_at"] = datetime.fromisoformat(personnel["created_at"])
    if isinstance(personnel.get("updated_at"), str):
        personnel["updated_at"] = datetime.fromisoformat(personnel["updated_at"])
    return PersonnelResponse(**personnel)

@api_router.post("/personnel", response_model=PersonnelResponse)
async def create_personnel(data: PersonnelCreate, user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    existing = await db.personnel.find_one({"nrp": data.nrp})
    if existing:
        raise HTTPException(status_code=400, detail="NRP sudah terdaftar")
    
    personnel_dict = data.model_dump()
    personnel_dict["id"] = str(uuid.uuid4())
    personnel_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.personnel.insert_one(personnel_dict)
    await create_audit_log(user["id"], user["username"], "CREATE_PERSONNEL", "personnel", personnel_dict["id"], new_value=personnel_dict)
    
    personnel_dict["created_at"] = datetime.fromisoformat(personnel_dict["created_at"])
    return PersonnelResponse(**personnel_dict)

@api_router.put("/personnel/{personnel_id}", response_model=PersonnelResponse)
async def update_personnel(personnel_id: str, data: PersonnelUpdate, user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    existing = await db.personnel.find_one({"id": personnel_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Personel tidak ditemukan")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.personnel.update_one({"id": personnel_id}, {"$set": update_data})
    await create_audit_log(user["id"], user["username"], "UPDATE_PERSONNEL", "personnel", personnel_id, existing, update_data)
    
    updated = await db.personnel.find_one({"id": personnel_id}, {"_id": 0})
    if isinstance(updated.get("created_at"), str):
        updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    if isinstance(updated.get("updated_at"), str):
        updated["updated_at"] = datetime.fromisoformat(updated["updated_at"])
    return PersonnelResponse(**updated)

# ================== RANK HISTORY ROUTES ==================
@api_router.get("/personnel/{personnel_id}/rank-history", response_model=List[RankHistoryResponse])
async def get_rank_history(personnel_id: str, user: dict = Depends(get_current_user)):
    history = await db.rank_history.find({"personnel_id": personnel_id}, {"_id": 0}).to_list(100)
    for h in history:
        if isinstance(h.get("created_at"), str):
            h["created_at"] = datetime.fromisoformat(h["created_at"])
    return history

@api_router.post("/personnel/{personnel_id}/rank-history", response_model=RankHistoryResponse)
async def create_rank_history(personnel_id: str, data: RankHistoryCreate, user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    personnel = await db.personnel.find_one({"id": personnel_id})
    if not personnel:
        raise HTTPException(status_code=404, detail="Personel tidak ditemukan")
    
    history_dict = data.model_dump()
    history_dict["id"] = str(uuid.uuid4())
    history_dict["personnel_id"] = personnel_id
    history_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.rank_history.insert_one(history_dict)
    await db.personnel.update_one({"id": personnel_id}, {"$set": {"pangkat": data.pangkat_baru}})
    await create_audit_log(user["id"], user["username"], "CREATE_RANK_HISTORY", "rank_history", history_dict["id"])
    
    history_dict["created_at"] = datetime.fromisoformat(history_dict["created_at"])
    return RankHistoryResponse(**history_dict)

# ================== POSITION HISTORY ROUTES ==================
@api_router.get("/personnel/{personnel_id}/position-history", response_model=List[PositionHistoryResponse])
async def get_position_history(personnel_id: str, user: dict = Depends(get_current_user)):
    history = await db.position_history.find({"personnel_id": personnel_id}, {"_id": 0}).to_list(100)
    for h in history:
        if isinstance(h.get("created_at"), str):
            h["created_at"] = datetime.fromisoformat(h["created_at"])
    return history

@api_router.post("/personnel/{personnel_id}/position-history", response_model=PositionHistoryResponse)
async def create_position_history(personnel_id: str, data: PositionHistoryCreate, user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    personnel = await db.personnel.find_one({"id": personnel_id})
    if not personnel:
        raise HTTPException(status_code=404, detail="Personel tidak ditemukan")
    
    history_dict = data.model_dump()
    history_dict["id"] = str(uuid.uuid4())
    history_dict["personnel_id"] = personnel_id
    history_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.position_history.insert_one(history_dict)
    await db.personnel.update_one({"id": personnel_id}, {"$set": {"jabatan": data.jabatan_baru, "satuan": data.satuan}})
    await create_audit_log(user["id"], user["username"], "CREATE_POSITION_HISTORY", "position_history", history_dict["id"])
    
    history_dict["created_at"] = datetime.fromisoformat(history_dict["created_at"])
    return PositionHistoryResponse(**history_dict)

# ================== EDUCATION ROUTES ==================
@api_router.get("/personnel/{personnel_id}/education", response_model=List[EducationResponse])
async def get_education(personnel_id: str, user: dict = Depends(get_current_user)):
    education = await db.education.find({"personnel_id": personnel_id}, {"_id": 0}).to_list(100)
    for e in education:
        if isinstance(e.get("created_at"), str):
            e["created_at"] = datetime.fromisoformat(e["created_at"])
    return education

@api_router.post("/personnel/{personnel_id}/education", response_model=EducationResponse)
async def create_education(personnel_id: str, data: EducationCreate, user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    personnel = await db.personnel.find_one({"id": personnel_id})
    if not personnel:
        raise HTTPException(status_code=404, detail="Personel tidak ditemukan")
    
    edu_dict = data.model_dump()
    edu_dict["id"] = str(uuid.uuid4())
    edu_dict["personnel_id"] = personnel_id
    edu_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.education.insert_one(edu_dict)
    await create_audit_log(user["id"], user["username"], "CREATE_EDUCATION", "education", edu_dict["id"])
    
    edu_dict["created_at"] = datetime.fromisoformat(edu_dict["created_at"])
    return EducationResponse(**edu_dict)

# ================== FAMILY ROUTES ==================
@api_router.get("/personnel/{personnel_id}/family", response_model=List[FamilyResponse])
async def get_family(personnel_id: str, user: dict = Depends(get_current_user)):
    family = await db.family.find({"personnel_id": personnel_id}, {"_id": 0}).to_list(100)
    for f in family:
        if isinstance(f.get("created_at"), str):
            f["created_at"] = datetime.fromisoformat(f["created_at"])
    return family

@api_router.post("/personnel/{personnel_id}/family", response_model=FamilyResponse)
async def create_family(personnel_id: str, data: FamilyCreate, user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    personnel = await db.personnel.find_one({"id": personnel_id})
    if not personnel:
        raise HTTPException(status_code=404, detail="Personel tidak ditemukan")
    
    family_dict = data.model_dump()
    family_dict["id"] = str(uuid.uuid4())
    family_dict["personnel_id"] = personnel_id
    family_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.family.insert_one(family_dict)
    await create_audit_log(user["id"], user["username"], "CREATE_FAMILY", "family", family_dict["id"])
    
    family_dict["created_at"] = datetime.fromisoformat(family_dict["created_at"])
    return FamilyResponse(**family_dict)

# ================== MUTATION/RETIREMENT REQUEST ROUTES ==================
@api_router.get("/mutation-requests", response_model=List[MutationRequestResponse])
async def get_mutation_requests(
    status: Optional[str] = None,
    jenis: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    if jenis:
        query["jenis_mutasi"] = jenis
    
    requests = await db.mutation_requests.find(query, {"_id": 0}).to_list(1000)
    for r in requests:
        if isinstance(r.get("created_at"), str):
            r["created_at"] = datetime.fromisoformat(r["created_at"])
        if isinstance(r.get("verified_at"), str):
            r["verified_at"] = datetime.fromisoformat(r["verified_at"])
    return requests

@api_router.post("/mutation-requests", response_model=MutationRequestResponse)
async def create_mutation_request(data: MutationRequestCreate, user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    personnel = await db.personnel.find_one({"id": data.personnel_id})
    if not personnel:
        raise HTTPException(status_code=404, detail="Personel tidak ditemukan")
    
    request_dict = data.model_dump()
    request_dict["id"] = str(uuid.uuid4())
    request_dict["status"] = RequestStatus.PENDING.value
    request_dict["created_by"] = user["id"]
    request_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.mutation_requests.insert_one(request_dict)
    await create_audit_log(user["id"], user["username"], "CREATE_MUTATION_REQUEST", "mutation_request", request_dict["id"])
    
    request_dict["created_at"] = datetime.fromisoformat(request_dict["created_at"])
    return MutationRequestResponse(**request_dict)

@api_router.put("/mutation-requests/{request_id}/verify")
async def verify_mutation_request(request_id: str, action: VerificationAction, user: dict = Depends(require_roles(UserRole.VERIFIER))):
    existing = await db.mutation_requests.find_one({"id": request_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")
    if existing["status"] != RequestStatus.PENDING.value:
        raise HTTPException(status_code=400, detail="Pengajuan sudah diverifikasi")
    
    update_data = {
        "status": action.status.value,
        "catatan_verifikator": action.catatan,
        "verified_by": user["id"],
        "verified_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.mutation_requests.update_one({"id": request_id}, {"$set": update_data})
    
    if action.status == RequestStatus.APPROVED:
        if existing["jenis_mutasi"] == "pensiun":
            await db.personnel.update_one({"id": existing["personnel_id"]}, {"$set": {"status": "pensiun"}})
        else:
            update_personnel = {}
            if existing.get("jabatan_tujuan"):
                update_personnel["jabatan"] = existing["jabatan_tujuan"]
            if existing.get("satuan_tujuan"):
                update_personnel["satuan"] = existing["satuan_tujuan"]
            if update_personnel:
                await db.personnel.update_one({"id": existing["personnel_id"]}, {"$set": update_personnel})
    
    await create_audit_log(user["id"], user["username"], f"VERIFY_MUTATION_{action.status.value.upper()}", "mutation_request", request_id)
    return {"message": f"Pengajuan {action.status.value}"}

# ================== CORRECTION REQUEST ROUTES (for Personnel role) ==================
@api_router.get("/correction-requests", response_model=List[CorrectionRequestResponse])
async def get_correction_requests(status: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {}
    if user["role"] == UserRole.PERSONNEL.value:
        query["created_by"] = user["id"]
    if status:
        query["status"] = status
    
    requests = await db.correction_requests.find(query, {"_id": 0}).to_list(1000)
    for r in requests:
        if isinstance(r.get("created_at"), str):
            r["created_at"] = datetime.fromisoformat(r["created_at"])
        if isinstance(r.get("verified_at"), str):
            r["verified_at"] = datetime.fromisoformat(r["verified_at"])
    return requests

@api_router.post("/correction-requests", response_model=CorrectionRequestResponse)
async def create_correction_request(data: CorrectionRequestCreate, user: dict = Depends(require_roles(UserRole.PERSONNEL))):
    personnel = await db.personnel.find_one({"id": data.personnel_id})
    if not personnel:
        raise HTTPException(status_code=404, detail="Personel tidak ditemukan")
    if personnel["nrp"] != user.get("nrp"):
        raise HTTPException(status_code=403, detail="Anda hanya bisa mengajukan koreksi untuk data diri sendiri")
    
    request_dict = data.model_dump()
    request_dict["id"] = str(uuid.uuid4())
    request_dict["status"] = RequestStatus.PENDING.value
    request_dict["created_by"] = user["id"]
    request_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.correction_requests.insert_one(request_dict)
    await create_audit_log(user["id"], user["username"], "CREATE_CORRECTION_REQUEST", "correction_request", request_dict["id"])
    
    request_dict["created_at"] = datetime.fromisoformat(request_dict["created_at"])
    return CorrectionRequestResponse(**request_dict)

@api_router.put("/correction-requests/{request_id}/verify")
async def verify_correction_request(request_id: str, action: VerificationAction, user: dict = Depends(require_roles(UserRole.VERIFIER))):
    existing = await db.correction_requests.find_one({"id": request_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")
    if existing["status"] != RequestStatus.PENDING.value:
        raise HTTPException(status_code=400, detail="Pengajuan sudah diverifikasi")
    
    update_data = {
        "status": action.status.value,
        "catatan_verifikator": action.catatan,
        "verified_by": user["id"],
        "verified_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.correction_requests.update_one({"id": request_id}, {"$set": update_data})
    
    if action.status == RequestStatus.APPROVED:
        await db.personnel.update_one(
            {"id": existing["personnel_id"]},
            {"$set": {existing["field_name"]: existing["nilai_baru"]}}
        )
    
    await create_audit_log(user["id"], user["username"], f"VERIFY_CORRECTION_{action.status.value.upper()}", "correction_request", request_id)
    return {"message": f"Pengajuan koreksi {action.status.value}"}

# ================== AUDIT LOG ROUTES ==================
@api_router.get("/audit-logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    entity_type: Optional[str] = None,
    user_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.LEADER))
):
    query = {}
    if entity_type:
        query["entity_type"] = entity_type
    if user_id:
        query["user_id"] = user_id
    
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    for log in logs:
        if isinstance(log.get("timestamp"), str):
            log["timestamp"] = datetime.fromisoformat(log["timestamp"])
    return logs

# ================== DASHBOARD STATS ==================
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user: dict = Depends(get_current_user)):
    total_personnel = await db.personnel.count_documents({})
    active_personnel = await db.personnel.count_documents({"status": "active"})
    pending_mutations = await db.mutation_requests.count_documents({"status": "pending"})
    pending_corrections = await db.correction_requests.count_documents({"status": "pending"})
    
    by_pangkat = await db.personnel.aggregate([
        {"$match": {"status": "active"}},
        {"$group": {"_id": "$pangkat", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]).to_list(20)
    
    recent_activities = await db.audit_logs.find({}, {"_id": 0}).sort("timestamp", -1).limit(10).to_list(10)
    for a in recent_activities:
        if isinstance(a.get("timestamp"), str):
            a["timestamp"] = datetime.fromisoformat(a["timestamp"])
    
    return {
        "total_personnel": total_personnel,
        "active_personnel": active_personnel,
        "pending_mutations": pending_mutations,
        "pending_corrections": pending_corrections,
        "by_pangkat": {item["_id"]: item["count"] for item in by_pangkat if item["_id"]},
        "recent_activities": recent_activities
    }

# ================== IMPORT EXCEL ==================
@api_router.post("/import/personnel")
async def import_personnel_excel(file: UploadFile = File(...), user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF))):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File harus berformat Excel (.xlsx atau .xls)")
    
    content = await file.read()
    
    # Read Excel with no header to handle custom format
    df_raw = pd.read_excel(io.BytesIO(content), header=None)
    
    # Find header row (look for NRP column)
    header_row = None
    for i in range(min(10, len(df_raw))):
        row_values = [str(v).upper() if pd.notna(v) else '' for v in df_raw.iloc[i]]
        if 'NRP' in row_values or 'NAMA' in row_values:
            header_row = i
            break
    
    if header_row is not None:
        # Re-read with correct header
        df = pd.read_excel(io.BytesIO(content), header=header_row)
        df.columns = [str(c).strip().upper() for c in df.columns]
    else:
        # Try standard reading
        df = pd.read_excel(io.BytesIO(content))
        df.columns = [str(c).strip().upper() for c in df.columns]
    
    # Map column names (handle variations)
    column_mapping = {}
    for col in df.columns:
        col_clean = col.strip().upper()
        if 'NAMA' in col_clean:
            column_mapping[col] = 'nama'
        elif col_clean == 'PANGKAT':
            column_mapping[col] = 'pangkat'
        elif col_clean == 'NRP':
            column_mapping[col] = 'nrp'
        elif 'JABATAN' in col_clean:
            column_mapping[col] = 'jabatan'
        elif col_clean == 'TMT' or 'TMT' in col_clean:
            column_mapping[col] = 'tmt_jabatan'
        elif 'LAHIR' in col_clean:
            column_mapping[col] = 'tanggal_lahir'
        elif 'PRESTASI' in col_clean:
            column_mapping[col] = 'prestasi'
        elif 'DIKBANGUM' in col_clean:
            column_mapping[col] = 'dikbangum'
        elif 'DIKBANGSPES' in col_clean:
            column_mapping[col] = 'dikbangspes'
    
    df = df.rename(columns=column_mapping)
    
    imported_count = 0
    skipped_count = 0
    errors = []
    
    # Process rows and combine multi-line entries
    current_personnel = None
    
    for idx, row in df.iterrows():
        try:
            nrp_val = row.get('nrp', '')
            nrp = str(nrp_val).strip() if pd.notna(nrp_val) else ''
            
            # Skip header-like or empty rows
            if not nrp or nrp == 'nan' or nrp.upper() == 'NRP' or nrp.isalpha():
                # Check if this is a continuation row
                if current_personnel:
                    # Append additional education/prestasi data
                    for field in ['dikbangum', 'dikbangspes', 'prestasi']:
                        val = row.get(field, '')
                        if pd.notna(val) and str(val).strip() and str(val).strip() != 'nan':
                            if current_personnel.get(field):
                                current_personnel[field] += ', ' + str(val).strip()
                            else:
                                current_personnel[field] = str(val).strip()
                continue
            
            # Save previous personnel
            if current_personnel:
                existing = await db.personnel.find_one({"nrp": current_personnel["nrp"]})
                if not existing:
                    await db.personnel.insert_one(current_personnel)
                    imported_count += 1
                else:
                    skipped_count += 1
            
            # Start new personnel record
            def clean_val(v):
                if pd.notna(v) and str(v).strip() and str(v).strip().lower() != 'nan':
                    return str(v).strip()
                return ''
            
            current_personnel = {
                "id": str(uuid.uuid4()),
                "nrp": nrp,
                "nama": clean_val(row.get('nama', '')),
                "pangkat": clean_val(row.get('pangkat', '')),
                "jabatan": clean_val(row.get('jabatan', '')),
                "satuan": "",
                "tmt_jabatan": clean_val(row.get('tmt_jabatan', '')),
                "tanggal_lahir": clean_val(row.get('tanggal_lahir', '')),
                "prestasi": clean_val(row.get('prestasi', '')),
                "dikbangum": clean_val(row.get('dikbangum', '')),
                "dikbangspes": clean_val(row.get('dikbangspes', '')),
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            errors.append(f"Baris {idx + 2}: {str(e)}")
    
    # Save last personnel
    if current_personnel:
        existing = await db.personnel.find_one({"nrp": current_personnel["nrp"]})
        if not existing:
            await db.personnel.insert_one(current_personnel)
            imported_count += 1
        else:
            skipped_count += 1
    
    await create_audit_log(user["id"], user["username"], "IMPORT_PERSONNEL", "personnel", None, None, {"imported": imported_count, "skipped": skipped_count})
    
    return {
        "message": f"Import selesai. {imported_count} data berhasil diimport, {skipped_count} data dilewati",
        "imported": imported_count,
        "skipped": skipped_count,
        "errors": errors[:10]
    }

# ================== EXPORT/REPORTS ==================
@api_router.get("/reports/personnel")
async def export_personnel_report(
    format: str = Query("json", enum=["json", "excel"]),
    pangkat: Optional[str] = None,
    satuan: Optional[str] = None,
    user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF, UserRole.LEADER))
):
    query = {"status": "active"}
    if pangkat:
        query["pangkat"] = pangkat
    if satuan:
        query["satuan"] = {"$regex": satuan, "$options": "i"}
    
    personnel = await db.personnel.find(query, {"_id": 0}).to_list(10000)
    
    if format == "json":
        return {"data": personnel, "total": len(personnel)}
    
    # For Excel export, return data that frontend can convert
    return {
        "data": personnel,
        "total": len(personnel),
        "columns": ["nrp", "nama", "pangkat", "jabatan", "satuan", "tmt_jabatan", "tanggal_lahir", "status"]
    }

@api_router.get("/reports/mutations")
async def export_mutations_report(
    status: Optional[str] = None,
    user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF, UserRole.LEADER))
):
    query = {}
    if status:
        query["status"] = status
    
    mutations = await db.mutation_requests.find(query, {"_id": 0}).to_list(10000)
    
    # Enrich with personnel data
    for m in mutations:
        personnel = await db.personnel.find_one({"id": m["personnel_id"]}, {"_id": 0, "nama": 1, "nrp": 1, "pangkat": 1})
        if personnel:
            m["personnel_nama"] = personnel.get("nama", "")
            m["personnel_nrp"] = personnel.get("nrp", "")
            m["personnel_pangkat"] = personnel.get("pangkat", "")
    
    return {"data": mutations, "total": len(mutations)}

# ================== REFERENCE DATA ==================
@api_router.get("/reference/pangkat")
async def get_pangkat_list():
    pangkat_list = [
        "PRADA", "PDA", "PRATU", "PTU", "PRAK", "PRKL", "KOPDA", "KDA", "KOPTU", "KTU",
        "KOPKA", "KKA", "SERDA", "SDA", "SERTU", "STU", "SERKA", "SKA", "SERMA", "SMA",
        "PELDA", "PDA", "PELTU", "PTU", "LETDA", "LDA", "LETTU", "LTU", "LETKA", "LKA",
        "KAPTEN", "KAP", "MAYOR", "MAY", "LETKOL", "LKL", "KOLONEL", "KOL",
        "BRIGJEN", "BGJ", "MAYJEN", "MJN", "LETJEN", "LJN", "JENDERAL", "JEN",
        "SERTU ARH", "SERDA ARH", "MAYOR ARH", "LETKOL ARH"
    ]
    return pangkat_list

@api_router.get("/reference/satuan")
async def get_satuan_list():
    satuan = await db.personnel.distinct("satuan")
    return [s for s in satuan if s]

# ================== INITIALIZATION ==================
@api_router.post("/init/setup")
async def initialize_system():
    """Initialize system with default users"""
    # Check if already initialized
    admin_exists = await db.users.find_one({"role": "admin"})
    if admin_exists:
        return {"message": "System already initialized"}
    
    default_users = [
        {"username": "admin", "nama_lengkap": "Administrator", "role": "admin", "password": "admin123"},
        {"username": "staff1", "nama_lengkap": "Staf Kepegawaian 1", "role": "staff", "password": "staff123"},
        {"username": "verifikator1", "nama_lengkap": "Pejabat Verifikator", "role": "verifier", "password": "verif123"},
        {"username": "pimpinan", "nama_lengkap": "Pimpinan Satuan", "role": "leader", "password": "pimpin123"},
        {"username": "personel1", "nama_lengkap": "Fredy Jaguar", "role": "personnel", "nrp": "11120017460989", "password": "personel123"}
    ]
    
    for user_data in default_users:
        user_dict = {
            "id": str(uuid.uuid4()),
            "username": user_data["username"],
            "nama_lengkap": user_data["nama_lengkap"],
            "role": user_data["role"],
            "nrp": user_data.get("nrp"),
            "password": hash_password(user_data["password"]),
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_dict)
    
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

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
