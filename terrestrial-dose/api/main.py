"""
FastAPI backend for Terrestrial Dose Indicator
===============================================
Endpoints:
  GET /dose?lat=&lon=         → full dose fingerprint for a point
  GET /dose/bbox?...          → coarse grid for map tiles
  GET /health                 → health check

All dose math is delegated to dose_calculation_core.py — no formulas here.
"""

from __future__ import annotations
import os, sys

# Ensure dose_core is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from dose_core.dose_calculation_core import (
    polygon_dose_fingerprint,
    _resolve_lithology,
    LITHOLOGY_ACTIVITIES,
)

app = FastAPI(
    title="Terrestrial Dose Indicator API",
    version="1.0.0",
    description="Estimates terrestrial radiation dose (radon, thoron, gamma) at any European land point.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Lithology lookup (simplified European grid) ──
LITHO_REGIONS = [
    # Ireland
    {"name": "Leinster Granite", "glim": "Pa", "coords": [-6.8, 52.2, -6.0, 53.0]},
    {"name": "Galway Granite", "glim": "Pa", "coords": [-10.2, 53.0, -9.5, 53.5]},
    {"name": "Donegal Granite", "glim": "Pa", "coords": [-8.4, 54.6, -7.6, 55.3]},
    {"name": "Connemara Gneiss", "glim": "Mt", "coords": [-10.3, 53.2, -9.5, 53.6]},
    {"name": "Irish Midlands Limestone", "glim": "Sc", "coords": [-8.5, 52.5, -6.5, 54.0]},
    {"name": "Burren Limestone", "glim": "Sc", "coords": [-9.4, 52.9, -8.8, 53.2]},
    {"name": "Kerry Slates", "glim": "Mt", "coords": [-10.5, 51.7, -9.5, 52.3]},
    {"name": "Cork-Kerry Sandstones", "glim": "Ss", "coords": [-10.0, 51.4, -8.5, 52.0]},
    {"name": "Ulster Basalt", "glim": "Vb", "coords": [-8.0, 54.5, -5.5, 55.4]},
    # Britain
    {"name": "Scottish Highlands", "glim": "Mt", "coords": [-6.0, 56.5, -2.0, 58.6]},
    {"name": "Midland Valley", "glim": "Ss", "coords": [-5.0, 55.5, -2.5, 56.5]},
    {"name": "Cornubian Granite", "glim": "Pa", "coords": [-6.0, 50.0, -4.0, 51.0]},
    {"name": "Wessex Basin Chalk", "glim": "Sc", "coords": [-2.5, 50.5, 1.5, 51.5]},
    {"name": "Pennines Limestone", "glim": "Sc", "coords": [-2.5, 53.5, -1.0, 55.0]},
    {"name": "Welsh Basin", "glim": "Mt", "coords": [-5.0, 51.5, -3.0, 53.5]},
    # France
    {"name": "Massif Central", "glim": "Pa", "coords": [2.0, 44.0, 5.0, 46.5]},
    {"name": "Armorican Massif", "glim": "Mt", "coords": [-5.0, 47.0, -1.0, 49.0]},
    {"name": "Paris Basin", "glim": "Sc", "coords": [0.0, 47.0, 4.0, 50.0]},
    {"name": "Aquitaine Basin", "glim": "Ss", "coords": [-1.5, 43.5, 2.0, 46.0]},
    {"name": "Pyrenees", "glim": "Mt", "coords": [-1.5, 42.5, 3.0, 43.0]},
    {"name": "Provence", "glim": "Sc", "coords": [4.0, 43.0, 7.5, 44.5]},
    # Germany
    {"name": "Black Forest", "glim": "Mt", "coords": [7.5, 47.5, 9.5, 48.8]},
    {"name": "Harz Mountains", "glim": "Mt", "coords": [10.0, 51.5, 11.5, 52.0]},
    {"name": "Rhenish Massif", "glim": "Mt", "coords": [6.0, 50.0, 9.0, 51.5]},
    {"name": "North German Plain", "glim": "Su", "coords": [6.0, 52.0, 15.0, 55.0]},
    {"name": "Bohemian Massif", "glim": "Mt", "coords": [11.0, 48.5, 17.0, 51.0]},
    # Scandinavia
    {"name": "Scandinavian Shield", "glim": "Mt", "coords": [5.0, 55.0, 30.0, 71.0]},
    {"name": "Baltic Shield", "glim": "Mt", "coords": [20.0, 56.0, 40.0, 70.0]},
    # Iberia
    {"name": "Iberian Meseta", "glim": "Mt", "coords": [-8.0, 38.0, -1.0, 43.0]},
    {"name": "Galician Granite", "glim": "Pa", "coords": [-9.5, 41.8, -7.0, 43.8]},
    {"name": "Betic Cordillera", "glim": "Mt", "coords": [-6.0, 36.0, -1.0, 38.0]},
    # Italy
    {"name": "Alps Crystalline", "glim": "Mt", "coords": [6.0, 45.8, 14.0, 48.0]},
    {"name": "Po Basin", "glim": "Su", "coords": [7.0, 44.0, 13.0, 46.0]},
    {"name": "Apennines", "glim": "Sc", "coords": [10.0, 41.0, 16.5, 44.5]},
    {"name": "Sardinia", "glim": "Mt", "coords": [8.0, 38.8, 10.0, 41.3]},
    {"name": "Sicily", "glim": "Sc", "coords": [12.5, 36.6, 15.8, 38.3]},
    # Alps & Central
    {"name": "Swiss Alps", "glim": "Mt", "coords": [6.0, 45.8, 10.5, 47.8]},
    {"name": "Carpathians", "glim": "Mt", "coords": [17.0, 45.5, 27.0, 49.5]},
    {"name": "Pannonian Basin", "glim": "Su", "coords": [14.0, 45.5, 23.0, 48.5]},
    # Balkans
    {"name": "Dinarides", "glim": "Sc", "coords": [13.5, 42.0, 20.5, 46.0]},
    {"name": "Hellenides", "glim": "Mt", "coords": [20.0, 37.0, 26.0, 42.0]},
    {"name": "Rhodope Massif", "glim": "Mt", "coords": [22.0, 40.0, 28.0, 43.0]},
    # Eastern Europe
    {"name": "East European Craton", "glim": "Mt", "coords": [25.0, 50.0, 45.0, 65.0]},
    {"name": "Ural Mountains", "glim": "Mt", "coords": [55.0, 50.0, 65.0, 66.0]},
    # Special
    {"name": "Kerala Monazite", "glim": "monazite_bearing", "coords": [76.0, 8.0, 78.0, 12.0]},
    {"name": "Ramsar", "glim": "monazite_bearing", "coords": [50.0, 36.0, 51.0, 37.5]},
    {"name": "Iceland", "glim": "Vb", "coords": [-25.0, 63.0, -13.0, 67.0]},
]


def get_lithology(lon: float, lat: float) -> tuple[str, str]:
    """Return (glim_code, region_name) for a point."""
    if lat < -65:
        return "Ice", "Antarctic Ice"
    for r in LITHO_REGIONS:
        minLon, minLat, maxLon, maxLat = r["coords"]
        if minLon <= lon <= maxLon and minLat <= lat <= maxLat:
            return r["glim"], r["name"]
    abs_lat = abs(lat)
    if abs_lat > 75:
        return "Ice", "Polar ice"
    if abs_lat > 60:
        return "Mt", "Shield/taiga"
    if abs_lat < 15:
        return "Su", "Tropical lowlands"
    return "world_average_soil", "World Average Soil"


def build_analysis(fp: dict, lon: float, lat: float) -> dict:
    """Build templated analysis from fingerprint fields."""
    arms = fp["arms_mSv_yr"]
    total = fp["total_terrestrial_mSv_yr"]
    acts = fp["activities_Bq_kg"]
    idx = fp["indices"]
    risk = fp["risk"]
    lith_label = fp["lithology_label"]

    entries = [("radon", arms["radon"]), ("thoron", arms["thoron"]), ("gamma", arms["gamma"])]
    dominant = max(entries, key=lambda x: x[1])
    share_pct = round((dominant[1] / total * 100)) if total > 0 else 0

    why = []
    if dominant[0] == "gamma":
        why.append(f"Gamma dose ({arms['gamma']:.2f} mSv/yr, {share_pct}% of total) dominates, driven by {lith_label.lower()} radioactivity.")
        if acts["A_K40"] > 800:
            why.append(f"High K-40 ({acts['A_K40']:.0f} Bq/kg) indicates K-feldspar-rich mineralogy.")
    elif dominant[0] == "radon":
        why.append(f"Radon-222 inhalation ({arms['radon']:.2f} mSv/yr, {share_pct}% of total) is the primary pathway.")
        if idx["indoor_Rn"] > 300:
            why.append(f"Indoor radon ({idx['indoor_Rn']:.0f} Bq/m³) exceeds the EU BSS action level.")
    else:
        why.append(f"Thoron-220 inhalation ({arms['thoron']:.2f} mSv/yr, {share_pct}% of total) dominates.")
        if acts["A_Th232"] > 50:
            why.append(f"High Th-232 ({acts['A_Th232']:.0f} Bq/kg) — characteristic of monazite/REE soils.")

    why.append(f"Geology: {lith_label}. Ra-226={acts['A_Ra226']:.0f}, Th-232={acts['A_Th232']:.0f}, K-40={acts['A_K40']:.0f} Bq/kg.")

    region_name = get_lithology(lon, lat)[1]
    why.append(f"Province: {region_name}.")

    if total > 5:
        why.append(f"Total dose ({total:.2f} mSv/yr) significantly exceeds UNSCEAR average — flagged {risk['tier']}.")
    elif total > 2.2:
        why.append(f"Total dose ({total:.2f} mSv/yr) is above UNSCEAR average — classified {risk['tier']}.")
    else:
        why.append(f"Total dose ({total:.2f} mSv/yr) is at/below UNSCEAR average — classified {risk['tier']}.")

    if fp["confidence"] < 30:
        why.append("Estimate based on geology-prior modelling (GLiM ~1.5 km). No direct measurements at this location.")

    expected = "expected" if total <= 2.2 else ("elevated" if total <= 5 else "anomaly")

    return {
        "dominant": dominant[0],
        "share_pct": share_pct,
        "why": why,
        "expected_or_anomaly": expected,
        "vs_world_avg": round(total / 2.2, 2),
    }


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/dose")
def dose_endpoint(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
):
    """Compute dose fingerprint for a single point."""
    glim_code, region_name = get_lithology(lon, lat)

    if glim_code in ("Ice", "Wa"):
        return JSONResponse({
            "lat": lat, "lon": lon,
            "cell_m": 250,
            "arms_mSv_yr": {"radon": 0, "thoron": 0, "gamma": 0},
            "total_terrestrial_mSv_yr": 0,
            "risk": {"tier": "GREEN", "flags": []},
            "analysis": {
                "dominant": "none",
                "share_pct": 0,
                "why": ["Water or ice — no terrestrial dose."],
                "expected_or_anomaly": "expected",
                "vs_world_avg": 0,
            },
            "confidence": {"level": "n/a", "reason": "Water/ice body"},
            "provenance": [],
            "resolution_note": "N/A — water/ice",
        })

    fp = polygon_dose_fingerprint(lithology=glim_code, lat=lat, lon=lon)
    analysis = build_analysis(fp, lon, lat)

    conf_level = "high" if fp["confidence"] >= 60 else ("medium" if fp["confidence"] >= 30 else "low")
    conf_reason = (
        "Direct measurement data available" if conf_level == "high"
        else "Geology prior; no direct measurements within 50 km" if conf_level == "low"
        else "Partial data — some measured, some estimated"
    )

    return JSONResponse({
        "lat": lat,
        "lon": lon,
        "cell_m": 250,
        "region": region_name,
        "arms_mSv_yr": fp["arms_mSv_yr"],
        "total_terrestrial_mSv_yr": fp["total_terrestrial_mSv_yr"],
        "gamma_rate_nGy_h": fp["gamma_rate_nGy_h"],
        "activities_Bq_kg": fp["activities_Bq_kg"],
        "indices": fp["indices"],
        "risk": fp["risk"],
        "analysis": analysis,
        "confidence": {"level": conf_level, "reason": conf_reason, "score": fp["confidence"]},
        "provenance": fp["provenance"],
        "resolution_note": "Limited by GLiM lithology resolution (~1.5 km)" if fp["confidence"] < 30 else "Partial measurement data",
        "lithology": fp["lithology"],
        "lithology_label": fp["lithology_label"],
    })


@app.get("/dose/bbox")
def dose_bbox(
    south: float = Query(..., ge=-90, le=90),
    west: float = Query(..., ge=-180, le=180),
    north: float = Query(..., ge=-90, le=90),
    east: float = Query(..., ge=-180, le=180),
    step: float = Query(1.0, ge=0.1, le=10, description="Grid step in degrees"),
):
    """Return coarse grid of dose fingerprints for a bounding box."""
    features = []
    lat = south
    while lat <= north:
        lng = west
        while lng <= east:
            glim_code, region_name = get_lithology(lng, lat)
            if glim_code not in ("Ice", "Wa"):
                fp = polygon_dose_fingerprint(lithology=glim_code, lat=lat, lon=lng)
                features.append({
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [lng, lat]},
                    "properties": {
                        "dose": fp["total_terrestrial_mSv_yr"],
                        "tier": fp["risk"]["tier"],
                        "radon": fp["arms_mSv_yr"]["radon"],
                        "thoron": fp["arms_mSv_yr"]["thoron"],
                        "gamma": fp["arms_mSv_yr"]["gamma"],
                        "lithology": glim_code,
                        "region": region_name,
                    },
                })
            lng += step
        lat += step

    return JSONResponse({
        "type": "FeatureCollection",
        "features": features,
        "meta": {"step_deg": step, "bbox": [south, west, north, east]},
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
