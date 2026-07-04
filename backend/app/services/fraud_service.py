import re
from app.schemas.fraud import FraudResponse
from app.models.fraud import score_to_level

# ---------------------------------------------------------------------------
# Scoring rules: (label, points, pattern)
# ---------------------------------------------------------------------------

RULES = [
    (
        "Money request keywords detected (send money / transfer / payment)",
        30,
        re.compile(
            r'\b(send\s+money|transfer|payment|pay|deposit|fund\s+transfer|bank\s+transfer)\b',
            re.IGNORECASE,
        ),
    ),
    (
        "Urgency keywords detected (urgent / immediately / ASAP)",
        20,
        re.compile(
            r'\b(urgent|immediately|right\s+now|asap|today|within\s+1\s+hour)\b',
            re.IGNORECASE,
        ),
    ),
    (
        "UPI ID detected",
        20,
        re.compile(r'[a-zA-Z0-9._-]+@[a-zA-Z]+'),
    ),
    (
        "Phone number detected",
        10,
        re.compile(r'(?:\+91)?[6-9]\d{9}'),
    ),
    (
        "Amount detected",
        20,
        re.compile(r'(?:₹|Rs\.?)\s?\d[\d,]*'),
    ),
    (
        "OTP / verification code keywords detected",
        25,
        re.compile(
            r'\b(otp|verification\s+code|security\s+code)\b',
            re.IGNORECASE,
        ),
    ),
]


def analyze_fraud(text: str) -> FraudResponse:
    t = text.strip()
    score = 0
    reasons = []

    for label, points, pattern in RULES:
        if pattern.search(t):
            score += points
            reasons.append(label)

    # Cap at 100 and deduplicate (already unique by design, but be safe)
    score = min(score, 100)
    reasons = list(dict.fromkeys(reasons))

    return FraudResponse(
        risk_score=score,
        risk_level=score_to_level(score),
        reasons=reasons,
    )
