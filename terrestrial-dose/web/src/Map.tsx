/**
 * Map.tsx — MapLibre GL JS map with risk overlay
 * ================================================
 * Base map: CartoDB Dark Matter
 * Layer 1: Lithology polygons coloured by risk tier (green/amber/red), alpha 0.4
 * Layer 2: Dose-fingerprint triangle markers at click locations
 * On click: compute dose fingerprint, show panel
 * Search bar: geocode via Nominatim → fly to location
 */

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { polygonDoseFingerprint, type DoseFingerprint } from "./dose_core";
import { getLithologyAtPoint, getLithologyLabel } from "./lithology";

interface MapProps {
  onResult: (data: DoseFingerprint, locationName: string) => void;
  flyTo: { lat: number; lon: number; name: string } | null;
}

export default function MapComponent({ onResult, flyTo }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          "carto-dark": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
              "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
              "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap, © CARTO",
          },
        },
        layers: [
          {
            id: "base",
            type: "raster",
            source: "carto-dark",
            paint: {
              "raster-opacity": 0.85,
            },
          },
        ],
      },
      center: [-8, 53.3],
      zoom: 5,
      minZoom: 2,
      maxZoom: 14,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

    map.on("load", () => {
      // Add a source for click markers
      map.addSource("click-marker", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      // Add a circle layer for the marker
      map.addLayer({
        id: "marker-circle",
        type: "circle",
        source: "click-marker",
        paint: {
          "circle-radius": 8,
          "circle-color": "#5ad1c5",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 2,
        },
      });

      // Add a risk heatmap from a pre-computed grid
      const gridFeatures: any[] = [];
      const step = 4; // degrees
      for (let lat = -56; lat <= 70; lat += step) {
        for (let lng = -180; lng <= 180; lng += step) {
          const lith = getLithologyAtPoint(lng, lat);
          if (lith === "Ice") continue;
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

      // Heatmap
      map.addLayer({
        id: "dose-heat",
        type: "heatmap",
        source: "dose-grid",
        maxzoom: 8,
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "dose"], 0, 0, 2, 0.5, 5, 1, 10, 1.5],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 8, 3],
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(0,0,0,0)",
            0.2, "rgba(34,197,94,0.15)",
            0.4, "rgba(245,158,11,0.25)",
            0.6, "rgba(249,115,22,0.35)",
            0.8, "rgba(239,68,68,0.45)",
            1, "rgba(185,28,28,0.55)",
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 30, 8, 80],
          "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0.6, 8, 0.2],
        },
      });
    });

    // Click handler
    map.on("click", async (e) => {
      const { lng, lat } = e.lngLat;
      const lith = getLithologyAtPoint(lng, lat);

      // Skip water/ice
      if (lith === "Ice") {
        onResult(polygonDoseFingerprint({ lithology: "ice", lat, lon: lng }), "Ice sheet");
        return;
      }
      if (lith === "water") {
        onResult(polygonDoseFingerprint({ lithology: "water", lat, lon: lng }), "Water body");
        return;
      }

      // Compute dose
      const fp = polygonDoseFingerprint({ lithology: lith, lat, lon: lng });
      const label = getLithologyLabel(lith);
      onResult(fp, label);

      // Update marker
      const markerSource = map.getSource("click-marker") as maplibregl.GeoJSONSource;
      if (markerSource) {
        markerSource.setData({
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            geometry: { type: "Point", coordinates: [lng, lat] },
            properties: { tier: fp.risk.tier },
          }],
        });
      }

      // Update marker color
      const colors: Record<string, string> = { GREEN: "#22c55e", AMBER: "#f59e0b", RED: "#ef4444" };
      map.setPaintProperty("marker-circle", "circle-color", colors[fp.risk.tier] || "#5ad1c5");
    });

    // Mouse coordinates in status bar
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

    mapRef.current = map;

    // Safety: hide loader after 5s
    setTimeout(() => {
      const loader = document.getElementById("map-loader");
      if (loader) loader.style.display = "none";
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
        zoom: 8,
        duration: 2000,
      });

      // Also compute dose for the fly-to location
      const lith = getLithologyAtPoint(flyTo.lon, flyTo.lat);
      const fp = polygonDoseFingerprint({ lithology: lith, lat: flyTo.lat, lon: flyTo.lon });
      onResult(fp, flyTo.name);
    }
  }, [flyTo]);

  return (
    <>
      <div ref={containerRef} className="map-container" />
      <div id="map-loader" className="map-loader">
        <div className="loader-spinner" />
        <span>Loading map…</span>
      </div>
    </>
  );
}
