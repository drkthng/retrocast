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

    if indicator == "PRICE":
        return "close"

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
        parts = [indicator]
        for key in sorted(params.keys()):
            parts.append(str(params[key]))
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


def _evaluate_single(df: pd.DataFrame, idx: int, condition: ConditionConfig) -> bool:
    """Evaluate a single condition at the given row index."""
    # === GET LEFT SIDE VALUE ===
    if condition.indicator == "PRICE":
        left_col = "close"
    else:
        left_col = get_column_name(condition.indicator.value, condition.params)

    if left_col not in df.columns:
        logger.warning("Indicator column '%s' not found in DataFrame", left_col)
        return False

    left_val = df.iloc[idx][left_col]

    # === GET RIGHT SIDE VALUE ===
    if condition.compare_to == CompareTo.PRICE:
        right_col = "close"
        right_val = df.iloc[idx]["close"]
    elif condition.compare_to == CompareTo.VALUE:
        right_col = None  # No column, fixed value
        right_val = condition.compare_value
    elif condition.compare_to == CompareTo.INDICATOR:
        if condition.compare_indicator is None or condition.compare_indicator_params is None:
            logger.warning("compare_indicator or params missing for INDICATOR comparison")
            return False
        right_col = get_column_name(condition.compare_indicator.value, condition.compare_indicator_params)
        if right_col not in df.columns:
            logger.warning("Compare indicator column '%s' not found", right_col)
            return False
        right_val = df.iloc[idx][right_col]
    else:
        return False

    # === CHECK FOR NaN ===
    if _is_nan(left_val) or _is_nan(right_val):
        return False

    left_val = float(left_val)
    right_val = float(right_val)

    # === EVALUATE OPERATOR ===
    if condition.operator == Operator.ABOVE:
        return left_val > right_val

    elif condition.operator == Operator.BELOW:
        return left_val < right_val

    elif condition.operator == Operator.CROSSES_ABOVE:
        if idx < 1:
            return False
        prev_left = df.iloc[idx - 1][left_col]
        if condition.compare_to == CompareTo.VALUE:
            prev_right = condition.compare_value
        elif condition.compare_to == CompareTo.PRICE:
            prev_right = df.iloc[idx - 1]["close"]
        else:
            prev_right = df.iloc[idx - 1][right_col]

        if _is_nan(prev_left) or _is_nan(prev_right):
            return False

        return float(prev_left) <= float(prev_right) and left_val > right_val

    elif condition.operator == Operator.CROSSES_BELOW:
        if idx < 1:
            return False
        prev_left = df.iloc[idx - 1][left_col]
        if condition.compare_to == CompareTo.VALUE:
            prev_right = condition.compare_value
        elif condition.compare_to == CompareTo.PRICE:
            prev_right = df.iloc[idx - 1]["close"]
        else:
            prev_right = df.iloc[idx - 1][right_col]

        if _is_nan(prev_left) or _is_nan(prev_right):
            return False

        return float(prev_left) >= float(prev_right) and left_val < right_val

    return False


def _is_nan(val) -> bool:
    """Check if a value is NaN (works for float and numpy types)."""
    try:
        return math.isnan(float(val))
    except (ValueError, TypeError):
        return True
