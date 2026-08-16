"""
GEM Global Active Faults Fetcher
================================
GitHub: GEMScienceTools/gem-global-active-faults

Fetches active fault lines and computes:
- distance_to_nearest_fault for a given point
- lineament_density from fault density in a bounding box
"""

import geopandas as gpd
import numpy as np
from typing import Tuple, Optional
from shapely.geometry import Point
from .cache import get_cached, write_cache

GEM_FAULTS_URL = "https://raw.githubusercontent.com/GEMScienceTools/gem-global-active-faults/master/geojson/gem_active_faults_harmonized.geojson"


def fetch_gem_faults(bbox: Tuple[float, float, float, float]):
    """
    Fetch GEM Global Active Faults for a bounding box.

    Returns
    -------
    GeoDataFrame with columns: geometry, name, fault_type, source, resolution_m
    """
    cached = get_cached("gem_faults", bbox)
    if cached is not None:
        return cached

    gdf = gpd.read_file(GEM_FAULTS_URL, bbox=bbox)
    gdf["source"] = "GEM Global Active Faults (Piacenti et al. 2022)"
    gdf["resolution_m"] = 1000
    gdf["license"] = "CC BY 4.0"

    write_cache("gem_faults", bbox, gdf, GEM_FAULTS_URL, "CC BY 4.0", 1000)
    return gdf


def distance_to_nearest_fault(lat: float, lon: float,
                               faults_gdf: Optional[gpd.GeoDataFrame] = None,
                               bbox: Optional[Tuple[float, float, float, float]] = None) -> float:
    """
    Compute distance (m) from a point to the nearest active fault.
    """
    if faults_gdf is None:
        if bbox is None:
            bbox = (lon - 1, lat - 1, lon + 1, lat + 1)
        faults_gdf = fetch_gem_faults(bbox)

    if len(faults_gdf) == 0:
        return 50000  # 50 km if no faults in bbox

    pt = Point(lon, lat)
    # Project to a local CRS for accurate distance (approximate)
    distances = faults_gdf.geometry.distance(pt)
    # Convert degrees to meters (approximate: 1° ≈ 111 km)
    min_dist_deg = distances.min()
    return min_dist_deg * 111000


def compute_lineament_density(bbox: Tuple[float, float, float, float],
                               faults_gdf: Optional[gpd.GeoDataFrame] = None) -> float:
    """
    Compute lineament density index (0-1) from fault line density.
    """
    if faults_gdf is None:
        faults_gdf = fetch_gem_faults(bbox)

    min_lon, min_lat, max_lon, max_lat = bbox
    area_km2 = (max_lon - min_lon) * 111 * (max_lat - min_lat) * 111

    if len(faults_gdf) == 0 or area_km2 == 0:
        return 0.0

    # Total fault length (approximate from geometry length)
    total_length = faults_gdf.geometry.length.sum() * 111000  # degrees → meters
    density = (total_length / area_km2) / 1000  # km/km²

    # Normalise to 0-1 (high density = ~2 km/km² → 1.0)
    return min(1.0, density / 2.0)
