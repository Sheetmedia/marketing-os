from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from core.database import get_db
from core.security import get_current_user
from api.utils import model_to_dict
from models.bug_report import BugReport
from typing import Optional
from datetime import datetime
import uuid

router = APIRouter()


@router.post("/")
async def create_bug_report(
    title: str,
    description: str,
    module: Optional[str] = None,
    severity: str = "medium",
    steps_to_reproduce: Optional[str] = None,
    expected_behavior: Optional[str] = None,
    actual_behavior: Optional[str] = None,
    browser_info: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new bug report."""
    bug = BugReport(
        id=uuid.uuid4(),
        title=title,
        description=description,
        module=module,
        severity=severity,
        steps_to_reproduce=steps_to_reproduce,
        expected_behavior=expected_behavior,
        actual_behavior=actual_behavior,
        browser_info=browser_info,
        reported_by=current_user.get("email", current_user.get("sub", "unknown")),
    )
    db.add(bug)
    await db.flush()
    return model_to_dict(bug)


@router.get("/stats")
async def get_bug_stats(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get bug report statistics."""
    total_result = await db.execute(select(func.count(BugReport.id)))
    total = total_result.scalar() or 0

    open_result = await db.execute(
        select(func.count(BugReport.id)).where(BugReport.status == "open")
    )
    open_count = open_result.scalar() or 0

    in_progress_result = await db.execute(
        select(func.count(BugReport.id)).where(BugReport.status == "in_progress")
    )
    in_progress_count = in_progress_result.scalar() or 0

    resolved_result = await db.execute(
        select(func.count(BugReport.id)).where(BugReport.status == "resolved")
    )
    resolved_count = resolved_result.scalar() or 0

    closed_result = await db.execute(
        select(func.count(BugReport.id)).where(BugReport.status == "closed")
    )
    closed_count = closed_result.scalar() or 0

    # By severity
    severity_stats = {}
    for sev in ["critical", "high", "medium", "low"]:
        sev_result = await db.execute(
            select(func.count(BugReport.id)).where(BugReport.severity == sev)
        )
        severity_stats[sev] = sev_result.scalar() or 0

    # By module
    module_query = await db.execute(
        select(BugReport.module, func.count(BugReport.id))
        .where(BugReport.module.isnot(None))
        .group_by(BugReport.module)
    )
    module_stats = {row[0]: row[1] for row in module_query.all()}

    return {
        "total": total,
        "open": open_count,
        "in_progress": in_progress_count,
        "resolved": resolved_count,
        "closed": closed_count,
        "by_severity": severity_stats,
        "by_module": module_stats,
    }


@router.get("/")
async def list_bugs(
    status_filter: Optional[str] = Query(None, alias="status"),
    severity: Optional[str] = None,
    module: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all bug reports with optional filters."""
    query = select(BugReport)

    if status_filter:
        query = query.where(BugReport.status == status_filter)
    if severity:
        query = query.where(BugReport.severity == severity)
    if module:
        query = query.where(BugReport.module == module)
    if search:
        query = query.where(BugReport.title.ilike(f"%{search}%"))

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch
    query = query.order_by(BugReport.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    bugs = result.scalars().all()

    return {
        "bugs": [model_to_dict(b) for b in bugs],
        "total": total,
    }


@router.get("/{bug_id}")
async def get_bug(
    bug_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single bug report."""
    result = await db.execute(
        select(BugReport).where(BugReport.id == bug_id)
    )
    bug = result.scalar_one_or_none()
    if not bug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bug report not found",
        )
    return model_to_dict(bug)


@router.put("/{bug_id}")
async def update_bug(
    bug_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    module: Optional[str] = None,
    severity: Optional[str] = None,
    status_value: Optional[str] = Query(None, alias="status"),
    assigned_to: Optional[str] = None,
    resolution: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a bug report."""
    result = await db.execute(
        select(BugReport).where(BugReport.id == bug_id)
    )
    bug = result.scalar_one_or_none()
    if not bug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bug report not found",
        )

    if title is not None:
        bug.title = title
    if description is not None:
        bug.description = description
    if module is not None:
        bug.module = module
    if severity is not None:
        bug.severity = severity
    if status_value is not None:
        bug.status = status_value
    if assigned_to is not None:
        bug.assigned_to = assigned_to
    if resolution is not None:
        bug.resolution = resolution

    bug.updated_at = datetime.utcnow()
    await db.flush()
    return model_to_dict(bug)


@router.put("/{bug_id}/resolve")
async def resolve_bug(
    bug_id: str,
    resolution: str = "",
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a bug as resolved."""
    result = await db.execute(
        select(BugReport).where(BugReport.id == bug_id)
    )
    bug = result.scalar_one_or_none()
    if not bug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bug report not found",
        )

    bug.status = "resolved"
    bug.resolution = resolution
    bug.resolved_at = datetime.utcnow()
    bug.updated_at = datetime.utcnow()
    await db.flush()
    return model_to_dict(bug)


@router.delete("/{bug_id}")
async def delete_bug(
    bug_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a bug report."""
    result = await db.execute(
        select(BugReport).where(BugReport.id == bug_id)
    )
    bug = result.scalar_one_or_none()
    if not bug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bug report not found",
        )

    await db.delete(bug)
    await db.flush()
    return {"message": "Bug report deleted"}
