import uuid
import os
import shutil
import logging
from datetime import datetime, timezone
from typing import List

from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from app.database.models import EvidenceDB
from app.models.evidence import ALLOWED_EXTENSIONS
from app.schemas.evidence import EvidenceResponse

logger = logging.getLogger(__name__)

UPLOAD_BASE = os.getenv("UPLOAD_BASE_DIR", "uploads")


def _ext(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def _to_response(e: EvidenceDB) -> EvidenceResponse:
    return EvidenceResponse(
        evidence_id=e.evidence_id,
        case_id=e.case_id,
        filename=e.filename,
        file_type=e.file_type,
        file_size=e.file_size,
        file_path=e.file_path,
        uploaded_at=e.uploaded_at,
    )


def upload_evidence(case_id: str, file: UploadFile, db: Session) -> EvidenceResponse:
    ext = _ext(file.filename or "")
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"File type '.{ext}' not allowed. Allowed: {sorted(ALLOWED_EXTENSIONS)}")

    case_dir = os.path.join(UPLOAD_BASE, case_id)
    os.makedirs(case_dir, exist_ok=True)

    evidence_id = str(uuid.uuid4())
    file_path = os.path.join(case_dir, f"{evidence_id}.{ext}")

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    record = EvidenceDB(
        evidence_id=evidence_id,
        case_id=case_id,
        filename=file.filename,
        file_type=ext,
        file_size=os.path.getsize(file_path),
        file_path=file_path,
        uploaded_at=datetime.now(timezone.utc),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    logger.info(f"[EVIDENCE UPLOAD] evidence_id={evidence_id} case_id={case_id}")
    return _to_response(record)


def list_evidence_by_case(case_id: str, db: Session) -> List[EvidenceResponse]:
    rows = db.query(EvidenceDB).filter(EvidenceDB.case_id == case_id).all()
    return [_to_response(r) for r in rows]


def get_evidence(evidence_id: str, db: Session) -> EvidenceResponse:
    record = db.query(EvidenceDB).filter(EvidenceDB.evidence_id == evidence_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Evidence '{evidence_id}' not found.")
    return _to_response(record)


def delete_evidence(evidence_id: str, db: Session) -> dict:
    record = db.query(EvidenceDB).filter(EvidenceDB.evidence_id == evidence_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Evidence '{evidence_id}' not found.")
    if os.path.exists(record.file_path):
        os.remove(record.file_path)
    case_dir = os.path.dirname(record.file_path)
    if os.path.isdir(case_dir) and not os.listdir(case_dir):
        os.rmdir(case_dir)
    db.delete(record)
    db.commit()
    return {"message": f"Evidence '{evidence_id}' deleted successfully."}
