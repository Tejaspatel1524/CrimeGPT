import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.database.models import CaseDB
from app.schemas.case import CaseCreate, CaseUpdate, CaseResponse
from app.models.case import CaseStatus, Priority
from app.services.entity_service import save_entities_for_case


# ── Case number generation ────────────────────────────────────────────────────

def _generate_case_number(db: Session) -> str:
    """Generate next sequential case number: CC-YYYY-NNNNNN"""
    year = datetime.now(timezone.utc).year
    prefix = f"CC-{year}-"

    # Count existing cases for this year to derive next sequence
    count = (
        db.query(func.count(CaseDB.case_id))
        .filter(CaseDB.case_number.like(f"{prefix}%"))
        .scalar()
    ) or 0

    return f"{prefix}{(count + 1):06d}"


def backfill_case_numbers(db: Session) -> None:
    """Assign case_number to any existing records that don't have one."""
    cases_without = (
        db.query(CaseDB)
        .filter(CaseDB.case_number.is_(None))
        .order_by(CaseDB.created_at)
        .all()
    )
    for case in cases_without:
        case.case_number = _generate_case_number(db)
        db.flush()
    if cases_without:
        db.commit()


# ── Response builder ──────────────────────────────────────────────────────────

def _to_response(c: CaseDB) -> CaseResponse:
    from app.schemas.case import OwnerInfo
    
    owner_info = None
    if c.owner:
        owner_info = OwnerInfo(
            id=c.owner.id,
            full_name=c.owner.full_name,
            email=c.owner.email,
            role=c.owner.role.value,
            department=c.owner.department
        )
    
    return CaseResponse(
        case_id=c.case_id,
        case_number=c.case_number or "",
        title=c.title,
        fraud_type=c.fraud_type,
        victim_name=c.victim_name,
        victim_phone=c.victim_phone,
        victim_email=c.victim_email,
        amount_lost=c.amount_lost,
        priority=c.priority,
        status=c.status,
        complaint_text=c.complaint_text,
        owner=owner_info,
        created_at=c.created_at,
    )


# ── CRUD ──────────────────────────────────────────────────────────────────────

def create_case(payload: CaseCreate, db: Session, owner_id: str = None) -> CaseResponse:
    case = CaseDB(
        case_id=str(uuid.uuid4()),
        created_at=datetime.now(timezone.utc),
        owner_id=owner_id,
        **payload.model_dump(),
    )
    db.add(case)
    db.flush()  # get case_id before generating number / saving entities

    case.case_number = _generate_case_number(db)
    save_entities_for_case(case.case_id, payload.complaint_text, db)

    db.commit()
    db.refresh(case)
    return _to_response(case)


def list_cases(db: Session) -> List[CaseResponse]:
    """List all active (non-archived) cases by default."""
    cases = db.query(CaseDB).options(joinedload(CaseDB.owner)).filter(CaseDB.archived == 0).order_by(CaseDB.created_at).all()
    return [_to_response(c) for c in cases]


def list_archived_cases(db: Session) -> List[CaseResponse]:
    """List all archived cases."""
    cases = db.query(CaseDB).options(joinedload(CaseDB.owner)).filter(CaseDB.archived == 1).order_by(CaseDB.created_at).all()
    return [_to_response(c) for c in cases]


def get_case(case_id: str, db: Session) -> CaseResponse:
    """Get case by ID or case number."""
    # First try by case_id
    case = db.query(CaseDB).options(joinedload(CaseDB.owner)).filter(CaseDB.case_id == case_id).first()
    
    # If not found, try by case_number
    if not case:
        case = db.query(CaseDB).options(joinedload(CaseDB.owner)).filter(CaseDB.case_number == case_id).first()
    
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Case '{case_id}' not found.")
    return _to_response(case)


def update_case(case_id: str, payload: CaseUpdate, db: Session) -> CaseResponse:
    """Update case by ID or case number."""
    # First try by case_id
    case = db.query(CaseDB).filter(CaseDB.case_id == case_id).first()
    
    # If not found, try by case_number
    if not case:
        case = db.query(CaseDB).filter(CaseDB.case_number == case_id).first()
    
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Case '{case_id}' not found.")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(case, field, value)
    db.commit()
    db.refresh(case)
    return _to_response(case)


def delete_case(case_id: str, db: Session) -> dict:
    """Archive case by ID or case number (soft delete - marks as archived)."""
    # First try by case_id
    case = db.query(CaseDB).filter(CaseDB.case_id == case_id).first()
    
    # If not found, try by case_number
    if not case:
        case = db.query(CaseDB).filter(CaseDB.case_number == case_id).first()
    
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Case '{case_id}' not found.")
    
    # Mark as archived instead of deleting
    case.archived = 1
    db.commit()
    db.refresh(case)
    return {"message": f"Case '{case_id}' archived successfully."}


def archive_case(case_id: str, db: Session) -> dict:
    """Archive a case (marks it as archived without deleting data)."""
    return delete_case(case_id, db)  # Reuse delete_case which now archives


def unarchive_case(case_id: str, db: Session) -> dict:
    """Unarchive a case (restore to active cases)."""
    # First try by case_id
    case = db.query(CaseDB).filter(CaseDB.case_id == case_id).first()
    
    # If not found, try by case_number
    if not case:
        case = db.query(CaseDB).filter(CaseDB.case_number == case_id).first()
    
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Case '{case_id}' not found.")
    
    # Mark as active
    case.archived = 0
    db.commit()
    db.refresh(case)
    return {"message": f"Case '{case_id}' unarchived successfully."}
