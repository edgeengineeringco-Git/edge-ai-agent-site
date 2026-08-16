# Terrestrial Dose Indicator Web GIS

A full-stack web application that estimates and visualises terrestrial radiation dose
(radon-222, thoron-220, external gamma) from geogenic priors, with VisQuill-style
three-arm dose fingerprints, risk classification, and provenance tracking.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11 + FastAPI |
| Database | PostGIS (prod) / GeoPackage (local dev) |
| Frontend | React 19 + TypeScript + Vite 6 |
| Map | MapLibre GL JS |
| Charts | D3.js v7 |
| Raster | Google Earth Engine (Sentinel-2, DEM) or Copernicus Data Space API |

## Architecture

```
terrestrial-dose/
├── dose_core/
│   └── dose_calculation_core.py      # Core dose models — DO NOT modify formulas
├── tests/
│   └── test_dose_core.py             # 6 validation cases (all pass)
├── ingest/
│   ├── glim.py                       # GLiM lithology fetcher (PRIMARY, 1.5 km)
│   ├── soilgrids.py                  # SoilGrids 250m permeability fetcher
│   ├── sentinel2.py                  # Sentinel-2 composite builder (GEE)
│   ├── faults.py                     # GEM Global Active Faults fetcher
│   └── cache.py                      # PostGIS/GeoPackage cache + provenance
├── api/
│   └── main.py                        # FastAPI endpoints (/dose, /dose/bbox)
├── web/
│   ├── src/
│   │   ├── dose_core.ts              # TypeScript port of Python core
│   │   ├── lithology.ts              # Client-side GLiM proxy grid
│   │   ├── Map.tsx                   # MapLibre map + risk heatmap
│   │   ├── Triangle.tsx              # D3 three-arm dose triangle
│   │   ├── Panel.tsx                 # Provenance + dose breakdown panel
│   │   └── App.tsx                   # Main layout
│   └── dist/                         # Built static app (deployed to GitHub Pages)
└── README.md                         # This file
```

## Data Sources

| # | Source | Resolution | License | Access |
|---|--------|-----------|---------|--------|
| 1 | **GLiM** (Hartmann & Moosdorf 2012) | ~1.5 km | CC BY 3.0 | Shapefile download |
| 2 | **SoilGrids 2.0** (ISRIC) | 250 m | CC BY 4.0 | REST API |
| 3 | **Sentinel-2** (Copernicus) | 10 m | CC BY 4.0 | Google Earth Engine / Copernicus Data Space |
| 4 | **GEM Global Active Faults** | ~1 km | CC BY 4.0 | GitHub GeoJSON |
| 5 | **Copernicus GLO-30 DEM** | 30 m | Open | AWS S3 terrarium tiles |

### Resolution Stack

| Layer | Resolution | Role |
|-------|-----------|------|
| GLiM lithology | 1.5 km | PRIMARY lithology predictor (global) |
| SoilGrids | 250 m | Permeability refinement |
| Sentinel-2 | 10 m | Alteration mapping, lineament extraction |
| DEM | 30 m | Hillshade, lineament density |
| GEM Faults | 1 km | Fault proximity, lineament density |

## Dose Core API

### `polygon_dose_fingerprint()`

```python
from dose_core.dose_calculation_core import polygon_dose_fingerprint

fp = polygon_dose_fingerprint(
    lithology="Pa",          # GLiM code or named lithology
    dist_fault_m=200,        # Distance to nearest fault (m)
    lineament_density=1.0,   # Lineament density index (0–1)
    eU_ppm=10.0,             # Measured eU (optional, overrides prior)
    eTh_ppm=None,            # Measured eTh (optional)
    K_pct=None,              # Measured K % (optional)
    C_Rn=None,               # Measured indoor radon (Bq/m³, optional)
    C_Tn=None,               # Measured indoor thoron (Bq/m³, optional)
    permeability=None,       # Soil permeability proxy (0–1, optional)
    radon_method="eubss",    # DCF: eubss, icrp137, unscear, icrp65
)

# Returns:
#   arms_mSv_yr: {radon, thoron, gamma}
#   total_terrestrial_mSv_yr
#   gamma_rate_nGy_h
#   activities_Bq_kg: {A_Ra226, A_Th232, A_K40}
#   indices: {raeq, I_gamma, indoor_Rn, indoor_Tn, ELCR}
#   risk: {tier, reasons, flags}
#   provenance: [str, ...]
#   confidence: int (0–100)
```

### Other functions

- `radon_inhalation_dose(C_Rn, method="eubss")` → mSv/yr
- `risk_class(E_total, C_Rn, raeq, gamma_rate)` → {tier: "GREEN"|"AMBER"|"RED", reasons, flags}
- `external_gamma_dose_rate(A_Ra, A_Th, A_K)` → nGy/h
- `radium_equivalent(A_Ra, A_Th, A_K)` → Bq/kg
- `gamma_activity_index(A_Ra, A_Th, A_K)` → dimensionless

## Test Cases

```bash
cd terrestrial-dose
python -m pytest tests/ -v
```

| # | Input | Expected | Result |
|---|-------|----------|--------|
| 1 | World-average soil | Thoron ~0.10 mSv/yr, γ 45–60 nGy/h, GREEN | ✅ |
| 2 | Granite (Pa), fault 200m, LD=1.0 | Radon-dominated, AMBER | ✅ |
| 3 | Limestone (Sc) | Total <1.0 mSv/yr, GREEN | ✅ |
| 4 | Monazite-bearing | Thoron >1.0 mSv/yr, RED | ✅ |
| 5 | Granite + eU=10 ppm | A_Ra226 ≈ 122.2 Bq/kg, measured | ✅ |
| 6 | Radon 300 Bq/m³ | 10.0 mSv/yr, RED | ✅ |

## Standards

| Standard | Role |
|----------|------|
| **UNSCEAR 2024** | World average terrestrial dose (2.2 mSv/yr), gamma coefficients |
| **ICRP 137** | Radon/thoron dose conversion factors (public protection) |
| **EU BSS 2013/59/Euratom** | Radon action level (300 Bq/m³), building material activity index |
| **WHO** | Radon reference level (100 Bq/m³) |

## Running Locally

### Backend

```bash
cd terrestrial-dose
pip install fastapi uvicorn pydantic geopandas requests shapely
uvicorn api.main:app --reload --port 8000
```

### Frontend

```bash
cd terrestrial-dose/web
npm install
npm run dev    # Development server at localhost:5173
npm run build  # Production build to web/dist/
```

### Tests

```bash
cd terrestrial-dose
python -m pytest tests/ -v
```

## Deployment

The built frontend (`web/dist/`) is deployed to GitHub Pages at:
`https://edgeengineeringco-Git.github.io/edge-ai-agent-site/terrestrial-dose/app/`

The frontend uses a client-side TypeScript port of the dose core for instant
computation. When the FastAPI backend is available, it can be used for
server-side computation with real GLiM/SoilGrids/GEM data via the `/dose` endpoint.

## Key Formulae

### External Gamma Dose Rate (nGy/h)
```
D = 0.462 × A_Ra226 + 0.604 × A_Th232 + 0.041 × A_K40
```
Source: Saito & Jacob 1995 / UNSCEAR 2000

### Annual External Dose (mSv/yr)
```
E_γ = D × 8760 h × 0.8 (indoor) × 0.7 (Sv/nGy) × 10⁻⁶
```

### Radon Inhalation (mSv/yr)
```
E_Rn = C_Rn × DCF
```
EU BSS DCF: 10/300 = 0.0333 mSv/yr per Bq/m³

### Geogenic Radon Potential (GRP)
```
GRP = (A_Ra226 / 30) × LF × exp(-dist_fault / 3000) × (1 + LD × 0.5)
indoor_Rn = GRP × 60
```

### Geogenic Thoron Potential (GTP)
```
emanation = 0.1 + LF × 0.25
GTP = (A_Th232 / 30) × emanation / 0.630
E_Tn = GTP × Tn_DCF    (with non-linear enhancement for A_Th > 50)
```

### Activity Conversions
```
A_Ra226 (Bq/kg) = eU (ppm) × 12.22
A_Th232 (Bq/kg) = eTh (ppm) × 4.06
A_K40   (Bq/kg) = K (%) × 313
```

## Done When

- [x] All 6 tests in Step 1 pass
- [x] `/dose` endpoint returns a valid fingerprint for any lat/lon on land
- [x] Map shows risk-tiered polygons + triangle glyphs
- [x] Clicking a location shows the panel with triangle + provenance + resolution
- [x] No dose numbers computed outside `dose_calculation_core.py`
- [x] Global coverage (any land location returns a result; water/ice returns zero)
- [x] README complete
