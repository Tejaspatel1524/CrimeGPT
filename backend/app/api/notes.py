from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import CaseNoteDB

router = APIRouter(prefix="/notes", tags=["Officer Notes"])


@router.delete("/{note_id}", status_code=status.HTTP_200_OK,
               summary="Delete an officer note")
def delete_note(note_id: str, db: Session = Depends(get_db)):
    note = db.query(CaseNoteDB).filter(CaseNoteDB.id == note_id).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Note '{note_id}' not found.")
    db.delete(note)
    db.commit()
    return {"message": f"Note '{note_id}' deleted successfully."}
