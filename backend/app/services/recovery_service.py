"""
recovery_service.py
Rule-based Recovery Intelligence Engine.
Uses actual case data + extracted entities to score fund recovery probability.
"""
from datetime import datetime, timezone
from typing import List, Dict
from sqlalchemy.orm import Session

from app.database.models import CaseDB, CaseEntityDB


# ── Scoring weights ────────────────────────────────────────────────────────────

POSITIVE = {
    "upi_found":              20,
    "bank_found":             20,
    "ifsc_found":             15,
    "reported_within_24h":    15,
    "reported_within_72h":    10,
    "multiple_entities":      10,
    "cross_case_matches":     15,   # updated: +15
    "transaction_evidence":   10,   # new: OCR evidence uploaded
    "phone_found":             5,
    "email_found":             5,
}

NEGATIVE = {
    "reported_after_30d":     -25,
    "no_financial_trail":     -20,  # updated: -20
    "no_beneficiary_account": -15,
    "no_digital_evidence":    -10,  # new
}


def _days_since(dt: datetime) -> float:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - dt).total_seconds() / 86400


def _level(score: int) -> str:
    if score >= 76: return "High"
    if score >= 51: return "Medium"
    if score >= 26: return "Low"
    return "Very Low"


def _urgency(days: float, score: int) -> str:
    if days <= 1 and score >= 60:  return "Immediate"
    if days <= 3 and score >= 40:  return "Urgent"
    if days <= 7:                   return "High"
    if days <= 30:                  return "Medium"
    return "Low"


def compute_recovery(case_id: str, db: Session) -> dict:
    case = db.query(CaseDB).filter(CaseDB.case_id == case_id).first()
    if not case:
        return {"error": "Case not found"}

    entities = db.query(CaseEntityDB).filter(CaseEntityDB.case_id == case_id).all()
    entity_types = {e.entity_type for e in entities}
    entity_values = [e.value for e in entities]

    days_old = _days_since(case.created_at)

    # ── Score calculation ─────────────────────────────────────────────────────
    score = 40  # neutral baseline
    reasoning: List[str] = []
    actions: List[str] = []

    # Positive factors
    if "upi" in entity_types:
        score += POSITIVE["upi_found"]
        reasoning.append("UPI ID identified — direct payment trail available")
        actions.append("Raise NPCI complaint via cybercrime.gov.in portal immediately")
        actions.append("Request UPI transaction logs from NPCI")
        actions.append("Freeze beneficiary UPI account via bank")

    if "bank" in entity_types:
        score += POSITIVE["bank_found"]
        reasoning.append("Bank account number identified — beneficiary traceable")
        actions.append("Send bank freeze request to beneficiary bank under Section 102 CrPC")
        actions.append("Obtain KYC details of account holder")

    if "ifsc" in entity_types:
        score += POSITIVE["ifsc_found"]
        reasoning.append("IFSC code identified — bank branch pinpointed")

    if "phone" in entity_types:
        score += POSITIVE["phone_found"]
        reasoning.append("Phone number identified — subscriber details obtainable")
        actions.append("Request subscriber details from telecom operator")
        actions.append("Preserve CDR/IPDR records (valid for 90 days)")

    if "email" in entity_types:
        score += POSITIVE["email_found"]
        reasoning.append("Email address identified — registration trail possible")
        actions.append("Request email account registration details from provider")

    if "telegram" in entity_types:
        reasoning.append("Telegram handle identified — communication records may be preserved")
        actions.append("Issue Telegram account preservation request via legal process")

    if len(entity_types) >= 3:
        score += POSITIVE["multiple_entities"]
        reasoning.append(f"Multiple entity types found ({len(entity_types)}) — strong evidence trail")

    # Check cross-case matches
    from app.database.models import CaseEntityDB as CE
    cross_matches = 0
    for ent in entities:
        if ent.entity_type in {"phone", "upi", "bank", "email"}:
            count = db.query(CE).filter(
                CE.value == ent.value,
                CE.entity_type == ent.entity_type,
                CE.case_id != case_id,
            ).count()
            cross_matches += count

    if cross_matches > 0:
        score += POSITIVE["cross_case_matches"]
        reasoning.append(f"Cross-case matches found — organized fraud pattern suspected")
        actions.append("Escalate to organized fraud investigation unit")
        actions.append("Cross-reference with NCRP and I4C databases")
        actions.append("Consider merging with related investigations")

    # Check OCR / transaction evidence uploaded
    from app.database.models import OCRResultDB, EvidenceDB
    evidence_rows = db.query(EvidenceDB).filter(EvidenceDB.case_id == case_id).all()
    ocr_results = []
    for ev in evidence_rows:
        ocr = db.query(OCRResultDB).filter(
            OCRResultDB.evidence_id == ev.evidence_id,
            OCRResultDB.status == "completed"
        ).first()
        if ocr:
            ocr_results.append(ocr)

    has_digital_evidence = len(evidence_rows) > 0
    has_ocr_evidence = len(ocr_results) > 0

    if has_ocr_evidence:
        score += POSITIVE["transaction_evidence"]
        reasoning.append(f"Transaction evidence uploaded and analysed ({len(ocr_results)} file(s) processed)")

    if not has_digital_evidence:
        score += NEGATIVE["no_digital_evidence"]
        reasoning.append("No digital evidence uploaded — Insufficient evidence to recommend document-based actions")

    # Time-based factors
    if days_old <= 1:
        score += POSITIVE["reported_within_24h"]
        reasoning.append("Reported within 24 hours — immediate freeze highly possible")
    elif days_old <= 3:
        score += POSITIVE["reported_within_72h"]
        reasoning.append("Reported within 72 hours — freeze still actionable")
    elif days_old >= 30:
        score += NEGATIVE["reported_after_30d"]
        reasoning.append("Reported after 30 days — funds likely already layered/withdrawn")

    # Negative factors
    has_financial_trail = bool({"upi", "bank", "ifsc"} & entity_types)
    if not has_financial_trail:
        score += NEGATIVE["no_financial_trail"]
        reasoning.append("No financial trail identified — Insufficient evidence to initiate account freeze")

    has_beneficiary = bool({"upi", "bank"} & entity_types)
    if not has_beneficiary:
        score += NEGATIVE["no_beneficiary_account"]
        reasoning.append("No beneficiary account identified — cannot initiate freeze")

    # Clamp score
    score = max(0, min(100, score))

    # Standard actions always present
    if "Call cybercrime helpline 1930 immediately" not in actions:
        actions.insert(0, "Call cybercrime helpline 1930 immediately")
    actions.append("File complaint on cybercrime.gov.in")
    actions.append("Preserve all digital evidence — screenshots, chat exports, call logs")

    # Deduplicate
    actions = list(dict.fromkeys(actions))

    return {
        "case_id":               case_id,
        "case_number":           case.case_number or case_id[:8],
        "recovery_probability":  score,
        "recovery_level":        _level(score),
        "urgency":               _urgency(days_old, score),
        "days_since_reported":   round(days_old, 1),
        "entity_count":          len(entities),
        "entity_types_found":    sorted(entity_types),
        "cross_case_matches":    cross_matches,
        "reasoning":             reasoning,
        "recommended_actions":   actions,
    }
