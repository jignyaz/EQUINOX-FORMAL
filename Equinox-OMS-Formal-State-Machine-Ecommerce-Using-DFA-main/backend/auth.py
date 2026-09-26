from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "techstore_jwt_super_secret_key_2024")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 43200))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


# ── Dependency: Get current customer ─────────────────────────────────────────
def get_current_customer(
    token: str = Depends(oauth2_scheme),
):
    from database import SessionLocal
    from models import Customer

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_token(token)
    if not payload or payload.get("role") != "customer":
        raise credentials_exception

    db = SessionLocal()
    try:
        customer = db.query(Customer).filter(Customer.id == payload.get("sub")).first()
        if not customer:
            raise credentials_exception
        return customer
    finally:
        db.close()


# ── Dependency: Get current operator ─────────────────────────────────────────
def get_current_operator(
    token: str = Depends(oauth2_scheme),
):
    from database import SessionLocal
    from models import Operator

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Operator not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_token(token)
    if not payload or payload.get("role") != "operator":
        raise credentials_exception

    db = SessionLocal()
    try:
        operator = db.query(Operator).filter(Operator.id == payload.get("sub")).first()
        if not operator:
            raise credentials_exception
        return operator
    finally:
        db.close()


# ── Optional: customer might or might not be logged in ───────────────────────
def get_optional_customer(token: str = Depends(oauth2_scheme)):
    if not token:
        return None
    try:
        return get_current_customer(token)
    except HTTPException:
        return None
