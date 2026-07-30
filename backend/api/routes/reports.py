from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user
from core.deps import get_owned_client
from services import crud
from api.utils import model_to_dict
from models.client import Client
from typing import Optional
import uuid
from datetime import datetime, timezone

router = APIRouter()


@router.get("/{client_id}/reports")
async def list_reports(
    client_id: str,
    skip: int = 0,
    limit: int = 20,
    report_type: Optional[str] = None,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """List generated reports."""
    reports, total = await crud.list_reports(
        db,
        client_id=client_id,
        skip=skip,
        limit=limit,
        report_type=report_type,
    )
    return {
        "reports": [model_to_dict(r) for r in reports],
        "total": total,
    }


@router.post("/{client_id}/reports/generate", status_code=status.HTTP_202_ACCEPTED)
async def generate_report(
    client_id: str,
    report_type: str,
    date_range_start: str,
    date_range_end: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Generate a new report (async)."""
    report = await crud.create_report(
        db,
        client_id=client_id,
        title=f"{report_type.title()} Report",
        report_type=report_type,
        date_range_start=datetime.fromisoformat(date_range_start) if date_range_start else None,
        date_range_end=datetime.fromisoformat(date_range_end) if date_range_end else None,
    )
    data = model_to_dict(report)
    return {
        "id": data["id"],
        "client_id": data["client_id"],
        "report_type": data.get("report_type"),
        "status": data.get("status", "generating"),
        "message": "Report generation started. You will be notified when it's ready.",
    }


@router.get("/{client_id}/reports/{report_id}")
async def get_report(
    client_id: str,
    report_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Get report details with data."""
    report = await crud.get_report(db, client_id=client_id, report_id=report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    return model_to_dict(report)


@router.get("/{client_id}/reports/{report_id}/download")
async def download_report(
    client_id: str,
    report_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Download report as PDF."""
    report = await crud.get_report(db, client_id=client_id, report_id=report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    return {
        "download_url": f"/reports/{report_id}/download.pdf",
        "filename": f"report_{report_id}.pdf",
    }
