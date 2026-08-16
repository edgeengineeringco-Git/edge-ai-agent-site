/**
 * App.tsx — Main layout with VisQuill hover/click behaviour
 * Hover: live triangle + headline updates (debounced 100ms)
 * Click: locks full analysis panel
 */

import { useState, useCallback } from "react";
import MapComponent from "./Map";
import Panel from "./Panel";
import type { DoseFingerprint } from "./dose_core";
import "./styles.css";

interface FlyTo {
  lat: number;
  lon: number;
  name: string;
}

const PRESETS: { name: string; lat: number; lon: number; description?: string }[] = [
  { name: "Dublin, Ireland", lat: 53.35, lon: -6.26 },
  { name: "Cornwall, UK (radon hotspot)", lat: 50.35, lon: -5.1 },
  { name: "Paris, France", lat: 48.86, lon: 2.35 },
  { name: "Munich, Germany", lat: 48.14, lon: 11.58 },
  { name: "Barcelona, Spain", lat: 41.39, lon: 2.17 },
  { name: "Rome, Italy", lat: 41.9, lon: 12.5 },
  { name: "Stockholm, Sweden", lat: 59.33, lon: 18.07 },
  { name: "Athens, Greece", lat: 37.98, lon: 23.73 },
  { name: "Reykjavik, Iceland", lat: 64.13, lon: -21.94 },
  { name: "Vienna, Austria", lat: 48.21, lon: 16.37 },
  { name: "Prague, Czech Republic", lat: 50.08, lon: 14.44 },
  { name: "Zurich, Switzerland", lat: 47.38, lon: 8.54 },
  { name: "Edinburgh, Scotland", lat: 55.95, lon: -3.19 },
  { name: "Oslo, Norway", lat: 59.91, lon: 10.75 },
  { name: "Warsaw, Poland", lat: 52.23, lon: 21.01 },
  { name: "Bucharest, Romania", lat: 44.43, lon: 26.1 },
  { name: "Lisbon, Portugal", lat: 38.72, lon: -9.14 },
  { name: "Helsinki, Finland", lat: 60.17, lon: 24.94 },
  { name: "Kerala, India (monazite)", lat: 8.4, lon: 76.9 },
  { name: "Ramsar, Iran (highest background)", lat: 36.9, lon: 50.65 },
];

export default function App() {
  const [hoverData, setHoverData] = useState<DoseFingerprint | null>(null);
  const [hoverName, setHoverName] = useState<string | null>(null);
  const [lockedData, setLockedData] = useState<DoseFingerprint | null>(null);
  const [lockedName, setLockedName] = useState<string | null>(null);
  const [flyTo, setFlyTo] = useState<FlyTo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPresets, setShowPresets] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Display data: locked takes priority over hover
  const displayData = lockedData || hoverData;
  const displayName = lockedData ? lockedName : hoverName;
  const isHover = !lockedData && !!hoverData;

  const handleHover = useCallback((data: DoseFingerprint, name: string) => {
    if (lockedData) return; // Don't update hover when locked
    setHoverData(data);
    setHoverName(name);
  }, [lockedData]);

  const handleClick = useCallback((data: DoseFingerprint, name: string) => {
    setLockedData(data);
    setLockedName(name);
    setHoverData(null);
    setHoverName(null);
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await resp.json();
      if (data && data[0]) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const name = data[0].display_name.split(",")[0];
        setLockedData(null); // Clear lock so new result shows
        setFlyTo({ lat, lon, name });
      }
    } catch {
      // Silent fail
    }
  };

  const handlePreset = (preset: { name: string; lat: number; lon: number }) => {
    setSearchQuery(preset.name);
    setLockedData(null);
    setFlyTo({ ...preset });
    setShowPresets(false);
  };

  return (
    <div className="app">
      {/* Top bar */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="logo">
            <span className="logo-edge">EDGE</span>
            <span className="logo-divider">·</span>
            <span className="logo-title">Terrestrial Dose Indicator</span>
          </div>
        </div>
        <div className="topbar-center">
          <div className="search-box">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search town or region…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button className="search-btn" onClick={handleSearch}>Go</button>
          </div>
          <div className="preset-wrapper">
            <button className="preset-btn" onClick={() => setShowPresets(!showPresets)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12l3-3 3 3 3-3 3 3 3-3 3 3" />
              </svg>
              Presets
            </button>
            {showPresets && (
              <div className="preset-dropdown">
                {PRESETS.map((p) => (
                  <button key={p.name} className="preset-item" onClick={() => handlePreset(p)}>
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="topbar-right">
          <button className="info-btn" onClick={() => setShowInfo(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            Standards
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="main">
        <div className="map-area">
          <MapComponent onHover={handleHover} onClick={handleClick} flyTo={flyTo} />
        </div>
        <aside className="panel-area">
          <Panel data={displayData} locationName={displayName} isHover={isHover} />
        </aside>
      </main>

      {/* Status bar */}
      <footer className="statusbar">
        <div className="status-group">
          <span className="status-label">LAT/LON:</span>
          <span id="status-coords" className="status-value">—</span>
        </div>
        <div className="status-group">
          <span className="status-label">LITHOLOGY:</span>
          <span id="status-lith" className="status-value">—</span>
        </div>
        <div className="status-group">
          <span className="status-label">DATA:</span>
          <span className="status-value">GLiM 1.5km · GEM Faults · SoilGrids 250m</span>
        </div>
        <div className="status-group">
          <span className="status-label">STANDARDS:</span>
          <span className="status-value">UNSCEAR 2024 · ICRP 137 · EU BSS</span>
        </div>
      </footer>

      {/* Info modal */}
      {showInfo && (
        <div className="modal-overlay" onClick={() => setShowInfo(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Standards &amp; Methodology</h2>
              <button className="modal-close" onClick={() => setShowInfo(false)}>×</button>
            </div>
            <div className="modal-body">
              <h3>External Gamma Dose Rate</h3>
              <p>
                Computed using UNSCEAR 2000 / Saito &amp; Jacob 1995 dose-rate coefficients:
                D (nGy/h) = 0.462 × A_Ra226 + 0.604 × A_Th232 + 0.041 × A_K40
              </p>
              <p>
                Annual effective dose: E (mSv/yr) = D × 8760 h × 0.8 (indoor) × 0.7 (Sv/nGy) × 10⁻⁶
              </p>

              <h3>Radon (Rn-222) Inhalation</h3>
              <p>
                EU BSS 2013/59/Euratom DCF: 10 mSv/yr per 300 Bq/m³ (domestic, equilibrium factor 0.4).
                Also supports ICRP 137, UNSCEAR 2020, and ICRP 65 legacy coefficients.
              </p>
              <p>
                Geogenic Radon Potential (GRP) from Ra-226 activity, lithology factor,
                fault proximity, and lineament density.
              </p>

              <h3>Thoron (Rn-220) Inhalation</h3>
              <p>
                DCF: 40 nSv per (Bq/m³ EEC · h) × 7000 indoor hours.
                EEC/gas ratio: 0.02 (UNSCEAR).
              </p>
              <p>
                Non-linear enhancement for high Th-232 activities (&gt;50 Bq/kg) to capture
                monazite/REE-bearing soil emanation behaviour.
              </p>

              <h3>Risk Classification</h3>
              <table className="modal-table">
                <thead><tr><th>Metric</th><th>GREEN</th><th>AMBER</th><th>RED</th></tr></thead>
                <tbody>
                  <tr><td>Total dose (mSv/yr)</td><td>≤ 2.2</td><td>2.2–6.6</td><td>&gt; 6.6</td></tr>
                  <tr><td>Radon (Bq/m³)</td><td>≤ 100</td><td>100–300</td><td>≥ 300</td></tr>
                  <tr><td>Gamma rate (nGy/h)</td><td>≤ 59</td><td>59–1000</td><td>≥ 1000</td></tr>
                  <tr><td>Ra-eq (Bq/kg)</td><td>≤ 370</td><td>370–740</td><td>≥ 740</td></tr>
                </tbody>
              </table>

              <h3>Activity Conversions</h3>
              <ul>
                <li>1 ppm eU → 12.22 Bq/kg Ra-226 (IAEA SRS-49)</li>
                <li>1 ppm eTh → 4.06 Bq/kg Th-232</li>
                <li>1% K → 313 Bq/kg K-40</li>
              </ul>

              <h3>References</h3>
              <ul>
                <li>UNSCEAR 2024 — Sources, Effects and Risks of Ionizing Radiation</li>
                <li>ICRP 137 — Occupational Intakes of Radionuclides</li>
                <li>EU BSS 2013/59/Euratom — Basic Safety Standards Directive</li>
                <li>WHO Handbook on Indoor Radon (2009)</li>
                <li>Hartmann &amp; Moosdorf 2012 — GLiM (doi:10.1029/2012GC004370)</li>
                <li>Saito &amp; Jacob 1995 — Gamma dose-rate coefficients</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
