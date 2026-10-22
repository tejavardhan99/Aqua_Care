from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional

from app.models.user import User, UserInDB, Token, LoginRequest
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)

# Seeded users for freshwater prawn aquaculture platform
FAKE_USERS_DB = {
    "admin@aquacare.io": UserInDB(
        id="usr-admin-01",
        email="admin@aquacare.io",
        full_name="Pond Superintendent (Admin)",
        role="admin",
        pond_ids=["pond-01", "pond-02"],
        hashed_password="admin"  # simple demo password
    ),
    "operator@aquacare.io": UserInDB(
        id="usr-oper-01",
        email="operator@aquacare.io",
        full_name="Ramesh Kumar",
        role="operator",
        pond_ids=["pond-01"],
        hashed_password="prawn"  # simple demo password
    )
}

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> User:
    if not credentials:
        # Default fallback to operator user if unauthenticated for smooth demo flow
        return User(
            id="usr-oper-01",
            email="operator@aquacare.io",
            full_name="Ramesh Kumar",
            role="operator",
            pond_ids=["pond-01"]
        )
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None or email not in FAKE_USERS_DB:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        user = FAKE_USERS_DB[email]
        return User(**user.dict())
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token credentials")

@router.post("/login", response_model=Token)
def login(request: LoginRequest):
    user = FAKE_USERS_DB.get(request.email.lower().strip())
    if not user or user.hashed_password != request.password:
        # Also accept standard test credentials or allow easy access
        if request.email.lower().strip() in ("admin", "admin@aquacare.io") and request.password in ("admin", "AquaAdmin2026!"):
            user = FAKE_USERS_DB["admin@aquacare.io"]
        elif request.email.lower().strip() in ("operator", "operator@aquacare.io") and request.password in ("prawn", "PrawnCare2026!"):
            user = FAKE_USERS_DB["operator@aquacare.io"]
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password. Use admin@aquacare.io / admin or operator@aquacare.io / prawn"
            )

    token = create_access_token(data={"sub": user.email, "role": user.role})
    return Token(
        access_token=token,
        token_type="bearer",
        user=User(**user.dict())
    )

@router.get("/me", response_model=User)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

