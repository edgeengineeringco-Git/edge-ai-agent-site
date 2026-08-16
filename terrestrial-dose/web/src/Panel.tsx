/**
 * Panel.tsx — Full dose analysis card with VisQuill-style design
 * Shows: risk badge, triangle, dose breakdown, "Why this dose?", comparison,
 *        activities, indices, confidence, recommendations, provenance.
 */

import type { DoseFingerprint } from "./dose_core";
import { RISK } from "./dose_core";
import Triangle from "./Triangle";
import { analyze, generateRecommendations } from "./analysis";

interface PanelProps {
  data: DoseFingerprint | null;
  locationName: string | null;
  isHover?: boolean; // true = live hover preview, false = locked click result
}

const RISK_COLORS: Record<string, string> = {
  GREEN: "#22c55e",
  AMBER: "#f59e0b",
  RED: "#ef4444",
};

export default function Panel({ data, locationName, isHover = false }: PanelProps) {
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
          <p>Hover over the map to preview, or click to lock a full analysis.</p>
        </div>
      </div>
    );
  }

  const tier = data.risk.tier;
  const riskColor = RISK_COLORS[tier] || "#64748b";
  const total = data.total_terrestrial_mSv_yr;
  const analysis = analyze(data, data.lon, data.lat);
  const recs = generateRecommendations(data);

  return (
    <div className={`panel ${isHover ? "panel-hover" : "panel-locked"}`}>
      {/* Hover indicator */}
      {isHover && (
        <div className="hover-indicator">
          <span className="hover-dot" /> Live preview — click to lock
        </div>
      )}

      {/* Location header */}
      <div className="panel-header">
        <div className="panel-location">{locationName || "Unknown location"}</div>
        <div className="panel-coords">
          {data.lat?.toFixed(4)}°, {data.lon?.toFixed(4)}°
        </div>
      </div>

      {/* Risk badge */}
      <div className="risk-badge" style={{
        background: `linear-gradient(135deg, ${riskColor}22, ${riskColor}08)`,
        borderColor: `${riskColor}44`,
      }}>
        <div className="risk-badge-dot" style={{ background: riskColor }} />
        <div className="risk-badge-text">
          <span className="risk-tier" style={{ color: riskColor }}>{tier}</span>
          <span className="risk-detail">
            {total.toFixed(2)} mSv/yr total · {data.gamma_rate_nGy_h.toFixed(0)} nGy/h gamma
          </span>
        </div>
        <div className="risk-badge-vs">
          <span className="vs-label">vs UNSCEAR avg</span>
          <span className="vs-value" style={{ color: total > RISK.dose.green ? riskColor : "#22c55e" }}>
            {total > RISK.dose.green ? "+" : ""}{((total / RISK.dose.green - 1) * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Triangle */}
      <div className="panel-triangle">
        <Triangle data={data} size={isHover ? 200 : 240} />
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          WHY THIS DOSE?
        </div>
        <div className="ai-explanation">
          {analysis.why.map((sentence, i) => (
            <p key={i} className="ai-sentence">{sentence}</p>
          ))}
        </div>
        <div className="ai-meta">
          <span className="ai-meta-item">
            <span className="ai-meta-label">Dominant:</span>
            <span className="ai-meta-value" style={{ color: analysis.dominant === "radon" ? "#3b82f6" : analysis.dominant === "thoron" ? "#f97316" : "#22c55e" }}>
              {analysis.dominant} ({analysis.sharePct}%)
            </span>
          </span>
          <span className="ai-meta-item">
            <span className="ai-meta-label">Status:</span>
            <span className="ai-meta-value">{analysis.expectedOrAnomaly}</span>
          </span>
          <span className="ai-meta-item">
            <span className="ai-meta-label">vs World avg:</span>
            <span className="ai-meta-value">{analysis.vsWorldAvg}×</span>
          </span>
        </div>
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
            value={RISK.dose.green}
            unit="mSv/yr"
            max={Math.max(10, total * 1.3)}
            color="#64748b"
          />
          <ComparisonBar
            label="EU BSS reference"
            value={6.6}
            unit="mSv/yr"
            max={Math.max(10, total * 1.3)}
            color="#475569"
            threshold={RISK.dose.green}
            thresholdLabel="Global avg"
          />
          <ComparisonBar
            label="Building material"
            value={1.0}
            unit="mSv/yr"
            max={Math.max(10, total * 1.3)}
            color="#334155"
          />
        </div>
        <div className="comparison-chart-labels">
          <div className="comparison-row compact">
            <span className="comparison-label">vs global avg</span>
            <span className="comparison-delta" style={{ color: total > RISK.dose.green ? riskColor : "#22c55e" }}>
              {total > RISK.dose.green ? "+" : ""}{((total / RISK.dose.green - 1) * 100).toFixed(0)}%
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
          <IndexRow label="Gamma dose rate" value={data.gamma_rate_nGy_h.toFixed(1)} unit="nGy/h" threshold={`≤${RISK.gamma.green} avg`} />
          <IndexRow label="Indoor radon" value={data.indices.indoor_Rn.toFixed(1)} unit="Bq/m³" threshold={`≤${RISK.rn.green} WHO`} />
          <IndexRow label="Indoor thoron" value={data.indices.indoor_Tn.toFixed(2)} unit="Bq/m³" />
          <IndexRow label="Radium equivalent" value={data.indices.raeq.toFixed(0)} unit="Bq/kg" threshold="≤370 safe" />
          <IndexRow label="Activity index Iγ" value={data.indices.I_gamma.toFixed(3)} threshold="≤1.0 safe" />
          <IndexRow label="ELCR (70 yr)" value={(data.indices.ELCR * 1000).toFixed(3)} unit="×10⁻³" />
        </div>
      </div>

      {/* Confidence */}
      <div className="panel-section">
        <div className="panel-section-title">
          CONFIDENCE
          <span className="panel-confidence-pct">{data.confidence}%</span>
        </div>
        <ConfidenceMeter confidence={data.confidence} />
        <div className="panel-resolution">{analysis.resolutionNote}</div>
      </div>

      {/* Recommendations */}
      {recs.length > 0 && (
        <div className="panel-section rec-section">
          <div className="panel-section-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }}>
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            RECOMMENDATIONS
          </div>
          <div className="rec-list">
            {recs.map((rec, i) => (
              <div key={i} className="rec-item">
                <span className={`rec-priority ${rec.priority}`}>{rec.priority}</span>
                <span className="rec-text">{rec.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Standards reference */}
      <div className="panel-section panel-standards">
        <div className="panel-section-title">STANDARDS</div>
        <div className="standards-list">
          <span className="standard-tag">UNSCEAR 2024</span>
          <span className="standard-tag">ICRP 137</span>
          <span className="standard-tag">EU BSS 2013/59</span>
          <span className="standard-tag">WHO 100 Bq/m³</span>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function ComparisonBar({ label, value, unit, max, color, threshold, thresholdLabel }: {
  label: string; value: number; unit: string; max: number; color: string;
  threshold?: number; thresholdLabel?: string;
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
      <div className="comparison-value">
        {value.toFixed(2)} <span className="comparison-unit">{unit}</span>
      </div>
    </div>
  );
}

function IndexRow({ label, value, unit, threshold }: {
  label: string; value: string; unit?: string; threshold?: string;
}) {
  return (
    <div className="panel-row">
      <span className="panel-row-label">{label}</span>
      <span className="panel-row-value">
        {value} {unit && <span className="panel-row-unit">{unit}</span>}
      </span>
      {threshold && <span className="panel-row-threshold">{threshold}</span>}
    </div>
  );
}

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
