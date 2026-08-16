/**
 * App.tsx — Main layout
 * Left: satellite map with floating triangle
 * Right: report panel (pinned on click)
 */

import { useState, useCallback } from "react";
import MapComponent from "./Map";
import Panel from "./Panel";
import type { DoseFingerprint } from "./dose_core";

const PRESETS = [
  { name: "Dublin", lat: 53.3498, lon: -6.2603 },
  { name: "London", lat: 51.5074, lon: -0.1278 },
  { name: "Paris", lat: 48.8566, lon: 2.3522 },
  { name: "Berlin", lat: 52.5200, lon: 13.4050 },
  { name: "Rome", lat: 41.9028, lon: 12.4964 },
  { name: "Madrid", lat: 40.4168, lon: -3.7038 },
  { name: "Vienna", lat: 48.2082, lon: 16.3738 },
  { name: "Stockholm", lat: 59.3293, lon: 18.0686 },
  { name: "Oslo", lat: 59.9139, lon: 10.7522 },
  { name: "Helsinki", lat: 60.1699, lon: 24.9384 },
  { name: "Prague", lat: 50.0755, lon: 14.4378 },
  { name: "Warsaw", lat: 52.2297, lon: 21.0122 },
  { name: "Athens", lat: 37.9838, lon: 23.7275 },
  { name: "Lisbon", lat: 38.7223, lon: -9.1393 },
  { name: "Munich", lat: 48.1351, lon: 11.5820 },
  { name: "Zurich", lat: 47.3769, lon: 8.5417 },
];

export default function App() {
  const [pinnedData, setPinnedData] = useState<DoseFingerprint | null>(null);
  const [pinnedName, setPinnedName] = useState("");
  const [panelVisible, setPanelVisible] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleHover = useCallback(() => {}, []);

  const handleClick = useCallback((data: DoseFingerprint, name: string) => {
    setPinnedData(data);
    setPinnedName(name);
    setPanelVisible(true);
  }, []);

  const handlePreset = (p: typeof PRESETS[0]) => {
    setFlyTo({ lat: p.lat, lon: p.lon, name: p.name });
    // Compute dose
    import("./dose_core").then(({ polygonDoseFingerprint }) => {
      import("./lithology").then(({ getLithologyAt }) => {
        const lith = getLithologyAt(p.lon, p.lat);
        const fp = polygonDoseFingerprint({ lithology: lith.glim, lat: p.lat, lon: p.lon });
        setPinnedData(fp);
        setPinnedName(p.name);
        setPanelVisible(true);
      });
    });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await resp.json();
      if (data?.[0]) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setFlyTo({ lat, lon, name: data[0].display_name.split(",")[0] });
      }
    } catch (e) {
      console.error("Search failed:", e);
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="topbar-logo">◈</span>
          <h1 className="topbar-title">Euro-Dose</h1>
          <span className="topbar-subtitle">European Terrestrial Dose Indicator</span>
        </div>
        <div className="topbar-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search location…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button onClick={handleSearch}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
          </div>
          <select className="preset-select" onChange={(e) => {
            const p = PRESETS.find((x) => x.name === e.target.value);
            if (p) handlePreset(p);
          }} value="">
            <option value="" disabled>Jump to city…</option>
            {PRESETS.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        </div>
      </header>

      <main className="main">
        <div className="map-pane">
          <MapComponent onHover={handleHover} onClick={handleClick} flyTo={flyTo} />
        </div>
        <div className={`panel-pane ${panelVisible ? "visible" : ""}`}>
          <Panel data={pinnedData} name={pinnedName} visible={panelVisible} onClose={() => setPanelVisible(false)} />
        </div>
      </main>
    </div>
  );
}
