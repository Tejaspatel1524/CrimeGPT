import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import (
    Column, String, Float, Integer, Text,
    DateTime, ForeignKey, Enum as SAEnum,
)
from sqlalchemy.orm import relationship

from app.database.database import Base
from app.models.user import UserRole
from app.models.case import Priority, CaseStatus


def _now():
    return datetime.now(timezone.utc)


def _uuid():
    return str(uuid.uuid4())


# ── Account Status ───────────────────────────────────────────────────────────
class AccountStatus(str, PyEnum):
    pending = "pending"      # Awaiting admin approval
    active = "active"        # Approved and active
    suspended = "suspended"  # Temporarily suspended
    rejected = "rejected"    # Registration rejected


# ── User ─────────────────────────────────────────────────────────────────────
class UserDB(Base):
    __tablename__ = "users"

    id              = Column(String, primary_key=True, default=_uuid)
    full_name       = Column(String, nullable=False)
    email           = Column(String, unique=True, nullable=False, index=True)
    username        = Column(String, unique=True, nullable=True, index=True)
    password_hash   = Column(String, nullable=False)
    role            = Column(SAEnum(UserRole), nullable=False, default=UserRole.investigator)
    department      = Column(String, nullable=True)
    phone           = Column(String, nullable=True)
    profile_photo   = Column(String, nullable=True)
    is_active       = Column(Integer, nullable=False, default=1)  # 1=active, 0=inactive
    account_status  = Column(String, nullable=False, default="active")  # pending/active/suspended/rejected
    last_login      = Column(DateTime(timezone=True), nullable=True)
    failed_login_attempts = Column(Integer, nullable=False, default=0)
    created_at      = Column(DateTime(timezone=True), default=_now)
    updated_at      = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    cases = relationship("CaseDB", back_populates="owner", cascade="all, delete-orphan")


# ── Case ─────────────────────────────────────────────────────────────────────
class CaseDB(Base):
    __tablename__ = "cases"

    case_id        = Column(String, primary_key=True, default=_uuid)
    case_number    = Column(String, unique=True, nullable=True, index=True)
    title          = Column(String, nullable=False)
    fraud_type     = Column(String, nullable=False)
    victim_name    = Column(String, nullable=False)
    victim_phone   = Column(String, nullable=False)
    victim_email   = Column(String, nullable=True)
    amount_lost    = Column(Float, nullable=False)
    priority       = Column(SAEnum(Priority), nullable=False)
    status         = Column(SAEnum(CaseStatus), nullable=False, default=CaseStatus.open)
    complaint_text = Column(Text, nullable=False)
    archived       = Column(Integer, nullable=False, default=0, index=True)  # 0=active, 1=archived
    created_at     = Column(DateTime(timezone=True), default=_now)

    owner_id   = Column(String, ForeignKey("users.id"), nullable=True)
    owner      = relationship("UserDB", back_populates="cases")
    evidence   = relationship("EvidenceDB", back_populates="case", cascade="all, delete-orphan")
    fraud_reports = relationship("FraudReportDB", back_populates="case", cascade="all, delete-orphan")
    entities   = relationship("CaseEntityDB", back_populates="case", cascade="all, delete-orphan")
    notes      = relationship("CaseNoteDB", back_populates="case", cascade="all, delete-orphan")
    timeline_events = relationship("CaseTimelineEventDB", back_populates="case", cascade="all, delete-orphan")
    chat_messages   = relationship("ChatMessageDB", back_populates="case", cascade="all, delete-orphan")
    investigation_briefs = relationship("InvestigationBriefDB", back_populates="case", cascade="all, delete-orphan")


# ── Evidence ─────────────────────────────────────────────────────────────────
class EvidenceDB(Base):
    __tablename__ = "evidence"

    evidence_id = Column(String, primary_key=True, default=_uuid)
    case_id     = Column(String, ForeignKey("cases.case_id"), nullable=False)
    filename    = Column(String, nullable=False)
    file_type   = Column(String, nullable=False)
    file_size   = Column(Integer, nullable=False)
    file_path   = Column(String, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), default=_now)

    case       = relationship("CaseDB", back_populates="evidence")
    ocr_result = relationship("OCRResultDB", back_populates="evidence", uselist=False,
                              cascade="all, delete-orphan")


# ── OCR Result ────────────────────────────────────────────────────────────────
class OCRResultDB(Base):
    __tablename__ = "ocr_results"

    id                   = Column(String, primary_key=True, default=_uuid)
    evidence_id          = Column(String, ForeignKey("evidence.evidence_id"), unique=True, nullable=False)
    status               = Column(String, nullable=False, default="pending")
    text                 = Column(Text, nullable=False, default="")
    characters_extracted = Column(Integer, nullable=False, default=0)
    entities_json        = Column(Text, nullable=True)
    entity_count         = Column(Integer, nullable=False, default=0)
    error_message        = Column(Text, nullable=True)
    created_at           = Column(DateTime(timezone=True), default=_now)

    evidence = relationship("EvidenceDB", back_populates="ocr_result")


# ── Fraud Report ──────────────────────────────────────────────────────────────
class FraudReportDB(Base):
    __tablename__ = "fraud_reports"

    id          = Column(String, primary_key=True, default=_uuid)
    case_id     = Column(String, ForeignKey("cases.case_id"), nullable=False)
    risk_score  = Column(Integer, nullable=False)
    risk_level  = Column(String, nullable=False)
    reasons     = Column(Text, nullable=False, default="")
    executive_summary      = Column(Text, nullable=True)
    fraud_pattern          = Column(Text, nullable=True)
    extracted_entities     = Column(Text, nullable=True)
    risk_assessment        = Column(Text, nullable=True)
    red_flags              = Column(Text, nullable=True)
    legal_sections         = Column(Text, nullable=True)
    investigation_recs     = Column(Text, nullable=True)
    evidence_checklist     = Column(Text, nullable=True)
    recovery_assessment    = Column(Text, nullable=True)
    next_action_plan       = Column(Text, nullable=True)
    created_at  = Column(DateTime(timezone=True), default=_now)

    case = relationship("CaseDB", back_populates="fraud_reports")


# ── Case Entities ─────────────────────────────────────────────────────────────
class CaseEntityDB(Base):
    __tablename__ = "case_entities"

    id           = Column(String, primary_key=True, default=_uuid)
    case_id      = Column(String, ForeignKey("cases.case_id"), nullable=False, index=True)
    entity_type  = Column(String, nullable=False)
    value        = Column(String, nullable=False)
    created_at   = Column(DateTime(timezone=True), default=_now)

    case = relationship("CaseDB", back_populates="entities")


# ── Officer Notes ─────────────────────────────────────────────────────────────
class CaseNoteDB(Base):
    __tablename__ = "case_notes"

    id           = Column(String, primary_key=True, default=_uuid)
    case_id      = Column(String, ForeignKey("cases.case_id"), nullable=False, index=True)
    officer_name = Column(String, nullable=False)
    note_type    = Column(String, nullable=False, default="General")
    note_text    = Column(Text, nullable=False)
    created_at   = Column(DateTime(timezone=True), default=_now)

    case = relationship("CaseDB", back_populates="notes")


# ── Case Timeline Events ──────────────────────────────────────────────────────
class CaseTimelineEventDB(Base):
    __tablename__ = "case_timeline_events"

    id          = Column(String, primary_key=True, default=_uuid)
    case_id     = Column(String, ForeignKey("cases.case_id"), nullable=False, index=True)
    event_type  = Column(String, nullable=False, default="action")
    title       = Column(String, nullable=False)
    description = Column(Text, nullable=False, default="")
    created_by  = Column(String, nullable=True)
    created_at  = Column(DateTime(timezone=True), default=_now)

    case = relationship("CaseDB", back_populates="timeline_events")


# ── Chat History ──────────────────────────────────────────────────────────────
class ChatMessageDB(Base):
    __tablename__ = "chat_messages"

    id          = Column(String, primary_key=True, default=_uuid)
    case_id     = Column(String, ForeignKey("cases.case_id"), nullable=False, index=True)
    role        = Column(String, nullable=False)
    content     = Column(Text, nullable=False)
    created_at  = Column(DateTime(timezone=True), default=_now)

    case = relationship("CaseDB", back_populates="chat_messages")


# ── Investigation Brief ───────────────────────────────────────────────────────
class InvestigationBriefDB(Base):
    __tablename__ = "investigation_briefs"

    id          = Column(String, primary_key=True, default=_uuid)
    case_id     = Column(String, ForeignKey("cases.case_id"), nullable=False, index=True)
    brief_json  = Column(Text, nullable=False)   # full JSON from Gemini
    model_used  = Column(String, nullable=True)
    generated_at = Column(DateTime(timezone=True), default=_now)

    case = relationship("CaseDB", back_populates="investigation_briefs")


# ── Audit Logs ────────────────────────────────────────────────────────────────
class AuditLogDB(Base):
    __tablename__ = "audit_logs"

    id          = Column(String, primary_key=True, default=_uuid)
    user_id     = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    action      = Column(String, nullable=False)
    details     = Column(Text, nullable=True)
    activity_type = Column(String, nullable=False, default="action")  # login, case, report, evidence, note, profile, etc.
    resource_id = Column(String, nullable=True)  # case_id, evidence_id, etc.
    ip_address  = Column(String, nullable=True)
    user_agent  = Column(String, nullable=True)
    created_at  = Column(DateTime(timezone=True), default=_now, index=True)

    user = relationship("UserDB")


# ── User Preferences ──────────────────────────────────────────────────────────
class UserPreferencesDB(Base):
    __tablename__ = "user_preferences"

    id          = Column(String, primary_key=True, default=_uuid)
    user_id     = Column(String, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    theme       = Column(String, nullable=False, default="cyber-navy")
    language    = Column(String, nullable=False, default="english")
    timezone    = Column(String, nullable=False, default="auto")
    date_format = Column(String, nullable=False, default="dd/mm/yyyy")
    time_format = Column(String, nullable=False, default="24h")
    notifications_case_assignment = Column(Integer, nullable=False, default=1)
    notifications_crimegpt        = Column(Integer, nullable=False, default=1)
    notifications_evidence        = Column(Integer, nullable=False, default=1)
    notifications_report          = Column(Integer, nullable=False, default=1)
    notifications_cross_case      = Column(Integer, nullable=False, default=1)
    created_at  = Column(DateTime(timezone=True), default=_now)
    updated_at  = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    user = relationship("UserDB")
