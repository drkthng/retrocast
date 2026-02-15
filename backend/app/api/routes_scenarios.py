"""Scenario CRUD API routes."""

import logging

from fastapi import APIRouter, HTTPException

from app.db import repositories as repo
from app.models.scenario import ScenarioCreate, ScenarioInDB, ScenarioSummary, ScenarioUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/scenarios", tags=["scenarios"])


@router.post("", response_model=ScenarioInDB, status_code=201)
async def create_scenario(payload: ScenarioCreate):
    """Create a new scenario."""
    scenario = repo.create_scenario(payload)
    return scenario


@router.get("", response_model=list[ScenarioSummary])
async def list_scenarios():
    """List all scenarios with summary info."""
    return repo.list_scenarios()


@router.get("/{scenario_id}", response_model=ScenarioInDB)
async def get_scenario(scenario_id: str):
    """Get a single scenario by ID."""
    scenario = repo.get_scenario(scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found")
    return scenario


@router.put("/{scenario_id}", response_model=ScenarioInDB)
async def update_scenario(scenario_id: str, payload: ScenarioUpdate):
    """Update an existing scenario."""
    updated = repo.update_scenario(scenario_id, payload)
    if updated is None:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found")
    return updated


@router.delete("/{scenario_id}", status_code=204)
async def delete_scenario(scenario_id: str):
    """Delete a scenario and its cached results."""
    deleted = repo.delete_scenario(scenario_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found")
