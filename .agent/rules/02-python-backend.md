---
description: Python backend coding rules for Retrocast (Phase 1)
---

# Python Backend Rules

These rules apply to all code under `backend/`. Read `01-general.md` first.

## 1. Python Version

- Target **Python 3.11+**.
- Modern syntax is encouraged: `match/case`, `type` aliases, `str | None` union syntax.
- Do NOT use features exclusive to 3.12+ unless explicitly discussed.

## 2. Type Hints (Mandatory)

- **Every** function signature must have type hints for all parameters AND the return type.
- Use `from __future__ import annotations` at the top of every module for forward references.

```python
# ✅ Correct
def calculate_hit_rate(signals: list[Signal], threshold: float) -> float:
    ...

# ❌ Wrong – missing return type and parameter types
def calculate_hit_rate(signals, threshold):
    ...
```

## 3. Pydantic v2

- Use **Pydantic v2** for all data models (request bodies, response models, configs).
- Use `model_validator` and `field_validator` for complex validation.
- Use `model_config = ConfigDict(from_attributes=True)` when converting from ORM/dicts.
- Pydantic models go in `backend/app/models/`.

## 4. FastAPI Best Practices

- Use **dependency injection** (`Depends()`) for database sessions, settings, etc.
- Use proper HTTP status codes: `201` for creation, `204` for deletion, `404` for not found.
- Use `HTTPException` for error responses – never return raw error dicts.
- Define response models explicitly: `@router.get("/scenarios", response_model=list[ScenarioRead])`.
- Use `APIRouter` with prefixes and tags for route grouping.

## 5. Async vs Sync

- Use **sync** functions by default. SQLite operations are inherently synchronous.
- Use `async` only when performing actual I/O that benefits from it (e.g., HTTP calls to Yahoo Finance via `aiohttp`).
- Do NOT mark a function `async` just because it's in a FastAPI route – FastAPI handles sync functions correctly.

## 6. Logging

- Use Python's `logging` module. **Never use `print()` for operational output.**
- Create a module-level logger in every file:

```python
import logging
logger = logging.getLogger(__name__)
```

- Log format: `%(asctime)s [%(levelname)s] %(name)s: %(message)s`
- Log levels:
  - `DEBUG`: Detailed data flow (indicator values, row counts)
  - `INFO`: Operations (scenario created, analysis started/completed)
  - `WARNING`: Recoverable issues (missing optional data, fallback used)
  - `ERROR`: Failures (data source unavailable, computation error)

## 7. pandas Best Practices

- **Prefer vectorized operations** over row-by-row iteration.
- If row iteration is truly needed, use `itertuples()`, never `iterrows()`.
- Always reset index after filtering: `df = df[mask].reset_index(drop=True)`.
- Use explicit column selection: `df[["open", "high", "low", "close", "volume"]]`.

## 8. Import Order

Enforce this order with blank lines between groups:

```python
# 1. Standard library
import logging
from datetime import datetime
from pathlib import Path

# 2. Third-party
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException

# 3. Local
from app.models.scenario import ScenarioCreate
from app.core.engine import run_analysis
```

## 9. Testing Requirements

- Every module in `backend/app/core/` **must** have a corresponding test file in `backend/tests/`.
- Test file naming: `test_{module_name}.py` (e.g., `test_conditions.py`).
- Use `pytest` with fixtures for common test data.
- See `.agent/context/TESTING.md` for the full testing strategy.

## 10. Requirements Pinning

- Pin dependencies to **major.minor** range in `requirements.txt`:

```
fastapi>=0.115.0,<1.0.0
pandas>=2.2.0,<3.0.0
pandas-ta>=0.3.14b1,<1.0.0
pydantic>=2.10.0,<3.0.0
uvicorn>=0.34.0,<1.0.0
yfinance>=0.2.40,<1.0.0
```

- After adding any new dependency, run `pip install -r requirements.txt` and verify the build.
