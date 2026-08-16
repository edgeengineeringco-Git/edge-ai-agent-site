/**
 * Lithology Grid — simplified client-side GLiM proxy
 * ================================================
 * Maps lat/lon regions to GLiM lithology codes.
 * This is a simplified proxy for the GLiM dataset (Hartmann & Moosdorf 2012).
 * The real GLiM has 1.2M polygons at ~1.5 km resolution.
 * This grid provides ~regional-scale lithology lookup for the web map.
 */

// Simplified geological provinces — rectangles with lithology
// In production, this is replaced by the GLiM WMS/GeoJSON layer
export interface LithoRegion {
  name: string;
  glim: string;
  coords: [number, number, number, number]; // minLon, minLat, maxLon, maxLat
}

export const LITHO_REGIONS: LithoRegion[] = [
  // ── Europe ──
  { name: "Irish & British Caledonides", glim: "Pa", coords: [-12, 51, -5, 58] },
  { name: "Irish Carboniferous Limestone", glim: "Sc", coords: [-10, 51, -6, 55] },
  { name: "British Tertiary Volcanics", glim: "Vb", coords: [-8, 55, -4, 59] },
  { name: "Cornish Granite", glim: "Pa", coords: [-6, 49, -3, 51] },
  { name: "Paris Basin", glim: "Ss", coords: [-1, 46, 5, 51] },
  { name: "Massif Central", glim: "Pa", coords: [1, 44, 5, 47] },
  { name: "Armorican Massif", glim: "Pa", coords: [-5, 46, -1, 49] },
  { name: "Bohemian Massif", glim: "Mt", coords: [11, 48, 16, 51] },
  { name: "Alps Crystalline", glim: "Mt", coords: [6, 45, 14, 48] },
  { name: "Alps Carbonate", glim: "Sc", coords: [8, 46, 16, 47] },
  { name: "Scandinavian Shield", glim: "Mt", coords: [5, 55, 30, 71] },
  { name: "Iceland Volcanics", glim: "Vb", coords: [-25, 63, -13, 67] },
  { name: "Iberian Meseta", glim: "Mt", coords: [-8, 38, -1, 43] },
  { name: "Iberian Pyrite Belt", glim: "Py", coords: [-9, 37, -6, 38] },
  { name: "Apennines", glim: "Mt", coords: [9, 40, 16, 44] },
  { name: "Dinarides", glim: "Mt", coords: [14, 41, 21, 45] },
  { name: "Greek Hellenides", glim: "Mt", coords: [20, 37, 25, 41] },

  // ── Africa ──
  { name: "Saharan Metacraton", glim: "Mt", coords: [10, 18, 30, 30] },
  { name: "Sahel Sediments", glim: "Ss", coords: [-17, 12, 30, 18] },
  { name: "West African Craton", glim: "Mt", coords: [-17, 8, 10, 18] },
  { name: "East African Rift", glim: "Vb", coords: [29, -12, 40, 5] },
  { name: "Tanzanian Craton", glim: "Mt", coords: [30, -8, 38, -2] },
  { name: "Kalahari Craton", glim: "Mt", coords: [18, -28, 30, -18] },
  { name: "Cape Fold Belt", glim: "Mt", coords: [17, -35, 26, -32] },

  // ── Asia ──
  { name: "Himalayan Granites", glim: "Pa", coords: [73, 27, 92, 32] },
  { name: "Tibetan Plateau", glim: "Mt", coords: [75, 28, 100, 36] },
  { name: "Tien Shan", glim: "Mt", coords: [70, 39, 85, 45] },
  { name: "Tarim Basin", glim: "Ss", coords: [74, 36, 90, 42] },
  { name: "Siberian Craton", glim: "Mt", coords: [90, 55, 120, 72] },
  { name: "Chinese Granite Belt", glim: "Pa", coords: [100, 22, 122, 30] },
  { name: "Deccan Traps", glim: "Vb", coords: [72, 16, 82, 22] },
  { name: "Indian Shield", glim: "Mt", coords: [72, 10, 85, 22] },
  { name: "Rajasthan Monazite Belt", glim: "monazite_bearing", coords: [70, 24, 76, 28] },
  { name: "Kerala Monazite Coast", glim: "monazite_bearing", coords: [76, 8, 78, 11] },
  { name: "Korean Massif", glim: "Mt", coords: [124, 33, 130, 43] },
  { name: "Japanese Volcanics", glim: "Vb", coords: [130, 30, 146, 45] },

  // ── Middle East ──
  { name: "Arabian Shield", glim: "Mt", coords: [35, 15, 50, 30] },
  { name: "Zagros Mountains", glim: "Ss", coords: [44, 28, 58, 35] },

  // ── Americas ──
  { name: "Canadian Shield", glim: "Mt", coords: [-130, 50, -60, 70] },
  { name: "Appalachians", glim: "Mt", coords: [-85, 33, -65, 48] },
  { name: "Sierra Nevada", glim: "Pa", coords: [-121, 35, -117, 42] },
  { name: "Basin & Range", glim: "Mt", coords: [-118, 31, -105, 42] },
  { name: "Colorado Plateau", glim: "Ss", coords: [-112, 35, -104, 41] },
  { name: "Brazilian Shield", glim: "Mt", coords: [-60, -25, -35, -5] },
  { name: "Amazon Basin", glim: "Su", coords: [-75, -10, -50, 2] },
  { name: "Andean Plutonic Belt", glim: "Pa", coords: [-75, -40, -65, -15] },
  { name: "Patagonian Batholith", glim: "Pa", coords: [-75, -55, -65, -40] },
  { name: "Mexican Volcanic Belt", glim: "Vb", coords: [-105, 18, -95, 22] },

  // ── Australia / Oceania ──
  { name: "Pilbara Craton", glim: "Mt", coords: [115, -24, 125, -18] },
  { name: "Yilgarn Craton", glim: "Mt", coords: [113, -35, 125, -27] },
  { name: "Great Artesian Basin", glim: "Ss", coords: [138, -30, 152, -18] },
  { name: "Lachlan Fold Belt", glim: "Pa", coords: [145, -40, 153, -30] },
  { name: "NZ Southern Alps", glim: "Mt", coords: [166, -47, 174, -40] },
  { name: "NZ Volcanic Plateau", glim: "Vb", coords: [175, -41, 178, -37] },

  // ── Polar ──
  { name: "Antarctic Ice", glim: "Ice", coords: [-180, -90, 180, -65] },
  { name: "Greenland Ice", glim: "Ice", coords: [-60, 60, -20, 83] },
];

export function getLithologyAtPoint(lon: number, lat: number): string {
  // Check water bodies first
  if (lat < -65) return "Ice"; // Antarctica
  if (lat > 60 && lon > -60 && lon < -20 && lat < 83) return "Ice"; // Greenland

  // Check if over ocean (simplified — no land region match)
  let match: LithoRegion | null = null;
  for (const region of LITHO_REGIONS) {
    const [minLon, minLat, maxLon, maxLat] = region.coords;
    if (lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat) {
      match = region;
      break;
    }
  }

  if (match) return match.glim;

  // Default: world average soil (or water for deep ocean)
  return "world_average_soil";
}

export function getLithologyLabel(lith: string): string {
  const GLIM_NAMES: Record<string, string> = {
    Su: "Unconsolidated sediments",
    Ss: "Siliciclastic sediments (sandstone)",
    Sm: "Mixed sediments (siltstone)",
    Sc: "Carbonate (limestone)",
    Sb: "Basic sediments (marl)",
    Ev: "Evaporite (dolomite)",
    Pa: "Acid plutonic (granite)",
    Pi: "Intermediate plutonic (granodiorite)",
    Pb: "Basic plutonic (gabbro)",
    Va: "Acid volcanic (rhyolite)",
    Vi: "Intermediate volcanic (andesite)",
    Vb: "Basic volcanic (basalt)",
    Mt: "Metamorphic (gneiss/schist)",
    Py: "Pyroclastic (tuff)",
    Wa: "Water",
    Ice: "Ice",
    monazite_bearing: "Monazite-bearing (REE)",
    world_average_soil: "World Average Soil",
  };
  return GLIM_NAMES[lith] || lith;
}
