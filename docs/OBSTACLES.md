# Obstacles & Solutions Log

## How to use this file
When you encounter a problem during development:
1. Check if it's already listed here (Ctrl+F)
2. If yes → use the documented solution
3. If no → solve it, then add an entry below **immediately**

## Entry Format

```markdown
### [SHORT_TITLE]
- **Date**: YYYY-MM-DD
- **Phase**: 1/2/3
- **Problem**: What went wrong
- **Root Cause**: Why it happened
- **Solution**: How it was fixed
- **Prevention**: How to avoid it in the future
- **Related Files**: Which files were affected
```

---

## Known Issues (Pre-documented)

### yfinance Multi-Level Columns
- **Date**: 2026-02-15 (pre-documented)
- **Phase**: 1
- **Problem**: Recent yfinance versions (>=0.2.31) return DataFrames with MultiIndex columns when downloading single tickers.
- **Root Cause**: yfinance changed its return format to always include the ticker level in columns.
- **Solution**: After download, check if columns are MultiIndex. If so: `df.columns = df.columns.get_level_values(0)`. Then rename to lowercase.
- **Prevention**: Always include the column flattening step in the data loader.
- **Related Files**: `backend/app/core/data_loader.py`

### pandas-ta Import Warning
- **Date**: 2026-02-15 (pre-documented)
- **Phase**: 1
- **Problem**: pandas-ta may show deprecation warnings with newer pandas versions.
- **Root Cause**: pandas-ta uses deprecated pandas APIs internally.
- **Solution**: Filter warnings in the indicators module:
  ```python
  import warnings
  warnings.filterwarnings('ignore', category=FutureWarning, module='pandas_ta')
  ```
- **Prevention**: Apply the filter at the top of the indicators module.
- **Related Files**: `backend/app/core/indicators.py`

### Electron + Python Process Cleanup on Windows
- **Date**: 2026-02-15 (pre-documented)
- **Phase**: 3
- **Problem**: `process.kill()` on Windows does NOT kill child processes. uvicorn spawns sub-processes that become orphaned.
- **Root Cause**: Windows does not propagate signals to child processes the way Unix does.
- **Solution**: Use `tree-kill` npm package which handles Windows process trees:
  ```typescript
  treeKill(pid, 'SIGTERM', callback)
  ```
- **Prevention**: Always use `tree-kill` for process cleanup on Windows. Never use `process.kill()` directly.
- **Related Files**: `electron/pythonManager.ts`

### TradingView Lightweight Charts Resize
- **Date**: 2026-02-15 (pre-documented)
- **Phase**: 2
- **Problem**: Charts don't auto-resize when container changes size.
- **Root Cause**: Lightweight Charts requires explicit size updates.
- **Solution**: Use `ResizeObserver` to call `chart.applyOptions({ width, height })` on container resize. Clean up observer on unmount.
- **Prevention**: Always wrap chart creation with a ResizeObserver in the component.
- **Related Files**: `frontend/src/components/charts/PriceChart.tsx`

### SQLite Concurrent Access
- **Date**: 2026-02-15 (pre-documented)
- **Phase**: 1
- **Problem**: SQLite doesn't handle concurrent writes well.
- **Root Cause**: SQLite uses file-level locking.
- **Solution**: For this app, this is fine — single user, sequential operations. If issues arise, use `check_same_thread=False` and add a threading lock.
- **Prevention**: Keep database operations sequential. No concurrent writes.
- **Related Files**: `backend/app/db/database.py`
