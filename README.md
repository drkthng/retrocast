# Scenario Analyzer

Statistical scenario analysis tool for financial markets. This application integrates a Python FastAPI backend and a React Vite frontend into a single Windows desktop application using Electron.

## Project Structure

- `frontend/`: React Vite app (Frontend)
- `backend/`: Python FastAPI app (Backend)
- `electron/`: Electron main process and preload scripts
- `scripts/`: Helper scripts for development and building
- `resources/`: Application icons and assets

## Prerequisites

- **Node.js**: 18.x or higher
- **Python**: 3.11.x or higher
- **Pip Packages**: `fastapi`, `uvicorn`, `pydantic`, etc. (See `backend/requirements.txt`)

## Quick Start

1. **Clone the repository**
2. **Install dependencies**
   ```bash
   npm install
   cd backend && pip install -r requirements.txt
   ```
3. **Configuration**
   - Copy `backend/.env.example` to `backend/.env` (if applicable)
4. **Run Development Mode**
   ```bash
   npm run dev
   ```
   This command starts the Python backend, the React frontend dev server, and the Electron wrapper concurrently.

## Building for Windows

To create a production-ready Windows installer:

```bash
npm run build:full
```

This will:
1. Build the React frontend (`frontend/dist`)
2. Package the Python backend using PyInstaller (`backend/dist`)
3. Compile the Electron TypeScript code
4. Create an NSIS installer using `electron-builder`

The installer will be located in the `dist-electron/` folder.

## Norgate Data Setup (Optional)

If using Norgate Data, ensure the Norgate Data Desktop Service is running and the Python library is correctly configured.

## CSV Import Format

(Add description of CSV format here)

## Tech Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS
- **Backend**: Python 3.11, FastAPI, PyInstaller
- **Desktop**: Electron 33, electron-builder, tree-kill
