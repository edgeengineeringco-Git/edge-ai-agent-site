/**
 * Panel.tsx — dose breakdown + provenance panel
 * Shows: risk tier badge, triangle, activities, indices, provenance, confidence.
 */

import type { DoseFingerprint } from "./dose_core";
import Triangle from "./Triangle";

interface PanelProps {
  data: DoseFingerprint | null;
  locationName: string | null;
}

const RISK_COLORS: Record<string, string> = {
  GREEN: "#22c55e",
  AMBER: "#f59e0b",
  RED: "#ef4444",
};

function TableRow({ label, value, unit, threshold }: { label: string; value: string; unit: string; threshold?: string }) {
  return (
    <div className="panel-row">
      <span className="panel-row-label">{label}</span>
      <span className="panel-row-value">
        {value}
        <span className="panel-row-unit"> {unit}</span>
      </span>
      {threshold && <span className="panel-row-threshold">{threshold}</span>}
    </div>
  );
}

export default function Panel({ data, locationName }: PanelProps) {
  if (!data) {
    return (
      <div className="panel-empty">
        <div className="panel-empty-inner">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5">
            <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" />
            <path d="M2 7l10 5 10-5" />
            <path d="M12 22V12" />
          </svg>
          <h3>No location selected</h3>
          <p>Click anywhere on the map to compute the terrestrial dose fingerprint for that location.</p>
        </div>
      </div>
    );
  }

  const riskColor = RISK_COLORS[data.risk.tier] || "#64748b";
  const tier = data.risk.tier;

  return (
    <div className="panel">
      {/* Location header */}
      <div className="panel-header">
        <div className="panel-location">
          {locationName || "Unknown location"}
        </div>
        <div className="panel-coords">
          {data.lat?.toFixed(3)}°, {data.lon?.toFixed(3)}°
        </div>
      </div>

      {/* Risk badge */}
      <div className="risk-badge" style={{ background: `linear-gradient(135deg, ${riskColor}22, ${riskColor}08)`, borderColor: `${riskColor}44` }}>
        <div className="risk-badge-dot" style={{ background: riskColor }} />
        <div className="risk-badge-text">
          <span className="risk-tier" style={{ color: riskColor }}>{tier}</span>
          <span className="risk-detail">
            {data.total_terrestrial_mSv_yr.toFixed(2)} mSv/yr total
          </span>
        </div>
      </div>

      {/* Triangle */}
      <div className="panel-triangle">
        <Triangle data={data} size={260} />
      </div>

      {/* Arms breakdown */}
      <div className="panel-section">
        <div className="panel-section-title">DOSE BREAKDOWN</div>
        <div className="panel-arms">
          <div className="arm-row">
            <span className="arm-dot" style={{ background: "#3b82f6" }} />
            <span className="arm-label">Radon (Rn-222)</span>
            <span className="arm-value">{data.arms_mSv_yr.radon.toFixed(3)}</span>
            <span className="arm-unit">mSv/yr</span>
          </div>
          <div className="arm-row">
            <span className="arm-dot" style={{ background: "#f97316" }} />
            <span className="arm-label">Thoron (Rn-220)</span>
            <span className="arm-value">{data.arms_mSv_yr.thoron.toFixed(3)}</span>
            <span className="arm-unit">mSv/yr</span>
          </div>
          <div className="arm-row">
            <span className="arm-dot" style={{ background: "#22c55e" }} />
            <span className="arm-label">Gamma (K/U/Th)</span>
            <span className="arm-value">{data.arms_mSv_yr.gamma.toFixed(3)}</span>
            <span className="arm-unit">mSv/yr</span>
          </div>
          <div className="arm-row arm-total">
            <span className="arm-label">Total</span>
            <span className="arm-value">{data.total_terrestrial_mSv_yr.toFixed(3)}</span>
            <span className="arm-unit">mSv/yr</span>
          </div>
        </div>
      </div>

      {/* Activities */}
      <div className="panel-section">
        <div className="panel-section-title">ACTIVITIES (Bq/kg)</div>
        <div className="panel-activities">
          <div className="act-cell">
            <div className="act-value">{data.activities_Bq_kg.A_Ra226.toFixed(0)}</div>
            <div className="act-label">Ra-226</div>
          </div>
          <div className="act-cell">
            <div className="act-value">{data.activities_Bq_kg.A_Th232.toFixed(0)}</div>
            <div className="act-label">Th-232</div>
          </div>
          <div className="act-cell">
            <div className="act-value">{data.activities_Bq_kg.A_K40.toFixed(0)}</div>
            <div className="act-label">K-40</div>
          </div>
        </div>
      </div>

      {/* Indices */}
      <div className="panel-section">
        <div className="panel-section-title">INDICES</div>
        <div className="panel-indices">
          <TableRow label="Gamma dose rate" value={data.gamma_rate_nGy_h.toFixed(1)} unit="nGy/h" threshold="≤59 avg" />
          <TableRow label="Indoor radon" value={data.indices.indoor_Rn.toFixed(1)} unit="Bq/m³" threshold="≤100 WHO" />
          <TableRow label="Indoor thoron" value={data.indices.indoor_Tn.toFixed(2)} unit="Bq/m³" />
          <TableRow label="Radium equivalent" value={data.indices.raeq.toFixed(0)} unit="Bq/kg" threshold="≤370 safe" />
          <TableRow label="Activity index Iγ" value={data.indices.I_gamma.toFixed(3)} unit="" threshold="≤1.0 safe" />
          <TableRow label="ELCR (70 yr)" value={(data.indices.ELCR * 1000).toFixed(3)} unit="×10⁻³" />
        </div>
      </div>

      {/* Provenance */}
      <div className="panel-section">
        <div className="panel-section-title">
          PROVENANCE
          <span className="panel-confidence">
            Confidence: <span style={{ color: data.confidence >= 50 ? "#22c55e" : data.confidence >= 25 ? "#f59e0b" : "#64748b" }}>{data.confidence}%</span>
          </span>
        </div>
        <div className="panel-provenance-list">
          {data.provenance.map((p, i) => (
            <div key={i} className="provenance-item">
              {p.includes("measured") ? (
                <span className="prov-tag measured">MEASURED</span>
              ) : p.includes("geogenic") ? (
                <span className="prov-tag geogenic">GEOGENIC</span>
              ) : (
                <span className="prov-tag prior">PRIOR</span>
              )}
              <span className="prov-text">{p}</span>
            </div>
          ))}
        </div>
        <div className="panel-resolution">
          Resolution: GLiM ~1.5 km; refined by SoilGrids 250m / DEM 30m. Confidence: geology-prior estimate.
        </div>
      </div>
    </div>
  );
}
