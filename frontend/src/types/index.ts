// Enums as union types
export type Indicator =
    | "PRICE"
    | "SMA"
    | "EMA"
    | "RSI"
    | "BBANDS_UPPER"
    | "BBANDS_MIDDLE"
    | "BBANDS_LOWER"
    | "MACD"
    | "MACD_SIGNAL"
    | "MACD_HIST"
    | "ATR"
    | "STOCH_K"
    | "STOCH_D"
    | "ADX"
    | "PRICE_CHANGE"
    | "VOLUME_RATIO"
    | "HIGHEST"
    | "LOWEST";

export type Operator = "ABOVE" | "BELOW" | "CROSSES_ABOVE" | "CROSSES_BELOW";
export type CompareTo = "PRICE" | "VALUE" | "INDICATOR";
export type Connector = "AND" | "OR";
export type Direction = "ABOVE" | "BELOW";
export type DataSource = "CSV" | "YAHOO" | "NORGATE";

export interface ConditionConfig {
    id: string;
    indicator: Indicator;
    params: Record<string, number>;
    operator: Operator;
    compare_to: CompareTo;
    compare_value?: number;
    compare_indicator?: Indicator;
    compare_indicator_params?: Record<string, number>;
    connector: Connector;
}

export interface TargetConfig {
    id: string;
    days_forward: number;
    threshold_pct: number;
    direction: Direction;
}

export interface ScenarioCreate {
    name: string;
    description: string;
    underlying: string;
    data_source: DataSource;
    csv_path?: string;
    timeframe: string;
    date_range_start?: string;
    date_range_end?: string;
    conditions: ConditionConfig[];
    targets: TargetConfig[];
}

export interface Scenario extends ScenarioCreate {
    id: string;
    created_at: string;
    updated_at: string;
    last_run_result?: AnalysisResult;
}

export interface ScenarioSummary {
    id: string;
    name: string;
    description: string;
    underlying: string;
    data_source: DataSource;
    num_conditions: number;
    num_targets: number;
    last_run_hit_rate?: number;
    last_run_total_signals?: number;
    created_at: string;
    updated_at: string;
}

// Results types
export interface SignalOutcome {
    target_id: string;
    days_forward: number;
    threshold_pct: number;
    direction: string;
    future_date?: string;
    future_price?: number;
    actual_change_pct?: number;
    max_change_pct?: number;
    hit?: boolean;
}

export interface Signal {
    date: string;
    price: number;
    indicator_values: Record<string, number>;
    outcomes: SignalOutcome[];
}

export interface TargetStats {
    target_id: string;
    days_forward: number;
    threshold_pct: number;
    direction: string;
    total_evaluable: number;
    hit_count: number;
    miss_count: number;
    hit_rate_pct: number;
    avg_change_pct: number;
    median_change_pct: number;
    max_change_pct: number;
    min_change_pct: number;
    std_dev: number;
    percentile_5: number;
    percentile_25: number;
    percentile_75: number;
    percentile_95: number;
    distribution: number[];
}

export interface AnalysisResult {
    scenario_id: string;
    scenario_name: string;
    underlying: string;
    run_date: string;
    data_start: string;
    data_end: string;
    total_bars: number;
    total_signals: number;
    target_stats: TargetStats[];
    signals: Signal[];
}

// Indicator metadata for UI dropdowns
export interface IndicatorMeta {
    value: Indicator;
    label: string;
    params: { name: string; label: string; default: number; min?: number; max?: number }[];
    category: string;
}

// Use this constant for populating dropdowns
export const INDICATORS: IndicatorMeta[] = [
    { value: "SMA", label: "Simple Moving Average", category: "Trend", params: [{ name: "period", label: "Period", default: 200, min: 1 }] },
    { value: "EMA", label: "Exponential Moving Average", category: "Trend", params: [{ name: "period", label: "Period", default: 50, min: 1 }] },
    { value: "RSI", label: "Relative Strength Index", category: "Momentum", params: [{ name: "period", label: "Period", default: 14, min: 1 }] },
    { value: "BBANDS_UPPER", label: "Bollinger Upper Band", category: "Volatility", params: [{ name: "period", label: "Period", default: 20 }, { name: "std", label: "Std Dev", default: 2 }] },
    { value: "BBANDS_LOWER", label: "Bollinger Lower Band", category: "Volatility", params: [{ name: "period", label: "Period", default: 20 }, { name: "std", label: "Std Dev", default: 2 }] },
    { value: "MACD", label: "MACD Line", category: "Momentum", params: [{ name: "fast", label: "Fast", default: 12 }, { name: "slow", label: "Slow", default: 26 }, { name: "signal", label: "Signal", default: 9 }] },
    { value: "ATR", label: "Average True Range", category: "Volatility", params: [{ name: "period", label: "Period", default: 14 }] },
    { value: "ADX", label: "Average Directional Index", category: "Trend", params: [{ name: "period", label: "Period", default: 14 }] },
    { value: "PRICE_CHANGE", label: "Price Change %", category: "Price", params: [{ name: "period", label: "Lookback", default: 1 }] },
    { value: "VOLUME_RATIO", label: "Volume Ratio", category: "Volume", params: [{ name: "period", label: "Avg Period", default: 20 }] },
    { value: "HIGHEST", label: "Highest High", category: "Price", params: [{ name: "period", label: "Period", default: 252 }] },
    { value: "LOWEST", label: "Lowest Low", category: "Price", params: [{ name: "period", label: "Period", default: 252 }] },
];
