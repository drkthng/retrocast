"""FastAPI application entry point."""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_analysis import router as analysis_router
from app.api.routes_data import router as data_router
from app.api.routes_export import router as export_router
from app.api.routes_scenarios import router as scenarios_router
from app.config import settings
from app.db.database import init_database

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def _detect_norgate() -> None:
    """Try to import norgatedata and set the config flag."""
    try:
        import norgatedata  # noqa: F401
        settings.norgate_available = True
        logger.info("Norgate Data detected and available")
    except ImportError:
        settings.norgate_available = False
        logger.info("Norgate Data not available (norgatedata not installed)")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("Starting Retrocast API...")
    init_database()
    _detect_norgate()
    os.makedirs(settings.data_dir, exist_ok=True)
    os.makedirs(settings.csv_import_dir, exist_ok=True)
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="Retrocast API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include route modules
app.include_router(scenarios_router)
app.include_router(analysis_router)
app.include_router(data_router)
app.include_router(export_router)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "version": "1.0.0"}
