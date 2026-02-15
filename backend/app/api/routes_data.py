"""Data access API routes (search, preview, OHLCV, indicators)."""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.core.data_loader import load_data
from app.core.indicators import compute_indicator
from app.core.conditions import get_column_name
from app.models.scenario import DataSource

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/data", tags=["data"])


@router.get("/search")
async def search_tickers(q: str = Query(min_length=1, description="Search query")):
    """Search tickers via yfinance."""
    try:
        import yfinance as yf

        ticker = yf.Ticker(q)
        info = ticker.info

        results = []
        if info and info.get("symbol"):
            results.append({
                "symbol": info.get("symbol", q.upper()),
                "name": info.get("longName") or info.get("shortName", ""),
                "exchange": info.get("exchange", ""),
            })
        return results

    except Exception as e:
        logger.warning("Ticker search failed for '%s': %s", q, str(e))
        return []


@router.get("/preview")
async def preview_data(
    ticker: str = Query(min_length=1),
    source: DataSource = DataSource.YAHOO,
    csv_path: Optional[str] = None,
):
    """Preview data availability for a ticker/source."""
    try:
        df = load_data(ticker=ticker, source=source, csv_path=csv_path)
    except (ValueError, ImportError) as e:
        raise HTTPException(status_code=400, detail=str(e))

    sample_count = min(5, len(df))
    sample_rows = []
    for i in range(sample_count):
        row = df.iloc[i]
        sample_rows.append({
            "date": df.index[i].strftime("%Y-%m-%d"),
            "open": round(float(row["open"]), 4),
            "high": round(float(row["high"]), 4),
            "low": round(float(row["low"]), 4),
            "close": round(float(row["close"]), 4),
            "volume": int(row["volume"]),
        })

    return {
        "first_date": df.index[0].strftime("%Y-%m-%d"),
        "last_date": df.index[-1].strftime("%Y-%m-%d"),
        "total_bars": len(df),
        "sample_rows": sample_rows,
    }


@router.get("/ohlcv")
async def get_ohlcv(
    ticker: str = Query(min_length=1),
    source: DataSource = DataSource.YAHOO,
    start: Optional[str] = None,
    end: Optional[str] = None,
    csv_path: Optional[str] = None,
):
    """Get OHLCV data for charting."""
    try:
        df = load_data(ticker=ticker, source=source, start=start, end=end, csv_path=csv_path)
    except (ValueError, ImportError) as e:
        raise HTTPException(status_code=400, detail=str(e))

    rows = []
    for i in range(len(df)):
        row = df.iloc[i]
        rows.append({
            "date": df.index[i].strftime("%Y-%m-%d"),
            "open": round(float(row["open"]), 4),
            "high": round(float(row["high"]), 4),
            "low": round(float(row["low"]), 4),
            "close": round(float(row["close"]), 4),
            "volume": int(row["volume"]),
        })

    return rows


@router.get("/indicators")
async def get_indicators(
    ticker: str = Query(min_length=1),
    source: DataSource = DataSource.YAHOO,
    start: Optional[str] = None,
    end: Optional[str] = None,
    indicators: str = Query(description="Comma-separated, e.g. SMA_200,RSI_14"),
    csv_path: Optional[str] = None,
):
    """Compute indicators on the fly for chart overlay."""
    try:
        df = load_data(ticker=ticker, source=source, start=start, end=end, csv_path=csv_path)
    except (ValueError, ImportError) as e:
        raise HTTPException(status_code=400, detail=str(e))

    indicator_specs = [s.strip() for s in indicators.split(",") if s.strip()]

    result_indicators: dict[str, list] = {}
    for spec in indicator_specs:
        indicator_name, params = _parse_indicator_spec(spec)
        try:
            col_name = get_column_name(indicator_name, params)
            series = compute_indicator(df, indicator_name, params)
            result_indicators[col_name] = [
                round(float(v), 4) if not _isnan(v) else None
                for v in series
            ]
        except Exception as e:
            logger.warning("Failed to compute indicator '%s': %s", spec, str(e))
            continue

    dates = [d.strftime("%Y-%m-%d") for d in df.index]

    return {
        "dates": dates,
        "indicators": result_indicators,
    }


def _parse_indicator_spec(spec: str) -> tuple[str, dict]:
    """
    Parse a spec like 'SMA_200' or 'RSI_14' into (indicator_name, params).

    Handles:
        SMA_200         → ("SMA", {"period": 200})
        RSI_14          → ("RSI", {"period": 14})
        BBANDS_UPPER_20 → ("BBANDS_UPPER", {"period": 20})
        MACD_12_26_9    → ("MACD", {"fast": 12, "slow": 26, "signal": 9})
    """
    # Known multi-word indicators
    multi_word = [
        "BBANDS_UPPER", "BBANDS_MIDDLE", "BBANDS_LOWER",
        "MACD_SIGNAL", "MACD_HIST",
        "STOCH_K", "STOCH_D",
        "PRICE_CHANGE", "VOLUME_RATIO",
    ]

    for mw in multi_word:
        if spec.startswith(mw + "_"):
            remainder = spec[len(mw) + 1:]
            parts = remainder.split("_")
            return mw, _params_from_parts(mw, parts)
        elif spec == mw:
            return mw, _default_params(mw)

    # Single-word indicators: SMA_200, RSI_14, etc.
    parts = spec.split("_")
    indicator_name = parts[0]
    param_parts = parts[1:]

    return indicator_name, _params_from_parts(indicator_name, param_parts)


def _params_from_parts(indicator: str, parts: list[str]) -> dict:
    """Convert numeric string parts into the appropriate params dict."""
    nums = []
    for p in parts:
        try:
            nums.append(float(p) if "." in p else int(p))
        except ValueError:
            continue

    if indicator in ("MACD", "MACD_SIGNAL", "MACD_HIST"):
        return {
            "fast": nums[0] if len(nums) > 0 else 12,
            "slow": nums[1] if len(nums) > 1 else 26,
            "signal": nums[2] if len(nums) > 2 else 9,
        }
    elif indicator in ("STOCH_K", "STOCH_D"):
        return {
            "k": nums[0] if len(nums) > 0 else 14,
            "d": nums[1] if len(nums) > 1 else 3,
        }
    elif indicator in ("BBANDS_UPPER", "BBANDS_MIDDLE", "BBANDS_LOWER"):
        return {
            "period": nums[0] if len(nums) > 0 else 20,
            "std": nums[1] if len(nums) > 1 else 2,
        }
    else:
        return {"period": nums[0] if nums else 14}


def _default_params(indicator: str) -> dict:
    """Return default params when no numbers are given."""
    if indicator in ("MACD", "MACD_SIGNAL", "MACD_HIST"):
        return {"fast": 12, "slow": 26, "signal": 9}
    elif indicator in ("STOCH_K", "STOCH_D"):
        return {"k": 14, "d": 3}
    elif indicator in ("BBANDS_UPPER", "BBANDS_MIDDLE", "BBANDS_LOWER"):
        return {"period": 20, "std": 2}
    else:
        return {"period": 14}


def _isnan(val) -> bool:
    """Check if a value is NaN."""
    import math
    try:
        return math.isnan(float(val))
    except (ValueError, TypeError):
        return True
