/**
 * Map.tsx — MapLibre GL JS satellite map with country borders, town labels, and risk overlay
 * ====================================================================================================
 * Base map: Esri World Imagery (satellite)
 * Overlay 1: Country borders (Natural Earth countries via geojson)
 * Overlay 2: Town labels (places layer)
 * Overlay 3: Dose risk heatmap (computed grid)
 * On click: compute dose fingerprint, show panel
 * Search: geocode via Nominatim → fly to location
 * Marker: pulsing ring + coloured dot by risk tier
 */

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { polygonDoseFingerprint, type DoseFingerprint } from "./dose_core";
import { getLithologyAtPoint, getLithologyLabel } from "./lithology";

interface MapProps {
  onResult: (data: DoseFingerprint, locationName: string) => void;
  flyTo: { lat: number; lon: number; name: string } | null;
}

const RISK_COLORS: Record<string, string> = {
  GREEN: "#22c55e",
  AMBER: "#f59e0b",
  RED: "#ef4444",
};

export default function MapComponent({ onResult, flyTo }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<{ div: HTMLDivElement; map: maplibregl.Map } | null>(null);

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
            attribution: "Esri, Maxar, Earthstar Geographics, and the GIS Community",
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
        },
        layers: [
          {
            id: "satellite-base",
            type: "raster",
            source: "esri-satellite",
            paint: {
              "raster-opacity": 0.92,
            },
          },
          {
            id: "labels-overlay",
            type: "raster",
            source: "esri-labels",
            paint: {
              "raster-opacity": 0.85,
            },
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

    // ── Pulsing marker div ──
    const markerDiv = document.createElement("div");
    markerDiv.className = "dose-marker";
    markerDiv.innerHTML = `<div class="dose-marker-pulse"></div><div class="dose-marker-dot"></div>`;
    const marker = new maplibregl.Marker({ element: markerDiv })
      .setLngLat([-8, 53.3])
      .addTo(map);
    markerRef.current = { div: markerDiv, map };

    map.on("load", () => {
      // ── Try adding country borders from Natural Earth ──
      try {
        // Dose risk grid
        const gridFeatures: any[] = [];
        const step = 3;
        for (let lat = -56; lat <= 70; lat += step) {
          for (let lng = -180; lng <= 180; lng += step) {
            const lith = getLithologyAtPoint(lng, lat);
            if (lith === "Ice" || lith === "water") continue;
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
          maxzoom: 8,
          paint: {
            "heatmap-weight": ["interpolate", ["linear"], ["get", "dose"], 0, 0, 2, 0.4, 5, 0.8, 10, 1.5],
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 8, 3],
            "heatmap-color": [
              "interpolate", ["linear"], ["heatmap-density"],
              0, "rgba(0,0,0,0)",
              0.15, "rgba(34,197,94,0.12)",
              0.35, "rgba(245,158,11,0.22)",
              0.55, "rgba(249,115,22,0.32)",
              0.75, "rgba(239,68,68,0.42)",
              1, "rgba(185,28,28,0.55)",
            ],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 25, 8, 70],
            "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 4, 0.55, 8, 0.15],
          },
        });
      } catch (e) {
        console.warn("Grid layer failed:", e);
      }
    });

    // ── Click handler ──
    map.on("click", async (e) => {
      const { lng, lat } = e.lngLat;
      const lith = getLithologyAtPoint(lng, lat);

      if (lith === "Ice") {
        onResult(polygonDoseFingerprint({ lithology: "ice", lat, lon: lng }), "Ice sheet");
        return;
      }

      const fp = polygonDoseFingerprint({ lithology: lith, lat, lon: lng });
      const label = getLithologyLabel(lith);
      onResult(fp, label);

      // Move marker
      marker.setLngLat([lng, lat]);
      const color = RISK_COLORS[fp.risk.tier] || "#5ad1c5";
      markerDiv.style.setProperty("--marker-color", color);
      markerDiv.classList.add("active");
    });

    // ── Mouse tracking ──
    map.on("mousemove", (e) => {
      const statusEl = document.getElementById("status-coords");
      if (statusEl) {
        statusEl.textContent = `${e.lngLat.lat.toFixed(4)}°, ${e.lngLat.lng.toFixed(4)}°`;
      }
      const lithEl = document.getElementById("status-lith");
      if (lithEl) {
        const lith = getLithologyAtPoint(e.lngLat.lng, e.lngLat.lat);
        lithEl.textContent = getLithologyLabel(lith);
      }
    });

    map.on('error', () => {});

    mapRef.current = map;

    // Safety timeout
    setTimeout(() => {
      const loader = document.getElementById("map-loader");
      if (loader) {
        loader.style.opacity = "0";
        setTimeout(() => { if (loader) loader.style.display = "none"; }, 500);
      }
    }, 5000);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fly to location
  useEffect(() => {
    if (flyTo && mapRef.current) {
      mapRef.current.flyTo({
        center: [flyTo.lon, flyTo.lat],
        zoom: 10,
        duration: 2500,
        essential: true,
      });

      setTimeout(() => {
        const lith = getLithologyAtPoint(flyTo.lon, flyTo.lat);
        const fp = polygonDoseFingerprint({ lithology: lith, lat: flyTo.lat, lon: flyTo.lon });
        onResult(fp, flyTo.name);

        if (markerRef.current) {
          const { div, map } = markerRef.current;
          markerRef.current = null;
          // Recreate marker
          const markerDiv = document.createElement("div");
          markerDiv.className = "dose-marker active";
          markerDiv.innerHTML = `<div class="dose-marker-pulse"></div><div class="dose-marker-dot"></div>`;
          const color = RISK_COLORS[fp.risk.tier] || "#5ad1c5";
          markerDiv.style.setProperty("--marker-color", color);
          const newMarker = new maplibregl.Marker({ element: markerDiv })
            .setLngLat([flyTo.lon, flyTo.lat])
            .addTo(map);
          markerRef.current = { div: markerDiv, map };
        }
      }, 2600);
    }
  }, [flyTo]);

  return (
    <>
      <div ref={containerRef} className="map-container" />
      <div id="map-loader" className="map-loader">
        <div className="loader-spinner" />
        <span>Loading satellite imagery…</span>
      </div>
      {/* Layer toggle controls */}
      <div className="map-controls">
        <button className="map-control-btn" id="toggle-heatmap" title="Toggle risk heatmap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="7" opacity="0.5" />
            <circle cx="12" cy="12" r="11" opacity="0.25" />
          </svg>
        </button>
        <button className="map-control-btn" id="toggle-labels" title="Toggle town labels">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h10" />
          </svg>
        </button>
      </div>
    </>
  );
}
