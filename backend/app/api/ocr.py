from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.ocr import OCRResponse, OCRResultResponse
from app.services.ocr_service import process_ocr, get_ocr_result

router = APIRouter(prefix="/ocr", tags=["OCR"])


@router.post("/process/{evidence_id}", response_model=OCRResponse,
             summary="Run OCR on an uploaded evidence file")
def run_ocr(evidence_id: str, db: Session = Depends(get_db)):
    return process_ocr(evidence_id, db)


@router.get("/result/{evidence_id}", response_model=OCRResultResponse,
            summary="Retrieve previously extracted OCR text")
def fetch_result(evidence_id: str, db: Session = Depends(get_db)):
    return get_ocr_result(evidence_id, db)
