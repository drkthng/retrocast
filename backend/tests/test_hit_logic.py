
import pytest
from app.core.engine import run_analysis
from app.models.scenario import ScenarioInDB, DataSource, Timeframe, ConditionConfig, TargetConfig
from app.models.scenario import Indicator, Operator, CompareTo, Direction, Connector
from uuid import uuid4
from datetime import datetime

def test_hit_logic_below_positive_threshold():
    # Setup a dummy scenario where we can test the hit logic
    # Actually, let's test the logic by running the engine with controlled data if possible,
    # or just unit test the specific logic if extracted.
    # Since it's inside run_analysis, I'll create a test that runs the analysis with mock data.
    pass

# Direct test of the comparison logic if we want to be precise, 
# but testing through run_analysis is safer for integration.

def test_hit_logic_scenarios():
    from app.core.engine import run_analysis
    import pandas as pd
    import numpy as np

    # Create dummy data: 300 days, price starts at 100
    dates = pd.date_range("2020-01-01", periods=300)
    prices = [100.0] * 300
    prices[252] = 110.0 # Signal 1 point
    prices[257] = 112.53 # Outcome 1 point (112.53 is 2.3% above 110.0)
    prices[262] = 110.0 # Signal 2 point
    prices[267] = 103.4 # Outcome 2 point (103.4 is 6.0% below 110.0)
    
    df = pd.DataFrame({"close": prices, "open": prices, "high": prices, "low": prices, "volume": [1000]*300}, index=dates)
    
    # We need to mock load_data to return our df
    import app.core.engine
    original_load_data = app.core.engine.load_data
    app.core.engine.load_data = lambda **kwargs: df
    
    try:
        cond = ConditionConfig(
            indicator=Indicator.PRICE,
            operator=Operator.ABOVE,
            compare_to=CompareTo.VALUE,
            compare_value=105.0 # Only index 252 should trigger this
        )
        
        target5d = TargetConfig(id="t5d", days_forward=5, threshold_pct=5.0, direction=Direction.BELOW)
        
        scenario = ScenarioInDB(
            id=str(uuid4()),
            name="Test",
            underlying="TEST",
            data_source=DataSource.CSV,
            timeframe=Timeframe.DAILY,
            conditions=[cond],
            targets=[target5d],
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat()
        )
        
        result = run_analysis(scenario)
        
        # Signal 1 at index 252 (price 110.0) -> Outcome at 257 (price 112.53) = +2.3% (MISS)
        # Signal 2 at index 257 (price 112.53) -> Outcome at 262 (price 110.0) = -2.25% (MISS)
        # Signal 3 at index 262 (price 110.0) -> Outcome at 267 (price 103.4) = -6.0% (HIT)
        
        assert len(result.signals) == 3
        
        # Check Signal 1 (index 252)
        sig1 = result.signals[0]
        out1 = next(o for o in sig1.outcomes if o.target_id == "t5d")
        print(f"Signal 1 Change: {out1.actual_change_pct}, Hit: {out1.hit}")
        assert out1.actual_change_pct == 2.3
        assert out1.hit is False
        
        # Check Signal 3 (index 262)
        sig3 = result.signals[2]
        out3 = next(o for o in sig3.outcomes if o.target_id == "t5d")
        print(f"Signal 3 Change: {out3.actual_change_pct}, Hit: {out3.hit}")
        assert out3.actual_change_pct == -6.0
        assert out3.hit is True
        
    finally:
        app.core.engine.load_data = original_load_data

if __name__ == "__main__":
    # Add Signal 2 data points to the module level prices list before running
    pass

if __name__ == "__main__":
    test_hit_logic_scenarios()
