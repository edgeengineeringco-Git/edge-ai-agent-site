"""
GLiM Lithology Fetcher
======================
Global Lithological Map (Hartmann & Moosdorf 2012).
doi:10.1029/2012GC004370

1,235,400 polygons, 42 classes, ~1.5 km resolution.

Source: https://www.geo.uni-hamburg.de/en/geologie/forschung/geomorphology/glim.html
"""

import geopandas as gpd
from typing import Tuple
from .cache import get_cached, write_cache

GLIM_URL = "https://www.geo.uni-hamburg.de/geologie/forschung/geomorphology/glim_data/glim_wgs84_0.5.zip"

# GLiM code → description (Hartmann & Moosdorf 2012 Table 1)
GLIM_CLASSES = {
    "Su": "Unconsolidated sediments",
    "Ss": "Siliciclastic sedimentary rocks",
    "Sm": "Mixed sedimentary rocks",
    "Sc": "Carbonate sedimentary rocks",
    "Sb": "Basic sedimentary rocks",
    "Ev": "Evaporites",
    "Pa": "Acid plutonic rocks (granite etc.)",
    "Pi": "Intermediate plutonic rocks",
    "Pb": "Basic plutonic rocks (gabbro etc.)",
    "Va": "Acid volcanic rocks",
    "Vi": "Intermediate volcanic rocks",
    "Vb": "Basic volcanic rocks (basalt etc.)",
    "Mt": "Metamorphics (undifferentiated)",
    "Py": "Pyroclastics (tuff etc.)",
    "Wa": "Water bodies",
    "Ice": "Ice and glaciers",
}


def fetch_glim(bbox: Tuple[float, float, float, float]):
    """
    Fetch GLiM lithology polygons for a bounding box.

    Parameters
    ----------
    bbox : (min_lon, min_lat, max_lon, max_lat)

    Returns
    -------
    GeoDataFrame with columns: geometry, lithology (GLiM code), source, resolution_m
    """
    cached = get_cached("glim", bbox)
    if cached is not None:
        return cached

    gdf = gpd.read_file(GLIM_URL, bbox=bbox)
    if "xx" in gdf.columns:
        gdf = gdf.rename(columns={"xx": "lithology"})
    elif "GLiM" in gdf.columns:
        gdf = gdf.rename(columns={"GLiM": "lithology"})

    gdf["source"] = "GLiM (Hartmann & Moosdorf 2012)"
    gdf["resolution_m"] = 1500
    gdf["license"] = "CC BY 3.0"

    write_cache("glim", bbox, gdf, GLIM_URL, "CC BY 3.0", 1500)
    return gdf


def lithology_at_point(lon: float, lat: float) -> str:
    """Return GLiM lithology code at a point (fallback: world_average_soil)."""
    try:
        gdf = fetch_glim((lon - 0.05, lat - 0.05, lon + 0.05, lat + 0.05))
        if len(gdf) > 0:
            from shapely.geometry import Point
            pt = Point(lon, lat)
            hit = gdf[gdf.geometry.intersects(pt)]
            if len(hit) > 0:
                return hit.iloc[0]["lithology"]
    except Exception:
        pass
    return "world_average_soil"
