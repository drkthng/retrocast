"""Condition evaluation logic with AND/OR grouping."""

import logging
import math
from typing import Optional

import pandas as pd

from app.models.scenario import CompareTo, ConditionConfig, Connector, Operator

logger = logging.getLogger(__name__)


def get_column_name(indicator: str, params: dict) -> str:
    """
    Generate a consistent column name for an indicator + params.

    Examples:
        SMA, {"period": 200}               → "SMA_200"
        RSI, {"period": 14}                 → "RSI_14"
        BBANDS_UPPER, {"period": 20, "std": 2} → "BBANDS_UPPER_20_2.0"
        MACD, {"fast": 12, "slow": 26, "signal": 9} → "MACD_12_26_9"
        VOLUME_RATIO, {"period": 20}        → "VOLUME_RATIO_20"
    """
    indicator = indicator.upper()

    if indicator in ("SMA", "EMA", "RSI", "ATR", "ADX", "PRICE_CHANGE",
                     "VOLUME_RATIO", "HIGHEST", "LOWEST"):
        return f"{indicator}_{params['period']}"

    elif indicator in ("BBANDS_UPPER", "BBANDS_MIDDLE", "BBANDS_LOWER"):
        std = params.get("std", 2)
        return f"{indicator}_{params['period']}_{float(std)}"

    elif indicator in ("MACD", "MACD_SIGNAL", "MACD_HIST"):
        fast = params.get("fast", 12)
        slow = params.get("slow", 26)
        signal = params.get("signal", 9)
        return f"{indicator}_{fast}_{slow}_{signal}"

    elif indicator in ("STOCH_K", "STOCH_D"):
        k = params.get("k", 14)
        d = params.get("d", 3)
        return f"{indicator}_{k}_{d}"

    else:
        # Fallback: join all param values
        parts = [indicator] + [str(v) for v in params.values()]
        return "_".join(parts)


def evaluate_conditions(
    df: pd.DataFrame,
    idx: int,
    conditions: list[ConditionConfig],
) -> bool:
    """
    Evaluate all conditions for a given row index.

    Logic:
        - Split conditions into groups at OR boundaries.
        - Example: [C1 AND, C2 AND, C3 OR, C4 AND, C5]
          → Group 1: [C1, C2, C3], Group 2: [C4, C5]
          → Result: (C1 AND C2 AND C3) OR (C4 AND C5)
        - All conditions within a group must be True (AND).
        - At least one group must be True (OR).
    """
    if not conditions:
        return False

    # Build groups: split at OR connectors
    groups = _build_groups(conditions)

    # Evaluate: any group fully satisfied → True
    for group in groups:
        if all(_evaluate_single(df, idx, cond) for cond in group):
            return True
    return False


def _build_groups(conditions: list[ConditionConfig]) -> list[list[ConditionConfig]]:
    """
    Split conditions into AND-groups separated by OR connectors.

    The connector on a condition specifies how it connects to the NEXT condition.
    If connector == OR, the current condition ends the current group.
    """
    groups: list[list[ConditionConfig]] = []
    current_group: list[ConditionConfig] = []

    for i, cond in enumerate(conditions):
        current_group.append(cond)
        # The last condition has no "next", so it always ends the group
        is_last = (i == len(conditions) - 1)
        if is_last or cond.connector == Connector.OR:
            groups.append(current_group)
            current_group = []

    return groups


def _evaluate_single(
    df: pd.DataFrame,
    idx: int,
    cond: ConditionConfig,
) -> bool:
    """Evaluate a single condition at the given row index."""
    col_name = get_column_name(cond.indicator.value, cond.params)

    if col_name not in df.columns:
        logger.warning("Indicator column '%s' not found in DataFrame", col_name)
        return False

    indicator_val = df.iloc[idx][col_name]
    if _is_nan(indicator_val):
        return False

    # Determine compare value
    compare_val = _get_compare_value(df, idx, cond)
    if compare_val is None or _is_nan(compare_val):
        return False

    # Evaluate operator
    if cond.operator == Operator.ABOVE:
        return float(indicator_val) > float(compare_val)

    elif cond.operator == Operator.BELOW:
        return float(indicator_val) < float(compare_val)

    elif cond.operator == Operator.CROSSES_ABOVE:
        if idx < 1:
            return False
        prev_indicator = df.iloc[idx - 1][col_name]
        prev_compare = _get_compare_value(df, idx - 1, cond)
        if _is_nan(prev_indicator) or prev_compare is None or _is_nan(prev_compare):
            return False
        return (
            float(prev_indicator) <= float(prev_compare)
            and float(indicator_val) > float(compare_val)
        )

    elif cond.operator == Operator.CROSSES_BELOW:
        if idx < 1:
            return False
        prev_indicator = df.iloc[idx - 1][col_name]
        prev_compare = _get_compare_value(df, idx - 1, cond)
        if _is_nan(prev_indicator) or prev_compare is None or _is_nan(prev_compare):
            return False
        return (
            float(prev_indicator) >= float(prev_compare)
            and float(indicator_val) < float(compare_val)
        )

    else:
        logger.warning("Unsupported operator: %s", cond.operator)
        return False


def _get_compare_value(
    df: pd.DataFrame,
    idx: int,
    cond: ConditionConfig,
) -> Optional[float]:
    """Get the comparison value for a condition at a given index."""
    if cond.compare_to == CompareTo.PRICE:
        return float(df.iloc[idx]["close"])

    elif cond.compare_to == CompareTo.VALUE:
        return cond.compare_value

    elif cond.compare_to == CompareTo.INDICATOR:
        if cond.compare_indicator is None or cond.compare_indicator_params is None:
            logger.warning("compare_indicator or params missing for INDICATOR comparison")
            return None
        compare_col = get_column_name(
            cond.compare_indicator.value, cond.compare_indicator_params
        )
        if compare_col not in df.columns:
            logger.warning("Compare indicator column '%s' not found", compare_col)
            return None
        return float(df.iloc[idx][compare_col])

    return None


def _is_nan(val) -> bool:
    """Check if a value is NaN (works for float and numpy types)."""
    try:
        return math.isnan(float(val))
    except (ValueError, TypeError):
        return True
