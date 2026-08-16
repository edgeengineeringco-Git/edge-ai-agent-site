/**
 * Map.tsx — Satellite basemap with VisQuill hover/click behaviour
 * Basemap: Esri World Imagery + labels overlay
 * Hover: debounced 100ms, live dose triangle + report
 * Click: pins full report
 */

import { useEffect, useRef, useCallback, useState } from "react";
import maplibregl from "maplibre-gl";
import type { DoseFingerprint } from "./dose_core";
import { polygonDoseFingerprint } from "./dose_core";
import { getLithologyAt } from "./lithology";

interface MapProps {
  onHover: (data: DoseFingerprint, name: string) => void;
  onClick: (data: DoseFingerprint, name: string) => void;
  flyTo: { lat: number; lon: number; name: string } | null;
}

const RISK_COLORS: Record<string, string> = { GREEN: "#22c55e", AMBER: "#f59e0b", RED: "#ef4444" };

export default function MapComponent({ onHover, onClick, flyTo }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showLabels, setShowLabels] = useState(true);

  // Debounced hover handler
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMove = useCallback((lon: number, lat: number) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      const lith = getLithologyAt(lon, lat);
      if (lith.glim === "water" || lith.glim === "Water" || lith.glim === "Ice") return;
      const fp = polygonDoseFingerprint({ lithology: lith.glim, lat, lon });
      onHover(fp, lith.region);
    }, 100);
  }, [onHover]);

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      center: [-6.26, 53.35],
      zoom: 10,
      maxZoom: 18,
      minZoom: 3,
      style: {
        version: 8,
        name: "Terrestrial Dose Indicator",
        sources: {
          "esri-imagery": {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: "Esri, Maxar, Earthstar Geographics",
          },
          "esri-labels": {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: "Esri",
          },
          "esri-hillshade": {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: "Esri",
          },
        },
        layers: [
          {
            id: "satellite",
            type: "raster",
            source: "esri-imagery",
            minzoom: 0,
            maxzoom: 18,
          },
          {
            id: "hillshade",
            type: "raster",
            source: "esri-hillshade",
            minzoom: 0,
            maxzoom: 18,
            paint: { "raster-opacity": 0.15 },
          },
          {
            id: "labels",
            type: "raster",
            source: "esri-labels",
            minzoom: 0,
            maxzoom: 18,
          },
        ],
      },
    });

    // Scale bar
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 150 }), "bottom-left");

    // Nav controls
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      setLoaded(true);
    });

    // Mouse move → hover
    map.on("mousemove", (e) => {
      const { lng, lat } = e.lngLat;
      handleMove(lng, lat);

      // Update status bar
      const coordsEl = document.getElementById("status-coords");
      const lithEl = document.getElementById("status-lith");
      if (coordsEl) coordsEl.textContent = `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
      const lith = getLithologyAt(lng, lat);
      if (lithEl) lithEl.textContent = `${lith.label} (${lith.region}) — ${lith.source}`;
    });

    // Click → pin
    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      const lith = getLithologyAt(lng, lat);
      if (lith.glim === "water" || lith.glim === "Water" || lith.glim === "Ice") return;
      const fp = polygonDoseFingerprint({ lithology: lith.glim, lat, lon: lng });
      onClick(fp, lith.region);

      // Move marker
      if (markerRef.current) markerRef.current.remove();
      const color = RISK_COLORS[fp.risk.tier] || "#5ad1c5";
      const el = document.createElement("div");
      el.className = "dose-marker active";
      el.style.setProperty("--marker-color", color);
      el.innerHTML = `<div class="dose-marker-dot"></div><div class="dose-marker-pulse"></div>`;
      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [handleMove, onClick]);

  // Fly-to handler
  useEffect(() => {
    if (!flyTo || !mapInstance.current) return;
    mapInstance.current.flyTo({ center: [flyTo.lon, flyTo.lat], zoom: 14, essential: true });
    // Trigger compute at destination
    setTimeout(() => handleMove(flyTo.lon, flyTo.lat), 500);
  }, [flyTo, handleMove]);

  // Toggle labels
  const toggleLabels = useCallback(() => {
    const map = mapInstance.current;
    if (!map) return;
    const vis = showLabels ? "none" : "visible";
    map.setLayoutProperty("labels", "visibility", vis);
    setShowLabels(!showLabels);
  }, [showLabels]);

  return (
    <div className="map-container">
      {!loaded && (
        <div className="map-loader">
          <div className="loader-spinner" />
          Loading satellite imagery…
        </div>
      )}
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      <div className="map-controls">
        <button
          className={`map-control-btn ${showLabels ? "active" : ""}`}
          onClick={toggleLabels}
          title="Toggle labels"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7V4h16v3M9 20h6M12 4v16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
