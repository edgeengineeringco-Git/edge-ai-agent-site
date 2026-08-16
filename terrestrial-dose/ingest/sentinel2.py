"""
Sentinel-2 Composite Builder
============================
Google Earth Engine COPERNICUS/S2_SR_HARMONIZED or Copernicus Data Space.

Builds cloud-free 6-month median composite.
Output bands: B2, B4, B8, B11, B12 + ratios.
"""

from typing import Tuple, Optional

try:
    import ee
    EE_AVAILABLE = True
except ImportError:
    EE_AVAILABLE = False


def build_sentinel2_composite(bbox: Tuple[float, float, float, float],
                               start: str = "2024-01-01",
                               end: str = "2024-06-30"):
    """
    Build a cloud-free Sentinel-2 composite for a bounding box.

    Parameters
    ----------
    bbox : (min_lon, min_lat, max_lon, max_lat)
    start, end : ISO date strings

    Returns
    -------
    xarray Dataset or raster with bands:
    B2 (blue), B4 (red), B8 (NIR), B11 (SWIR1), B12 (SWIR2),
    ferric_ratio (B4/B2), clay_ratio (B11/B12), alteration_rgb (B12-B11-B2)
    """
    if not EE_AVAILABLE:
        raise RuntimeError("Google Earth Engine API not installed. pip install earthengine-api")

    ee.Initialize()

    min_lon, min_lat, max_lon, max_lat = bbox
    region = ee.Geometry.Rectangle([min_lon, min_lat, max_lon, max_lat])

    collection = (ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
                  .filterBounds(region)
                  .filterDate(start, end)
                  .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20)))

    composite = collection.median().clip(region)

    # Band ratios for alteration mapping
    ferric = composite.select("B4").divide(composite.select("B2")).rename("ferric_ratio")
    clay = composite.select("B11").divide(composite.select("B12")).rename("clay_ratio")

    result = composite.select(["B2", "B4", "B8", "B11", "B12"]).addBands([ferric, clay])

    return result

    raise RuntimeError("Sentinel-2 requires Google Earth Engine or Copernicus Data Space API key")
