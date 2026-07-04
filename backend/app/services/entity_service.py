import re
import uuid
from datetime import datetime, timezone
from typing import List

from app.schemas.entity import EntityResponse

# ── Regex patterns ─────────────────────────────────────────────────────────────

UPI_RE = re.compile(r'\b([a-zA-Z0-9._-]+@[a-zA-Z]+)\b')
PHONE_RE = re.compile(r'(?:\+91)?[6-9]\d{9}')
EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}')
URL_RE = re.compile(r'https?://[^\s]+')
AMOUNT_RE = re.compile(r'(?:₹|Rs\.?)\s?\d[\d,]*')

# Telegram: @handle (5-32 chars, no dot allowed — distinguishes from emails/UPI)
TELEGRAM_RE = re.compile(r'(?<!\w)@([a-zA-Z][a-zA-Z0-9_]{4,31})(?!\w)')

# Instagram: instagram.com/handle  OR  ig: handle
INSTAGRAM_RE = re.compile(
    r'(?:(?:https?://)?(?:www\.)?instagram\.com/|ig:\s*)([a-zA-Z0-9._]{1,30})',
    re.IGNORECASE,
)


def _dedup(items: list) -> list:
    seen = set()
    result = []
    for item in items:
        key = item.lower().strip()
        if key and key not in seen:
            seen.add(key)
            result.append(item)
    return result


def extract_entities(text: str) -> EntityResponse:
    t = text.strip()

    # URLs first — remove from text to stop @ conflicts
    urls = _dedup([u.rstrip('.,;)') for u in URL_RE.findall(t)])
    clean = URL_RE.sub(" ", t)

    amounts = _dedup(AMOUNT_RE.findall(clean))

    # Instagram handles (explicit mentions)
    instagram_handles = _dedup([f"@{m.rstrip('.,;')}" for m in INSTAGRAM_RE.findall(clean)])
    ig_set = {h.lstrip('@').lower() for h in instagram_handles}

    # UPI IDs — no dot in domain part, not a full email prefix
    all_emails = {e.lower() for e in EMAIL_RE.findall(clean)}
    upi_ids = _dedup([
        m for m in UPI_RE.findall(clean)
        if '.' not in m.split('@')[1]
        and not any(email.startswith(m.lower()) for email in all_emails)
    ])
    upi_set = {u.lower() for u in upi_ids}

    # Emails — exclude UPI
    emails = _dedup([e for e in EMAIL_RE.findall(clean) if e.lower() not in upi_set])

    # Phone numbers
    phone_numbers = _dedup([re.sub(r'[\s\-]', '', p) for p in PHONE_RE.findall(clean)])

    # Telegram — @handle not already captured as Instagram
    telegram_handles = _dedup([
        f"@{m}" for m in TELEGRAM_RE.findall(clean)
        if m.lower() not in ig_set
    ])

    return EntityResponse(
        upi_ids=upi_ids,
        phone_numbers=phone_numbers,
        emails=emails,
        urls=urls,
        amounts=amounts,
        telegram_handles=telegram_handles,
        instagram_handles=instagram_handles,
    )


def save_entities_for_case(case_id: str, text: str, db) -> None:
    """Extract entities from text and persist them to case_entities table."""
    import re
    from app.database.models import CaseEntityDB

    result = extract_entities(text)

    # Bank account numbers (9-18 digits)
    bank_re = re.compile(r'\b\d{9,18}\b')
    # IFSC codes
    ifsc_re = re.compile(r'\b[A-Z]{4}0[A-Z0-9]{6}\b')

    bank_accounts = list(dict.fromkeys(bank_re.findall(text)))
    ifsc_codes    = list(dict.fromkeys(ifsc_re.findall(text)))

    type_map = {
        "phone":     result.phone_numbers,
        "upi":       result.upi_ids,
        "email":     result.emails,
        "url":       result.urls,
        "amount":    result.amounts,
        "telegram":  result.telegram_handles,
        "instagram": result.instagram_handles,
        "bank":      bank_accounts,
        "ifsc":      ifsc_codes,
    }

    for entity_type, values in type_map.items():
        for value in values:
            if value and str(value).strip():
                db.add(CaseEntityDB(
                    id=str(uuid.uuid4()),
                    case_id=case_id,
                    entity_type=entity_type,
                    value=str(value).strip(),
                    created_at=datetime.now(timezone.utc),
                ))
    # caller commits
