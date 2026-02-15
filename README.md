# Scenario Analyzer

A desktop application for statistical analysis of financial markets. Define scenarios with technical indicator conditions, run them against historical price data, and analyze the results with interactive charts and statistics.

**[Screenshots will be added after MVP]**

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Python](https://www.python.org/) 3.11+
- pip (comes with Python)
- *(Optional)* [Norgate Data](https://norgatedata.com/) subscription + NDU installed

## Quick Start

```bash
# Clone the repository
git clone <repo-url>
cd scenario-analyzer

# Install Node dependencies
npm install

# Install Python dependencies
cd backend
pip install -r requirements.txt
cd ..

# Create environment config
cp .env.example .env
# Edit .env if needed (defaults work for most setups)

# Start development mode
npm run dev
```

## Project Structure

```
scenario-analyzer/
├── backend/          # Python FastAPI backend (Phase 1)
│   ├── app/          # Application code
│   │   ├── api/      # Route handlers
│   │   ├── core/     # Business logic (engine, conditions, indicators)
│   │   ├── models/   # Pydantic data models
│   │   └── db/       # SQLite database layer
│   └── tests/        # pytest unit tests
├── frontend/         # React TypeScript frontend (Phase 2)
│   └── src/
│       ├── components/  # UI components
│       ├── hooks/       # Custom React hooks
│       ├── services/    # API client
│       └── types/       # TypeScript interfaces
├── electron/         # Electron desktop shell (Phase 3)
├── .agent/           # Agent governance (rules, workflows, context)
└── docs/             # Progress tracking, changelog, obstacles
```

## Development

### Running in Dev Mode

```bash
npm run dev
```

This starts all three services concurrently:
- **Backend** at `http://localhost:8000`
- **Frontend** at `http://localhost:5173`
- **Electron** window loading the frontend

### Running Individual Components

```bash
# Backend only
cd backend
python run.py

# Frontend only
cd frontend
npm run dev
```

## Building

### Windows Installer

```bash
# Build the frontend
cd frontend && npm run build && cd ..

# Bundle the Python backend
cd backend && pyinstaller scenario-analyzer.spec && cd ..

# Build the Electron installer
npm run build:electron
```

The installer will be generated in `dist-electron/`.

## Configuration

Copy `.env.example` to `.env` and adjust values:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PATH` | `./data/scenarios.db` | SQLite database location |
| `DATA_DIR` | `./data` | Data directory for cache |
| `CSV_IMPORT_DIR` | `./data/csv` | Directory for CSV file imports |
| `HOST` | `127.0.0.1` | Backend server host |
| `PORT` | `8000` | Backend server port |

## Data Sources

### Yahoo Finance (Default)
No setup required. Enter any valid ticker symbol (e.g., `SPY`, `AAPL`, `MSFT`) and data is fetched automatically.

### CSV Files
Place CSV files in the `data/csv/` directory. Required columns: `date`, `open`, `high`, `low`, `close`, `volume`.

### Norgate Data (Optional)
Requires a Norgate Data subscription and NDU (Norgate Data Updater) installed locally. No API key configuration needed — the app accesses Norgate's local database directly.

## For AI Agents

If you are an AI agent working on this project, start by reading:
`.agent/workflows/new-agent-onboarding.md`

## License

MIT
