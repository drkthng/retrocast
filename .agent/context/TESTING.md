# Testing Strategy

## Philosophy

We follow a **Build Verification Test** approach rather than full TDD.
The #1 priority is: **THE APP MUST ALWAYS BUILD AND RUN.**

## Build Verification (Mandatory)

After every significant change, verify:

| Phase | Check | Command |
|-------|-------|---------|
| Backend | Imports work | `python -c "from app.main import app"` |
| Backend | Server starts | `python run.py` → `/health` returns `200` |
| Frontend | Builds cleanly | `npm run build` → zero errors |
| Frontend | Dev server starts | `npm run dev` → no console errors |
| Integration | End-to-end | Backend + Frontend communicate correctly |

See `.agent/workflows/build-verify.md` for full procedures.

## Unit Tests (Required for Core Logic)

### Backend Tests (pytest)

**Location:** `backend/tests/`

| Module | What to Test |
|--------|-------------|
| `core/conditions.py` | Each operator (ABOVE, BELOW, CROSSES_ABOVE, CROSSES_BELOW) with known data. AND/OR grouping logic. |
| `core/indicators.py` | Each indicator returns correct values for known inputs. Use a small, hardcoded DataFrame with predictable values. |
| `core/engine.py` | Full pipeline with a small synthetic dataset where you know exactly which signals should be found and what the outcomes are. |
| `core/data_loader.py` | CSV loader with a sample CSV file. Yahoo/Norgate can be mocked or skipped. |
| `api/routes_scenarios.py` | CRUD operations (create, read, update, delete). |

**Naming:** `test_{module_name}.py` (e.g., `test_conditions.py`).

**Fixtures:** Use pytest fixtures in `conftest.py` for common test data (sample DataFrames, sample scenarios).

### Frontend Tests (Nice-to-Have for MVP)

- Component rendering tests are **optional** for MVP.
- TypeScript compilation with strict mode IS the test — if `npm run build` passes, types are correct.

## Test Data

Create a test fixture file: `backend/tests/fixtures/sample_data.csv`

Requirements:
- 500 rows of synthetic daily OHLCV data
- Predictable patterns (e.g., linear trend with known MA crossover points)
- Known date range for deterministic assertions
- Columns: `date,open,high,low,close,volume`

This allows tests to assert on exact signal counts and outcomes.

## When to Run Tests

| Trigger | What to Run |
|---------|-------------|
| After completing any `core/` module | That module's tests |
| After completing all backend routes | All backend tests |
| Before marking any phase as complete | ALL tests |
| After fixing any bug | Add a regression test, then run all tests |

## Test Commands

```bash
# Backend unit tests
cd backend
python -m pytest tests/ -v

# Frontend type-check (MVP test)
cd frontend
npx tsc --noEmit

# Full verification (when root package.json script exists)
npm run verify
```

## Test Quality Rules

1. **No tests that always pass.** Every test must be capable of failing.
2. **No external network calls in tests.** Mock Yahoo Finance, Norgate, etc.
3. **Deterministic assertions.** Tests should produce the same result every run.
4. **Test edge cases:** empty DataFrames, single-row data, missing columns, invalid inputs.
