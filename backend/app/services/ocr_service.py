import os
import logging
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.database.models import EvidenceDB, OCRResultDB
from app.models.ocr import OCR_SUPPORTED_EXTENSIONS, OCRStatus
from app.schemas.ocr import OCRResponse, OCRResultResponse

logger = logging.getLogger(__name__)

_ocr_reader = None


def _get_reader():
    global _ocr_reader
    if _ocr_reader is None:
        import easyocr
        _ocr_reader = easyocr.Reader(["en"], gpu=False)
        logger.info("[OCR ENGINE] EasyOCR reader initialised")
    return _ocr_reader


def _parse_result(result) -> str:
    if not result:
        return ""
    return "\n".join(str(text) for (_, text, _) in result if text and str(text).strip())


def _extract_from_image(file_path: str) -> str:
    reader = _get_reader()
    result = reader.readtext(file_path)
    return _parse_result(result)


def _extract_from_pdf(file_path: str) -> str:
    import fitz
    import tempfile
    doc = fitz.open(file_path)
    all_text = []
    for page_num in range(len(doc)):
        pix = doc[page_num].get_pixmap(dpi=200)
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(pix.tobytes("png"))
            tmp_path = tmp.name
        try:
            page_text = _extract_from_image(tmp_path)
            if page_text.strip():
                all_text.append(page_text)
        finally:
            os.unlink(tmp_path)
    doc.close()
    return "\n\n".join(all_text)


def process_ocr(evidence_id: str, db: Session) -> OCRResponse:
    logger.info(f"[OCR PROCESS] evidence_id={evidence_id}")

    evidence = db.query(EvidenceDB).filter(EvidenceDB.evidence_id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Evidence '{evidence_id}' not found.")

    ext = evidence.file_type.lower()
    if ext not in OCR_SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail=f"File type '.{ext}' not supported for OCR.")

    if not os.path.exists(evidence.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Evidence file missing on disk: {evidence.file_path}")

    try:
        text = _extract_from_pdf(evidence.file_path) if ext == "pdf" \
            else _extract_from_image(evidence.file_path)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[OCR PROCESS] failed: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"OCR processing failed: {str(e)}")

    # Upsert OCR result
    ocr_row = db.query(OCRResultDB).filter(OCRResultDB.evidence_id == evidence_id).first()
    if ocr_row:
        ocr_row.text = text
        ocr_row.characters_extracted = len(text)
        ocr_row.status = "processed"
    else:
        ocr_row = OCRResultDB(
            id=str(uuid.uuid4()),
            evidence_id=evidence_id,
            status="processed",
            text=text,
            characters_extracted=len(text),
            created_at=datetime.now(timezone.utc),
        )
        db.add(ocr_row)
    db.commit()
    db.refresh(ocr_row)

    logger.info(f"[OCR PROCESS] complete. chars={len(text)}")
    return OCRResponse(
        evidence_id=evidence_id,
        status=OCRStatus.processed,
        characters_extracted=ocr_row.characters_extracted,
        text=ocr_row.text,
    )


def get_ocr_result(evidence_id: str, db: Session) -> OCRResultResponse:
    ocr_row = db.query(OCRResultDB).filter(OCRResultDB.evidence_id == evidence_id).first()
    if not ocr_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"No OCR result for '{evidence_id}'. "
                                   "Run POST /ocr/process/{evidence_id} first.")
    return OCRResultResponse(
        evidence_id=ocr_row.evidence_id,
        status=OCRStatus(ocr_row.status),
        text=ocr_row.text,
    )
