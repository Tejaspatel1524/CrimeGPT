from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
from app.models.case import Priority, CaseStatus


# ── Shared validators ─────────────────────────────────────────────────────────

def _require_non_empty(v: str, field: str) -> str:
    if not v or not str(v).strip():
        raise ValueError(f"{field} is required and cannot be empty.")
    return str(v).strip()


def _indian_phone(v: str) -> str:
    import re
    cleaned = re.sub(r"[\s\-\(\)]", "", str(v))
    # Normalise: strip country code variants
    if cleaned.startswith("+91"):
        cleaned = cleaned[3:]
    elif cleaned.startswith("91") and len(cleaned) == 12:
        cleaned = cleaned[2:]
    # Strip a single leading 0 only if result is 10 digits (trunk prefix)
    if cleaned.startswith("0") and len(cleaned) == 11:
        cleaned = cleaned[1:]
    if not re.match(r"^[6-9]\d{9}$", cleaned):
        raise ValueError(
            "Enter a valid 10-digit Indian mobile number "
            "(e.g. 9876543210 or +919876543210)."
        )
    return cleaned


# ── Create ────────────────────────────────────────────────────────────────────

class CaseCreate(BaseModel):
    title: str = Field(..., min_length=1)
    fraud_type: str = Field(..., min_length=1)
    victim_name: str = Field(..., min_length=1)
    victim_phone: str = Field(..., min_length=10)
    victim_email: EmailStr
    amount_lost: float = Field(..., gt=0)
    priority: Priority
    status: CaseStatus = CaseStatus.open
    complaint_text: str = Field(..., min_length=10)

    @field_validator("victim_name", "fraud_type", "complaint_text", mode="before")
    @classmethod
    def strip_and_require(cls, v):
        if not v or not str(v).strip():
            raise ValueError("This field is required.")
        return str(v).strip()

    @field_validator("victim_phone", mode="before")
    @classmethod
    def validate_phone(cls, v):
        return _indian_phone(str(v) if v else "")

    @field_validator("victim_email", mode="before")
    @classmethod
    def require_email(cls, v):
        if not v or str(v).strip() == "":
            raise ValueError("Victim email is required.")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "title": "UPI Fraud - ₹50,000",
                "fraud_type": "UPI Fraud",
                "victim_name": "Rahul Sharma",
                "victim_phone": "+919876543210",
                "victim_email": "rahul@example.com",
                "amount_lost": 50000.0,
                "priority": "High",
                "status": "Open",
                "complaint_text": "Victim was tricked into sending money via UPI.",
            }
        }
    }


# ── Update (all fields optional, but non-empty if provided) ──────────────────

class CaseUpdate(BaseModel):
    title: Optional[str] = None
    fraud_type: Optional[str] = None
    victim_name: Optional[str] = None
    victim_phone: Optional[str] = None
    victim_email: Optional[EmailStr] = None
    amount_lost: Optional[float] = Field(default=None, gt=0)
    priority: Optional[Priority] = None
    status: Optional[CaseStatus] = None
    complaint_text: Optional[str] = None
    owner_id: Optional[str] = None  # Admin can reassign investigator

    @field_validator("victim_name", "fraud_type", "complaint_text", "title", mode="before")
    @classmethod
    def strip_if_provided(cls, v):
        if v is not None and str(v).strip() == "":
            raise ValueError("Field cannot be set to an empty string.")
        return str(v).strip() if v is not None else v

    @field_validator("victim_phone", mode="before")
    @classmethod
    def validate_phone_if_provided(cls, v):
        if v is None or v == "":
            return v
        return _indian_phone(str(v))

    @field_validator("victim_email", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        if v == "" or v is None:
            return None
        return v


# ── Response ──────────────────────────────────────────────────────────────────

class OwnerInfo(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    department: Optional[str] = None


class CaseResponse(BaseModel):
    case_id: str
    case_number: str
    title: str
    fraud_type: str
    victim_name: str
    victim_phone: str
    victim_email: Optional[str] = None
    amount_lost: float
    priority: Priority
    status: CaseStatus
    complaint_text: str
    archived: int = 0
    owner: Optional[OwnerInfo] = None
    created_at: datetime
