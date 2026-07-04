from fastapi import APIRouter, UploadFile, File, Form, status, Depends
from typing import List
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.evidence import EvidenceResponse
from app.services.file_service import upload_evidence, list_evidence_by_case, get_evidence, delete_evidence
from app.services.evidence_analysis_service import analyze_evidence, get_analysis_result

router = APIRouter(prefix="/evidence", tags=["Evidence"])


@router.post("/upload", response_model=EvidenceResponse, status_code=status.HTTP_201_CREATED,
             summary="Upload evidence file for a case")
async def upload(
    case_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    return upload_evidence(case_id, file, db)


@router.get("/case/{case_id}", response_model=List[EvidenceResponse],
            summary="List all evidence for a case")
def list_by_case(case_id: str, db: Session = Depends(get_db)):
    return list_evidence_by_case(case_id, db)


@router.get("/{evidence_id}", response_model=EvidenceResponse,
            summary="Get evidence metadata by ID")
def get_one(evidence_id: str, db: Session = Depends(get_db)):
    return get_evidence(evidence_id, db)


@router.delete("/{evidence_id}", status_code=status.HTTP_200_OK,
               summary="Delete evidence file and metadata")
def delete(evidence_id: str, db: Session = Depends(get_db)):
    return delete_evidence(evidence_id, db)


@router.post("/{evidence_id}/analyze",
             summary="Run OCR + entity extraction on evidence file")
def analyze(evidence_id: str, db: Session = Depends(get_db)):
    return analyze_evidence(evidence_id, db)


@router.get("/{evidence_id}/analysis",
            summary="Get stored analysis result for evidence")
def get_analysis(evidence_id: str, db: Session = Depends(get_db)):
    return get_analysis_result(evidence_id, db)
