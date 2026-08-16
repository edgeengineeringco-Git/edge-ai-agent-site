"""
Cache + Provenance
==================
PostGIS or GeoPackage cache for fetched layers.
Provenance table: layer, source_url, access_date, license, resolution_m, bbox.
"""

import os
import sqlite3
import json
import geopandas as gpd
from typing import Tuple, Optional
from datetime import datetime, timedelta
import tempfile

CACHE_DB = os.environ.get("DOSE_CACHE_DB", os.path.join(tempfile.gettempdir(), "dose_cache.gpkg"))
MAX_AGE_DAYS = 30


def _get_conn():
    """Return a connection to the cache database."""
    # Use GeoPackage (SQLite) for local dev; swap for PostGIS in production
    conn = sqlite3.connect(CACHE_DB)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS provenance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            layer TEXT NOT NULL,
            source_url TEXT NOT NULL,
            access_date TEXT NOT NULL,
            license TEXT,
            resolution_m INTEGER,
            bbox TEXT NOT NULL
        )
    """)
    conn.commit()
    return conn


def get_cached(layer: str, bbox: Tuple[float, float, float, float]) -> Optional[gpd.GeoDataFrame]:
    """Return cached data if fresh (< MAX_AGE_DAYS), else None."""
    bbox_str = json.dumps(bbox)
    conn = _get_conn()
    row = conn.execute(
        "SELECT access_date FROM provenance WHERE layer=? AND bbox=? ORDER BY access_date DESC LIMIT 1",
        (layer, bbox_str)
    ).fetchone()
    conn.close()

    if row is None:
        return None

    access_date = datetime.fromisoformat(row[0])
    if datetime.now() - access_date > timedelta(days=MAX_AGE_DAYS):
        return None

    table_name = f"cache_{layer}"
    try:
        gdf = gpd.read_file(CACHE_DB, layer=table_name, bbox=bbox)
        return gdf
    except Exception:
        return None


def write_cache(layer: str, bbox: Tuple[float, float, float, float],
                gdf: gpd.GeoDataFrame, source_url: str,
                license: str, resolution_m: int):
    """Write data + provenance to cache."""
    bbox_str = json.dumps(bbox)
    conn = _get_conn()
    conn.execute(
        "INSERT INTO provenance (layer, source_url, access_date, license, resolution_m, bbox) VALUES (?, ?, ?, ?, ?, ?)",
        (layer, source_url, datetime.now().isoformat(), license, resolution_m, bbox_str)
    )
    conn.commit()
    conn.close()

    table_name = f"cache_{layer}"
    gdf.to_file(CACHE_DB, layer=table_name, driver="GPKG")
