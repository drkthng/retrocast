import os
import pytest
import pandas as pd
from app.db.database import set_db_path, init_database
from app.config import settings

# Use a test-specific database
TEST_DB_PATH = "./test_scenarios.db"

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    set_db_path(TEST_DB_PATH)
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
    init_database()
    yield
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)

@pytest.fixture
def sample_data():
    """Load the synthetic 500-day OHLCV data."""
    csv_path = "tests/fixtures/sample_data.csv"
    if not os.path.exists(csv_path):
        pytest.fail(f"Test data not found at {csv_path}. Run generate_test_data.py first.")
    
    df = pd.read_csv(csv_path)
    df["date"] = pd.to_datetime(df["date"])
    df = df.set_index("date")
    return df

@pytest.fixture
def small_data():
    """A small DataFrame for deterministic logic tests."""
    df = pd.DataFrame({
        "close": [10.0, 11.0, 12.0, 11.0, 10.0],
        "high":  [10.5, 11.5, 12.5, 11.5, 10.5],
        "low":   [9.5, 10.5, 11.5, 10.5, 9.5],
        "volume": [100, 200, 300, 200, 100],
    }, index=pd.date_range("2020-01-01", periods=5))
    df.index.name = "date"
    return df
