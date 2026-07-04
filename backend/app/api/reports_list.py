"""
reports_list.py — GET /reports and GET /reports/{id} endpoints.

Returns a list or single report derived from FraudReportDB rows
joined to their parent CaseDB records.
"""

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import FraudReportDB, CaseDB

router = APIRouter(prefix="/reports", tags=["Reports"])


def _build_report_dict(rpt: FraudReportDB, case: CaseDB) -> dict:
    """Shared helper — build a rich report dict from DB rows."""
    risk = (rpt.risk_level or "").lower()
    if risk == "critical":
        doc_status = "Published"
    elif risk == "high":
        doc_status = "Approved"
    elif risk == "medium":
        doc_status = "In Review"
    else:
        doc_status = "Draft"

    # Safely parse JSON reasons list
    try:
        reasons = json.loads(rpt.reasons) if rpt.reasons else []
    except Exception:
        reasons = []

    return {
        "id":                  rpt.id,
        "title":               f"Fraud Analysis Report — {case.title}",
        "type":                "Investigation Summary",
        "status":              doc_status,
        "caseId":              rpt.case_id,
        "caseNumber":          case.case_number or rpt.case_id,
        "createdBy":           "System (AI Analysis)",
        "createdAt":           rpt.created_at.isoformat() if rpt.created_at else datetime.now(timezone.utc).isoformat(),
        "pageCount":           4,
        "riskScore":           rpt.risk_score,
        "riskLevel":           rpt.risk_level,
        "victimName":          case.victim_name,
        "victimPhone":         case.victim_phone,
        "victimEmail":         case.victim_email,
        "caseTitle":           case.title,
        "fraudType":           case.fraud_type,
        "amountLost":          case.amount_lost,
        "casePriority":        case.priority.value if hasattr(case.priority, "value") else case.priority,
        "caseStatus":          case.status.value if hasattr(case.status, "value") else case.status,
        "complaintText":       case.complaint_text,
        "reasons":             reasons,
        "recommendedActions": [
            "Freeze all identified bank accounts and UPI IDs via Section 102 CrPC.",
            "Issue CDR/IPDR preservation requests to Telecom operators.",
            "Submit legal process requests to Telegram and WhatsApp/Meta.",
            "Cross-reference all entities with NCRP and I4C databases.",
            "Coordinate with other jurisdictions for joint investigation.",
            "Refer case to Enforcement Directorate if PMLA threshold crossed.",
        ],
    }


# ── GET /reports  (list all) ──────────────────────────────────────────────────
@router.get("", summary="List all investigation reports")
def list_reports(db: Session = Depends(get_db)):
    rows = (
        db.query(FraudReportDB, CaseDB)
        .join(CaseDB, FraudReportDB.case_id == CaseDB.case_id)
        .order_by(FraudReportDB.created_at.desc())
        .all()
    )
    return [_build_report_dict(rpt, case) for rpt, case in rows]


# ── GET /reports/{report_id}  (single report) ─────────────────────────────────
@router.get("/{report_id}", summary="Get a single investigation report by ID")
def get_report(report_id: str, db: Session = Depends(get_db)):
    row = (
        db.query(FraudReportDB, CaseDB)
        .join(CaseDB, FraudReportDB.case_id == CaseDB.case_id)
        .filter(FraudReportDB.id == report_id)
        .first()
    )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report '{report_id}' not found.",
        )
    rpt, case = row
    return _build_report_dict(rpt, case)

