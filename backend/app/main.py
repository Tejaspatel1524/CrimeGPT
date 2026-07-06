import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import init_db
from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.entity import router as entity_router
from app.api.cases import router as cases_router
from app.api.evidence import router as evidence_router
from app.api.ocr import router as ocr_router
from app.api.fraud import router as fraud_router
from app.api.report import router as report_router
from app.api.notes import router as notes_router
from app.api.stats import router as stats_router
from app.api.reports_list import router as reports_list_router
from app.api.chat import router as chat_router
from app.api.brief import router as brief_router
from app.services.auth_service import get_current_user

app = FastAPI(
    title="CrimeGPT API",
    description="AI-assisted cybercrime investigation platform",
    version="1.0.0",
)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
origins_list = []
if allowed_origins == "*":
    origins_list = ["*"]
else:
    for origin in allowed_origins.split(","):
        origin_str = origin.strip()
        if origin_str:
            origins_list.append(origin_str)
            if not origin_str.startswith(("http://", "https://")):
                origins_list.append(f"https://{origin_str}")
                origins_list.append(f"http://{origin_str}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()
    # Backfill case_number for any existing records
    from app.database.database import SessionLocal
    from app.services.case_service import backfill_case_numbers
    db = SessionLocal()
    try:
        backfill_case_numbers(db)
    finally:
        db.close()


@app.get("/", tags=["Root"])
def root():
    return {"name": "CrimeGPT API", "status": "running", "docs": "/docs"}


app.include_router(health_router)
app.include_router(auth_router)

_auth = [Depends(get_current_user)]

app.include_router(users_router,    dependencies=_auth)
app.include_router(entity_router,   dependencies=_auth)
app.include_router(cases_router,    dependencies=_auth)
app.include_router(evidence_router, dependencies=_auth)
app.include_router(ocr_router,      dependencies=_auth)
app.include_router(fraud_router,    dependencies=_auth)
app.include_router(report_router,   dependencies=_auth)
app.include_router(notes_router,    dependencies=_auth)
app.include_router(stats_router,         dependencies=_auth)
app.include_router(reports_list_router,  dependencies=_auth)
app.include_router(chat_router,          dependencies=_auth)
app.include_router(brief_router,         dependencies=_auth)
