"""Technical indicator computation wrapper using 'ta' library."""

import logging
import pandas as pd
import ta

logger = logging.getLogger(__name__)


def compute_indicator(df: pd.DataFrame, indicator: str, params: dict) -> pd.Series:
    """
    Compute a technical indicator and return as a Series.

    The caller adds the result to the DataFrame with the appropriate column name.
    NaN values in the initial bars (where not enough data exists) are expected.
    """
    indicator = indicator.upper()

    # Ensure inputs are Series
    close = df["close"]
    high = df["high"]
    low = df["low"]
    # volume = df["volume"]  # If needed for OBV etc

    if indicator == "SMA":
        return ta.trend.SMAIndicator(close=close, window=params["period"], fillna=False).sma_indicator()

    elif indicator == "EMA":
        return ta.trend.EMAIndicator(close=close, window=params["period"], fillna=False).ema_indicator()

    elif indicator == "RSI":
        return ta.momentum.RSIIndicator(close=close, window=params["period"], fillna=False).rsi()

    elif indicator in ("BBANDS_UPPER", "BBANDS_MIDDLE", "BBANDS_LOWER"):
        period = params["period"]
        std = params.get("std", 2)
        bb = ta.volatility.BollingerBands(close=close, window=period, window_dev=std, fillna=False)
        
        if indicator == "BBANDS_LOWER":
            return bb.bollinger_lband()
        elif indicator == "BBANDS_MIDDLE":
            return bb.bollinger_mavg()
        else:  # BBANDS_UPPER
            return bb.bollinger_hband()

    elif indicator in ("MACD", "MACD_SIGNAL", "MACD_HIST"):
        fast = params.get("fast", 12)
        slow = params.get("slow", 26)
        signal = params.get("signal", 9)
        macd = ta.trend.MACD(close=close, window_slow=slow, window_fast=fast, window_sign=signal, fillna=False)
        
        if indicator == "MACD":
            return macd.macd()
        elif indicator == "MACD_SIGNAL":
            return macd.macd_signal()
        else:  # MACD_HIST
            return macd.macd_diff()

    elif indicator == "ATR":
        return ta.volatility.AverageTrueRange(high=high, low=low, close=close, window=params["period"], fillna=False).average_true_range()

    elif indicator in ("STOCH_K", "STOCH_D"):
        k = params.get("k", 14)
        d = params.get("d", 3)
        stoch = ta.momentum.StochasticOscillator(high=high, low=low, close=close, window=k, smooth_window=d, fillna=False)
        
        if indicator == "STOCH_K":
            return stoch.stoch()
        else:  # STOCH_D (signal line for stochastic)
            return stoch.stoch_signal()

    elif indicator == "ADX":
        return ta.trend.ADXIndicator(high=high, low=low, close=close, window=params["period"], fillna=False).adx()

    elif indicator == "PRICE_CHANGE":
        period = params["period"]
        shifted = close.shift(period)
        return (close - shifted) / shifted * 100

    elif indicator == "VOLUME_RATIO":
        period = params["period"]
        vol_sma = df["volume"].rolling(period).mean()
        return df["volume"] / vol_sma

    elif indicator == "HIGHEST":
        period = params["period"]
        return close.rolling(period).max()

    elif indicator == "LOWEST":
        period = params["period"]
        return close.rolling(period).min()

    else:
        raise ValueError(f"Unsupported indicator: {indicator}")
