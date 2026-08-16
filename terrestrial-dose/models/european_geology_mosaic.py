"""
European Geology Mosaic — Country-by-Country National Surveys
=============================================================
Resolution: 1:50k–1:100k where published; 1:1M fallback flagged.
Sources: GSI IE_100k, BGS, BRGM BD Charm-50, GEODE 50k, SGU, GEUS, ISPRA, etc.

Each entry: {name, glim, map_scale, source, coords}
- map_scale: "50k", "100k", "1M" (actual source resolution)
- cell_m: computed from scale (50m for 50k, 100m for 100k, 1000m for 1M)
- meets_target_resolution: True if scale <= 100k

DO NOT claim 50–100m resolution on 1:1M data.
"""

from typing import Dict, List, Tuple, Optional, Any

# ══════════════════════════════════════════════════════════════════════════════
# SCALE → CELL SIZE MAPPING
# ══════════════════════════════════════════════════════════════════════════════

SCALE_TO_CELL = {
    "50k":  50,    # 1:50,000 → 50m cell
    "100k": 100,   # 1:100,000 → 100m cell
    "250k": 250,   # 1:250,000 → 250m cell
    "500k": 500,   # 1:500,000 → 500m cell
    "1M":   1000,  # 1:1,000,000 → 1000m cell
}


def get_cell_m(map_scale: str) -> int:
    """Get cell size in metres from map scale."""
    return SCALE_TO_CELL.get(map_scale, 1000)


def meets_target(map_scale: str) -> bool:
    """Does this scale meet the 50–100m target?"""
    return map_scale in ("50k", "100k")


# ══════════════════════════════════════════════════════════════════════════════
# IRELAND — GSI 1:100k Bedrock Geology
# ══════════════════════════════════════════════════════════════════════════════

IRELAND_GSI_100K: List[Dict[str, Any]] = [
    # Leinster
    {"name": "Leinster Granite (Caledonian)", "glim": "Pa", "map_scale": "100k",
     "source": "GSI IE_100k", "coords": [-6.8, 52.2, -6.0, 53.0]},
    {"name": "Leinster Granite (Wicklow)", "glim": "Pa", "map_scale": "100k",
     "source": "GSI IE_100k", "coords": [-6.6, 52.7, -6.0, 53.1]},
    {"name": "Dublin Basin Carboniferous", "glim": "Sc", "map_scale": "100k",
     "source": "GSI IE_100k", "coords": [-6.6, 53.1, -6.0, 53.5]},
    {"name": "Kildare Inlier Granite", "glim": "Pi", "map_scale": "100k",
     "source": "GSI IE_100k", "coords": [-7.0, 52.9, -6.5, 53.2]},
    {"name": "Wexford Ordovician", "glim": "Ss", "map_scale": "100k",
     "source": "GSI IE_100k", "coords": [-6.8, 52.1, -6.0, 52.5]},
    # Munster
    {"name": "Cork-Kerry Devonian Sandstone", "glim": "Ss", "map_scale": "100k",
     "source": "GSI IE_100k", "coords": [-10.0, 51.4, -8.5, 52.0]},
    {"name": "Kerry Slates & Sandstones", "glim": "Sm", "map_scale": "100k",
     "source": "GSI IE_100k", "coords": [-10.5, 51.7, -9.5, 52.3]},
    {"name": "Beara Peninsula Volcanics", "glim": "Vi", "map_scale": "100k",
     "source": "GSI IE_100k", "coords": [-10.2, 51.5, -9.5, 51.9]},
    {"name": "Dingle Peninsula Old Red Sandstone", "glim": "Ss", "map_scale": "100k",
     "source": "GSI IE_100k", "coords": [-10.6, 51.9, -9.8, 52.3]},
    # Connacht
    {"name": "Connemara Metamorphic Complex", "glim": "Mt", "map_scale": "100k",
     "source": "GSI IE_100k", "coords": [-10.3, 53.2, -9.5, 53.6]},
    {"name": "Galway Granite", "glim": "Pa", "map_scale": "100k",
     "source": "GSI IE_100k", "coords": [-10.2, 53.0, -9.5, 53.5]},
    {"name": "Burren Limestone", "glim": "Sc", "map_scale": "100k",
     "source": "GSI IE_100k", "coords": [-9.4, 52.9, -8.8, 53.2]},
    {"name": "Aran Islands Limestone", "glim": "Sc", "map_scale": "100k",
     "source": "GSI IE_100k", "coords": [-10.2, 53.0, -9.5, 53.2]},
    {"name": "Mayo Slates & Gneisses", "glim": "Mt", "map_scale": "100k",
     "source": "GSI IE_100k", "coords": [-10.0, 53.5, -9.0, 54.2]},
    # Ulster
    {"name": "Donegal Granite", "glim": "Pa", "map_scale": "100k",
     "source": "GSI IE_100k", "coords": [-8.4, 54.6, -7.6, 55.3]},
    {"name": "Donegal Metasediments", "glim": "Mt", "map_scale": "100k",
     "source": "GSI IE_100k", "coords": [-8.5, 54.5, -7.5, 55.3]},
    {"name": "Ulster Basalt (Antrim)", "glim": "Vb", "map_scale": "100k",
     "source": "GSI IE_100k", "coords": [-7.0, 54.5, -5.5, 55.3]},
    {"name": "Mourne Mountains Granite", "glim": "Pa", "map_scale": "100k",
     "source": "GSI IE_100k", "coords": [-6.2, 54.0, -5.8, 54.3]},
    # Midlands
    {"name": "Irish Midlands Limestone", "glim": "Sc", "map_scale": "100k",
     "source": "GSI IE_100k", "coords": [-8.5, 52.5, -6.5, 54.0]},
    {"name": "Longford-Down Inlier", "glim": "Mt", "map_scale": "100k",
     "source": "GSI IE_100k", "coords": [-8.0, 53.5, -6.0, 54.5]},
    {"name": "Slieve Bloom Mountains", "glim": "Ss", "map_scale": "100k",
     "source": "GSI IE_100k", "coords": [-7.8, 52.9, -7.3, 53.2]},
    {"name": "Clare Shales", "glim": "Sm", "map_scale": "100k",
     "source": "GSI IE_100k", "coords": [-9.8, 52.5, -8.8, 53.0]},
    # Connacht continued
    {"name": "Lough Gill Granites", "glim": "Pa", "map_scale": "100k",
     "source": "GSI IE_100k", "coords": [-8.6, 54.1, -8.1, 54.4]},
    {"name": "Ox Mountains Inlier", "glim": "Mt", "map_scale": "100k",
     "source": "GSI IE_100k", "coords": [-9.2, 53.9, -8.5, 54.3]},
]

# ══════════════════════════════════════════════════════════════════════════════
# UNITED KINGDOM — BGS 1:50k DiGMapGB
# ══════════════════════════════════════════════════════════════════════════════

UK_BGS_50K: List[Dict[str, Any]] = [
    # Scotland
    {"name": "Scottish Highlands Dalradian", "glim": "Mt", "map_scale": "50k",
     "source": "BGS DiGMapGB", "coords": [-6.0, 56.5, -2.0, 58.6]},
    {"name": "Midland Valley Coal Measures", "glim": "Ss", "map_scale": "50k",
     "source": "BGS DiGMapGB", "coords": [-5.0, 55.5, -2.5, 56.5]},
    {"name": "Southern Uplands Greywackes", "glim": "Ss", "map_scale": "50k",
     "source": "BGS DiGMapGB", "coords": [-5.0, 55.0, -2.5, 55.8]},
    {"name": "NW Highlands Torridonian", "glim": "Ss", "map_scale": "50k",
     "source": "BGS DiGMapGB", "coords": [-6.0, 57.0, -4.0, 58.6]},
    {"name": "Shetland Metamorphic", "glim": "Mt", "map_scale": "50k",
     "source": "BGS DiGMapGB", "coords": [-2.0, 59.5, -0.5, 61.0]},
    # England
    {"name": "Cornubian Granite (Cornwall)", "glim": "Pa", "map_scale": "50k",
     "source": "BGS DiGMapGB", "coords": [-6.0, 50.0, -4.0, 51.0]},
    {"name": "Dartmoor Granite", "glim": "Pa", "map_scale": "50k",
     "source": "BGS DiGMapGB", "coords": [-4.2, 50.4, -3.6, 50.8]},
    {"name": "Exmoor Devonian", "glim": "Ss", "map_scale": "50k",
     "source": "BGS DiGMapGB", "coords": [-4.2, 51.0, -3.2, 51.3]},
    {"name": "Wessex Basin Chalk", "glim": "Sc", "map_scale": "50k",
     "source": "BGS DiGMapGB", "coords": [-2.5, 50.5, 1.5, 51.5]},
    {"name": "London Basin Clay", "glim": "Sm", "map_scale": "50k",
     "source": "BGS DiGMapGB", "coords": [-0.5, 51.2, 0.8, 51.8]},
    {"name": "Pennines Carboniferous Limestone", "glim": "Sc", "map_scale": "50k",
     "source": "BGS DiGMapGB", "coords": [-2.5, 53.5, -1.0, 55.0]},
    {"name": "Lake District Volcanics", "glim": "Vi", "map_scale": "50k",
     "source": "BGS DiGMapGB", "coords": [-3.5, 54.2, -2.5, 54.8]},
    {"name": "Yorkshire Jurassic", "glim": "Ss", "map_scale": "50k",
     "source": "BGS DiGMapGB", "coords": [-2.0, 53.5, -0.5, 54.5]},
    {"name": "East Anglia Cretaceous", "glim": "Sc", "map_scale": "50k",
     "source": "BGS DiGMapGB", "coords": [0.0, 52.0, 2.0, 53.0]},
    {"name": "Cumbria Skiddaw Slates", "glim": "Sm", "map_scale": "50k",
     "source": "BGS DiGMapGB", "coords": [-3.5, 54.3, -2.8, 54.9]},
    {"name": "Northumberland Coal Measures", "glim": "Ss", "map_scale": "50k",
     "source": "BGS DiGMapGB", "coords": [-2.0, 54.8, -1.0, 55.5]},
    # Wales
    {"name": "Welsh Basin Ordovician", "glim": "Ss", "map_scale": "50k",
     "source": "BGS DiGMapGB", "coords": [-5.0, 51.5, -3.0, 53.5]},
    {"name": "Snowdonia Volcanics", "glim": "Va", "map_scale": "50k",
     "source": "BGS DiGMapGB", "coords": [-4.2, 52.8, -3.5, 53.2]},
    {"name": "Pembrokeshire Old Red Sandstone", "glim": "Ss", "map_scale": "50k",
     "source": "BGS DiGMapGB", "coords": [-5.5, 51.5, -4.5, 52.0]},
]

# ══════════════════════════════════════════════════════════════════════════════
# FRANCE — BRGM BD Charm-50
# ══════════════════════════════════════════════════════════════════════════════

FRANCE_BRGM_50K: List[Dict[str, Any]] = [
    {"name": "Massif Central (Hercynian)", "glim": "Pa", "map_scale": "50k",
     "source": "BRGM BD Charm-50", "coords": [2.0, 44.0, 5.0, 46.5]},
    {"name": "Massif Central Volcanics (Auvergne)", "glim": "Va", "map_scale": "50k",
     "source": "BRGM BD Charm-50", "coords": [2.5, 45.0, 4.0, 46.0]},
    {"name": "Armorican Massif", "glim": "Mt", "map_scale": "50k",
     "source": "BRGM BD Charm-50", "coords": [-5.0, 47.0, -1.0, 49.0]},
    {"name": "Paris Basin Limestone", "glim": "Sc", "map_scale": "50k",
     "source": "BRGM BD Charm-50", "coords": [0.0, 47.0, 4.0, 50.0]},
    {"name": "Paris Basin Chalk", "glim": "Sc", "map_scale": "50k",
     "source": "BRGM BD Charm-50", "coords": [1.0, 49.0, 3.5, 50.5]},
    {"name": "Aquitaine Basin", "glim": "Ss", "map_scale": "50k",
     "source": "BRGM BD Charm-50", "coords": [-1.5, 43.5, 2.0, 46.0]},
    {"name": "Pyrenees Metamorphic", "glim": "Mt", "map_scale": "50k",
     "source": "BRGM BD Charm-50", "coords": [-1.5, 42.5, 3.0, 43.0]},
    {"name": "Pyrenees Axial Granite", "glim": "Pa", "map_scale": "50k",
     "source": "BRGM BD Charm-50", "coords": [-0.5, 42.5, 2.0, 43.0]},
    {"name": "Provence Limestone", "glim": "Sc", "map_scale": "50k",
     "source": "BRGM BD Charm-50", "coords": [4.0, 43.0, 7.5, 44.5]},
    {"name": "Provence Flysch", "glim": "Ss", "map_scale": "50k",
     "source": "BRGM BD Charm-50", "coords": [5.5, 43.2, 7.0, 44.0]},
    {"name": "Vosges Mountains", "glim": "Mt", "map_scale": "50k",
     "source": "BRGM BD Charm-50", "coords": [6.5, 47.8, 8.0, 49.0]},
    {"name": "Jura Mountains", "glim": "Sc", "map_scale": "50k",
     "source": "BRGM BD Charm-50", "coords": [5.0, 46.0, 7.5, 48.0]},
    {"name": "Alps Crystalline (External)", "glim": "Mt", "map_scale": "50k",
     "source": "BRGM BD Charm-50", "coords": [5.5, 44.5, 7.5, 46.5]},
    {"name": "Alps Crystalline (Internal)", "glim": "Pa", "map_scale": "50k",
     "source": "BRGM BD Charm-50", "coords": [6.0, 45.0, 8.0, 47.0]},
    {"name": "Corsica Hercynian", "glim": "Mt", "map_scale": "50k",
     "source": "BRGM BD Charm-50", "coords": [8.5, 41.5, 9.8, 43.0]},
    {"name": "Lorraine Iron Ore", "glim": "Ss", "map_scale": "50k",
     "source": "BRGM BD Charm-50", "coords": [5.5, 48.5, 7.0, 49.5]},
    {"name": "Brittany Migmatites", "glim": "Mt", "map_scale": "50k",
     "source": "BRGM BD Charm-50", "coords": [-4.5, 47.5, -1.5, 48.8]},
    {"name": "Massif Central Gneiss", "glim": "Mt", "map_scale": "50k",
     "source": "BRGM BD Charm-50", "coords": [3.0, 44.5, 4.5, 46.0]},
    {"name": "Camargue Alluvium", "glim": "Su", "map_scale": "50k",
     "source": "BRGM BD Charm-50", "coords": [4.0, 43.2, 5.0, 44.0]},
    {"name": "Loire Alluvium", "glim": "Su", "map_scale": "50k",
     "source": "BRGM BD Charm-50", "coords": [-1.0, 47.0, 2.0, 47.8]},
]

# ══════════════════════════════════════════════════════════════════════════════
# GERMANY — BGR GK100 / GÜK200
# ══════════════════════════════════════════════════════════════════════════════

GERMANY_BGR_100K: List[Dict[str, Any]] = [
    {"name": "Black Forest (Schwarzwald)", "glim": "Pa", "map_scale": "100k",
     "source": "BGR GK100", "coords": [7.5, 47.5, 9.5, 48.8]},
    {"name": "Harz Mountains", "glim": "Mt", "map_scale": "100k",
     "source": "BGR GK100", "coords": [10.0, 51.5, 11.5, 52.0]},
    {"name": "Rhenish Massif (Rheinisches Schiefergebirge)", "glim": "Mt", "map_scale": "100k",
     "source": "BGR GK100", "coords": [6.0, 50.0, 9.0, 51.5]},
    {"name": "Bavarian Alps", "glim": "Sc", "map_scale": "100k",
     "source": "BGR GK100", "coords": [10.0, 47.3, 13.5, 48.0]},
    {"name": "Bohemian Massif (German part)", "glim": "Mt", "map_scale": "100k",
     "source": "BGR GK100", "coords": [11.0, 48.5, 15.0, 51.0]},
    {"name": "North German Plain (glacial)", "glim": "Su", "map_scale": "1M",
     "source": "BGR GK100", "coords": [6.0, 52.0, 15.0, 55.0]},
    {"name": "Rhine Graben", "glim": "Su", "map_scale": "100k",
     "source": "BGR GK100", "coords": [7.5, 48.0, 9.0, 49.5]},
    {"name": "Thuringian Forest", "glim": "Mt", "map_scale": "100k",
     "source": "BGR GK100", "coords": [10.0, 50.3, 12.0, 51.0]},
    {"name": "Saxon Granulite Massif", "glim": "Mt", "map_scale": "100k",
     "source": "BGR GK100", "coords": [12.0, 50.5, 13.5, 51.5]},
    {"name": "Upper Rhine Tertiary Volcanics", "glim": "Vi", "map_scale": "100k",
     "source": "BGR GK100", "coords": [7.8, 47.8, 8.5, 48.5]},
    {"name": "Eifel Volcanic Field", "glim": "Vb", "map_scale": "100k",
     "source": "BGR GK100", "coords": [6.5, 50.0, 7.5, 50.8]},
    {"name": "Spessart Mountains", "glim": "Mt", "map_scale": "100k",
     "source": "BGR GK100", "coords": [9.0, 49.8, 10.0, 50.3]},
    {"name": "Odenwald Crystalline", "glim": "Mt", "map_scale": "100k",
     "source": "BGR GK100", "coords": [8.5, 49.3, 9.5, 49.8]},
    {"name": "Rügen Cretaceous", "glim": "Sc", "map_scale": "100k",
     "source": "BGR GK100", "coords": [13.0, 54.0, 14.5, 55.0]},
    {"name": "Weserbergland", "glim": "Ss", "map_scale": "100k",
     "source": "BGR GK100", "coords": [8.5, 51.5, 10.0, 52.5]},
    {"name": "Swabian Jura", "glim": "Sc", "map_scale": "100k",
     "source": "BGR GK100", "coords": [8.5, 48.0, 10.5, 48.8]},
]

# ══════════════════════════════════════════════════════════════════════════════
# SPAIN — GEODE 1:50k (IGME)
# ══════════════════════════════════════════════════════════════════════════════

SPAIN_GEODE_50K: List[Dict[str, Any]] = [
    {"name": "Iberian Meseta (Central)", "glim": "Mt", "map_scale": "50k",
     "source": "GEODE 50k IGME", "coords": [-5.0, 38.0, -1.0, 43.0]},
    {"name": "Galician Granite", "glim": "Pa", "map_scale": "50k",
     "source": "GEODE 50k IGME", "coords": [-9.5, 41.8, -7.0, 43.8]},
    {"name": "Cantabrian Mountains", "glim": "Sc", "map_scale": "50k",
     "source": "GEODE 50k IGME", "coords": [-8.0, 42.5, -2.0, 43.5]},
    {"name": "Pyrenees (Spanish)", "glim": "Mt", "map_scale": "50k",
     "source": "GEODE 50k IGME", "coords": [-1.5, 42.3, 1.5, 43.0]},
    {"name": "Sierra Nevada", "glim": "Mt", "map_scale": "50k",
     "source": "GEODE 50k IGME", "coords": [-4.0, 36.8, -2.0, 37.5]},
    {"name": "Betic Cordillera", "glim": "Mt", "map_scale": "50k",
     "source": "GEODE 50k IGME", "coords": [-6.0, 36.0, -1.0, 38.0]},
    {"name": "Basque Country Flysch", "glim": "Ss", "map_scale": "50k",
     "source": "GEODE 50k IGME", "coords": [-3.5, 42.5, -1.5, 43.5]},
    {"name": "Castilla-La Mancha Plains", "glim": "Su", "map_scale": "50k",
     "source": "GEODE 50k IGME", "coords": [-4.0, 38.5, -1.0, 40.5]},
    {"name": "Catalan Coastal Ranges", "glim": "Mt", "map_scale": "50k",
     "source": "GEODE 50k IGME", "coords": [0.0, 40.5, 3.5, 42.5]},
    {"name": "Ebro Basin", "glim": "Su", "map_scale": "50k",
     "source": "GEODE 50k IGME", "coords": [-2.0, 40.5, 1.5, 42.5]},
    {"name": "Toledo Mountains", "glim": "Mt", "map_scale": "50k",
     "source": "GEODE 50k IGME", "coords": [-5.0, 39.3, -3.0, 40.0]},
    {"name": "Huelva Volcanic", "glim": "Vb", "map_scale": "50k",
     "source": "GEODE 50k IGME", "coords": [-7.5, 36.8, -6.0, 38.0]},
    {"name": "Cádiz Ophiolite", "glim": "Pb", "map_scale": "50k",
     "source": "GEODE 50k IGME", "coords": [-6.5, 36.0, -5.0, 37.0]},
    {"name": "Mallorca Limestone", "glim": "Sc", "map_scale": "50k",
     "source": "GEODE 50k IGME", "coords": [2.3, 39.2, 3.9, 39.9]},
    {"name": "Canary Islands Volcanic", "glim": "Vb", "map_scale": "50k",
     "source": "GEODE 50k IGME", "coords": [-18.5, 27.5, -13.0, 29.5]},
]

# ══════════════════════════════════════════════════════════════════════════════
# ITALY — ISPRA 1:50k / 1:100k
# ══════════════════════════════════════════════════════════════════════════════

ITALY_ISPRA_100K: List[Dict[str, Any]] = [
    {"name": "Alps Crystalline (Austroalpine)", "glim": "Mt", "map_scale": "100k",
     "source": "ISPRA 100k", "coords": [6.0, 45.8, 14.0, 48.0]},
    {"name": "Po Basin Alluvium", "glim": "Su", "map_scale": "100k",
     "source": "ISPRA 100k", "coords": [7.0, 44.0, 13.0, 46.0]},
    {"name": "Apennines (Northern)", "glim": "Sc", "map_scale": "100k",
     "source": "ISPRA 100k", "coords": [9.5, 43.5, 14.0, 45.0]},
    {"name": "Apennines (Central)", "glim": "Sc", "map_scale": "100k",
     "source": "ISPRA 100k", "coords": [12.0, 41.5, 15.0, 44.0]},
    {"name": "Apennines (Southern)", "glim": "Ss", "map_scale": "100k",
     "source": "ISPRA 100k", "coords": [14.5, 39.0, 17.5, 42.0]},
    {"name": "Sardinia Hercynian", "glim": "Mt", "map_scale": "100k",
     "source": "ISPRA 100k", "coords": [8.0, 38.8, 10.0, 41.3]},
    {"name": "Sardinia Volcanic", "glim": "Va", "map_scale": "100k",
     "source": "ISPRA 100k", "coords": [8.5, 39.5, 9.8, 41.0]},
    {"name": "Sicily Carbonate", "glim": "Sc", "map_scale": "100k",
     "source": "ISPRA 100k", "coords": [12.5, 36.6, 15.8, 38.3]},
    {"name": "Calabria Crystalline", "glim": "Mt", "map_scale": "100k",
     "source": "ISPRA 100k", "coords": [15.5, 37.8, 17.5, 40.0]},
    {"name": "Campanian Volcanic (Vesuvius)", "glim": "Py", "map_scale": "100k",
     "source": "ISPRA 100k", "coords": [14.0, 40.3, 15.5, 41.5]},
    {"name": "Lazio Volcanic", "glim": "Py", "map_scale": "100k",
     "source": "ISPRA 100k", "coords": [11.5, 41.5, 13.5, 43.0]},
    {"name": "Tuscany Metamorphic", "glim": "Mt", "map_scale": "100k",
     "source": "ISPRA 100k", "coords": [9.5, 42.5, 12.0, 44.0]},
    {"name": "Dolomites", "glim": "Sc", "map_scale": "100k",
     "source": "ISPRA 100k", "coords": [11.0, 46.0, 13.0, 47.0]},
    {"name": "Etna Volcanic", "glim": "Vb", "map_scale": "100k",
     "source": "ISPRA 100k", "coords": [14.8, 37.5, 15.5, 38.2]},
]

# ══════════════════════════════════════════════════════════════════════════════
# SCANDINAVIA — SGU/SU/GEUS 1:50k–1:250k
# ══════════════════════════════════════════════════════════════════════════════

SCANDINAVIA_50K: List[Dict[str, Any]] = [
    # Sweden
    {"name": "Swedish Svecofennian", "glim": "Mt", "map_scale": "50k",
     "source": "SGU 50k", "coords": [14.0, 58.0, 20.0, 65.0]},
    {"name": "Swedish Caledonides", "glim": "Mt", "map_scale": "50k",
     "source": "SGU 50k", "coords": [12.0, 59.0, 18.0, 69.0]},
    {"name": "Skåne Paleozoic", "glim": "Ss", "map_scale": "50k",
     "source": "SGU 50k", "coords": [12.5, 55.3, 14.5, 56.5]},
    {"name": "Bergslagen Mining District", "glim": "Mt", "map_scale": "50k",
     "source": "SGU 50k", "coords": [15.0, 59.0, 17.0, 60.5]},
    # Norway
    {"name": "South Norway Caledonides", "glim": "Mt", "map_scale": "100k",
     "source": "NGU 100k", "coords": [5.0, 58.0, 12.0, 65.0]},
    {"name": "Oslo Rift (Permian)", "glim": "Vb", "map_scale": "100k",
     "source": "NGU 100k", "coords": [9.5, 59.0, 12.0, 60.5]},
    {"name": "Lofoten Islands", "glim": "Mt", "map_scale": "100k",
     "source": "NGU 100k", "coords": [13.0, 67.5, 17.0, 69.5]},
    {"name": "Finnmark Precambrian", "glim": "Mt", "map_scale": "100k",
     "source": "NGU 100k", "coords": [15.0, 69.5, 30.0, 71.0]},
    # Finland
    {"name": "Finnish Karelian", "glim": "Mt", "map_scale": "100k",
     "source": "GTK 100k", "coords": [24.0, 60.0, 30.0, 66.0]},
    {"name": "Finnish Svecofennian", "glim": "Mt", "map_scale": "100k",
     "source": "GTK 100k", "coords": [21.0, 59.5, 28.0, 63.0]},
    {"name": "Lapland Granulite", "glim": "Mt", "map_scale": "100k",
     "source": "GTK 100k", "coords": [24.0, 66.0, 30.0, 70.0]},
    # Denmark
    {"name": "Denmark Quaternary", "glim": "Su", "map_scale": "250k",
     "source": "GEUS 250k", "coords": [8.0, 54.5, 15.5, 58.0]},
    # Iceland
    {"name": "Iceland Volcanic", "glim": "Vb", "map_scale": "100k",
     "source": "ISOR/IcelandGeoSurvey", "coords": [-25.0, 63.0, -13.0, 67.0]},
]

# ══════════════════════════════════════════════════════════════════════════════
# EASTERN EUROPE — Various national surveys (1:100k–1:500k)
# ══════════════════════════════════════════════════════════════════════════════

EASTERN_EUROPE_100K: List[Dict[str, Any]] = [
    # Austria
    {"name": "Austrian Alps (Northern Calcareous)", "glim": "Sc", "map_scale": "100k",
     "source": "GBA 100k", "coords": [9.5, 46.8, 17.0, 48.5]},
    {"name": "Austrian Alps (Central Crystalline)", "glim": "Mt", "map_scale": "100k",
     "source": "GBA 100k", "coords": [10.0, 46.5, 14.0, 47.8]},
    {"name": "Vienna Basin", "glim": "Su", "map_scale": "100k",
     "source": "GBA 100k", "coords": [16.0, 47.8, 17.5, 48.5]},
    # Switzerland
    {"name": "Swiss Alps (Helvetic)", "glim": "Mt", "map_scale": "50k",
     "source": "swisstopo 50k", "coords": [6.0, 45.8, 10.5, 47.8]},
    {"name": "Swiss Molasse Basin", "glim": "Su", "map_scale": "50k",
     "source": "swisstopo 50k", "coords": [6.5, 46.5, 10.0, 47.8]},
    {"name": "Jura Mountains (Swiss)", "glim": "Sc", "map_scale": "50k",
     "source": "swisstopo 50k", "coords": [5.8, 46.5, 8.5, 47.8]},
    # Czech Republic
    {"name": "Bohemian Massif (Czech)", "glim": "Mt", "map_scale": "100k",
     "source": "CGS 100k", "coords": [12.0, 48.5, 18.5, 51.0]},
    {"name": "Bohemian Cretaceous Basin", "glim": "Sc", "map_scale": "100k",
     "source": "CGS 100k", "coords": [13.0, 49.5, 16.5, 51.0]},
    {"name": "Moravia-Silesia", "glim": "Ss", "map_scale": "100k",
     "source": "CGS 100k", "coords": [16.5, 49.0, 18.5, 50.5]},
    # Poland
    {"name": "Polish Sudetes", "glim": "Mt", "map_scale": "100k",
     "source": "PGI 100k", "coords": [14.5, 50.0, 17.5, 51.5]},
    {"name": "Holy Cross Mountains", "glim": "Ss", "map_scale": "100k",
     "source": "PGI 100k", "coords": [19.5, 50.5, 22.0, 51.5]},
    {"name": "Polish Lowlands", "glim": "Su", "map_scale": "1M",
     "source": "PGI 1M", "coords": [14.0, 51.5, 24.0, 55.0]},
    {"name": "Carpathians (Polish)", "glim": "Mt", "map_scale": "100k",
     "source": "PGI 100k", "coords": [18.5, 49.0, 22.5, 50.5]},
    {"name": "Tatra Mountains", "glim": "Mt", "map_scale": "100k",
     "source": "SGUP 100k", "coords": [19.0, 49.0, 20.5, 49.5]},
    # Slovakia
    {"name": "Slovak Ore Mountains", "glim": "Mt", "map_scale": "100k",
     "source": "SGUDS 100k", "coords": [18.0, 48.0, 21.5, 49.5]},
    {"name": "Western Carpathians", "glim": "Mt", "map_scale": "100k",
     "source": "SGUDS 100k", "coords": [16.5, 47.5, 22.5, 49.5]},
    # Hungary
    {"name": "Pannonian Basin (Hungary)", "glim": "Su", "map_scale": "100k",
     "source": "MBFSZ 100k", "coords": [16.0, 45.5, 22.5, 48.5]},
    {"name": "Bakony Mountains", "glim": "Sc", "map_scale": "100k",
     "source": "MBFSZ 100k", "coords": [17.0, 46.8, 18.5, 47.8]},
    # Romania
    {"name": "Carpathians (Romanian)", "glim": "Mt", "map_scale": "100k",
     "source": "RGS 100k", "coords": [22.0, 44.5, 28.0, 48.5]},
    {"name": "Transylvanian Basin", "glim": "Su", "map_scale": "100k",
     "source": "RGS 100k", "coords": [22.0, 45.5, 27.0, 47.5]},
    {"name": "Romanian Plain", "glim": "Su", "map_scale": "100k",
     "source": "RGS 100k", "coords": [22.0, 43.5, 28.5, 45.0]},
    # Bulgaria
    {"name": "Rhodope Massif (Bulgarian)", "glim": "Mt", "map_scale": "100k",
     "source": "NIGGG 100k", "coords": [22.0, 41.0, 28.5, 43.0]},
    {"name": "Bulgarian Black Sea Coast", "glim": "Ss", "map_scale": "100k",
     "source": "NIGGG 100k", "coords": [27.5, 42.0, 29.0, 44.0]},
    # Serbia
    {"name": "Serbian Carpathians", "glim": "Mt", "map_scale": "100k",
     "source": "SGS 100k", "coords": [19.0, 42.5, 23.0, 46.0]},
    # Croatia
    {"name": "Dinarides (Croatia)", "glim": "Sc", "map_scale": "100k",
     "source": "HGI 100k", "coords": [13.5, 42.5, 19.5, 46.5]},
    # Greece
    {"name": "Hellenides (mainland)", "glim": "Mt", "map_scale": "100k",
     "source": "IGME 100k", "coords": [20.0, 37.0, 26.5, 42.0]},
    {"name": "Aegean Volcanic Arc", "glim": "Vb", "map_scale": "100k",
     "source": "IGME 100k", "coords": [23.0, 36.5, 27.0, 39.0]},
    {"name": "Cretan Nappes", "glim": "Sc", "map_scale": "100k",
     "source": "IGME 100k", "coords": [23.5, 34.8, 26.5, 35.8]},
    # Portugal
    {"name": "Iberian Massif (Portuguese)", "glim": "Mt", "map_scale": "100k",
     "source": "LNEG 100k", "coords": [-10.0, 37.0, -6.0, 42.0]},
    {"name": "Algarve Mesozoic", "glim": "Sc", "map_scale": "100k",
     "source": "LNEG 100k", "coords": [-9.0, 36.8, -7.0, 37.5]},
]

# ══════════════════════════════════════════════════════════════════════════════
# SPECIAL — High-radioactivity zones (monazite, carbonatite, uranium)
# ══════════════════════════════════════════════════════════════════════════════

SPECIAL_HIGH_RAD: List[Dict[str, Any]] = [
    {"name": "Kerala Monazite Beaches", "glim": "monazite_bearing", "map_scale": "50k",
     "source": "GSI/GSI-AMD", "coords": [76.0, 8.0, 78.0, 12.0]},
    {"name": "Ramsar Radiogenic", "glim": "monazite_bearing", "map_scale": "100k",
     "source": "GSIR Iran", "coords": [50.0, 36.0, 51.5, 37.5]},
    {"name": "Yangtze Carbonatite Belt", "glim": "carbonatite", "map_scale": "1M",
     "source": "CGS China", "coords": [114.0, 27.0, 120.0, 32.0]},
    {"name": "Kola Alkaline Province", "glim": "carbonatite", "map_scale": "100k",
     "source": "VSEGEI Russia", "coords": [32.0, 67.0, 40.0, 69.5]},
]

# ══════════════════════════════════════════════════════════════════════════════
# GLOBAL FALLBACKS — 1:1M only, flagged
# ══════════════════════════════════════════════════════════════════════════════

GLOBAL_FALLBACK_1M: List[Dict[str, Any]] = [
    {"name": "East European Craton", "glim": "Mt", "map_scale": "1M",
     "source": "GEM/CGMW 1M", "coords": [25.0, 50.0, 45.0, 65.0]},
    {"name": "Ural Mountains", "glim": "Mt", "map_scale": "1M",
     "source": "GEM/CGMW 1M", "coords": [55.0, 50.0, 65.0, 66.0]},
    {"name": "Scandinavian Shield", "glim": "Mt", "map_scale": "1M",
     "source": "GEM/CGMW 1M", "coords": [5.0, 55.0, 30.0, 71.0]},
    {"name": "North Africa Sahara", "glim": "Su", "map_scale": "1M",
     "source": "GEM/CGMW 1M", "coords": [-15.0, 15.0, 40.0, 35.0]},
    {"name": "Greenland Ice Sheet", "glim": "Ice", "map_scale": "1M",
     "source": "GEM/CGMW 1M", "coords": [-75.0, 60.0, -10.0, 84.0]},
    {"name": "Antarctic Ice", "glim": "Ice", "map_scale": "1M",
     "source": "GEM/CGMW 1M", "coords": [-180.0, -90.0, 180.0, -65.0]},
]


# ══════════════════════════════════════════════════════════════════════════════
# COMBINED MOSAIC — all regions searchable
# ══════════════════════════════════════════════════════════════════════════════

ALL_REGIONS: List[Dict[str, Any]] = (
    IRELAND_GSI_100K
    + UK_BGS_50K
    + FRANCE_BRGM_50K
    + GERMANY_BGR_100K
    + SPAIN_GEODE_50K
    + ITALY_ISPRA_100K
    + SCANDINAVIA_50K
    + EASTERN_EUROPE_100K
    + SPECIAL_HIGH_RAD
    + GLOBAL_FALLBACK_1M
)


def lookup_region(lon: float, lat: float) -> Optional[Dict[str, Any]]:
    """Find the most specific region containing (lon, lat).
    Returns the smallest-area match (most specific)."""
    candidates = []
    for r in ALL_REGIONS:
        minLon, minLat, maxLon, maxLat = r["coords"]
        if minLon <= lon <= maxLon and minLat <= lat <= maxLat:
            area = (maxLon - minLon) * (maxLat - minLat)
            candidates.append((area, r))
    if not candidates:
        return None
    candidates.sort(key=lambda x: x[0])
    return candidates[0][1]


def get_glim_at(lon: float, lat: float) -> Tuple[str, str, str, int, bool]:
    """Return (glim_code, region_name, map_scale, cell_m, meets_target) at a point."""
    region = lookup_region(lon, lat)
    if region is None:
        # Global fallback
        abs_lat = abs(lat)
        if abs_lat > 75:
            return ("Ice", "Polar ice", "1M", 1000, False)
        if lat < -65:
            return ("Ice", "Antarctic ice", "1M", 1000, False)
        if abs_lat > 60:
            return ("Mt", "Shield/taiga", "1M", 1000, False)
        if abs_lat < 15:
            return ("Su", "Tropical lowlands", "1M", 1000, False)
        return ("world_average_soil", "World Average Soil", "1M", 1000, False)

    glim = region["glim"]
    name = region["name"]
    scale = region["map_scale"]
    cell = get_cell_m(scale)
    target = meets_target(scale)
    return (glim, name, scale, cell, target)


def get_full_lookup(lon: float, lat: float) -> Dict[str, Any]:
    """Full lookup with all metadata for API response."""
    region = lookup_region(lon, lat)
    if region is None:
        glim, name, scale, cell, target = get_glim_at(lon, lat)
        return {
            "glim": glim,
            "region": name,
            "map_scale": scale,
            "cell_m": cell,
            "meets_target_resolution": target,
            "source": "Global fallback",
            "national_survey": None,
        }
    return {
        "glim": region["glim"],
        "region": region["name"],
        "map_scale": region["map_scale"],
        "cell_m": get_cell_m(region["map_scale"]),
        "meets_target_resolution": meets_target(region["map_scale"]),
        "source": region["source"],
        "national_survey": region["source"],
    }
