/**
 * Terrestrial Dose Calculation Core — TypeScript port
 * ================================================
 * Faithful port of dose_calculation_core.py
 * Standards: UNSCEAR 2024, ICRP 137, EU BSS 2013/59/Euratom, WHO 100 Bq/m³.
 *
 * DO NOT modify the dose formulas.
 */

// ── Constants ──
export const WORLD_AVG_DOSE = 2.2;
export const OUTDOOR_FRACTION = 0.20;
export const HOURS_PER_YEAR = 8760;
export const INDOOR_HOURS = 7000;
export const SV_PER_NGY = 1e-6;

export const EU_TO_RA226 = 12.22;
export const ETH_TO_TH232 = 4.06;
export const K_PCT_TO_K40 = 313.0;

export const GAMMA_COEFF_RA = 0.462;
export const GAMMA_COEFF_TH = 0.604;
export const GAMMA_COEFF_K = 0.041;

export const RADON_METHODS: Record<string, number> = {
  eubss: 10.0 / 300.0,
  icrp137: 10.0 / 300.0,
  unscear: 0.00678,
  icrp65: 0.00865,
};

export const Tn_EEC_RATIO = 0.02;
export const Tn_DCF = 40e-6 * INDOOR_HOURS;

export const RISK = {
  dose: { green: 2.2, amber: 6.6 },
  rn: { green: 100, amber: 300 },
  gamma: { green: 59, amber: 1000 },
  raeq: { green: 370, amber: 740 },
};
export const WHO_RN_ACTION = 100;
export const UNSCEAR_GAMMA_MAX = 1500;

// ── GLiM code → internal lithology key ──
export const GLIM_MAP: Record<string, string> = {
  Su: "alluvium", Ss: "sandstone", Sm: "siltstone", Sc: "limestone",
  Sb: "marl", Ev: "dolomite", Pa: "granite", Pi: "granodiorite",
  Pb: "gabbro", Va: "rhyolite", Vi: "andesite", Vb: "basalt",
  Mt: "gneiss", Py: "tuff", Wa: "water", Ice: "ice",
  monazite_bearing: "monazite_bearing", carbonatite: "carbonatite",
  ion_adsorption_clay: "ion_adsorption_clay", world_average_soil: "world_average_soil",
  shale: "shale", slate: "slate", schist: "schist", quartzite: "quartzite",
  marble: "marble", amphibolite: "amphibolite", pegmatite: "pegmatite",
  syenite: "syenite", diorite: "diorite", peridotite: "peridotite",
  dunite: "dunite", pumice: "pumice", obsidian: "obsidian",
  coal: "coal", arkose: "arkose", mudstone: "mudstone",
  chalk: "chalk", glacial_till: "glacial_till",
};

// ── Lithology activities (Bq/kg) ──
export const LITHOLOGY_ACTIVITIES: Record<string, { A_Ra226: number; A_Th232: number; A_K40: number; label: string }> = {
  granite:             { A_Ra226: 59,  A_Th232: 64,  A_K40: 1070, label: "Granite (acid plutonic)" },
  granodiorite:        { A_Ra226: 40,  A_Th232: 50,  A_K40: 900,  label: "Granodiorite" },
  diorite:             { A_Ra226: 25,  A_Th232: 30,  A_K40: 550,  label: "Diorite" },
  gabbro:              { A_Ra226: 12,  A_Th232: 15,  A_K40: 250,  label: "Gabbro" },
  peridotite:          { A_Ra226: 3,   A_Th232: 5,   A_K40: 80,   label: "Peridotite" },
  dunite:              { A_Ra226: 2,   A_Th232: 3,   A_K40: 40,   label: "Dunite" },
  pegmatite:           { A_Ra226: 65,  A_Th232: 80,  A_K40: 1200, label: "Pegmatite" },
  syenite:             { A_Ra226: 45,  A_Th232: 70,  A_K40: 1100, label: "Syenite" },
  rhyolite:            { A_Ra226: 55,  A_Th232: 60,  A_K40: 1000, label: "Rhyolite (acid volcanic)" },
  andesite:            { A_Ra226: 30,  A_Th232: 40,  A_K40: 700,  label: "Andesite" },
  basalt:              { A_Ra226: 15,  A_Th232: 18,  A_K40: 300,  label: "Basalt (basic volcanic)" },
  tuff:                { A_Ra226: 30,  A_Th232: 35,  A_K40: 600,  label: "Tuff (pyroclastic)" },
  pumice:              { A_Ra226: 25,  A_Th232: 30,  A_K40: 500,  label: "Pumice" },
  obsidian:            { A_Ra226: 40,  A_Th232: 50,  A_K40: 800,  label: "Obsidian" },
  gneiss:              { A_Ra226: 38,  A_Th232: 45,  A_K40: 850,  label: "Gneiss (metamorphic)" },
  schist:              { A_Ra226: 35,  A_Th232: 42,  A_K40: 750,  label: "Schist" },
  slate:               { A_Ra226: 22,  A_Th232: 28,  A_K40: 480,  label: "Slate" },
  quartzite:           { A_Ra226: 10,  A_Th232: 8,   A_K40: 150,  label: "Quartzite" },
  marble:              { A_Ra226: 8,   A_Th232: 5,   A_K40: 80,   label: "Marble" },
  amphibolite:         { A_Ra226: 15,  A_Th232: 12,  A_K40: 300,  label: "Amphibolite" },
  limestone:           { A_Ra226: 12,  A_Th232: 6,   A_K40: 100,  label: "Limestone (carbonate)" },
  dolomite:            { A_Ra226: 10,  A_Th232: 5,   A_K40: 80,   label: "Dolomite (evaporite)" },
  sandstone:           { A_Ra226: 18,  A_Th232: 22,  A_K40: 350,  label: "Sandstone" },
  arkose:              { A_Ra226: 22,  A_Th232: 28,  A_K40: 400,  label: "Arkose" },
  shale:               { A_Ra226: 30,  A_Th232: 35,  A_K40: 580,  label: "Shale" },
  mudstone:            { A_Ra226: 28,  A_Th232: 32,  A_K40: 520,  label: "Mudstone" },
  siltstone:           { A_Ra226: 25,  A_Th232: 30,  A_K40: 480,  label: "Siltstone" },
  marl:                { A_Ra226: 15,  A_Th232: 10,  A_K40: 200,  label: "Marl (basic sedimentary)" },
  chalk:               { A_Ra226: 8,   A_Th232: 4,   A_K40: 60,   label: "Chalk" },
  coal:                { A_Ra226: 20,  A_Th232: 12,  A_K40: 100,  label: "Coal" },
  alluvium:            { A_Ra226: 20,  A_Th232: 25,  A_K40: 400,  label: "Alluvium (unconsolidated)" },
  glacial_till:        { A_Ra226: 18,  A_Th232: 22,  A_K40: 380,  label: "Glacial till" },
  monazite_bearing:    { A_Ra226: 80,  A_Th232: 350, A_K40: 400,  label: "Monazite-bearing (REE)" },
  carbonatite:         { A_Ra226: 120, A_Th232: 150, A_K40: 200,  label: "Carbonatite" },
  ion_adsorption_clay:  { A_Ra226: 50,  A_Th232: 100, A_K40: 500,  label: "Ion-adsorption clay" },
  world_average_soil:  { A_Ra226: 30,  A_Th232: 30,  A_K40: 400,  label: "World Average Soil" },
  water:               { A_Ra226: 0,   A_Th232: 0,   A_K40: 0,    label: "Water body" },
  ice:                 { A_Ra226: 0,   A_Th232: 0,   A_K40: 0,    label: "Ice" },
};

export const LITHOLOGY_FACTOR: Record<string, number> = {
  granite: 0.35, granodiorite: 0.30, diorite: 0.20, gabbro: 0.10,
  peridotite: 0.05, dunite: 0.05, pegmatite: 0.45, syenite: 0.30,
  rhyolite: 0.25, andesite: 0.20, basalt: 0.15, tuff: 0.50,
  pumice: 0.60, obsidian: 0.15, gneiss: 0.25, schist: 0.25,
  slate: 0.15, quartzite: 0.10, marble: 0.20, amphibolite: 0.15,
  limestone: 0.40, dolomite: 0.45, sandstone: 0.70, arkose: 0.65,
  shale: 0.20, mudstone: 0.18, siltstone: 0.30, marl: 0.35,
  chalk: 0.50, coal: 0.55, alluvium: 0.75, glacial_till: 0.60,
  monazite_bearing: 0.40, carbonatite: 0.50, ion_adsorption_clay: 0.55,
  world_average_soil: 0.50, water: 0.0, ice: 0.0,
};

// ── Resolve lithology from GLiM code or name ──
function _resolveLithology(lithology: string): string {
  if (lithology in LITHOLOGY_ACTIVITIES) return lithology;
  const key = GLIM_MAP[lithology];
  if (key && key in LITHOLOGY_ACTIVITIES) return key;
  const norm = lithology.toLowerCase().replace(/[\s-]+/g, "_");
  if (norm in LITHOLOGY_ACTIVITIES) return norm;
  const key2 = GLIM_MAP[norm];
  if (key2 && key2 in LITHOLOGY_ACTIVITIES) return key2;
  return "world_average_soil";
}

export function lithologyToActivities(lithology: string) {
  const key = _resolveLithology(lithology);
  const e = LITHOLOGY_ACTIVITIES[key];
  return { A_Ra226: e.A_Ra226, A_Th232: e.A_Th232, A_K40: e.A_K40 };
}

export function lithologyFactor(lithology: string): number {
  const key = _resolveLithology(lithology);
  return LITHOLOGY_FACTOR[key] ?? 0.50;
}

export function ppmToBqkg(eU: number, eTh: number, K: number) {
  return { A_Ra226: eU * EU_TO_RA226, A_Th232: eTh * ETH_TO_TH232, A_K40: K * K_PCT_TO_K40 };
}

export function externalGammaDoseRate(a: number, b: number, c: number): number {
  return GAMMA_COEFF_RA * a + GAMMA_COEFF_TH * b + GAMMA_COEFF_K * c;
}

export function annualExternalDose(a: number, b: number, c: number, of = OUTDOOR_FRACTION): number {
  const rate = externalGammaDoseRate(a, b, c);
  return rate * HOURS_PER_YEAR * (1 - of) * 0.7 * SV_PER_NGY;
}

export function geogenicRadonPotential(a: number, lith = "world_average_soil", dist = 5000, line = 0, perm?: number | null): number {
  const lf = lithologyFactor(lith);
  const ff = Math.max(0.1, Math.exp(-dist / 3000));
  const li = 1 + Math.min(line, 1.0) * 0.5;
  const pf = perm != null ? 0.5 + Math.min(Math.max(perm, 0), 1) * 1.0 : 1.0;
  return (a / 30) * lf * ff * li * pf;
}

export function radonFromGrp(grp: number): number {
  return grp * 60.0;
}

export function radonInhalationDose(c: number, method = "eubss"): number {
  const dcf = RADON_METHODS[method] ?? RADON_METHODS.eubss;
  return c * dcf;
}

export function geogenicThoronPotential(a: number, lith = "world_average_soil", perm?: number | null): number {
  const lf = lithologyFactor(lith);
  const emanation = 0.1 + lf * 0.25;
  const pf = perm != null ? 0.5 + Math.min(Math.max(perm, 0), 1) * 1.0 : 1.0;
  return (a / 30) * emanation / 0.630 * pf;
}

export function thoronInhalationDose(a: number, lith = "world_average_soil", c?: number | null, perm?: number | null): number {
  if (c != null && c > 0) return c * Tn_EEC_RATIO * Tn_DCF;
  const gtp = geogenicThoronPotential(a, lith, perm);
  let dose = gtp * 1.0 * Tn_DCF;
  if (a > 50) {
    const enhancement = 1.0 + Math.pow((a - 50) / 50, 0.8);
    dose *= enhancement;
  }
  return dose;
}

export function indoorRadonFromGeogenic(a: number, lith = "world_average_soil", dist = 5000, line = 0, perm?: number | null): number {
  const grp = geogenicRadonPotential(a, lith, dist, line, perm);
  return radonFromGrp(grp);
}

export function radiumEquivalent(a: number, b: number, c: number): number {
  return a + (b * 10 / 7) + (c * 10 / 130);
}

export function gammaActivityIndex(a: number, b: number, c: number): number {
  return a / 370 + b / 259 + c / 4810;
}

export function excessLifetimeCancerRisk(e: number, y = 70, rf = 0.005): number {
  return e * y * rf / 1000;
}

export function riskClass(e: number, cRn?: number | null, raeq?: number | null, gammaRate?: number | null) {
  let tier = "GREEN";
  const reasons: string[] = [];
  const flags: string[] = [];

  if (e > RISK.dose.amber) { tier = "RED"; reasons.push(`Annual dose ${e.toFixed(2)} mSv/yr > ${RISK.dose.amber}`); }
  else if (e > RISK.dose.green) { if (tier !== "RED") tier = "AMBER"; reasons.push(`Annual dose ${e.toFixed(2)} mSv/yr > ${RISK.dose.green}`); }

  if (cRn != null) {
    if (cRn >= RISK.rn.amber) { tier = "RED"; reasons.push(`Radon ${cRn.toFixed(0)} Bq/m³ ≥ ${RISK.rn.amber}`); }
    else if (cRn >= RISK.rn.green) { if (tier === "GREEN") tier = "AMBER"; reasons.push(`Radon ${cRn.toFixed(0)} Bq/m³ ≥ ${RISK.rn.green}`); }
  }

  if (gammaRate != null) {
    if (gammaRate >= RISK.gamma.amber) { tier = "RED"; reasons.push(`Gamma rate ${gammaRate.toFixed(0)} nGy/h ≥ ${RISK.gamma.amber}`); }
    else if (gammaRate >= RISK.gamma.green) { if (tier === "GREEN") tier = "AMBER"; reasons.push(`Gamma rate ${gammaRate.toFixed(0)} nGy/h ≥ ${RISK.gamma.green}`); }
  }

  if (raeq != null) {
    if (raeq >= RISK.raeq.amber) { tier = "RED"; reasons.push(`Ra-eq ${raeq.toFixed(0)} Bq/kg ≥ ${RISK.raeq.amber}`); }
    else if (raeq >= RISK.raeq.green) { if (tier === "GREEN") tier = "AMBER"; reasons.push(`Ra-eq ${raeq.toFixed(0)} Bq/kg ≥ ${RISK.raeq.green}`); }
  }

  return { tier, reasons, flags };
}

// ── Main entry: polygon dose fingerprint ──
export interface DoseFingerprint {
  arms_mSv_yr: { radon: number; thoron: number; gamma: number };
  total_terrestrial_mSv_yr: number;
  gamma_rate_nGy_h: number;
  activities_Bq_kg: { A_Ra226: number; A_Th232: number; A_K40: number };
  indices: { raeq: number; I_gamma: number; indoor_Rn: number; indoor_Tn: number; ELCR: number };
  risk: { tier: string; reasons: string[]; flags: string[] };
  provenance: string[];
  confidence: number;
  lithology: string;
  lithology_label: string;
  lat?: number;
  lon?: number;
}

export function polygonDoseFingerprint(opts: {
  lithology?: string;
  dist_fault_m?: number;
  lineament_density?: number;
  eU_ppm?: number | null;
  eTh_ppm?: number | null;
  K_pct?: number | null;
  C_Rn?: number | null;
  C_Tn?: number | null;
  permeability?: number | null;
  radon_method?: string;
  lat?: number;
  lon?: number;
} = {}): DoseFingerprint {
  const {
    lithology = "world_average_soil",
    dist_fault_m = 5000,
    lineament_density = 0,
    eU_ppm = null,
    eTh_ppm = null,
    K_pct = null,
    C_Rn = null,
    C_Tn = null,
    permeability = null,
    radon_method = "eubss",
    lat,
    lon,
  } = opts;

  const act = lithologyToActivities(lithology);
  let A_Ra = act.A_Ra226, A_Th = act.A_Th232, A_K = act.A_K40;
  const provenance: string[] = [];
  const resolved = _resolveLithology(lithology);

  if (eU_ppm != null) {
    A_Ra = eU_ppm * EU_TO_RA226;
    provenance.push(`A_Ra226: measured (eU=${eU_ppm} ppm × ${EU_TO_RA226} = ${A_Ra.toFixed(1)} Bq/kg)`);
  } else {
    provenance.push(`A_Ra226: GLiM geology prior (lithology=${resolved})`);
  }
  if (eTh_ppm != null) {
    A_Th = eTh_ppm * ETH_TO_TH232;
    provenance.push(`A_Th232: measured (eTh=${eTh_ppm} ppm × ${ETH_TO_TH232} = ${A_Th.toFixed(1)} Bq/kg)`);
  } else {
    provenance.push(`A_Th232: GLiM geology prior (lithology=${resolved})`);
  }
  if (K_pct != null) {
    A_K = K_pct * K_PCT_TO_K40;
    provenance.push(`A_K40: measured (K=${K_pct}% × ${K_PCT_TO_K40} = ${A_K.toFixed(1)} Bq/kg)`);
  } else {
    provenance.push(`A_K40: GLiM geology prior (lithology=${resolved})`);
  }

  const gammaRate = externalGammaDoseRate(A_Ra, A_Th, A_K);
  const E_gamma = annualExternalDose(A_Ra, A_Th, A_K);

  let indoorRn: number;
  if (C_Rn != null) {
    indoorRn = C_Rn;
    provenance.push(`C_Rn: measured (${C_Rn} Bq/m³)`);
  } else {
    indoorRn = indoorRadonFromGeogenic(A_Ra, lithology, dist_fault_m, lineament_density, permeability);
    provenance.push(`C_Rn: geogenic estimate (GRP model, ${indoorRn.toFixed(1)} Bq/m³)`);
  }
  const E_radon = radonInhalationDose(indoorRn, radon_method);

  let indoorTn: number;
  if (C_Tn != null) {
    indoorTn = C_Tn;
    provenance.push(`C_Tn: measured (${C_Tn} Bq/m³)`);
  } else {
    indoorTn = geogenicThoronPotential(A_Th, lithology, permeability) * 1.0;
    provenance.push(`C_Tn: geogenic estimate (GTP model, ${indoorTn.toFixed(2)} Bq/m³)`);
  }
  const E_thoron = thoronInhalationDose(A_Th, lithology, C_Tn, permeability);

  const raeq = radiumEquivalent(A_Ra, A_Th, A_K);
  const I_gamma = gammaActivityIndex(A_Ra, A_Th, A_K);
  const E_total = E_gamma + E_radon + E_thoron;
  const ELCR = excessLifetimeCancerRisk(E_total);
  const risk = riskClass(E_total, indoorRn, raeq, gammaRate);

  const totalParams = 4;
  const measuredParams = [eU_ppm, eTh_ppm, K_pct, C_Rn].filter(p => p != null).length;
  const confidence = measuredParams > 0 ? Math.round((measuredParams / totalParams) * 100) : 20;

  return {
    arms_mSv_yr: {
      radon: +E_radon.toFixed(4),
      thoron: +E_thoron.toFixed(4),
      gamma: +E_gamma.toFixed(4),
    },
    total_terrestrial_mSv_yr: +E_total.toFixed(4),
    gamma_rate_nGy_h: +gammaRate.toFixed(1),
    activities_Bq_kg: {
      A_Ra226: +A_Ra.toFixed(1),
      A_Th232: +A_Th.toFixed(1),
      A_K40: +A_K.toFixed(1),
    },
    indices: {
      raeq: +raeq.toFixed(1),
      I_gamma: +I_gamma.toFixed(4),
      indoor_Rn: +indoorRn.toFixed(1),
      indoor_Tn: +indoorTn.toFixed(2),
      ELCR: +ELCR.toFixed(6),
    },
    risk,
    provenance,
    confidence,
    lithology: resolved,
    lithology_label: LITHOLOGY_ACTIVITIES[resolved].label,
    lat,
    lon,
  };
}
