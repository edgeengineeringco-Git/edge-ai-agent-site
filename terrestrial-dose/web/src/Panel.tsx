/**
 * Panel.tsx — Dose report panel (right side, pinned on click)
 */

import type { DoseFingerprint } from "./dose_core";

interface PanelProps {
  data: DoseFingerprint | null;
  name: string;
  visible: boolean;
  onClose: () => void;
}

const TIER_COLORS: Record<string, { text: string }> = {
  GREEN: { text: "#22c55e" },
  AMBER: { text: "#f59e0b" },
  RED:   { text: "#ef4444" },
};

export default function Panel({ data, name, visible, onClose }: PanelProps) {
  if (!visible || !data) {
    return (
      <div className="panel-empty">
        <div className="panel-hint">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          <p>Click anywhere on the map to pin a dose report</p>
          <p className="panel-hint-sub">Hover to see the live triangle</p>
        </div>
      </div>
    );
  }

  const arms = data.arms_mSv_yr;
  const total = data.total_terrestrial_mSv_yr;
  const acts = data.activities_Bq_kg;
  const idx = data.indices;
  const risk = data.risk;
  const tier = risk.tier;
  const tc = TIER_COLORS[tier] || TIER_COLORS.GREEN;

  const maxArm = Math.max(arms.radon, arms.thoron, arms.gamma);
  const entries = [
    { label: "Radon", value: arms.radon, color: "#3b82f6", pct: maxArm > 0 ? (arms.radon / maxArm) * 100 : 0 },
    { label: "Thoron", value: arms.thoron, color: "#f97316", pct: maxArm > 0 ? (arms.thoron / maxArm) * 100 : 0 },
    { label: "Gamma", value: arms.gamma, color: "#22c55e", pct: maxArm > 0 ? (arms.gamma / maxArm) * 100 : 0 },
  ].sort((a, b) => b.value - a.value);

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">{name}</h2>
          <span className="panel-subtitle">Terrestrial Dose Estimate</span>
        </div>
        <button className="panel-close" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="risk-badge" style={{ borderColor: tc.text + "40", background: tc.text + "10" }}>
        <span className="risk-tier" style={{ background: tc.text }}>{tier}</span>
        <span className="risk-total" style={{ color: tc.text }}>{total.toFixed(2)} mSv/yr</span>
        <span className="risk-vs">
          {total > 2.2 ? `${(total / 2.2).toFixed(1)}× UNSCEAR avg` : "≤ UNSCEAR avg"}
        </span>
      </div>

      <div className="dose-bars">
        {entries.map((e) => (
          <div key={e.label} className="dose-bar-row">
            <span className="dose-bar-label">{e.label}</span>
            <div className="dose-bar-track">
              <div className="dose-bar-fill" style={{ width: `${e.pct}%`, background: e.color }} />
            </div>
            <span className="dose-bar-value" style={{ color: e.color }}>{e.value.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="panel-section">
        <h3 className="panel-section-title">Why this dose?</h3>
        <div className="why-list">
          {risk.reasons.map((reason, i) => (
            <div key={i} className="why-item">
              <span className="why-bullet" style={{ background: tc.text }} />
              <span>{reason}</span>
            </div>
          ))}
          <div className="why-item">
            <span className="why-bullet" style={{ background: "#5ad1c5" }} />
            <span>
              Geology: {data.lithology_label}. Activities: Ra-226={acts.A_Ra226.toFixed(0)}, Th-232={acts.A_Th232.toFixed(0)}, K-40={acts.A_K40.toFixed(0)} Bq/kg.
            </span>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <h3 className="panel-section-title">Comparison</h3>
        <CompBar label="This location" value={total} max={8} color={tc.text} />
        <CompBar label="UNSCEAR avg" value={2.2} max={8} color="#64748b" />
        <CompBar label="EU BSS limit" value={6.6} max={8} color="#64748b" />
      </div>

      <div className="panel-section">
        <h3 className="panel-section-title">Indices</h3>
        <div className="index-grid">
          <IndexRow label="Indoor Rn" value={idx.indoor_Rn} unit="Bq/m³" warn={idx.indoor_Rn > 300} />
          <IndexRow label="Ra-eq" value={idx.raeq} unit="Bq/kg" warn={idx.raeq > 740} />
          <IndexRow label="Iγ" value={idx.I_gamma} unit="" warn={idx.I_gamma > 1.0} />
          <IndexRow label="Gamma rate" value={data.gamma_rate_nGy_h} unit="nGy/h" warn={data.gamma_rate_nGy_h > 1000} />
        </div>
      </div>

      <div className="panel-section">
        <h3 className="panel-section-title">Confidence</h3>
        <ConfMeter score={data.confidence} />
        <p className="confidence-note">
          {data.confidence >= 60
            ? "Direct measurement data available."
            : data.confidence >= 30
            ? "Partial data — some measured, some estimated."
            : "Geology-prior estimate only."}
        </p>
      </div>

      <div className="panel-section panel-standards">
        <div className="std-row"><span className="std-dot green" /><span>Green: ≤ 2.2 mSv/yr</span></div>
        <div className="std-row"><span className="std-dot amber" /><span>Amber: 2.2–6.6 mSv/yr</span></div>
        <div className="std-row"><span className="std-dot red" /><span>Red: &gt; 6.6 mSv/yr</span></div>
      </div>
    </div>
  );
}

function CompBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="comp-bar">
      <span className="comp-label">{label}</span>
      <div className="comp-track"><div className="comp-fill" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} /></div>
      <span className="comp-value">{value.toFixed(2)}</span>
    </div>
  );
}

function IndexRow({ label, value, unit, warn }: { label: string; value: number; unit: string; warn: boolean }) {
  return (
    <div className={`index-row ${warn ? "warning" : ""}`}>
      <span className="index-label">{label}</span>
      <span className={`index-value ${warn ? "warning-text" : ""}`}>{value.toFixed(value < 10 ? 2 : 0)} {unit}</span>
    </div>
  );
}

function ConfMeter({ score }: { score: number }) {
  const color = score >= 60 ? "#22c55e" : score >= 30 ? "#f59e0b" : "#ef4444";
  return (
    <div className="confidence-meter">
      <div className="confidence-track"><div className="confidence-fill" style={{ width: `${score}%`, background: color }} /></div>
      <div className="confidence-labels">
        <span>Low</span>
        <span className="confidence-score" style={{ color }}>{score}%</span>
        <span>High</span>
      </div>
    </div>
  );
}
