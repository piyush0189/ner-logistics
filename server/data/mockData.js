// Mock data representing the NER road/logistics network.
// Coordinates are approximate real-world locations for demo purposes.

export const districts = [
  { id: "GHY", name: "Guwahati", state: "Assam", lat: 26.1445, lng: 91.7362, tier: "hub" },
  { id: "DIB", name: "Dibrugarh", state: "Assam", lat: 27.4728, lng: 94.912, tier: "district" },
  { id: "SIL", name: "Silchar", state: "Assam", lat: 24.8333, lng: 92.7789, tier: "district" },
  { id: "SHL", name: "Shillong", state: "Meghalaya", lat: 25.5788, lng: 91.8933, tier: "district" },
  { id: "TUR", name: "Tura", state: "Meghalaya", lat: 25.5144, lng: 90.2028, tier: "district" },
  { id: "AIZ", name: "Aizawl", state: "Mizoram", lat: 23.7271, lng: 92.7176, tier: "district" },
  { id: "LUN", name: "Lunglei", state: "Mizoram", lat: 22.8879, lng: 92.7357, tier: "remote" },
  { id: "IMP", name: "Imphal", state: "Manipur", lat: 24.817, lng: 93.9368, tier: "district" },
  { id: "CCP", name: "Churachandpur", state: "Manipur", lat: 24.3333, lng: 93.6833, tier: "remote" },
  { id: "KOH", name: "Kohima", state: "Nagaland", lat: 25.6751, lng: 94.1086, tier: "district" },
  { id: "MOK", name: "Mokokchung", state: "Nagaland", lat: 26.3236, lng: 94.5297, tier: "remote" },
  { id: "AGT", name: "Agartala", state: "Tripura", lat: 23.8315, lng: 91.2868, tier: "district" },
  { id: "ITA", name: "Itanagar", state: "Arunachal Pradesh", lat: 27.0844, lng: 93.6053, tier: "district" },
  { id: "TAW", name: "Tawang", state: "Arunachal Pradesh", lat: 27.5859, lng: 91.8594, tier: "remote" },
  { id: "GTK", name: "Gangtok", state: "Sikkim", lat: 27.3389, lng: 88.6065, tier: "district" },
];

// Road network as a graph. Each road connects two district ids.
// terrainRisk (0-1): structural exposure to landslides/floods based on terrain.
// baseIncidents: historical disruption count used by the prediction model.
export const roads = [
  { id: "R1", from: "GHY", to: "SHL", name: "NH-6", lengthKm: 100, terrainRisk: 0.35, baseIncidents: 12 },
  { id: "R2", from: "SHL", to: "TUR", name: "SH-5", lengthKm: 150, terrainRisk: 0.5, baseIncidents: 18 },
  { id: "R3", from: "GHY", to: "DIB", name: "NH-27", lengthKm: 440, terrainRisk: 0.3, baseIncidents: 9 },
  { id: "R4", from: "GHY", to: "SIL", name: "NH-6/NH-306", lengthKm: 320, terrainRisk: 0.55, baseIncidents: 21 },
  { id: "R5", from: "SIL", to: "AIZ", name: "NH-306", lengthKm: 180, terrainRisk: 0.7, baseIncidents: 27 },
  { id: "R6", from: "AIZ", to: "LUN", name: "SH-2", lengthKm: 110, terrainRisk: 0.75, baseIncidents: 24 },
  { id: "R7", from: "SIL", to: "IMP", name: "NH-37", lengthKm: 260, terrainRisk: 0.65, baseIncidents: 22 },
  { id: "R8", from: "IMP", to: "CCP", name: "NH-2", lengthKm: 65, terrainRisk: 0.6, baseIncidents: 16 },
  { id: "R9", from: "IMP", to: "KOH", name: "NH-2", lengthKm: 140, terrainRisk: 0.55, baseIncidents: 15 },
  { id: "R10", from: "KOH", to: "MOK", name: "SH-1", lengthKm: 95, terrainRisk: 0.45, baseIncidents: 11 },
  { id: "R11", from: "KOH", to: "DIB", name: "NH-29", lengthKm: 260, terrainRisk: 0.5, baseIncidents: 14 },
  { id: "R12", from: "GHY", to: "AGT", name: "NH-27/NH-8", lengthKm: 590, terrainRisk: 0.4, baseIncidents: 13 },
  { id: "R13", from: "GHY", to: "ITA", name: "NH-415", lengthKm: 310, terrainRisk: 0.6, baseIncidents: 19 },
  { id: "R14", from: "ITA", to: "TAW", name: "NH-13", lengthKm: 320, terrainRisk: 0.85, baseIncidents: 31 },
  { id: "R15", from: "GHY", to: "GTK", name: "NH-10 (via WB)", lengthKm: 400, terrainRisk: 0.55, baseIncidents: 17 },
  { id: "R16", from: "DIB", to: "ITA", name: "NH-415", lengthKm: 220, terrainRisk: 0.5, baseIncidents: 12 },
];

// In-memory vehicle fleet. progress is 0-1 along the current road.
export const vehicles = [
  { id: "V-101", cargo: "Medicines", roadId: "R5", direction: "forward", progress: 0.62, originId: "SIL", destId: "AIZ", status: "moving" },
  { id: "V-102", cargo: "Food Supplies", roadId: "R2", direction: "forward", progress: 0.3, originId: "SHL", destId: "TUR", status: "moving" },
  { id: "V-103", cargo: "Construction Materials", roadId: "R14", direction: "forward", progress: 0.15, originId: "ITA", destId: "TAW", status: "delayed" },
  { id: "V-104", cargo: "Agricultural Produce", roadId: "R9", direction: "reverse", progress: 0.5, originId: "KOH", destId: "IMP", status: "moving" },
  { id: "V-105", cargo: "Medicines", roadId: "R11", direction: "forward", progress: 0.8, originId: "KOH", destId: "DIB", status: "moving" },
  { id: "V-106", cargo: "Food Supplies", roadId: "R8", direction: "forward", progress: 0.4, originId: "IMP", destId: "CCP", status: "moving" },
];

// Seed field reports uploaded by local officials.
export const fieldReports = [
  {
    id: "FR-1001",
    roadId: "R6",
    districtId: "LUN",
    officer: "B. Lalramliana",
    note: "Landslide debris covering half the carriageway near Thenzawl bend. Single-lane traffic only.",
    lat: 23.05,
    lng: 92.73,
    severity: "high",
    timestamp: Date.now() - 1000 * 60 * 40,
  },
  {
    id: "FR-1002",
    roadId: "R14",
    districtId: "TAW",
    officer: "P. Nyema",
    note: "Sela Pass approach clear but expecting fresh snowfall by evening.",
    lat: 27.75,
    lng: 92.1,
    severity: "medium",
    timestamp: Date.now() - 1000 * 60 * 120,
  },
];
