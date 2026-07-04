from pydantic import BaseModel
from app.models.ocr import OCRStatus


class OCRResponse(BaseModel):
    evidence_id: str
    status: OCRStatus
    characters_extracted: int
    text: str


class OCRResultResponse(BaseModel):
    evidence_id: str
    status: OCRStatus
    text: str
