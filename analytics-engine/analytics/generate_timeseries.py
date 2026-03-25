"""
Standalone script that replicates the timeseries generator cell from
mathvision_analytics.ipynb.

Reads:
  - analytics-engine/data/raw/pairings_raw.csv
  - analytics-engine/data/pre-processed/analytics_scenario_rankings.csv

Writes:
  - analytics-engine/data/pre-processed/analytics_mapping_quality_timeseries.csv

Run from the repo root:
  python analytics-engine/analytics/generate_timeseries.py
"""

from datetime import datetime
from pathlib import Path

import pandas as pd

# Paths are relative to this script's location (analytics-engine/analytics/)
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / ".." / "data"

PAIRINGS_PATH = DATA_DIR / "raw" / "pairings_raw.csv"
RANKINGS_PATH = DATA_DIR / "pre-processed" / "analytics_scenario_rankings.csv"
OUTPUT_PATH = DATA_DIR / "pre-processed" / "analytics_mapping_quality_timeseries.csv"


def generate_timeseries(
    pairings_path: Path = PAIRINGS_PATH,
    rankings_path: Path = RANKINGS_PATH,
    output_path: Path = OUTPUT_PATH,
) -> pd.DataFrame:
    """Generate the mapping quality timeseries CSV and return the DataFrame.

    Merges new run data with any existing history so prior rows are preserved.
    """
    pairings_df = pd.read_csv(pairings_path)
    rankings_df = pd.read_csv(rankings_path)

    joined_df = pairings_df[["student_id", "session_date"]].merge(
        rankings_df[["student_id", "final_score"]],
        on="student_id",
        how="inner",
    )

    run_timestamp = datetime.utcnow().isoformat() + "Z"

    if joined_df.empty:
        new_df = pd.DataFrame(columns=["date", "avg_final_score", "run_count", "run_timestamp"])
    else:
        grouped = joined_df.groupby("session_date", sort=True).agg(
            avg_final_score=("final_score", "mean"),
            run_count=("final_score", "count"),
        ).reset_index()
        grouped = grouped.rename(columns={"session_date": "date"})
        grouped["run_timestamp"] = run_timestamp
        new_df = grouped[["date", "avg_final_score", "run_count", "run_timestamp"]]

    # Merge with existing history — new run data takes precedence for overlapping dates
    if output_path.exists():
        try:
            existing_df = pd.read_csv(output_path)
            existing_df = existing_df[~existing_df["date"].isin(new_df["date"])]
            timeseries_df = pd.concat([existing_df, new_df], ignore_index=True)
        except Exception:
            timeseries_df = new_df
    else:
        timeseries_df = new_df

    timeseries_df = timeseries_df.sort_values("date", ascending=True).reset_index(drop=True)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    timeseries_df.to_csv(output_path, index=False)

    return timeseries_df


if __name__ == "__main__":
    result = generate_timeseries()
    print(f"Saved timeseries ({len(result)} rows): {OUTPUT_PATH.resolve()}")
    if not result.empty:
        print(result.to_string(index=False))
