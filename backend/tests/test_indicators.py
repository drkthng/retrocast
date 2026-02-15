import pandas as pd
import numpy as np
import pytest
from app.core.indicators import compute_indicator

def test_sma(small_data):
    # Constant price -> SMA should be constant (after warmup)
    small_data["close"] = [10.0] * 5
    sma = compute_indicator(small_data, "SMA", {"period": 2})
    # First value NaN, others 10.0
    assert pd.isna(sma.iloc[0])
    assert sma.iloc[1] == 10.0
    assert sma.iloc[4] == 10.0

def test_price_change(small_data):
    small_data["close"] = [100.0, 110.0, 121.0, 133.1, 146.41] # +10% each time
    pct = compute_indicator(small_data, "PRICE_CHANGE", {"period": 1})
    assert pd.isna(pct.iloc[0])
    # Floating point comparison
    assert abs(pct.iloc[1] - 10.0) < 0.001
    assert abs(pct.iloc[2] - 10.0) < 0.001

def test_bbands(small_data):
    # Constant inputs -> Bands equal mean
    small_data["close"] = [10.0] * 5
    upper = compute_indicator(small_data, "BBANDS_UPPER", {"period": 2, "std": 2})
    lower = compute_indicator(small_data, "BBANDS_LOWER", {"period": 2, "std": 2})
    
    assert upper.iloc[4] == 10.0
    assert lower.iloc[4] == 10.0

def test_rsi_integration(sample_data):
    # RSI on real(ish) data
    rsi = compute_indicator(sample_data, "RSI", {"period": 14})
    assert len(rsi) == len(sample_data)
    # Check valid values range [0, 100]
    valid_rsi = rsi.dropna()
    assert ((valid_rsi >= 0) & (valid_rsi <= 100)).all()
