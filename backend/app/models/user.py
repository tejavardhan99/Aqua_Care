from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    id: str
    email: str
    full_name: str
    role: str = "operator"  # "admin" | "operator"
    pond_ids: list[str] = ["pond-01"]

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class LoginRequest(BaseModel):
    email: str
    password: str

