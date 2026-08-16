"""
Test suite for dose_calculation_core.py
All assertions must pass before proceeding to Step 2.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dose_core.dose_calculation_core import (
    polygon_dose_fingerprint,
    radon_inhalation_dose,
    risk_class,
)


def test_world_average_soil():
    """World-average soil → matches UNSCEAR, GREEN."""
    fp = polygon_dose_fingerprint(lithology="world_average_soil")
    assert abs(fp["arms_mSv_yr"]["thoron"] - 0.10) < 0.02, \
        f"thoron {fp['arms_mSv_yr']['thoron']} != 0.10"
    assert 45 < fp["gamma_rate_nGy_h"] < 60, \
        f"gamma_rate {fp['gamma_rate_nGy_h']} not in 45–60"
    assert fp["risk"]["tier"] == "GREEN"


def test_granite_radon_dominated_amber():
    """GLiM acid plutonic (Pa = granite) → radon-dominated, AMBER."""
    fp = polygon_dose_fingerprint(lithology="Pa", dist_fault_m=200, lineament_density=1.0)
    assert fp["arms_mSv_yr"]["radon"] > fp["arms_mSv_yr"]["thoron"]
    assert fp["arms_mSv_yr"]["radon"] > fp["arms_mSv_yr"]["gamma"]
    assert fp["risk"]["tier"] == "AMBER"


def test_carbonate_green():
    """GLiM carbonate (Sc = limestone) → low dose, GREEN."""
    fp = polygon_dose_fingerprint(lithology="Sc")
    assert fp["total_terrestrial_mSv_yr"] < 1.0, \
        f"total {fp['total_terrestrial_mSv_yr']} >= 1.0"
    assert fp["risk"]["tier"] == "GREEN"


def test_monazite_thoron_red():
    """Monazite/REE → thoron dominant, RED."""
    fp = polygon_dose_fingerprint(lithology="monazite_bearing")
    assert fp["arms_mSv_yr"]["thoron"] > 1.0, \
        f"thoron {fp['arms_mSv_yr']['thoron']} <= 1.0"
    assert fp["risk"]["tier"] == "RED"


def test_measurement_override():
    """Measurement override works — eU=10 ppm → A_Ra226 ≈ 122.2."""
    fp = polygon_dose_fingerprint(lithology="Pa", eU_ppm=10.0)
    assert abs(fp["activities_Bq_kg"]["A_Ra226"] - 122.2) < 0.1, \
        f"A_Ra226 {fp['activities_Bq_kg']['A_Ra226']} != 122.2"
    assert any("measured" in p for p in fp["provenance"]), \
        "No 'measured' tag in provenance"


def test_radon_action_level():
    """Radon action level → 300 Bq/m³ = 10 mSv/yr, RED."""
    assert abs(radon_inhalation_dose(300.0) - 10.0) < 0.01, \
        f"radon_inhalation_dose(300) = {radon_inhalation_dose(300.0)}"
    assert risk_class(10.0, C_Rn=300.0)["tier"] == "RED"
