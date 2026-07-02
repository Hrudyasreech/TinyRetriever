import re

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os, httpx
from jose import jwt
from supabase import create_client, Client
from sqlalchemy.orm import Session
from db.models import User
from db.database import get_db

security = HTTPBearer()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def get_token(credentials: HTTPAuthorizationCredentials = Depends(security),) -> str:
    token = credentials.credentials
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
    return token

async def get_jwks():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json")
        response.raise_for_status()
        return response.json()

def get_unverified_header(token: str):
    try:
        unverified_header = jwt.get_unverified_header(token)
        return unverified_header
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token header: {str(e)}",
        )

async def verify_token(token: str = Depends(get_token)):
    try:
        response = supabase.auth.get_user(token)
        if response.user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token or Expired token",
            )
        return response.user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
        )

async def get_current_user(supabase_user = Depends(verify_token), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == supabase_user.id).first()
    if user:
        return user
    new_user = User(
        id = supabase_user.id,
        email = supabase_user.email,
        name = supabase_user.user_metadata.get("full_name"),
        avatar_url = supabase_user.user_metadata.get("avatar_url"),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user