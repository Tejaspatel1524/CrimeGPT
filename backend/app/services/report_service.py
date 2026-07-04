"""
report_service.py
Generates a professional 10-section cybercrime investigation report.
All analysis is rule-based (no external AI).
"""
import re
from typing import List

from app.services.entity_service import extract_entities
from app.services.fraud_service import analyze_fraud
from app.models.fraud import RiskLevel
from app.schemas.report import (
    FullReportResponse, ExecutiveSummary, FraudPattern,
    ExtractedEntities, RiskAssessment, LegalSections,
    RecoveryAssessment, NextActionPlan,
)

# ── Fraud type knowledge base ──────────────────────────────────────────────────

_FRAUD_PROFILES = {
    "upi fraud": {
        "scam_type": "UPI Payment Fraud",
        "attack_methodology": (
            "Fraudster impersonates a bank official, government agency, or service provider "
            "and tricks the victim into initiating a UPI payment under false pretences such as "
            "KYC verification, refund processing, or prize claim."
        ),
        "victim_manipulation": (
            "Victim is manipulated through social engineering — urgency, authority impersonation, "
            "fear of account suspension, or promise of reward — to approve a UPI transaction."
        ),
        "money_movement": (
            "Funds are transferred instantly via UPI to mule accounts, then rapidly layered "
            "through multiple accounts or withdrawn via ATM before law enforcement can intervene."
        ),
    },
    "investment scam": {
        "scam_type": "Investment / Stock Market Fraud",
        "attack_methodology": (
            "Victims are lured into fake investment platforms promising guaranteed high returns. "
            "Initial small payouts build trust before the victim is induced to invest larger sums."
        ),
        "victim_manipulation": (
            "Fake trading dashboards, fabricated profit statements, and peer pressure within "
            "closed WhatsApp/Telegram groups are used to sustain the illusion of legitimacy."
        ),
        "money_movement": (
            "Funds flow through layered UPI accounts, shell company bank accounts, and "
            "cryptocurrency wallets to obscure the trail before offshore withdrawal."
        ),
    },
    "loan app fraud": {
        "scam_type": "Predatory Loan App Fraud",
        "attack_methodology": (
            "Victims download malicious loan apps distributed via SMS/WhatsApp links. "
            "Apps harvest contacts, photos and financial data. A small loan is disbursed then "
            "harassment begins to extort excessive repayments."
        ),
        "victim_manipulation": (
            "Victims are coerced through morphed images sent to contacts, public shaming threats, "
            "and relentless calls. Fear of social exposure prevents victims from reporting."
        ),
        "money_movement": (
            "Repayment collected via UPI/NEFT into numerous mule accounts operated by agents "
            "in multiple states. Proceeds are rapidly converted to cryptocurrency."
        ),
    },
    "phishing": {
        "scam_type": "Phishing / Credential Theft",
        "attack_methodology": (
            "Victim receives a spoofed email, SMS or call mimicking a bank or government portal. "
            "They are directed to a fake website to enter credentials or OTP."
        ),
        "victim_manipulation": (
            "Urgency messaging ('Your account will be blocked'), official-looking logos, "
            "and spoofed sender IDs create convincing deception."
        ),
        "money_movement": (
            "Stolen credentials used to initiate IMPS/NEFT transfers to pre-staged mule accounts "
            "within minutes of credential capture."
        ),
    },
    "job scam": {
        "scam_type": "Fake Job / Work-From-Home Fraud",
        "attack_methodology": (
            "Fraudsters post fake job advertisements on social media or job portals "
            "offering high-paying remote work. Victims are asked to pay registration or "
            "training fees upfront."
        ),
        "victim_manipulation": (
            "Professional-looking offer letters, fake HR representatives, and initial "
            "small task payments build trust before the final large fee demand."
        ),
        "money_movement": (
            "Registration fees collected via UPI/bank transfer to temporary accounts "
            "that are immediately vacated after collection."
        ),
    },
}

_DEFAULT_PROFILE = {
    "scam_type": "Cybercrime Fraud",
    "attack_methodology": (
        "The victim was approached through digital communication channels and deceived "
        "into making financial transactions under false pretences."
    ),
    "victim_manipulation": (
        "Social engineering techniques including urgency, authority, and trust exploitation "
        "were employed to bypass the victim's judgement."
    ),
    "money_movement": (
        "Funds were transferred electronically and rapidly moved through multiple accounts "
        "to hinder tracing and recovery."
    ),
}

# ── Legal section knowledge base ───────────────────────────────────────────────

_LEGAL = {
    "upi fraud": {
        "bns": [
            "BNS Section 318 — Cheating",
            "BNS Section 319 — Cheating by personation",
            "BNS Section 336 — Forgery for purpose of cheating",
        ],
        "it_act": [
            "IT Act Section 66C — Identity theft",
            "IT Act Section 66D — Cheating by personation using computer resource",
            "IT Act Section 43 — Penalty for damage to computer, computer system, etc.",
        ],
        "other": [
            "PMLA 2002 — Money laundering provisions",
            "RBI Circular on Unauthorised Electronic Transactions",
            "NPCI UPI Dispute Resolution Framework",
        ],
    },
    "investment scam": {
        "bns": [
            "BNS Section 318 — Cheating",
            "BNS Section 61 — Criminal conspiracy",
        ],
        "it_act": [
            "IT Act Section 66 — Computer related offences",
            "IT Act Section 66D — Cheating by personation using computer resource",
        ],
        "other": [
            "SEBI Act 1992 — Fraudulent and unfair trade practices",
            "PMLA 2002 — Proceeds of crime",
            "Prize Chits and Money Circulation Schemes (Banning) Act 1978",
        ],
    },
    "default": {
        "bns": [
            "BNS Section 318 — Cheating",
            "BNS Section 319 — Cheating by personation",
            "BNS Section 351 — Criminal intimidation",
        ],
        "it_act": [
            "IT Act Section 66C — Identity theft",
            "IT Act Section 66D — Cheating by personation using computer resource",
            "IT Act Section 66 — Computer related offences",
        ],
        "other": [
            "PMLA 2002 — If financial threshold crossed",
            "Telecom Regulatory provisions for unsolicited communications",
        ],
    },
}

# ── Red flag rules ─────────────────────────────────────────────────────────────

def _detect_red_flags(text: str) -> List[str]:
    t = text.lower()
    flags = []
    if re.search(r'\b(guaranteed|assured|fixed)\s+(return|profit|income)', t):
        flags.append("Guaranteed returns promised — classic fraud indicator")
    if re.search(r'\b(urgent|immediately|right now|asap|within \d+ hour)', t):
        flags.append("Urgency tactics used to prevent victim from verifying")
    upi_count = len(re.findall(r'[a-z0-9._-]+@[a-z]+', t))
    if upi_count > 1:
        flags.append(f"Multiple payment accounts detected ({upi_count} UPI IDs)")
    if re.search(r'\b(telegram|whatsapp|signal|anonymous)\b', t):
        flags.append("Communication via anonymous / unregulated channels")
    if re.search(r'\b(support|helpdesk|customer care)\b', t):
        flags.append("Fake support channel used to establish false legitimacy")
    if re.search(r'\b(otp|pin|password|cvv)\b', t):
        flags.append("OTP / credential solicitation — never requested by legitimate entities")
    if re.search(r'\b(prize|lottery|winner|selected)\b', t):
        flags.append("Lottery/prize lure — common social engineering technique")
    if not flags:
        flags.append("No explicit red flags detected — verify via forensic analysis")
    return flags


# ── Main generator ─────────────────────────────────────────────────────────────

def _get_fraud_key(fraud_type: str) -> str:
    ft = (fraud_type or "").lower()
    for key in _FRAUD_PROFILES:
        if key in ft:
            return key
    return "default"


def build_full_report(
    text: str,
    fraud_type: str = "",
    victim_name: str = "",
    amount_lost: float = 0.0,
    case_id: str = "",
    case_number: str = "",
    report_id: str = "",
) -> FullReportResponse:

    entities = extract_entities(text)
    fraud    = analyze_fraud(text)
    key      = _get_fraud_key(fraud_type)
    profile  = _FRAUD_PROFILES.get(key, _DEFAULT_PROFILE)
    legal    = _LEGAL.get(key, _LEGAL["default"])

    # 1. Executive Summary
    amount_str = f"₹{amount_lost:,.2f}" if amount_lost else "Not specified"
    exec_summary = ExecutiveSummary(
        case_overview=(
            f"A cybercrime complaint has been filed"
            + (f" by {victim_name}" if victim_name else "")
            + (f" (Case: {case_number})" if case_number else "")
            + f". The complaint involves {profile['scam_type']} resulting in financial loss."
        ),
        total_loss_amount=amount_str,
        fraud_category=profile["scam_type"],
        risk_level=fraud.risk_level.value,
    )

    # 2. Fraud Pattern
    fraud_pattern = FraudPattern(
        scam_type=profile["scam_type"],
        attack_methodology=profile["attack_methodology"],
        victim_manipulation=profile["victim_manipulation"],
        money_movement=profile["money_movement"],
    )

    # 3. Extracted Entities (extended)
    bank_re  = re.compile(r'\b\d{9,18}\b')
    ifsc_re  = re.compile(r'\b[A-Z]{4}0[A-Z0-9]{6}\b')
    extracted = ExtractedEntities(
        phone_numbers=entities.phone_numbers,
        emails=entities.emails,
        upi_ids=entities.upi_ids,
        websites=entities.urls,
        telegram_usernames=entities.telegram_handles,
        social_media_handles=entities.instagram_handles,
        bank_accounts=list(dict.fromkeys(bank_re.findall(text))),
        ifsc_codes=list(dict.fromkeys(ifsc_re.findall(text))),
    )

    # 4. Risk Assessment
    score = fraud.risk_score
    if score >= 80:
        severity, confidence = "CRITICAL", 92
    elif score >= 60:
        severity, confidence = "HIGH", 85
    elif score >= 40:
        severity, confidence = "MEDIUM", 75
    else:
        severity, confidence = "LOW", 60

    reasoning = (
        f"Risk score of {score}/100 computed from {len(fraud.reasons)} indicator(s): "
        + "; ".join(fraud.reasons) + "."
    ) if fraud.reasons else f"Baseline risk score of {score}/100. No strong indicators detected."

    risk_assessment = RiskAssessment(
        risk_score=score,
        confidence_score=confidence,
        severity_level=severity,
        reasoning=reasoning,
    )

    # 5. Red Flags
    red_flags = _detect_red_flags(text)

    # 6. Legal Sections
    legal_sections = LegalSections(
        bns=legal["bns"],
        it_act=legal["it_act"],
        other=legal["other"],
    )

    # 7. Investigation Recommendations
    recs = [
        "Freeze all beneficiary accounts identified via UPI/bank transaction trail",
        "Submit Legal Process Request to NPCI for UPI transaction logs",
        "Obtain CDR/IPDR from telecom operators for all identified numbers",
        "Preserve digital evidence — screenshots, chat exports, call recordings",
        "Issue Platform Preservation Requests to WhatsApp, Telegram, Meta",
        "Cross-reference all entities with NCRP database and I4C",
    ]
    if score >= 60:
        recs.insert(0, "URGENT: Immediate coordination with Cyber Crime Cell required")
    if extracted.bank_accounts:
        recs.append("Request bank statements and KYC for all identified account numbers")
    if extracted.websites:
        recs.append("Submit domain takedown request to CERT-In for identified URLs")

    # 8. Evidence Checklist
    checklist = [
        "Screenshots of all fraudulent communications",
        "Bank statements showing debit transactions",
        "UPI transaction receipts (PhonePe / GPay / Paytm history)",
        "Chat exports from WhatsApp / Telegram",
        "Call logs from victim's mobile",
        "Email headers and forwarded emails",
        "Device forensics — victim's mobile if available",
        "CCTV footage if ATM withdrawal involved",
    ]

    # 9. Recovery Assessment
    if score >= 80:
        recovery_poss = "Low"
        recovery_exp  = (
            "Funds have likely already been layered or withdrawn. Immediate legal action "
            "via Section 102 CrPC to freeze accounts is critical. Recovery probability "
            "is low without rapid law enforcement intervention within 24 hours."
        )
    elif score >= 50:
        recovery_poss = "Medium"
        recovery_exp  = (
            "Partial recovery is possible if freeze orders are executed within 48 hours. "
            "Coordinate with payment intermediaries via NPCI grievance portal and "
            "cybercrime helpline 1930."
        )
    else:
        recovery_poss = "High"
        recovery_exp  = (
            "Early reporting improves recovery chances significantly. File complaint on "
            "cybercrime.gov.in and call 1930 immediately. Bank mediation may resolve."
        )

    recovery = RecoveryAssessment(
        possibility=recovery_poss,
        explanation=recovery_exp,
    )

    # 10. Next Action Plan
    action_plan = NextActionPlan(
        immediate=[
            "Register complaint on cybercrime.gov.in / call helpline 1930",
            "Freeze beneficiary account via bank's fraud reporting channel",
            "Preserve all evidence — do not delete messages or call logs",
            "File First Information Report (FIR) at local Cyber Crime Police Station",
        ],
        short_term=[
            "Submit formal application to NPCI for transaction reversal",
            "Issue CDR/IPDR requests to telecom operators",
            "Identify and arrest mule account holders",
            "Request MLAT (Mutual Legal Assistance Treaty) if cross-border",
        ],
        long_term=[
            "Complete charge sheet with forensic evidence",
            "Coordinate with ED under PMLA if proceeds exceed threshold",
            "Pursue asset recovery through civil proceedings",
            "Victim counselling and impact assessment",
        ],
    )

    return FullReportResponse(
        report_id=report_id or None,
        case_id=case_id or None,
        case_number=case_number or None,
        executive_summary=exec_summary,
        fraud_pattern=fraud_pattern,
        extracted_entities=extracted,
        risk_assessment=risk_assessment,
        red_flags=red_flags,
        legal_sections=legal_sections,
        investigation_recs=recs,
        evidence_checklist=checklist,
        recovery_assessment=recovery,
        next_action_plan=action_plan,
    )


# ── Legacy slim report (backward compat) ──────────────────────────────────────

def generate_report(text: str):
    """Legacy — kept for existing callers."""
    from app.schemas.report import ReportResponse
    from app.models.report import RecommendedAction
    entities = extract_entities(text)
    fraud    = analyze_fraud(text)
    full     = build_full_report(text)
    return ReportResponse(
        summary=full.executive_summary.case_overview,
        risk_score=fraud.risk_score,
        risk_level=fraud.risk_level,
        reasons=fraud.reasons,
        recommended_actions=full.investigation_recs[:6],
    )
