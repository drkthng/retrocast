"""Load OHLCV data from various sources (Yahoo Finance, CSV, Norgate)."""

import logging
import time
from typing import Optional

import pandas as pd

from app.models.scenario import DataSource

logger = logging.getLogger(__name__)


def load_data(
    ticker: str,
    source: DataSource,
    start: Optional[str] = None,
    end: Optional[str] = None,
    timeframe: str = "DAILY",
    csv_path: Optional[str] = None,
) -> pd.DataFrame:
    """
    Load OHLCV data from the specified source.

    Returns a DataFrame with lowercase columns: open, high, low, close, volume
    and a DatetimeIndex named 'date'. Sorted ascending by date.
    """
    # TODO: Implement weekly/intraday resampling for other timeframes
    t0 = time.time()

    if source == DataSource.YAHOO:
        df = _load_yahoo(ticker, start, end)
    elif source == DataSource.CSV:
        if not csv_path:
            raise ValueError("csv_path is required when data_source is CSV")
        df = _load_csv(csv_path)
    elif source == DataSource.NORGATE:
        df = _load_norgate(ticker)
    else:
        raise ValueError(f"Unsupported data source: {source}")

    # Standardize column names to lowercase
    df.columns = [c.lower() for c in df.columns]

    # Ensure required columns exist
    required = {"open", "high", "low", "close", "volume"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    # Ensure numeric types
    for col in ["open", "high", "low", "close", "volume"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Remove rows with NaN close price
    df = df.dropna(subset=["close"])

    # Ensure DatetimeIndex
    if not isinstance(df.index, pd.DatetimeIndex):
        if "date" in df.columns:
            df["date"] = pd.to_datetime(df["date"])
            df = df.set_index("date")
        else:
            raise ValueError("Could not find a date column or DatetimeIndex")

    df.index.name = "date"

    # Sort ascending by date
    df = df.sort_index(ascending=True)

    # Apply date range filters after loading
    if start:
        df = df[df.index >= pd.Timestamp(start)]
    if end:
        df = df[df.index <= pd.Timestamp(end)]

    elapsed = time.time() - t0
    logger.info(
        "Loaded %d bars for %s from %s (%s to %s) in %.2fs",
        len(df), ticker, source.value,
        df.index[0].strftime("%Y-%m-%d") if len(df) > 0 else "N/A",
        df.index[-1].strftime("%Y-%m-%d") if len(df) > 0 else "N/A",
        elapsed,
    )
    return df


def _load_yahoo(ticker: str, start: Optional[str], end: Optional[str]) -> pd.DataFrame:
    """Load data via yfinance."""
    import yfinance as yf

    df = yf.download(ticker, start=start, end=end, auto_adjust=True, progress=False)

    if df.empty:
        raise ValueError(f"No data returned from Yahoo Finance for ticker '{ticker}'")

    # Handle multi-level columns from recent yfinance versions
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    return df


def _load_csv(csv_path: str) -> pd.DataFrame:
    """Load data from a local CSV file."""
    df = pd.read_csv(csv_path)

    # Try to auto-detect date column (common names)
    date_candidates = ["date", "Date", "DATE", "datetime", "Datetime", "timestamp"]
    date_col = None
    for col in date_candidates:
        if col in df.columns:
            date_col = col
            break

    if date_col is None:
        # Try the first column if it looks like dates
        first_col = df.columns[0]
        try:
            pd.to_datetime(df[first_col].head())
            date_col = first_col
        except (ValueError, TypeError):
            raise ValueError(
                f"Could not auto-detect date column in CSV. "
                f"Available columns: {list(df.columns)}"
            )

    df[date_col] = pd.to_datetime(df[date_col])
    df = df.set_index(date_col)
    df.index.name = "date"

    return df


def _load_norgate(ticker: str) -> pd.DataFrame:
    """Load data from Norgate Data (requires local installation)."""
    try:
        import norgatedata
    except ImportError:
        raise ImportError(
            "Norgate Data is not installed. "
            "Install the norgatedata package and Norgate Data Updater to use this source."
        )

    data = norgatedata.price_timeseries(
        ticker,
        stock_price_adjustment_setting=norgatedata.StockPriceAdjustmentType.TOTALRETURN,
        padding_setting=norgatedata.PaddingType.NONE,
    )

    if data is None or len(data) == 0:
        raise ValueError(f"No data returned from Norgate for ticker '{ticker}'")

    # Norgate returns a numpy recarray, convert to DataFrame
    df = pd.DataFrame(data)
    
    # Norgate includes a 'Date' column in the recarray, set it as index
    if "Date" in df.columns:
        df["Date"] = pd.to_datetime(df["Date"])
        df = df.set_index("Date")
        df.index.name = "date"

    return df
