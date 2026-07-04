from fastapi import APIRouter
from app.schemas.entity import EntityRequest, EntityResponse
from app.services.entity_service import extract_entities

router = APIRouter(tags=["Entity Extraction"])


@router.post(
    "/extract-entities",
    response_model=EntityResponse,
    summary="Extract cybercrime entities from investigation text",
)
def extract(request: EntityRequest):
    return extract_entities(request.text)
