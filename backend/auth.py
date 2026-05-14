import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ✅ CAMBIO: Leer SECRET_KEY desde env
SECRET_KEY = os.getenv("SECRET_KEY", "SUPER_SECRET_KEY_REPLACE_FOR_PROD")
ALGORITHM = "HS256"

# ✅ CAMBIO: Sesiones dinámicas desde .env (Default 12 Horas)
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 720))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 15))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ✅ CAMBIO: Nuevo modelo
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # segundos

# ✅ CAMBIO: Nuevo modelo actualizado
class TokenData(BaseModel):
    user_id: int
    username: str
    role: str

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # ✅ CAMBIO: Agregar "type" field
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# ✅ CAMBIO: Nueva función con signature del blueprint
def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# ✅ CAMBIO: Nueva función que retorna TokenData
def decode_token(token: str) -> Optional[TokenData]:
    """Decodifica y valida el JWT"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            return None
        return TokenData(
            user_id=payload.get("user_id"),
            username=payload.get("sub"),
            role=payload.get("role")
        )
    except JWTError:
        return None


