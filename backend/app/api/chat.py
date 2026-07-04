from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
import uuid
from datetime import datetime, timezone

from app.database.database import get_db
from app.database.models import ChatMessageDB
from app.services.context_service import get_case_context
from app.services.ai_service import call_ai

router = APIRouter(prefix="/chat", tags=["CrimeGPT Chat"])


class ChatRequest(BaseModel):
    case_id: str
    question: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "case_id": "uuid-here",
                "question": "What should I investigate next?"
            }
        }
    }


@router.post("", summary="Ask CrimeGPT a question about a case")
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    # 1. Retrieve full case context
    context = get_case_context(payload.case_id, db)
    if "error" in context:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=context["error"])

    # 2. Load recent conversation history for this case
    history_rows = (
        db.query(ChatMessageDB)
        .filter(ChatMessageDB.case_id == payload.case_id)
        .order_by(ChatMessageDB.created_at.asc())
        .limit(20)
        .all()
    )
    history = [{"role": r.role, "content": r.content} for r in history_rows]

    # 3. Call AI
    answer = call_ai(context, payload.question, history)

    # 4. Persist user message + assistant reply
    now = datetime.now(timezone.utc)
    db.add(ChatMessageDB(
        id=str(uuid.uuid4()), case_id=payload.case_id,
        role="user", content=payload.question, created_at=now
    ))
    db.add(ChatMessageDB(
        id=str(uuid.uuid4()), case_id=payload.case_id,
        role="assistant", content=answer, created_at=now
    ))
    db.commit()

    return {
        "case_id":   payload.case_id,
        "question":  payload.question,
        "answer":    answer,
        "model":     __import__('os').getenv("AI_PROVIDER", "local"),
    }


@router.get("/{case_id}/history", summary="Get chat history for a case")
def get_history(case_id: str, db: Session = Depends(get_db)):
    rows = (
        db.query(ChatMessageDB)
        .filter(ChatMessageDB.case_id == case_id)
        .order_by(ChatMessageDB.created_at.asc())
        .all()
    )
    return [{"role": r.role, "content": r.content, "created_at": r.created_at.isoformat()}
            for r in rows]


@router.delete("/{case_id}/history", summary="Clear chat history for a case")
def clear_history(case_id: str, db: Session = Depends(get_db)):
    db.query(ChatMessageDB).filter(ChatMessageDB.case_id == case_id).delete()
    db.commit()
    return {"message": "Chat history cleared."}
