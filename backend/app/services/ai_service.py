"""
ai_service.py — AI Provider Layer
===================================
Isolates ALL AI provider logic in one place.
To switch from rule-based to GPT-4 / Gemini / Claude:
  1. Set AI_PROVIDER env var to "openai", "gemini", or "anthropic"
  2. Add the relevant API key to .env
  3. Implement the corresponding _call_* function below

Current default: rule-based local engine (no external API, no cost, no hallucinations).
"""
import os
import re
from typing import List, Dict


AI_PROVIDER = os.getenv("AI_PROVIDER", "local")   # local | openai | gemini | anthropic


# ── System prompt template ────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are CrimeGPT, an AI investigation assistant for cybercrime officers.

RULES:
1. Use ONLY the investigation context provided below.
2. Never invent facts, phone numbers, account numbers, or legal references.
3. If information is unavailable, explicitly say: "This information is not available in the case file."
4. Every recommendation must be traceable to an entity, evidence item, or timeline event in the context.
5. Be concise, structured, and professional.
6. Format responses with clear sections: Summary, Reasoning, Evidence Used, Recommended Actions.
"""


def build_prompt(context: dict, question: str, history: List[Dict]) -> str:
    """Build the full prompt from context + history + question."""
    c = context.get("case", {})
    ents = context.get("entities", {})
    recovery = context.get("recovery", {})
    cross = context.get("cross_matches", [])
    notes = context.get("notes", [])
    evidence = context.get("evidence", [])

    ctx_lines = [
        f"CASE: {c.get('case_number')} | {c.get('fraud_type')} | {c.get('status')} | Priority: {c.get('priority')}",
        f"VICTIM: {c.get('victim_name')} | {c.get('victim_phone')} | {c.get('victim_email')}",
        f"AMOUNT LOST: Rs {c.get('amount_lost', 0):,.2f}",
        f"COMPLAINT: {c.get('complaint_text', '')[:500]}",
        "",
        "EXTRACTED ENTITIES:",
    ]
    for etype, vals in ents.items():
        ctx_lines.append(f"  {etype.upper()}: {', '.join(vals[:5])}")

    if evidence:
        ctx_lines.append(f"\nEVIDENCE: {len(evidence)} file(s) uploaded")
        for ev in evidence[:3]:
            ctx_lines.append(f"  - {ev['filename']} ({ev['ocr_status']})")
            if ev.get('ocr_text'):
                ctx_lines.append(f"    OCR preview: {ev['ocr_text'][:200]}")

    if notes:
        ctx_lines.append(f"\nOFFICER NOTES ({len(notes)}):")
        for n in notes[:3]:
            ctx_lines.append(f"  [{n['type']}] {n['officer']}: {n['text'][:150]}")

    if cross:
        ctx_lines.append(f"\nCROSS-CASE MATCHES ({len(cross)}):")
        for m in cross[:5]:
            ctx_lines.append(f"  {m['entity_type'].upper()} {m['shared_value']} → {m['related_case']} ({m['related_title'][:40]})")

    ctx_lines += [
        "",
        f"RECOVERY INTELLIGENCE:",
        f"  Score: {recovery.get('recovery_probability', 'N/A')}/100 | Level: {recovery.get('recovery_level', 'N/A')} | Urgency: {recovery.get('urgency', 'N/A')}",
        f"  Reasoning: {'; '.join(recovery.get('reasoning', [])[:3])}",
    ]

    history_text = ""
    if history:
        history_text = "\nCONVERSATION HISTORY:\n"
        for msg in history[-6:]:   # last 3 turns
            role = "OFFICER" if msg["role"] == "user" else "CRIMEGPT"
            history_text += f"{role}: {msg['content'][:300]}\n"

    return (
        SYSTEM_PROMPT
        + "\n\nINVESTIGATION CONTEXT:\n"
        + "\n".join(ctx_lines)
        + history_text
        + f"\n\nOFFICER QUESTION: {question}\n\nCRIMEGPT RESPONSE:"
    )


# ── Local rule-based engine (default, no API key needed) ─────────────────────

def _call_local(prompt: str, context: dict, question: str) -> str:
    """
    Deterministic rule-based responder.
    Produces structured answers from context data.
    Upgrade to a real LLM by changing AI_PROVIDER env var.
    """
    q = question.lower()
    c = context.get("case", {})
    ents = context.get("entities", {})
    recovery = context.get("recovery", {})
    cross = context.get("cross_matches", [])
    notes = context.get("notes", [])
    evidence = context.get("evidence", [])

    # ── Routing by question intent ────────────────────────────────────────
    if any(k in q for k in ["summar", "overview", "about this case", "what is this case"]):
        return _answer_summary(c, ents, recovery)

    if any(k in q for k in ["investigate next", "next step", "what should i do", "action"]):
        return _answer_next_steps(c, ents, recovery, cross)

    if any(k in q for k in ["missing evidence", "what is missing", "lacking"]):
        return _answer_missing_evidence(ents, evidence, c)

    if any(k in q for k in ["recovery", "probability", "recover", "funds"]):
        return _answer_recovery(recovery, c)

    if any(k in q for k in ["suspicious", "entity", "entities", "upi", "phone", "bank"]):
        return _answer_entities(ents, cross)

    if any(k in q for k in ["freeze", "bank freeze", "section 102", "beneficiary"]):
        return _answer_bank_freeze(c, ents)

    if any(k in q for k in ["victim questionnaire", "victim question", "interview victim"]):
        return _answer_victim_questionnaire(c)

    if any(k in q for k in ["related case", "linked case", "cross case", "pattern"]):
        return _answer_related_cases(cross, c)

    if any(k in q for k in ["note", "officer note", "investigation note"]):
        if not notes:
            return "**Officer Notes**\n\nNo officer notes have been recorded for this case yet."
        lines = [f"**Officer Notes ({len(notes)} entries)**\n"]
        for n in notes[:5]:
            lines.append(f"**[{n['type']}]** {n['officer']}\n{n['text']}\n")
        return "\n".join(lines)

    # Default — general answer
    return _answer_general(c, ents, recovery, question)


def _answer_summary(c, ents, recovery) -> str:
    entity_summary = ", ".join(
        f"{k}: {len(v)}" for k, v in ents.items() if v
    ) or "None extracted"
    return f"""## Case Summary — {c.get('case_number', 'Unknown')}

**Fraud Type:** {c.get('fraud_type', 'N/A')}
**Status:** {c.get('status', 'N/A')} | **Priority:** {c.get('priority', 'N/A')}
**Amount Lost:** ₹{c.get('amount_lost', 0):,.2f}
**Victim:** {c.get('victim_name', 'N/A')} ({c.get('victim_phone', 'N/A')})

**Complaint Summary:**
{c.get('complaint_text', 'No complaint text available.')[:400]}

**Extracted Entities:** {entity_summary}

**Recovery Assessment:**
- Score: {recovery.get('recovery_probability', 'N/A')}/100 ({recovery.get('recovery_level', 'N/A')})
- Urgency: {recovery.get('urgency', 'N/A')}"""


def _answer_next_steps(c, ents, recovery, cross) -> str:
    steps = recovery.get("recommended_actions", [])
    if not steps:
        return "Insufficient evidence to generate next steps. Please upload evidence and extract entities first."
    lines = ["## Recommended Next Steps\n"]
    for i, step in enumerate(steps[:8], 1):
        lines.append(f"{i}. {step}")
    if cross:
        lines.append(f"\n**⚠️ Cross-Case Alert:** {len(cross)} shared entities found across other cases — consider coordinating investigations.")
    return "\n".join(lines)


def _answer_missing_evidence(ents, evidence, c) -> str:
    missing = []
    if "upi" not in ents:     missing.append("UPI ID — needed to raise NPCI dispute")
    if "bank" not in ents:    missing.append("Bank account number — needed for freeze request")
    if "phone" not in ents:   missing.append("Phone number — needed for CDR/subscriber request")
    if "ifsc" not in ents:    missing.append("IFSC code — needed to identify beneficiary bank branch")
    if not evidence:          missing.append("Digital evidence — no files uploaded yet")

    if not missing:
        return "## Evidence Assessment\n\nAll key evidence types are present. No critical gaps identified."

    lines = ["## Missing Evidence\n", "The following evidence is not available in this case:\n"]
    for m in missing:
        lines.append(f"- ❌ **{m}**")
    lines.append("\n**Recommended:** Obtain the above from victim, telecom operators, or bank.")
    return "\n".join(lines)


def _answer_recovery(recovery, c) -> str:
    prob = recovery.get('recovery_probability', 0)
    level = recovery.get('recovery_level', 'Unknown')
    reasoning = recovery.get('reasoning', [])
    actions = recovery.get('recommended_actions', [])[:5]

    lines = [
        f"## Recovery Intelligence\n",
        f"**Recovery Probability:** {prob}/100 — **{level}**",
        f"**Urgency:** {recovery.get('urgency', 'N/A')}",
        f"**Days Since Reported:** {recovery.get('days_since_reported', 'N/A')}",
        "\n**Why this score:**",
    ]
    for r in reasoning:
        prefix = "✓" if "identified" in r.lower() or "within" in r.lower() or "match" in r.lower() else "✗"
        lines.append(f"- {prefix} {r}")

    lines.append("\n**Immediate Actions:**")
    for a in actions:
        lines.append(f"- {a}")

    return "\n".join(lines)


def _answer_entities(ents, cross) -> str:
    if not ents:
        return "No entities have been extracted for this case yet. Upload and analyze evidence to extract entities."
    lines = ["## Extracted Entities\n"]
    TYPE_ICONS = {"phone":"📱","upi":"💳","email":"✉️","url":"🌐","telegram":"✈️","bank":"🏦","ifsc":"🔢","amount":"₹"}
    for etype, vals in ents.items():
        icon = TYPE_ICONS.get(etype, "🔷")
        lines.append(f"**{icon} {etype.upper()} ({len(vals)})**")
        for v in vals[:5]:
            lines.append(f"  - `{v}`")
    if cross:
        lines.append(f"\n**⚠️ Cross-Case Matches ({len(cross)}):**")
        for m in cross[:5]:
            lines.append(f"  - `{m['shared_value']}` ({m['entity_type']}) → {m['related_case']}")
    return "\n".join(lines)


def _answer_bank_freeze(c, ents) -> str:
    upi_list = ents.get("upi", [])
    bank_list = ents.get("bank", [])
    ifsc_list = ents.get("ifsc", [])

    if not upi_list and not bank_list:
        return "**Bank Freeze Request**\n\nInsufficient evidence: No UPI ID or bank account number found in this case. Extract entities from uploaded evidence first."

    lines = [
        "## Bank Account Freeze Request\n",
        f"**To:** The Branch Manager / Nodal Officer",
        f"**Subject:** Request for Freezing of Account under Section 102 CrPC\n",
        f"This is to inform you that in connection with cybercrime investigation case **{c.get('case_number', 'N/A')}**, the following account(s) have been identified as beneficiary accounts in a **{c.get('fraud_type', 'fraud')}** case:\n",
    ]
    if upi_list:
        for u in upi_list[:3]:
            lines.append(f"- **UPI ID:** `{u}`")
    if bank_list:
        for b in bank_list[:3]:
            lines.append(f"- **Account Number:** `{b}`")
    if ifsc_list:
        lines.append(f"- **IFSC:** `{ifsc_list[0]}`")
    lines += [
        f"\nVictim **{c.get('victim_name', 'N/A')}** has suffered a loss of **₹{c.get('amount_lost', 0):,.2f}**.",
        "\nYou are requested to immediately freeze the above account(s) and provide transaction records for the past 90 days.",
        "\nThis request is made under **Section 102 CrPC** and **IT Act Section 43**.",
    ]
    return "\n".join(lines)


def _answer_victim_questionnaire(c) -> str:
    fraud_type = c.get("fraud_type", "fraud").lower()
    q = [
        "## Victim Questionnaire\n",
        f"**Case:** {c.get('case_number')} | **Victim:** {c.get('victim_name')}\n",
        "**Basic Information:**",
        "1. When did you first receive contact from the suspect? (Date/Time)",
        "2. How were you first contacted? (WhatsApp / Telegram / Phone / Email / Other)",
        "3. How many people were involved in the communication?",
        "",
        "**Financial Details:**",
        "4. What was the total amount you transferred?",
        "5. Which payment method did you use? (UPI / Bank Transfer / Cash / Crypto)",
        "6. Do you have transaction receipts or screenshots?",
        "7. What UPI ID or bank account did you transfer money to?",
        "",
        "**Communication Evidence:**",
        "8. Do you still have the chat history? (Please do NOT delete it)",
        "9. Do you have the phone number or social media profile of the suspect?",
        "10. Were you asked to install any app or share your screen?",
    ]
    if "investment" in fraud_type or "crypto" in fraud_type:
        q += [
            "",
            "**Investment Scam Specific:**",
            "11. What returns were you promised?",
            "12. Did you see a fake trading dashboard or website?",
            "13. Were you added to a Telegram/WhatsApp group with other 'investors'?",
        ]
    elif "loan" in fraud_type:
        q += [
            "",
            "**Loan App Specific:**",
            "11. Which app did you download? (Name / Play Store link)",
            "12. Did the app access your contacts or photos?",
            "13. Were you harassed with morphed images?",
        ]
    q.append("\n**Note:** All answers will be used as evidence. Please provide accurate information.")
    return "\n".join(q)


def _answer_related_cases(cross, c) -> str:
    if not cross:
        return "## Cross-Case Analysis\n\nNo matching entities found in other cases. This appears to be an isolated incident based on current data."
    lines = [f"## Cross-Case Intelligence — {len(cross)} Matches\n"]
    cases_seen = {}
    for m in cross:
        rc = m["related_case"]
        if rc not in cases_seen:
            cases_seen[rc] = {"title": m["related_title"], "shared": []}
        cases_seen[rc]["shared"].append(f"{m['entity_type']}: `{m['shared_value']}`")

    for rc, info in list(cases_seen.items())[:5]:
        lines.append(f"**{rc}** — {info['title'][:50]}")
        for s in info["shared"]:
            lines.append(f"  - Shared {s}")
        lines.append("")

    if len(cases_seen) >= 3:
        lines.append("**⚠️ Organized Fraud Pattern Detected** — Multiple cases share entities. Recommend escalation to organized fraud unit.")
    return "\n".join(lines)


def _answer_general(c, ents, recovery, question) -> str:
    return f"""## CrimeGPT Response

Based on the available investigation data for **{c.get('case_number', 'this case')}**:

**Case Context:**
- Fraud Type: {c.get('fraud_type', 'N/A')}
- Status: {c.get('status', 'N/A')} | Priority: {c.get('priority', 'N/A')}
- Recovery Score: {recovery.get('recovery_probability', 'N/A')}/100

**Available Evidence:**
{', '.join(f"{k}: {len(v)}" for k, v in ents.items() if v) or 'No entities extracted yet'}

I don't have enough specific information to fully answer: *"{question}"*

Please try one of these specific questions:
- "Summarize this case"
- "What should I investigate next?"
- "What evidence is missing?"
- "Show suspicious entities"
- "Generate a bank freeze request"
- "Why is recovery probability high/low?"
- "Show related cases"
"""


# ── Provider router ───────────────────────────────────────────────────────────

def _call_openai(prompt: str) -> str:
    """Placeholder — set AI_PROVIDER=openai and OPENAI_API_KEY to activate."""
    import openai
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    resp = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o"),
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1500,
    )
    return resp.choices[0].message.content


def _call_gemini(prompt: str) -> str:
    """Gemini via google-genai SDK. Model read from GEMINI_MODEL env var."""
    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    if not api_key:
        return "**Configuration Error:** GEMINI_API_KEY is not set in the .env file."

    try:
        # Try new google-genai SDK first (google.genai)
        from google import genai
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
        )
        return response.text
    except ImportError:
        pass
    except Exception as e:
        # If new SDK fails, fall through to legacy SDK
        err_str = str(e)
        if "not found" in err_str.lower() or "404" in err_str:
            return f"**Gemini Error:** Model `{model_name}` not found. Check GEMINI_MODEL in .env.\n\nDetails: {err_str}"
        # Try legacy SDK before giving up
        pass

    try:
        # Fallback: legacy google-generativeai SDK
        import google.generativeai as genai_legacy
        genai_legacy.configure(api_key=api_key)
        model = genai_legacy.GenerativeModel(model_name)
        return model.generate_content(prompt).text
    except Exception as e:
        return f"**Gemini Error ({model_name}):** {str(e)}"


def _call_anthropic(prompt: str) -> str:
    """Placeholder — set AI_PROVIDER=anthropic and ANTHROPIC_API_KEY to activate."""
    import anthropic
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    msg = client.messages.create(
        model=os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022"),
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text


def call_ai(context: dict, question: str, history: list) -> str:
    """
    Main entry point — routes to the configured AI provider.
    Change AI_PROVIDER env var to switch providers without restarting.
    """
    from dotenv import load_dotenv
    load_dotenv(override=True)   # reload .env so changes take effect immediately

    provider = os.getenv("AI_PROVIDER", "local")
    prompt = build_prompt(context, question, history)

    try:
        if provider == "openai":
            return _call_openai(prompt)
        elif provider == "gemini":
            return _call_gemini(prompt)
        elif provider == "anthropic":
            return _call_anthropic(prompt)
        else:
            return _call_local(prompt, context, question)
    except Exception as e:
        # Surface the real error instead of swallowing it
        return f"**AI Error ({provider}):** {str(e)}"
