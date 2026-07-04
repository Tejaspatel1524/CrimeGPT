"""
evidence_analysis_service.py
Full pipeline: OCR → Entity Extraction → Save to case → Return analysis.
"""
import json
import re
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Dict

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.database.models import EvidenceDB, OCRResultDB, CaseEntityDB
from app.models.ocr import OCR_SUPPORTED_EXTENSIONS
from app.services.ocr_service import _extract_from_image, _extract_from_pdf
import os

logger = logging.getLogger(__name__)

# ── Entity patterns with confidence scores ─────────────────────────────────────

_PHONE_RE    = re.compile(r'(?:\+91)?[6-9]\d{9}')
_UPI_RE      = re.compile(r'\b([a-zA-Z0-9._-]+@[a-zA-Z]+)\b')
_EMAIL_RE    = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}')
_URL_RE      = re.compile(r'https?://[^\s]+')
_TELEGRAM_RE = re.compile(r'(?<!\w)@([a-zA-Z][a-zA-Z0-9_]{4,31})(?!\w)')
_BANK_RE     = re.compile(r'\b\d{9,18}\b')
_IFSC_RE     = re.compile(r'\b[A-Z]{4}0[A-Z0-9]{6}\b')
_AMOUNT_RE   = re.compile(r'(?:₹|Rs\.?)\s?\d[\d,]*')

_CONFIDENCE = {
    "upi": 95, "phone": 90, "ifsc": 92, "email": 88,
    "bank": 78, "telegram": 85, "url": 82, "amount": 70,
}


def _extract_with_confidence(text: str) -> List[Dict]:
    """Extract all entity types with confidence scores."""
    entities = []

    # Remove URLs first to prevent @ conflicts
    urls = list(dict.fromkeys(u.rstrip('.,;)') for u in _URL_RE.findall(text)))
    clean = _URL_RE.sub(" ", text)

    for u in urls:
        entities.append({"type": "url", "value": u, "confidence": _CONFIDENCE["url"]})

    # Amounts
    for a in dict.fromkeys(_AMOUNT_RE.findall(clean)):
        entities.append({"type": "amount", "value": a, "confidence": _CONFIDENCE["amount"]})

    # IFSC (before bank to avoid overlap)
    for i in dict.fromkeys(_IFSC_RE.findall(clean)):
        entities.append({"type": "ifsc", "value": i, "confidence": _CONFIDENCE["ifsc"]})

    # Bank accounts — exclude numbers that are IFSC codes
    ifsc_set = {e["value"] for e in entities if e["type"] == "ifsc"}
    for b in dict.fromkeys(_BANK_RE.findall(clean)):
        if b not in ifsc_set:
            entities.append({"type": "bank", "value": b, "confidence": _CONFIDENCE["bank"]})

    # Emails
    all_emails = {e.lower() for e in _EMAIL_RE.findall(clean)}

    # UPI — domain has no dot, not a full email prefix
    seen_upi = set()
    for m in _UPI_RE.findall(clean):
        if '.' not in m.split('@')[1] and not any(e.startswith(m.lower()) for e in all_emails):
            key = m.lower()
            if key not in seen_upi:
                seen_upi.add(key)
                entities.append({"type": "upi", "value": m, "confidence": _CONFIDENCE["upi"]})

    upi_set = seen_upi
    for e in _EMAIL_RE.findall(clean):
        if e.lower() not in upi_set:
            entities.append({"type": "email", "value": e, "confidence": _CONFIDENCE["email"]})

    # Phones
    for p in dict.fromkeys(re.sub(r'[\s\-]', '', p) for p in _PHONE_RE.findall(clean)):
        entities.append({"type": "phone", "value": p, "confidence": _CONFIDENCE["phone"]})

    # Telegram
    ig_re = re.compile(r'(?:(?:https?://)?(?:www\.)?instagram\.com/)([a-zA-Z0-9._]{1,30})', re.IGNORECASE)
    ig_set = {m.lower() for m in ig_re.findall(clean)}
    for m in dict.fromkeys(_TELEGRAM_RE.findall(clean)):
        if m.lower() not in ig_set:
            entities.append({"type": "telegram", "value": f"@{m}", "confidence": _CONFIDENCE["telegram"]})

    # Deduplicate by (type, value)
    seen = set()
    deduped = []
    for e in entities:
        key = (e["type"], e["value"].lower())
        if key not in seen:
            seen.add(key)
            deduped.append(e)

    return deduped


def _save_entities(case_id: str, entities: List[Dict], db: Session) -> int:
    """Save extracted entities to case_entities, skipping duplicates."""
    # Get existing values per type for this case to avoid duplicates
    existing = db.query(CaseEntityDB).filter(CaseEntityDB.case_id == case_id).all()
    existing_set = {(r.entity_type, r.value.lower()) for r in existing}

    saved = 0
    for ent in entities:
        key = (ent["type"], ent["value"].lower())
        if key not in existing_set:
            db.add(CaseEntityDB(
                id=str(uuid.uuid4()),
                case_id=case_id,
                entity_type=ent["type"],
                value=ent["value"],
                created_at=datetime.now(timezone.utc),
            ))
            existing_set.add(key)
            saved += 1
    return saved


def analyze_evidence(evidence_id: str, db: Session) -> dict:
    """
    Full pipeline: OCR → Entity Extraction → Save to DB → Return analysis.
    """
    evidence = db.query(EvidenceDB).filter(EvidenceDB.evidence_id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Evidence '{evidence_id}' not found.")

    ext = evidence.file_type.lower()
    if ext not in OCR_SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail=f"File type '.{ext}' not supported. Supported: {sorted(OCR_SUPPORTED_EXTENSIONS)}")

    if not os.path.exists(evidence.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Evidence file not found on disk.")

    # Mark as processing
    ocr_row = db.query(OCRResultDB).filter(OCRResultDB.evidence_id == evidence_id).first()
    if not ocr_row:
        ocr_row = OCRResultDB(
            id=str(uuid.uuid4()),
            evidence_id=evidence_id,
            status="processing",
            text="",
            characters_extracted=0,
            created_at=datetime.now(timezone.utc),
        )
        db.add(ocr_row)
    else:
        ocr_row.status = "processing"
    db.commit()

    try:
        # OCR
        logger.info(f"[EVIDENCE ANALYSIS] OCR start: {evidence.filename}")
        raw_text = _extract_from_pdf(evidence.file_path) if ext == "pdf" \
            else _extract_from_image(evidence.file_path)

        # Entity extraction
        entities = _extract_with_confidence(raw_text)

        # Save entities to case
        new_entities = _save_entities(evidence.case_id, entities, db)
        logger.info(f"[EVIDENCE ANALYSIS] {len(entities)} entities found, {new_entities} new saved")

        # Update OCR result
        ocr_row.status = "completed"
        ocr_row.text = raw_text
        ocr_row.characters_extracted = len(raw_text)
        ocr_row.entities_json = json.dumps(entities)
        ocr_row.entity_count = len(entities)
        ocr_row.error_message = None
        db.commit()

        return {
            "evidence_id":    evidence_id,
            "filename":       evidence.filename,
            "status":         "completed",
            "raw_text":       raw_text,
            "characters":     len(raw_text),
            "entities":       entities,
            "entity_count":   len(entities),
            "new_entities_saved": new_entities,
        }

    except Exception as e:
        logger.error(f"[EVIDENCE ANALYSIS] failed: {e}", exc_info=True)
        ocr_row.status = "failed"
        ocr_row.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Analysis failed: {str(e)}")


def get_analysis_result(evidence_id: str, db: Session) -> dict:
    """Return stored analysis result."""
    evidence = db.query(EvidenceDB).filter(EvidenceDB.evidence_id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Evidence '{evidence_id}' not found.")

    ocr_row = db.query(OCRResultDB).filter(OCRResultDB.evidence_id == evidence_id).first()
    if not ocr_row:
        return {
            "evidence_id": evidence_id,
            "filename":    evidence.filename,
            "status":      "pending",
            "raw_text":    "",
            "entities":    [],
            "entity_count": 0,
        }

    entities = json.loads(ocr_row.entities_json) if ocr_row.entities_json else []
    return {
        "evidence_id":   evidence_id,
        "filename":      evidence.filename,
        "status":        ocr_row.status,
        "raw_text":      ocr_row.text,
        "characters":    ocr_row.characters_extracted,
        "entities":      entities,
        "entity_count":  ocr_row.entity_count,
        "error_message": ocr_row.error_message,
    }
