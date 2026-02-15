"""Export API routes (CSV, Excel download)."""

import io
import logging
from typing import Optional

import pandas as pd
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.db import repositories as repo

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/export", tags=["export"])


@router.get("/{scenario_id}/csv")
async def export_csv(scenario_id: str):
    """Download analysis results as a CSV file."""
    result = repo.get_result(scenario_id)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"No analysis results found for scenario '{scenario_id}'. Run the analysis first.",
        )

    df = _result_to_dataframe(result)

    buffer = io.StringIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)

    filename = f"{result.scenario_name.replace(' ', '_')}_results.csv"

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{scenario_id}/excel")
async def export_excel(scenario_id: str):
    """Download analysis results as an Excel file."""
    result = repo.get_result(scenario_id)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"No analysis results found for scenario '{scenario_id}'. Run the analysis first.",
        )

    signals_df = _result_to_dataframe(result)
    stats_df = _stats_to_dataframe(result)

    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        # Summary sheet
        summary_data = {
            "Field": [
                "Scenario", "Underlying", "Run Date",
                "Data Start", "Data End", "Total Bars", "Total Signals",
            ],
            "Value": [
                result.scenario_name, result.underlying, result.run_date,
                result.data_start, result.data_end, result.total_bars, result.total_signals,
            ],
        }
        pd.DataFrame(summary_data).to_excel(writer, sheet_name="Summary", index=False)

        # Target stats sheet
        if not stats_df.empty:
            stats_df.to_excel(writer, sheet_name="Target Stats", index=False)

        # Signals sheet
        if not signals_df.empty:
            signals_df.to_excel(writer, sheet_name="Signals", index=False)

    buffer.seek(0)
    filename = f"{result.scenario_name.replace(' ', '_')}_results.xlsx"

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _result_to_dataframe(result) -> pd.DataFrame:
    """Convert analysis signals to a flat DataFrame for export."""
    rows = []
    for signal in result.signals:
        for outcome in signal.outcomes:
            rows.append({
                "signal_date": signal.date,
                "signal_price": signal.price,
                "target_days_forward": outcome.days_forward,
                "target_threshold_pct": outcome.threshold_pct,
                "target_direction": outcome.direction,
                "future_date": outcome.future_date,
                "future_price": outcome.future_price,
                "actual_change_pct": outcome.actual_change_pct,
                "hit": outcome.hit,
                **{f"ind_{k}": v for k, v in signal.indicator_values.items()},
            })
    return pd.DataFrame(rows) if rows else pd.DataFrame()


def _stats_to_dataframe(result) -> pd.DataFrame:
    """Convert target stats to a DataFrame for the Excel stats sheet."""
    rows = []
    for ts in result.target_stats:
        rows.append({
            "days_forward": ts.days_forward,
            "threshold_pct": ts.threshold_pct,
            "direction": ts.direction,
            "total_evaluable": ts.total_evaluable,
            "hit_count": ts.hit_count,
            "miss_count": ts.miss_count,
            "hit_rate_pct": ts.hit_rate_pct,
            "avg_change_pct": ts.avg_change_pct,
            "median_change_pct": ts.median_change_pct,
            "max_change_pct": ts.max_change_pct,
            "min_change_pct": ts.min_change_pct,
            "std_dev": ts.std_dev,
            "percentile_5": ts.percentile_5,
            "percentile_25": ts.percentile_25,
            "percentile_75": ts.percentile_75,
            "percentile_95": ts.percentile_95,
        })
    return pd.DataFrame(rows) if rows else pd.DataFrame()
