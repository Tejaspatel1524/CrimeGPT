from pydantic import BaseModel
from typing import List


class EntityRequest(BaseModel):
    text: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "text": "Victim sent ₹50,000 to quickcash@ybl. "
                        "Contact: +919876543210, support@quickcashloan.in. "
                        "Website: https://quickcashloan.in. "
                        "Telegram: @QuickCashSupport. "
                        "Instagram: instagram.com/quickcash_official"
            }
        }
    }


class EntityResponse(BaseModel):
    upi_ids: List[str]
    phone_numbers: List[str]
    emails: List[str]
    urls: List[str]
    amounts: List[str]
    telegram_handles: List[str] = []
    instagram_handles: List[str] = []


class CaseEntityItem(BaseModel):
    id: str
    entity_type: str
    value: str


class CaseEntitiesResponse(BaseModel):
    case_id: str
    total: int
    entities: List[CaseEntityItem]


# ── Graph response ────────────────────────────────────────────────────────────

class GraphNode(BaseModel):
    id: str
    label: str
    entity_type: str   # case | phone | upi | email | url | telegram | instagram | bank | ifsc | victim
    value: str
    confidence: int    # 0-100
    related_case_count: int = 1


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str


class EntityGraphResponse(BaseModel):
    case_id: str
    case_number: str
    nodes: List[GraphNode]
    edges: List[GraphEdge]


# ── Cross-case intelligence ───────────────────────────────────────────────────

class LinkedCaseMatch(BaseModel):
    shared_value: str
    entity_type: str
    related_case_id: str
    related_case_number: str
    related_case_title: str
    related_case_status: str
    related_case_priority: str


class LinkedCasesResponse(BaseModel):
    case_id: str
    total_linked_cases: int
    risk_badge: str          # Low / Medium / High / Critical
    matches: List[LinkedCaseMatch]
