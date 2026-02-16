"""Pydantic models for scenario configuration."""

from enum import Enum
from typing import Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class Indicator(str, Enum):
    PRICE = "PRICE"
    SMA = "SMA"
    EMA = "EMA"
    RSI = "RSI"
    BBANDS_UPPER = "BBANDS_UPPER"
    BBANDS_MIDDLE = "BBANDS_MIDDLE"
    BBANDS_LOWER = "BBANDS_LOWER"
    MACD = "MACD"
    MACD_SIGNAL = "MACD_SIGNAL"
    MACD_HIST = "MACD_HIST"
    ATR = "ATR"
    STOCH_K = "STOCH_K"
    STOCH_D = "STOCH_D"
    ADX = "ADX"
    PRICE_CHANGE = "PRICE_CHANGE"
    VOLUME_RATIO = "VOLUME_RATIO"
    HIGHEST = "HIGHEST"
    LOWEST = "LOWEST"


class Operator(str, Enum):
    ABOVE = "ABOVE"
    BELOW = "BELOW"
    CROSSES_ABOVE = "CROSSES_ABOVE"
    CROSSES_BELOW = "CROSSES_BELOW"


class CompareTo(str, Enum):
    PRICE = "PRICE"
    VALUE = "VALUE"
    INDICATOR = "INDICATOR"


class Connector(str, Enum):
    AND = "AND"
    OR = "OR"


class Direction(str, Enum):
    ABOVE = "ABOVE"
    BELOW = "BELOW"


class DataSource(str, Enum):
    CSV = "CSV"
    YAHOO = "YAHOO"
    NORGATE = "NORGATE"


class Timeframe(str, Enum):
    DAILY = "DAILY"
    D1 = "1d"
    # WEEKLY = "WEEKLY"       # Future
    # INTRADAY = "INTRADAY"   # Future


class ConditionConfig(BaseModel):
    """A single condition comparing an indicator to a value/price/indicator."""

    id: str = Field(default_factory=lambda: str(uuid4()))
    indicator: Indicator
    params: dict = Field(default_factory=dict)
    operator: Operator
    compare_to: CompareTo
    compare_value: Optional[float] = None
    compare_indicator: Optional[Indicator] = None
    compare_indicator_params: Optional[dict] = None
    connector: Connector = Connector.AND


class TargetConfig(BaseModel):
    """A forward-looking target to evaluate at each signal."""

    id: str = Field(default_factory=lambda: str(uuid4()))
    days_forward: int = Field(ge=1, le=504)
    threshold_pct: float
    direction: Direction


class ScenarioCreate(BaseModel):
    """Payload for creating a new scenario."""

    name: str = Field(min_length=1, max_length=200)
    description: str = ""
    underlying: str = Field(min_length=1, max_length=20)
    data_source: DataSource = DataSource.YAHOO
    csv_path: Optional[str] = None
    timeframe: Timeframe = Timeframe.DAILY
    date_range_start: Optional[str] = None
    date_range_end: Optional[str] = None
    conditions: list[ConditionConfig] = Field(min_length=1)
    targets: list[TargetConfig] = Field(min_length=1)


class ScenarioUpdate(ScenarioCreate):
    """Payload for updating a scenario (same shape as create)."""

    pass


class ScenarioInDB(ScenarioCreate):
    """Scenario as stored in the database, with metadata."""

    id: str
    created_at: str
    updated_at: str


class ScenarioSummary(BaseModel):
    """Lightweight model for list views."""

    id: str
    name: str
    description: str
    underlying: str
    data_source: DataSource
    num_conditions: int
    num_targets: int
    last_run_hit_rate: Optional[float] = None
    last_run_total_signals: Optional[int] = None
    created_at: str
    updated_at: str
