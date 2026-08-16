/**
 * Analysis Text Generator — templated "Why this dose?" explanation
 * ================================================================
 * Generates human-readable analysis text from computed dose fingerprint fields.
 * NO free-form invented geology — all text is templated from computed values.
 */

import type { DoseFingerprint } from "./dose_core";
import { getLithologyAt } from "./lithology";
import { RISK } from "./dose_core";

export interface AnalysisResult {
  dominant: "radon" | "thoron" | "gamma";
  sharePct: number;
  why: string[];
  expectedOrAnomaly: "expected" | "elevated" | "anomaly";
  vsWorldAvg: number;
  resolutionNote: string;
}

/**
 * Generate the full analysis from a dose fingerprint.
 */
export function analyze(data: DoseFingerprint, lon?: number, lat?: number): AnalysisResult {
  const arms = data.arms_mSv_yr;
  const total = data.total_terrestrial_mSv_yr;
  const lithLabel = data.lithology_label;
  const acts = data.activities_Bq_kg;
  const idx = data.indices;
  const risk = data.risk;

  // ── Dominant arm ──
  const entries = [
    { name: "radon" as const, value: arms.radon },
    { name: "thoron" as const, value: arms.thoron },
    { name: "gamma" as const, value: arms.gamma },
  ];
  const dominant = entries.reduce((a, b) => a.value > b.value ? a : b);
  const sharePct = total > 0 ? Math.round((dominant.value / total) * 100) : 0;

  const why: string[] = [];

  // ── Dominant source sentence ──
  if (dominant.name === "gamma") {
    why.push(
      `The gamma dose (${arms.gamma.toFixed(2)} mSv/yr, ${sharePct}% of total) dominates, driven by natural radioactivity in the ${lithLabel.toLowerCase()} substrate.`
    );
    if (acts.A_K40 > 800) {
      why.push(`High K-40 (${acts.A_K40.toFixed(0)} Bq/kg) indicates K-feldspar-rich mineralogy typical of felsic igneous rocks.`);
    }
    if (acts.A_Ra226 > 50) {
      why.push(`Elevated Ra-226 (${acts.A_Ra226.toFixed(0)} Bq/kg) further contributes to the gamma dose field.`);
    }
  } else if (dominant.name === "radon") {
    why.push(
      `Radon-222 inhalation (${arms.radon.toFixed(2)} mSv/yr, ${sharePct}% of total) is the primary dose pathway, reflecting the ${lithLabel.toLowerCase()} substrate with Ra-226 activity of ${acts.A_Ra226.toFixed(0)} Bq/kg.`
    );
    if (idx.indoor_Rn > RISK.rn.amber) {
      why.push(`Estimated indoor radon (${idx.indoor_Rn.toFixed(0)} Bq/m³) exceeds the EU BSS action level of ${RISK.rn.amber} Bq/m³ — enhanced radon transport through local geology.`);
    } else if (idx.indoor_Rn > RISK.rn.green) {
      why.push(`Indoor radon (${idx.indoor_Rn.toFixed(0)} Bq/m³) exceeds the WHO ${RISK.rn.green} Bq/m³ reference level — monitoring recommended.`);
    } else {
      why.push(`Indoor radon (${idx.indoor_Rn.toFixed(0)} Bq/m³) remains below the WHO ${RISK.rn.green} Bq/m³ reference level.`);
    }
  } else {
    why.push(
      `Thoron-220 inhalation (${arms.thoron.toFixed(2)} mSv/yr, ${sharePct}% of total) is the dominant pathway.`
    );
    if (acts.A_Th232 > 50) {
      why.push(`High Th-232 activity (${acts.A_Th232.toFixed(0)} Bq/kg) triggers non-linear thoron enhancement — characteristic of monazite-bearing and REE-enriched soils.`);
    } else {
      why.push(`Th-232 activity (${acts.A_Th232.toFixed(0)} Bq/kg) drives thoron dose through geogenic emanation.`);
    }
  }

  // ── Lithology context ──
  why.push(
    `Geology: ${lithLabel}. Activity concentrations: Ra-226 = ${acts.A_Ra226.toFixed(0)}, Th-232 = ${acts.A_Th232.toFixed(0)}, K-40 = ${acts.A_K40.toFixed(0)} Bq/kg.`
  );

  // ── Region info (if available) ──
  if (lon != null && lat != null) {
    const region = getLithologyAt(lon, lat);
    if (region && region.region) {
      why.push(`Location: ${region.region} (GLiM: ${region.glim}, scale: 1:${region.map_scale}, cell: ${region.cell_m}m).`);
    }
  }

  // ── Anomaly assessment ──
  if (total > 5) {
    why.push(`Total dose (${total.toFixed(2)} mSv/yr) is significantly above the UNSCEAR global average of ${RISK.dose.green} mSv/yr — flagged as ${risk.tier}.`);
  } else if (total > RISK.dose.green) {
    why.push(`Total dose (${total.toFixed(2)} mSv/yr) is above the UNSCEAR global average (${RISK.dose.green} mSv/yr) — classified as ${risk.tier}.`);
  } else {
    why.push(`Total dose (${total.toFixed(2)} mSv/yr) is at or below the UNSCEAR global average (${RISK.dose.green} mSv/yr) — classified as ${risk.tier}.`);
  }

  // ── Confidence ──
  if (data.confidence < 30) {
    why.push(`This estimate is based on geology-prior modelling (GLiM ~1.5 km resolution). No direct measurements at this exact location. Ground-truth survey data would significantly improve confidence.`);
  } else if (data.confidence < 60) {
    why.push(`Partial measurement data available. Some parameters measured, others estimated from geology prior.`);
  }

  // ── Expected vs anomaly ──
  let expectedOrAnomaly: "expected" | "elevated" | "anomaly" = "expected";
  if (total > 5) expectedOrAnomaly = "anomaly";
  else if (total > RISK.dose.green) expectedOrAnomaly = "elevated";

  // ── Resolution note ──
  const resolutionNote = data.confidence >= 60
    ? "Direct measurement data available for this location."
    : data.confidence >= 30
    ? "Partial data — some measured, some estimated from geology prior."
    : "Limited by GLiM lithology resolution (~1.5 km). No direct measurements at this location.";

  return {
    dominant: dominant.name,
    sharePct,
    why,
    expectedOrAnomaly,
    vsWorldAvg: +(total / RISK.dose.green).toFixed(2),
    resolutionNote,
  };
}

/**
 * Generate recommendations from the analysis.
 */
export interface Recommendation {
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  text: string;
}

export function generateRecommendations(data: DoseFingerprint): Recommendation[] {
  const recs: Recommendation[] = [];
  const total = data.total_terrestrial_mSv_yr;
  const tier = data.risk.tier;

  if (tier === "RED") {
    recs.push({
      priority: "URGENT",
      text: `Radon mitigation systems (sub-slab depressurisation) recommended if indoor Rn exceeds ${RISK.rn.amber} Bq/m³. Building code consultation advised.`,
    });
  }

  if (data.confidence < 30) {
    recs.push({
      priority: "HIGH",
      text: "Conduct airborne gamma-ray spectrometry survey (eU, eTh, K%) to replace geology-prior estimates with measured radiometric data.",
    });
  }

  if (data.indices.indoor_Rn > RISK.rn.green) {
    recs.push({
      priority: "HIGH",
      text: `Deploy indoor radon detectors (CR-39 track-etch or electret) in local dwellings to validate the geogenic estimate of ${data.indices.indoor_Rn.toFixed(0)} Bq/m³.`,
    });
  }

  if (data.activities_Bq_kg.A_Th232 > 100) {
    recs.push({
      priority: "MEDIUM",
      text: "Thoron measurement with grab-sampling and EEC analysis. Consider CeBr3 drone spectrometry for spatial mapping of Th-232 distribution.",
    });
  }

  if (data.confidence < 60) {
    recs.push({
      priority: "MEDIUM",
      text: "Integrate SoilGrids permeability data and Copernicus DEM lineament density to refine the geogenic radon potential model.",
    });
  }

  if (data.indices.raeq > RISK.raeq.green) {
    recs.push({
      priority: "MEDIUM",
      text: `Test building materials for compliance with EU BSS activity index (Iγ = ${data.indices.I_gamma.toFixed(2)}). Source alternative aggregates if Iγ > 1.0.`,
    });
  }

  if (tier === "GREEN" && data.confidence >= 60) {
    recs.push({
      priority: "LOW",
      text: "No immediate action required. Periodic monitoring every 5 years is sufficient for public-health surveillance.",
    });
  }

  if (tier === "AMBER" && data.confidence >= 30) {
    recs.push({
      priority: "LOW",
      text: "Consider long-term radon monitoring during winter months. Inform local building authority of elevated background levels.",
    });
  }

  return recs;
}
