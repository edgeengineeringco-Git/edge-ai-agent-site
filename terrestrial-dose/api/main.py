"""
Terrestrial Dose Indicator — FastAPI Backend
=============================================
Endpoints:
  GET /dose?lat=&lon=&month=    → full fingerprint + factors + report_short
  GET /dose/bbox?...            → coarse grid for map
  GET /health                   → health check

All dose math from dose_core/dose_calculation_core.py only.
"""

from __future__ import annotations
import os
import sys

# Ensure imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from dose_core.dose_calculation_core import (
    polygon_dose_fingerprint,
    RISK,
    WORLD_AVG_DOSE,
    WHO_RN_ACTION,
)
from models.assemble_factors import assemble_factors, get_dose_input
from models.european_geology_mosaic import get_full_lookup, ALL_REGIONS

app = FastAPI(
    title="European Terrestrial Dose Indicator API",
    version="2.0.0",
    description=(
        "Estimates terrestrial radiation dose (radon, thoron, gamma) at any European land point. "
        "All dose math from UNSCEAR 2024 / ICRP 137 / EU BSS. "
        "Geology from national 1:50k–1:100k surveys."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ══════════════════════════════════════════════════════════════════════════════
# SHORT REPORT GENERATOR — templated from computed fields
# ══════════════════════════════════════════════════════════════════════════════

def generate_report_short(fp: dict, factors: dict, lon: float, lat: float) -> dict:
    """Generate ≤8-line short report from computed fields only."""
    arms = fp["arms_mSv_yr"]
    total = fp["total_terrestrial_mSv_yr"]
    acts = fp["activities_Bq_kg"]
    idx = fp["indices"]
    risk = fp["risk"]
    lith = factors["lithology"]
    transport = factors["transport"]
    surface = factors["surface"]

    # Find dominant arm
    entries = [("radon", arms["radon"]), ("thoron", arms["thoron"]), ("gamma", arms["gamma"])]
    dominant = max(entries, key=lambda x: x[1])
    share_pct = round((dominant[1] / total * 100)) if total > 0 else 0

    lines = []

    # Line 1: Dominant source
    if dominant[0] == "gamma":
        lines.append(f"Gamma dose ({arms['gamma']:.2f} mSv/yr, {share_pct}% of total) dominates.")
    elif dominant[0] == "radon":
        lines.append(f"Radon inhalation ({arms['radon']:.2f} mSv/yr, {share_pct}% of total) dominates.")
    else:
        lines.append(f"Thoron inhalation ({arms['thoron']:.2f} mSv/yr, {share_pct}% of total) dominates.")

    # Line 2: Lithology
    lith_label = lith["label"]
    lines.append(f"Geology: {lith_label}. Scale: 1:{lith['map_scale']}. Cell: {lith['cell_m']}m.")

    # Line 3: Activities
    lines.append(f"Activities: Ra-226={acts['A_Ra226']:.0f}, Th-232={acts['A_Th232']:.0f}, K-40={acts['A_K40']:.0f} Bq/kg.")

    # Line 4: Radon
    lines.append(f"Indoor Rn: {idx['indoor_Rn']:.0f} Bq/m³ (WHO action: {WHO_RN_ACTION}, EU BSS action: 300).")

    # Line 5: Gamma rate
    lines.append(f"Gamma rate: {fp['gamma_rate_nGy_h']:.0f} nGy/h (world avg: 59).")

    # Line 6: vs UNSCEAR average
    ratio = total / WORLD_AVG_DOSE
    if total > WORLD_AVG_DOSE:
        lines.append(f"Total ({total:.2f} mSv/yr) is {ratio:.1f}× UNSCEAR average ({WORLD_AVG_DOSE} mSv/yr) — {risk['tier']}.")
    else:
        lines.append(f"Total ({total:.2f} mSv/yr) is at/below UNSCEAR average ({WORLD_AVG_DOSE} mSv/yr) — {risk['tier']}.")

    # Line 7: Top EO factor (if in top 3 effects)
    # Check if NDVI, moisture, or alteration are notable
    eo_notes = []
    if surface["ndvi"] is not None and surface["ndvi"] < 0.3:
        eo_notes.append(f"NDVI={surface['ndvi']:.2f} — bare soil, gamma up")
    if transport["soil_moisture"] is not None and transport["soil_moisture"] > 0.35:
        eo_notes.append(f"Soil moisture={transport['soil_moisture']:.2f} — exhalation suppressed")
    if surface["s2_alteration"] is not None and surface["s2_alteration"].get("alteration_flag"):
        eo_notes.append("S2: Fe-oxide/clay alteration detected")
    if eo_notes:
        lines.append(f"EO: {eo_notes[0]}.")

    # Line 8: Confidence
    conf = fp["confidence"]
    if conf < 30:
        lines.append(f"Confidence: {conf}% — geology-prior estimate only.")
    elif conf < 60:
        lines.append(f"Confidence: {conf}% — partial data.")
    else:
        lines.append(f"Confidence: {conf}% — measurement-backed.")

    return {
        "lines": lines,
        "dominant": dominant[0],
        "share_pct": share_pct,
        "vs_world_avg": round(ratio, 2),
        "eo_notes": eo_notes,
        "lithology_label": lith_label,
        "cell_m": lith["cell_m"],
        "map_scale": lith["map_scale"],
        "meets_target_resolution": lith["meets_target_resolution"],
    }


# ══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": "2.0.0",
        "geology_regions": len(ALL_REGIONS),
        "dose_source": "dose_calculation_core.py (DO NOT MODIFY)",
    }


@app.get("/dose")
def dose_endpoint(
    lat: float = Query(..., ge=-90, le=90, description="Latitude (WGS84)"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude (WGS84)"),
    month: int = Query(None, ge=1, le=12, description="Month (1-12, for seasonal factor)"),
):
    """Compute full dose fingerprint at a point.

    Returns:
        - arms_mSv_yr: {radon, thoron, gamma}
        - total_terrestrial_mSv_yr
        - gamma_rate_nGy_h
        - activities_Bq_kg: {A_Ra226, A_Th232, A_K40}
        - indices: {raeq, I_gamma, indoor_Rn, indoor_Tn, ELCR}
        - risk: {tier, reasons, flags}
        - analysis: {dominant, share_pct, why, expected_or_anomaly, vs_world_avg}
        - factors[]: all sampled drivers with value, status, source
        - report_short: ≤8 lines
        - confidence: 0-100
        - provenance: list of data sources
        - cell_m: cell size in metres
        - map_scale: geology map scale
        - meets_target_resolution: bool
    """
    # 1. Get all factors at this point
    factors = assemble_factors(lon, lat, month)

    lith = factors["lithology"]
    glim = lith["glim"]

    # Handle water/ice
    if glim in ("water", "Wa", "ice", "Ice"):
        return JSONResponse({
            "lat": lat, "lon": lon,
            "glim": glim,
            "region": lith["region"],
            "arms_mSv_yr": {"radon": 0, "thoron": 0, "gamma": 0},
            "total_terrestrial_mSv_yr": 0,
            "gamma_rate_nGy_h": 0,
            "risk": {"tier": "GREEN", "reasons": ["Water/ice — no terrestrial dose"], "flags": []},
            "analysis": {
                "dominant": "none", "share_pct": 0,
                "why": ["Water or ice — no terrestrial dose pathway."],
                "expected_or_anomaly": "expected", "vs_world_avg": 0,
            },
            "factors": factors["factors"],
            "report_short": {"lines": ["Water/ice body — no terrestrial dose."]},
            "confidence": {"level": "n/a", "score": 0},
            "cell_m": lith["cell_m"],
            "map_scale": lith["map_scale"],
            "meets_target_resolution": lith["meets_target_resolution"],
        })

    # 2. Get dose input parameters
    dose_input = get_dose_input(lon, lat, month)

    # 3. Compute dose using core module (DO NOT MODIFY)
    fp = polygon_dose_fingerprint(
        lithology=dose_input["lithology"],
        dist_fault_m=dose_input["dist_fault_m"],
        lineament_density=dose_input["lineament_density"],
        permeability=dose_input["permeability"],
    )

    # 4. Generate short report
    report_short = generate_report_short(fp, factors, lon, lat)

    # 5. Build analysis (templated)
    arms = fp["arms_mSv_yr"]
    total = fp["total_terrestrial_mSv_yr"]
    entries = [("radon", arms["radon"]), ("thoron", arms["thoron"]), ("gamma", arms["gamma"])]
    dominant = max(entries, key=lambda x: x[1])
    share_pct = round((dominant[1] / total * 100)) if total > 0 else 0
    risk = fp["risk"]

    why = report_short["lines"]
    expected = "expected" if total <= 2.2 else ("elevated" if total <= 5 else "anomaly")

    # 6. Confidence
    conf = fp["confidence"]
    if not lith["meets_target_resolution"]:
        conf = max(conf - 20, 5)  # Lower confidence for 1:1M geology

    # 7. Build response
    return JSONResponse({
        "lat": lat,
        "lon": lon,
        "glim": glim,
        "region": lith["region"],
        "national_survey": lith["national_survey"],
        "arms_mSv_yr": fp["arms_mSv_yr"],
        "total_terrestrial_mSv_yr": fp["total_terrestrial_mSv_yr"],
        "gamma_rate_nGy_h": fp["gamma_rate_nGy_h"],
        "activities_Bq_kg": fp["activities_Bq_kg"],
        "indices": fp["indices"],
        "risk": fp["risk"],
        "analysis": {
            "dominant": dominant[0],
            "share_pct": share_pct,
            "why": why,
            "expected_or_anomaly": expected,
            "vs_world_avg": round(total / 2.2, 2),
        },
        "factors": factors["factors"],
        "report_short": report_short,
        "confidence": {
            "score": conf,
            "level": "high" if conf >= 60 else ("medium" if conf >= 30 else "low"),
            "reason": "Direct measurement data available" if conf >= 60
                      else "Geology prior; partial data" if conf >= 30
                      else "Geology-prior estimate only (GLiM ~1.5 km)",
        },
        "provenance": fp["provenance"],
        "cell_m": lith["cell_m"],
        "map_scale": lith["map_scale"],
        "meets_target_resolution": lith["meets_target_resolution"],
        "constants": fp["constants"],
    })


@app.get("/dose/bbox")
def dose_bbox(
    south: float = Query(..., ge=-90, le=90),
    west: float = Query(..., ge=-180, le=180),
    north: float = Query(..., ge=-90, le=90),
    east: float = Query(..., ge=-180, le=180),
    step: float = Query(0.5, ge=0.1, le=5.0, description="Grid step in degrees"),
):
    """Return dose grid for a bounding box."""
    features = []
    lat = south
    while lat <= north:
        lng = west
        while lng <= east:
            geo = get_full_lookup(lng, lat)
            glim = geo["glim"]
            if glim not in ("water", "Wa", "ice", "Ice"):
                fp = polygon_dose_fingerprint(
                    lithology=glim,
                    dist_fault_m=5000,
                    lineament_density=0,
                    permeability=0.5,
                )
                features.append({
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [lng, lat]},
                    "properties": {
                        "dose": fp["total_terrestrial_mSv_yr"],
                        "tier": fp["risk"]["tier"],
                        "radon": fp["arms_mSv_yr"]["radon"],
                        "thoron": fp["arms_mSv_yr"]["thoron"],
                        "gamma": fp["arms_mSv_yr"]["gamma"],
                        "lithology": glim,
                        "region": geo["region"],
                        "map_scale": geo["map_scale"],
                        "cell_m": geo["cell_m"],
                    },
                })
            lng += step
        lat += step

    return JSONResponse({
        "type": "FeatureCollection",
        "features": features,
        "meta": {"step_deg": step, "bbox": [south, west, north, east]},
    })


@app.get("/geology")
def geology_at(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
):
    """Return geology lookup at a point."""
    return JSONResponse(get_full_lookup(lon, lat))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
