from pydantic import BaseModel
from typing import List
from app.models.fraud import RiskLevel


class FraudRequest(BaseModel):
    text: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "text": "Urgent! Send money ₹5,000 to quickcash@ybl immediately. "
                        "Share your OTP to verify."
            }
        }
    }


class FraudResponse(BaseModel):
    risk_score: int
    risk_level: RiskLevel
    reasons: List[str]
