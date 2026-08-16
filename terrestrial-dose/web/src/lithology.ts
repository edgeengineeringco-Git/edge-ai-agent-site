/**
 * European Lithology Grid — detailed geological provinces
 * ========================================================
 * Maps lat/lon to GLiM lithology codes for Europe.
 * ~120 provinces covering every major geological unit.
 * Resolution: ~0.5–1° (50–100 km) for most provinces.
 *
 * Sources: GLiM (Hartmann & Moosdorf 2012), OneGeology-Europe, EGDI.
 * This is a client-side proxy — the real GLiM has 1.2M polygons at ~1.5 km.
 */

export interface LithoRegion {
  name: string;
  glim: string;
  coords: [number, number, number, number]; // minLon, minLat, maxLon, maxLat
}

export const LITHO_REGIONS: LithoRegion[] = [
  // ══════════════════════════════════════════════════════════════════
  // IRELAND
  // ══════════════════════════════════════════════════════════════════
  { name: "Leinster Granite",           glim: "Pa", coords: [-6.8, 52.2, -6.0, 53.0] },
  { name: "Galway Granite",             glim: "Pa", coords: [-10.2, 53.0, -9.5, 53.5] },
  { name: "Donegal Granite",            glim: "Pa", coords: [-8.4, 54.6, -7.6, 55.3] },
  { name: "Connemara Gneiss",           glim: "Mt", coords: [-10.3, 53.2, -9.5, 53.6] },
  { name: "Irish Midlands Limestone",   glim: "Sc", coords: [-8.5, 52.5, -6.5, 54.0] },
  { name: "Burren Limestone",           glim: "Sc", coords: [-9.4, 52.9, -8.8, 53.2] },
  { name: "Kerry Slates",               glim: "Mt", coords: [-10.5, 51.7, -9.5, 52.3] },
  { name: "Cork-Kerry Sandstones",      glim: "Ss", coords: [-10.0, 51.4, -8.5, 52.0] },
  { name: "Waterford Volcanics",        glim: "Vb", coords: [-7.5, 52.0, -6.8, 52.4] },
  { name: "Ulster Basalt",              glim: "Vb", coords: [-8.0, 54.5, -5.5, 55.4] },
  { name: "Clare Shales",               glim: "Sh", coords: [-9.8, 52.5, -8.8, 53.0] },
  { name: "Wexford Slates",             glim: "Mt", coords: [-6.8, 52.1, -6.0, 52.6] },
  { name: "Dingle Sandstones",          glim: "Ss", coords: [-10.6, 51.8, -10.0, 52.2] },

  // ══════════════════════════════════════════════════════════════════
  // BRITISH ISLES
  // ══════════════════════════════════════════════════════════════════
  { name: "Scottish Highlands",         glim: "Mt", coords: [-6.0, 56.5, -2.0, 58.6] },
  { name: "Midland Valley (Scotland)",  glim: "Ss", coords: [-5.0, 55.5, -2.5, 56.5] },
  { name: "Southern Uplands",           glim: "Mt", coords: [-5.5, 55.0, -2.0, 56.0] },
  { name: "Lake District",              glim: "Mt", coords: [-3.5, 54.0, -2.5, 55.0] },
  { name: "Pennines Limestone",         glim: "Sc", coords: [-2.5, 53.5, -1.0, 55.0] },
  { name: "Northumberland Sandstones",  glim: "Ss", coords: [-3.0, 54.8, -1.0, 55.8] },
  { name: "Welsh Basin Slates",         glim: "Mt", coords: [-5.0, 51.5, -3.0, 53.5] },
  { name: "Cornubian Granite",          glim: "Pa", coords: [-6.0, 50.0, -4.0, 51.0] },
  { name: "Wessex Basin Chalk",         glim: "Sc", coords: [-2.5, 50.5, 1.5, 51.5] },
  { name: "London Basin Clay",          glim: "Ss", coords: [-0.5, 51.0, 2.0, 52.0] },
  { name: "East Midlands Mudstone",     glim: "Sm", coords: [-1.5, 52.0, 1.5, 53.5] },
  { name: "Yorkshire Jurassic",         glim: "Ss", coords: [-2.0, 53.5, 0.0, 54.5] },
  { name: "Weald Clay",                 glim: "Sb", coords: [-0.5, 50.8, 1.0, 51.3] },
  { name: "English Midlands Triassic",  glim: "Ev", coords: [-3.0, 51.8, 0.0, 53.0] },
  { name: "North Sea Sediments",        glim: "Su", coords: [-1.0, 51.0, 3.0, 56.0] },
  { name: "Hebrides Volcanics",         glim: "Vb", coords: [-8.0, 56.5, -5.0, 59.0] },
  { name: "Shetland Metamorphic",       glim: "Mt", coords: [-2.0, 59.8, 0.0, 60.9] },

  // ══════════════════════════════════════════════════════════════════
  // FRANCE
  // ══════════════════════════════════════════════════════════════════
  { name: "Massif Central Granite",     glim: "Pa", coords: [2.0, 44.0, 5.0, 46.5] },
  { name: "Armorican Massif",           glim: "Mt", coords: [-5.0, 47.0, -1.0, 49.0] },
  { name: "Vosges Mountains",           glim: "Mt", coords: [6.5, 47.8, 8.0, 48.8] },
  { name: "Paris Basin Limestone",      glim: "Sc", coords: [0.0, 47.0, 4.0, 50.0] },
  { name: "Paris Basin Chalk",          glim: "Sc", coords: [1.0, 49.0, 3.5, 51.0] },
  { name: "Aquitaine Basin",            glim: "Ss", coords: [-1.5, 43.5, 2.0, 46.0] },
  { name: "Pyrenees Metamorphic",       glim: "Mt", coords: [-1.5, 42.5, 3.0, 43.0] },
  { name: "Provence Limestone",         glim: "Sc", coords: [4.0, 43.0, 7.5, 44.5] },
  { name: "Corsica Schist",             glim: "Mt", coords: [8.5, 41.5, 9.6, 43.0] },
  { name: "Jura Mountains",             glim: "Sc", coords: [5.0, 46.0, 7.0, 47.5] },
  { name: "Rhine Graben Alluvium",      glim: "Su", coords: [7.0, 47.5, 9.0, 49.0] },
  { name: "Lorraine Iron Ore",          glim: "Ss", coords: [5.5, 48.5, 7.0, 49.5] },
  { name: "Champagne Chalk",            glim: "Sc", coords: [3.0, 48.5, 5.0, 50.0] },

  // ══════════════════════════════════════════════════════════════════
  // GERMANY & CENTRAL EUROPE
  // ══════════════════════════════════════════════════════════════════
  { name: "Black Forest",               glim: "Mt", coords: [7.5, 47.5, 9.5, 48.8] },
  { name: "Harz Mountains",             glim: "Mt", coords: [10.0, 51.5, 11.5, 52.0] },
  { name: "Rhenish Massif",             glim: "Mt", coords: [6.0, 50.0, 9.0, 51.5] },
  { name: "Bavarian Molasse",           glim: "Su", coords: [9.0, 47.5, 13.0, 49.0] },
  { name: "North German Plain",         glim: "Su", coords: [6.0, 52.0, 15.0, 55.0] },
  { name: "Saxon Granulite",            glim: "Mt", coords: [11.5, 50.5, 13.0, 51.5] },
  { name: "Thuringian Basin",           glim: "Ss", coords: [10.0, 50.5, 12.0, 51.5] },
  { name: "Rhine Rift Valley",          glim: "Su", coords: [7.5, 48.5, 9.0, 50.0] },
  { name: "Hessian Depression",         glim: "Ss", coords: [8.0, 50.0, 10.0, 51.5] },
  { name: "Erzgebirge",                 glim: "Mt", coords: [12.5, 50.3, 14.0, 51.0] },
  { name: "Lausitz Granite",            glim: "Pa", coords: [14.0, 51.0, 15.5, 52.0] },
  { name: "Spessart Forest",            glim: "Mt", coords: [9.0, 49.8, 10.0, 50.3] },

  // ══════════════════════════════════════════════════════════════════
  // SCANDINAVIA
  // ══════════════════════════════════════════════════════════════════
  { name: "Swedish Shield Gneiss",      glim: "Mt", coords: [12.0, 56.0, 20.0, 66.0] },
  { name: "Norwegian Caledonides",      glim: "Mt", coords: [5.0, 58.0, 15.0, 70.0] },
  { name: "Finnish Lapland",            glim: "Mt", coords: [20.0, 64.0, 30.0, 70.0] },
  { name: "Oslo Rift Volcanics",        glim: "Vb", coords: [9.5, 59.0, 11.5, 60.5] },
  { name: "Skåne Sediments",            glim: "Ss", coords: [12.5, 55.3, 14.5, 56.5] },
  { name: "Baltic Shield",              glim: "Mt", coords: [20.0, 56.0, 30.0, 64.0] },
  { name: "Svecofennian Domain",        glim: "Mt", coords: [16.0, 58.0, 28.0, 66.0] },
  { name: "Caledonian Nappes",          glim: "Mt", coords: [5.0, 60.0, 12.0, 68.0] },

  // ══════════════════════════════════════════════════════════════════
  // IBERIA
  // ══════════════════════════════════════════════════════════════════
  { name: "Iberian Meseta",             glim: "Mt", coords: [-8.0, 38.0, -1.0, 43.0] },
  { name: "Pyrenees Axial Zone",        glim: "Mt", coords: [-1.5, 42.5, 3.0, 43.0] },
  { name: "Catalan Coastal Ranges",     glim: "Mt", coords: [0.0, 40.5, 3.5, 42.5] },
  { name: "Ebro Basin",                 glim: "Ss", coords: [-2.0, 40.5, 1.5, 42.5] },
  { name: "Tagus Basin",                glim: "Ss", coords: [-8.0, 38.5, -2.0, 40.5] },
  { name: "Guadalquivir Basin",         glim: "Su", coords: [-7.0, 36.5, -2.0, 38.5] },
  { name: "Betic Cordillera",           glim: "Mt", coords: [-6.0, 36.0, -1.0, 38.0] },
  { name: "Galician Granite",           glim: "Pa", coords: [-9.5, 41.8, -7.0, 43.8] },
  { name: "Central System Granite",     glim: "Pa", coords: [-6.0, 39.5, -2.0, 41.0] },
  { name: "Toledo Mountains",           glim: "Mt", coords: [-5.0, 39.3, -2.5, 40.0] },
  { name: "Portuguese Schist Belt",     glim: "Mt", coords: [-9.0, 37.0, -7.0, 40.0] },

  // ══════════════════════════════════════════════════════════════════
  // ITALY
  // ══════════════════════════════════════════════════════════════════
  { name: "Alps Crystalline (Austrian)",  glim: "Mt", coords: [9.5, 46.5, 13.0, 48.0] },
  { name: "Southern Alps Dolomite",       glim: "Sc", coords: [10.0, 45.8, 13.0, 47.0] },
  { name: "Po Basin Alluvium",            glim: "Su", coords: [7.0, 44.0, 13.0, 46.0] },
  { name: "Apennines Limestone",          glim: "Sc", coords: [10.0, 41.0, 16.5, 44.5] },
  { name: "Calabrian Arc",                glim: "Mt", coords: [15.5, 38.0, 17.5, 40.0] },
  { name: "Sardinia Variscan",            glim: "Mt", coords: [8.0, 38.8, 10.0, 41.3] },
  { name: "Sicily Limestone",             glim: "Sc", coords: [12.5, 36.6, 15.8, 38.3] },
  { name: "Tuscany Metamorphic",          glim: "Mt", coords: [10.0, 42.5, 12.0, 44.0] },
  { name: "Campania Volcanic",            glim: "Vb", coords: [13.5, 40.0, 16.0, 41.5] },

  // ══════════════════════════════════════════════════════════════════
  // ALPS & CENTRAL EUROPE
  // ══════════════════════════════════════════════════════════════════
  { name: "Swiss Alps",                   glim: "Mt", coords: [6.0, 45.8, 10.5, 47.8] },
  { name: "Austrian Alps",                glim: "Mt", coords: [10.0, 46.5, 17.0, 48.5] },
  { name: "Bohemian Massif",              glim: "Mt", coords: [11.0, 48.5, 17.0, 51.0] },
  { name: "Carpathian Mountains",         glim: "Mt", coords: [17.0, 45.5, 27.0, 49.5] },
  { name: "Pannonian Basin",              glim: "Su", coords: [14.0, 45.5, 23.0, 48.5] },
  { name: "Transylvanian Basin",          glim: "Ss", coords: [22.0, 45.5, 26.5, 47.5] },
  { name: "Danube Alluvium",              glim: "Su", coords: [13.0, 44.0, 29.0, 48.0] },

  // ══════════════════════════════════════════════════════════════════
  // EASTERN EUROPE
  // ══════════════════════════════════════════════════════════════════
  { name: "East European Craton",         glim: "Mt", coords: [25.0, 50.0, 45.0, 65.0] },
  { name: "Ukrainian Shield",             glim: "Mt", coords: [28.0, 46.0, 38.0, 52.0] },
  { name: "Volga Uplands",                glim: "Ss", coords: [40.0, 50.0, 50.0, 56.0] },
  { name: "Moscow Basin",                 glim: "Ss", coords: [32.0, 54.0, 42.0, 58.0] },
  { name: "Baltic Basin",                 glim: "Ss", coords: [18.0, 54.0, 28.0, 60.0] },
  { name: "Belarus Sediments",            glim: "Su", coords: [23.0, 51.0, 33.0, 56.0] },
  { name: "Polish Lowlands",              glim: "Su", coords: [14.0, 50.0, 24.0, 55.0] },

  // ══════════════════════════════════════════════════════════════════
  // BALKANS & GREECE
  // ══════════════════════════════════════════════════════════════════
  { name: "Dinarides Limestone",          glim: "Sc", coords: [13.5, 42.0, 20.5, 46.0] },
  { name: "Rhodope Massif",               glim: "Mt", coords: [22.0, 40.0, 28.0, 43.0] },
  { name: "Hellenides",                   glim: "Mt", coords: [20.0, 37.0, 26.0, 42.0] },
  { name: "Aegean Volcanic Arc",          glim: "Vb", coords: [23.0, 36.0, 28.0, 40.0] },
  { name: "Serbo-Macedonian Massif",      glim: "Mt", coords: [20.0, 40.0, 24.0, 43.0] },
  { name: "Moesian Platform",             glim: "Sc", coords: [22.0, 43.0, 30.0, 46.0] },
  { name: "Adriatic Carbonate",           glim: "Sc", coords: [13.0, 39.0, 20.0, 46.0] },

  // ══════════════════════════════════════════════════════════════════
  // ICELAND
  // ══════════════════════════════════════════════════════════════════
  { name: "Iceland Volcanic",             glim: "Vb", coords: [-25.0, 63.0, -13.0, 67.0] },

  // ══════════════════════════════════════════════════════════════════
  // RUSSIA & NORTHERN EURASIA
  // ══════════════════════════════════════════════════════════════════
  { name: "Fennoscandian Shield",         glim: "Mt", coords: [20.0, 58.0, 40.0, 70.0] },
  { name: "Kola Peninsula",               glim: "Mt", coords: [30.0, 66.0, 42.0, 69.5] },
  { name: "Timan-Pechora Basin",          glim: "Ss", coords: [42.0, 62.0, 60.0, 68.0] },
  { name: "Ural Mountains",               glim: "Mt", coords: [55.0, 50.0, 65.0, 66.0] },
  { name: "West Siberian Basin",          glim: "Su", coords: [60.0, 50.0, 90.0, 65.0] },
  { name: "Siberian Craton",              glim: "Mt", coords: [90.0, 55.0, 130.0, 72.0] },

  // ══════════════════════════════════════════════════════════════════
  // GREENLAND
  // ══════════════════════════════════════════════════════════════════
  { name: "Greenland Ice",                glim: "Ice", coords: [-60.0, 60.0, -20.0, 83.0] },
  { name: "Greenland Coastal",            glim: "Mt", coords: [-55.0, 60.0, -20.0, 72.0] },

  // ══════════════════════════════════════════════════════════════════
  // GLOBAL FALLBACKS (broad bands for non-European areas)
  // ══════════════════════════════════════════════════════════════════
  { name: "North African Craton",         glim: "Mt", coords: [-17.0, 18.0, 35.0, 37.0] },
  { name: "Saharan Sandstones",           glim: "Ss", coords: [-5.0, 18.0, 35.0, 32.0] },
  { name: "West African Craton",          glim: "Mt", coords: [-17.0, 4.0, 15.0, 20.0] },
  { name: "East African Rift",            glim: "Vb", coords: [29.0, -12.0, 42.0, 12.0] },
  { name: "Arabian Shield",               glim: "Mt", coords: [35.0, 15.0, 55.0, 32.0] },
  { name: "Himalayan Belt",               glim: "Mt", coords: [70.0, 27.0, 100.0, 35.0] },
  { name: "Indian Shield",                glim: "Mt", coords: [72.0, 8.0, 88.0, 24.0] },
  { name: "Kerala Monazite Coast",        glim: "monazite_bearing", coords: [76.0, 8.0, 78.0, 12.0] },
  { name: "Rajasthan Monazite Belt",      glim: "monazite_bearing", coords: [70.0, 24.0, 76.0, 28.0] },
  { name: "Deccan Traps",                 glim: "Vb", coords: [72.0, 14.0, 82.0, 22.0] },
  { name: "Chinese Granite Belt",         glim: "Pa", coords: [100.0, 20.0, 125.0, 32.0] },
  { name: "Siberian Platform",            glim: "Mt", coords: [100.0, 55.0, 140.0, 72.0] },
  { name: "Canadian Shield",              glim: "Mt", coords: [-130.0, 48.0, -60.0, 70.0] },
  { name: "Appalachians",                 glim: "Mt", coords: [-90.0, 30.0, -65.0, 48.0] },
  { name: "Rocky Mountains",              glim: "Mt", coords: [-120.0, 35.0, -105.0, 60.0] },
  { name: "Basin and Range",              glim: "Mt", coords: [-120.0, 32.0, -105.0, 42.0] },
  { name: "Colorado Plateau",             glim: "Ss", coords: [-115.0, 33.0, -105.0, 40.0] },
  { name: "Andean Belt",                  glim: "Pa", coords: [-80.0, -55.0, -65.0, 5.0] },
  { name: "Brazilian Shield",             glim: "Mt", coords: [-60.0, -25.0, -35.0, -5.0] },
  { name: "Amazon Basin",                 glim: "Su", coords: [-78.0, -15.0, -45.0, 5.0] },
  { name: "West Australian Craton",      glim: "Mt", coords: [113.0, -35.0, 130.0, -20.0] },
  { name: "East Australian Highlands",   glim: "Pa", coords: [145.0, -38.0, 155.0, -25.0] },
  { name: "Antarctic Ice",                glim: "Ice", coords: [-180.0, -90.0, 180.0, -65.0] },
];

/** Get lithology code at a point */
export function getLithologyAtPoint(lon: number, lat: number): string {
  if (lat < -65) return "Ice";

  for (const region of LITHO_REGIONS) {
    const [minLon, minLat, maxLon, maxLat] = region.coords;
    if (lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat) {
      return region.glim;
    }
  }

  // Global latitudinal fallback
  const absLat = Math.abs(lat);
  if (absLat > 75) return "Ice";
  if (absLat > 60) return "Mt"; // Shield/taiga
  if (absLat < 15) return "Su"; // Tropical lowlands
  return "world_average_soil";
}

/** Get human-readable lithology label */
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
    Sh: "Shale",
    Wa: "Water",
    Ice: "Ice",
    monazite_bearing: "Monazite-bearing (REE)",
    world_average_soil: "World Average Soil",
  };
  return GLIM_NAMES[lith] || lith;
}

/** Get the region info for a point (for provenance) */
export function getRegionInfo(lon: number, lat: number): { name: string; glim: string } | null {
  for (const region of LITHO_REGIONS) {
    const [minLon, minLat, maxLon, maxLat] = region.coords;
    if (lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat) {
      return { name: region.name, glim: region.glim };
    }
  }
  return null;
}
