from pydantic import BaseModel
from typing import List, Optional, Dict
from app.models.fraud import RiskLevel


class ReportRequest(BaseModel):
    text: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "text": "Victim received a WhatsApp message asking to transfer ₹10,000 "
                        "to xyz@okaxis urgently. Contact: 9876543210."
            }
        }
    }


# ── Section schemas ────────────────────────────────────────────────────────────

class ExecutiveSummary(BaseModel):
    case_overview: str
    total_loss_amount: str
    fraud_category: str
    risk_level: str


class FraudPattern(BaseModel):
    scam_type: str
    attack_methodology: str
    victim_manipulation: str
    money_movement: str


class ExtractedEntities(BaseModel):
    persons: List[str] = []
    phone_numbers: List[str] = []
    emails: List[str] = []
    upi_ids: List[str] = []
    bank_accounts: List[str] = []
    ifsc_codes: List[str] = []
    websites: List[str] = []
    social_media_handles: List[str] = []
    telegram_usernames: List[str] = []


class RiskAssessment(BaseModel):
    risk_score: int
    confidence_score: int
    severity_level: str
    reasoning: str


class LegalSections(BaseModel):
    bns: List[str] = []
    it_act: List[str] = []
    other: List[str] = []


class RecoveryAssessment(BaseModel):
    possibility: str          # High / Medium / Low
    explanation: str


class NextActionPlan(BaseModel):
    immediate: List[str] = []
    short_term: List[str] = []
    long_term: List[str] = []


# ── Full report response ───────────────────────────────────────────────────────

class FullReportResponse(BaseModel):
    report_id: Optional[str] = None
    case_id: Optional[str] = None
    case_number: Optional[str] = None

    executive_summary:      ExecutiveSummary
    fraud_pattern:          FraudPattern
    extracted_entities:     ExtractedEntities
    risk_assessment:        RiskAssessment
    red_flags:              List[str]
    legal_sections:         LegalSections
    investigation_recs:     List[str]
    evidence_checklist:     List[str]
    recovery_assessment:    RecoveryAssessment
    next_action_plan:       NextActionPlan


# ── Legacy slim response (kept for backward compat) ───────────────────────────

class ReportResponse(BaseModel):
    summary: str
    risk_score: int
    risk_level: RiskLevel
    reasons: List[str]
    recommended_actions: List[str]
