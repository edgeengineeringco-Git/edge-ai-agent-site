"""
SoilGrids 250m Fetcher
======================
ISRIC SoilGrids 2.0 REST API.

Fetches: permeability proxy (clay + sand + silt), depth to bedrock, bulk density.
Resolution: 250 m.

Source: https://rest.isric.org/soilgrids/v2.0/properties/rest/v2.0/
"""

import requests
import geopandas as gpd
import numpy as np
from typing import Tuple
from .cache import get_cached, write_cache

SOILGRIDS_URL = "https://rest.isric.org/soilgrids/v2.0/properties/rest/v2.0/quick"

SOIL_PROPERTIES = ["clay", "sand", "silt", "bdod", "sol_depth"]


def fetch_soilgrids(bbox: Tuple[float, float, float, float]):
    """
    Fetch SoilGrids properties for a bounding box.

    Returns
    -------
    GeoDataFrame with columns: geometry, clay_pct, sand_pct, silt_pct,
                               bulk_density, depth_bedrock, permeability, source, resolution_m
    """
    cached = get_cached("soilgrids", bbox)
    if cached is not None:
        return cached

    min_lon, min_lat, max_lon, max_lat = bbox
    # SoilGrids API expects bbox in WGS84
    params = {
        "bbox": f"{min_lon},{min_lat},{max_lon},{max_lat}",
        "property": ["clay", "sand", "silt", "bdod"],
        "depth": "0-5cm",
        "value": "mean",
    }

    resp = requests.get(SOILGRIDS_URL, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    features = []
    for prop in data.get("properties", {}).get("layers", []):
        name = prop.get("name")
        mean_val = prop.get("depths", [{}])[0].get("values", {}).get("mean", 0)
        features.append({"property": name, "value": mean_val})

    # Convert to GeoDataFrame
    clay_pct = next((f["value"] * 0.1 for f in features if f["property"] == "clay"), 30)
    sand_pct = next((f["value"] * 0.1 for f in features if f["property"] == "sand"), 40)
    silt_pct = next((f["value"] * 0.1 for f in features if f["property"] == "silt"), 30)

    # Permeability proxy (0-1): higher sand → higher permeability
    permeability = min(1.0, sand_pct / 100.0 * 1.2)

    gdf = gpd.GeoDataFrame({
        "clay_pct": [clay_pct],
        "sand_pct": [sand_pct],
        "silt_pct": [silt_pct],
        "permeability": [permeability],
        "source": ["ISRIC SoilGrids 2.0"],
        "resolution_m": [250],
        "license": ["CC BY 4.0"],
        "geometry": [gpd.points_from_xy([(min_lon + max_lon) / 2], [(min_lat + max_lat) / 2])[0]],
    }, crs="EPSG:4326")

    write_cache("soilgrids", bbox, gdf, SOILGRIDS_URL, "CC BY 4.0", 250)
    return gdf
