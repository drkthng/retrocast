"""Main analysis engine — the heart of Retrocast."""

import logging
import time
from datetime import datetime, timezone

import numpy as np
import pandas as pd

from app.core.conditions import evaluate_conditions, get_column_name
from app.core.data_loader import load_data
from app.core.indicators import compute_indicator
from app.models.results import AnalysisResult, Signal, SignalOutcome, TargetStats
from app.models.scenario import CompareTo, ScenarioInDB

logger = logging.getLogger(__name__)

# Minimum number of bars required to run analysis
MIN_BARS = 252


def run_analysis(scenario: ScenarioInDB) -> AnalysisResult:
    """
    Main analysis pipeline:
    1. Load data
    2. Compute indicators
    3. Find signals
    4. Evaluate targets
    5. Compute statistics
    6. Return AnalysisResult
    """
    pipeline_start = time.time()

    # -------------------------------------------------------------------------
    # 1. LOAD DATA
    # -------------------------------------------------------------------------
    t0 = time.time()
    df = load_data(
        ticker=scenario.underlying,
        source=scenario.data_source,
        start=scenario.date_range_start,
        end=scenario.date_range_end,
        timeframe=scenario.timeframe.value,
        csv_path=scenario.csv_path,
    )

    if len(df) < MIN_BARS:
        raise ValueError(
            f"Not enough data: got {len(df)} bars, need at least {MIN_BARS}. "
            f"Try a wider date range or different ticker."
        )

    logger.info("Step 1 — Data loaded in %.2fs", time.time() - t0)

    # -------------------------------------------------------------------------
    # 2. COMPUTE INDICATORS
    # -------------------------------------------------------------------------
    t0 = time.time()
    indicator_columns: list[str] = []

    # Compute indicators for ALL conditions (both left and right side)
    for condition in scenario.conditions:
        # LEFT side indicator
        if condition.indicator != "PRICE":
            col_name = get_column_name(condition.indicator.value, condition.params)
            if col_name not in df.columns:
                df[col_name] = compute_indicator(df, condition.indicator.value, condition.params)
            indicator_columns.append(col_name)

        # RIGHT side indicator (if comparing to another indicator)
        if condition.compare_to == CompareTo.INDICATOR and condition.compare_indicator:
            compare_col = get_column_name(condition.compare_indicator.value, condition.compare_indicator_params)
            if compare_col not in df.columns:
                df[compare_col] = compute_indicator(df, condition.compare_indicator.value, condition.compare_indicator_params)
            indicator_columns.append(compare_col)

    # Deduplicate
    indicator_columns = list(dict.fromkeys(indicator_columns))
    logger.info("Step 2 — %d indicators computed in %.2fs", len(indicator_columns), time.time() - t0)

    # -------------------------------------------------------------------------
    # 3. FIND SIGNALS
    # -------------------------------------------------------------------------
    t0 = time.time()

    # Determine minimum lookback — start scanning after enough data exists
    min_lookback = _compute_min_lookback(scenario)
    start_idx = max(min_lookback, 1)  # At least 1 for CROSSES operators

    signals: list[Signal] = []
    for idx in range(start_idx, len(df)):
        if evaluate_conditions(df, idx, scenario.conditions):
            row = df.iloc[idx]
            signal_date = df.index[idx]

            # Record indicator values at signal point
            ind_values = {}
            for condition in scenario.conditions:
                if condition.indicator != "PRICE":
                    col = get_column_name(condition.indicator.value, condition.params)
                    val = row[col]
                    if pd.notna(val):
                        ind_values[col] = round(float(val), 4)
                if condition.compare_to == CompareTo.INDICATOR and condition.compare_indicator:
                    col = get_column_name(condition.compare_indicator.value, condition.compare_indicator_params)
                    val = row[col]
                    if pd.notna(val):
                        ind_values[col] = round(float(val), 4)

            signals.append(
                Signal(
                    date=signal_date.strftime("%Y-%m-%d"),
                    price=round(float(row["close"]), 4),
                    indicator_values=ind_values,
                    outcomes=[],  # Filled in step 4
                )
            )

    logger.info("Step 3 — Found %d signals in %.2fs", len(signals), time.time() - t0)

    # -------------------------------------------------------------------------
    # 4. EVALUATE TARGETS
    # -------------------------------------------------------------------------
    t0 = time.time()

    # Build a date-to-index mapping for fast forward lookups
    date_to_idx = {date: i for i, date in enumerate(df.index)}

    for signal in signals:
        signal_date = pd.Timestamp(signal.date)
        signal_idx = date_to_idx[signal_date]
        signal_close = signal.price

        for target in scenario.targets:
            future_idx = signal_idx + target.days_forward

            if future_idx >= len(df):
                # Not enough future data
                signal.outcomes.append(
                    SignalOutcome(
                        target_id=target.id,
                        days_forward=target.days_forward,
                        threshold_pct=target.threshold_pct,
                        direction=target.direction.value,
                        future_date=None,
                        future_price=None,
                        actual_change_pct=None,
                        hit=None,
                    )
                )
                continue

            future_row = df.iloc[future_idx]
            future_close = float(future_row["close"])
            future_date = df.index[future_idx]
            change_pct = (future_close - signal_close) / signal_close * 100

            if target.direction.value == "BELOW":
                hit = change_pct <= target.threshold_pct
            else:  # ABOVE
                hit = change_pct >= target.threshold_pct

            signal.outcomes.append(
                SignalOutcome(
                    target_id=target.id,
                    days_forward=target.days_forward,
                    threshold_pct=target.threshold_pct,
                    direction=target.direction.value,
                    future_date=future_date.strftime("%Y-%m-%d"),
                    future_price=round(future_close, 4),
                    actual_change_pct=round(change_pct, 4),
                    hit=hit,
                )
            )

    logger.info("Step 4 — Targets evaluated in %.2fs", time.time() - t0)

    # -------------------------------------------------------------------------
    # 5. COMPUTE STATISTICS
    # -------------------------------------------------------------------------
    t0 = time.time()
    target_stats = _compute_target_stats(signals, scenario.targets)
    logger.info("Step 5 — Statistics computed in %.2fs", time.time() - t0)

    # -------------------------------------------------------------------------
    # 6. BUILD RESULT
    # -------------------------------------------------------------------------
    result = AnalysisResult(
        scenario_id=scenario.id,
        scenario_name=scenario.name,
        underlying=scenario.underlying,
        run_date=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        data_start=df.index[0].strftime("%Y-%m-%d"),
        data_end=df.index[-1].strftime("%Y-%m-%d"),
        total_bars=len(df),
        total_signals=len(signals),
        target_stats=target_stats,
        signals=signals,
    )

    total_elapsed = time.time() - pipeline_start
    hit_summary = ", ".join(
        f"target {ts.target_id[:8]}...: {ts.hit_rate_pct:.1f}%"
        for ts in target_stats
    )
    logger.info(
        "Analysis complete in %.2fs: %d signals. %s",
        total_elapsed, len(signals), hit_summary,
    )

    return result


def _compute_min_lookback(scenario: ScenarioInDB) -> int:
    """Determine the minimum lookback period across all indicators."""
    max_period = 0
    for cond in scenario.conditions:
        period = cond.params.get("period", 0)
        slow = cond.params.get("slow", 0)
        max_period = max(max_period, period, slow)

        if cond.compare_indicator_params:
            cp = cond.compare_indicator_params.get("period", 0)
            cs = cond.compare_indicator_params.get("slow", 0)
            max_period = max(max_period, cp, cs)

    return max_period


def _compute_target_stats(signals: list[Signal], targets) -> list[TargetStats]:
    """Compute aggregate statistics per target from signal outcomes."""
    stats_list: list[TargetStats] = []

    for target in targets:
        changes: list[float] = []
        hit_count = 0
        miss_count = 0

        for signal in signals:
            for outcome in signal.outcomes:
                if outcome.target_id != target.id:
                    continue
                if outcome.hit is None:
                    continue  # No future data
                changes.append(outcome.actual_change_pct)
                if outcome.hit:
                    hit_count += 1
                else:
                    miss_count += 1

        total_evaluable = len(changes)

        if total_evaluable == 0:
            stats_list.append(
                TargetStats(
                    target_id=target.id,
                    days_forward=target.days_forward,
                    threshold_pct=target.threshold_pct,
                    direction=target.direction.value,
                    total_evaluable=0,
                    hit_count=0,
                    miss_count=0,
                    hit_rate_pct=0.0,
                    avg_change_pct=0.0,
                    median_change_pct=0.0,
                    max_change_pct=0.0,
                    min_change_pct=0.0,
                    std_dev=0.0,
                    percentile_5=0.0,
                    percentile_25=0.0,
                    percentile_75=0.0,
                    percentile_95=0.0,
                    distribution=[],
                )
            )
            continue

        arr = np.array(changes)
        stats_list.append(
            TargetStats(
                target_id=target.id,
                days_forward=target.days_forward,
                threshold_pct=target.threshold_pct,
                direction=target.direction.value,
                total_evaluable=total_evaluable,
                hit_count=hit_count,
                miss_count=miss_count,
                hit_rate_pct=round(hit_count / total_evaluable * 100, 2),
                avg_change_pct=round(float(np.mean(arr)), 4),
                median_change_pct=round(float(np.median(arr)), 4),
                max_change_pct=round(float(np.max(arr)), 4),
                min_change_pct=round(float(np.min(arr)), 4),
                std_dev=round(float(np.std(arr, ddof=1)) if total_evaluable > 1 else 0.0, 4),
                percentile_5=round(float(np.percentile(arr, 5)), 4),
                percentile_25=round(float(np.percentile(arr, 25)), 4),
                percentile_75=round(float(np.percentile(arr, 75)), 4),
                percentile_95=round(float(np.percentile(arr, 95)), 4),
                distribution=[round(float(c), 4) for c in changes],
            )
        )

    return stats_list
