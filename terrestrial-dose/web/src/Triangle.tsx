/**
 * Triangle.tsx — D3 three-arm dose triangle (VisQuill-style)
 * ==================================================================
 * Three arms from a common origin, 120° apart:
 *   Arm 1 (up):         radon (Rn-222), color blue   #3b82f6
 *   Arm 2 (lower-left): thoron (Rn-220), color orange #f97316
 *   Arm 3 (lower-right):gamma (K/U/Th), color green   #22c55e
 *
 * Arm length proportional to dose (mSv/yr), normalized to viewport max.
 * Fill the triangle with the dominant-source color at low alpha.
 */

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { DoseFingerprint } from "./dose_core";

interface TriangleProps {
  data: DoseFingerprint | null;
  size?: number;
  compact?: boolean; // small glyph mode for map
}

const ARM_COLORS = {
  radon: "#3b82f6",
  thoron: "#f97316",
  gamma: "#22c55e",
};

const ARM_LABELS = {
  radon: "RADON",
  thoron: "THORON",
  gamma: "GAMMA",
};

const ARM_ANGLE = {
  radon: -Math.PI / 2,          // up (12 o'clock)
  thoron: -Math.PI / 2 + (2 * Math.PI / 3), // lower-left (240°)
  gamma: -Math.PI / 2 + (4 * Math.PI / 3),  // lower-right (120°)
};

export default function Triangle({ data, size = 280, compact = false }: TriangleProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const W = size;
    const H = size;
    const cx = W / 2;
    const cy = H / 2 + (compact ? 0 : 10);
    const maxR = compact ? W * 0.42 : W * 0.38;

    // Normalise: find max dose across all arms (use a fixed ceiling for comparison)
    const ceiling = 10; // 10 mSv/yr = RED threshold
    const maxVal = Math.max(ceiling, data.arms_mSv_yr.radon, data.arms_mSv_yr.thoron, data.arms_mSv_yr.gamma, 0.5);

    const arms = [
      { key: "radon", value: data.arms_mSv_yr.radon, angle: ARM_ANGLE.radon, color: ARM_COLORS.radon, label: ARM_LABELS.radon },
      { key: "thoron", value: data.arms_mSv_yr.thoron, angle: ARM_ANGLE.thoron, color: ARM_COLORS.thoron, label: ARM_LABELS.thoron },
      { key: "gamma", value: data.arms_mSv_yr.gamma, angle: ARM_ANGLE.gamma, color: ARM_COLORS.gamma, label: ARM_LABELS.gamma },
    ];

    // ── Grid circles (concentric) ──
    const gridSteps = 5;
    const gridGroup = svg.append("g").attr("class", "grid");

    for (let i = 1; i <= gridSteps; i++) {
      const r = (maxR / gridSteps) * i;
      gridGroup.append("circle")
        .attr("cx", cx).attr("cy", cy).attr("r", r)
        .attr("fill", "none")
        .attr("stroke", "rgba(255,255,255,0.06)")
        .attr("stroke-width", 1);
    }

    // UNSCEAR reference circle (2.2 mSv/yr)
    const refR = maxR * (2.2 / maxVal);
    if (refR > 3) {
      gridGroup.append("circle")
        .attr("cx", cx).attr("cy", cy).attr("r", refR)
        .attr("fill", "none")
        .attr("stroke", "rgba(255,255,255,0.15)")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3");
    }

    // ── Axis lines ──
    arms.forEach(arm => {
      const x2 = cx + Math.cos(arm.angle) * maxR;
      const y2 = cy + Math.sin(arm.angle) * maxR;
      gridGroup.append("line")
        .attr("x1", cx).attr("y1", cy)
        .attr("x2", x2).attr("y2", y2)
        .attr("stroke", "rgba(255,255,255,0.08)")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "2,3");
    });

    // ── Triangle fill ──
    const vertices = arms.map(arm => {
      const r = (arm.value / maxVal) * maxR;
      return {
        x: cx + Math.cos(arm.angle) * r,
        y: cy + Math.sin(arm.angle) * r,
        color: arm.color,
        label: arm.label,
        value: arm.value,
        nx: cx + Math.cos(arm.angle) * (maxR + (compact ? 10 : 24)),
        ny: cy + Math.sin(arm.angle) * (maxR + (compact ? 10 : 24)),
      };
    });

    // Find dominant arm
    const dominant = arms.reduce((a, b) => a.value > b.value ? a : b);
    const fillColor = ARM_COLORS[dominant.key as keyof typeof ARM_COLORS];

    // Triangle path
    const trianglePath = d3.line<{ x: number; y: number }>()
      .x(d => d.x).y(d => d.y)
      .curve(d3.curveLinearClosed);

    // Gradient for fill
    const defs = svg.append("defs");
    const gradId = "tri-gradient";
    const grad = defs.append("radialGradient")
      .attr("id", gradId)
      .attr("cx", "50%").attr("cy", "50%").attr("r", "50%");
    grad.append("stop").attr("offset", "0%").attr("stop-color", fillColor).attr("stop-opacity", 0.35);
    grad.append("stop").attr("offset", "100%").attr("stop-color", fillColor).attr("stop-opacity", 0.08);

    // Triangle shape
    svg.append("path")
      .datum(vertices)
      .attr("d", trianglePath)
      .attr("fill", `url(#${gradId})`)
      .attr("stroke", fillColor)
      .attr("stroke-width", compact ? 1.5 : 2)
      .attr("stroke-opacity", 0.8);

    // Drop shadow filter
    const filter = defs.append("filter")
      .attr("id", "tri-shadow")
      .attr("x", "-50%").attr("y", "-50%")
      .attr("width", "200%").attr("height", "200%");
    filter.append("feGaussianBlur")
      .attr("stdDeviation", 3)
      .attr("in", "SourceAlpha");
    filter.append("feOffset")
      .attr("dx", 0).attr("dy", 2)
      .attr("result", "offsetblur");
    filter.append("feComponentTransfer")
      .append("feFuncA")
      .attr("type", "linear")
      .attr("slope", 0.3);

    // ── Arm endpoints (circles) ──
    vertices.forEach(v => {
      svg.append("circle")
        .attr("cx", v.x).attr("cy", v.y)
        .attr("r", compact ? 3 : 5)
        .attr("fill", v.color)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5);
    });

    if (!compact) {
      // ── Labels ──
      const labelGroup = svg.append("g").attr("class", "labels");
      vertices.forEach(v => {
        const anchor = v.label === "RADON" ? "middle" : v.label === "GAMMA" ? "start" : "end";

        // Label icon dot
        labelGroup.append("circle")
          .attr("cx", v.nx - (v.label === "RADON" ? 0 : v.label === "GAMMA" ? -10 : 10))
          .attr("cy", v.ny - 12)
          .attr("r", 3)
          .attr("fill", v.color);

        // Label text
        labelGroup.append("text")
          .attr("x", v.nx + (v.label === "RADON" ? 0 : v.label === "GAMMA" ? 6 : -6))
          .attr("y", v.ny - 8)
          .attr("text-anchor", anchor)
          .attr("fill", v.color)
          .attr("font-size", "10px")
          .attr("font-weight", "700")
          .attr("letter-spacing", "1.5px")
          .text(v.label);

        // Value text
        labelGroup.append("text")
          .attr("x", v.nx + (v.label === "RADON" ? 0 : v.label === "GAMMA" ? 6 : -6))
          .attr("y", v.ny + 7)
          .attr("text-anchor", anchor)
          .attr("fill", "#e2e8f0")
          .attr("font-size", "13px")
          .attr("font-weight", "700")
          .attr("font-family", "JetBrains Mono, monospace")
          .text(v.value.toFixed(2) + " mSv/yr");
      });

      // Center total label
      labelGroup.append("text")
        .attr("x", cx)
        .attr("y", cy + 4)
        .attr("text-anchor", "middle")
        .attr("fill", "rgba(255,255,255,0.6)")
        .attr("font-size", "11px")
        .attr("font-family", "JetBrains Mono, monospace")
        .attr("font-weight", "600")
        .text(data.total_terrestrial_mSv_yr.toFixed(2));

      labelGroup.append("text")
        .attr("x", cx)
        .attr("y", cy + 18)
        .attr("text-anchor", "middle")
        .attr("fill", "rgba(255,255,255,0.3)")
        .attr("font-size", "8px")
        .attr("font-family", "JetBrains Mono, monospace")
        .text("mSv/yr");

      // UNSCEAR reference label
      if (refR > 10) {
        labelGroup.append("text")
          .attr("x", cx + refR + 4)
          .attr("y", cy - 2)
          .attr("fill", "rgba(255,255,255,0.3)")
          .attr("font-size", "8px")
          .attr("font-family", "JetBrains Mono, monospace")
          .text("2.2 avg");
      }
    }

  }, [data, size, compact]);

  if (!data) {
    return (
      <div className="triangle-empty" style={{ width: size, height: size }}>
        <div className="triangle-empty-text">Click map to analyse</div>
      </div>
    );
  }

  return <svg ref={svgRef} width={size} height={size} style={{ display: "block", margin: "0 auto" }} />;
}
