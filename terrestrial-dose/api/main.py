"""
Terrestrial Dose Indicator API
==============================
FastAPI endpoints for polygon dose fingerprints.

Run locally:
    cd terrestrial-dose
    uvicorn api.main:app --reload --port 8000
"""

from __future__ import annotations
import sys
import os
import math
from typing import Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from dose_core.dose_calculation_core import (
    polygon_dose_fingerprint,
    radon_inhalation_dose,
    risk_class,
    LITHOLOGY_ACTIVITIES,
    GLIM_MAP,
)

app = FastAPI(
    title="Terrestrial Dose Indicator API",
    description="Geogenic radiation dose estimation per UNSCEAR 2024, ICRP 137, EU BSS.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def buffer_bbox(lat: float, lon: float, radius_m: int = 1000) -> tuple:
    """Create a bounding box around a point."""
    deg = radius_m / 111000
    return (lon - deg, lat - deg, lon + deg, lat + deg)


@app.get("/")
def root():
    return {
        "name": "Terrestrial Dose Indicator API",
        "version": "1.0.0",
        "endpoints": ["/dose", "/dose/bbox", "/lithology", "/health"],
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/dose")
def get_dose(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    radius_m: int = Query(1000, ge=100, le=50000),
    lithology: Optional[str] = Query(None, description="GLiM code or lithology name (auto-detect if omitted)"),
    eU_ppm: Optional[float] = Query(None, description="Measured eU (ppm)"),
    eTh_ppm: Optional[float] = Query(None, description="Measured eTh (ppm)"),
    K_pct: Optional[float] = Query(None, description="Measured K (%)"),
    C_Rn: Optional[float] = Query(None, description="Measured indoor radon (Bq/m³)"),
    C_Tn: Optional[float] = Query(None, description="Measured indoor thoron (Bq/m³)"),
    radon_method: str = Query("eubss", description="DCF method: eubss, icrp137, unscear, icrp65"),
):
    """
    Compute the full terrestrial dose fingerprint for a location.

    Returns arms (radon/thoron/gamma in mSv/yr), activities (Bq/kg),
    risk tier (GREEN/AMBER/RED), provenance, and confidence.
    """
    bbox = buffer_bbox(lat, lon, radius_m)

    # 1. Lithology — try GLiM, fallback to world_average_soil
    if lithology is None:
        try:
            from ingest.glim import lithology_at_point
            lithology = lithology_at_point(lon, lat)
        except Exception:
            lithology = "world_average_soil"

    # 2. Soil permeability — try SoilGrids
    permeability = None
    try:
        from ingest.soilgrids import fetch_soilgrids
        soil = fetch_soilgrids(bbox)
        if len(soil) > 0:
            permeability = float(soil["permeability"].iloc[0])
    except Exception:
        pass

    # 3. Fault distance + lineament density
    dist_fault_m = 5000
    lineament_density = 0.0
    try:
        from ingest.faults import fetch_gem_faults, distance_to_nearest_fault, compute_lineament_density
        faults = fetch_gem_faults(bbox)
        dist_fault_m = distance_to_nearest_fault(lat, lon, faults, bbox)
        lineament_density = compute_lineament_density(bbox, faults)
    except Exception:
        pass

    # 4. Compute dose fingerprint
    fp = polygon_dose_fingerprint(
        lithology=lithology,
        dist_fault_m=dist_fault_m,
        lineament_density=lineament_density,
        eU_ppm=eU_ppm,
        eTh_ppm=eTh_ppm,
        K_pct=K_pct,
        C_Rn=C_Rn,
        C_Tn=C_Tn,
        permeability=permeability,
        radon_method=radon_method,
    )
    fp["lat"] = lat
    fp["lon"] = lon
    fp["radius_m"] = radius_m
    fp["bbox"] = list(bbox)
    return fp


@app.get("/dose/bbox")
def get_dose_grid(
    min_lat: float = Query(..., ge=-90, le=90),
    min_lon: float = Query(..., ge=-180, le=180),
    max_lat: float = Query(..., ge=-90, le=90),
    max_lon: float = Query(..., ge=-180, le=180),
    grid_step: float = Query(0.5, ge=0.1, le=5.0, description="Grid spacing in degrees"),
):
    """Return a grid of dose fingerprints for map tiling."""
    results = []
    lat = min_lat
    while lat <= max_lat:
        lon = min_lon
        while lon <= max_lon:
            try:
                from ingest.glim import lithology_at_point
                lith = lithology_at_point(lon, lat)
            except Exception:
                lith = "world_average_soil"

            fp = polygon_dose_fingerprint(lithology=lith)
            results.append({
                "lat": round(lat, 4),
                "lon": round(lon, 4),
                "lithology": fp["lithology"],
                "risk_tier": fp["risk"]["tier"],
                "total_mSv_yr": fp["total_terrestrial_mSv_yr"],
                "gamma_rate": fp["gamma_rate_nGy_h"],
            })
            lon += grid_step
        lat += grid_step

    return {"count": len(results), "grid_step": grid_step, "features": results}


@app.get("/lithology")
def get_lithology_list():
    """Return all available lithology types with typical activities."""
    result = {}
    for code, desc in GLIM_MAP.items():
        key = desc if desc in LITHOLOGY_ACTIVITIES else code
        act = LITHOLOGY_ACTIVITIES.get(key, LITHOLOGY_ACTIVITIES["world_average_soil"])
        result[code] = {
            "description": act.get("label", code),
            "A_Ra226": act["A_Ra226"],
            "A_Th232": act["A_Th232"],
            "A_K40": act["A_K40"],
        }
    return result
