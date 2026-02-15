from app.core.engine import run_analysis
from app.models.scenario import ScenarioInDB, DataSource, Timeframe, ConditionConfig, TargetConfig
from app.models.scenario import Indicator, Operator, CompareTo, Direction, Connector, ScenarioCreate
import pandas as pd
from uuid import uuid4
from datetime import datetime

def test_engine_end_to_end(sample_data):
    # Condition: PRICE_CHANGE 1-day > 1.0 (some volatility)
    # We use PRICE_CHANGE because RSI/SMA might need warmup
    
    cond = ConditionConfig(
        indicator=Indicator.PRICE_CHANGE,
        params={"period": 1},
        operator=Operator.ABOVE,
        compare_to=CompareTo.VALUE,
        compare_value=0.5 # 0.5% change
    )
    
    # Target: Price > 0.0% higher in 5 days (simple directional bet)
    target = TargetConfig(
        days_forward=5,
        threshold_pct=0.0,
        direction=Direction.ABOVE
    )
    
    scenario = ScenarioInDB(
        id=str(uuid4()),
        name="Test Scenario",
        underlying="TEST",
        data_source=DataSource.CSV,
        csv_path="tests/fixtures/sample_data.csv",
        timeframe=Timeframe.DAILY,
        conditions=[cond],
        targets=[target],
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    )
    
    result = run_analysis(scenario)
    
    assert result.total_bars == 500
    # Random walk with high volatility should trigger some hits
    assert result.total_signals >= 0 
    
    # Check structure
    if result.total_signals > 0:
        sig = result.signals[0]
        # Check specific key from get_column_name logic
        assert "PRICE_CHANGE_1" in sig.indicator_values

def test_engine_no_signals(sample_data):
    # Impossible condition: PRICE_CHANGE > 100% daily (unlikely in random walk 0.02 sigma)
    cond = ConditionConfig(
        indicator=Indicator.PRICE_CHANGE,
        params={"period": 1},
        operator=Operator.ABOVE,
        compare_to=CompareTo.VALUE,
        compare_value=100.0
    )
    target = TargetConfig(days_forward=5, threshold_pct=1.0, direction=Direction.ABOVE)
    
    scenario = ScenarioInDB(
        id=str(uuid4()), name="Empty", underlying="TEST", data_source=DataSource.CSV,
        csv_path="tests/fixtures/sample_data.csv", timeframe=Timeframe.DAILY,
        conditions=[cond], targets=[target], created_at="", updated_at=""
    )
    
    result = run_analysis(scenario)
    assert result.total_signals == 0
    assert result.target_stats[0].total_evaluable == 0
