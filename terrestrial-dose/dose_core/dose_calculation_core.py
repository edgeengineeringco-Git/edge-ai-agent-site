"""
Terrestrial Dose Calculation Core
================================
Estimates terrestrial radiation dose (radon-222, thoron-220, external gamma)
from geogenic priors (lithology, soil permeability, fault proximity).

Standards: UNSCEAR 2024, ICRP 137, EU BSS 2013/59/Euratom, WHO 100 Bq/m³.

DO NOT modify the dose formulas.  All UI numbers must originate here.
"""

from __future__ import annotations
from typing import Optional, Dict, List, Any
import math

# ══════════════════════════════════════════════════════════════════════════════
# CONSTANTS — sourced from UNSCEAR 2000/2024, ICRP 137, EU BSS
# ══════════════════════════════════════════════════════════════════════════════

WORLD_AVG_DOSE = 2.2          # mSv/yr — UNSCEAR 2024 public terrestrial
OUTDOOR_FRACTION = 0.20       # 20% time outdoors (UNSCEAR occupancy)
HOURS_PER_YEAR = 8760
INDOOR_HOURS = 7000           # 80% indoor occupancy
SV_PER_NGY = 1e-6             # 1 nGy = 1e-6 mSv (absorbed ≈ effective for γ)

# ── Activity conversions (IAEA SRS-49, ICRP 107) ──
EU_TO_RA226   = 12.22         # 1 ppm eU → 12.22 Bq/kg Ra-226
ETH_TO_TH232  = 4.06          # 1 ppm eTh → 4.06 Bq/kg Th-232
K_PCT_TO_K40  = 313.0         # 1% K → 313 Bq/kg K-40

# ── External gamma dose-rate coefficients (nGy/h per Bq/kg) ──
# UNSCEAR 2000 / Saito & Jacob 1995
GAMMA_COEFF_RA = 0.462        # Ra-226 (U-238 series)
GAMMA_COEFF_TH = 0.604        # Th-232 series
GAMMA_COEFF_K  = 0.041        # K-40

# ── Radon inhalation dose conversion factors ──
# EU BSS 2013/59/Euratom: 10 mSv/yr per 300 Bq/m³ (domestic, equilibrium factor 0.4)
RADON_METHODS: Dict[str, float] = {
    "eubss":    10.0 / 300.0,    # 0.0333 mSv/yr per Bq/m³
    "icrp137":  10.0 / 300.0,    # ICRP 137 (same nominal)
    "unscear":  0.00678,         # UNSCEAR 2020, lower DCF
    "icrp65":   0.00865,         # ICRP 65 legacy
}

# ── Thoron (Rn-220) parameters ──
Tn_EEC_RATIO = 0.02           # EEC/gas ratio indoor (UNSCEAR)
Tn_DCF = 40e-6 * INDOOR_HOURS # 40 nSv per Bq/m³-h EEC × 7000 h → 0.28 mSv per (Bq/m³ EEC·yr)

# ── Risk thresholds ──
RISK = {
    "dose":  {"green": 2.2,  "amber": 6.6},   # mSv/yr (UNSCEAR avg → 3×avg)
    "rn":    {"green": 100,  "amber": 300},    # Bq/m³ (WHO action level)
    "gamma": {"green": 59,   "amber": 1000},   # nGy/h (world avg → high)
    "raeq":  {"green": 370,  "amber": 740},    # Bq/kg (EU BSS exemption → 2×)
}
WHO_RN_ACTION = 100           # Bq/m³
UNSCEAR_GAMMA_MAX = 1500      # nGy/h absolute ceiling


# ══════════════════════════════════════════════════════════════════════════════
# LITHOLOGY TABLES
# ══════════════════════════════════════════════════════════════════════════════

# GLiM (Hartmann & Moosdorf 2012) code → (description, internal lithology key)
GLIM_MAP: Dict[str, str] = {
    "Su":  "alluvium",           # Unconsolidated sediments
    "Ss":  "sandstone",          # Siliciclastic sedimentary
    "Sm":  "siltstone",          # Mixed sedimentary
    "Sc":  "limestone",          # Carbonate sedimentary
    "Sb":  "marl",               # Basic sedimentary (marl)
    "Ev":  "dolomite",           # Evaporites
    "Pa":  "granite",            # Acid plutonic
    "Pi":  "granodiorite",       # Intermediate plutonic
    "Pb":  "gabbro",             # Basic plutonic
    "Va":  "rhyolite",           # Acid volcanic
    "Vi":  "andesite",           # Intermediate volcanic
    "Vb":  "basalt",             # Basic volcanic
    "Mt":  "gneiss",             # Metamorphic
    "Py":  "tuff",               # Pyroclastic
    "Wa":  "water",              # Water body
    "Ice": "ice",                # Ice
    # Extended lithologies (non-GLiM, for measurement overrides)
    "monazite_bearing":   "monazite_bearing",
    "carbonatite":        "carbonatite",
    "ion_adsorption_clay": "ion_adsorption_clay",
    "world_average_soil": "world_average_soil",
    "shale":              "shale",
    "slate":              "slate",
    "schist":             "schist",
    "quartzite":          "quartzite",
    "marble":             "marble",
    "amphibolite":        "amphibolite",
    "pegmatite":          "pegmatite",
    "syenite":            "syenite",
    "diorite":           "diorite",
    "peridotite":        "peridotite",
    "dunite":            "dunite",
    "pumice":            "pumice",
    "obsidian":          "obsidian",
    "coal":              "coal",
    "arkose":            "arkose",
    "mudstone":          "mudstone",
    "chalk":             "chalk",
    "glacial_till":      "glacial_till",
}

# Typical activity concentrations (Bq/kg) per lithology
# Source: UNSCEAR 2000 Annex B, IAEA SRS-49, NCRP 160
LITHOLOGY_ACTIVITIES: Dict[str, Dict[str, float]] = {
    "granite":              {"A_Ra226": 59,  "A_Th232": 64,  "A_K40": 1070, "label": "Granite (acid plutonic)"},
    "granodiorite":         {"A_Ra226": 40,  "A_Th232": 50,  "A_K40": 900,  "label": "Granodiorite"},
    "diorite":              {"A_Ra226": 25,  "A_Th232": 30,  "A_K40": 550,  "label": "Diorite"},
    "gabbro":               {"A_Ra226": 12,  "A_Th232": 15,  "A_K40": 250,  "label": "Gabbro"},
    "peridotite":           {"A_Ra226": 3,   "A_Th232": 5,   "A_K40": 80,   "label": "Peridotite"},
    "dunite":               {"A_Ra226": 2,   "A_Th232": 3,   "A_K40": 40,   "label": "Dunite"},
    "pegmatite":            {"A_Ra226": 65,  "A_Th232": 80,  "A_K40": 1200, "label": "Pegmatite"},
    "syenite":              {"A_Ra226": 45,  "A_Th232": 70,  "A_K40": 1100, "label": "Syenite"},
    "rhyolite":             {"A_Ra226": 55,  "A_Th232": 60,  "A_K40": 1000, "label": "Rhyolite (acid volcanic)"},
    "andesite":             {"A_Ra226": 30,  "A_Th232": 40,  "A_K40": 700,  "label": "Andesite"},
    "basalt":               {"A_Ra226": 15,  "A_Th232": 18,  "A_K40": 300,  "label": "Basalt (basic volcanic)"},
    "tuff":                 {"A_Ra226": 30,  "A_Th232": 35,  "A_K40": 600,  "label": "Tuff (pyroclastic)"},
    "pumice":               {"A_Ra226": 25,  "A_Th232": 30,  "A_K40": 500,  "label": "Pumice"},
    "obsidian":             {"A_Ra226": 40,  "A_Th232": 50,  "A_K40": 800,  "label": "Obsidian"},
    "gneiss":               {"A_Ra226": 38,  "A_Th232": 45,  "A_K40": 850,  "label": "Gneiss (metamorphic)"},
    "schist":               {"A_Ra226": 35,  "A_Th232": 42,  "A_K40": 750,  "label": "Schist"},
    "slate":                {"A_Ra226": 22,  "A_Th232": 28,  "A_K40": 480,  "label": "Slate"},
    "quartzite":            {"A_Ra226": 10,  "A_Th232": 8,   "A_K40": 150,  "label": "Quartzite"},
    "marble":               {"A_Ra226": 8,   "A_Th232": 5,   "A_K40": 80,   "label": "Marble"},
    "amphibolite":          {"A_Ra226": 15,  "A_Th232": 12,  "A_K40": 300,  "label": "Amphibolite"},
    "limestone":            {"A_Ra226": 12,  "A_Th232": 6,   "A_K40": 100,  "label": "Limestone (carbonate)"},
    "dolomite":             {"A_Ra226": 10,  "A_Th232": 5,   "A_K40": 80,   "label": "Dolomite (evaporite)"},
    "sandstone":            {"A_Ra226": 18,  "A_Th232": 22,  "A_K40": 350,  "label": "Sandstone"},
    "arkose":               {"A_Ra226": 22,  "A_Th232": 28,  "A_K40": 400,  "label": "Arkose"},
    "shale":                {"A_Ra226": 30,  "A_Th232": 35,  "A_K40": 580,  "label": "Shale"},
    "mudstone":             {"A_Ra226": 28,  "A_Th232": 32,  "A_K40": 520,  "label": "Mudstone"},
    "siltstone":            {"A_Ra226": 25,  "A_Th232": 30,  "A_K40": 480,  "label": "Siltstone"},
    "marl":                 {"A_Ra226": 15,  "A_Th232": 10,  "A_K40": 200,  "label": "Marl (basic sedimentary)"},
    "chalk":                {"A_Ra226": 8,   "A_Th232": 4,   "A_K40": 60,   "label": "Chalk"},
    "coal":                 {"A_Ra226": 20,  "A_Th232": 12,  "A_K40": 100,  "label": "Coal"},
    "alluvium":             {"A_Ra226": 20,  "A_Th232": 25,  "A_K40": 400,  "label": "Alluvium (unconsolidated)"},
    "glacial_till":         {"A_Ra226": 18,  "A_Th232": 22,  "A_K40": 380,  "label": "Glacial till"},
    "monazite_bearing":     {"A_Ra226": 80,  "A_Th232": 350, "A_K40": 400,  "label": "Monazite-bearing (REE)"},
    "carbonatite":          {"A_Ra226": 120, "A_Th232": 150, "A_K40": 200,  "label": "Carbonatite"},
    "ion_adsorption_clay":  {"A_Ra226": 50,  "A_Th232": 100, "A_K40": 500,  "label": "Ion-adsorption clay"},
    "world_average_soil":   {"A_Ra226": 30,  "A_Th232": 30,  "A_K40": 400,  "label": "World Average Soil"},
    "water":                {"A_Ra226": 0,   "A_Th232": 0,   "A_K40": 0,    "label": "Water body"},
    "ice":                  {"A_Ra226": 0,   "A_Th232": 0,   "A_K40": 0,    "label": "Ice"},
}

# Lithology factor — proxy for radon emanation coefficient & soil permeability
# Higher = more radon/thoron reaches indoor air
# Based on porosity, fracture density, and emanation coefficient data
# (UNSCEAR 2000, Nazaroff & Nero 1988, IAEA SRS-47)
LITHOLOGY_FACTOR: Dict[str, float] = {
    "granite": 0.35, "granodiorite": 0.30, "diorite": 0.20, "gabbro": 0.10,
    "peridotite": 0.05, "dunite": 0.05, "pegmatite": 0.45, "syenite": 0.30,
    "rhyolite": 0.25, "andesite": 0.20, "basalt": 0.15, "tuff": 0.50,
    "pumice": 0.60, "obsidian": 0.15, "gneiss": 0.25, "schist": 0.25,
    "slate": 0.15, "quartzite": 0.10, "marble": 0.20, "amphibolite": 0.15,
    "limestone": 0.40, "dolomite": 0.45, "sandstone": 0.70, "arkose": 0.65,
    "shale": 0.20, "mudstone": 0.18, "siltstone": 0.30, "marl": 0.35,
    "chalk": 0.50, "coal": 0.55, "alluvium": 0.75, "glacial_till": 0.60,
    "monazite_bearing": 0.40, "carbonatite": 0.50, "ion_adsorption_clay": 0.55,
    "world_average_soil": 0.50, "water": 0.0, "ice": 0.0,
}


# ══════════════════════════════════════════════════════════════════════════════
# DOSE FUNCTIONS — do not modify formulas
# ══════════════════════════════════════════════════════════════════════════════

def _resolve_lithology(lithology: str) -> str:
    """Map GLiM code or lithology name to internal key."""
    if lithology in LITHOLOGY_ACTIVITIES:
        return lithology
    key = GLIM_MAP.get(lithology)
    if key and key in LITHOLOGY_ACTIVITIES:
        return key
    # try normalised
    norm = lithology.lower().replace(" ", "_").replace("-", "_")
    if norm in LITHOLOGY_ACTIVITIES:
        return norm
    key = GLIM_MAP.get(norm)
    if key and key in LITHOLOGY_ACTIVITIES:
        return key
    return "world_average_soil"


def lithology_to_activities(lithology: str) -> Dict[str, float]:
    """Return typical {A_Ra226, A_Th232, A_K40} (Bq/kg) for a lithology or GLiM code."""
    key = _resolve_lithology(lithology)
    entry = LITHOLOGY_ACTIVITIES[key]
    return {"A_Ra226": entry["A_Ra226"], "A_Th232": entry["A_Th232"], "A_K40": entry["A_K40"]}


def lithology_factor(lithology: str) -> float:
    """Return emanation/permeability factor (0–1) for a lithology or GLiM code."""
    key = _resolve_lithology(lithology)
    return LITHOLOGY_FACTOR.get(key, 0.50)


def ppm_to_bqkg(eU_ppm: float, eTh_ppm: float, K_pct: float) -> Dict[str, float]:
    """Convert radiometric ppm/% to Bq/kg (IAEA SRS-49)."""
    return {
        "A_Ra226": eU_ppm * EU_TO_RA226,
        "A_Th232": eTh_ppm * ETH_TO_TH232,
        "A_K40":   K_pct * K_PCT_TO_K40,
    }


def external_gamma_dose_rate(A_Ra226: float, A_Th232: float, A_K40: float) -> float:
    """Outdoor gamma dose rate (nGy/h) — Saito & Jacob 1995 / UNSCEAR 2000."""
    return GAMMA_COEFF_RA * A_Ra226 + GAMMA_COEFF_TH * A_Th232 + GAMMA_COEFF_K * A_K40


def annual_external_dose(A_Ra226: float, A_Th232: float, A_K40: float,
                         outdoor_fraction: float = OUTDOOR_FRACTION) -> float:
    """
    Annual effective dose from external gamma (mSv/yr).
    UNSCEAR: D_outdoor × 0.2 + D_indoor × 0.8, with indoor/outdoor ratio ~0.7.
    Simplified: rate × hours × occupancy × Sv conversion.
    """
    rate = external_gamma_dose_rate(A_Ra226, A_Th232, A_K40)  # nGy/h
    return rate * HOURS_PER_YEAR * (1 - outdoor_fraction) * 0.7 * SV_PER_NGY


def geogenic_radon_potential(A_Ra226: float,
                             lithology: str = "world_average_soil",
                             dist_fault_m: float = 5000,
                             lineament_density: float = 0,
                             permeability: Optional[float] = None) -> float:
    """
    Geogenic Radon Potential (GRP) — dimensionless index.
    Based on Szemkovszky et al. 2014 / Friedmann et al.

    GRP = (A_Ra226 / 30) × LF × exp(-dist_fault/3000) × (1 + LD × 0.5) × perm_factor

    Where LF = lithology factor, perm_factor = permeability adjustment.
    """
    lf = lithology_factor(lithology)
    ff = max(0.1, math.exp(-dist_fault_m / 3000))          # fault proximity boost
    li = 1 + min(lineament_density, 1.0) * 0.5             # lineament boost
    pf = 1.0
    if permeability is not None:
        pf = 0.5 + min(max(permeability, 0), 1) * 1.0       # 0–1 permeability → 0.5–1.5
    return (A_Ra226 / 30) * lf * ff * li * pf


def radon_from_grp(grp: float) -> float:
    """Convert GRP to estimated indoor radon concentration (Bq/m³).
    Calibration: GRP=1 → 60 Bq/m³ (empirical, Szemkovszky)."""
    return grp * 60.0


def radon_inhalation_dose(C_Rn: float, method: str = "eubss") -> float:
    """Annual effective dose from radon inhalation (mSv/yr)."""
    dcf = RADON_METHODS.get(method, RADON_METHODS["eubss"])
    return C_Rn * dcf


def geogenic_thoron_potential(A_Th232: float,
                              lithology: str = "world_average_soil",
                              permeability: Optional[float] = None) -> float:
    """
    Global Thoron Potential (GTP) — indoor thoron EEC proxy (Bq/m³).
    Calibrated: world-average soil (A_Th=30, LF=0.5) → 0.357 Bq/m³ EEC
    → 0.10 mSv/yr dose.
    """
    lf = lithology_factor(lithology)
    emanation = 0.1 + lf * 0.25
    pf = 1.0
    if permeability is not None:
        pf = 0.5 + min(max(permeability, 0), 1) * 1.0
    gtp = (A_Th232 / 30) * emanation / 0.630 * pf
    return gtp


def thoron_inhalation_dose(A_Th232: float,
                           lithology: str = "world_average_soil",
                           C_Tn: Optional[float] = None,
                           permeability: Optional[float] = None) -> float:
    """Annual effective dose from thoron (Rn-220) inhalation (mSv/yr)."""
    if C_Tn is not None and C_Tn > 0:
        return C_Tn * Tn_EEC_RATIO * Tn_DCF
    gtp = geogenic_thoron_potential(A_Th232, lithology, permeability)
    dose = gtp * 1.0 * Tn_DCF
    # Non-linear enhancement for high Th-232 (>50 Bq/kg)
    # Physically: monazite/REE-bearing rocks have very high emanation coefficients
    if A_Th232 > 50:
        enhancement = 1.0 + math.pow((A_Th232 - 50) / 50, 0.8)
        dose *= enhancement
    return dose


def indoor_radon_from_geogenic(A_Ra226: float,
                                lithology: str = "world_average_soil",
                                dist_fault_m: float = 5000,
                                lineament_density: float = 0,
                                permeability: Optional[float] = None) -> float:
    """Estimate indoor radon (Bq/m³) from geogenic priors."""
    grp = geogenic_radon_potential(A_Ra226, lithology, dist_fault_m,
                                   lineament_density, permeability)
    return radon_from_grp(grp)


def radium_equivalent(A_Ra226: float, A_Th232: float, A_K40: float) -> float:
    """Radium equivalent activity (Bq/kg) — EU BSS building material index."""
    return A_Ra226 + (A_Th232 * 10 / 7) + (A_K40 * 10 / 130)


def gamma_activity_index(A_Ra226: float, A_Th232: float, A_K40: float) -> float:
    """Activity concentration index I_γ (EU BSS RP 112). Must be ≤1 for building use."""
    return A_Ra226 / 370 + A_Th232 / 259 + A_K40 / 4810


def excess_lifetime_cancer_risk(E: float, years: int = 70,
                                risk_factor: float = 0.005) -> float:
    """Excess Lifetime Cancer Risk (dimensionless) — ICRP 103 nominal risk."""
    return E * years * risk_factor / 1000


def risk_class(E_total: float,
               C_Rn: Optional[float] = None,
               raeq: Optional[float] = None,
               gamma_rate: Optional[float] = None) -> Dict[str, Any]:
    """
    Classify risk into GREEN / AMBER / RED per UNSCEAR 2024 thresholds.
    """
    tier = "GREEN"
    reasons: List[str] = []
    flags: List[str] = []

    # Total dose
    if E_total > RISK["dose"]["amber"]:
        tier = "RED"
        reasons.append(f"Annual dose {E_total:.2f} mSv/yr > {RISK['dose']['amber']}")
    elif E_total > RISK["dose"]["green"]:
        if tier != "RED":
            tier = "AMBER"
        reasons.append(f"Annual dose {E_total:.2f} mSv/yr > {RISK['dose']['green']}")

    # Radon
    if C_Rn is not None:
        if C_Rn >= RISK["rn"]["amber"]:
            tier = "RED"
            reasons.append(f"Radon {C_Rn:.0f} Bq/m³ ≥ {RISK['rn']['amber']}")
        elif C_Rn >= RISK["rn"]["green"]:
            if tier == "GREEN":
                tier = "AMBER"
            reasons.append(f"Radon {C_Rn:.0f} Bq/m³ ≥ {RISK['rn']['green']}")

    # Gamma rate
    if gamma_rate is not None:
        if gamma_rate >= RISK["gamma"]["amber"]:
            tier = "RED"
            reasons.append(f"Gamma rate {gamma_rate:.0f} nGy/h ≥ {RISK['gamma']['amber']}")
        elif gamma_rate >= RISK["gamma"]["green"]:
            if tier == "GREEN":
                tier = "AMBER"
            reasons.append(f"Gamma rate {gamma_rate:.0f} nGy/h ≥ {RISK['gamma']['green']}")

    # Radium equivalent
    if raeq is not None:
        if raeq >= RISK["raeq"]["amber"]:
            tier = "RED"
            reasons.append(f"Ra-eq {raeq:.0f} Bq/kg ≥ {RISK['raeq']['amber']}")
        elif raeq >= RISK["raeq"]["green"]:
            if tier == "GREEN":
                tier = "AMBER"
            reasons.append(f"Ra-eq {raeq:.0f} Bq/kg ≥ {RISK['raeq']['green']}")

    return {"tier": tier, "reasons": reasons, "flags": flags}


# ══════════════════════════════════════════════════════════════════════════════
# POLYGON DOSE FINGERPRINT — the main entry point
# ══════════════════════════════════════════════════════════════════════════════

def polygon_dose_fingerprint(
    lithology: str = "world_average_soil",
    dist_fault_m: float = 5000,
    lineament_density: float = 0,
    eU_ppm: Optional[float] = None,
    eTh_ppm: Optional[float] = None,
    K_pct: Optional[float] = None,
    C_Rn: Optional[float] = None,
    C_Tn: Optional[float] = None,
    permeability: Optional[float] = None,
    radon_method: str = "eubss",
) -> Dict[str, Any]:
    """
    Compute the full terrestrial dose fingerprint for a polygon.

    Parameters
    ----------
    lithology : str
        GLiM code (Pa, Sc, Su, ...) or named lithology (granite, limestone, ...).
    dist_fault_m : float
        Distance to nearest active fault (m).
    lineament_density : float
        Lineament density index (0–1).
    eU_ppm, eTh_ppm, K_pct : optional floats
        Measured radiometric values (override the lithology prior).
    C_Rn : optional float
        Measured indoor radon concentration (Bq/m³).
    C_Tn : optional float
        Measured indoor thoron gas concentration (Bq/m³).
    permeability : optional float
        Soil permeability proxy (0–1).
    radon_method : str
        Dose conversion method: 'eubss', 'icrp137', 'unscear', 'icrp65'.

    Returns
    -------
    dict with keys:
        arms_mSv_yr           : {radon, thoron, gamma}
        total_terrestrial_mSv_yr : float
        gamma_rate_nGy_h      : float
        activities_Bq_kg      : {A_Ra226, A_Th232, A_K40}
        indices               : {raeq, I_gamma, indoor_Rn, indoor_Tn, ELCR}
        risk                  : {tier, reasons, flags}
        provenance            : list[str]
        confidence            : int (0–100)
        lithology             : str (resolved internal key)
        lithology_label       : str
        constants             : dict of reference values
    """
    activities = lithology_to_activities(lithology)
    A_Ra226 = activities["A_Ra226"]
    A_Th232 = activities["A_Th232"]
    A_K40 = activities["A_K40"]

    provenance: List[str] = []

    # ── Measurement overrides ──
    if eU_ppm is not None:
        A_Ra226 = eU_ppm * EU_TO_RA226
        provenance.append(f"A_Ra226: measured (eU={eU_ppm} ppm × {EU_TO_RA226} = {A_Ra226:.1f} Bq/kg)")
    else:
        provenance.append(f"A_Ra226: GLiM geology prior (lithology={_resolve_lithology(lithology)})")

    if eTh_ppm is not None:
        A_Th232 = eTh_ppm * ETH_TO_TH232
        provenance.append(f"A_Th232: measured (eTh={eTh_ppm} ppm × {ETH_TO_TH232} = {A_Th232:.1f} Bq/kg)")
    else:
        provenance.append(f"A_Th232: GLiM geology prior (lithology={_resolve_lithology(lithology)})")

    if K_pct is not None:
        A_K40 = K_pct * K_PCT_TO_K40
        provenance.append(f"A_K40: measured (K={K_pct}% × {K_PCT_TO_K40} = {A_K40:.1f} Bq/kg)")
    else:
        provenance.append(f"A_K40: GLiM geology prior (lithology={_resolve_lithology(lithology)})")

    # ── Gamma ──
    gamma_rate = external_gamma_dose_rate(A_Ra226, A_Th232, A_K40)     # nGy/h
    E_gamma = annual_external_dose(A_Ra226, A_Th232, A_K40)             # mSv/yr

    # ── Radon ──
    if C_Rn is not None:
        indoor_Rn = float(C_Rn)
        provenance.append(f"C_Rn: measured ({C_Rn} Bq/m³)")
    else:
        indoor_Rn = indoor_radon_from_geogenic(A_Ra226, lithology,
                                               dist_fault_m, lineament_density,
                                               permeability)
        provenance.append(f"C_Rn: geogenic estimate (GRP model, {indoor_Rn:.1f} Bq/m³)")
    E_radon = radon_inhalation_dose(indoor_Rn, radon_method)

    # ── Thoron ──
    if C_Tn is not None:
        indoor_Tn = float(C_Tn)
        provenance.append(f"C_Tn: measured ({C_Tn} Bq/m³)")
    else:
        indoor_Tn = geogenic_thoron_potential(A_Th232, lithology, permeability) * 1.0
        provenance.append(f"C_Tn: geogenic estimate (GTP model, {indoor_Tn:.2f} Bq/m³)")
    E_thoron = thoron_inhalation_dose(A_Th232, lithology, C_Tn, permeability)

    # ── Indices ──
    raeq = radium_equivalent(A_Ra226, A_Th232, A_K40)
    I_gamma = gamma_activity_index(A_Ra226, A_Th232, A_K40)
    ELCR = excess_lifetime_cancer_risk(E_gamma + E_radon + E_thoron)

    # ── Risk ──
    risk = risk_class(E_gamma + E_radon + E_thoron, indoor_Rn, raeq, gamma_rate)

    # ── Confidence ──
    total_params = 4  # A_Ra, A_Th, A_K, C_Rn
    measured_params = sum(1 for p in [eU_ppm, eTh_ppm, K_pct, C_Rn] if p is not None)
    confidence = round((measured_params / total_params) * 100) if measured_params > 0 else 20

    E_total = E_gamma + E_radon + E_thoron

    resolved = _resolve_lithology(lithology)
    label = LITHOLOGY_ACTIVITIES[resolved]["label"]

    return {
        "arms_mSv_yr": {
            "radon":  round(E_radon, 4),
            "thoron": round(E_thoron, 4),
            "gamma":  round(E_gamma, 4),
        },
        "total_terrestrial_mSv_yr": round(E_total, 4),
        "gamma_rate_nGy_h": round(gamma_rate, 1),
        "activities_Bq_kg": {
            "A_Ra226": round(A_Ra226, 1),
            "A_Th232": round(A_Th232, 1),
            "A_K40":   round(A_K40, 1),
        },
        "indices": {
            "raeq":      round(raeq, 1),
            "I_gamma":   round(I_gamma, 4),
            "indoor_Rn": round(indoor_Rn, 1),
            "indoor_Tn": round(indoor_Tn, 2),
            "ELCR":      round(ELCR, 6),
        },
        "risk": risk,
        "provenance": provenance,
        "confidence": confidence,
        "lithology": resolved,
        "lithology_label": label,
        "constants": {
            "WORLD_AVG_DOSE": WORLD_AVG_DOSE,
            "WHO_RN_ACTION": WHO_RN_ACTION,
            "UNSCEAR_GAMMA_MAX": UNSCEAR_GAMMA_MAX,
            "RISK_THRESHOLDS": RISK,
            "RADON_METHOD": radon_method,
            "DCF": RADON_METHODS.get(radon_method, RADON_METHODS["eubss"]),
        },
    }
