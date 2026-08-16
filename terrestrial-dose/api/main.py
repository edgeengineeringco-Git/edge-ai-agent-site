"""
Euro-Dose API v2.0 — Stage 2: per-point data reading + fixed dose logic
"""

from __future__ import annotations
import os
import sys
import json
import logging

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
from ingest.point_sampler import PointSampler
from ingest.data_pipeline import DataIngestPipeline, ALL_DATASETS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("eurodose.api")

app = FastAPI(
    title="European Terrestrial Dose Indicator API",
    version="2.0.0",
    description="Stage 1: downloads open datasets. Stage 2: reads cached data at point, feeds fixed dose logic.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_sampler: PointSampler | None = None

def get_sampler() -> PointSampler:
    global _sampler
    if _sampler is None:
        _sampler = PointSampler()
    return _sampler


def generate_report(data: dict, fp: dict) -> dict:
    arms = fp["arms_mSv_yr"]
    total = fp["total_terrestrial_mSv_yr"]
    acts = fp["activities_Bq_kg"]
    idx = fp["indices"]
    risk = fp["risk"]
    conf = data.get("confidence", {})
    lith = data.get("lithology", {})
    geo = data.get("geochemistry", {})
    val = data.get("validation", {})
    sg = data.get("soilgrids", {})

    entries = [("radon", arms["radon"]), ("thoron", arms["thoron"]), ("gamma", arms["gamma"])]
    dominant = max(entries, key=lambda x: x[1])
    share_pct = round((dominant[1] / total * 100)) if total > 0 else 0

    lines = []
    if dominant[0] == "gamma":
        lines.append(f"Gamma dose ({arms['gamma']:.2f} mSv/yr, {share_pct}% of total) dominates.")
    elif dominant[0] == "radon":
        lines.append(f"Radon inhalation ({arms['radon']:.2f} mSv/yr, {share_pct}% of total) dominates.")
    else:
        lines.append(f"Thoron inhalation ({arms['thoron']:.2f} mSv/yr, {share_pct}% of total) dominates.")

    lith_label = lith.get("region", "Unknown geology")
    cell_m = lith.get("cell_m", 1000)
    map_scale = lith.get("resolution", "1M")
    lines.append(f"Geology: {lith_label}. Cell size: {cell_m}m (scale: 1:{map_scale}).")
    lines.append(f"Activities: Ra-226={acts['A_Ra226']:.0f}, Th-232={acts['A_Th232']:.0f}, K-40={acts['A_K40']:.0f} Bq/kg.")
    lines.append(f"Indoor Rn: {idx['indoor_Rn']:.0f} Bq/m³ (WHO: {WHO_RN_ACTION}, EU BSS: 300).")
    lines.append(f"Gamma rate: {fp['gamma_rate_nGy_h']:.0f} nGy/h (world avg: 59).")
    ratio = total / WORLD_AVG_DOSE
    lines.append(f"Total ({total:.2f} mSv/yr) is {ratio:.1f}× UNSCEAR avg ({WORLD_AVG_DOSE}) — {risk['tier']}.")

    factors = []
    if sg.get("status") == "available":
        perm = sg.get("permeability_proxy")
        if perm is not None:
            factors.append(f"SoilGrids permeability={perm:.2f}")
    if val.get("status") == "available":
        measurements = val.get("measurements", [])
        if measurements:
            factors.append(f"REMdb validation within {measurements[0].get('distance_km', '?')}km")
    if geo.get("status") == "available":
        samples = geo.get("samples", [])
        if samples:
            factors.append(f"FOREGS/GEMAS geochemistry within {samples[0].get('distance_km', '?')}km")
    if factors:
        lines.append(f"Factors: {', '.join(factors)}.")

    conf_score = conf.get("score", 0)
    conf_level = conf.get("level", "low")
    if conf_score >= 60:
        lines.append(f"Confidence: {conf_score}% ({conf_level}) — measurement-backed.")
    elif conf_score >= 30:
        lines.append(f"Confidence: {conf_score}% ({conf_level}) — partial data.")
    else:
        lines.append(f"Confidence: {conf_score}% ({conf_level}) — geology-prior only.")

    return {
        "lines": lines,
        "dominant": dominant[0],
        "share_pct": share_pct,
        "vs_world_avg": round(ratio, 2),
        "lithology_label": lith_label,
        "cell_m": cell_m,
        "map_scale": map_scale,
    }


def generate_why(data: dict, fp: dict) -> list[str]:
    arms = fp["arms_mSv_yr"]
    total = fp["total_terrestrial_mSv_yr"]
    acts = fp["activities_Bq_kg"]
    idx = fp["indices"]
    lith = data.get("lithology", {})
    sg = data.get("soilgrids", {})
    dem = data.get("dem", {})

    why = []
    entries = [("radon", arms["radon"]), ("thoron", arms["thoron"]), ("gamma", arms["gamma"])]
    dominant = max(entries, key=lambda x: x[1])
    share_pct = round((dominant[1] / total * 100)) if total > 0 else 0

    if dominant[0] == "gamma":
        why.append(f"Gamma ({arms['gamma']:.2f} mSv/yr, {share_pct}%) dominates — natural radioactivity in {lith.get('region', 'substrate')}.")
        if acts["A_K40"] > 800:
            why.append(f"High K-40 ({acts['A_K40']:.0f} Bq/kg) indicates K-feldspar-rich mineralogy.")
    elif dominant[0] == "radon":
        why.append(f"Radon ({arms['radon']:.2f} mSv/yr, {share_pct}%) dominates — {lith.get('region', 'substrate')} with Ra-226={acts['A_Ra226']:.0f} Bq/kg.")
        if idx["indoor_Rn"] > 300:
            why.append(f"Indoor radon ({idx['indoor_Rn']:.0f} Bq/m³) exceeds EU BSS action level (300).")
        elif idx["indoor_Rn"] > 100:
            why.append(f"Indoor radon ({idx['indoor_Rn']:.0f} Bq/m³) exceeds WHO reference (100).")
    else:
        why.append(f"Thoron ({arms['thoron']:.2f} mSv/yr, {share_pct}%) dominates.")
        if acts["A_Th232"] > 50:
            why.append(f"High Th-232 ({acts['A_Th232']:.0f} Bq/kg) triggers non-linear thoron enhancement.")

    if sg.get("status") == "available":
        perm = sg.get("permeability_proxy")
        if perm is not None and perm > 0.6:
            why.append(f"High soil permeability ({perm:.2f}) enhances radon/thoron exhalation.")
        elif perm is not None and perm < 0.3:
            why.append(f"Low soil permeability ({perm:.2f}) suppresses radon transport.")

    if dem.get("lineament_density", {}).get("value", 0) > 0.5:
        why.append("High lineament density indicates fracture pathways for radon.")

    if total > 5:
        why.append(f"Total dose ({total:.2f} mSv/yr) is significantly above UNSCEAR average (2.2).")
    elif total > 2.2:
        why.append(f"Total dose ({total:.2f} mSv/yr) is above UNSCEAR average (2.2).")

    return why


def generate_recommendations(data: dict, fp: dict) -> list[dict]:
    recs = []
    total = fp["total_terrestrial_mSv_yr"]
    tier = fp["risk"]["tier"]
    conf = data.get("confidence", {})
    acts = fp["activities_Bq_kg"]
    idx = fp["indices"]

    if tier == "RED":
        recs.append({"priority": "URGENT", "text": "Radon mitigation (sub-slab depressurisation) if indoor Rn exceeds 300 Bq/m³."})
    if conf.get("score", 0) < 30:
        recs.append({"priority": "HIGH", "text": "Conduct airborne gamma-ray spectrometry survey to replace geology-prior estimates."})
    if idx["indoor_Rn"] > 100:
        recs.append({"priority": "HIGH", "text": f"Deploy indoor radon detectors to validate geogenic estimate of {idx['indoor_Rn']:.0f} Bq/m³."})
    if acts["A_Th232"] > 100:
        recs.append({"priority": "MEDIUM", "text": "Thoron measurement with grab-sampling. Consider CeBr3 drone spectrometry for Th-232 mapping."})
    if conf.get("score", 0) < 60:
        recs.append({"priority": "MEDIUM", "text": "Integrate SoilGrids permeability and Copernicus DEM lineament density to refine GRP model."})
    if tier == "GREEN" and conf.get("score", 0) >= 60:
        recs.append({"priority": "LOW", "text": "No immediate action. Periodic monitoring every 5 years sufficient."})

    return recs


@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0", "stage": "Stage 2: per-point data reading + fixed logic"}


@app.get("/inventory")
def inventory():
    pipeline = DataIngestPipeline()
    return pipeline.get_inventory()


@app.get("/sample")
def sample_point(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    month: int = Query(None, ge=1, le=12),
):
    sampler = get_sampler()
    return sampler.sample(lon, lat, month)


@app.get("/dose")
def dose_endpoint(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    month: int = Query(None, ge=1, le=12),
):
    # Stage 2a: Read data
    sampler = get_sampler()
    point_data = sampler.sample(lon, lat, month)

    lith = point_data["lithology"]
    glim = lith.get("glim_code", "was")

    if glim in ("water", "Wa", "ice", "Ice"):
        return JSONResponse({
            "lat": lat, "lon": lon, "glim": glim,
            "arms_mSv_yr": {"radon": 0, "thoron": 0, "gamma": 0},
            "total_terrestrial_mSv_yr": 0,
            "risk": {"tier": "GREEN", "reasons": ["Water/ice — no terrestrial dose"], "flags": []},
            "report_short": {"lines": ["Water/ice body — no terrestrial dose."]},
            "confidence": {"score": 0, "level": "n/a", "reasons": []},
            "point_data": point_data,
        })

    # Stage 2b: Fixed dose logic
    dist_fault_m = 5000
    lineament_density = point_data.get("dem", {}).get("lineament_density", {}).get("value", 0)
    permeability = point_data.get("soilgrids", {}).get("permeability_proxy", 0.5) or 0.5

    fp = polygon_dose_fingerprint(
        lithology=glim,
        dist_fault_m=dist_fault_m,
        lineament_density=lineament_density,
        permeability=permeability,
    )

    # Stage 2c: Templated report
    report_short = generate_report(point_data, fp)
    why = generate_why(point_data, fp)
    recs = generate_recommendations(point_data, fp)

    return JSONResponse({
        "lat": lat, "lon": lon,
        "glim": glim,
        "region": lith.get("region", "Unknown"),
        "national_survey": lith.get("source", "Built-in"),
        "arms_mSv_yr": fp["arms_mSv_yr"],
        "total_terrestrial_mSv_yr": fp["total_terrestrial_mSv_yr"],
        "gamma_rate_nGy_h": fp["gamma_rate_nGy_h"],
        "activities_Bq_kg": fp["activities_Bq_kg"],
        "indices": fp["indices"],
        "risk": fp["risk"],
        "analysis": {
            "dominant": report_short["dominant"],
            "share_pct": report_short["share_pct"],
            "why": why,
            "expected_or_anomaly": "expected" if fp["total_terrestrial_mSv_yr"] <= 2.2 else ("elevated" if fp["total_terrestrial_mSv_yr"] <= 5 else "anomaly"),
            "vs_world_avg": report_short["vs_world_avg"],
        },
        "report_short": report_short,
        "recommendations": recs,
        "confidence": point_data.get("confidence", {}),
        "provenance": point_data.get("provenance", []),
        "cell_m": lith.get("cell_m", 1000),
        "map_scale": lith.get("resolution", "1M"),
        "meets_target_resolution": lith.get("meets_target_resolution", False),
        "point_data": point_data,
    })


@app.get("/dose/bbox")
def dose_bbox(
    south: float = Query(..., ge=-90, le=90),
    west: float = Query(..., ge=-180, le=180),
    north: float = Query(..., ge=-90, le=90),
    east: float = Query(..., ge=-180, le=180),
    step: float = Query(0.5, ge=0.1, le=5.0),
):
    features = []
    lat = south
    sampler = get_sampler()
    while lat <= north:
        lng = west
        while lng <= east:
            pd = sampler.sample(lng, lat)
            lith = pd["lithology"]
            glim = lith.get("glim_code", "was")
            if glim not in ("water", "Wa", "ice", "Ice"):
                fp = polygon_dose_fingerprint(lithology=glim, dist_fault_m=5000, lineament_density=0, permeability=0.5)
                features.append({
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [lng, lat]},
                    "properties": {
                        "dose": fp["total_terrestrial_mSv_yr"],
                        "tier": fp["risk"]["tier"],
                        "lithology": glim,
                        "region": lith.get("region", "Unknown"),
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
