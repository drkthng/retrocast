# Architecture Overview

## System Design

Retrocast is a **desktop application** for statistical analysis of financial markets.

```
┌──────────────────────────────────────────────────────────────┐
│                    Electron Shell (Phase 3)                   │
│  ┌─────────────────────────┐  ┌───────────────────────────┐  │
│  │   React Frontend (P2)   │  │   Python Backend (P1)     │  │
│  │                         │  │                           │  │
│  │  ┌───────────────────┐  │  │  ┌─────────────────────┐  │  │
│  │  │ Scenario Editor   │  │  │  │ FastAPI Server      │  │  │
│  │  │ Results Dashboard │──HTTP──│ Analysis Engine     │  │  │
│  │  │ Charts & Tables   │  │  │  │ Data Loaders        │  │  │
│  │  └───────────────────┘  │  │  │ Indicator Wrapper   │  │  │
│  │                         │  │  └────────┬────────────┘  │  │
│  └─────────────────────────┘  │           │               │  │
│                                │  ┌────────▼────────────┐  │  │
│                                │  │ SQLite Database     │  │  │
│                                │  └─────────────────────┘  │  │
│                                └───────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

- **Frontend** (React/TypeScript) communicates with **Backend** (Python/FastAPI) via HTTP.
- **Electron** wraps both and manages the Python sidecar process.
- **SQLite** stores scenarios and cached analysis results (as JSON blobs).
- All financial data is loaded **on-demand** from Yahoo Finance, CSV files, or Norgate Data.

## Data Flow

1. User creates a **Scenario** (conditions + targets) in the React UI.
2. Frontend sends the scenario to Backend API (`POST /api/scenarios`).
3. User clicks "Run Analysis" → Frontend calls `POST /api/analysis/{id}/run`.
4. **Backend Engine** executes:
   - a. Loads OHLCV data (Yahoo Finance / CSV / Norgate)
   - b. Computes technical indicators (pandas-ta)
   - c. Scans for signals matching the conditions
   - d. Measures forward returns for each target
   - e. Computes aggregate statistics
   - f. Returns `AnalysisResult`
5. Frontend displays results: statistics cards, signals table, price chart with overlays.
6. User can export results to CSV or Excel.

## Key Data Models

| Model | Purpose |
|-------|---------|
| `Scenario` | name, underlying ticker, data_source, conditions[], targets[] |
| `ConditionConfig` | indicator, params, operator, compare_to, compare_value |
| `TargetConfig` | days_forward, threshold_pct, direction |
| `AnalysisResult` | signals[], target_stats[], metadata |
| `Signal` | date, price, indicator_values, outcomes[] |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11+, FastAPI, pandas, pandas-ta, yfinance, SQLite |
| Frontend | React 18, TypeScript, Vite, TailwindCSS, shadcn/ui, Lightweight Charts, TanStack Table, Recharts |
| Desktop | Electron 33+, electron-builder |

## Ports

| Service | Port | Usage |
|---------|------|-------|
| Backend | `http://localhost:8000` | FastAPI server |
| Frontend Dev | `http://localhost:5173` | Vite dev server |
| Electron | Loads frontend URL (dev) or static files (prod) | — |

## Directory Structure (Target)

```
retrocast/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app, CORS, lifespan
│   │   ├── config.py               # Settings from .env
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes_scenarios.py  # Scenario CRUD
│   │   │   ├── routes_analysis.py   # Run analysis, get results
│   │   │   ├── routes_data.py       # Ticker search, OHLCV, indicators
│   │   │   └── routes_export.py     # CSV/Excel export
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── engine.py            # Main analysis pipeline
│   │   │   ├── conditions.py        # Condition evaluation logic
│   │   │   ├── indicators.py        # pandas-ta wrapper
│   │   │   └── data_loader.py       # Yahoo, CSV, Norgate loaders
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── scenario.py          # Pydantic models for scenarios
│   │   │   └── results.py           # Pydantic models for results
│   │   └── db/
│   │       ├── __init__.py
│   │       ├── database.py          # SQLite connection
│   │       └── repositories.py      # CRUD operations
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py              # Shared fixtures
│   │   ├── test_conditions.py
│   │   ├── test_indicators.py
│   │   ├── test_engine.py
│   │   ├── test_data_loader.py
│   │   └── fixtures/
│   │       └── sample_data.csv      # Synthetic test data
│   ├── requirements.txt
│   └── run.py                       # Entry point: uvicorn runner
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── layout/              # AppShell, Sidebar, PageHeader
│   │   │   ├── scenarios/           # ScenarioList, ScenarioEditor
│   │   │   ├── conditions/          # ConditionRow, ConditionBuilder
│   │   │   ├── results/             # ResultsDashboard, StatsCard
│   │   │   ├── charts/              # PriceChart, DistributionChart
│   │   │   └── ui/                  # shadcn/ui components (generated)
│   │   ├── hooks/                   # useScenarios, useAnalysis, etc.
│   │   ├── services/
│   │   │   └── api.ts               # API client + all API functions
│   │   ├── types/                   # TypeScript interfaces
│   │   └── lib/
│   │       └── utils.ts             # Utility functions
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
├── electron/
│   ├── main.ts                      # Electron main process
│   ├── preload.ts                   # Context bridge
│   ├── pythonManager.ts             # Python sidecar lifecycle
│   └── tsconfig.json
├── .agent/                          # Agent governance (this directory)
├── docs/                            # Progress tracking
├── .gitignore
├── .env.example
├── .env                             # Local only, never committed
├── package.json                     # Root: scripts for dev/build
└── README.md
```

## API Endpoints (Planned)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api/scenarios` | List all scenarios |
| `POST` | `/api/scenarios` | Create scenario |
| `GET` | `/api/scenarios/{id}` | Get scenario by ID |
| `PUT` | `/api/scenarios/{id}` | Update scenario |
| `DELETE` | `/api/scenarios/{id}` | Delete scenario |
| `POST` | `/api/analysis/{id}/run` | Run analysis for scenario |
| `GET` | `/api/analysis/{id}/results` | Get analysis results |
| `GET` | `/api/data/search?q=` | Search tickers |
| `GET` | `/api/data/ohlcv/{ticker}` | Get OHLCV data |
| `GET` | `/api/data/indicators` | List available indicators |
| `GET` | `/api/export/{id}/csv` | Export results as CSV |
| `GET` | `/api/export/{id}/excel` | Export results as Excel |
