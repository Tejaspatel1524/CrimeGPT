from enum import Enum


class Priority(str, Enum):
    low = "Low"
    medium = "Medium"
    high = "High"
    critical = "Critical"


class CaseStatus(str, Enum):
    open = "Open"
    under_investigation = "Under Investigation"
    evidence_collection = "Evidence Collection"
    pending_review = "Pending Review"
    escalated = "Escalated"
    closed = "Closed"
