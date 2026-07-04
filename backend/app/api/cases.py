from fastapi import APIRouter, status, Depends
from typing import List
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import CaseEntityDB, CaseDB, CaseNoteDB, CaseTimelineEventDB
from app.schemas.case import CaseCreate, CaseUpdate, CaseResponse
from app.schemas.entity import (
    CaseEntitiesResponse, CaseEntityItem,
    EntityGraphResponse, GraphNode, GraphEdge,
    LinkedCasesResponse, LinkedCaseMatch,
)
from app.schemas.note import NoteCreate, NoteResponse, NotesListResponse
from app.schemas.user import UserPublic
from app.services.case_service import create_case, list_cases, list_archived_cases, get_case, update_case, delete_case, archive_case, unarchive_case
from app.services.auth_service import get_current_user
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/cases", tags=["Cases"])

# ── CRUD ──────────────────────────────────────────────────────────────────────

@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED,
             summary="Create a new cybercrime case")
def create(
    payload: CaseCreate, 
    db: Session = Depends(get_db),
    current_user: UserPublic = Depends(get_current_user)
):
    return create_case(payload, db, current_user.id)


@router.get("", response_model=List[CaseResponse], summary="List all active cases")
def list_all(archived: bool = False, db: Session = Depends(get_db)):
    """List cases. Use ?archived=true to get archived cases."""
    if archived:
        return list_archived_cases(db)
    return list_cases(db)


@router.get("/{case_id}", response_model=CaseResponse, summary="Get a case by ID")
def get_one(case_id: str, db: Session = Depends(get_db)):
    return get_case(case_id, db)


@router.put("/{case_id}", response_model=CaseResponse, summary="Update a case")
def update(case_id: str, payload: CaseUpdate, db: Session = Depends(get_db)):
    return update_case(case_id, payload, db)


@router.delete("/{case_id}", status_code=status.HTTP_200_OK, summary="Archive a case (soft delete)")
def delete(case_id: str, db: Session = Depends(get_db)):
    """Archive a case instead of permanently deleting it."""
    return delete_case(case_id, db)


@router.post("/{case_id}/archive", status_code=status.HTTP_200_OK, summary="Archive a case")
def archive(case_id: str, db: Session = Depends(get_db)):
    """Archive a case - removes from active list but keeps all data."""
    return archive_case(case_id, db)


@router.post("/{case_id}/unarchive", status_code=status.HTTP_200_OK, summary="Unarchive a case")
def unarchive(case_id: str, db: Session = Depends(get_db)):
    """Restore an archived case to active cases."""
    return unarchive_case(case_id, db)


# ── Entities ──────────────────────────────────────────────────────────────────

@router.get("/{case_id}/entities", response_model=CaseEntitiesResponse,
            summary="Get all extracted entities for a case")
def get_entities(case_id: str, db: Session = Depends(get_db)):
    get_case(case_id, db)
    rows = db.query(CaseEntityDB).filter(CaseEntityDB.case_id == case_id).all()
    items = [CaseEntityItem(id=r.id, entity_type=r.entity_type, value=r.value) for r in rows]
    return CaseEntitiesResponse(case_id=case_id, total=len(items), entities=items)


# ── Cross-case intelligence ───────────────────────────────────────────────────

@router.get("/{case_id}/linked-cases", response_model=LinkedCasesResponse,
            summary="Find other cases sharing entities with this case")
def get_linked_cases(case_id: str, db: Session = Depends(get_db)):
    get_case(case_id, db)

    # Only these entity types are meaningful for cross-case linkage
    LINK_TYPES = {"phone", "upi", "email", "telegram", "bank"}

    my_entities = (
        db.query(CaseEntityDB)
        .filter(CaseEntityDB.case_id == case_id,
                CaseEntityDB.entity_type.in_(LINK_TYPES))
        .all()
    )

    matches: List[LinkedCaseMatch] = []
    seen_pairs: set = set()   # (value, other_case_id) — avoid duplicates

    for ent in my_entities:
        # Find same value+type in other cases
        others = (
            db.query(CaseEntityDB, CaseDB)
            .join(CaseDB, CaseEntityDB.case_id == CaseDB.case_id)
            .filter(
                CaseEntityDB.value == ent.value,
                CaseEntityDB.entity_type == ent.entity_type,
                CaseEntityDB.case_id != case_id,
            )
            .all()
        )
        for other_ent, other_case in others:
            pair = (ent.value, other_case.case_id)
            if pair in seen_pairs:
                continue
            seen_pairs.add(pair)
            matches.append(LinkedCaseMatch(
                shared_value=ent.value,
                entity_type=ent.entity_type,
                related_case_id=other_case.case_id,
                related_case_number=other_case.case_number or other_case.case_id[:8],
                related_case_title=other_case.title,
                related_case_status=other_case.status.value,
                related_case_priority=other_case.priority.value,
            ))

    linked_case_ids = {m.related_case_id for m in matches}
    n = len(linked_case_ids)
    if n == 0:
        risk_badge = "Low"
    elif n <= 2:
        risk_badge = "Medium"
    elif n <= 5:
        risk_badge = "High"
    else:
        risk_badge = "Critical"

    return LinkedCasesResponse(
        case_id=case_id,
        total_linked_cases=n,
        risk_badge=risk_badge,
        matches=matches,
    )


# ── Graph ─────────────────────────────────────────────────────────────────────

@router.get("/{case_id}/graph", response_model=EntityGraphResponse,
            summary="Get entity relationship graph data for Network Analysis tab")
def get_entity_graph(case_id: str, db: Session = Depends(get_db)):
    case_resp = get_case(case_id, db)
    case_row  = db.query(CaseDB).filter(CaseDB.case_id == case_id).first()
    entities  = db.query(CaseEntityDB).filter(CaseEntityDB.case_id == case_id).all()

    _confidence = {
        "phone": 90, "upi": 95, "email": 88,
        "url": 82, "telegram": 85, "instagram": 80,
        "bank": 78, "ifsc": 92, "amount": 70,
    }

    nodes: list = []
    edges: list = []

    case_node_id = f"case-{case_id}"
    nodes.append(GraphNode(
        id=case_node_id,
        label=case_row.case_number or case_id[:8],
        entity_type="case",
        value=case_resp.title,
        confidence=100,
        related_case_count=1,
    ))

    victim_id = f"victim-{case_id}"
    nodes.append(GraphNode(
        id=victim_id,
        label=case_row.victim_name,
        entity_type="victim",
        value=case_row.victim_name,
        confidence=100,
        related_case_count=1,
    ))
    edges.append(GraphEdge(
        id=f"e-victim-{case_id}",
        source=case_node_id,
        target=victim_id,
        label="victim",
    ))

    for ent in entities:
        node_id = f"{ent.entity_type}-{ent.id}"
        related = db.query(CaseEntityDB).filter(
            CaseEntityDB.value == ent.value,
            CaseEntityDB.entity_type == ent.entity_type,
        ).count()
        nodes.append(GraphNode(
            id=node_id,
            label=ent.value[:30] + ("…" if len(ent.value) > 30 else ""),
            entity_type=ent.entity_type,
            value=ent.value,
            confidence=_confidence.get(ent.entity_type, 75),
            related_case_count=related,
        ))
        edges.append(GraphEdge(
            id=f"e-{ent.id}",
            source=case_node_id,
            target=node_id,
            label=ent.entity_type,
        ))

    return EntityGraphResponse(
        case_id=case_id,
        case_number=case_row.case_number or "",
        nodes=nodes,
        edges=edges,
    )


# ── Officer Notes ─────────────────────────────────────────────────────────────

@router.post("/{case_id}/notes", response_model=NoteResponse,
             status_code=status.HTTP_201_CREATED,
             summary="Add an officer note to a case")
def add_note(case_id: str, payload: NoteCreate, db: Session = Depends(get_db)):
    get_case(case_id, db)
    note = CaseNoteDB(
        id=str(uuid.uuid4()),
        case_id=case_id,
        officer_name=payload.officer_name,
        note_type=payload.note_type,
        note_text=payload.note_text,
        created_at=datetime.now(timezone.utc),
    )
    db.add(note)

    # ── Auto-create timeline event ─────────────────────────────────────────
    event_type_map = {
        "Victim Contact":   "contact",
        "Bank Action":      "action",
        "Legal Request":    "action",
        "Evidence Review":  "evidence",
        "Suspect Tracking": "escalation",
        "General Note":     "action",
        # legacy
        "General":  "action",
        "Action":   "action",
        "Evidence": "evidence",
        "Legal":    "action",
        "Urgent":   "escalation",
    }
    db.add(CaseTimelineEventDB(
        id=str(uuid.uuid4()),
        case_id=case_id,
        event_type=event_type_map.get(payload.note_type, "action"),
        title=f"Officer Note Added — {payload.note_type}",
        description=payload.note_text,           # full note text stored here
        created_by=payload.officer_name,
        created_at=datetime.now(timezone.utc),
    ))

    db.commit()
    db.refresh(note)
    return NoteResponse(
        id=note.id, case_id=note.case_id,
        officer_name=note.officer_name, note_type=note.note_type,
        note_text=note.note_text, created_at=note.created_at,
    )


@router.get("/{case_id}/notes", response_model=NotesListResponse,
            summary="Get all officer notes for a case")
def get_notes(case_id: str, db: Session = Depends(get_db)):
    get_case(case_id, db)
    rows = (db.query(CaseNoteDB)
            .filter(CaseNoteDB.case_id == case_id)
            .order_by(CaseNoteDB.created_at.desc())
            .all())
    notes = [NoteResponse(
        id=r.id, case_id=r.case_id,
        officer_name=r.officer_name, note_type=r.note_type,
        note_text=r.note_text, created_at=r.created_at,
    ) for r in rows]
    return NotesListResponse(case_id=case_id, total=len(notes), notes=notes)


@router.get("/{case_id}/timeline", summary="Get persisted timeline events for a case")
def get_timeline(case_id: str, db: Session = Depends(get_db)):
    get_case(case_id, db)
    rows = (db.query(CaseTimelineEventDB)
            .filter(CaseTimelineEventDB.case_id == case_id)
            .order_by(CaseTimelineEventDB.created_at.desc())
            .all())
    return [
        {
            "id":          r.id,
            "event_type":  r.event_type,
            "title":       r.title,
            "description": r.description,
            "created_by":  r.created_by,
            "created_at":  r.created_at.isoformat(),
        }
        for r in rows
    ]


# ── Recovery Intelligence ─────────────────────────────────────────────────────

@router.get("/{case_id}/recovery", summary="Get recovery intelligence for a case")
def get_recovery(case_id: str, db: Session = Depends(get_db)):
    from app.services.recovery_service import compute_recovery
    return compute_recovery(case_id, db)
