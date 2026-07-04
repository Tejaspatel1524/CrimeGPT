"""
brief_service.py — Investigation Brief Engine
================================================
Gathers full case context → sends to Gemini → parses JSON → caches in DB.
Completely separate from the chat system.
"""
import json
import os
import uuid
import re
from datetime import datetime, timezone
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.database.models import InvestigationBriefDB
from app.services.context_service import get_case_context


# ── System prompt ─────────────────────────────────────────────────────────────

BRIEF_SYSTEM_PROMPT = """You are a Senior Indian Cyber Crime Investigation Officer with 20 years of experience.

You have been given the complete case file for a cybercrime case.

YOUR TASK:
Analyze ALL the evidence supplied and produce a structured investigation brief.

STRICT RULES:
1. Use ONLY the data provided. Never invent names, numbers, accounts, or facts.
2. Every finding must cite actual evidence from the case file.
3. If information is missing or insufficient, write exactly: "Insufficient evidence to determine."
4. Do not speculate. Ground every conclusion in the supplied context.
5. Return ONLY valid JSON. No markdown. No explanation. No preamble.

OUTPUT FORMAT (return this exact JSON structure):
{
  "executive_summary": "2-3 sentence summary of the case based on actual evidence",
  "case_assessment": {
    "crime_type": "specific crime type based on evidence",
    "confidence": 85,
    "severity": "High|Medium|Low",
    "organized_crime": true,
    "reason": "reason based on evidence"
  },
  "key_findings": [
    {"title": "finding title", "reason": "evidence-based reason", "confidence": 90}
  ],
  "primary_entities": [
    {"entity": "actual value from case", "type": "upi|phone|email|bank|telegram", "risk": "High|Medium|Low", "reason": "why this entity is significant"}
  ],
  "recommended_actions": [
    {"priority": 1, "action": "specific action", "reason": "which evidence justifies this"}
  ],
  "missing_evidence": [
    {"item": "what is missing", "importance": "Critical|High|Medium", "reason": "why this matters"}
  ],
  "recovery_assessment": {
    "probability": 65,
    "reason": "evidence-based explanation of recovery chances"
  },
  "legal_actions": [
    {"agency": "NPCI|Bank|Telecom|Telegram|Court", "request": "specific legal request", "reason": "based on which evidence"}
  ],
  "investigation_next_steps": [
    "Concrete next step 1",
    "Concrete next step 2",
    "Concrete next step 3"
  ]
}"""


def _build_brief_prompt(context: dict) -> str:
    """Build the full prompt from case context — no history needed."""
    c = context.get("case", {})
    ents = context.get("entities", {})
    evidence = context.get("evidence", [])
    notes = context.get("notes", [])
    timeline = context.get("timeline", [])
    cross = context.get("cross_matches", [])
    recovery = context.get("recovery", {})

    lines = [
        BRIEF_SYSTEM_PROMPT,
        "\n\n=== CASE FILE ===\n",
        f"Case Number: {c.get('case_number', 'N/A')}",
        f"Title: {c.get('title', 'N/A')}",
        f"Fraud Type: {c.get('fraud_type', 'N/A')}",
        f"Status: {c.get('status', 'N/A')} | Priority: {c.get('priority', 'N/A')}",
        f"Amount Lost: Rs {c.get('amount_lost', 0):,.2f}",
        f"Reported: {c.get('created_at', 'N/A')}",
        "",
        "VICTIM PROFILE:",
        f"  Name: {c.get('victim_name', 'N/A')}",
        f"  Phone: {c.get('victim_phone', 'N/A')}",
        f"  Email: {c.get('victim_email', 'N/A')}",
        "",
        "COMPLAINT TEXT:",
        c.get('complaint_text', 'No complaint text available.'),
        "",
        "EXTRACTED ENTITIES:",
    ]

    if ents:
        for etype, vals in ents.items():
            lines.append(f"  {etype.upper()}: {', '.join(str(v) for v in vals[:10])}")
    else:
        lines.append("  No entities extracted yet.")

    lines.append("\nEVIDENCE FILES:")
    if evidence:
        for ev in evidence:
            lines.append(f"  File: {ev['filename']} ({ev['file_type']}) — OCR: {ev['ocr_status']}")
            if ev.get('ocr_text'):
                lines.append(f"  OCR Text: {ev['ocr_text'][:400]}")
            if ev.get('entities'):
                ent_vals = [f"{e['type']}:{e['value']}" for e in ev['entities'][:5]]
                lines.append(f"  Entities from OCR: {', '.join(ent_vals)}")
    else:
        lines.append("  No evidence files uploaded.")

    lines.append("\nOFFICER NOTES:")
    if notes:
        for n in notes[:5]:
            lines.append(f"  [{n['type']}] {n['officer']}: {n['text'][:200]}")
    else:
        lines.append("  No officer notes recorded.")

    lines.append("\nTIMELINE EVENTS:")
    if timeline:
        for t in timeline[:10]:
            lines.append(f"  {t['date'][:10]} — {t['title']} (by {t.get('by', 'system')})")
    else:
        lines.append("  No timeline events.")

    lines.append("\nCROSS-CASE MATCHES:")
    if cross:
        for m in cross[:5]:
            lines.append(f"  {m['entity_type'].upper()} {m['shared_value']} also in {m['related_case']} ({m['related_title'][:40]})")
    else:
        lines.append("  No cross-case matches found.")

    lines += [
        "",
        "RECOVERY INTELLIGENCE:",
        f"  Score: {recovery.get('recovery_probability', 'N/A')}/100",
        f"  Level: {recovery.get('recovery_level', 'N/A')}",
        f"  Urgency: {recovery.get('urgency', 'N/A')}",
        f"  Reasons: {'; '.join(recovery.get('reasoning', [])[:5])}",
        "",
        "=== END OF CASE FILE ===",
        "\nReturn ONLY the JSON object. No markdown. No explanation.",
    ]

    return "\n".join(lines)


def _call_gemini_json(prompt: str) -> dict:
    """Call Gemini and parse JSON response."""
    load_dotenv(override=True)
    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    if not api_key:
        raise ValueError("GEMINI_API_KEY not set in .env")

    raw = ""
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(model=model_name, contents=prompt)
        raw = response.text
    except Exception:
        try:
            import google.generativeai as genai_legacy
            genai_legacy.configure(api_key=api_key)
            model = genai_legacy.GenerativeModel(model_name)
            raw = model.generate_content(prompt).text
        except Exception as e:
            raise ValueError(f"Gemini call failed: {str(e)}")

    # Strip markdown code fences if present
    clean = re.sub(r'^```(?:json)?\s*|\s*```$', '', raw.strip(), flags=re.MULTILINE).strip()

    try:
        return json.loads(clean), model_name
    except json.JSONDecodeError as e:
        raise ValueError(f"Gemini returned invalid JSON: {str(e)}\n\nRaw: {raw[:500]}")


def generate_brief(case_id: str, db: Session, force: bool = False) -> dict:
    """
    Main entry point.
    Checks cache first (unless force=True), then calls Gemini, stores result.
    """
    # Check cache
    if not force:
        cached = (
            db.query(InvestigationBriefDB)
            .filter(InvestigationBriefDB.case_id == case_id)
            .order_by(InvestigationBriefDB.generated_at.desc())
            .first()
        )
        if cached:
            brief = json.loads(cached.brief_json)
            brief["_meta"] = {
                "brief_id": cached.id,
                "generated_at": cached.generated_at.isoformat(),
                "model_used": cached.model_used,
                "cached": True,
            }
            return brief

    # Gather context
    context = get_case_context(case_id, db)
    if "error" in context:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=context["error"])

    # Build prompt and call Gemini
    prompt = _build_brief_prompt(context)
    try:
        brief, model_name = _call_gemini_json(prompt)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    # Cache in DB
    record = InvestigationBriefDB(
        id=str(uuid.uuid4()),
        case_id=case_id,
        brief_json=json.dumps(brief),
        model_used=model_name,
        generated_at=datetime.now(timezone.utc),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    brief["_meta"] = {
        "brief_id": record.id,
        "generated_at": record.generated_at.isoformat(),
        "model_used": model_name,
        "cached": False,
    }
    return brief
