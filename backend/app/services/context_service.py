"""
context_service.py
Retrieves all investigation data for a case and builds a structured context dict.
This is the RETRIEVAL layer — completely separate from prompt building and AI calls.
"""
import json
from sqlalchemy.orm import Session
from app.database.models import (
    CaseDB, CaseEntityDB, EvidenceDB, OCRResultDB,
    CaseNoteDB, CaseTimelineEventDB,
)
from app.services.recovery_service import compute_recovery


def get_case_context(case_id: str, db: Session) -> dict:
    """
    Collects all available investigation data for a case.
    Returns a structured dict — no AI calls happen here.
    """
    case = db.query(CaseDB).filter(CaseDB.case_id == case_id).first()
    if not case:
        return {"error": f"Case {case_id} not found"}

    # ── Case details ────────────────────────────────────────────────────────
    case_details = {
        "case_id":       case.case_id,
        "case_number":   case.case_number,
        "title":         case.title,
        "fraud_type":    case.fraud_type,
        "status":        case.status.value,
        "priority":      case.priority.value,
        "amount_lost":   case.amount_lost,
        "victim_name":   case.victim_name,
        "victim_phone":  case.victim_phone,
        "victim_email":  case.victim_email,
        "complaint_text":case.complaint_text,
        "created_at":    case.created_at.isoformat(),
    }

    # ── Extracted entities ──────────────────────────────────────────────────
    entities_raw = db.query(CaseEntityDB).filter(CaseEntityDB.case_id == case_id).all()
    entities_by_type: dict = {}
    for e in entities_raw:
        entities_by_type.setdefault(e.entity_type, []).append(e.value)

    # ── Evidence + OCR ──────────────────────────────────────────────────────
    evidence_list = []
    for ev in db.query(EvidenceDB).filter(EvidenceDB.case_id == case_id).all():
        ocr = db.query(OCRResultDB).filter(OCRResultDB.evidence_id == ev.evidence_id).first()
        evidence_list.append({
            "filename":   ev.filename,
            "file_type":  ev.file_type,
            "ocr_status": ocr.status if ocr else "pending",
            "ocr_text":   (ocr.text[:1000] if ocr and ocr.text else ""),
            "entities":   json.loads(ocr.entities_json) if (ocr and ocr.entities_json) else [],
        })

    # ── Officer notes ───────────────────────────────────────────────────────
    notes = [
        {
            "officer": n.officer_name,
            "type":    n.note_type,
            "text":    n.note_text,
            "date":    n.created_at.isoformat(),
        }
        for n in db.query(CaseNoteDB)
            .filter(CaseNoteDB.case_id == case_id)
            .order_by(CaseNoteDB.created_at.desc())
            .limit(10).all()
    ]

    # ── Timeline ────────────────────────────────────────────────────────────
    timeline = [
        {
            "title":      t.title,
            "type":       t.event_type,
            "by":         t.created_by,
            "date":       t.created_at.isoformat(),
        }
        for t in db.query(CaseTimelineEventDB)
            .filter(CaseTimelineEventDB.case_id == case_id)
            .order_by(CaseTimelineEventDB.created_at.desc())
            .limit(20).all()
    ]

    # ── Cross-case matches ──────────────────────────────────────────────────
    from app.database.models import CaseEntityDB as CE
    cross_matches = []
    seen = set()
    for ent in entities_raw:
        if ent.entity_type not in {"phone", "upi", "bank", "email"}:
            continue
        others = (
            db.query(CE, CaseDB)
            .join(CaseDB, CE.case_id == CaseDB.case_id)
            .filter(CE.value == ent.value, CE.entity_type == ent.entity_type, CE.case_id != case_id)
            .limit(5).all()
        )
        for _, other_case in others:
            key = (ent.value, other_case.case_id)
            if key not in seen:
                seen.add(key)
                cross_matches.append({
                    "shared_value":  ent.value,
                    "entity_type":   ent.entity_type,
                    "related_case":  other_case.case_number or other_case.case_id[:8],
                    "related_title": other_case.title,
                })

    # ── Recovery intelligence ───────────────────────────────────────────────
    recovery = compute_recovery(case_id, db)

    return {
        "case":           case_details,
        "entities":       entities_by_type,
        "evidence":       evidence_list,
        "notes":          notes,
        "timeline":       timeline,
        "cross_matches":  cross_matches,
        "recovery":       recovery,
    }
