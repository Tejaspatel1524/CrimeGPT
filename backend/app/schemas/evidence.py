from pydantic import BaseModel
from datetime import datetime


class EvidenceResponse(BaseModel):
    evidence_id: str
    case_id: str
    filename: str
    file_type: str
    file_size: int
    file_path: str
    uploaded_at: datetime
