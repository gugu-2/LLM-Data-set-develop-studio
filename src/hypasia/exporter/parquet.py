"""
Hypasia AI — Parquet exporter.
Parquet is the best format for large datasets: compressed, columnar, fast.
Compatible with pandas, HuggingFace datasets, Spark, DuckDB.
"""
from __future__ import annotations

from pathlib import Path

from hypasia.schema import HypasiaRow


def export_parquet(
    rows: list[HypasiaRow],
    output_path: Path,
) -> Path:
    """Export rows to Parquet format with Snappy compression."""
    try:
        import pandas as pd
        import pyarrow as pa
        import pyarrow.parquet as pq
    except ImportError:
        raise ImportError("pandas and pyarrow required: pip install pandas pyarrow")

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    records = [row.to_export_dict() for row in rows]
    df = pd.DataFrame(records)

    table = pa.Table.from_pandas(df, preserve_index=False)
    pq.write_table(table, output_path, compression="snappy")

    return output_path


def load_parquet(path: Path) -> list[HypasiaRow]:
    """Load a Parquet file back into HypasiaRow objects."""
    import pandas as pd
    df = pd.read_parquet(path)
    rows = []
    for _, row in df.iterrows():
        data = row.to_dict()
        scores = {}
        for axis in ["specificity", "clarity", "completeness",
                     "difficulty", "uniqueness", "domain_relevance"]:
            key = f"score_{axis}"
            if key in data:
                scores[axis] = data.pop(key)
        if scores:
            data["scores"] = scores
        rows.append(HypasiaRow.from_dict(data))
    return rows
