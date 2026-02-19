"""Pydantic models for analysis results."""

from typing import Optional

from pydantic import BaseModel


class SignalOutcome(BaseModel):
    """Outcome of a single target evaluation for a signal."""

    target_id: str
    days_forward: int
    threshold_pct: float
    direction: str
    future_date: Optional[str] = None
    future_price: Optional[float] = None
    actual_change_pct: Optional[float] = None
    max_change_pct: Optional[float] = None  # Max favourable % move during the window
    hit: Optional[bool] = None


class Signal(BaseModel):
    """A single signal (date where all conditions were met)."""

    date: str
    price: float
    indicator_values: dict
    outcomes: list[SignalOutcome]


class TargetStats(BaseModel):
    """Aggregate statistics for a single target across all signals."""

    target_id: str
    days_forward: int
    threshold_pct: float
    direction: str
    total_evaluable: int
    hit_count: int
    miss_count: int
    hit_rate_pct: float
    avg_change_pct: float
    median_change_pct: float
    max_change_pct: float
    min_change_pct: float
    std_dev: float
    percentile_5: float
    percentile_25: float
    percentile_75: float
    percentile_95: float
    distribution: list[float]


class AnalysisResult(BaseModel):
    """Complete result of running an analysis on a scenario."""

    scenario_id: str
    scenario_name: str
    underlying: str
    run_date: str
    data_start: str
    data_end: str
    total_bars: int
    total_signals: int
    target_stats: list[TargetStats]
    signals: list[Signal]
