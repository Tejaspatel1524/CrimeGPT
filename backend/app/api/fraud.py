from fastapi import APIRouter
from app.schemas.fraud import FraudRequest, FraudResponse
from app.services.fraud_service import analyze_fraud

router = APIRouter(prefix="/fraud", tags=["Fraud Intelligence"])


@router.post(
    "/analyze",
    response_model=FraudResponse,
    summary="Analyze text for cybercrime fraud risk",
)
def fraud_analyze(request: FraudRequest):
    return analyze_fraud(request.text)
