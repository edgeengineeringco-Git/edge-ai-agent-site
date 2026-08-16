/**
 * Panel.tsx — Full dose analysis card
 * Shows: risk badge, triangle, dose breakdown, activities, indices,
 *        "Why this dose?" AI explanation, comparison bar charts,
 *        confidence meter, provenance, recommendations.
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

// ── "Why this dose?" AI explanation generator ──
function generateWhyThisDose(data: DoseFingerprint): string {
  const arms = data.arms_mSv_yr;
  const total = data.total_terrestrial_mSv_yr;
  const lithLabel = data.lithology_label;
  const tier = data.risk.tier;

  // Determine dominant arm
  const entries = [
    { name: "radon", value: arms.radon, color: "blue" },
    { name: "thoron", value: arms.thoron, color: "orange" },
    { name: "gamma", value: arms.gamma, color: "green" },
  ];
  const dominant = entries.reduce((a, b) => a.value > b.value ? a : b);
  const domPct = total > 0 ? (dominant.value / total * 100).toFixed(0) : "0";

  let explanation = "";

  // Dominant source
  if (dominant.name === "gamma") {
    explanation = `The gamma dose (${arms.gamma.toFixed(2)} mSv/yr, ${domPct}% of total) dominates at this location, driven by the natural radioactivity of the underlying ${lithLabel.toLowerCase()}. `;
    if (data.activities_Bq_kg.A_K40 > 800) {
      explanation += `The high potassium-40 activity (${data.activities_Bq_kg.A_K40.toFixed(0)} Bq/kg) indicates K-feldspar-rich mineralogy typical of felsic igneous rocks. `;
    }
    if (data.activities_Bq_kg.A_Ra226 > 50) {
      explanation += `Elevated Ra-226 (${data.activities_Bq_kg.A_Ra226.toFixed(0)} Bq/kg) further boosts the gamma field. `;
    }
  } else if (dominant.name === "radon") {
    explanation = `Radon-222 inhalation (${arms.radon.toFixed(2)} mSv/yr, ${domPct}% of total) is the primary dose pathway here, reflecting the ${lithLabel.toLowerCase()} substrate with its Ra-226 activity of ${data.activities_Bq_kg.A_Ra226.toFixed(0)} Bq/kg. `;
    if (data.indices.indoor_Rn > 100) {
      explanation += `The estimated indoor radon concentration (${data.indices.indoor_Rn.toFixed(0)} Bq/m³) exceeds the WHO reference level of 100 Bq/m³, suggesting favourable radon transport conditions in the local geology — possibly enhanced by fracture permeability or high soil gas transport. `;
    } else {
      explanation += `The estimated indoor radon (${data.indices.indoor_Rn.toFixed(0)} Bq/m³) remains below the WHO 100 Bq/m³ reference level, consistent with the lithology's radon emanation characteristics. `;
    }
  } else {
    explanation = `Thoron-220 inhalation (${arms.thoron.toFixed(2)} mSv/yr, ${domPct}% of total) is the dominant pathway at this location, which is noteworthy. `;
    if (data.activities_Bq_kg.A_Th232 > 50) {
      explanation += `The high Th-232 activity (${data.activities_Bq_kg.A_Th232.toFixed(0)} Bq/kg) triggers non-linear thoron enhancement — this behaviour is characteristic of monazite-bearing sands and REE-enriched soils where emanation coefficients are elevated. `;
    } else {
      explanation += `The Th-232 activity (${data.activities_Bq_kg.A_Th232.toFixed(0)} Bq/kg) drives the thoron dose through geogenic emanation and indoor inhalation. `;
    }
  }

  // Anomaly flagging
  if (total > 5) {
    explanation += `The total dose of ${total.toFixed(2)} mSv/yr is significantly above the UNSCEAR global average of 2.2 mSv/yr — this location is flagged as ${tier}. `;
  } else if (total > 2.2) {
    explanation += `The total dose (${total.toFixed(2)} mSv/yr) is above the UNSCEAR global average (2.2 mSv/yr) but within the ${tier} tier. `;
  } else {
    explanation += `The total dose (${total.toFixed(2)} mSv/yr) is at or below the UNSCEAR global average (2.2 mSv/yr), classified as ${tier}. `;
  }

  // Confidence note
  if (data.confidence < 30) {
    explanation += `This estimate is based on geology-prior modelling (GLiM lithology) with no direct measurements at this exact location. Ground-truth survey data would improve confidence.`;
  }

  return explanation;
}

// ── Comparison bar chart ──
function ComparisonBar({ label, value, unit, max, color, threshold, thresholdLabel }: {
  label: string;
  value: number;
  unit: string;
  max: number;
  color: string;
  threshold?: number;
  thresholdLabel?: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const thrPct = threshold ? Math.min(100, (threshold / max) * 100) : null;

  return (
    <div className="comparison-row">
      <div className="comparison-label">{label}</div>
      <div className="comparison-bar-container">
        <div className="comparison-bar" style={{ width: `${pct}%`, background: color }} />
        {thrPct !== null && (
          <div className="comparison-threshold" style={{ left: `${thrPct}%` }} title={thresholdLabel} />
        )}
      </div>
      <div className="comparison-value">{value.toFixed(2)} <span className="comparison-unit">{unit}</span></div>
    </div>
  );
}

// ── Confidence meter ──
function ConfidenceMeter({ confidence }: { confidence: number }) {
  const segments = 5;
  const filled = Math.ceil((confidence / 100) * segments);
  const color = confidence >= 60 ? "#22c55e" : confidence >= 30 ? "#f59e0b" : "#64748b";

  return (
    <div className="confidence-meter">
      <div className="confidence-bars">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`confidence-bar ${i < filled ? "filled" : ""}`}
            style={{ background: i < filled ? color : "rgba(255,255,255,0.08)" }}
          />
        ))}
      </div>
      <div className="confidence-text" style={{ color }}>
        {confidence >= 60 ? "Measurement-backed" : confidence >= 30 ? "Partial data" : "Geology prior estimate"}
      </div>
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
  const total = data.total_terrestrial_mSv_yr;

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
            {total.toFixed(2)} mSv/yr total · {data.gamma_rate_nGy_h.toFixed(0)} nGy/h gamma
          </span>
        </div>
      </div>

      {/* Triangle */}
      <div className="panel-triangle">
        <Triangle data={data} size={240} />
      </div>

      {/* Dose breakdown */}
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
            <span className="arm-label">Total Terrestrial</span>
            <span className="arm-value">{total.toFixed(3)}</span>
            <span className="arm-unit">mSv/yr</span>
          </div>
        </div>
      </div>

      {/* ── WHY THIS DOSE? ── */}
      <div className="panel-section ai-section">
        <div className="panel-section-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }}>
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
            <path d="M8 12a4 4 0 1 1 8 0" />
            <path d="M12 6v0" />
          </svg>
          WHY THIS DOSE?
        </div>
        <p className="ai-explanation">{generateWhyThisDose(data)}</p>
      </div>

      {/* ── COMPARISON ── */}
      <div className="panel-section">
        <div className="panel-section-title">COMPARISON</div>
        <div className="comparison-chart">
          <ComparisonBar
            label="This location"
            value={total}
            unit="mSv/yr"
            max={Math.max(10, total * 1.3)}
            color={riskColor}
          />
          <ComparisonBar
            label="UNSCEAR global avg"
            value={2.2}
            unit="mSv/yr"
            max={Math.max(10, total * 1.3)}
            color="#64748b"
          />
          <ComparisonBar
            label="EU BSS dose limit"
            value={6.6}
            unit="mSv/yr"
            max={Math.max(10, total * 1.3)}
            color="#475569"
            threshold={2.2}
            thresholdLabel="Global avg"
          />
        </div>
        <div className="comparison-chart-labels">
          <div className="comparison-row compact">
            <span className="comparison-label">vs global avg</span>
            <span className="comparison-delta" style={{ color: total > 2.2 ? riskColor : "#22c55e" }}>
              {total > 2.2 ? "+" : ""}{((total / 2.2 - 1) * 100).toFixed(0)}%
            </span>
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
          <div className="panel-row">
            <span className="panel-row-label">Gamma dose rate</span>
            <span className="panel-row-value">{data.gamma_rate_nGy_h.toFixed(1)} <span className="panel-row-unit">nGy/h</span></span>
            <span className="panel-row-threshold">≤59 avg</span>
          </div>
          <div className="panel-row">
            <span className="panel-row-label">Indoor radon</span>
            <span className="panel-row-value">{data.indices.indoor_Rn.toFixed(1)} <span className="panel-row-unit">Bq/m³</span></span>
            <span className="panel-row-threshold">≤100 WHO</span>
          </div>
          <div className="panel-row">
            <span className="panel-row-label">Indoor thoron</span>
            <span className="panel-row-value">{data.indices.indoor_Tn.toFixed(2)} <span className="panel-row-unit">Bq/m³</span></span>
          </div>
          <div className="panel-row">
            <span className="panel-row-label">Radium equivalent</span>
            <span className="panel-row-value">{data.indices.raeq.toFixed(0)} <span className="panel-row-unit">Bq/kg</span></span>
            <span className="panel-row-threshold">≤370 safe</span>
          </div>
          <div className="panel-row">
            <span className="panel-row-label">Activity index Iγ</span>
            <span className="panel-row-value">{data.indices.I_gamma.toFixed(3)}</span>
            <span className="panel-row-threshold">≤1.0 safe</span>
          </div>
          <div className="panel-row">
            <span className="panel-row-label">ELCR (70 yr)</span>
            <span className="panel-row-value">{(data.indices.ELCR * 1000).toFixed(3)} <span className="panel-row-unit">×10⁻³</span></span>
          </div>
        </div>
      </div>

      {/* Confidence meter */}
      <div className="panel-section">
        <div className="panel-section-title">
          CONFIDENCE
          <span className="panel-confidence-pct">{data.confidence}%</span>
        </div>
        <ConfidenceMeter confidence={data.confidence} />
        <div className="panel-resolution">
          {data.confidence < 30
            ? "Geology-prior estimate from GLiM lithology (~1.5 km). No direct measurements at this location."
            : data.confidence < 60
            ? "Partial measurement data. Some parameters measured, others estimated from geology prior."
            : "Measurement-backed estimate with direct radiometric data."}
        </div>
      </div>

      {/* ── RECOMMENDATIONS ── */}
      <div className="panel-section rec-section">
        <div className="panel-section-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }}>
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          RECOMMENDATIONS
        </div>
        <div className="rec-list">
          {data.confidence < 30 && (
            <div className="rec-item">
              <span className="rec-priority">HIGH</span>
              <span className="rec-text">Conduct airborne gamma-ray spectrometry survey (eU, eTh, K%) to replace geology-prior estimates with measured activities.</span>
            </div>
          )}
          {data.indices.indoor_Rn > 100 && (
            <div className="rec-item">
              <span className="rec-priority">HIGH</span>
              <span className="rec-text">Deploy indoor radon detectors (CR-39 track-etch or electret) in local dwellings to validate the geogenic estimate of {data.indices.indoor_Rn.toFixed(0)} Bq/m³.</span>
            </div>
          )}
          {tier === "RED" && (
            <div className="rec-item">
              <span className="rec-priority">URGENT</span>
              <span className="rec-text">Radon mitigation systems (sub-slab depressurisation) recommended if indoor Rn exceeds 300 Bq/m³. Building code consultation advised.</span>
            </div>
          )}
          {data.activities_Bq_kg.A_Th232 > 100 && (
            <div className="rec-item">
              <span className="rec-priority">MEDIUM</span>
              <span className="rec-text">Thoron measurement with grab-sampling and EEC analysis. Consider CeBr3 drone spectrometry for spatial mapping of Th-232 distribution.</span>
            </div>
          )}
          {data.confidence < 60 && (
            <div className="rec-item">
              <span className="rec-priority">MEDIUM</span>
              <span className="rec-text">Integrate SoilGrids permeability data and Copernicus DEM lineament density to refine the geogenic radon potential model.</span>
            </div>
          )}
          {data.indices.raeq > 370 && (
            <div className="rec-item">
              <span className="rec-priority">MEDIUM</span>
              <span className="rec-text">Test building materials for compliance with EU BSS activity index (Iγ = {data.indices.I_gamma.toFixed(2)}). Source alternative aggregates if Iγ &gt; 1.0.</span>
            </div>
          )}
          {tier === "GREEN" && data.confidence >= 60 && (
            <div className="rec-item">
              <span className="rec-priority">LOW</span>
              <span className="rec-text">No immediate action required. Periodic monitoring every 5 years is sufficient for public-health surveillance.</span>
            </div>
          )}
          {tier === "AMBER" && data.confidence >= 30 && (
            <div className="rec-item">
              <span className="rec-priority">LOW</span>
              <span className="rec-text">Consider long-term radon monitoring during winter months. Inform local building authority of elevated background levels.</span>
            </div>
          )}
        </div>
      </div>

      {/* Provenance */}
      <div className="panel-section">
        <div className="panel-section-title">PROVENANCE</div>
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
      </div>
    </div>
  );
}
