# Code Conventions

All agents must follow these conventions. Consistency across phases is critical for maintainability.

## Naming

### Python (Backend)

| Element | Convention | Example |
|---------|-----------|---------|
| Files | snake_case | `data_loader.py`, `routes_scenarios.py` |
| Classes | PascalCase | `ScenarioCreate`, `AnalysisResult` |
| Functions | snake_case | `run_analysis`, `load_data` |
| Variables | snake_case | `total_signals`, `hit_rate_pct` |
| Constants | UPPER_SNAKE_CASE | `MAX_PERIOD`, `DEFAULT_PORT` |
| Pydantic models | PascalCase, descriptive | `ConditionConfig` (not `Condition`) |

### TypeScript (Frontend)

| Element | Convention | Example |
|---------|-----------|---------|
| Component files | PascalCase | `ScenarioEditor.tsx` |
| Utility files | camelCase | `api.ts`, `utils.ts` |
| Components | PascalCase | `ScenarioList`, `ConditionRow` |
| Props interfaces | `{ComponentName}Props` | `ScenarioEditorProps` |
| Hooks | camelCase with `use` prefix | `useScenarios`, `useAnalysis` |
| Variables/functions | camelCase | `totalSignals`, `formatPercent` |
| Constants | UPPER_SNAKE_CASE | `INDICATORS`, `API_BASE_URL` |
| Types/Interfaces | PascalCase | `Scenario`, `AnalysisResult` |
| Enums/Unions | PascalCase type, UPPER values | `type Direction = "ABOVE" \| "BELOW"` |

### General Naming Patterns

| Pattern | Prefix | Example |
|---------|--------|---------|
| Boolean variables | `is` / `has` / `should` | `isLoading`, `hasResults`, `shouldRetry` |
| Event handlers | `handle` | `handleSubmit`, `handleDelete` |
| API functions | verb | `getScenarios`, `createScenario`, `runAnalysis` |

## Indicator Column Naming Convention

When computing indicators and storing as DataFrame columns, use this format consistently in **both** backend (Python) and frontend (TypeScript):

```
{INDICATOR}_{PARAM1}_{PARAM2}
```

| Indicator | Column Name |
|-----------|-------------|
| SMA 200-day | `SMA_200` |
| RSI 14-day | `RSI_14` |
| Bollinger Upper 20,2.0 | `BBANDS_UPPER_20_2.0` |
| MACD 12,26,9 | `MACD_12_26_9` |

This consistency is **critical** — the frontend uses these column names to render chart overlays.

## API Response Format

| Rule | Detail |
|------|--------|
| Format | JSON (always) |
| Dates | ISO 8601: `"YYYY-MM-DD"` (no time for daily data) |
| Numbers | Raw numbers, no string formatting (frontend handles display) |
| Errors | `{"detail": "Human-readable error message"}` |
| Empty lists | Return `[]`, never `null` |
| Optional fields | Return `null`, never omit the field from the response |

## File Organization

- **Max 300 lines per file.** Split into logical sub-modules if exceeded.
- **Import order (Python):** stdlib → third-party → local (separated by blank lines).
- **Import order (TypeScript):** react → third-party → local (separated by blank lines).
- **One component per file** (React).
- Related types can share a file if under 50 lines total; otherwise, separate them.

## Error Messages

### User-Facing (shown in UI)

Clear, actionable, non-technical:
> "Failed to load data for SPY. Check your internet connection or try a different ticker."

### Log Messages (written to log)

Technical, detailed, with context:
> `yfinance.download raised ConnectionError for ticker=SPY, start=2020-01-01: {str(e)}`
