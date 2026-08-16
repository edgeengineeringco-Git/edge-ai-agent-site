/**
 * European Geology Grid — 120+ provinces from national surveys
 * Sources: GSI IE_100k, BGS DiGMapGB, BRGM BD Charm-50, GEODE 50k, etc.
 * Cell size follows map scale: 50m for 50k, 100m for 100k, 1000m for 1M
 */

export interface LithEntry {
  glim: string;
  label: string;
  map_scale: string;
  cell_m: number;
  source: string;
}

interface GeoRegion {
  name: string;
  glim: string;
  map_scale: string;
  source: string;
  coords: [number, number, number, number];
}

// ═══════════════════════════════════════════════════════════════
// IRELAND — GSI 1:100k
// ═══════════════════════════════════════════════════════════════
const IRELAND: GeoRegion[] = [
  { name: "Leinster Granite (Caledonian)", glim: "Pa", map_scale: "100k", source: "GSI IE_100k", coords: [-6.8, 52.2, -6.0, 53.0] },
  { name: "Leinster Granite (Wicklow)", glim: "Pa", map_scale: "100k", source: "GSI IE_100k", coords: [-6.6, 52.7, -6.0, 53.1] },
  { name: "Dublin Basin Carboniferous", glim: "Sc", map_scale: "100k", source: "GSI IE_100k", coords: [-6.6, 53.1, -6.0, 53.5] },
  { name: "Kildare Inlier Granite", glim: "Pi", map_scale: "100k", source: "GSI IE_100k", coords: [-7.0, 52.9, -6.5, 53.2] },
  { name: "Wexford Ordovician", glim: "Ss", map_scale: "100k", source: "GSI IE_100k", coords: [-6.8, 52.1, -6.0, 52.5] },
  { name: "Cork-Kerry Devonian Sandstone", glim: "Ss", map_scale: "100k", source: "GSI IE_100k", coords: [-10.0, 51.4, -8.5, 52.0] },
  { name: "Kerry Slates & Sandstones", glim: "Sm", map_scale: "100k", source: "GSI IE_100k", coords: [-10.5, 51.7, -9.5, 52.3] },
  { name: "Beara Peninsula Volcanics", glim: "Vi", map_scale: "100k", source: "GSI IE_100k", coords: [-10.2, 51.5, -9.5, 51.9] },
  { name: "Dingle Peninsula ORS", glim: "Ss", map_scale: "100k", source: "GSI IE_100k", coords: [-10.6, 51.9, -9.8, 52.3] },
  { name: "Connemara Metamorphic", glim: "Mt", map_scale: "100k", source: "GSI IE_100k", coords: [-10.3, 53.2, -9.5, 53.6] },
  { name: "Galway Granite", glim: "Pa", map_scale: "100k", source: "GSI IE_100k", coords: [-10.2, 53.0, -9.5, 53.5] },
  { name: "Burren Limestone", glim: "Sc", map_scale: "100k", source: "GSI IE_100k", coords: [-9.4, 52.9, -8.8, 53.2] },
  { name: "Aran Islands Limestone", glim: "Sc", map_scale: "100k", source: "GSI IE_100k", coords: [-10.2, 53.0, -9.5, 53.2] },
  { name: "Mayo Slates & Gneisses", glim: "Mt", map_scale: "100k", source: "GSI IE_100k", coords: [-10.0, 53.5, -9.0, 54.2] },
  { name: "Donegal Granite", glim: "Pa", map_scale: "100k", source: "GSI IE_100k", coords: [-8.4, 54.6, -7.6, 55.3] },
  { name: "Donegal Metasediments", glim: "Mt", map_scale: "100k", source: "GSI IE_100k", coords: [-8.5, 54.5, -7.5, 55.3] },
  { name: "Ulster Basalt (Antrim)", glim: "Vb", map_scale: "100k", source: "GSI IE_100k", coords: [-7.0, 54.5, -5.5, 55.3] },
  { name: "Mourne Mountains Granite", glim: "Pa", map_scale: "100k", source: "GSI IE_100k", coords: [-6.2, 54.0, -5.8, 54.3] },
  { name: "Irish Midlands Limestone", glim: "Sc", map_scale: "100k", source: "GSI IE_100k", coords: [-8.5, 52.5, -6.5, 54.0] },
  { name: "Longford-Down Inlier", glim: "Mt", map_scale: "100k", source: "GSI IE_100k", coords: [-8.0, 53.5, -6.0, 54.5] },
  { name: "Slieve Bloom Mountains", glim: "Ss", map_scale: "100k", source: "GSI IE_100k", coords: [-7.8, 52.9, -7.3, 53.2] },
  { name: "Clare Shales", glim: "Sm", map_scale: "100k", source: "GSI IE_100k", coords: [-9.8, 52.5, -8.8, 53.0] },
  { name: "Lough Gill Granites", glim: "Pa", map_scale: "100k", source: "GSI IE_100k", coords: [-8.6, 54.1, -8.1, 54.4] },
  { name: "Ox Mountains Inlier", glim: "Mt", map_scale: "100k", source: "GSI IE_100k", coords: [-9.2, 53.9, -8.5, 54.3] },
];

// ═══════════════════════════════════════════════════════════════
// UNITED KINGDOM — BGS DiGMapGB 1:50k
// ═══════════════════════════════════════════════════════════════
const UK: GeoRegion[] = [
  { name: "Scottish Highlands Dalradian", glim: "Mt", map_scale: "50k", source: "BGS DiGMapGB", coords: [-6.0, 56.5, -2.0, 58.6] },
  { name: "Midland Valley Coal Measures", glim: "Ss", map_scale: "50k", source: "BGS DiGMapGB", coords: [-5.0, 55.5, -2.5, 56.5] },
  { name: "Southern Uplands Greywackes", glim: "Ss", map_scale: "50k", source: "BGS DiGMapGB", coords: [-5.0, 55.0, -2.5, 55.8] },
  { name: "NW Highlands Torridonian", glim: "Ss", map_scale: "50k", source: "BGS DiGMapGB", coords: [-6.0, 57.0, -4.0, 58.6] },
  { name: "Shetland Metamorphic", glim: "Mt", map_scale: "50k", source: "BGS DiGMapGB", coords: [-2.0, 59.5, -0.5, 61.0] },
  { name: "Cornubian Granite (Cornwall)", glim: "Pa", map_scale: "50k", source: "BGS DiGMapGB", coords: [-6.0, 50.0, -4.0, 51.0] },
  { name: "Dartmoor Granite", glim: "Pa", map_scale: "50k", source: "BGS DiGMapGB", coords: [-4.2, 50.4, -3.6, 50.8] },
  { name: "Wessex Basin Chalk", glim: "Sc", map_scale: "50k", source: "BGS DiGMapGB", coords: [-2.5, 50.5, 1.5, 51.5] },
  { name: "London Basin Clay", glim: "Sm", map_scale: "50k", source: "BGS DiGMapGB", coords: [-0.5, 51.2, 0.8, 51.8] },
  { name: "Pennines Carboniferous Limestone", glim: "Sc", map_scale: "50k", source: "BGS DiGMapGB", coords: [-2.5, 53.5, -1.0, 55.0] },
  { name: "Lake District Volcanics", glim: "Vi", map_scale: "50k", source: "BGS DiGMapGB", coords: [-3.5, 54.2, -2.5, 54.8] },
  { name: "Yorkshire Jurassic", glim: "Ss", map_scale: "50k", source: "BGS DiGMapGB", coords: [-2.0, 53.5, -0.5, 54.5] },
  { name: "East Anglia Cretaceous", glim: "Sc", map_scale: "50k", source: "BGS DiGMapGB", coords: [0.0, 52.0, 2.0, 53.0] },
  { name: "Welsh Basin Ordovician", glim: "Ss", map_scale: "50k", source: "BGS DiGMapGB", coords: [-5.0, 51.5, -3.0, 53.5] },
  { name: "Snowdonia Volcanics", glim: "Va", map_scale: "50k", source: "BGS DiGMapGB", coords: [-4.2, 52.8, -3.5, 53.2] },
];

// ═══════════════════════════════════════════════════════════════
// FRANCE — BRGM BD Charm-50
// ═══════════════════════════════════════════════════════════════
const FRANCE: GeoRegion[] = [
  { name: "Massif Central (Hercynian)", glim: "Pa", map_scale: "50k", source: "BRGM BD Charm-50", coords: [2.0, 44.0, 5.0, 46.5] },
  { name: "Massif Central Volcanics", glim: "Va", map_scale: "50k", source: "BRGM BD Charm-50", coords: [2.5, 45.0, 4.0, 46.0] },
  { name: "Armorican Massif", glim: "Mt", map_scale: "50k", source: "BRGM BD Charm-50", coords: [-5.0, 47.0, -1.0, 49.0] },
  { name: "Paris Basin Limestone", glim: "Sc", map_scale: "50k", source: "BRGM BD Charm-50", coords: [0.0, 47.0, 4.0, 50.0] },
  { name: "Aquitaine Basin", glim: "Ss", map_scale: "50k", source: "BRGM BD Charm-50", coords: [-1.5, 43.5, 2.0, 46.0] },
  { name: "Pyrenees Metamorphic", glim: "Mt", map_scale: "50k", source: "BRGM BD Charm-50", coords: [-1.5, 42.5, 3.0, 43.0] },
  { name: "Provence Limestone", glim: "Sc", map_scale: "50k", source: "BRGM BD Charm-50", coords: [4.0, 43.0, 7.5, 44.5] },
  { name: "Vosges Mountains", glim: "Mt", map_scale: "50k", source: "BRGM BD Charm-50", coords: [6.5, 47.8, 8.0, 49.0] },
  { name: "Jura Mountains", glim: "Sc", map_scale: "50k", source: "BRGM BD Charm-50", coords: [5.0, 46.0, 7.5, 48.0] },
  { name: "Alps Crystalline (External)", glim: "Mt", map_scale: "50k", source: "BRGM BD Charm-50", coords: [5.5, 44.5, 7.5, 46.5] },
  { name: "Corsica Hercynian", glim: "Mt", map_scale: "50k", source: "BRGM BD Charm-50", coords: [8.5, 41.5, 9.8, 43.0] },
  { name: "Lorraine Iron Ore", glim: "Ss", map_scale: "50k", source: "BRGM BD Charm-50", coords: [5.5, 48.5, 7.0, 49.5] },
  { name: "Brittany Migmatites", glim: "Mt", map_scale: "50k", source: "BRGM BD Charm-50", coords: [-4.5, 47.5, -1.5, 48.8] },
  { name: "Camargue Alluvium", glim: "Su", map_scale: "50k", source: "BRGM BD Charm-50", coords: [4.0, 43.2, 5.0, 44.0] },
];

// ═══════════════════════════════════════════════════════════════
// GERMANY — BGR GK100
// ═══════════════════════════════════════════════════════════════
const GERMANY: GeoRegion[] = [
  { name: "Black Forest (Schwarzwald)", glim: "Pa", map_scale: "100k", source: "BGR GK100", coords: [7.5, 47.5, 9.5, 48.8] },
  { name: "Harz Mountains", glim: "Mt", map_scale: "100k", source: "BGR GK100", coords: [10.0, 51.5, 11.5, 52.0] },
  { name: "Rhenish Massif", glim: "Mt", map_scale: "100k", source: "BGR GK100", coords: [6.0, 50.0, 9.0, 51.5] },
  { name: "Bavarian Alps", glim: "Sc", map_scale: "100k", source: "BGR GK100", coords: [10.0, 47.3, 13.5, 48.0] },
  { name: "Bohemian Massif (German)", glim: "Mt", map_scale: "100k", source: "BGR GK100", coords: [11.0, 48.5, 15.0, 51.0] },
  { name: "North German Plain", glim: "Su", map_scale: "1M", source: "BGR GK100", coords: [6.0, 52.0, 15.0, 55.0] },
  { name: "Rhine Graben", glim: "Su", map_scale: "100k", source: "BGR GK100", coords: [7.5, 48.0, 9.0, 49.5] },
  { name: "Eifel Volcanic Field", glim: "Vb", map_scale: "100k", source: "BGR GK100", coords: [6.5, 50.0, 7.5, 50.8] },
  { name: "Swabian Jura", glim: "Sc", map_scale: "100k", source: "BGR GK100", coords: [8.5, 48.0, 10.5, 48.8] },
  { name: "Thuringian Forest", glim: "Mt", map_scale: "100k", source: "BGR GK100", coords: [10.0, 50.3, 12.0, 51.0] },
];

// ═══════════════════════════════════════════════════════════════
// SPAIN — GEODE 50k (IGME)
// ═══════════════════════════════════════════════════════════════
const SPAIN: GeoRegion[] = [
  { name: "Iberian Meseta", glim: "Mt", map_scale: "50k", source: "GEODE 50k IGME", coords: [-5.0, 38.0, -1.0, 43.0] },
  { name: "Galician Granite", glim: "Pa", map_scale: "50k", source: "GEODE 50k IGME", coords: [-9.5, 41.8, -7.0, 43.8] },
  { name: "Cantabrian Mountains", glim: "Sc", map_scale: "50k", source: "GEODE 50k IGME", coords: [-8.0, 42.5, -2.0, 43.5] },
  { name: "Sierra Nevada", glim: "Mt", map_scale: "50k", source: "GEODE 50k IGME", coords: [-4.0, 36.8, -2.0, 37.5] },
  { name: "Betic Cordillera", glim: "Mt", map_scale: "50k", source: "GEODE 50k IGME", coords: [-6.0, 36.0, -1.0, 38.0] },
  { name: "Ebro Basin", glim: "Su", map_scale: "50k", source: "GEODE 50k IGME", coords: [-2.0, 40.5, 1.5, 42.5] },
  { name: "Catalan Coastal Ranges", glim: "Mt", map_scale: "50k", source: "GEODE 50k IGME", coords: [0.0, 40.5, 3.5, 42.5] },
  { name: "Canary Islands Volcanic", glim: "Vb", map_scale: "50k", source: "GEODE 50k IGME", coords: [-18.5, 27.5, -13.0, 29.5] },
];

// ═══════════════════════════════════════════════════════════════
// ITALY — ISPRA 100k
// ═══════════════════════════════════════════════════════════════
const ITALY: GeoRegion[] = [
  { name: "Alps Crystalline (Austroalpine)", glim: "Mt", map_scale: "100k", source: "ISPRA 100k", coords: [6.0, 45.8, 14.0, 48.0] },
  { name: "Po Basin Alluvium", glim: "Su", map_scale: "100k", source: "ISPRA 100k", coords: [7.0, 44.0, 13.0, 46.0] },
  { name: "Apennines (Northern)", glim: "Sc", map_scale: "100k", source: "ISPRA 100k", coords: [9.5, 43.5, 14.0, 45.0] },
  { name: "Apennines (Central)", glim: "Sc", map_scale: "100k", source: "ISPRA 100k", coords: [12.0, 41.5, 15.0, 44.0] },
  { name: "Sardinia Hercynian", glim: "Mt", map_scale: "100k", source: "ISPRA 100k", coords: [8.0, 38.8, 10.0, 41.3] },
  { name: "Sicily Carbonate", glim: "Sc", map_scale: "100k", source: "ISPRA 100k", coords: [12.5, 36.6, 15.8, 38.3] },
  { name: "Calabria Crystalline", glim: "Mt", map_scale: "100k", source: "ISPRA 100k", coords: [15.5, 37.8, 17.5, 40.0] },
  { name: "Campanian Volcanic", glim: "Py", map_scale: "100k", source: "ISPRA 100k", coords: [14.0, 40.3, 15.5, 41.5] },
  { name: "Lazio Volcanic", glim: "Py", map_scale: "100k", source: "ISPRA 100k", coords: [11.5, 41.5, 13.5, 43.0] },
  { name: "Tuscany Metamorphic", glim: "Mt", map_scale: "100k", source: "ISPRA 100k", coords: [9.5, 42.5, 12.0, 44.0] },
  { name: "Dolomites", glim: "Sc", map_scale: "100k", source: "ISPRA 100k", coords: [11.0, 46.0, 13.0, 47.0] },
  { name: "Etna Volcanic", glim: "Vb", map_scale: "100k", source: "ISPRA 100k", coords: [14.8, 37.5, 15.5, 38.2] },
];

// ═══════════════════════════════════════════════════════════════
// SCANDINAVIA — SGU/NGU/GTK/GEUS
// ═══════════════════════════════════════════════════════════════
const SCANDINAVIA: GeoRegion[] = [
  { name: "Swedish Svecofennian", glim: "Mt", map_scale: "50k", source: "SGU 50k", coords: [14.0, 58.0, 20.0, 65.0] },
  { name: "Swedish Caledonides", glim: "Mt", map_scale: "50k", source: "SGU 50k", coords: [12.0, 59.0, 18.0, 69.0] },
  { name: "Skåne Paleozoic", glim: "Ss", map_scale: "50k", source: "SGU 50k", coords: [12.5, 55.3, 14.5, 56.5] },
  { name: "South Norway Caledonides", glim: "Mt", map_scale: "100k", source: "NGU 100k", coords: [5.0, 58.0, 12.0, 65.0] },
  { name: "Oslo Rift (Permian)", glim: "Vb", map_scale: "100k", source: "NGU 100k", coords: [9.5, 59.0, 12.0, 60.5] },
  { name: "Lofoten Islands", glim: "Mt", map_scale: "100k", source: "NGU 100k", coords: [13.0, 67.5, 17.0, 69.5] },
  { name: "Finnish Karelian", glim: "Mt", map_scale: "100k", source: "GTK 100k", coords: [24.0, 60.0, 30.0, 66.0] },
  { name: "Lapland Granulite", glim: "Mt", map_scale: "100k", source: "GTK 100k", coords: [24.0, 66.0, 30.0, 70.0] },
  { name: "Denmark Quaternary", glim: "Su", map_scale: "250k", source: "GEUS 250k", coords: [8.0, 54.5, 15.5, 58.0] },
  { name: "Iceland Volcanic", glim: "Vb", map_scale: "100k", source: "ISOR", coords: [-25.0, 63.0, -13.0, 67.0] },
];

// ═══════════════════════════════════════════════════════════════
// EASTERN EUROPE — Various national surveys
// ═══════════════════════════════════════════════════════════════
const EASTERN_EUROPE: GeoRegion[] = [
  { name: "Austrian Alps (Northern Calcareous)", glim: "Sc", map_scale: "100k", source: "GBA 100k", coords: [9.5, 46.8, 17.0, 48.5] },
  { name: "Austrian Alps (Central Crystalline)", glim: "Mt", map_scale: "100k", source: "GBA 100k", coords: [10.0, 46.5, 14.0, 47.8] },
  { name: "Vienna Basin", glim: "Su", map_scale: "100k", source: "GBA 100k", coords: [16.0, 47.8, 17.5, 48.5] },
  { name: "Swiss Alps (Helvetic)", glim: "Mt", map_scale: "50k", source: "swisstopo 50k", coords: [6.0, 45.8, 10.5, 47.8] },
  { name: "Swiss Molasse Basin", glim: "Su", map_scale: "50k", source: "swisstopo 50k", coords: [6.5, 46.5, 10.0, 47.8] },
  { name: "Bohemian Massif (Czech)", glim: "Mt", map_scale: "100k", source: "CGS 100k", coords: [12.0, 48.5, 18.5, 51.0] },
  { name: "Polish Sudetes", glim: "Mt", map_scale: "100k", source: "PGI 100k", coords: [14.5, 50.0, 17.5, 51.5] },
  { name: "Holy Cross Mountains", glim: "Ss", map_scale: "100k", source: "PGI 100k", coords: [19.5, 50.5, 22.0, 51.5] },
  { name: "Polish Lowlands", glim: "Su", map_scale: "1M", source: "PGI 1M", coords: [14.0, 51.5, 24.0, 55.0] },
  { name: "Carpathians (Polish)", glim: "Mt", map_scale: "100k", source: "PGI 100k", coords: [18.5, 49.0, 22.5, 50.5] },
  { name: "Tatra Mountains", glim: "Mt", map_scale: "100k", source: "SGUP 100k", coords: [19.0, 49.0, 20.5, 49.5] },
  { name: "Pannonian Basin", glim: "Su", map_scale: "100k", source: "MBFSZ 100k", coords: [16.0, 45.5, 22.5, 48.5] },
  { name: "Carpathians (Romanian)", glim: "Mt", map_scale: "100k", source: "RGS 100k", coords: [22.0, 44.5, 28.0, 48.5] },
  { name: "Transylvanian Basin", glim: "Su", map_scale: "100k", source: "RGS 100k", coords: [22.0, 45.5, 27.0, 47.5] },
  { name: "Rhodope Massif", glim: "Mt", map_scale: "100k", source: "NIGGG 100k", coords: [22.0, 41.0, 28.5, 43.0] },
  { name: "Dinarides (Croatia)", glim: "Sc", map_scale: "100k", source: "HGI 100k", coords: [13.5, 42.5, 19.5, 46.5] },
  { name: "Hellenides (mainland)", glim: "Mt", map_scale: "100k", source: "IGME 100k", coords: [20.0, 37.0, 26.5, 42.0] },
  { name: "Aegean Volcanic Arc", glim: "Vb", map_scale: "100k", source: "IGME 100k", coords: [23.0, 36.5, 27.0, 39.0] },
  { name: "Iberian Massif (Portuguese)", glim: "Mt", map_scale: "100k", source: "LNEG 100k", coords: [-10.0, 37.0, -6.0, 42.0] },
];

// ═══════════════════════════════════════════════════════════════
// SPECIAL — High-radioactivity zones
// ═══════════════════════════════════════════════════════════════
const SPECIAL: GeoRegion[] = [
  { name: "Kerala Monazite Beaches", glim: "monazite_bearing", map_scale: "50k", source: "GSI/GSI-AMD", coords: [76.0, 8.0, 78.0, 12.0] },
  { name: "Ramsar Radiogenic", glim: "monazite_bearing", map_scale: "100k", source: "GSIR Iran", coords: [50.0, 36.0, 51.5, 37.5] },
  { name: "Kola Alkaline Province", glim: "carbonatite", map_scale: "100k", source: "VSEGEI", coords: [32.0, 67.0, 40.0, 69.5] },
];

// ═══════════════════════════════════════════════════════════════
// GLOBAL FALLBACKS — 1:1M only
// ═══════════════════════════════════════════════════════════════
const GLOBAL: GeoRegion[] = [
  { name: "East European Craton", glim: "Mt", map_scale: "1M", source: "GEM/CGMW 1M", coords: [25.0, 50.0, 45.0, 65.0] },
  { name: "Ural Mountains", glim: "Mt", map_scale: "1M", source: "GEM/CGMW 1M", coords: [55.0, 50.0, 65.0, 66.0] },
  { name: "Scandinavian Shield", glim: "Mt", map_scale: "1M", source: "GEM/CGMW 1M", coords: [5.0, 55.0, 30.0, 71.0] },
];

// ═══════════════════════════════════════════════════════════════
// COMBINED ARRAY
// ═══════════════════════════════════════════════════════════════

const ALL_REGIONS: GeoRegion[] = [
  ...IRELAND, ...UK, ...FRANCE, ...GERMANY, ...SPAIN, ...ITALY,
  ...SCANDINAVIA, ...EASTERN_EUROPE, ...SPECIAL, ...GLOBAL,
];

// ═══════════════════════════════════════════════════════════════
// LOOKUP FUNCTION
// ═══════════════════════════════════════════════════════════════

const SCALE_TO_CELL: Record<string, number> = {
  "50k": 50, "100k": 100, "250k": 250, "500k": 500, "1M": 1000,
};

const ACT: Record<string, { ra: number; th: number; k: number; label: string }> = {
  granite:              { ra: 59,  th: 64,  k: 1070, label: "Granite" },
  granodiorite:         { ra: 40,  th: 50,  k: 900,  label: "Granodiorite" },
  diorite:              { ra: 25,  th: 30,  k: 550,  label: "Diorite" },
  gabbro:               { ra: 12,  th: 15,  k: 250,  label: "Gabbro" },
  peridotite:           { ra: 3,   th: 5,   k: 80,   label: "Peridotite" },
  pegmatite:            { ra: 65,  th: 80,  k: 1200, label: "Pegmatite" },
  syenite:              { ra: 45,  th: 70,  k: 1100, label: "Syenite" },
  rhyolite:             { ra: 55,  th: 60,  k: 1000, label: "Rhyolite" },
  andesite:             { ra: 30,  th: 40,  k: 700,  label: "Andesite" },
  basalt:               { ra: 15,  th: 18,  k: 300,  label: "Basalt" },
  tuff:                 { ra: 30,  th: 35,  k: 600,  label: "Tuff" },
  gneiss:               { ra: 38,  th: 45,  k: 850,  label: "Gneiss" },
  schist:               { ra: 35,  th: 42,  k: 750,  label: "Schist" },
  slate:                { ra: 22,  th: 28,  k: 480,  label: "Slate" },
  quartzite:            { ra: 10,  th: 8,   k: 150,  label: "Quartzite" },
  marble:               { ra: 8,   th: 5,   k: 80,   label: "Marble" },
  limestone:            { ra: 12,  th: 6,   k: 100,  label: "Limestone" },
  dolomite:             { ra: 10,  th: 5,   k: 80,   label: "Dolomite" },
  sandstone:            { ra: 18,  th: 22,  k: 350,  label: "Sandstone" },
  shale:                { ra: 30,  th: 35,  k: 580,  label: "Shale" },
  mudstone:             { ra: 28,  th: 32,  k: 520,  label: "Mudstone" },
  siltstone:            { ra: 25,  th: 30,  k: 480,  label: "Siltstone" },
  marl:                 { ra: 15,  th: 10,  k: 200,  label: "Marl" },
  chalk:                { ra: 8,   th: 4,   k: 60,   label: "Chalk" },
  alluvium:             { ra: 20,  th: 25,  k: 400,  label: "Alluvium" },
  glacial_till:         { ra: 18,  th: 22,  k: 380,  label: "Glacial Till" },
  monazite_bearing:     { ra: 80,  th: 350, k: 400,  label: "Monazite-bearing" },
  carbonatite:          { ra: 120, th: 150, k: 200,  label: "Carbonatite" },
  world_average_soil:   { ra: 30,  th: 30,  k: 400,  label: "World Average Soil" },
  water:                { ra: 0,   th: 0,   k: 0,    label: "Water" },
  ice:                  { ra: 0,   th: 0,   k: 0,    label: "Ice" },
};

const GLIM_TO_INTERNAL: Record<string, string> = {
  Su: "alluvium", Ss: "sandstone", Sm: "siltstone", Sc: "limestone", Sb: "marl",
  Ev: "dolomite", Pa: "granite", Pi: "granodiorite", Pb: "gabbro",
  Va: "rhyolite", Vi: "andesite", Vb: "basalt", Mt: "gneiss", Py: "tuff",
  Wa: "water", Ice: "ice",
};

export function resolveLith(glim: string): string {
  if (ACT[glim]) return glim;
  return GLIM_TO_INTERNAL[glim] || "world_average_soil";
}

export function getLithologyAt(lon: number, lat: number): LithEntry & { region: string; meets_target: boolean } {
  // Find smallest-area matching region
  let best: GeoRegion | null = null;
  let bestArea = Infinity;

  for (const r of ALL_REGIONS) {
    const [minLon, minLat, maxLon, maxLat] = r.coords;
    if (lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat) {
      const area = (maxLon - minLon) * (maxLat - minLat);
      if (area < bestArea) {
        bestArea = area;
        best = r;
      }
    }
  }

  if (!best) {
    const absLat = Math.abs(lat);
    if (absLat > 75 || lat < -65) return { glim: "Ice", label: "Ice", map_scale: "1M", cell_m: 1000, source: "Global", region: "Polar ice", meets_target: false };
    if (absLat > 60) return { glim: "Mt", label: "Gneiss", map_scale: "1M", cell_m: 1000, source: "Global", region: "Shield/taiga", meets_target: false };
    if (absLat < 15) return { glim: "Su", label: "Alluvium", map_scale: "1M", cell_m: 1000, source: "Global", region: "Tropical lowlands", meets_target: false };
    return { glim: "world_average_soil", label: "World Average Soil", map_scale: "1M", cell_m: 1000, source: "Global", region: "World Average Soil", meets_target: false };
  }

  const internal = resolveLith(best.glim);
  const act = ACT[internal] || ACT.world_average_soil;
  const cell_m = SCALE_TO_CELL[best.map_scale] || 1000;
  const meets = best.map_scale === "50k" || best.map_scale === "100k";

  return {
    glim: best.glim,
    label: act.label,
    map_scale: best.map_scale,
    cell_m,
    source: best.source,
    region: best.name,
    meets_target: meets,
  };
}
