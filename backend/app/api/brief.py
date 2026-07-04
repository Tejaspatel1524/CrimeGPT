from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.brief_service import generate_brief

router = APIRouter(prefix="/cases", tags=["Investigation Brief"])


@router.post("/{case_id}/investigation-brief",
             summary="Generate AI investigation brief for a case")
def create_brief(
    case_id: str,
    force: bool = Query(default=False, description="Regenerate even if cached"),
    db: Session = Depends(get_db),
):
    return generate_brief(case_id, db, force=force)


@router.get("/{case_id}/investigation-brief",
            summary="Get cached investigation brief (or generate if missing)")
def get_brief(case_id: str, db: Session = Depends(get_db)):
    return generate_brief(case_id, db, force=False)
