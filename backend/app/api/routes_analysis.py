"""Analysis execution and results API routes."""

import logging
import traceback
from typing import Optional

from fastapi import APIRouter, HTTPException

from app.core.engine import run_analysis
from app.db import repositories as repo
from app.models.results import AnalysisResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.post("/{scenario_id}/run", response_model=AnalysisResult)
async def run_scenario_analysis(scenario_id: str):
    """Run the analysis engine for a scenario and cache the result."""
    scenario = repo.get_scenario(scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found")

    try:
        result = run_analysis(scenario)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ImportError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Analysis failed for scenario %s: %s", scenario_id, traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    # Cache the result
    repo.save_result(result)

    return result


@router.get("/{scenario_id}/last", response_model=Optional[AnalysisResult])
async def get_last_result(scenario_id: str):
    """Get the last cached analysis result for a scenario."""
    scenario = repo.get_scenario(scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found")

    result = repo.get_result(scenario_id)
    return result
