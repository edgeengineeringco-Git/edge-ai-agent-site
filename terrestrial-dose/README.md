# Terrestrial Dose Indicator

Interactive web GIS for Europe that estimates terrestrial radiation dose (radon-222, thoron-220, external gamma) at every land point.

## Architecture

```
terrestrial-dose/
├── dose_core/
│   └── dose_calculation_core.py   # Core dose formulas (DO NOT MODIFY)
├── tests/
│   └── test_dose_core.py          # 6 validation tests
├── api/
│   └── main.py                    # FastAPI backend
├── ingest/                        # Data ingest modules
│   ├── glim.py                    # GLiM geology
│   ├── soilgrids.py               # SoilGrids permeability
│   ├── faults.py                  # GEM faults
│   ├── sentinel2.py               # Sentinel-2 EO
│   └── cache.py                   # Cache management
├── web/
│   ├── src/
│   │   ├── dose_core.ts           # TypeScript port of dose formulas
│   │   ├── lithology.ts           # European geological provinces (~120 regions)
│   │   ├── analysis.ts            # Templated "Why this dose?" generator
│   │   ├── Map.tsx                 # MapLibre GL JS satellite map with hover
│   │   ├── Panel.tsx              # Full analysis card
│   │   ├── Triangle.tsx           # D3 three-arm dose triangle
│   │   ├── App.tsx                # Main layout
│   │   └── styles.css             # Dark theme
│   ├── package.json
│   └── vite.config.ts
├── app/                           # Built output (GitHub Pages)
└── README.md
```

## Dose Standards

| Metric | GREEN | AMBER | RED |
|--------|-------|-------|-----|
| Total dose (mSv/yr) | ≤ 2.2 | 2.2–6.6 | > 6.6 |
| Radon (Bq/m³) | ≤ 100 | 100–300 | ≥ 300 |
| Gamma rate (nGy/h) | ≤ 59 | 59–1000 | ≥ 1000 |
| Ra-eq (Bq/kg) | ≤ 370 | 370–740 | ≥ 740 |

- UNSCEAR 2024 — global average terrestrial dose: 2.2 mSv/yr
- EU BSS 2013/59/Euratom — radon action level: 300 Bq/m³ → 10 mSv/yr
- WHO — indoor radon reference level: 100 Bq/m³

## Data Sources

| Layer | Source | Resolution | Role |
|-------|--------|-----------|------|
| Lithology | GLiM (Hartmann & Moosdorf 2012) | ~1.5 km | Primary predictor |
| Soil | SoilGrids 2.0 | 250 m | Permeability, depth |
| Faults | GEM Global Active Faults | vector | Fault proximity |
| DEM | EU-DEM / GLO-30 | 25–30 m | Lineament density |
| Land cover | Corine + Copernicus HRL | 100 m | Shielding factor |
| Moisture | ESA CCI / SMAP | 1–10 km | Emanation modulation |
| Climate | ERA5 | ~9–31 km | Seasonal radon factor |
| Geochem | FOREGS, GEMAS | point→grid | Validate K/U/Th |
| Radiation | JRC Atlas, REMdb | NUTS/grid | Validate + confidence |

## Physics

All dose calculations originate in `dose_core/dose_calculation_core.py`:

1. **Lithology → Activities**: GLiM code maps to typical Ra-226, Th-232, K-40 (Bq/kg) from UNSCEAR 2000 Annex B.
2. **External Gamma**: Saito & Jacob 1995 coefficients: D = 0.462×Ra + 0.604×Th + 0.041×K (nGy/h).
3. **Radon**: Geogenic Radon Potential (GRP) → indoor Rn (Bq/m³) → dose via EU BSS DCF (10 mSv/yr per 300 Bq/m³).
4. **Thoron**: Global Thoron Potential (GTP) → indoor Tn EEC → dose. Non-linear enhancement for Th-232 > 50 Bq/kg.
5. **Risk**: GREEN ≤ 2.2, AMBER 2.2–6.6, RED > 6.6 mSv/yr (or Rn ≥ 300, Ra-eq ≥ 370, γ ≥ 1000).

## Running Tests

```bash
cd terrestrial-dose
python3 -m pytest tests/test_dose_core.py -v
```

Expected: 6 tests pass (world average soil, granite amber, carbonate green, monazite red, measurement override, radon action level).

## Running the API

```bash
pip install fastapi uvicorn
cd terrestrial-dose
uvicorn api.main:app --reload --port 8000
```

Endpoints:
- `GET /dose?lat=53.35&lon=-6.26` — full dose fingerprint
- `GET /dose/bbox?south=48&west=5&north=55&east=15&step=1` — grid for map tiles
- `GET /health` — health check

## Running the Frontend

```bash
cd terrestrial-dose/web
npm install
npm run dev    # Development
npm run build  # Production → dist/
```

## Live Demo

https://edgeengineeringco-Git.github.io/edge-ai-agent-site/terrestrial-dose/app/

## License

Open data. All radiation data from UNSCEAR, ICRP, EU BSS — public domain.
Geological data from GLiM (CC BY 4.0), GEM, SoilGrids (CC0).
