/**
 * Map.tsx — VisQuill-style satellite map with floating dose triangle
 * Triangle follows cursor on hover, updates live.
 * Click pins the report.
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
const RISK_BG: Record<string, string> = { GREEN: "rgba(34,197,94,0.15)", AMBER: "rgba(245,158,11,0.15)", RED: "rgba(239,68,68,0.15)" };

export default function MapComponent({ onHover, onClick, flyTo }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [hoverData, setHoverData] = useState<{ fp: DoseFingerprint; name: string } | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildTrianglePath = (radon: number, thoron: number, gamma: number) => {
    const max = Math.max(radon, thoron, gamma, 0.5);
    const scale = 50 / max;
    const rY = -radon * scale;
    const tX = -thoron * scale * 0.87;
    const tY = thoron * scale * 0.5;
    const gX = gamma * scale * 0.87;
    const gY = gamma * scale * 0.5;
    return `M 0 ${rY} L ${tX} ${tY} L ${gX} ${gY} Z`;
  };

  const handleMove = useCallback((e: maplibregl.MapMouseEvent) => {
    const { lng, lat } = e.lngLat;
    const pixel = e.point;
    setCursorPos({ x: pixel.x, y: pixel.y });

    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      const lith = getLithologyAt(lng, lat);
      if (lith.glim === "water" || lith.glim === "Wa" || lith.glim === "Ice") {
        setHoverData(null);
        return;
      }
      const fp = polygonDoseFingerprint({ lithology: lith.glim, lat, lon: lng });
      setHoverData({ fp, name: lith.region });
      onHover(fp, lith.region);
    }, 80);
  }, [onHover]);

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
        sources: {
          "esri-imagery": {
            type: "raster",
            tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
            tileSize: 256,
            attribution: "© Esri",
          },
          "esri-labels": {
            type: "raster",
            tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"],
            tileSize: 256,
            attribution: "© Esri",
          },
        },
        layers: [
          { id: "satellite", type: "raster", source: "esri-imagery", minzoom: 0, maxzoom: 18 },
          { id: "labels", type: "raster", source: "esri-labels", minzoom: 0, maxzoom: 18 },
        ],
      },
    });

    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120 }), "bottom-left");
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => setLoaded(true));
    map.on("mousemove", handleMove);
    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      const lith = getLithologyAt(lng, lat);
      if (lith.glim === "water" || lith.glim === "Wa" || lith.glim === "Ice") return;
      const fp = polygonDoseFingerprint({ lithology: lith.glim, lat, lon: lng });
      onClick(fp, lith.region);
    });

    mapInstance.current = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, [handleMove, onClick]);

  useEffect(() => {
    if (!flyTo || !mapInstance.current) return;
    mapInstance.current.flyTo({ center: [flyTo.lon, flyTo.lat], zoom: 14, essential: true });
  }, [flyTo]);

  const arms = hoverData?.fp.arms_mSv_yr;
  const total = hoverData?.fp.total_terrestrial_mSv_yr || 0;
  const tier = hoverData?.fp.risk.tier || "GREEN";
  const color = RISK_COLORS[tier] || "#22c55e";

  return (
    <div className="map-wrapper">
      {!loaded && (
        <div className="map-loader">
          <div className="loader-spinner" />
          <span>Loading satellite imagery…</span>
        </div>
      )}
      <div ref={mapRef} className="map-canvas" />

      {/* Floating triangle */}
      {cursorPos && arms && (
        <div className="floating-triangle" style={{ left: cursorPos.x, top: cursorPos.y }}>
          <svg width="160" height="160" viewBox="-80 -80 160 160" style={{ overflow: "visible" }}>
            <path d={buildTrianglePath(arms.radon, arms.thoron, arms.gamma)}
              fill={RISK_BG[tier]} stroke="none" style={{ filter: "blur(6px)" }} />
            <path d={buildTrianglePath(arms.radon, arms.thoron, arms.gamma)}
              fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
            <line x1="0" y1="0" x2="0" y2={-arms.radon * (50 / Math.max(arms.radon, arms.thoron, arms.gamma, 0.5))}
              stroke="#3b82f6" strokeWidth={3} strokeLinecap="round" />
            <line x1="0" y1="0"
              x2={-arms.thoron * (50 / Math.max(arms.radon, arms.thoron, arms.gamma, 0.5)) * 0.87}
              y2={arms.thoron * (50 / Math.max(arms.radon, arms.thoron, arms.gamma, 0.5)) * 0.5}
              stroke="#f97316" strokeWidth={3} strokeLinecap="round" />
            <line x1="0" y1="0"
              x2={arms.gamma * (50 / Math.max(arms.radon, arms.thoron, arms.gamma, 0.5)) * 0.87}
              y2={arms.gamma * (50 / Math.max(arms.radon, arms.thoron, arms.gamma, 0.5)) * 0.5}
              stroke="#22c55e" strokeWidth={3} strokeLinecap="round" />
            <circle cx="0" cy="0" r="3" fill={color} />
            <text x="0" y={-arms.radon * (50 / Math.max(arms.radon, arms.thoron, arms.gamma, 0.5)) - 6}
              textAnchor="middle" fill="#3b82f6" fontSize="9" fontWeight="bold">Rn</text>
            <text x={-arms.thoron * (50 / Math.max(arms.radon, arms.thoron, arms.gamma, 0.5)) * 0.87 - 8}
              y={arms.thoron * (50 / Math.max(arms.radon, arms.thoron, arms.gamma, 0.5)) * 0.5 + 10}
              textAnchor="end" fill="#f97316" fontSize="9" fontWeight="bold">Tn</text>
            <text x={arms.gamma * (50 / Math.max(arms.radon, arms.thoron, arms.gamma, 0.5)) * 0.87 + 8}
              y={arms.gamma * (50 / Math.max(arms.radon, arms.thoron, arms.gamma, 0.5)) * 0.5 + 10}
              textAnchor="start" fill="#22c55e" fontSize="9" fontWeight="bold">γ</text>
          </svg>
          <div className="triangle-tooltip" style={{ borderColor: color }}>
            <div className="triangle-total" style={{ color }}>{total.toFixed(2)} mSv/yr</div>
            <div className="triangle-tier" style={{ background: color }}>{tier}</div>
          </div>
        </div>
      )}

      <div className="map-statusbar">
        <span id="status-coords">Hover the map</span>
        <span id="status-lith" style={{ marginLeft: "auto", opacity: 0.7 }} />
      </div>
    </div>
  );
}
