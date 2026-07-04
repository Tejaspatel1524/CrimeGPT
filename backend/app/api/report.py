import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import FraudReportDB, CaseDB
from app.schemas.report import ReportRequest, FullReportResponse
from app.services.report_service import build_full_report

router = APIRouter(prefix="/report", tags=["Investigation Report"])


def _report_to_dict(r: FullReportResponse) -> dict:
    return r.model_dump()


def _save_report(case, report: FullReportResponse, db: Session) -> FraudReportDB:
    """Upsert full report into fraud_reports row."""
    existing = db.query(FraudReportDB).filter(
        FraudReportDB.case_id == case.case_id
    ).first()

    fields = dict(
        risk_score             = report.risk_assessment.risk_score,
        risk_level             = report.risk_assessment.severity_level,
        reasons                = json.dumps(report.risk_assessment.reasoning),
        executive_summary      = json.dumps(report.executive_summary.model_dump()),
        fraud_pattern          = json.dumps(report.fraud_pattern.model_dump()),
        extracted_entities     = json.dumps(report.extracted_entities.model_dump()),
        risk_assessment        = json.dumps(report.risk_assessment.model_dump()),
        red_flags              = json.dumps(report.red_flags),
        legal_sections         = json.dumps(report.legal_sections.model_dump()),
        investigation_recs     = json.dumps(report.investigation_recs),
        evidence_checklist     = json.dumps(report.evidence_checklist),
        recovery_assessment    = json.dumps(report.recovery_assessment.model_dump()),
        next_action_plan       = json.dumps(report.next_action_plan.model_dump()),
    )

    if existing:
        for k, v in fields.items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        row = FraudReportDB(case_id=case.case_id, **fields)
        db.add(row)
        db.commit()
        db.refresh(row)
        return row


# ── POST /report/generate  — stateless, no DB ─────────────────────────────────
@router.post(
    "/generate",
    response_model=FullReportResponse,
    summary="Generate full investigation report from text (stateless)",
)
def generate(request: ReportRequest):
    return build_full_report(request.text)


# ── POST /report/generate/{case_id}  — analyse case + persist ────────────────
@router.post(
    "/generate/{case_id}",
    response_model=FullReportResponse,
    summary="Generate full report for a case and save to database",
)
def generate_and_save(case_id: str, db: Session = Depends(get_db)):
    case = db.query(CaseDB).filter(CaseDB.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Case '{case_id}' not found.")

    report = build_full_report(
        text        = case.complaint_text,
        fraud_type  = case.fraud_type,
        victim_name = case.victim_name,
        amount_lost = case.amount_lost or 0.0,
        case_id     = case.case_id,
        case_number = case.case_number or "",
    )

    row = _save_report(case, report, db)

    report.report_id   = row.id
    report.case_id     = case.case_id
    report.case_number = case.case_number or ""
    return report


# ── GET /report/case/{case_id}  — fetch persisted report ─────────────────────
@router.get(
    "/case/{case_id}",
    response_model=FullReportResponse,
    summary="Retrieve the saved investigation report for a case",
)
def get_report_by_case(case_id: str, db: Session = Depends(get_db)):
    row = db.query(FraudReportDB).filter(FraudReportDB.case_id == case_id).first()
    case = db.query(CaseDB).filter(CaseDB.case_id == case_id).first()

    if not row or not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="No report found for this case. Run POST /report/generate/{case_id} first.")

    def _load(field, cls):
        raw = getattr(row, field)
        return cls(**json.loads(raw)) if raw else None

    from app.schemas.report import (
        ExecutiveSummary, FraudPattern, ExtractedEntities,
        RiskAssessment, LegalSections, RecoveryAssessment, NextActionPlan
    )

    return FullReportResponse(
        report_id          = row.id,
        case_id            = row.case_id,
        case_number        = case.case_number or "",
        executive_summary  = _load("executive_summary", ExecutiveSummary),
        fraud_pattern      = _load("fraud_pattern", FraudPattern),
        extracted_entities = _load("extracted_entities", ExtractedEntities),
        risk_assessment    = _load("risk_assessment", RiskAssessment),
        red_flags          = json.loads(row.red_flags) if row.red_flags else [],
        legal_sections     = _load("legal_sections", LegalSections),
        investigation_recs = json.loads(row.investigation_recs) if row.investigation_recs else [],
        evidence_checklist = json.loads(row.evidence_checklist) if row.evidence_checklist else [],
        recovery_assessment= _load("recovery_assessment", RecoveryAssessment),
        next_action_plan   = _load("next_action_plan", NextActionPlan),
    )
