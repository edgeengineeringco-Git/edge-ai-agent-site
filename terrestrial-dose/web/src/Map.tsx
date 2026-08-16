/**
 * Map.tsx — MapLibre GL JS satellite map with VisQuill hover behavior
 * ===================================================================
 * Hover: debounced 100ms, updates live triangle + headline.
 * Click: locks the full analysis panel.
 * Search: geocode via Nominatim → fly to location.
 * Marker: pulsing ring coloured by risk tier.
 */

import { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { polygonDoseFingerprint, type DoseFingerprint } from "./dose_core";
import { getLithologyAtPoint, getLithologyLabel } from "./lithology";

interface MapProps {
  onHover: (data: DoseFingerprint, locationName: string) => void;
  onClick: (data: DoseFingerprint, locationName: string) => void;
  flyTo: { lat: number; lon: number; name: string } | null;
}

const RISK_COLORS: Record<string, string> = {
  GREEN: "#22c55e",
  AMBER: "#f59e0b",
  RED: "#ef4444",
};

export default function MapComponent({ onHover, onClick, flyTo }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const markerDivRef = useRef<HTMLDivElement | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHoverRef = useRef<string>("");

  // Stable callback refs
  const onHoverRef = useRef(onHover);
  const onClickRef = useRef(onClick);
  onHoverRef.current = onHover;
  onClickRef.current = onClick;

  const computeAtPoint = useCallback((lon: number, lat: number): DoseFingerprint => {
    const lith = getLithologyAtPoint(lon, lat);
    return polygonDoseFingerprint({ lithology: lith, lat, lon });
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          "esri-satellite": {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: "Esri, Maxar, Earthstar Geographics",
            maxzoom: 19,
          },
          "esri-labels": {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            maxzoom: 19,
          },
          "esri-hillshade": {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            maxzoom: 16,
          },
        },
        layers: [
          {
            id: "satellite-base",
            type: "raster",
            source: "esri-satellite",
            paint: { "raster-opacity": 0.92 },
          },
          {
            id: "hillshade-overlay",
            type: "raster",
            source: "esri-hillshade",
            paint: { "raster-opacity": 0.12 },
          },
          {
            id: "labels-overlay",
            type: "raster",
            source: "esri-labels",
            paint: { "raster-opacity": 0.85 },
          },
        ],
      },
      center: [-8, 53.3],
      zoom: 5,
      minZoom: 2,
      maxZoom: 18,
      attributionControl: false,
      pitchWithRotate: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric", maxWidth: 200 }), "bottom-left");

    // ── Pulsing marker ──
    const markerDiv = document.createElement("div");
    markerDiv.className = "dose-marker";
    markerDiv.innerHTML = `<div class="dose-marker-pulse"></div><div class="dose-marker-dot"></div>`;
    const marker = new maplibregl.Marker({ element: markerDiv })
      .setLngLat([-8, 53.3])
      .addTo(map);
    markerDivRef.current = markerDiv;

    // ── Hover cursor indicator ──
    const hoverCursor = document.createElement("div");
    hoverCursor.className = "hover-cursor";
    hoverCursor.innerHTML = `<span class="hover-cursor-label"></span>`;

    map.on("load", () => {
      // ── Dose heatmap grid ──
      try {
        const gridFeatures: any[] = [];
        const step = 2;
        for (let lat = 35; lat <= 72; lat += step) {
          for (let lng = -12; lng <= 40; lng += step) {
            const lith = getLithologyAtPoint(lng, lat);
            if (lith === "Ice" || lith === "Wa") continue;
            const fp = polygonDoseFingerprint({ lithology: lith });
            gridFeatures.push({
              type: "Feature",
              geometry: { type: "Point", coordinates: [lng, lat] },
              properties: {
                dose: fp.total_terrestrial_mSv_yr,
                tier: fp.risk.tier,
                lithology: lith,
              },
            });
          }
        }

        map.addSource("dose-grid", {
          type: "geojson",
          data: { type: "FeatureCollection", features: gridFeatures },
        });

        map.addLayer({
          id: "dose-heat",
          type: "heatmap",
          source: "dose-grid",
          maxzoom: 7,
          paint: {
            "heatmap-weight": ["interpolate", ["linear"], ["get", "dose"], 0, 0, 2, 0.4, 5, 0.8, 10, 1.5],
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 0.8, 7, 2.5],
            "heatmap-color": [
              "step", ["get", "dose"],
              "rgba(0,0,0,0)",
              0.5, "rgba(34,197,94,0.08)",
              1.5, "rgba(245,158,11,0.15)",
              3.0, "rgba(249,115,22,0.22)",
              5.0, "rgba(239,68,68,0.32)",
              10, "rgba(185,28,28,0.45)",
            ],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 30, 7, 80],
            "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 7, 0.15],
          },
        });
      } catch (e) {
        console.warn("Heatmap layer failed:", e);
      }

      // Remove loader
      const loader = document.getElementById("map-loader");
      if (loader) {
        loader.style.opacity = "0";
        setTimeout(() => { loader.style.display = "none"; }, 500);
      }
    });

    // ── VisQuill hover: debounced 100ms ──
    map.on("mousemove", (e) => {
      const { lng, lat } = e.lngLat;
      const key = `${lng.toFixed(3)},${lat.toFixed(3)}`;

      // Update status bar
      const coordsEl = document.getElementById("status-coords");
      if (coordsEl) coordsEl.textContent = `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
      const lithEl = document.getElementById("status-lith");
      if (lithEl) {
        const lith = getLithologyAtPoint(lng, lat);
        lithEl.textContent = getLithologyLabel(lith);
      }

      // Skip if same cell
      if (key === lastHoverRef.current) return;
      lastHoverRef.current = key;

      // Debounce hover computation
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = setTimeout(() => {
        const fp = computeAtPoint(lng, lat);
        const label = getLithologyLabel(fp.lithology);
        onHoverRef.current(fp, label);
      }, 100);
    });

    // ── Click: lock full panel ──
    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      const fp = computeAtPoint(lng, lat);
      const label = getLithologyLabel(fp.lithology);

      // Move marker
      marker.setLngLat([lng, lat]);
      const color = RISK_COLORS[fp.risk.tier] || "#5ad1c5";
      markerDiv.style.setProperty("--marker-color", color);
      markerDiv.classList.add("active");

      onClickRef.current(fp, label);
    });

    map.on("error", () => {});

    // Safety timeout for loader
    setTimeout(() => {
      const loader = document.getElementById("map-loader");
      if (loader && loader.style.display !== "none") {
        loader.style.opacity = "0";
        setTimeout(() => { loader.style.display = "none"; }, 500);
      }
    }, 8000);

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [computeAtPoint]);

  // ── Fly to location ──
  useEffect(() => {
    if (!flyTo || !mapRef.current) return;
    const map = mapRef.current;

    map.flyTo({
      center: [flyTo.lon, flyTo.lat],
      zoom: 10,
      duration: 2500,
      essential: true,
    });

    const timeout = setTimeout(() => {
      const fp = computeAtPoint(flyTo.lon, flyTo.lat);

      // Move marker
      const markerDiv = markerDivRef.current;
      if (markerDiv) {
        const color = RISK_COLORS[fp.risk.tier] || "#5ad1c5";
        markerDiv.style.setProperty("--marker-color", color);
        markerDiv.classList.add("active");
      }

      onClickRef.current(fp, flyTo.name);
    }, 2600);

    return () => clearTimeout(timeout);
  }, [flyTo, computeAtPoint]);

  return (
    <>
      <div ref={containerRef} className="map-container" />
      <div id="map-loader" className="map-loader">
        <div className="loader-spinner" />
        <span>Loading satellite imagery…</span>
      </div>
      {/* Layer controls */}
      <div className="map-controls">
        <button
          className="map-control-btn"
          title="Toggle risk heatmap"
          onClick={() => {
            const map = mapRef.current;
            if (!map) return;
            try {
              const vis = map.getLayoutProperty("dose-heat", "visibility");
              map.setLayoutProperty("dose-heat", "visibility", vis === "none" ? "visible" : "none");
            } catch {}
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="7" opacity="0.5" />
            <circle cx="12" cy="12" r="11" opacity="0.25" />
          </svg>
        </button>
        <button
          className="map-control-btn"
          title="Toggle town labels"
          onClick={() => {
            const map = mapRef.current;
            if (!map) return;
            try {
              const vis = map.getLayoutProperty("labels-overlay", "visibility");
              map.setLayoutProperty("labels-overlay", "visibility", vis === "none" ? "visible" : "none");
            } catch {}
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h10" />
          </svg>
        </button>
        <button
          className="map-control-btn"
          title="Toggle terrain hillshade"
          onClick={() => {
            const map = mapRef.current;
            if (!map) return;
            try {
              const vis = map.getLayoutProperty("hillshade-overlay", "visibility");
              map.setLayoutProperty("hillshade-overlay", "visibility", vis === "none" ? "visible" : "none");
            } catch {}
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 20L8 8l4 6 4-10 6 16" />
          </svg>
        </button>
      </div>
    </>
  );
}
