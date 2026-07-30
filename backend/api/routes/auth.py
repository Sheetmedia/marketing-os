from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import create_access_token, get_current_user
from core.limiter import limiter
from services import crud
from api.utils import model_to_dict
import uuid
from datetime import datetime, timezone

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
async def register():
    """Public self-registration is disabled. Accounts are provisioned by an agency admin."""
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="Public registration is disabled",
    )


@router.post("/login")
@limiter.limit("10/minute")
async def login(
    request: Request,
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate user and return JWT token."""
    user = await crud.authenticate_user(db, email=body.email, password=body.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_data = model_to_dict(user)
    access_token = create_access_token(
        data={
            "sub": user_data["id"],
            "email": user_data["email"],
            "role": user_data.get("role", "agency_member"),
            "agency_id": str(user_data["agency_id"]) if user_data.get("agency_id") else None,
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me")
async def get_current_user_info(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current authenticated user info."""
    user = await crud.get_user_by_id(db, user_id=current_user["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    data = model_to_dict(user)
    data.pop("hashed_password", None)
    data.pop("password", None)
    return data


@router.put("/me")
async def update_current_user(
    full_name: str = None,
    email: str = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user profile."""
    update_data = {}
    if full_name is not None:
        update_data["full_name"] = full_name
    if email is not None:
        update_data["email"] = email

    user = await crud.get_user_by_id(db, user_id=current_user["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Apply updates
    for key, value in update_data.items():
        setattr(user, key, value)
    await db.flush()

    data = model_to_dict(user)
    data.pop("hashed_password", None)
    data.pop("password", None)
    data["message"] = "Profile updated successfully"
    return data
