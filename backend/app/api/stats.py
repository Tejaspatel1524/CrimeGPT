"""
stats.py — Real-time aggregation endpoints.

GET /stats/dashboard  → KPI cards + monthly trends + category/status distribution + recent cases
GET /stats/intelligence → intelligence-centre metrics derived from live case data
"""

from collections import defaultdict
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import CaseDB

router = APIRouter(prefix="/stats", tags=["Statistics"])

# ── colour palette for charts ──────────────────────────────────────────────────
CATEGORY_COLORS = {
    "Investment Scam":       "#ef4444",
    "UPI Fraud":             "#f59e0b",
    "Phishing":              "#3b82f6",
    "Job Scam":              "#8b5cf6",
    "Loan App Fraud":        "#ec4899",
    "Sextortion":            "#6366f1",
    "Identity Theft":        "#14b8a6",
    "Online Shopping Fraud": "#84cc16",
}

STATUS_COLORS = {
    "Open":                  "#3b82f6",
    "Under Investigation":   "#f59e0b",
    "Evidence Collection":   "#8b5cf6",
    "Pending Review":        "#6366f1",
    "Escalated":             "#ef4444",
    "Closed":                "#10b981",
    "Resolved":              "#14b8a6",
}

MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
               "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


# ── helpers ───────────────────────────────────────────────────────────────────

def _month_key(dt: datetime) -> str:
    """Return 'YYYY-MM' string for grouping."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.strftime("%Y-%m")


def _month_label(ym: str) -> str:
    """'2025-06' → 'Jun'"""
    try:
        return MONTH_NAMES[int(ym.split("-")[1]) - 1]
    except Exception:
        return ym


# ── GET /stats/dashboard ──────────────────────────────────────────────────────

@router.get("/dashboard", summary="Dashboard KPIs, charts and recent activity")
def dashboard_stats(db: Session = Depends(get_db)):
    # Only include active (non-archived) cases
    cases = db.query(CaseDB).filter(CaseDB.archived == 0).all()

    total          = len(cases)
    open_cases     = sum(1 for c in cases if c.status.value == "Open")
    closed_cases   = sum(1 for c in cases if c.status.value in ("Closed", "Resolved"))
    high_priority  = sum(1 for c in cases if c.priority.value in ("Critical", "High"))
    active_invest  = sum(1 for c in cases if c.status.value in (
        "Under Investigation", "Evidence Collection", "Escalated"))

    total_amount = sum(c.amount_lost or 0 for c in cases)

    # ── monthly trends (last 12 months) ──────────────────────────────────────
    month_filed:    dict = defaultdict(int)
    month_resolved: dict = defaultdict(int)

    for c in cases:
        mk = _month_key(c.created_at)
        month_filed[mk] += 1
        if c.status.value in ("Closed", "Resolved"):
            month_resolved[mk] += 1

    now = datetime.now(timezone.utc)
    monthly_trends = []
    for i in range(11, -1, -1):
        d   = now - timedelta(days=i * 30)
        key = d.strftime("%Y-%m")
        monthly_trends.append({
            "month":    _month_label(key),
            "cases":    month_filed.get(key, 0),
            "resolved": month_resolved.get(key, 0),
        })

    # ── category distribution ─────────────────────────────────────────────────
    cat_count: dict = defaultdict(int)
    for c in cases:
        cat_count[c.fraud_type] += 1

    category_distribution = [
        {
            "category": cat,
            "count":    count,
            "percentage": round(count / total * 100, 1) if total else 0,
            "color":    CATEGORY_COLORS.get(cat, "#6366f1"),
        }
        for cat, count in sorted(cat_count.items(), key=lambda x: x[1], reverse=True)
    ]

    # ── status distribution ───────────────────────────────────────────────────
    status_count: dict = defaultdict(int)
    for c in cases:
        status_count[c.status.value] += 1

    status_distribution = [
        {
            "status": st,
            "count":  cnt,
            "color":  STATUS_COLORS.get(st, "#64748b"),
        }
        for st, cnt in status_count.items()
    ]

    # ── recent cases as "activity" ────────────────────────────────────────────
    recent = sorted(cases, key=lambda c: c.created_at, reverse=True)[:10]
    recent_activities = [
        {
            "id":          c.case_id,
            "type":        "new_case",
            "title":       "New Case Registered",
            "description": f"{c.case_number or c.case_id}: {c.title} — victim: {c.victim_name}",
            "timestamp":   c.created_at.isoformat(),
            "caseId":      c.case_id,
            "caseNumber":  c.case_number or c.case_id,
        }
        for c in recent
    ]

    return {
        "stats": {
            "totalCases":           total,
            "openCases":            open_cases,
            "closedCases":          closed_cases,
            "highPriorityCases":    high_priority,
            "activeInvestigations": active_invest,
            "totalAmountLost":      total_amount,
            "convictionRate":       round(closed_cases / total * 100, 1) if total else 0,
            "avgResolutionDays":    45,  # placeholder — needs closed_at column
        },
        "monthlyTrends":      monthly_trends,
        "categoryDistribution": category_distribution,
        "statusDistribution":  status_distribution,
        "recentActivities":    recent_activities,
    }


# ── GET /stats/intelligence ───────────────────────────────────────────────────

@router.get("/intelligence", summary="Intelligence centre metrics from live case data")
def intelligence_stats(db: Session = Depends(get_db)):
    # Only include active (non-archived) cases
    cases = db.query(CaseDB).filter(CaseDB.archived == 0).all()

    total        = len(cases)
    total_amount = sum(c.amount_lost or 0 for c in cases)

    # ── priority investigations ───────────────────────────────────────────────
    priority_cases = [
        {
            "id":             c.case_id,
            "caseNumber":     c.case_number or c.case_id,
            "title":          c.title,
            "priority":       c.priority.value,
            "status":         c.status.value,
            "amountLost":     c.amount_lost,
            "assignedOfficer": {"name": "Investigating Officer"},
        }
        for c in cases
        if c.priority.value in ("Critical", "High")
    ][:5]

    # ── category distribution for bar chart ──────────────────────────────────
    cat_count: dict = defaultdict(int)
    for c in cases:
        cat_count[c.fraud_type] += 1

    category_distribution = [
        {
            "category": cat,
            "count":    count,
            "color":    CATEGORY_COLORS.get(cat, "#6366f1"),
        }
        for cat, count in sorted(cat_count.items(), key=lambda x: x[1], reverse=True)
    ]

    # ── fraud trends (this month vs last month) ───────────────────────────────
    now       = datetime.now(timezone.utc)
    this_ym   = now.strftime("%Y-%m")
    last_ym   = (now - timedelta(days=30)).strftime("%Y-%m")

    this_cat: dict = defaultdict(int)
    last_cat: dict = defaultdict(int)
    for c in cases:
        mk = _month_key(c.created_at)
        if mk == this_ym:
            this_cat[c.fraud_type] += 1
        elif mk == last_ym:
            last_cat[c.fraud_type] += 1

    all_cats = set(this_cat.keys()) | set(last_cat.keys())
    fraud_trends = []
    for cat in all_cats:
        cur  = this_cat.get(cat, 0)
        prev = last_cat.get(cat, 0)
        if prev > 0:
            pct = round((cur - prev) / prev * 100, 1)
        elif cur > 0:
            pct = 100.0
        else:
            pct = 0.0
        fraud_trends.append({
            "category":      cat,
            "currentMonth":  cur,
            "previousMonth": prev,
            "changePercent": pct,
            "trend":         "up" if pct >= 0 else "down",
        })
    fraud_trends.sort(key=lambda x: abs(x["changePercent"]), reverse=True)

    # ── alerts generated from real data ──────────────────────────────────────
    alerts = []
    critical_cases = [c for c in cases if c.priority.value == "Critical"]
    if critical_cases:
        alerts.append({
            "id":           "ALT-AUTO-001",
            "severity":     "critical",
            "title":        f"{len(critical_cases)} Critical Cases Require Immediate Action",
            "description":  f"You have {len(critical_cases)} critical-priority investigations open in the system.",
            "timestamp":    now.isoformat(),
            "source":       "Case Monitoring",
            "acknowledged": False,
        })

    high_amount = [c for c in cases if (c.amount_lost or 0) > 500000]
    if high_amount:
        total_high = sum(c.amount_lost for c in high_amount)
        alerts.append({
            "id":           "ALT-AUTO-002",
            "severity":     "high",
            "title":        f"High-Value Cases — ₹{total_high:,.0f} Total Exposure",
            "description":  f"{len(high_amount)} cases each involve losses exceeding ₹5,00,000.",
            "timestamp":    now.isoformat(),
            "source":       "Financial Intelligence",
            "acknowledged": False,
        })

    open_cases_list = [c for c in cases if c.status.value == "Open"]
    if open_cases_list:
        alerts.append({
            "id":           "ALT-AUTO-003",
            "severity":     "medium",
            "title":        f"{len(open_cases_list)} Open Cases Pending Assignment",
            "description":  "These cases have been registered but investigation has not started.",
            "timestamp":    now.isoformat(),
            "source":       "Case Queue Monitor",
            "acknowledged": False,
        })

    # Add a static alert if no real data exists yet
    if not alerts:
        alerts.append({
            "id":           "ALT-AUTO-STATIC",
            "severity":     "low",
            "title":        "System Active — No Immediate Alerts",
            "description":  "All cases are within normal operational parameters.",
            "timestamp":    now.isoformat(),
            "source":       "System Monitor",
            "acknowledged": True,
        })

    return {
        "stats": {
            "totalAmountLost":    total_amount,
            "convictionRate":     round(
                sum(1 for c in cases if c.status.value in ("Closed", "Resolved")) / total * 100, 1
            ) if total else 0,
            "avgResolutionDays":  45,
            "activeAlerts":       sum(1 for a in alerts if not a["acknowledged"]),
        },
        "fraudTrends":          fraud_trends,
        "categoryDistribution": category_distribution,
        "priorityCases":        priority_cases,
        "alerts":               alerts,
    }
