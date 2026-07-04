from pydantic import BaseModel, Field
from typing import List
from datetime import datetime

NOTE_TYPES = ["General", "Action", "Evidence", "Legal", "Urgent"]


class NoteCreate(BaseModel):
    officer_name: str = Field(..., min_length=1)
    note_type: str = Field(default="General")
    note_text: str = Field(..., min_length=1)

    model_config = {
        "json_schema_extra": {
            "example": {
                "officer_name": "Inspector Rajesh Kumar",
                "note_type": "Action",
                "note_text": "Freeze order issued for UPI ID quickcash@ybl via Section 102 CrPC.",
            }
        }
    }


class NoteResponse(BaseModel):
    id: str
    case_id: str
    officer_name: str
    note_type: str
    note_text: str
    created_at: datetime


class NotesListResponse(BaseModel):
    case_id: str
    total: int
    notes: List[NoteResponse]
