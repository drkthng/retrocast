<div align="center">

# ⏪ Retrocast

### Look back. Quantify forward.

A desktop application for statistical scenario analysis of financial markets.  
Built with Python, React, and Electron.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-green.svg)](https://python.org)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev)
[![Electron](https://img.shields.io/badge/Electron-33+-47848F.svg)](https://electronjs.org)

[Screenshots placeholder – will be added after MVP]

</div>

---

## What is Retrocast?

Retrocast is **not** a backtester. It's a **statistical scenario analyzer**.

Instead of testing a full trading strategy with entries, exits, and position 
sizing, Retrocast answers **probabilistic questions** about market behavior:

> *"In what percentage of cases was SPY trading 10% lower after 30 days, 
> when it was above its 200-day moving average?"*

> *"When AAPL's RSI(14) crossed above 30, how often was the stock 5% higher 
> after 60 days?"*

You define **conditions** (technical indicator-based rules) and **targets** 
(what to measure N days later). Retrocast scans years of historical data, 
finds every occurrence matching your conditions, and computes detailed 
statistics on what happened next.

### Key Features

- 📊 **Configurable Scenarios** – Combine multiple technical indicators 
  with AND/OR logic
- 📈 **17+ Technical Indicators** – SMA, EMA, RSI, Bollinger Bands, MACD, 
  ATR, ADX, Stochastic, and more
- 🎯 **Multiple Targets** – Measure forward returns at different time 
  horizons simultaneously (10d, 30d, 60d, 90d...)
- 📉 **Interactive Charts** – TradingView-quality charts with signal 
  markers and indicator overlays
- 📋 **Detailed Statistics** – Hit rates, distributions, percentiles, 
  averages, standard deviation
- 📁 **Multiple Data Sources** – Yahoo Finance, CSV files, Norgate Data
- 💾 **Export Results** – CSV and Excel export
- 🖥️ **Desktop App** – Native Windows application with Start Menu shortcut

## How It Works
CREATE a Scenario
├── Pick an underlying (e.g., SPY)
├── Define conditions (e.g., Close > SMA(200) AND RSI(14) > 50)
└── Set targets (e.g., "30 days later, 10% lower?")

RUN the Analysis
├── Retrocast scans all historical data
├── Finds every date matching your conditions
└── Measures what happened N days after each signal

REVIEW the Results
├── Hit rate: 73.2% of signals matched the target
├── Distribution chart of all forward returns
├── Click any signal to see it on a chart
└── Export everything to CSV/Excel

## Screenshots

> *Screenshots will be added after MVP completion*

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or higher
- [Python](https://python.org/) 3.11 or higher
- pip (comes with Python)
- (Optional) [Norgate Data](https://norgatedata.com/) subscription with 
  NDU installed

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/retrocast.git
cd retrocast

# Install Node dependencies (also installs frontend deps)
npm install

# Install Python dependencies
cd backend
pip install -r requirements.txt
cd ..

# Configure environment
cp .env.example .env
# Edit .env if needed (defaults work out of the box)
```

### Running in Development

```bash
npm run dev
```

This single command starts:
- 🐍 Python backend on http://localhost:8000
- ⚛️ React frontend on http://localhost:5173
- 🖥️ Electron window loading the frontend

### Building for Windows

```bash
# Full build (frontend + Python executable + Electron installer)
npm run build:full
```

The installer will be created in `dist-electron/`.
Double-click `Retrocast-Setup-x.x.x.exe` to install.

## Project Structure

```text
retrocast/
├── backend/          # Python FastAPI backend
│   ├── app/
│   │   ├── api/      # REST API endpoints
│   │   ├── core/     # Analysis engine, indicators, conditions
│   │   ├── models/   # Pydantic data models
│   │   └── db/       # SQLite database layer
│   └── tests/        # Backend tests
├── frontend/         # React TypeScript frontend
│   └── src/
│       ├── components/  # UI components
│       ├── hooks/       # Custom React hooks
│       ├── services/    # API client
│       └── types/       # TypeScript type definitions
├── electron/         # Electron desktop shell
├── .agent/           # AI agent governance files
└── docs/             # Progress tracking & documentation
```

## Data Sources

### Yahoo Finance (Default)
No setup required. Just enter a ticker symbol (e.g., SPY, AAPL, BTC-USD).
Data is fetched automatically via the `yfinance` library.

### CSV Files
Place CSV files in the `data/csv/` directory. Expected format:

```csv
Date,Open,High,Low,Close,Volume
2024-01-02,472.65,473.53,468.37,472.65,52345600
```

The date column is auto-detected. Column names are flexible.

### Norgate Data (Optional)
If you have a Norgate Data subscription:
1. Install Norgate Data Updater (NDU) and keep it running
2. Install the Python package: `pip install norgatedata`
3. Select "Norgate" as data source when creating a scenario

## Supported Indicators

| Category | Indicators |
|----------|------------|
| Trend | SMA, EMA, ADX |
| Momentum | RSI, MACD, MACD Signal, MACD Histogram, Stochastic %K/%D |
| Volatility | Bollinger Bands (Upper/Middle/Lower), ATR |
| Price | Price Change %, Highest High, Lowest Low |
| Volume | Volume Ratio (vs. moving average) |

## Condition Operators

| Operator | Description | Example |
|----------|-------------|---------|
| Above | Value is greater than reference | `Close > SMA(200)` |
| Below | Value is less than reference | `RSI(14) < 30` |
| Crosses Above | Was below, now above | `SMA(50) crosses above SMA(200)` |
| Crosses Below | Was above, now below | `Close crosses below BBANDS Lower` |

Conditions can be combined with AND / OR logic.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.11, FastAPI, pandas, pandas-ta, yfinance, SQLite |
| Frontend | React 18, TypeScript, Vite, TailwindCSS, shadcn/ui, TradingView Lightweight Charts, TanStack Table, Recharts |
| Desktop | Electron 33, electron-builder |

## Configuration
All configuration is done via the `.env` file:

```env
DB_PATH=./data/scenarios.db    # SQLite database location
DATA_DIR=./data                # General data directory
CSV_IMPORT_DIR=./data/csv      # Where to place CSV files
HOST=127.0.0.1                 # Backend host
PORT=8000                      # Backend port
```

## Contributing
This project is primarily developed using AI-assisted coding (Antigravity).
If you'd like to contribute:
1. Check `docs/PROGRESS.md` for current status
2. Check `docs/BACKLOG.md` for planned features
3. Read `.agent/workflows/new-agent-onboarding.md` for development guidelines

## License
MIT License – see [LICENSE](LICENSE) for details.

<div align="center">
Retrocast – Look back. Quantify forward. ⏪

</div>
