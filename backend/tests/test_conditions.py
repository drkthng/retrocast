import pandas as pd
import pytest
from app.core.conditions import evaluate_conditions, get_column_name
from app.models.scenario import ConditionConfig, Indicator, Operator, CompareTo, Connector

def test_get_column_name():
    assert get_column_name("SMA", {"period": 20}) == "SMA_20"
    assert get_column_name("BBANDS_UPPER", {"period": 20, "std": 2}) == "BBANDS_UPPER_20_2.0"

def test_evaluate_above_below(small_data):
    # Add indicator columns manually for testing conditions
    small_data["SMA_5"] = [10.8] * 5  # Mock values
    # Force updating via loc to be safe from CoW
    small_data.loc[small_data.index[2], "SMA_5"] = 12.5 
    
    # Condition: SMA_5 > 12.0
    cond = ConditionConfig(
        indicator=Indicator.SMA,
        params={"period": 5},
        operator=Operator.ABOVE,
        compare_to=CompareTo.VALUE,
        compare_value=12.0
    )
    
    # idx 2 has 12.5 > 12.0 -> True
    assert evaluate_conditions(small_data, 2, [cond]) is True
    # idx 1 has 10.8 < 12.0 -> False
    assert evaluate_conditions(small_data, 1, [cond]) is False

def test_and_logic(small_data):
    small_data["SMA_5"] = [10.0] * 5
    small_data["RSI_14"] = [50.0] * 5
    
    # C1: SMA_5 > 9 (True)
    c1 = ConditionConfig(
        indicator=Indicator.SMA, params={"period": 5},
        operator=Operator.ABOVE, compare_to=CompareTo.VALUE, compare_value=9.0,
        connector=Connector.AND
    )
    # C2: RSI_14 > 60 (False)
    c2 = ConditionConfig(
        indicator=Indicator.RSI, params={"period": 14},
        operator=Operator.ABOVE, compare_to=CompareTo.VALUE, compare_value=60.0,
        connector=Connector.AND
    )
    
    # True AND False -> False
    assert evaluate_conditions(small_data, 0, [c1, c2]) is False
    
    # Change C2 to > 40 (True) -> True
    c2.compare_value = 40.0
    assert evaluate_conditions(small_data, 0, [c1, c2]) is True

def test_or_logic(small_data):
    small_data["SMA_5"] = [10.0] * 5
    
    # C1: SMA_5 > 20 (False) OR
    c1 = ConditionConfig(
        indicator=Indicator.SMA, params={"period": 5},
        operator=Operator.ABOVE, compare_to=CompareTo.VALUE, compare_value=20.0,
        connector=Connector.OR
    )
    # C2: SMA_5 < 15 (True)
    c2 = ConditionConfig(
        indicator=Indicator.SMA, params={"period": 5},
        operator=Operator.BELOW, compare_to=CompareTo.VALUE, compare_value=15.0
    )
    
    # False OR True -> True
    assert evaluate_conditions(small_data, 0, [c1, c2]) is True

def test_crosses_above(small_data):
    # Cond: SMA_5 CROSSES ABOVE 10.0
    # idx 0: 9.0
    # idx 1: 11.0
    vals = [9.0, 11.0, 10.0, 10.0, 10.0]
    small_data["SMA_5"] = vals
    
    cond = ConditionConfig(
        indicator=Indicator.SMA,
        params={"period": 5},
        operator=Operator.CROSSES_ABOVE,
        compare_to=CompareTo.VALUE,
        compare_value=10.0
    )
    
    # idx 1: Prev=9.0(<=10), Curr=11.0(>10) -> True
    assert evaluate_conditions(small_data, 1, [cond]) is True
    # idx 0: False (no prev)
    assert evaluate_conditions(small_data, 0, [cond]) is False
